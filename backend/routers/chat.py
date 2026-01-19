"""
Internal Chat Router
Hệ thống chat nội bộ cho nhân viên
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from models.chat import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
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
from services.file_upload_service import get_file_upload_service

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
        
        # Only add task_id and project_id if they are provided
        if conversation_data.task_id:
            conversation_insert["task_id"] = conversation_data.task_id
        if conversation_data.project_id:
            conversation_insert["project_id"] = conversation_data.project_id
        
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
        
        # Verify user is participant (optimized with index and limit)
        participant_check = (
            supabase.table("internal_conversation_participants")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .limit(1)  # Only need to check existence, not fetch all
            .execute()
        )
        
        if not participant_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )
        
        # Get messages (optimized: order by created_at DESC for newest first, then reverse for display)
        # Using DESC order with index idx_internal_messages_conv_created_desc for better performance
        messages_result = (
            supabase.table("internal_messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("is_deleted", False)
            .order("created_at", desc=True)  # DESC for index optimization
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
        
        # Reverse messages to show oldest first (since we queried DESC for index optimization)
        enriched_messages.reverse()
        
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
            "message_type": message_data.message_type.value if message_data.message_type else "text",
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


@router.post("/conversations/{conversation_id}/upload", response_model=dict)
async def upload_chat_file(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload file for chat message"""
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
        
        # Upload file using file upload service
        upload_service = get_file_upload_service()
        folder_path = f"Chat/{conversation_id}"
        
        file_result = await upload_service.upload_file(
            file=file,
            folder_path=folder_path,
            generate_unique_name=True
        )
        
        return {
            "url": file_result["url"],
            "file_name": file.filename or "file",
            "file_size": file_result.get("size", 0),
            "content_type": file_result.get("content_type", file.content_type or "application/octet-stream")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading chat file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/projects", response_model=List[dict])
async def get_projects_for_chat(
    current_user: User = Depends(get_current_user)
):
    """Get all projects for chat linking"""
    try:
        supabase = get_supabase_client()
        
        # Get all projects (you can add filtering based on user access if needed)
        projects_result = (
            supabase.table("projects")
            .select("id, name, project_code")
            .order("name")
            .execute()
        )
        
        return projects_result.data or []
        
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.get("/tasks", response_model=List[dict])
async def get_tasks_for_chat(
    project_id: Optional[str] = Query(None, description="Filter by project"),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for chat linking"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("tasks").select("id, title, group_id")
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        tasks_result = query.order("title").execute()
        
        return tasks_result.data or []
        
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tasks: {str(e)}"
        )


@router.get("/projects/{project_id}/conversation", response_model=Conversation)
async def get_or_create_project_conversation(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get or create a conversation linked to a project"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation already exists for this project
        existing_conv = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("project_id", project_id)
            .single()
            .execute()
        )
        
        if existing_conv.data:
            # Check if user is participant
            participant_check = (
                supabase.table("internal_conversation_participants")
                .select("id")
                .eq("conversation_id", existing_conv.data["id"])
                .eq("user_id", current_user.id)
                .execute()
            )
            
            if participant_check.data:
                enriched = _enrich_conversation_with_participants(supabase, existing_conv.data, current_user.id)
                return Conversation(**enriched)
            else:
                # Add user as participant
                supabase.table("internal_conversation_participants").insert({
                    "conversation_id": existing_conv.data["id"],
                    "user_id": current_user.id,
                    "role": "member"
                }).execute()
                enriched = _enrich_conversation_with_participants(supabase, existing_conv.data, current_user.id)
                return Conversation(**enriched)
        
        # Get project info
        project_result = supabase.table("projects").select("id, name").eq("id", project_id).single().execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        project = project_result.data
        
        # Get project team members
        team_result = supabase.table("project_team").select("user_id").eq("project_id", project_id).execute()
        user_ids = [e["user_id"] for e in team_result.data or [] if e.get("user_id")]
        
        # Add project creator if available
        project_creator_result = supabase.table("projects").select("created_by").eq("id", project_id).single().execute()
        if project_creator_result.data and project_creator_result.data.get("created_by"):
            creator_id = project_creator_result.data["created_by"]
            if creator_id not in user_ids:
                user_ids.append(creator_id)
        
        # Ensure current user is included
        if current_user.id not in user_ids:
            user_ids.append(current_user.id)
        
        if not user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No participants found for this project"
            )
        
        # Create conversation
        conversation_insert = {
            "name": f"Chat: {project.get('name', 'Project')}",
            "type": "group" if len(user_ids) > 2 else "direct",
            "project_id": project_id,
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
        logger.error(f"Error getting/creating project conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get/create project conversation: {str(e)}"
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


@router.put("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: str,
    conversation_data: ConversationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update conversation (name, avatar, background)"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation exists and user is participant
        conv_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if user is participant
        participant_result = (
            supabase.table("internal_conversation_participants")
            .select("role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .single()
            .execute()
        )
        
        if not participant_result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant of this conversation"
            )
        
        # Only admins can update group conversations
        if conv_result.data.get("type") == "group" and participant_result.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can update group conversations"
            )
        
        # Prepare update data
        update_data = {}
        if conversation_data.name is not None:
            update_data["name"] = conversation_data.name
        if conversation_data.avatar_url is not None:
            update_data["avatar_url"] = conversation_data.avatar_url
        if conversation_data.background_url is not None:
            update_data["background_url"] = conversation_data.background_url
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update conversation
        updated_result = (
            supabase.table("internal_conversations")
            .update(update_data)
            .eq("id", conversation_id)
            .execute()
        )
        
        if not updated_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update conversation"
            )
        
        # Get updated conversation
        updated_conv = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        enriched = _enrich_conversation_with_participants(supabase, updated_conv.data, current_user.id)
        
        return Conversation(**enriched)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update conversation: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation (only for group conversations, only admin can delete)"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation exists
        conv_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Only group conversations can be deleted
        if conv_result.data.get("type") != "group":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only group conversations can be deleted"
            )
        
        # Check if user is admin
        participant_result = (
            supabase.table("internal_conversation_participants")
            .select("role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .single()
            .execute()
        )
        
        if not participant_result.data or participant_result.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete group conversations"
            )
        
        # Delete conversation (cascade will delete participants and messages)
        supabase.table("internal_conversations").delete().eq("id", conversation_id).execute()
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/participants")
async def add_participants(
    conversation_id: str,
    participant_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """Add participants to a conversation"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation exists
        conv_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Only group conversations can have participants added
        if conv_result.data.get("type") != "group":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only group conversations can have participants added"
            )
        
        # Check if user is admin
        participant_result = (
            supabase.table("internal_conversation_participants")
            .select("role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .single()
            .execute()
        )
        
        if not participant_result.data or participant_result.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can add participants"
            )
        
        # Get existing participants
        existing_result = (
            supabase.table("internal_conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversation_id)
            .execute()
        )
        
        existing_user_ids = {p["user_id"] for p in existing_result.data or []}
        
        # Filter out already existing participants
        new_participant_ids = [uid for uid in participant_ids if uid not in existing_user_ids]
        
        if not new_participant_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All users are already participants"
            )
        
        # Add new participants
        participants_insert = [
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": "member"
            }
            for user_id in new_participant_ids
        ]
        
        supabase.table("internal_conversation_participants").insert(participants_insert).execute()
        
        return {"message": f"Added {len(new_participant_ids)} participant(s) successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding participants: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add participants: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}/participants/{user_id}")
async def remove_participant(
    conversation_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a participant from a conversation"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation exists
        conv_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Only group conversations can have participants removed
        if conv_result.data.get("type") != "group":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only group conversations can have participants removed"
            )
        
        # Check if user is admin or removing themselves
        participant_result = (
            supabase.table("internal_conversation_participants")
            .select("role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .single()
            .execute()
        )
        
        if not participant_result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant of this conversation"
            )
        
        is_admin = participant_result.data.get("role") == "admin"
        is_self = current_user.id == user_id
        
        if not (is_admin or is_self):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can remove other participants"
            )
        
        # Prevent removing the last admin
        if is_admin and not is_self:
            admin_count_result = (
                supabase.table("internal_conversation_participants")
                .select("id", count="exact")
                .eq("conversation_id", conversation_id)
                .eq("role", "admin")
                .execute()
            )
            
            if admin_count_result.count and admin_count_result.count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin"
                )
        
        # Remove participant
        supabase.table("internal_conversation_participants").delete().eq("conversation_id", conversation_id).eq("user_id", user_id).execute()
        
        return {"message": "Participant removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing participant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove participant: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/background")
async def upload_conversation_background(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload background image for a conversation"""
    try:
        supabase = get_supabase_client()
        
        # Check if conversation exists and user is participant
        conv_result = (
            supabase.table("internal_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if user is participant
        participant_result = (
            supabase.table("internal_conversation_participants")
            .select("role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", current_user.id)
            .single()
            .execute()
        )
        
        if not participant_result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant of this conversation"
            )
        
        # Only admins can upload background for group conversations
        if conv_result.data.get("type") == "group" and participant_result.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can upload background for group conversations"
            )
        
        # Upload file
        upload_service = get_file_upload_service()
        result = await upload_service.upload_file(
            file=file,
            folder_path=f"ChatBackgrounds/{conversation_id}",
            allowed_types=upload_service.ALLOWED_IMAGE_TYPES
        )
        
        # Update conversation with background URL
        supabase.table("internal_conversations").update({
            "background_url": result["url"],
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", conversation_id).execute()
        
        return {"url": result["url"], "message": "Background uploaded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading background: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload background: {str(e)}"
        )

