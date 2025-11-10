/**
 * Notifications API Service
 * Handles all notification-related API calls
 */

import { apiClient } from './client'

// Types
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  entity_type?: string
  entity_id?: string
  read: boolean
  is_read?: boolean // Alias for read
  read_at?: string
  action_url?: string
  created_at: string
}

export interface NotificationCreate {
  user_id: string
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  entity_type?: string
  entity_id?: string
  action_url?: string
}

export interface NotificationUpdate {
  read?: boolean
  is_read?: boolean
}

interface GetNotificationsParams {
  skip?: number
  limit?: number
  is_read?: boolean
  type?: string
  entity_type?: string
  entity_id?: string
}

/**
 * Notifications API Service
 */
export const notificationsApi = {
  /**
   * Get all notifications with optional filtering
   */
  getNotifications: (params?: GetNotificationsParams): Promise<Notification[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.is_read !== undefined) searchParams.append('is_read', params.is_read.toString())
    if (params?.type) searchParams.append('type', params.type)
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type)
    if (params?.entity_id) searchParams.append('entity_id', params.entity_id)
    
    const query = searchParams.toString()
    return apiClient.get<Notification[]>(`/api/notifications${query ? '?' + query : ''}`, {
      useCache: true,
      cacheTTL: 10000, // 10 seconds (shorter cache for notifications)
    })
  },

  /**
   * Get single notification by ID
   */
  getNotification: (id: string): Promise<Notification> => {
    return apiClient.get<Notification>(`/api/notifications/${id}`, {
      useCache: true,
    })
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: (): Promise<number> => {
    return apiClient.get<{ count: number }>('/api/notifications/unread-count', {
      useCache: true,
      cacheTTL: 10000, // 10 seconds
    }).then(response => response.count)
  },

  /**
   * Create new notification
   */
  createNotification: (data: NotificationCreate): Promise<Notification> => {
    return apiClient.post<Notification>('/api/notifications', data)
  },

  /**
   * Update notification
   */
  updateNotification: (id: string, data: NotificationUpdate): Promise<Notification> => {
    return apiClient.put<Notification>(`/api/notifications/${id}`, data)
  },

  /**
   * Delete notification
   */
  deleteNotification: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/notifications/${id}`)
  },

  /**
   * Mark notification as read
   */
  markAsRead: (id: string): Promise<Notification> => {
    return apiClient.put<Notification>(`/api/notifications/${id}/read`, {})
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: (): Promise<{ count: number }> => {
    return apiClient.post<{ count: number }>('/api/notifications/mark-all-read', {})
  },

  /**
   * Mark notification as unread
   */
  markAsUnread: (id: string): Promise<Notification> => {
    return apiClient.put<Notification>(`/api/notifications/${id}/unread`, {})
  },

  /**
   * Get notifications by entity
   */
  getNotificationsByEntity: (entityType: string, entityId: string): Promise<Notification[]> => {
    return apiClient.get<Notification[]>(`/api/notifications?entity_type=${entityType}&entity_id=${entityId}`, {
      useCache: true,
    })
  },
}

export default notificationsApi

