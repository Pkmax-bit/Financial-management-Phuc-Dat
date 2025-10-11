"""
API Router cho hệ thống cảm xúc và bình luận - Phiên bản đơn giản
Sử dụng Supabase client thay vì SQLAlchemy
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from services.supabase_client import get_supabase_client
from utils.auth import get_current_user

router = APIRouter(prefix="/api/emotions-comments", tags=["emotions-comments"])

# =====================================================
# PYDANTIC MODELS
# =====================================================

class EmotionTypeResponse(BaseModel):
    id: str
    name: str
    display_name: str
    emoji: str
    color: Optional[str] = None
    is_active: bool

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    entity_type: str = Field(..., pattern="^(project|timeline_entry|invoice|expense|employee|attachment)$")
    entity_id: str
    timeline_id: Optional[str] = None
    author_name: Optional[str] = None

class CommentCreate(CommentBase):
    parent_id: Optional[str] = None
    mentioned_user_ids: Optional[List[str]] = None

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class CommentResponse(BaseModel):
    id: str
    parent_id: Optional[str]
    entity_type: str
    entity_id: str
    timeline_id: Optional[str]
    user_id: Optional[str]
    author_name: str
    content: str
    is_edited: bool
    is_deleted: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: List['CommentResponse'] = []
    reactions: Dict[str, int] = {}
    user_reaction: Optional[str] = None

class ReactionCreate(BaseModel):
    entity_type: str = Field(..., pattern="^(comment|timeline_entry|project|invoice|expense|attachment)$")
    entity_id: str
    emotion_type_id: str

class ReactionResponse(BaseModel):
    id: str
    user_id: str
    entity_type: str
    entity_id: str
    emotion_type: EmotionTypeResponse
    created_at: datetime

class CommentWithReplies(CommentResponse):
    replies: List[CommentResponse] = []
    total_replies: int = 0
    total_reactions: int = 0

# =====================================================
# EMOTION TYPES ENDPOINTS
# =====================================================

@router.get("/emotion-types", response_model=List[EmotionTypeResponse])
async def get_emotion_types():
    """Lấy danh sách tất cả loại cảm xúc"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("emotion_types")\
            .select("*")\
            .eq("is_active", True)\
            .order("name")\
            .execute()
        
        emotion_types = []
        for row in result.data:
            emotion_types.append(EmotionTypeResponse(
                id=str(row["id"]),
                name=row["name"],
                display_name=row["display_name"],
                emoji=row["emoji"],
                color=row["color"],
                is_active=row["is_active"]
            ))
        
        return emotion_types
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy danh sách cảm xúc: {str(e)}")

# =====================================================
# COMMENTS ENDPOINTS
# =====================================================

@router.post("/comments", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo bình luận mới"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra parent_id nếu có
        if comment.parent_id:
            parent_result = supabase.table("comments")\
                .select("id")\
                .eq("id", comment.parent_id)\
                .eq("is_deleted", False)\
                .execute()
            
            if not parent_result.data:
                raise HTTPException(status_code=404, detail="Bình luận cha không tồn tại")
        
        # Tạo bình luận mới
        comment_data = {
            "id": str(uuid.uuid4()),
            "parent_id": comment.parent_id,
            "entity_type": comment.entity_type,
            "entity_id": comment.entity_id,
            "timeline_id": comment.timeline_id,
            "user_id": current_user["id"],
            "author_name": comment.author_name or current_user["full_name"],
            "content": comment.content
        }
        
        result = supabase.table("comments").insert(comment_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Không thể tạo bình luận")
        
        # Thêm mentions nếu có
        if comment.mentioned_user_ids:
            mentions_data = []
            for mentioned_user_id in comment.mentioned_user_ids:
                mentions_data.append({
                    "comment_id": comment_data["id"],
                    "mentioned_user_id": mentioned_user_id
                })
            
            if mentions_data:
                supabase.table("comment_mentions").insert(mentions_data).execute()
        
        # Trả về bình luận vừa tạo
        return CommentResponse(
            id=comment_data["id"],
            parent_id=comment_data["parent_id"],
            entity_type=comment_data["entity_type"],
            entity_id=comment_data["entity_id"],
            user_id=comment_data["user_id"],
            author_name=comment_data["author_name"],
            content=comment_data["content"],
            is_edited=False,
            is_deleted=False,
            deleted_at=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            replies=[],
            reactions={},
            user_reaction=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo bình luận: {str(e)}")

@router.get("/comments/{entity_type}/{entity_id}", response_model=List[CommentWithReplies])
async def get_comments(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách bình luận cho một entity"""
    try:
        supabase = get_supabase_client()
        
        # Lấy tất cả bình luận gốc (parent_id IS NULL)
        result = supabase.table("comments")\
            .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .is_("parent_id", "null")\
            .eq("is_deleted", False)\
            .order("created_at", desc=True)\
            .execute()
        
        comments = []
        for row in result.data:
            # Lấy replies cho mỗi comment
            replies_result = supabase.table("comments")\
                .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
                .eq("parent_id", row["id"])\
                .eq("is_deleted", False)\
                .order("created_at")\
                .execute()
            
            replies = []
            for reply_row in replies_result.data:
                # Lấy nested replies cho mỗi reply (recursive)
                nested_replies = get_nested_replies(reply_row["id"])
                
                replies.append(CommentResponse(
                    id=str(reply_row["id"]),
                    parent_id=str(reply_row["parent_id"]) if reply_row["parent_id"] else None,
                    entity_type=reply_row["entity_type"],
                    entity_id=reply_row["entity_id"],
                    timeline_id=str(reply_row["timeline_id"]) if reply_row["timeline_id"] else None,
                    user_id=str(reply_row["user_id"]) if reply_row["user_id"] else None,
                    author_name=reply_row["author_name"],
                    content=reply_row["content"],
                    is_edited=reply_row["is_edited"],
                    is_deleted=reply_row["is_deleted"],
                    deleted_at=reply_row["deleted_at"],
                    created_at=datetime.fromisoformat(reply_row["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(reply_row["updated_at"].replace('Z', '+00:00')),
                    replies=nested_replies,
                    reactions={},
                    user_reaction=None
                ))
            
            # Lấy reactions cho comment
            reactions_result = supabase.table("user_reactions")\
                .select("emotion_type_id")\
                .eq("entity_type", "comment")\
                .eq("entity_id", row["id"])\
                .execute()
            
            reactions = {}
            for reaction in reactions_result.data:
                # Lấy tên emotion type
                emotion_result = supabase.table("emotion_types")\
                    .select("name")\
                    .eq("id", reaction["emotion_type_id"])\
                    .execute()
                
                if emotion_result.data:
                    emotion_name = emotion_result.data[0]["name"]
                    reactions[emotion_name] = reactions.get(emotion_name, 0) + 1
            
            # Lấy user reaction
            user_reaction_result = supabase.table("user_reactions")\
                .select("emotion_type_id")\
                .eq("entity_type", "comment")\
                .eq("entity_id", row["id"])\
                .eq("user_id", current_user["id"])\
                .execute()
            
            user_reaction = None
            if user_reaction_result.data:
                emotion_result = supabase.table("emotion_types")\
                    .select("name")\
                    .eq("id", user_reaction_result.data[0]["emotion_type_id"])\
                    .execute()
                
                if emotion_result.data:
                    user_reaction = emotion_result.data[0]["name"]
            
            comment_data = CommentWithReplies(
                id=str(row["id"]),
                parent_id=str(row["parent_id"]) if row["parent_id"] else None,
                entity_type=row["entity_type"],
                entity_id=row["entity_id"],
                timeline_id=str(row["timeline_id"]) if row["timeline_id"] else None,
                user_id=str(row["user_id"]) if row["user_id"] else None,
                author_name=row["author_name"],
                content=row["content"],
                is_edited=row["is_edited"],
                is_deleted=row["is_deleted"],
                deleted_at=row["deleted_at"],
                created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00')),
                replies=replies,
                total_replies=len(replies),
                total_reactions=sum(reactions.values()),
                reactions=reactions,
                user_reaction=user_reaction
            )
            comments.append(comment_data)
        
        return comments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy bình luận: {str(e)}")

@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật bình luận"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra quyền sở hữu
        comment_result = supabase.table("comments")\
            .select("user_id")\
            .eq("id", comment_id)\
            .eq("is_deleted", False)\
            .execute()
        
        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        
        if str(comment_result.data[0]["user_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa bình luận này")
        
        # Cập nhật bình luận
        update_result = supabase.table("comments")\
            .update({
                "content": comment_update.content,
                "is_edited": True,
                "updated_at": datetime.now().isoformat()
            })\
            .eq("id", comment_id)\
            .execute()
        
        if not update_result.data:
            raise HTTPException(status_code=500, detail="Không thể cập nhật bình luận")
        
        # Trả về bình luận đã cập nhật
        updated_comment = update_result.data[0]
        return CommentResponse(
            id=str(updated_comment["id"]),
            parent_id=str(updated_comment["parent_id"]) if updated_comment["parent_id"] else None,
            entity_type=updated_comment["entity_type"],
            entity_id=updated_comment["entity_id"],
            user_id=str(updated_comment["user_id"]) if updated_comment["user_id"] else None,
            author_name=updated_comment["author_name"],
            content=updated_comment["content"],
            is_edited=updated_comment["is_edited"],
            is_deleted=updated_comment["is_deleted"],
            deleted_at=updated_comment["deleted_at"],
            created_at=datetime.fromisoformat(updated_comment["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(updated_comment["updated_at"].replace('Z', '+00:00')),
            replies=[],
            reactions={},
            user_reaction=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật bình luận: {str(e)}")

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa bình luận (soft delete)"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra quyền sở hữu
        comment_result = supabase.table("comments")\
            .select("user_id")\
            .eq("id", comment_id)\
            .eq("is_deleted", False)\
            .execute()
        
        if not comment_result.data:
            raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        
        if str(comment_result.data[0]["user_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Không có quyền xóa bình luận này")
        
        # Soft delete
        update_result = supabase.table("comments")\
            .update({
                "is_deleted": True,
                "deleted_at": datetime.now().isoformat()
            })\
            .eq("id", comment_id)\
            .execute()
        
        if not update_result.data:
            raise HTTPException(status_code=500, detail="Không thể xóa bình luận")
        
        return {"message": "Bình luận đã được xóa"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa bình luận: {str(e)}")

# =====================================================
# REACTIONS ENDPOINTS
# =====================================================

@router.post("/reactions", response_model=ReactionResponse)
async def add_reaction(
    reaction: ReactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Thêm phản ứng/cảm xúc"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra emotion_type tồn tại
        emotion_result = supabase.table("emotion_types")\
            .select("*")\
            .eq("id", reaction.emotion_type_id)\
            .eq("is_active", True)\
            .execute()
        
        if not emotion_result.data:
            raise HTTPException(status_code=404, detail="Loại cảm xúc không tồn tại")
        
        emotion = emotion_result.data[0]
        
        # Xóa reaction cũ nếu có
        supabase.table("user_reactions")\
            .delete()\
            .eq("user_id", current_user["id"])\
            .eq("entity_type", reaction.entity_type)\
            .eq("entity_id", reaction.entity_id)\
            .execute()
        
        # Thêm reaction mới
        reaction_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "entity_type": reaction.entity_type,
            "entity_id": reaction.entity_id,
            "emotion_type_id": reaction.emotion_type_id
        }
        
        result = supabase.table("user_reactions").insert(reaction_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Không thể thêm phản ứng")
        
        # Trả về reaction vừa tạo
        return ReactionResponse(
            id=reaction_data["id"],
            user_id=current_user["id"],
            entity_type=reaction.entity_type,
            entity_id=reaction.entity_id,
            emotion_type=EmotionTypeResponse(
                id=str(emotion["id"]),
                name=emotion["name"],
                display_name=emotion["display_name"],
                emoji=emotion["emoji"],
                color=emotion["color"],
                is_active=emotion["is_active"]
            ),
            created_at=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm phản ứng: {str(e)}")

@router.delete("/reactions/{entity_type}/{entity_id}")
async def remove_reaction(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa phản ứng/cảm xúc"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("user_reactions")\
            .delete()\
            .eq("user_id", current_user["id"])\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy phản ứng để xóa")
        
        return {"message": "Phản ứng đã được xóa"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa phản ứng: {str(e)}")

# =====================================================
# Helper function to get nested replies recursively
def get_nested_replies(parent_id: str):
    """Lấy nested replies một cách recursive"""
    try:
        supabase = get_supabase_client()
        
        # Lấy replies trực tiếp của parent_id
        result = supabase.table("comments")\
            .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
            .eq("parent_id", parent_id)\
            .eq("is_deleted", False)\
            .order("created_at")\
            .execute()
        
        nested_replies = []
        for reply_row in result.data:
            # Recursive call để lấy replies của reply này
            sub_replies = get_nested_replies(reply_row["id"])
            
            nested_replies.append(CommentResponse(
                id=str(reply_row["id"]),
                parent_id=str(reply_row["parent_id"]) if reply_row["parent_id"] else None,
                entity_type=reply_row["entity_type"],
                entity_id=reply_row["entity_id"],
                timeline_id=str(reply_row["timeline_id"]) if reply_row["timeline_id"] else None,
                user_id=str(reply_row["user_id"]) if reply_row["user_id"] else None,
                author_name=reply_row["author_name"],
                content=reply_row["content"],
                is_edited=reply_row["is_edited"],
                is_deleted=reply_row["is_deleted"],
                deleted_at=reply_row["deleted_at"],
                created_at=datetime.fromisoformat(reply_row["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(reply_row["updated_at"].replace('Z', '+00:00')),
                replies=sub_replies,
                reactions={},
                user_reaction=None
            ))
        
        return nested_replies
    except Exception as e:
        print(f"Error getting nested replies: {e}")
        return []

# PUBLIC ENDPOINTS (Không cần authentication)
# =====================================================

@router.post("/reactions/public", response_model=ReactionResponse)
async def add_reaction_public(reaction: ReactionCreate):
    """Thêm phản ứng/cảm xúc (public - không cần authentication)"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra emotion_type tồn tại
        emotion_result = supabase.table("emotion_types")\
            .select("*")\
            .eq("id", reaction.emotion_type_id)\
            .eq("is_active", True)\
            .execute()
        
        if not emotion_result.data:
            raise HTTPException(status_code=404, detail="Loại cảm xúc không tồn tại")
        
        emotion = emotion_result.data[0]
        
        # Tạo phản ứng mới (không có user_id cho public)
        reaction_data = {
            "id": str(uuid.uuid4()),
            "entity_type": reaction.entity_type,
            "entity_id": reaction.entity_id,
            "emotion_type_id": reaction.emotion_type_id,
            "user_id": None  # Public reaction không có user_id
        }
        
        result = supabase.table("user_reactions").insert(reaction_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Không thể tạo phản ứng")
        
        return ReactionResponse(
            id=str(result.data[0]["id"]),
            user_id=str(result.data[0]["user_id"]) if result.data[0]["user_id"] else "anonymous",
            entity_type=result.data[0]["entity_type"],
            entity_id=result.data[0]["entity_id"],
            emotion_type=EmotionTypeResponse(
                id=str(emotion["id"]),
                name=emotion["name"],
                display_name=emotion["display_name"],
                emoji=emotion["emoji"],
                color=emotion["color"],
                is_active=emotion["is_active"]
            ),
            created_at=datetime.fromisoformat(result.data[0]["created_at"].replace('Z', '+00:00'))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo phản ứng: {str(e)}")

@router.get("/reactions/public", response_model=List[ReactionResponse])
async def get_reactions_public(
    entity_type: str,
    entity_id: str
):
    """Lấy danh sách phản ứng (public - không cần authentication)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("user_reactions")\
            .select("*, emotion_types(*)")\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .order("created_at", desc=True)\
            .execute()
        
        reactions = []
        for row in result.data:
            emotion_data = row["emotion_types"]
            reactions.append(ReactionResponse(
                id=str(row["id"]),
                user_id=str(row["user_id"]) if row["user_id"] else "anonymous",
                entity_type=row["entity_type"],
                entity_id=row["entity_id"],
                emotion_type=EmotionTypeResponse(
                    id=str(emotion_data["id"]),
                    name=emotion_data["name"],
                    display_name=emotion_data["display_name"],
                    emoji=emotion_data["emoji"],
                    color=emotion_data["color"],
                    is_active=emotion_data["is_active"]
                ),
                created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00'))
            ))
        
        return reactions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy danh sách phản ứng: {str(e)}")

@router.post("/comments/public", response_model=CommentResponse)
async def add_comment_public(comment: CommentCreate):
    """Thêm bình luận (public - không cần authentication)"""
    try:
        supabase = get_supabase_client()
        
        # Tạo bình luận mới (không có user_id cho public)
        comment_data = {
            "id": str(uuid.uuid4()),
            "parent_id": comment.parent_id,
            "entity_type": comment.entity_type,
            "entity_id": comment.entity_id,
            "timeline_id": comment.timeline_id,
            "user_id": None,  # Public comment không có user_id
            "author_name": comment.author_name or "Khách hàng",  # Sử dụng tên từ input hoặc mặc định
            "content": comment.content
        }
        
        result = supabase.table("comments").insert(comment_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Không thể tạo bình luận")
        
        return CommentResponse(
            id=str(result.data[0]["id"]),
            parent_id=str(result.data[0]["parent_id"]) if result.data[0]["parent_id"] else None,
            entity_type=result.data[0]["entity_type"],
            entity_id=result.data[0]["entity_id"],
            timeline_id=str(result.data[0]["timeline_id"]) if result.data[0]["timeline_id"] else None,
            user_id=str(result.data[0]["user_id"]) if result.data[0]["user_id"] else None,
            author_name=result.data[0]["author_name"],
            content=result.data[0]["content"],
            is_edited=result.data[0]["is_edited"],
            is_deleted=result.data[0]["is_deleted"],
            deleted_at=result.data[0]["deleted_at"],
            created_at=datetime.fromisoformat(result.data[0]["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(result.data[0]["updated_at"].replace('Z', '+00:00')),
            replies=[],
            reactions={}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo bình luận: {str(e)}")

@router.get("/comments/public", response_model=List[CommentWithReplies])
async def get_comments_public(
    entity_type: str,
    entity_id: str
):
    """Lấy danh sách bình luận (public - không cần authentication)"""
    try:
        supabase = get_supabase_client()
        
        # Lấy tất cả bình luận gốc (parent_id IS NULL)
        result = supabase.table("comments")\
            .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .is_("parent_id", "null")\
            .eq("is_deleted", False)\
            .order("created_at", desc=True)\
            .execute()
        
        comments = []
        for row in result.data:
            # Lấy replies cho mỗi comment
            replies_result = supabase.table("comments")\
                .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
                .eq("parent_id", row["id"])\
                .eq("is_deleted", False)\
                .order("created_at")\
                .execute()
            
            replies = []
            for reply_row in replies_result.data:
                # Lấy nested replies cho mỗi reply (recursive)
                nested_replies = get_nested_replies(reply_row["id"])
                
                replies.append(CommentResponse(
                    id=str(reply_row["id"]),
                    parent_id=str(reply_row["parent_id"]) if reply_row["parent_id"] else None,
                    entity_type=reply_row["entity_type"],
                    entity_id=reply_row["entity_id"],
                    timeline_id=str(reply_row["timeline_id"]) if reply_row["timeline_id"] else None,
                    user_id=str(reply_row["user_id"]) if reply_row["user_id"] else None,
                    author_name=reply_row["author_name"],
                    content=reply_row["content"],
                    is_edited=reply_row["is_edited"],
                    is_deleted=reply_row["is_deleted"],
                    deleted_at=reply_row["deleted_at"],
                    created_at=datetime.fromisoformat(reply_row["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(reply_row["updated_at"].replace('Z', '+00:00')),
                    replies=nested_replies,
                    reactions={},
                    user_reaction=None
                ))
            
            # Lấy reactions cho comment
            reactions_result = supabase.table("user_reactions")\
                .select("emotion_type_id")\
                .eq("entity_type", "comment")\
                .eq("entity_id", row["id"])\
                .execute()
            
            reactions = {}
            for reaction_row in reactions_result.data:
                emotion_result = supabase.table("emotion_types")\
                    .select("name")\
                    .eq("id", reaction_row["emotion_type_id"])\
                    .execute()
                
                if emotion_result.data:
                    emotion_name = emotion_result.data[0]["name"]
                    reactions[emotion_name] = reactions.get(emotion_name, 0) + 1
            
            comment_data = CommentWithReplies(
                id=str(row["id"]),
                parent_id=str(row["parent_id"]) if row["parent_id"] else None,
                entity_type=row["entity_type"],
                entity_id=row["entity_id"],
                timeline_id=str(row["timeline_id"]) if row["timeline_id"] else None,
                user_id=str(row["user_id"]) if row["user_id"] else None,
                author_name=row["author_name"],
                content=row["content"],
                is_edited=row["is_edited"],
                is_deleted=row["is_deleted"],
                deleted_at=row["deleted_at"],
                created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00')),
                replies=replies,
                reactions=reactions,
                total_replies=len(replies),
                total_reactions=sum(reactions.values()),
                user_reaction=None
            )
            
            comments.append(comment_data)
        
        return comments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy danh sách bình luận: {str(e)}")
