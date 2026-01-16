import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Message } from '@/types/chat'

interface UseRealtimeChatOptions {
  conversationId: string | null
  currentUserId: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onMessageDelete?: (messageId: string) => void
  onConnectionChange?: (connected: boolean) => void
}

interface UseRealtimeChatReturn {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  error: Error | null
}

/**
 * Optimized hook for realtime chat with:
 * - Automatic reconnection
 * - Error handling and retry logic
 * - Connection status monitoring
 * - Memory leak prevention
 * - Sender info caching
 */
export function useRealtimeChat({
  conversationId,
  currentUserId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onConnectionChange,
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isUnmountingRef = useRef(false)
  const senderInfoCacheRef = useRef<Map<string, string>>(new Map())
  
  const MAX_RETRY_ATTEMPTS = 5
  const RETRY_DELAY_BASE = 1000 // 1 second
  const MAX_RETRY_DELAY = 30000 // 30 seconds

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
      } catch (err) {
        console.error('Error cleaning up channel:', err)
      }
      channelRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  // Enrich message with sender info (with caching)
  const enrichMessageWithSender = useCallback(async (message: Message) => {
    // Check cache first
    const cachedName = senderInfoCacheRef.current.get(message.sender_id)
    if (cachedName) {
      return { ...message, sender_name: cachedName }
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', message.sender_id)
        .maybeSingle()

      if (userError) throw userError

      const senderName = userData?.full_name || 'Unknown'
      
      // Cache the result
      senderInfoCacheRef.current.set(message.sender_id, senderName)
      
      return { ...message, sender_name: senderName }
    } catch (err) {
      console.error('Error enriching message with sender info:', err)
      return { ...message, sender_name: 'Unknown' }
    }
  }, [])

  // Handle broadcast message - Optimized for performance
  const handleBroadcastMessage = useCallback(async (
    payload: any,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  ) => {
    const startTime = performance.now()
    
    try {
      // Fast path: Extract message data immediately
      // realtime.broadcast_changes() structure: payload.payload = { record, old_record, operation, table, schema }
      let messageData: any = null
      
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        messageData = payload.payload?.record || payload.record || payload.payload || payload
      } else if (eventType === 'DELETE') {
        messageData = payload.payload?.old_record || payload.old_record || payload.payload || payload
      }

      if (!messageData) {
        console.warn(`⚠️ No messageData found for ${eventType} broadcast`)
        return
      }

      // Quick validation - only check essential fields
      if (!messageData.conversation_id && !messageData.sender_id) {
        return // Skip invalid data silently for performance
      }
      
      // Verify conversation match (fast check)
      if (conversationId && messageData.conversation_id && messageData.conversation_id !== conversationId) {
        return // Skip messages from other conversations silently
      }
      
      // For INSERT: Enrich and call callback immediately (don't await if not needed)
      if (eventType === 'INSERT') {
        // Enrich with sender info (async but don't block)
        enrichMessageWithSender(messageData as Message).then(enrichedMessage => {
          onNewMessage?.(enrichedMessage)
          const duration = performance.now() - startTime
          if (duration > 100) {
            console.warn(`⚠️ Slow broadcast handling: ${duration.toFixed(2)}ms`)
          }
        }).catch(err => {
          console.error('Error enriching message:', err)
          // Fallback: call with original message if enrichment fails
          onNewMessage?.(messageData as Message)
        })
      } else if (eventType === 'UPDATE') {
        enrichMessageWithSender(messageData as Message).then(enrichedMessage => {
          onMessageUpdate?.(enrichedMessage)
        }).catch(() => {
          onMessageUpdate?.(messageData as Message)
        })
      } else if (eventType === 'DELETE') {
        onMessageDelete?.(messageData.id)
        const duration = performance.now() - startTime
        if (duration > 100) {
          console.warn(`⚠️ Slow DELETE handling: ${duration.toFixed(2)}ms`)
        }
      }
    } catch (err) {
      console.error(`❌ Error handling ${eventType} broadcast:`, err)
    }
  }, [conversationId, enrichMessageWithSender, onNewMessage, onMessageUpdate, onMessageDelete])

  // Connect to realtime channel
  const connect = useCallback(async () => {
    if (!conversationId || isUnmountingRef.current) return

    // Cleanup existing connection
    cleanup()

    setConnectionStatus('connecting')
    setError(null)

    try {
      // Set auth first
      await supabase.realtime.setAuth()

      if (isUnmountingRef.current) return

      // Create channel
      const channel = supabase.channel(
        `conversation:${conversationId}:messages`,
        {
          config: {
            private: true,
            broadcast: {
              self: true,
              ack: false,
            },
          },
        }
      )

      channelRef.current = channel

      // Setup event handlers
      // Note: realtime.broadcast_changes() sends events with the operation name (INSERT, UPDATE, DELETE)
      // The event name matches the operation (TG_OP) from the trigger
      // IMPORTANT: Listen to ALL broadcast events first (fallback), then specific events
      // This ensures we catch messages even if event name doesn't match exactly
      
      // Listen to ALL broadcast events first (most important - catches everything)
      // Optimized: Process immediately without heavy logging for performance
      channel.on('broadcast', {}, (payload) => {
        const receiveTime = performance.now()
        
        // Fast path: Determine event type from payload structure
        if (payload.payload) {
          const hasRecord = !!payload.payload.record
          const hasOldRecord = !!payload.payload.old_record
          
          if (hasRecord && !hasOldRecord) {
            handleBroadcastMessage(payload, 'INSERT')
          } else if (hasRecord && hasOldRecord) {
            handleBroadcastMessage(payload, 'UPDATE')
          } else if (hasOldRecord && !hasRecord) {
            handleBroadcastMessage(payload, 'DELETE')
          } else if (hasRecord) {
            // Fallback: if we have record, treat as INSERT
            handleBroadcastMessage(payload, 'INSERT')
          }
        } else if (payload.record || payload.id) {
          // If no payload.payload, try direct payload
          handleBroadcastMessage(payload, 'INSERT')
        }
        
        const processTime = performance.now() - receiveTime
        if (processTime > 50) {
          console.warn(`⚠️ Slow broadcast processing: ${processTime.toFixed(2)}ms`)
        }
      })
      
      // Also listen to specific events (in case they work) - Optimized without heavy logging
      channel
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          handleBroadcastMessage(payload, 'INSERT')
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          handleBroadcastMessage(payload, 'UPDATE')
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          handleBroadcastMessage(payload, 'DELETE')
        })
        .subscribe((status, err) => {
          if (isUnmountingRef.current) return

          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setConnectionStatus('connected')
            setError(null)
            retryCountRef.current = 0 // Reset retry count on success
            onConnectionChange?.(true)
            console.log('✅ Realtime chat connected:', conversationId)
            console.log('📡 Channel name:', `conversation:${conversationId}:messages`)
            console.log('🔐 Channel config:', {
              private: true,
              broadcast: { self: true, ack: false }
            })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false)
            setConnectionStatus('error')
            const error = err || new Error(`Connection error: ${status}`)
            setError(error)
            onConnectionChange?.(false)
            console.error('❌ Realtime chat error:', {
              status,
              error: err,
              conversationId,
              channelName: `conversation:${conversationId}:messages`
            })

            // Retry connection
            if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
              retryCountRef.current++
              const delay = Math.min(
                RETRY_DELAY_BASE * Math.pow(2, retryCountRef.current - 1),
                MAX_RETRY_DELAY
              )
              
              console.log(`🔄 Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`)
              
              reconnectTimeoutRef.current = setTimeout(() => {
                if (!isUnmountingRef.current) {
                  connect()
                }
              }, delay)
            } else {
              console.error('❌ Max retry attempts reached. Stopping reconnection.')
              setError(new Error('Failed to connect after multiple attempts'))
            }
          } else {
            setConnectionStatus('disconnected')
            setIsConnected(false)
            onConnectionChange?.(false)
          }
        })
    } catch (err) {
      console.error('Error setting up realtime channel:', err)
      setError(err as Error)
      setConnectionStatus('error')
      onConnectionChange?.(false)

      // Retry on error
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current++
        const delay = Math.min(
          RETRY_DELAY_BASE * Math.pow(2, retryCountRef.current - 1),
          MAX_RETRY_DELAY
        )
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountingRef.current) {
            connect()
          }
        }, delay)
      }
    }
  }, [conversationId, cleanup, handleBroadcastMessage, onConnectionChange])

  // Main effect
  useEffect(() => {
    if (!conversationId) {
      cleanup()
      return
    }

    isUnmountingRef.current = false
    retryCountRef.current = 0

    // Connect
    connect()

    // Cleanup on unmount
    return () => {
      isUnmountingRef.current = true
      cleanup()
    }
  }, [conversationId, connect, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true
      cleanup()
      // Clear cache on unmount to prevent memory leaks
      senderInfoCacheRef.current.clear()
    }
  }, [cleanup])

  return {
    isConnected,
    connectionStatus,
    error,
  }
}

