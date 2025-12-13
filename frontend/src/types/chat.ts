export type ConversationType = 'direct' | 'group'
export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface Conversation {
  id: string
  name?: string
  type: ConversationType
  avatar_url?: string
  task_id?: string
  project_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  last_message_at?: string
  last_message_preview?: string
  participant_count?: number
  unread_count?: number
}

export interface Participant {
  id: string
  conversation_id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  joined_at: string
  last_read_at?: string
  role: string
  is_muted: boolean
}

export interface ConversationWithParticipants extends Conversation {
  participants: Participant[]
  background_url?: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string
  sender_avatar?: string
  message_text: string
  message_type: MessageType
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  reply_to?: {
    id: string
    message_text: string
    sender_name: string
  }
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  has_more: boolean
}

export interface MessageCreate {
  message_text: string
  message_type?: MessageType
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
}

export interface ConversationCreate {
  name?: string
  type?: ConversationType
  avatar_url?: string
  participant_ids: string[]
  task_id?: string
  project_id?: string
}

