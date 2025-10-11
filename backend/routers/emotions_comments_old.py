"""
API Router cho hệ thống cảm xúc và bình luận
Hỗ trợ cấu trúc nhánh cha con và phản ứng cảm xúc
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from services.supabase_client import get_supabase_client
from utils.auth import get_current_user

router = APIRouter(prefix="/api/emotions-comments", tags=["emotions-comments"])
security = HTTPBearer()

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
    entity_type: str = Field(..., regex="^(project|timeline_entry|invoice|expense|employee)$")
    entity_id: str

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
    entity_type: str = Field(..., regex="^(comment|timeline_entry|project|invoice|expense)$")
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
async def get_emotion_types(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả loại cảm xúc"""
    try:
        result = db.execute(text("""
            SELECT id, name, display_name, emoji, color, is_active
            FROM emotion_types
            WHERE is_active = true
            ORDER BY name
        """))
        
        emotion_types = []
        for row in result:
            emotion_types.append(EmotionTypeResponse(
                id=str(row.id),
                name=row.name,
                display_name=row.display_name,
                emoji=row.emoji,
                color=row.color,
                is_active=row.is_active
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
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo bình luận mới"""
    try:
        # Kiểm tra parent_id nếu có
        if comment.parent_id:
            parent_result = db.execute(text("""
                SELECT id FROM comments WHERE id = :parent_id AND is_deleted = false
            """), {"parent_id": comment.parent_id})
            if not parent_result.fetchone():
                raise HTTPException(status_code=404, detail="Bình luận cha không tồn tại")
        
        # Tạo bình luận mới
        comment_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO comments (id, parent_id, entity_type, entity_id, user_id, author_name, content)
            VALUES (:id, :parent_id, :entity_type, :entity_id, :user_id, :author_name, :content)
        """), {
            "id": comment_id,
            "parent_id": comment.parent_id,
            "entity_type": comment.entity_type,
            "entity_id": comment.entity_id,
            "user_id": current_user["id"],
            "author_name": current_user["full_name"],
            "content": comment.content
        })
        
        # Thêm mentions nếu có
        if comment.mentioned_user_ids:
            for mentioned_user_id in comment.mentioned_user_ids:
                db.execute(text("""
                    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
                    VALUES (:comment_id, :mentioned_user_id)
                """), {
                    "comment_id": comment_id,
                    "mentioned_user_id": mentioned_user_id
                })
        
        db.commit()
        
        # Lấy bình luận vừa tạo
        return await get_comment_by_id(comment_id, current_user, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo bình luận: {str(e)}")

@router.get("/comments/{entity_type}/{entity_id}", response_model=List[CommentWithReplies])
async def get_comments(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách bình luận cho một entity"""
    try:
        # Lấy tất cả bình luận gốc (parent_id IS NULL)
        result = db.execute(text("""
            SELECT c.*, 
                   COUNT(r.id) as reply_count,
                   COALESCE(SUM(ur_count.count), 0) as total_reactions
            FROM comments c
            LEFT JOIN comments r ON c.id = r.parent_id AND r.is_deleted = false
            LEFT JOIN (
                SELECT entity_id, COUNT(*) as count
                FROM user_reactions ur
                WHERE ur.entity_type = 'comment'
                GROUP BY entity_id
            ) ur_count ON c.id = ur_count.entity_id
            WHERE c.entity_type = :entity_type 
              AND c.entity_id = :entity_id 
              AND c.parent_id IS NULL 
              AND c.is_deleted = false
            GROUP BY c.id
            ORDER BY c.created_at DESC
        """), {"entity_type": entity_type, "entity_id": entity_id})
        
        comments = []
        for row in result:
            # Lấy replies cho mỗi comment
            replies = await get_comment_replies(str(row.id), current_user, db)
            
            # Lấy reactions cho comment
            reactions = await get_comment_reactions(str(row.id), db)
            
            # Lấy user reaction
            user_reaction = await get_user_reaction_for_comment(str(row.id), current_user["id"], db)
            
            comment_data = CommentWithReplies(
                id=str(row.id),
                parent_id=str(row.parent_id) if row.parent_id else None,
                entity_type=row.entity_type,
                entity_id=row.entity_id,
                user_id=str(row.user_id) if row.user_id else None,
                author_name=row.author_name,
                content=row.content,
                is_edited=row.is_edited,
                is_deleted=row.is_deleted,
                deleted_at=row.deleted_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
                replies=replies,
                total_replies=row.reply_count or 0,
                total_reactions=row.total_reactions or 0,
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
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật bình luận"""
    try:
        # Kiểm tra quyền sở hữu
        result = db.execute(text("""
            SELECT user_id FROM comments 
            WHERE id = :comment_id AND is_deleted = false
        """), {"comment_id": comment_id})
        
        comment = result.fetchone()
        if not comment:
            raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        
        if str(comment.user_id) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa bình luận này")
        
        # Cập nhật bình luận
        db.execute(text("""
            UPDATE comments 
            SET content = :content, is_edited = true, updated_at = NOW()
            WHERE id = :comment_id
        """), {
            "content": comment_update.content,
            "comment_id": comment_id
        })
        
        db.commit()
        
        return await get_comment_by_id(comment_id, current_user, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật bình luận: {str(e)}")

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa bình luận (soft delete)"""
    try:
        # Kiểm tra quyền sở hữu
        result = db.execute(text("""
            SELECT user_id FROM comments 
            WHERE id = :comment_id AND is_deleted = false
        """), {"comment_id": comment_id})
        
        comment = result.fetchone()
        if not comment:
            raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        
        if str(comment.user_id) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Không có quyền xóa bình luận này")
        
        # Soft delete
        db.execute(text("""
            UPDATE comments 
            SET is_deleted = true, deleted_at = NOW()
            WHERE id = :comment_id
        """), {"comment_id": comment_id})
        
        db.commit()
        
        return {"message": "Bình luận đã được xóa"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa bình luận: {str(e)}")

# =====================================================
# REACTIONS ENDPOINTS
# =====================================================

@router.post("/reactions", response_model=ReactionResponse)
async def add_reaction(
    reaction: ReactionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thêm phản ứng/cảm xúc"""
    try:
        # Kiểm tra emotion_type tồn tại
        emotion_result = db.execute(text("""
            SELECT * FROM emotion_types WHERE id = :emotion_type_id AND is_active = true
        """), {"emotion_type_id": reaction.emotion_type_id})
        
        emotion = emotion_result.fetchone()
        if not emotion:
            raise HTTPException(status_code=404, detail="Loại cảm xúc không tồn tại")
        
        # Xóa reaction cũ nếu có (một user chỉ có thể có một reaction trên một entity)
        db.execute(text("""
            DELETE FROM user_reactions 
            WHERE user_id = :user_id AND entity_type = :entity_type AND entity_id = :entity_id
        """), {
            "user_id": current_user["id"],
            "entity_type": reaction.entity_type,
            "entity_id": reaction.entity_id
        })
        
        # Thêm reaction mới
        reaction_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO user_reactions (id, user_id, entity_type, entity_id, emotion_type_id)
            VALUES (:id, :user_id, :entity_type, :entity_id, :emotion_type_id)
        """), {
            "id": reaction_id,
            "user_id": current_user["id"],
            "entity_type": reaction.entity_type,
            "entity_id": reaction.entity_id,
            "emotion_type_id": reaction.emotion_type_id
        })
        
        db.commit()
        
        # Trả về reaction vừa tạo
        return ReactionResponse(
            id=reaction_id,
            user_id=current_user["id"],
            entity_type=reaction.entity_type,
            entity_id=reaction.entity_id,
            emotion_type=EmotionTypeResponse(
                id=str(emotion.id),
                name=emotion.name,
                display_name=emotion.display_name,
                emoji=emotion.emoji,
                color=emotion.color,
                is_active=emotion.is_active
            ),
            created_at=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm phản ứng: {str(e)}")

@router.delete("/reactions/{entity_type}/{entity_id}")
async def remove_reaction(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa phản ứng/cảm xúc"""
    try:
        result = db.execute(text("""
            DELETE FROM user_reactions 
            WHERE user_id = :user_id AND entity_type = :entity_type AND entity_id = :entity_id
            RETURNING id
        """), {
            "user_id": current_user["id"],
            "entity_type": entity_type,
            "entity_id": entity_id
        })
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy phản ứng để xóa")
        
        db.commit()
        
        return {"message": "Phản ứng đã được xóa"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa phản ứng: {str(e)}")

# =====================================================
# HELPER FUNCTIONS
# =====================================================

async def get_comment_by_id(comment_id: str, current_user: dict, db: Session) -> CommentResponse:
    """Lấy bình luận theo ID"""
    result = db.execute(text("""
        SELECT * FROM comments WHERE id = :comment_id
    """), {"comment_id": comment_id})
    
    comment = result.fetchone()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
    
    # Lấy replies
    replies = await get_comment_replies(comment_id, current_user, db)
    
    # Lấy reactions
    reactions = await get_comment_reactions(comment_id, db)
    
    # Lấy user reaction
    user_reaction = await get_user_reaction_for_comment(comment_id, current_user["id"], db)
    
    return CommentResponse(
        id=str(comment.id),
        parent_id=str(comment.parent_id) if comment.parent_id else None,
        entity_type=comment.entity_type,
        entity_id=comment.entity_id,
        user_id=str(comment.user_id) if comment.user_id else None,
        author_name=comment.author_name,
        content=comment.content,
        is_edited=comment.is_edited,
        is_deleted=comment.is_deleted,
        deleted_at=comment.deleted_at,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=replies,
        reactions=reactions,
        user_reaction=user_reaction
    )

async def get_comment_replies(comment_id: str, current_user: dict, db: Session) -> List[CommentResponse]:
    """Lấy danh sách replies của một comment"""
    result = db.execute(text("""
        SELECT * FROM comments 
        WHERE parent_id = :comment_id AND is_deleted = false
        ORDER BY created_at ASC
    """), {"comment_id": comment_id})
    
    replies = []
    for row in result:
        # Lấy reactions cho reply
        reactions = await get_comment_reactions(str(row.id), db)
        
        # Lấy user reaction
        user_reaction = await get_user_reaction_for_comment(str(row.id), current_user["id"], db)
        
        reply = CommentResponse(
            id=str(row.id),
            parent_id=str(row.parent_id) if row.parent_id else None,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            user_id=str(row.user_id) if row.user_id else None,
            author_name=row.author_name,
            content=row.content,
            is_edited=row.is_edited,
            is_deleted=row.is_deleted,
            deleted_at=row.deleted_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
            replies=[],  # Không lấy nested replies để tránh vòng lặp vô hạn
            reactions=reactions,
            user_reaction=user_reaction
        )
        replies.append(reply)
    
    return replies

async def get_comment_reactions(comment_id: str, db: Session) -> Dict[str, int]:
    """Lấy tổng hợp reactions của một comment"""
    result = db.execute(text("""
        SELECT et.name, COUNT(ur.id) as count
        FROM user_reactions ur
        JOIN emotion_types et ON ur.emotion_type_id = et.id
        WHERE ur.entity_type = 'comment' AND ur.entity_id = :comment_id
        GROUP BY et.name
    """), {"comment_id": comment_id})
    
    reactions = {}
    for row in result:
        reactions[row.name] = row.count
    
    return reactions

async def get_user_reaction_for_comment(comment_id: str, user_id: str, db: Session) -> Optional[str]:
    """Lấy reaction của user cho một comment"""
    result = db.execute(text("""
        SELECT et.name
        FROM user_reactions ur
        JOIN emotion_types et ON ur.emotion_type_id = et.id
        WHERE ur.entity_type = 'comment' AND ur.entity_id = :comment_id AND ur.user_id = :user_id
    """), {"comment_id": comment_id, "user_id": user_id})
    
    row = result.fetchone()
    return row.name if row else None
