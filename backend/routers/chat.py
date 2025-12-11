"""
Internal Chat Router
Hệ thống chat nội bộ cho nhân viên
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from models.chat import (
    Conversation,
    ConversationCreate,
    ConversationWithParticipants,
    Message,
    MessageCreate,
    MessageUpdate,
    ConversationListResponse,
    MessageListResponse,
    Participant
)
from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Internal Chat"])


def _parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string"""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except Exception:
        return None


def _enrich_conversation_with_participants(supabase, conversation: dict, current_user_id: str) -> dict:
    """Enrich conversation with participants and unread count"""
    # Get participants
    participants_result = (
        supabase.table("internal_conversation_participants")
        .select("*")
        .eq("conversation_id", conversation["id"])
        .execute()
    )
    
    participants = []
    user_ids = []
    for p in participants_result.data or []:
        user_ids.append(p["user_id"])
        participants.append(p)
    
    # Get user info for participants
    user_map = {}
    if user_ids:
        try:
            users_result = supabase.table("users").select("id, full_name").in_("id", user_ids).execute()
            if users_result.data:
                user_map = {user["id"]: user.get("full_name") for user in users_result.data}
        except Exception:
            pass
    
    # Enrich participants with user names
    enriched_participants = []
    for p in participants:
        p["user_name"] = user_map.get(p["user_id"])
        enriched_participants.append(p)
    
    conversation["participants"] = enriched_participants
    conversation["participant_count"] = len(enriched_participants)
    
    # Calculate unread count
    try:
        # Get last read time for current user
        current_participant = next(
            (p for p in enriched_participants if p["user_id"] == current_user_id),
            None
        )
        last_read_at = current_participant.get("last_read_at") if current_participant else None
        
        # Count unread messages
        if last_read_at:
            unread_result = (
                supabase.table("internal_messages")
                .select("id", count="exact")
                .eq("conversation_id", conversation["id"])
                .eq("is_deleted", False)
                .neq("sender_id", current_user_id)
                .gt("created_at", last_read_at)
                .execute()
            )
            conversation["unread_count"] = unread_result.count or 0
        else:
            # If never read, count all messages not from self
            unread_result = (
                supabase.table("internal_messages")
                .select("id", count="exact")
                .eq("conversation_id", conversation["id"])
                .eq("is_deleted", False)
                .neq("sender_id", current_user_id)
                .execute()
            )
            conversation["unread_count"] = unread_result.count or 0
    except Exception:
        conversation["unread_count"] = 0
    
    return conversation


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for current user"""
    try:
        supabase = get_supabase_client()
        
        # Get conversation IDs where user is a participant
        participants_result = (
            supabase.table("internal_conversation_participants")
            .select("conversation_id")
            .eq("user_id", current_user.id)
            .execute()
        )
        
        conversation_ids = [p["conversation_id"] for p in participants_result.data or []]
        
        if not conversation_ids:
            return ConversationListResponse(conversations=[], total=0)
        
        # Get conversations
        conversations_result = (
            supabase.table("internal_conversations")
            .select("*")
            .in_("id", conversation_ids)
            .order("last_message_at", desc=True)
            .order("updated_at", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
        
        # Get total count
        total_result = (
            supabase.table("internal_conversations")
            .select("id", count="exact")
            .in_("id", conversation_ids)
            .execute()
        )
        total = total_result.count or 0
        
        # Enrich conversations
        enriched_conversations = []
        for conv in conversations_result.data or []:
            enriched = _enrich_conversation_with_participants(supabase, conv, current_user.id)
            
            # For direct conversations, set name to other participant's name
            if enriched["type"] == "direct":
                other_participant = next(
                    (p for p in enriched["participants"] if p["user_id"] != current_user.id),
                    None
                )
                if other_participant:
                    enriched["name"] = other_participant.get("user_name") or "Unknown"
            
            enriched_conversations.append(Conversation(**enriched))
        
        return ConversationListResponse(
            conversations=enriched_conversations,
            total=total
        )
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithParticipants)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation with participants"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is participant
        participant_check = (
            supabase.table("internal_conversation_participants")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        
        if not participant_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )
        
        # Get conversation
        conversation_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conversation_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Enrich with participants
        enriched = _enrich_conversation_with_participants(supabase, conversation_result.data, current_user.id)
        
        # For direct conversations, set name to other participant's name
        if enriched["type"] == "direct":
            other_participant = next(
                (p for p in enriched["participants"] if p["user_id"] != current_user.id),
                None
            )
            if other_participant:
                enriched["name"] = other_participant.get("user_name") or "Unknown"
        
        return ConversationWithParticipants(**enriched)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}"
        )


@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        supabase = get_supabase_client()
        
        # Validate participants
        if not conversation_data.participant_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one participant is required"
            )
        
        # Ensure current user is in participants
        if current_user.id not in conversation_data.participant_ids:
            conversation_data.participant_ids.append(current_user.id)
        
        # Remove duplicates
        conversation_data.participant_ids = list(set(conversation_data.participant_ids))
        
        # Determine conversation type
        conv_type = conversation_data.type
        if len(conversation_data.participant_ids) == 2:
            conv_type = "direct"
        elif len(conversation_data.participant_ids) > 2:
            conv_type = "group"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid number of participants"
            )
        
        # Create conversation
        conversation_insert = {
            "name": conversation_data.name if conv_type == "group" else None,
            "type": conv_type,
            "created_by": current_user.id,
            "avatar_url": conversation_data.avatar_url
        }
        
        conversation_result = (
            supabase.table("internal_conversations")
            .insert(conversation_insert)
            .execute()
        )
        
        if not conversation_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create conversation"
            )
        
        conversation_id = conversation_result.data[0]["id"]
        
        # Add participants
        participants_insert = [
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": "admin" if user_id == current_user.id and conv_type == "group" else "member"
            }
            for user_id in conversation_data.participant_ids
        ]
        
        supabase.table("internal_conversation_participants").insert(participants_insert).execute()
        
        # Get created conversation
        created_conv = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        enriched = _enrich_conversation_with_participants(supabase, created_conv.data, current_user.id)
        
        return Conversation(**enriched)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get messages in a conversation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is participant
        participant_check = (
            supabase.table("internal_conversation_participants")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        
        if not participant_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )
        
        # Get messages
        messages_result = (
            supabase.table("internal_messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("is_deleted", False)
            .order("created_at", desc=False)
            .range(skip, skip + limit - 1)
            .execute()
        )
        
        # Get total count
        total_result = (
            supabase.table("internal_messages")
            .select("id", count="exact")
            .eq("conversation_id", conversation_id)
            .eq("is_deleted", False)
            .execute()
        )
        total = total_result.count or 0
        has_more = (skip + limit) < total
        
        # Enrich messages with sender info
        enriched_messages = []
        sender_ids = list(set([m["sender_id"] for m in messages_result.data or [] if m.get("sender_id")]))
        
        user_map = {}
        if sender_ids:
            try:
                users_result = supabase.table("users").select("id, full_name").in_("id", sender_ids).execute()
                if users_result.data:
                    user_map = {user["id"]: user.get("full_name") for user in users_result.data}
            except Exception:
                pass
        
        # Get reply messages if any
        reply_ids = [m["reply_to_id"] for m in messages_result.data or [] if m.get("reply_to_id")]
        reply_map = {}
        if reply_ids:
            try:
                replies_result = (
                    supabase.table("internal_messages")
                    .select("id, message_text, sender_id")
                    .in_("id", reply_ids)
                    .execute()
                )
                if replies_result.data:
                    for reply in replies_result.data:
                        reply_sender_name = user_map.get(reply["sender_id"], "Unknown")
                        reply_map[reply["id"]] = {
                            "id": reply["id"],
                            "message_text": reply["message_text"],
                            "sender_name": reply_sender_name
                        }
            except Exception:
                pass
        
        for msg in messages_result.data or []:
            msg["sender_name"] = user_map.get(msg["sender_id"], "Unknown")
            
            # Add reply info if exists
            if msg.get("reply_to_id") and msg["reply_to_id"] in reply_map:
                msg["reply_to"] = reply_map[msg["reply_to_id"]]
            
            enriched_messages.append(Message(**msg))
        
        return MessageListResponse(
            messages=enriched_messages,
            total=total,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch messages: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is participant
        participant_check = (
            supabase.table("internal_conversation_participants")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        
        if not participant_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )
        
        # Create message
        message_insert = {
            "conversation_id": conversation_id,
            "sender_id": current_user.id,
            "message_text": message_data.message_text,
            "message_type": message_data.message_type.value,
            "file_url": message_data.file_url,
            "file_name": message_data.file_name,
            "file_size": message_data.file_size,
            "reply_to_id": message_data.reply_to_id
        }
        
        message_result = (
            supabase.table("internal_messages")
            .insert(message_insert)
            .execute()
        )
        
        if not message_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message"
            )
        
        # Get sender name
        sender_name = current_user.full_name or "Unknown"
        
        message = message_result.data[0]
        message["sender_name"] = sender_name
        
        return Message(**message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.put("/messages/{message_id}", response_model=Message)
async def update_message(
    message_id: str,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a message (only sender can update)"""
    try:
        supabase = get_supabase_client()
        
        # Get message
        message_result = (
            supabase.table("internal_messages")
            .select("*")
            .eq("id", message_id)
            .single()
            .execute()
        )
        
        if not message_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        message = message_result.data
        
        # Verify sender
        if message["sender_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own messages"
            )
        
        # Update message
        update_result = (
            supabase.table("internal_messages")
            .update({
                "message_text": message_data.message_text,
                "is_edited": True,
                "edited_at": datetime.now().isoformat()
            })
            .eq("id", message_id)
            .execute()
        )
        
        if not update_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message"
            )
        
        updated_message = update_result.data[0]
        updated_message["sender_name"] = current_user.full_name or "Unknown"
        
        return Message(**updated_message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update message: {str(e)}"
        )


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a message (soft delete)"""
    try:
        supabase = get_supabase_client()
        
        # Get message
        message_result = (
            supabase.table("internal_messages")
            .select("*")
            .eq("id", message_id)
            .single()
            .execute()
        )
        
        if not message_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        message = message_result.data
        
        # Verify sender
        if message["sender_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own messages"
            )
        
        # Soft delete
        supabase.table("internal_messages").update({
            "is_deleted": True,
            "deleted_at": datetime.now().isoformat(),
            "message_text": "[Tin nhắn đã bị xóa]"
        }).eq("id", message_id).execute()
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete message: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark conversation as read"""
    try:
        supabase = get_supabase_client()
        
        # Update last_read_at
        supabase.table("internal_conversation_participants").update({
            "last_read_at": datetime.now().isoformat()
        }).eq("conversation_id", conversation_id).eq("user_id", current_user.id).execute()
        
        return {"message": "Conversation marked as read"}
        
    except Exception as e:
        logger.error(f"Error marking as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark as read: {str(e)}"
        )


@router.get("/tasks/{task_id}/conversation", response_model=Conversation)
async def get_or_create_task_conversation(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get or create conversation for a task"""
    try:
        supabase = get_supabase_client()
        
        # Check if task exists and user has access
        task_result = supabase.table("tasks").select("id, title").eq("id", task_id).single().execute()
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data
        
        # Check if conversation already exists for this task
        existing_conv = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("task_id", task_id)
            .single()
            .execute()
        )
        
        if existing_conv.data:
            # Enrich and return existing conversation
            enriched = _enrich_conversation_with_participants(supabase, existing_conv.data, current_user.id)
            return Conversation(**enriched)
        
        # Create new conversation for task
        # Get task participants (employees) and convert to user_ids
        participants_result = (
            supabase.table("task_participants")
            .select("employee_id")
            .eq("task_id", task_id)
            .execute()
        )
        
        employee_ids = [p["employee_id"] for p in participants_result.data or []]
        
        # Get user_ids from employees
        user_ids = []
        if employee_ids:
            employees_result = (
                supabase.table("employees")
                .select("user_id")
                .in_("id", employee_ids)
                .execute()
            )
            user_ids = [e["user_id"] for e in employees_result.data or [] if e.get("user_id")]
        
        # Add task creator if available
        task_creator_result = supabase.table("tasks").select("created_by").eq("id", task_id).single().execute()
        if task_creator_result.data and task_creator_result.data.get("created_by"):
            creator_id = task_creator_result.data["created_by"]
            if creator_id not in user_ids:
                user_ids.append(creator_id)
        
        # Ensure current user is included
        if current_user.id not in user_ids:
            user_ids.append(current_user.id)
        
        if not user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No participants found for this task"
            )
        
        # Create conversation
        conversation_insert = {
            "name": f"Chat: {task.get('title', 'Task')}",
            "type": "group" if len(user_ids) > 2 else "direct",
            "task_id": task_id,
            "created_by": current_user.id
        }
        
        conversation_result = (
            supabase.table("internal_conversations")
            .insert(conversation_insert)
            .execute()
        )
        
        if not conversation_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create conversation"
            )
        
        conversation_id = conversation_result.data[0]["id"]
        
        # Add participants
        participants_insert = [
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": "admin" if user_id == current_user.id else "member"
            }
            for user_id in user_ids
        ]
        
        supabase.table("internal_conversation_participants").insert(participants_insert).execute()
        
        # Get created conversation
        created_conv = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        enriched = _enrich_conversation_with_participants(supabase, created_conv.data, current_user.id)
        
        return Conversation(**enriched)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting/creating task conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get/create task conversation: {str(e)}"
        )

