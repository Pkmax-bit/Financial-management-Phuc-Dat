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
  const presenceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isUnmountingRef = useRef(false)
  const senderInfoCacheRef = useRef<Map<string, string>>(new Map())
  
  const MAX_RETRY_ATTEMPTS = 5
  const RETRY_DELAY_BASE = 1000 // 1 second
  const MAX_RETRY_DELAY = 3000 // 3 seconds (reduced to minimize delay)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (presenceUpdateIntervalRef.current) {
      clearInterval(presenceUpdateIntervalRef.current)
      presenceUpdateIntervalRef.current = null
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
        const broadcastReceiveTime = performance.now()
        const broadcastReceiveTimestamp = Date.now()
        
        // Calculate total delay from message creation to broadcast receive
        let totalDelay = null
        if (messageData.created_at) {
          const messageTime = new Date(messageData.created_at).getTime()
          totalDelay = broadcastReceiveTimestamp - messageTime
        }
        
        // Check if sender_name is already in the payload (from database trigger)
        // If yes, use it directly without enrichment (OPTIMIZATION)
        const hasSenderName = !!(messageData as any).sender_name
        
        if (hasSenderName) {
          // Sender info already included in broadcast - use directly (0ms delay)
          const finalReceiveTime = Date.now()
          let finalDelay = null
          if (messageData.created_at) {
            const messageTime = new Date(messageData.created_at).getTime()
            finalDelay = finalReceiveTime - messageTime
          }
          
          console.log('⏱️ Message Delivery Timing (with sender info):', {
            messageId: messageData.id,
            totalDelay: totalDelay ? `${totalDelay}ms (${(totalDelay/1000).toFixed(2)}s)` : 'unknown',
            finalDelay: finalDelay ? `${finalDelay}ms (${(finalDelay/1000).toFixed(2)}s)` : 'unknown',
            processingTime: '0ms (sender info included)',
            messageCreatedAt: messageData.created_at,
            broadcastReceivedAt: new Date(broadcastReceiveTimestamp).toISOString(),
            finalReceivedAt: new Date(finalReceiveTime).toISOString()
          })
          
          onNewMessage?.(messageData as Message)
        } else {
          // Fallback: Enrich with sender info if not included (backward compatibility)
          enrichMessageWithSender(messageData as Message).then(enrichedMessage => {
            const processingTime = performance.now() - broadcastReceiveTime
            const finalReceiveTime = Date.now()
            
            // Calculate final delay including processing
            let finalDelay = null
            if (enrichedMessage.created_at) {
              const messageTime = new Date(enrichedMessage.created_at).getTime()
              finalDelay = finalReceiveTime - messageTime
            }
            
            console.log('⏱️ Message Delivery Timing (enriched):', {
              messageId: enrichedMessage.id,
              totalDelay: totalDelay ? `${totalDelay}ms (${(totalDelay/1000).toFixed(2)}s)` : 'unknown',
              finalDelay: finalDelay ? `${finalDelay}ms (${(finalDelay/1000).toFixed(2)}s)` : 'unknown',
              processingTime: `${processingTime.toFixed(2)}ms`,
              messageCreatedAt: enrichedMessage.created_at,
              broadcastReceivedAt: new Date(broadcastReceiveTimestamp).toISOString(),
              finalReceivedAt: new Date(finalReceiveTime).toISOString()
            })
            
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
        }
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

      // Create channel with presence to keep connection alive
      // Presence helps prevent tenant from being stopped
      // Aggressive configuration to prevent any shutdown delays
      const channel = supabase.channel(
        `conversation:${conversationId}:messages`,
        {
          config: {
            private: true,
            broadcast: {
              self: true,
              ack: false,
            },
            presence: {
              key: currentUserId,
              // Presence will be updated every 15s via setInterval
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
      
      // Note: We only listen to generic broadcast event above
      // Specific events are handled by the generic listener with fast path detection
      // This prevents duplicate processing and improves performance
        .subscribe((status, err) => {
          if (isUnmountingRef.current) return

          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setConnectionStatus('connected')
            setError(null)
            retryCountRef.current = 0 // Reset retry count on success
            onConnectionChange?.(true)
            
            // Track presence to keep connection alive and prevent tenant from stopping
            // This helps prevent "Stop tenant because of no connected users"
            channel.track({
              userId: currentUserId,
              online: true,
              lastSeen: new Date().toISOString()
            })
            
            // Very aggressive presence update to keep connection alive (every 5 seconds)
            // Supabase tenant may shutdown after 20-30s of inactivity
            // Reduced to 5s to absolutely prevent any shutdown delays
            if (presenceUpdateIntervalRef.current) {
              clearInterval(presenceUpdateIntervalRef.current)
            }
            presenceUpdateIntervalRef.current = setInterval(() => {
              if (channelRef.current && !isUnmountingRef.current) {
                // Update presence to keep connection alive
                channelRef.current.track({
                  userId: currentUserId,
                  online: true,
                  lastSeen: new Date().toISOString()
                })
                
                // Also send a lightweight ping broadcast to ensure connection is active
                // This double-checks that the connection is truly alive
                try {
                  channelRef.current.send({
                    type: 'broadcast',
                    event: 'ping',
                    payload: { 
                      userId: currentUserId, 
                      timestamp: Date.now(),
                      keepAlive: true 
                    }
                  })
                } catch (err) {
                  // Ignore ping errors, presence update is more important
                  console.warn('⚠️ Ping broadcast failed:', err)
                }
                
                console.log('🔄 Presence + ping updated (every 5s to prevent delays)')
              } else {
                if (presenceUpdateIntervalRef.current) {
                  clearInterval(presenceUpdateIntervalRef.current)
                  presenceUpdateIntervalRef.current = null
                }
              }
            }, 5000) // Update every 5 seconds (very aggressive to prevent any shutdown)
            
            console.log('✅ Realtime chat connected:', conversationId)
            console.log('📡 Channel name:', `conversation:${conversationId}:messages`)
            console.log('🔐 Channel config:', {
              private: true,
              broadcast: { self: true, ack: false },
              presence: { key: currentUserId }
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

