from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel

from utils.auth import get_current_user, require_manager_or_admin
from models.user import User
from models.system_feedback import (
    SystemFeedback,
    SystemFeedbackCreate,
    SystemFeedbackUpdate,
    AttachmentInfo,
    FeedbackReply,
    FeedbackReplyCreate,
    FeedbackReplyUpdate,
)
from services.supabase_client import get_supabase_client
from services.file_upload_service import get_file_upload_service


router = APIRouter(prefix="/api/feedback/system", tags=["system-feedback"])


@router.get("", response_model=List[SystemFeedback])
async def list_feedback(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        query = supabase.table("system_feedbacks").select("*").order("created_at", desc=True)
        
        # Filter by role: admin/manager see all, employee only sees their own
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in ["admin", "manager"]:
            # Employee and other roles only see their own feedback
            query = query.eq("submitted_by", current_user.id)
            print(f"Filtering feedback for user {current_user.id} with role {user_role}")
        else:
            print(f"Admin/Manager {current_user.id} with role {user_role} - showing all feedback")
        
        if status:
            query = query.eq("status", status)
        if search:
            query = query.ilike("title", f"%{search}%")
        result = query.range(skip, skip + limit - 1).execute()
        return [SystemFeedback(**row) for row in (result.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list feedback: {e}")


@router.post("", response_model=SystemFeedback)
async def create_feedback(
    payload: SystemFeedbackCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        fid = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        data = payload.dict()
        data.update({
            "id": fid,
            "submitted_by": current_user.id,
            "created_at": now,
            "updated_at": now,
        })
        result = supabase.table("system_feedbacks").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create feedback")
        return SystemFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {e}")


@router.put("/{feedback_id}", response_model=SystemFeedback)
async def update_feedback(
    feedback_id: str,
    payload: SystemFeedbackUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Check permission: admin/manager can update any, employee can only update their own
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in ["admin", "manager"]:
            if feedback.get("submitted_by") != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only update your own feedback"
                )
        
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return SystemFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update feedback: {e}")


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        exists = supabase.table("system_feedbacks").select("id").eq("id", feedback_id).execute()
        if not exists.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        supabase.table("system_feedbacks").delete().eq("id", feedback_id).execute()
        return {"message": "Deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete feedback: {e}")


class ResolveFeedbackRequest(BaseModel):
    admin_notes: Optional[str] = None
    notification_message: Optional[str] = None


@router.post("/{feedback_id}/resolve")
async def resolve_feedback(
    feedback_id: str,
    request: ResolveFeedbackRequest,
    current_user: User = Depends(require_manager_or_admin)
):
    """Resolve a feedback and send notification to the creator"""
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Update feedback status
        update_data = {
            "status": "resolved",
            "resolved_at": datetime.utcnow().isoformat(),
            "resolved_by": current_user.id,
            "admin_notes": request.admin_notes
        }
        
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to resolve feedback")
        
        # Send notification to all users when feedback is resolved
        if request.notification_message:
            try:
                # Get all users to send notification to everyone
                users_result = supabase.table("users").select("id").execute()
                
                if users_result.data:
                    # Create notification records for all users
                    notifications = []
                    for user in users_result.data:
                        notification_data = {
                            "id": str(uuid.uuid4()),
                            "user_id": user["id"],
                            "title": "Góp ý hệ thống đã được xử lý",
                            "message": f"Góp ý '{feedback.get('title', 'Không có tiêu đề')}' đã được xử lý bởi admin. {request.notification_message}",
                            "type": "feedback_resolved_broadcast",
                            "related_id": feedback_id,
                            "created_at": datetime.utcnow().isoformat(),
                            "is_read": False
                        }
                        notifications.append(notification_data)
                    
                    # Insert all notifications at once
                    if notifications:
                        supabase.table("notifications").insert(notifications).execute()
                        print(f"Sent notification to {len(notifications)} users")
                
            except Exception as e:
                print(f"Failed to send broadcast notification: {e}")
                # Don't fail the whole operation if notification fails
        
        return {"message": "Feedback resolved successfully", "feedback": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve feedback: {e}")


@router.post("/{feedback_id}/close")
async def close_feedback(
    feedback_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Close a resolved feedback"""
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists and is resolved
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        if feedback["status"] != "resolved":
            raise HTTPException(status_code=400, detail="Only resolved feedbacks can be closed")
        
        # Update feedback status
        update_data = {
            "status": "closed",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to close feedback")
        
        return {"message": "Feedback closed successfully", "feedback": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to close feedback: {e}")


# ==========================
# Attachment Upload Endpoints
# ==========================

@router.post("/{feedback_id}/attachments", response_model=AttachmentInfo)
async def upload_feedback_attachment(
    feedback_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an attachment for system feedback
    
    Files are stored in Supabase Storage at: SystemFeedbacks/{feedback_id}/{filename}
    Attachment info is saved to the attachments JSONB field in system_feedbacks table
    """
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Check permission: user can only add attachments to their own feedback
        # Admin/manager can add to any feedback
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in ["admin", "manager"]:
            if feedback.get("submitted_by") != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only add attachments to your own feedback"
                )
        
        # Upload file to Supabase Storage
        upload_service = get_file_upload_service()
        result = await upload_service.upload_file(
            file=file,
            folder_path=f"SystemFeedbacks/{feedback_id}",
            max_size=10 * 1024 * 1024,  # 10MB
            allowed_types=upload_service.ALLOWED_TYPES  # Include images and documents (PDF, etc.)
        )
        
        # Create attachment info
        attachment_info = AttachmentInfo(**result)
        
        # Get current attachments from feedback
        current_attachments = feedback.get("attachments") or []
        if not isinstance(current_attachments, list):
            current_attachments = []
        
        # Add new attachment to list
        current_attachments.append(attachment_info.dict())
        
        # Update feedback with new attachments
        update_data = {
            "attachments": current_attachments,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        return attachment_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload attachment: {str(e)}")


@router.post("/{feedback_id}/attachments/multiple")
async def upload_multiple_feedback_attachments(
    feedback_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple attachments for system feedback
    """
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Check permission
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in ["admin", "manager"]:
            if feedback.get("submitted_by") != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only add attachments to your own feedback"
                )
        
        # Upload all files
        upload_service = get_file_upload_service()
        results = await upload_service.upload_multiple_files(
            files=files,
            folder_path=f"SystemFeedbacks/{feedback_id}",
            max_size=10 * 1024 * 1024  # 10MB
        )
        
        # Get current attachments
        current_attachments = feedback.get("attachments") or []
        if not isinstance(current_attachments, list):
            current_attachments = []
        
        # Add new attachments
        for result in results:
            attachment_info = AttachmentInfo(**result)
            current_attachments.append(attachment_info.dict())
        
        # Update feedback
        update_data = {
            "attachments": current_attachments,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        return {
            "message": f"Successfully uploaded {len(results)} attachment(s)",
            "attachments": [AttachmentInfo(**r) for r in results]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload attachments: {str(e)}")


@router.delete("/{feedback_id}/attachments/{attachment_id}")
async def delete_feedback_attachment(
    feedback_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an attachment from system feedback
    """
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Check permission
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in ["admin", "manager"]:
            if feedback.get("submitted_by") != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only delete attachments from your own feedback"
                )
        
        # Get current attachments
        current_attachments = feedback.get("attachments") or []
        if not isinstance(current_attachments, list):
            current_attachments = []
        
        # Find attachment to delete
        attachment_to_delete = None
        remaining_attachments = []
        
        for attachment in current_attachments:
            if attachment.get("id") == attachment_id:
                attachment_to_delete = attachment
            else:
                remaining_attachments.append(attachment)
        
        if not attachment_to_delete:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Delete file from storage
        upload_service = get_file_upload_service()
        file_path = attachment_to_delete.get("path")
        if file_path:
            await upload_service.delete_file(file_path)
        
        # Update feedback with remaining attachments
        update_data = {
            "attachments": remaining_attachments,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        return {
            "message": "Attachment deleted successfully",
            "deleted_attachment": attachment_to_delete
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete attachment: {str(e)}")


# ==========================
# Reply Endpoints
# ==========================

def build_reply_tree(replies: List[dict]) -> List[FeedbackReply]:
    """Build threaded reply tree from flat list"""
    if not replies:
        return []
    
    # Get all unique user IDs
    user_ids = list(set([r.get("replied_by") for r in replies if r.get("replied_by")]))
    
    # Fetch all user names in one query
    user_names = {}
    if user_ids:
        try:
            supabase = get_supabase_client()
            user_result = supabase.table("users").select("id, full_name, email").in_("id", user_ids).execute()
            if user_result.data:
                for user in user_result.data:
                    user_names[user["id"]] = user.get("full_name") or user.get("email", "Unknown")
        except:
            pass
    
    # Create a map of all replies and add user names
    reply_map = {}
    root_replies = []
    
    for reply_data in replies:
        reply_id = reply_data.get("id")
        user_id = reply_data.get("replied_by")
        reply_data["replied_by_name"] = user_names.get(user_id, "Unknown") if user_id else "Unknown"
        reply_data["children"] = []
        reply_map[reply_id] = reply_data
    
    # Build tree structure
    for reply_data in replies:
        reply_id = reply_data.get("id")
        parent_id = reply_data.get("parent_reply_id")
        
        if parent_id and parent_id in reply_map:
            # Add to parent's children
            parent = reply_map[parent_id]
            parent["children"].append(reply_data)
        else:
            # Root level reply
            root_replies.append(reply_data)
    
    # Convert to FeedbackReply objects recursively
    def convert_to_reply(data: dict) -> FeedbackReply:
        children = []
        if data.get("children"):
            children = [convert_to_reply(child) for child in data["children"]]
        
        reply_dict = dict(data)
        reply_dict["children"] = children if children else None
        return FeedbackReply(**reply_dict)
    
    return [convert_to_reply(reply) for reply in root_replies]


@router.get("/{feedback_id}/replies", response_model=List[FeedbackReply])
async def get_feedback_replies(
    feedback_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get all replies for a feedback (threaded structure)
    """
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Get all replies (flat list)
        result = supabase.table("system_feedback_replies").select("*").eq("feedback_id", feedback_id).order("created_at", desc=False).execute()
        
        if not result.data:
            return []
        
        # Build threaded tree structure
        return build_reply_tree(result.data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get replies: {str(e)}")


@router.post("/{feedback_id}/replies", response_model=FeedbackReply)
async def create_feedback_reply(
    feedback_id: str,
    payload: FeedbackReplyCreate,
    current_user: User = Depends(get_current_user)  # Allow all authenticated users to reply
):
    """
    Create a reply to a feedback or to another reply (threaded)
    All authenticated users can reply
    """
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # If replying to another reply, verify parent exists
        if payload.parent_reply_id:
            parent_reply = supabase.table("system_feedback_replies").select("*").eq("id", payload.parent_reply_id).eq("feedback_id", feedback_id).execute()
            if not parent_reply.data:
                raise HTTPException(status_code=404, detail="Parent reply not found")
        
        # Create reply
        reply_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        data = payload.dict()
        data.update({
            "id": reply_id,
            "feedback_id": feedback_id,
            "replied_by": current_user.id,
            "created_at": now,
            "updated_at": now,
        })
        
        result = supabase.table("system_feedback_replies").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create reply")
        
        reply_data = dict(result.data[0])
        # Get user name
        user_result = supabase.table("users").select("full_name, email").eq("id", current_user.id).execute()
        if user_result.data:
            user = user_result.data[0]
            reply_data["replied_by_name"] = user.get("full_name") or user.get("email", "Unknown")
        reply_data["children"] = None
        
        return FeedbackReply(**reply_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create reply: {str(e)}")


@router.put("/{feedback_id}/replies/{reply_id}", response_model=FeedbackReply)
async def update_feedback_reply(
    feedback_id: str,
    reply_id: str,
    payload: FeedbackReplyUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """
    Update a reply
    Only admins and managers can update replies
    """
    try:
        supabase = get_supabase_client()
        
        # Check if reply exists
        existing = supabase.table("system_feedback_replies").select("*").eq("id", reply_id).eq("feedback_id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Reply not found")
        
        reply = existing.data[0]
        
        # Check permission: only the author or admin can update
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role != "admin" and reply.get("replied_by") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update your own replies")
        
        # Update reply
        update_data = payload.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("system_feedback_replies").update(update_data).eq("id", reply_id).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to update reply")
        
        reply_data = dict(result.data[0])
        # Get user name
        user_result = supabase.table("users").select("full_name, email").eq("id", reply_data.get("replied_by")).execute()
        if user_result.data:
            user = user_result.data[0]
            reply_data["replied_by_name"] = user.get("full_name") or user.get("email", "Unknown")
        
        return FeedbackReply(**reply_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update reply: {str(e)}")


@router.delete("/{feedback_id}/replies/{reply_id}")
async def delete_feedback_reply(
    feedback_id: str,
    reply_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """
    Delete a reply
    Only admins and managers can delete replies
    """
    try:
        supabase = get_supabase_client()
        
        # Check if reply exists
        existing = supabase.table("system_feedback_replies").select("*").eq("id", reply_id).eq("feedback_id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Reply not found")
        
        reply = existing.data[0]
        
        # Check permission: only the author or admin can delete
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role != "admin" and reply.get("replied_by") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete your own replies")
        
        # Delete attachments if any
        attachments = reply.get("attachments") or []
        if attachments:
            upload_service = get_file_upload_service()
            for attachment in attachments:
                if isinstance(attachment, dict) and attachment.get("path"):
                    await upload_service.delete_file(attachment["path"])
        
        # Delete reply
        supabase.table("system_feedback_replies").delete().eq("id", reply_id).execute()
        
        return {"message": "Reply deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete reply: {str(e)}")


