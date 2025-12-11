"""
Chat Models for Internal Messaging System
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConversationType(str, Enum):
    DIRECT = "direct"  # Chat 1-1
    GROUP = "group"    # Chat nhóm


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class ConversationBase(BaseModel):
    name: Optional[str] = None
    type: ConversationType = ConversationType.DIRECT
    avatar_url: Optional[str] = None
    task_id: Optional[str] = None  # Liên kết với task


class ConversationCreate(ConversationBase):
    participant_ids: List[str]  # Danh sách user_id tham gia


class Conversation(ConversationBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    participant_count: Optional[int] = None
    unread_count: Optional[int] = None
    task_id: Optional[str] = None


class ConversationWithParticipants(Conversation):
    participants: List['Participant'] = []


class Participant(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    role: str = "member"
    is_muted: bool = False


class MessageBase(BaseModel):
    message_text: str
    message_type: MessageType = MessageType.TEXT
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    reply_to_id: Optional[str] = None


class MessageCreate(MessageBase):
    conversation_id: str


class Message(MessageBase):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reply_to: Optional['Message'] = None


class MessageUpdate(BaseModel):
    message_text: str


class ConversationListResponse(BaseModel):
    conversations: List[Conversation]
    total: int


class MessageListResponse(BaseModel):
    messages: List[Message]
    total: int
    has_more: bool


# Update forward references
ConversationWithParticipants.model_rebuild()
Message.model_rebuild()

