"""
Task Management Router
Handles CRUD operations for tasks, task groups, assignments, and notifications
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import re
import logging
import unicodedata
import os

logger = logging.getLogger(__name__)

from models.task import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskGroup,
    TaskGroupCreate,
    TaskGroupUpdate,
    TaskGroupMember,
    TaskGroupMemberAdd,
    TaskAssignment,
    TaskComment,
    TaskCommentCreate,
    TaskCommentUpdate,
    TaskAttachment,
    TaskNotification,
    TaskResponse,
    TaskChecklist,
    TaskChecklistCreate,
    TaskChecklistUpdate,
    TaskChecklistItem,
    TaskChecklistItemCreate,
    TaskChecklistItemUpdate,
    TaskTimeLog,
    TaskTimeLogStart,
    TaskTimeLogStop,
    TaskParticipant,
    TaskParticipantCreate,
    TaskParticipantUpdate,
    TaskParticipantRole,
    TaskNote,
    TaskNoteCreate,
    TaskNoteUpdate,
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client
from services.file_upload_service import get_file_upload_service
from services.task_cleanup_service import task_cleanup_service

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/run-migration")
async def run_accountable_person_migration(current_user: User = Depends(require_manager_or_admin)):
    """Run migration to add accountable_person column to tasks table"""
    try:
        supabase = get_supabase_client()

        # SQL to add accountable_person column
        sql = """
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS accountable_person UUID REFERENCES employees(id) ON DELETE SET NULL;

        CREATE INDEX IF NOT EXISTS idx_tasks_accountable_person ON tasks(accountable_person);

        COMMENT ON COLUMN tasks.accountable_person IS 'Employee responsible for overseeing task completion';
        """

        # Execute SQL directly (this might not work with Supabase, but let's try)
        # For Supabase, we might need to run this manually in the dashboard
        # For now, return the SQL that needs to be executed

        return {
            "message": "Migration SQL prepared. Please execute this SQL in Supabase dashboard:",
            "sql": sql.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare migration: {str(e)}"
        )


def _parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value)


def _calculate_duration_minutes(start: datetime, end: Optional[datetime]) -> int:
    if not end:
        end = datetime.now(timezone.utc)
    duration = (end - start).total_seconds() / 60
    return max(0, int(duration))


def _recalculate_task_time_spent(supabase, task_id: str) -> None:
    logs_result = supabase.table("task_time_logs").select("start_time, end_time").eq("task_id", task_id).execute()
    total_minutes = 0
    for log in logs_result.data or []:
        start_dt = _parse_iso_datetime(log.get("start_time"))
        end_dt = _parse_iso_datetime(log.get("end_time"))
        if start_dt and end_dt:
            total_minutes += _calculate_duration_minutes(start_dt, end_dt)
    supabase.table("tasks").update({"time_spent": total_minutes}).eq("id", task_id).execute()


def _fetch_task_checklists(supabase, task_id: str) -> List[TaskChecklist]:
    checklists_result = supabase.table("task_checklists").select("*").eq("task_id", task_id).order("created_at", desc=False).execute()
    checklists = checklists_result.data or []
    checklist_ids = [checklist["id"] for checklist in checklists]
    items_map = {cid: [] for cid in checklist_ids}

    if checklist_ids:
        items_result = (
            supabase.table("task_checklist_items")
            .select("""
                *,
                employees:assignee_id(id, first_name, last_name)
            """)
            .in_("checklist_id", checklist_ids)
            .order("sort_order", desc=False)
            .order("created_at", desc=False)
            .execute()
        )
        item_ids = [item["id"] for item in items_result.data or []]
        
        # Fetch assignments for all items
        assignments_map = {}
        if item_ids:
            assignments_result = (
                supabase.table("task_checklist_item_assignments")
                .select("""
                    *,
                    employees:employee_id(id, first_name, last_name)
                """)
                .in_("checklist_item_id", item_ids)
                .execute()
            )
            for assignment in assignments_result.data or []:
                item_id = assignment["checklist_item_id"]
                if item_id not in assignments_map:
                    assignments_map[item_id] = []
                employee = assignment.get("employees")
                assignment_data = {
                    "employee_id": assignment["employee_id"],
                    "responsibility_type": assignment["responsibility_type"]
                }
                if employee:
                    assignment_data["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                assignments_map[item_id].append(assignment_data)
        
        for item in items_result.data or []:
            employee = item.get("employees")
            if employee:
                item["assignee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            # Add assignments to item
            item["assignments"] = assignments_map.get(item["id"], [])
            items_map.setdefault(item["checklist_id"], []).append(item)

    enriched_checklists = []
    for checklist in checklists:
        items = items_map.get(checklist["id"], [])
        checklist["items"] = items
        if items:
            completed_items = len([item for item in items if item.get("is_completed")])
            checklist["progress"] = round(completed_items / len(items), 2)
        else:
            checklist["progress"] = 0.0
        enriched_checklists.append(checklist)

    return enriched_checklists


def _fetch_task_time_logs(supabase, task_id: str) -> List[TaskTimeLog]:
    logs_result = (
        supabase.table("task_time_logs")
        .select("*")
        .eq("task_id", task_id)
        .order("start_time", desc=False)
        .execute()
    )

    enriched_logs = []
    if logs_result.data:
        # Get all unique user_ids from logs
        user_ids = [log.get("user_id") for log in logs_result.data if log.get("user_id")]
        user_ids = list(set(user_ids))  # Remove duplicates
        
        # Fetch all users at once to avoid N+1 queries
        user_map = {}
        if user_ids:
            try:
                users_result = supabase.table("users").select("id, full_name").in_("id", user_ids).execute()
                if users_result.data:
                    user_map = {user["id"]: user.get("full_name") for user in users_result.data}
            except Exception:
                pass  # If users query fails, continue without user names
        
        # Enrich logs with user names
        for log in logs_result.data:
            user_id = log.get("user_id")
            if user_id and user_id in user_map:
                log["user_name"] = user_map[user_id]
            
            start_dt = _parse_iso_datetime(log.get("start_time"))
            end_dt = _parse_iso_datetime(log.get("end_time"))
            if start_dt:
                log["duration_minutes"] = _calculate_duration_minutes(start_dt, end_dt)
            enriched_logs.append(log)
    
    return enriched_logs


def _fetch_task_participants(supabase, task_id: str) -> List[TaskParticipant]:
    participants_result = (
        supabase.table("task_participants")
        .select("""
            *,
            employees:employee_id(id, first_name, last_name)
        """)
        .eq("task_id", task_id)
        .order("created_at", desc=False)
        .execute()
    )

    participants = []
    for participant in participants_result.data or []:
        # Try to get employee name from join first
        employee = participant.get("employees")
        if employee:
            # Handle both array and object responses
            if isinstance(employee, list):
                employee = employee[0] if employee else None
            
            if employee:
                participant["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
        
        # If join didn't work, query directly
        if not participant.get("employee_name") and participant.get("employee_id"):
            try:
                emp_result = supabase.table("employees").select("first_name, last_name").eq("id", participant.get("employee_id")).single().execute()
                if emp_result.data:
                    emp_data = emp_result.data
                    participant["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
            except Exception:
                # Employee not found or query failed
                pass
        
        participants.append(participant)
    return participants


def _fetch_task_notes(supabase, task_id: str, current_user_id: Optional[str] = None) -> List[TaskNote]:
    """Fetch task notes with visibility filtering based on user permissions"""
    notes_result = (
        supabase.table("task_notes")
        .select("*")
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .execute()
    )
    
    # Get all unique created_by user_ids from notes
    user_map = {}
    if notes_result.data:
        user_ids = [note.get("created_by") for note in notes_result.data if note.get("created_by")]
        user_ids = list(set(user_ids))  # Remove duplicates
        
        # Fetch all users at once to avoid N+1 queries
        if user_ids:
            try:
                users_result = supabase.table("users").select("id, full_name").in_("id", user_ids).execute()
                if users_result.data:
                    user_map = {user["id"]: user.get("full_name") for user in users_result.data}
            except Exception:
                pass  # If users query fails, continue without user names
    
    if not current_user_id:
        # If no user context, return all notes (for internal use)
        notes = []
        for note in notes_result.data or []:
            created_by = note.get("created_by")
            if created_by and created_by in user_map:
                note["created_by_name"] = user_map[created_by]
            notes.append(note)
        return notes
    
    # Get task details to know group_id
    task_result = supabase.table("tasks").select("id, group_id").eq("id", task_id).single().execute()
    if not task_result.data:
        return []
    
    task = task_result.data
    group_id = task.get("group_id")
    
    # Get task participants
    participants_result = (
        supabase.table("task_participants")
        .select("employee_id")
        .eq("task_id", task_id)
        .execute()
    )
    participant_ids = {p["employee_id"] for p in (participants_result.data or [])}
    
    # Get group members if group exists
    group_member_ids = set()
    if group_id:
        members_result = (
            supabase.table("task_group_members")
            .select("employee_id")
            .eq("group_id", group_id)
            .execute()
        )
        group_member_ids = {m["employee_id"] for m in (members_result.data or [])}
    
    # Filter notes based on visibility
    filtered_notes = []
    for note in notes_result.data or []:
        created_by = note.get("created_by")
        if created_by and created_by in user_map:
            note["created_by_name"] = user_map[created_by]
        
        visibility = note.get("visibility", "task")
        
        # Private notes: only creator can see
        if visibility == "private":
            if current_user_id == created_by:
                filtered_notes.append(note)
        
        # Task notes: all participants can see
        elif visibility == "task":
            if current_user_id in participant_ids or current_user_id == created_by:
                filtered_notes.append(note)
        
        # Group notes: all group members can see
        elif visibility == "group":
            if current_user_id in group_member_ids or current_user_id == created_by:
                filtered_notes.append(note)
    
    return filtered_notes

@router.get("/groups", response_model=List[TaskGroup])
async def get_task_groups(
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category_id: Optional[str] = Query(None, description="Filter by project category ID")
):
    """Get all task groups, optionally filtered by active status or category_id"""
    try:
        supabase = get_supabase_client()
        
        # Join với project_categories để lấy name/description (Single Source of Truth)
        query = supabase.table("task_groups").select("""
            *,
            project_categories:category_id(
                id,
                name,
                code,
                description,
                color,
                icon,
                display_order
            )
        """)
        
        # Filter out deleted groups
        query = query.is_("deleted_at", "null")
        
        if is_active is not None:
            query = query.eq("is_active", is_active)
        
        if category_id is not None:
            query = query.eq("category_id", category_id)
        
        result = query.order("created_at", desc=True).execute()
        
        groups = []
        for group in result.data or []:
            # Get member count
            member_count = supabase.table("task_group_members").select("id", count="exact").eq("group_id", group["id"]).execute()
            group["member_count"] = member_count.count if hasattr(member_count, 'count') else 0
            
            # Nếu có category, lấy name/description từ category
            if group.get("project_categories"):
                category = group["project_categories"]
                group["category_name"] = category.get("name")
                group["category_description"] = category.get("description")
                group["category_color"] = category.get("color")
                group["category_icon"] = category.get("icon")
                # Nếu task_group không có name, dùng name từ category
                if not group.get("name") and category.get("name"):
                    group["name"] = category.get("name")
                if not group.get("description") and category.get("description"):
                    group["description"] = category.get("description")
            
            groups.append(group)
        
        return groups
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task groups: {str(e)}"
        )

@router.post("/groups", response_model=TaskGroup)
async def create_task_group(
    group_data: TaskGroupCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new task group"""
    try:
        supabase = get_supabase_client()
        
        # Create group
        group_record = {
            "name": group_data.name,
            "description": group_data.description,
            "created_by": current_user.id,
            "is_active": True,
            "avatar_url": group_data.avatar_url,
            "color": group_data.color
        }
        
        result = supabase.table("task_groups").insert(group_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create task group"
            )
        
        group = result.data[0]
        
        # Move avatar from temp location to group's avatar folder if needed
        if group_data.avatar_url and "Groups/Temp" in group_data.avatar_url:
            try:
                # Extract file path from URL
                # URL format: https://...supabase.co/storage/v1/object/public/minhchung_chiphi/Groups/Temp/{uuid}/{filename}
                # We need to extract: Groups/Temp/{uuid}/{filename}
                avatar_url = group_data.avatar_url
                if "/storage/v1/object/public/" in avatar_url:
                    # Extract path after bucket name
                    path_start = avatar_url.find("/storage/v1/object/public/minhchung_chiphi/")
                    if path_start != -1:
                        old_path = avatar_url[path_start + len("/storage/v1/object/public/minhchung_chiphi/"):]
                        
                        # Get file extension
                        file_ext = old_path.rsplit('.', 1)[1] if '.' in old_path else 'jpg'
                        
                        # New path: Groups/{group_id}/avatar/avatar.{ext}
                        new_path = f"Groups/{group['id']}/avatar/avatar.{file_ext}"
                        
                        # Download file from old location
                        supabase_storage = get_supabase_client()
                        old_file_data = supabase_storage.storage.from_("minhchung_chiphi").download(old_path)
                        
                        if old_file_data:
                            # Upload to new location
                            upload_result = supabase_storage.storage.from_("minhchung_chiphi").upload(
                                new_path,
                                old_file_data,
                                file_options={"content-type": "image/jpeg", "upsert": "true"}
                            )
                            
                            if not (hasattr(upload_result, 'error') and upload_result.error):
                                # Get new public URL
                                new_url_result = supabase_storage.storage.from_("minhchung_chiphi").get_public_url(new_path)
                                new_url = new_url_result if isinstance(new_url_result, str) else new_url_result.get("publicUrl", "")
                                
                                # Update group with new avatar URL
                                supabase.table("task_groups").update({"avatar_url": new_url}).eq("id", group["id"]).execute()
                                group["avatar_url"] = new_url
                                
                                # Delete old file
                                try:
                                    supabase_storage.storage.from_("minhchung_chiphi").remove([old_path])
                                except Exception:
                                    pass  # Ignore delete errors
            except Exception as e:
                logger.warning(f"Failed to move avatar from temp location: {str(e)}")
                # Continue with original avatar_url
        
        # Get creator's employee_id from user_id
        creator_employee_id = None
        try:
            emp_result = supabase.table("employees").select("id").eq("user_id", current_user.id).limit(1).execute()
            if emp_result.data and len(emp_result.data) > 0:
                creator_employee_id = emp_result.data[0]["id"]
        except Exception:
            pass  # Creator might not have an employee record
        
        # Add members if provided
        if group_data.member_ids:
            members = []
            for employee_id in group_data.member_ids:
                # Skip if this is the creator (will be added as owner)
                if creator_employee_id and employee_id == creator_employee_id:
                    continue
                members.append({
                    "group_id": group["id"],
                    "employee_id": employee_id,
                    "role": "member",
                    "added_by": current_user.id
                })
            
            if members:
                supabase.table("task_group_members").insert(members).execute()
        
        # Add creator as owner (if they have an employee record)
        if creator_employee_id:
            try:
                supabase.table("task_group_members").insert({
                    "group_id": group["id"],
                    "employee_id": creator_employee_id,
                    "role": "owner",
                    "added_by": current_user.id
                }).execute()
            except Exception:
                pass  # Ignore if already added or error
        
        # Calculate member count
        member_count_result = supabase.table("task_group_members").select("id", count="exact").eq("group_id", group["id"]).execute()
        group["member_count"] = member_count_result.count if hasattr(member_count_result, 'count') else (len(group_data.member_ids) if group_data.member_ids else 0)
        
        return group
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task group: {str(e)}"
        )

@router.get("/groups/{group_id}", response_model=TaskGroup)
async def get_task_group(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a task group by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("task_groups").select("*").eq("id", group_id).is_("deleted_at", "null").execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task group not found"
            )
        
        group = result.data[0]
        
        # Get member count
        member_count = supabase.table("task_group_members").select("id", count="exact").eq("group_id", group_id).execute()
        group["member_count"] = member_count.count if hasattr(member_count, 'count') else 0
        
        return group
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task group: {str(e)}"
        )

@router.put("/groups/{group_id}", response_model=TaskGroup)
async def update_task_group(
    group_id: str,
    group_data: TaskGroupUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a task group"""
    try:
        supabase = get_supabase_client()
        
        update_data = {}
        if group_data.name is not None:
            update_data["name"] = group_data.name
        if group_data.description is not None:
            update_data["description"] = group_data.description
        if group_data.is_active is not None:
            update_data["is_active"] = group_data.is_active
        if group_data.avatar_url is not None:
            update_data["avatar_url"] = group_data.avatar_url
        if group_data.color is not None:
            update_data["color"] = group_data.color
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = supabase.table("task_groups").update(update_data).eq("id", group_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task group not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task group: {str(e)}"
        )

@router.delete("/groups/{group_id}")
async def delete_task_group(
    group_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Soft delete a task group (can be restored within 24 hours)"""
    try:
        supabase = get_supabase_client()
        
        # Check if group exists and not already deleted
        result = supabase.table("task_groups").select("id").eq("id", group_id).is_("deleted_at", "null").execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task group not found or already deleted"
            )
        
        # Get all tasks in this group to delete their files
        tasks_result = supabase.table("tasks").select("id").eq("group_id", group_id).is_("deleted_at", "null").execute()
        tasks = tasks_result.data or []
        
        # Delete all files from group folder (avatar + all task files)
        upload_service = get_file_upload_service()
        supabase_storage = get_supabase_client()
        
        # Delete avatar if exists
        try:
            # Try to delete avatar (may not exist)
            avatar_path = f"Groups/{group_id}/avatar/avatar.jpg"
            await upload_service.delete_file(avatar_path)
        except Exception:
            try:
                avatar_path = f"Groups/{group_id}/avatar/avatar.png"
                await upload_service.delete_file(avatar_path)
            except Exception:
                pass  # Avatar may not exist
        
        # Delete all task files
        for task in tasks:
            task_id = task["id"]
            # Get attachments for this task
            attachments_result = supabase.table("task_attachments").select("file_name").eq("task_id", task_id).execute()
            attachments = attachments_result.data or []
            
            for attachment in attachments:
                try:
                    file_path = f"Groups/{group_id}/Tasks/{task_id}/{attachment['file_name']}"
                    await upload_service.delete_file(file_path)
                except Exception as e:
                    logger.warning(f"Failed to delete task file {attachment['file_name']}: {str(e)}")
        
        # Soft delete all tasks in this group
        supabase.table("tasks").update({
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }).eq("group_id", group_id).is_("deleted_at", "null").execute()
        
        # Soft delete group (set deleted_at)
        supabase.table("task_groups").update({
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", group_id).execute()
        
        return {"message": "Task group deleted successfully. Can be restored within 24 hours."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task group: {str(e)}"
        )

@router.get("/groups/{group_id}/members", response_model=List[TaskGroupMember])
async def get_group_members(
    group_id: str,
    project_id: Optional[str] = Query(None, description="Project ID to get team members from"),
    current_user: User = Depends(get_current_user)
):
    """Get members of a task group, enriched with project team information"""
    try:
        supabase = get_supabase_client()
        
        # Get project_id if not provided - try to get from first task in group
        if not project_id:
            try:
                task_result = supabase.table("tasks").select("project_id").eq("group_id", group_id).is_("deleted_at", "null").limit(1).execute()
                if task_result.data and len(task_result.data) > 0:
                    project_id = task_result.data[0].get("project_id")
            except Exception:
                pass  # Continue without project_id
        
        # Get task group members
        result = supabase.table("task_group_members").select("""
            *,
            employees:employee_id(id, first_name, last_name, email, user_id)
        """).eq("group_id", group_id).execute()
        
        # Get project team members if project_id is available
        project_team_map = {}
        if project_id:
            try:
                # Get all project team members for this project
                team_result = supabase.table("project_team").select("""
                    *,
                    employees:user_id(id, first_name, last_name, email)
                """).eq("project_id", project_id).eq("status", "active").execute()
                
                # Create a map: user_id -> project_team member
                for team_member in team_result.data or []:
                    # Get user_id from employees table
                    employee = team_member.get("employees")
                    if employee:
                        if isinstance(employee, list):
                            employee = employee[0] if employee else None
                        if employee and employee.get("id"):
                            # Map by employee_id
                            project_team_map[employee.get("id")] = team_member
                    # Also try direct user_id if available
                    if team_member.get("user_id"):
                        # Try to find employee by user_id
                        try:
                            emp_result = supabase.table("employees").select("id").eq("user_id", team_member.get("user_id")).limit(1).execute()
                            if emp_result.data and len(emp_result.data) > 0:
                                emp_id = emp_result.data[0].get("id")
                                project_team_map[emp_id] = team_member
                        except Exception:
                            pass
            except Exception as e:
                logger.warning(f"Failed to fetch project team members: {str(e)}")
        
        members = []
        for member in result.data or []:
            employee_id = member.get("employee_id")
            
            # Try to get employee name from join first
            employee = member.get("employees")
            if employee:
                # Handle both array and object responses
                if isinstance(employee, list):
                    employee = employee[0] if employee else None
                
                if employee:
                    member["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                    member["employee_email"] = employee.get("email")
            
            # If join didn't work, query directly
            if not member.get("employee_name") and employee_id:
                try:
                    emp_result = supabase.table("employees").select("first_name, last_name, email, user_id").eq("id", employee_id).single().execute()
                    if emp_result.data:
                        emp_data = emp_result.data
                        member["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                        member["employee_email"] = emp_data.get("email")
                except Exception:
                    # Employee not found or query failed
                    pass
            
            # Enrich with project team information
            if employee_id and employee_id in project_team_map:
                team_member = project_team_map[employee_id]
                # Use responsibility_type from project_team (priority over role)
                member["responsibility_type"] = team_member.get("responsibility_type")
                member["avatar"] = team_member.get("avatar")
                member["phone"] = team_member.get("phone")
                member["status"] = team_member.get("status")
                # Keep role from task_group_members as fallback
                if not member.get("responsibility_type"):
                    member["responsibility_type"] = None
            
            members.append(member)
        
        return members
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch group members: {str(e)}"
        )

@router.post("/groups/{group_id}/members", response_model=TaskGroupMember)
async def add_group_member(
    group_id: str,
    member_data: TaskGroupMemberAdd,
    current_user: User = Depends(get_current_user)
):
    """Add a member to a task group"""
    try:
        supabase = get_supabase_client()
        
        member_record = {
            "group_id": group_id,
            "employee_id": member_data.employee_id,
            "role": member_data.role,
            "added_by": current_user.id
        }
        
        result = supabase.table("task_group_members").insert(member_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add member"
            )
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add member: {str(e)}"
        )

@router.delete("/groups/{group_id}/members/{member_id}")
async def remove_group_member(
    group_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a member from a task group and sync with project_team"""
    try:
        supabase = get_supabase_client()
        
        # Get the member record before deleting to get employee_id
        member_result = supabase.table("task_group_members").select("employee_id").eq("id", member_id).eq("group_id", group_id).single().execute()
        
        if not member_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group member not found"
            )
        
        employee_id = member_result.data.get("employee_id")
        
        # Get task group to find project_id
        group_result = supabase.table("task_groups").select("category_id").eq("id", group_id).single().execute()
        category_id = group_result.data.get("category_id") if group_result.data else None
        
        # Get project_id from category or from tasks in this group
        project_id = None
        if category_id:
            # Try to get project_id from projects that use this category
            project_result = supabase.table("projects").select("id").eq("category_id", category_id).limit(1).execute()
            if project_result.data:
                project_id = project_result.data[0].get("id")
        
        # If still no project_id, try to get from tasks in this group
        if not project_id:
            task_result = supabase.table("tasks").select("project_id").eq("group_id", group_id).is_("deleted_at", "null").limit(1).execute()
            if task_result.data:
                project_id = task_result.data[0].get("project_id")
        
        # Delete from task_group_members
        supabase.table("task_group_members").delete().eq("id", member_id).eq("group_id", group_id).execute()
        
        # If employee_id and project_id are available, check if member is still in other task groups of this project
        if employee_id and project_id:
            try:
                # Get all task groups in this project
                if category_id:
                    # Get all groups with same category
                    all_groups_result = supabase.table("task_groups").select("id").eq("category_id", category_id).execute()
                    all_group_ids = [g["id"] for g in (all_groups_result.data or [])]
                else:
                    # Get all groups from tasks in this project
                    tasks_result = supabase.table("tasks").select("group_id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                    all_group_ids = list(set([t.get("group_id") for t in (tasks_result.data or []) if t.get("group_id")]))
                
                # Check if employee is still in any other task group of this project
                if all_group_ids:
                    remaining_members = supabase.table("task_group_members").select("id").in_("group_id", all_group_ids).eq("employee_id", employee_id).execute()
                    
                    # If not in any other task group, remove from project_team
                    if not remaining_members.data or len(remaining_members.data) == 0:
                        # Get user_id from employee
                        emp_result = supabase.table("employees").select("user_id").eq("id", employee_id).limit(1).execute()
                        if emp_result.data and emp_result.data[0].get("user_id"):
                            user_id = emp_result.data[0].get("user_id")
                            # Remove from project_team
                            supabase.table("project_team").delete().eq("project_id", project_id).eq("user_id", user_id).execute()
            except Exception as sync_err:
                # Log but do not fail delete
                logger.warning(f"Failed to sync with project_team when removing group member: {str(sync_err)}")
        
        return {"message": "Member removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove member: {str(e)}"
        )

# ==================== Tasks ====================

@router.get("", response_model=List[Task])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by status"),
    group_id: Optional[str] = Query(None, description="Filter by group"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned employee"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    project_id: Optional[str] = Query(None, description="Filter by project")
):
    """Get all tasks with filters"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("tasks").select("""
            *,
            employees:assigned_to(id, first_name, last_name),
            users:created_by(id, full_name),
            task_groups:group_id(id, name),
            projects:project_id(id, name)
        """)
        
        # Filter out deleted tasks
        query = query.is_("deleted_at", "null")
        
        if status:
            query = query.eq("status", status)
        if group_id:
            query = query.eq("group_id", group_id)
        if assigned_to:
            query = query.eq("assigned_to", assigned_to)
        if priority:
            query = query.eq("priority", priority)
        if project_id:
            query = query.eq("project_id", project_id)
        
        result = query.order("created_at", desc=True).execute()
        
        tasks = []
        for task in result.data or []:
            # Process assigned_to
            employee = task.get("employees")
            if employee:
                task["assigned_to_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            
            # Process created_by
            user = task.get("users")
            if user:
                task["created_by_name"] = user.get("full_name")
            
            # Process group
            group = task.get("task_groups")
            if group:
                task["group_name"] = group.get("name")
            
            # Process project
            project = task.get("projects")
            if project:
                task["project_name"] = project.get("name")
            
            # Get comment and attachment counts
            comment_count = supabase.table("task_comments").select("id", count="exact").eq("task_id", task["id"]).execute()
            task["comment_count"] = comment_count.count if hasattr(comment_count, 'count') else 0
            
            attachment_count = supabase.table("task_attachments").select("id", count="exact").eq("task_id", task["id"]).execute()
            task["attachment_count"] = attachment_count.count if hasattr(attachment_count, 'count') else 0

            assignment_count = supabase.table("task_assignments").select("id", count="exact").eq("task_id", task["id"]).execute()
            task["assignee_count"] = assignment_count.count if hasattr(assignment_count, 'count') else 0
            
            # Get checklists with items
            checklists = _fetch_task_checklists(supabase, task["id"])
            task["checklists"] = checklists
            
            tasks.append(task)
        
        return tasks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tasks: {str(e)}"
        )

@router.get("/deleted", response_model=List[Task])
async def get_deleted_tasks(
    current_user: User = Depends(get_current_user)
):
    """Get all deleted tasks that can still be restored (within 24 hours)"""
    try:
        supabase = get_supabase_client()
        from datetime import timedelta
        
        # Calculate cutoff time (24 hours ago)
        cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        
        # Get tasks that are deleted but within 24 hours
        query = supabase.table("tasks").select("""
            *,
            employees:assigned_to(id, first_name, last_name),
            users:created_by(id, full_name),
            task_groups:group_id(id, name),
            projects:project_id(id, name)
        """)
        
        # Get deleted tasks within 24 hours
        query = query.not_.is_("deleted_at", "null").gte("deleted_at", cutoff_time)
        
        result = query.order("deleted_at", desc=True).execute()
        
        tasks = []
        for task in result.data or []:
            # Process assigned_to
            employee = task.get("employees")
            if employee:
                task["assigned_to_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            
            # Process created_by
            user = task.get("users")
            if user:
                task["created_by_name"] = user.get("full_name")
            
            # Process group
            group = task.get("task_groups")
            if group:
                task["group_name"] = group.get("name")
            
            # Process project
            project = task.get("projects")
            if project:
                task["project_name"] = project.get("name")
            
            # Calculate time remaining for restoration
            deleted_at = datetime.fromisoformat(task["deleted_at"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            hours_remaining = 24 - ((now - deleted_at).total_seconds() / 3600)
            task["restore_hours_remaining"] = max(0, round(hours_remaining, 1))
            
            tasks.append(task)
        
        return tasks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch deleted tasks: {str(e)}"
        )

@router.get("/groups/deleted", response_model=List[TaskGroup])
async def get_deleted_task_groups(
    current_user: User = Depends(get_current_user)
):
    """Get all deleted task groups that can still be restored (within 24 hours)"""
    try:
        supabase = get_supabase_client()
        from datetime import timedelta
        
        # Calculate cutoff time (24 hours ago)
        cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        
        # Get groups that are deleted but within 24 hours
        query = supabase.table("task_groups").select("*")
        query = query.not_.is_("deleted_at", "null").gte("deleted_at", cutoff_time)
        
        result = query.order("deleted_at", desc=True).execute()
        
        groups = []
        for group in result.data or []:
            # Get member count
            member_count = supabase.table("task_group_members").select("id", count="exact").eq("group_id", group["id"]).execute()
            group["member_count"] = member_count.count if hasattr(member_count, 'count') else 0
            
            # Calculate time remaining for restoration
            deleted_at = datetime.fromisoformat(group["deleted_at"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            hours_remaining = 24 - ((now - deleted_at).total_seconds() / 3600)
            group["restore_hours_remaining"] = max(0, round(hours_remaining, 1))
            
            groups.append(group)
        
        return groups
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch deleted task groups: {str(e)}"
        )

@router.post("", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new task"""
    try:
        supabase = get_supabase_client()

        # ===== Permission check: only project owners/managers can create tasks =====
        # Admin / accountant can always create
        user_role = (current_user.role or "").lower()
        if user_role not in ["admin", "accountant"]:
            if not task_data.project_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="project_id is required to create task"
                )
            # Check project_team role
            team_result = (
                supabase.table("project_team")
                .select("role")
                .eq("project_id", task_data.project_id)
                .eq("status", "active")
                .eq("user_id", current_user.id)
                .limit(1)
                .execute()
            )
            if not team_result.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không có quyền tạo nhiệm vụ trong dự án này"
                )
            team_role = (team_result.data[0].get("role") or "").lower()
            # Allowed roles: owner/manager/lead (tùy tên vai trò thực tế)
            allowed_roles = [
                "owner",
                "manager",
                "lead",
                "project manager",
                "quản lý dự án",
                "người phụ trách",
                "người tạo"
            ]
            if team_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Chỉ người phụ trách/owner mới được tạo nhiệm vụ"
                )
        
        task_record = {
            "title": task_data.title,
            "description": task_data.description,
            "status": task_data.status.value,
            "priority": task_data.priority.value,
            "start_date": task_data.start_date.isoformat() if task_data.start_date else None,
            "due_date": task_data.due_date.isoformat() if task_data.due_date else None,
            "group_id": task_data.group_id,
            "created_by": current_user.id,
            "assigned_to": task_data.assigned_to,
            "accountable_person": task_data.accountable_person,
            "project_id": task_data.project_id,
            "estimated_time": task_data.estimated_time or 0,
            "time_spent": 0,
            "parent_id": task_data.parent_id
        }
        
        # Remove None values
        task_record = {k: v for k, v in task_record.items() if v is not None}
        
        result = supabase.table("tasks").insert(task_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create task"
            )
        
        task = result.data[0]
        
        # Create assignments if multiple assignees
        if task_data.assignee_ids:
            assignments = []
            for employee_id in task_data.assignee_ids:
                assignments.append({
                    "task_id": task["id"],
                    "assigned_to": employee_id,
                    "assigned_by": current_user.id,
                    "status": task_data.status.value
                })
            
            if assignments:
                supabase.table("task_assignments").insert(assignments).execute()
        
        # Create single assignment if assigned_to is set
        elif task_data.assigned_to:
            supabase.table("task_assignments").insert({
                "task_id": task["id"],
                "assigned_to": task_data.assigned_to,
                "assigned_by": current_user.id,
                "status": task_data.status.value
            }).execute()
        
        # Create task participants
        participants = []
        participant_ids = set()  # Track IDs to avoid duplicates
        
        # Add assigned_to as responsible participant
        if task_data.assigned_to:
            participant_ids.add(task_data.assigned_to)
            participants.append({
                "task_id": task["id"],
                "employee_id": task_data.assigned_to,
                "role": "responsible",
                "added_by": current_user.id
            })
        
        # Add assignee_ids as participants (skip if already added as responsible)
        if task_data.assignee_ids:
            for employee_id in task_data.assignee_ids:
                if employee_id not in participant_ids:
                    participant_ids.add(employee_id)
                    participants.append({
                        "task_id": task["id"],
                        "employee_id": employee_id,
                        "role": "participant",
                        "added_by": current_user.id
                    })
        
        # Insert participants if any
        if participants:
            supabase.table("task_participants").insert(participants).execute()
        
        # Auto-add all project team members as participants for this task
        try:
            if task_data.project_id:
                team_result = (
                    supabase.table("project_team")
                    .select("user_id, role, status")
                    .eq("project_id", task_data.project_id)
                    .eq("status", "active")
                    .execute()
                )
                team_members = team_result.data or []

                def map_role(team_role: str) -> str:
                    role_lower = (team_role or "").lower()
                    if role_lower in ["owner", "manager", "lead", "project manager", "quản lý dự án", "người phụ trách", "người tạo"]:
                        return "responsible"
                    return "participant"

                # existing participants to avoid duplicates
                existing_participants = supabase.table("task_participants").select("employee_id").eq("task_id", task["id"]).execute()
                existing_ids = {p.get("employee_id") for p in (existing_participants.data or []) if p.get("employee_id")}

                to_add = []
                for member in team_members:
                    user_id = member.get("user_id")
                    if not user_id:
                        continue
                    emp_result = supabase.table("employees").select("id").eq("user_id", user_id).limit(1).execute()
                    if not emp_result.data:
                        continue
                    employee_id = emp_result.data[0].get("id")
                    if not employee_id or employee_id in existing_ids:
                        continue
                    existing_ids.add(employee_id)
                    to_add.append({
                        "task_id": task["id"],
                        "employee_id": employee_id,
                        "role": map_role(member.get("role")),
                        "added_by": current_user.id
                    })

                if to_add:
                    supabase.table("task_participants").insert(to_add).execute()
        except Exception as auto_add_err:
            print(f"Warning: failed to auto add project team to task participants: {auto_add_err}")

        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a task by ID with related data"""
    try:
        supabase = get_supabase_client()
        
        # Get task (exclude deleted)
        task_result = supabase.table("tasks").select("""
            *,
            employees:assigned_to(id, first_name, last_name),
            users:created_by(id, full_name),
            task_groups:group_id(id, name),
            projects:project_id(id, name)
        """).eq("id", task_id).is_("deleted_at", "null").execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Process related data
        employee = task.get("employees")
        if employee:
            task["assigned_to_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
        
        user = task.get("users")
        if user:
            task["created_by_name"] = user.get("full_name")
        
        group = task.get("task_groups")
        if group:
            task["group_name"] = group.get("name")
        
        project = task.get("projects")
        if project:
            task["project_name"] = project.get("name")
        
        # Get assignments
        assignments_result = supabase.table("task_assignments").select("""
            *,
            employees:assigned_to(id, first_name, last_name),
            users:assigned_by(id, full_name)
        """).eq("task_id", task_id).execute()
        
        assignments = []
        for assignment in assignments_result.data or []:
            # Try to get employee name from join first
            emp = assignment.get("employees")
            if emp:
                # Handle both array and object responses
                if isinstance(emp, list):
                    emp = emp[0] if emp else None
                
                if emp:
                    assignment["assigned_to_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            
            # If join didn't work, query directly
            if not assignment.get("assigned_to_name") and assignment.get("assigned_to"):
                try:
                    emp_result = supabase.table("employees").select("first_name, last_name").eq("id", assignment.get("assigned_to")).single().execute()
                    if emp_result.data:
                        emp_data = emp_result.data
                        assignment["assigned_to_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                except Exception:
                    # Employee not found or query failed
                    pass
            
            # Get assigned_by name
            usr = assignment.get("users")
            if usr:
                if isinstance(usr, list):
                    usr = usr[0] if usr else None
                if usr:
                    assignment["assigned_by_name"] = usr.get("full_name")
            
            # If join didn't work, query directly
            if not assignment.get("assigned_by_name") and assignment.get("assigned_by"):
                try:
                    user_result = supabase.table("users").select("full_name").eq("id", assignment.get("assigned_by")).single().execute()
                    if user_result.data:
                        assignment["assigned_by_name"] = user_result.data.get("full_name")
                except Exception:
                    pass
            
            assignments.append(assignment)
        
        # Get comments
        # Try to get only top-level comments (parent_id is NULL) if column exists
        # Otherwise get all comments (for backward compatibility)
        try:
            comments_result = supabase.table("task_comments").select("""
                *,
                users:user_id(id, full_name),
                employees:employee_id(id, first_name, last_name)
            """).eq("task_id", task_id).is_("parent_id", "null").order("created_at", desc=False).execute()
        except Exception:
            # Fallback: parent_id column doesn't exist yet, get all comments
            comments_result = supabase.table("task_comments").select("""
                *,
                users:user_id(id, full_name),
                employees:employee_id(id, first_name, last_name)
            """).eq("task_id", task_id).order("created_at", desc=False).execute()
        
        def get_replies(parent_id: str) -> List[dict]:
            """Recursively get replies for a comment"""
            try:
                replies_result = supabase.table("task_comments").select("""
                    *,
                    users:user_id(id, full_name),
                    employees:employee_id(id, first_name, last_name)
                """).eq("parent_id", parent_id).order("created_at", desc=False).execute()
            except Exception:
                # parent_id column doesn't exist, return empty list
                return []
            
            replies = []
            for reply in replies_result.data or []:
                usr = reply.get("users")
                if usr:
                    reply["user_name"] = usr.get("full_name")
                
                emp = reply.get("employees")
                if emp:
                    reply["employee_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()

                # Fallback: nếu chưa có user_name mà có user_id thì lấy từ bảng users
                if not reply.get("user_name") and reply.get("user_id"):
                    try:
                        user_result = supabase.table("users").select("full_name").eq("id", reply.get("user_id")).single().execute()
                        if user_result.data:
                            reply["user_name"] = user_result.data.get("full_name")
                    except Exception:
                        pass
                
                # Recursively get nested replies
                reply["replies"] = get_replies(reply["id"])
                replies.append(reply)
            
            return replies
        
        comments = []
        for comment in comments_result.data or []:
            usr = comment.get("users")
            if usr:
                comment["user_name"] = usr.get("full_name")
            
            emp = comment.get("employees")
            if emp:
                comment["employee_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()

            # Fallback: nếu chưa có user_name mà có user_id thì lấy từ bảng users
            if not comment.get("user_name") and comment.get("user_id"):
                try:
                    user_result = supabase.table("users").select("full_name").eq("id", comment.get("user_id")).single().execute()
                    if user_result.data:
                        comment["user_name"] = user_result.data.get("full_name")
                except Exception:
                    pass
            
            # Get replies for this comment (only if parent_id column exists)
            try:
                comment["replies"] = get_replies(comment["id"])
            except Exception:
                comment["replies"] = []
            comments.append(comment)
        
        # Get attachments
        attachments_result = supabase.table("task_attachments").select("""
            *,
            users:uploaded_by(id, full_name)
        """).eq("task_id", task_id).order("created_at", desc=True).execute()
        
        attachments = []
        for attachment in attachments_result.data or []:
            usr = attachment.get("users")
            if usr:
                attachment["uploaded_by_name"] = usr.get("full_name")
            
            attachments.append(attachment)
        
        # Get checklists with items
        checklists = _fetch_task_checklists(supabase, task_id)
        
        # Get time logs
        time_logs = _fetch_task_time_logs(supabase, task_id)
        
        # Get participants
        participants = _fetch_task_participants(supabase, task_id)
        
        # Get notes
        notes = _fetch_task_notes(supabase, task_id, current_user.id)
        
        # Get sub-tasks
        sub_tasks_result = supabase.table("tasks").select("*").eq("parent_id", task_id).is_("deleted_at", "null").order("created_at", desc=True).execute()
        sub_tasks = []
        for sub_task in sub_tasks_result.data or []:
            # Process assigned_to for sub-tasks
            if sub_task.get("assigned_to"):
                emp = supabase.table("employees").select("first_name, last_name").eq("id", sub_task.get("assigned_to")).single().execute()
                if emp.data:
                    sub_task["assigned_to_name"] = f"{emp.data.get('first_name', '')} {emp.data.get('last_name', '')}".strip()
            sub_tasks.append(sub_task)

        return TaskResponse(
            task=task,
            assignments=assignments,
            comments=comments,
            attachments=attachments,
            checklists=checklists,
            time_logs=time_logs,
            participants=participants,
            notes=notes,
            sub_tasks=sub_tasks
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task: {str(e)}"
        )

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a task"""
    try:
        supabase = get_supabase_client()
        
        update_data = {}
        if task_data.title is not None:
            update_data["title"] = task_data.title
        if task_data.description is not None:
            update_data["description"] = task_data.description
        if task_data.status is not None:
            update_data["status"] = task_data.status.value
            if task_data.status.value == "completed":
                update_data["completed_at"] = datetime.utcnow().isoformat()
                update_data["completed_by"] = current_user.id
        if task_data.priority is not None:
            update_data["priority"] = task_data.priority.value
        if task_data.start_date is not None:
            update_data["start_date"] = task_data.start_date.isoformat() if task_data.start_date else None
        if task_data.due_date is not None:
            update_data["due_date"] = task_data.due_date.isoformat()
        if task_data.group_id is not None:
            update_data["group_id"] = task_data.group_id
        if task_data.assigned_to is not None:
            update_data["assigned_to"] = task_data.assigned_to
        if task_data.accountable_person is not None:
            update_data["accountable_person"] = task_data.accountable_person
        if task_data.project_id is not None:
            update_data["project_id"] = task_data.project_id
        if task_data.estimated_time is not None:
            update_data["estimated_time"] = task_data.estimated_time
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}"
        )

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Soft delete a task (can be restored within 24 hours)"""
    try:
        supabase = get_supabase_client()
        
        # Get task info to find group_id and delete files
        task_result = supabase.table("tasks").select("id, group_id").eq("id", task_id).is_("deleted_at", "null").execute()
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or already deleted"
            )
        
        task = task_result.data[0]
        task_group_id = task.get("group_id", "")
        
        # Get all attachments for this task
        attachments_result = supabase.table("task_attachments").select("file_name").eq("task_id", task_id).execute()
        attachments = attachments_result.data or []
        
        # Delete all attachment files from storage
        upload_service = get_file_upload_service()
        
        for attachment in attachments:
            try:
                # Reconstruct file path
                if task_group_id:
                    file_path = f"Groups/{task_group_id}/Tasks/{task_id}/{attachment['file_name']}"
                else:
                    file_path = f"Tasks/{task_id}/{attachment['file_name']}"
                
                # Delete file from storage
                await upload_service.delete_file(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete attachment file {attachment['file_name']}: {str(e)}")
        
        # Soft delete task (set deleted_at)
        supabase.table("tasks").update({
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", task_id).execute()
        
        return {"message": "Task deleted successfully. Can be restored within 24 hours."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}"
        )

@router.post("/{task_id}/restore")
async def restore_task(
    task_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Restore a soft-deleted task (within 24 hours)"""
    try:
        supabase = get_supabase_client()
        
        # Check if task exists and is deleted
        task_result = supabase.table("tasks").select("id, deleted_at").eq("id", task_id).not_.is_("deleted_at", "null").execute()
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or not deleted"
            )
        
        task = task_result.data[0]
        deleted_at = datetime.fromisoformat(task["deleted_at"].replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        hours_since_deletion = (now - deleted_at).total_seconds() / 3600
        
        if hours_since_deletion > 24:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task cannot be restored after 24 hours"
            )
        
        # Restore task (set deleted_at to null)
        supabase.table("tasks").update({
            "deleted_at": None
        }).eq("id", task_id).execute()
        
        return {"message": "Task restored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore task: {str(e)}"
        )

@router.post("/groups/{group_id}/restore")
async def restore_task_group(
    group_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Restore a soft-deleted task group (within 24 hours)"""
    try:
        supabase = get_supabase_client()
        
        # Check if group exists and is deleted
        group_result = supabase.table("task_groups").select("id, deleted_at").eq("id", group_id).not_.is_("deleted_at", "null").execute()
        if not group_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task group not found or not deleted"
            )
        
        group = group_result.data[0]
        deleted_at = datetime.fromisoformat(group["deleted_at"].replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        hours_since_deletion = (now - deleted_at).total_seconds() / 3600
        
        if hours_since_deletion > 24:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task group cannot be restored after 24 hours"
            )
        
        # Restore group and all its tasks
        supabase.table("task_groups").update({
            "deleted_at": None
        }).eq("id", group_id).execute()
        
        # Restore all tasks in this group
        supabase.table("tasks").update({
            "deleted_at": None
        }).eq("group_id", group_id).not_.is_("deleted_at", "null").execute()
        
        return {"message": "Task group restored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore task group: {str(e)}"
        )

@router.post("/cleanup")
async def cleanup_deleted_items(
    current_user: User = Depends(require_manager_or_admin)
):
    """Permanently delete tasks and groups that were deleted more than 24 hours ago"""
    try:
        result = await task_cleanup_service.cleanup_old_deleted_items()
        return {
            "message": "Cleanup completed",
            "deleted_tasks": result["deleted_tasks"],
            "deleted_groups": result["deleted_groups"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup: {str(e)}"
        )

# ==================== Task Comments ====================

# ==================== Task Comments ====================

def _has_comment_moderation_rights(current_user: User) -> bool:
    """Allow elevated roles to moderate comments."""
    privileged_roles = {"admin", "sales", "accountant"}
    role_value = getattr(current_user.role, "value", current_user.role)
    if isinstance(role_value, str):
        return role_value.lower() in privileged_roles
    return False


@router.get("/{task_id}/comments", response_model=List[TaskComment])
async def get_task_comments(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all comments for a task with nested replies"""
    try:
        supabase = get_supabase_client()
        
        # Get comments (only top-level comments, parent_id is NULL)
        try:
            comments_result = supabase.table("task_comments").select("""
                *,
                users:user_id(id, full_name),
                employees:employee_id(id, first_name, last_name)
            """).eq("task_id", task_id).is_("parent_id", "null").order("created_at", desc=False).execute()
        except Exception:
            # Fallback: parent_id column doesn't exist yet, get all comments
            comments_result = supabase.table("task_comments").select("""
                *,
                users:user_id(id, full_name),
                employees:employee_id(id, first_name, last_name)
            """).eq("task_id", task_id).order("created_at", desc=False).execute()
        
        def get_replies(parent_id: str) -> List[dict]:
            """Recursively get replies for a comment"""
            try:
                replies_result = supabase.table("task_comments").select("""
                    *,
                    users:user_id(id, full_name),
                    employees:employee_id(id, first_name, last_name)
                """).eq("parent_id", parent_id).order("created_at", desc=False).execute()
            except Exception:
                # parent_id column doesn't exist, return empty list
                return []
            
            replies = []
            for reply in replies_result.data or []:
                # Get user name
                usr = reply.get("users")
                if usr:
                    if isinstance(usr, list):
                        usr = usr[0] if usr else None
                    if usr:
                        reply["user_name"] = usr.get("full_name")
                
                # Get employee name
                emp = reply.get("employees")
                if emp:
                    if isinstance(emp, list):
                        emp = emp[0] if emp else None
                    if emp:
                        reply["employee_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                
                # If join didn't work, query directly for employee
                if not reply.get("employee_name") and reply.get("employee_id"):
                    try:
                        emp_result = supabase.table("employees").select("first_name, last_name").eq("id", reply.get("employee_id")).single().execute()
                        if emp_result.data:
                            emp_data = emp_result.data
                            reply["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                    except Exception:
                        pass

                # Fallback: nếu chưa có user_name mà có user_id thì lấy từ bảng users
                if not reply.get("user_name") and reply.get("user_id"):
                    try:
                        user_result = supabase.table("users").select("full_name").eq("id", reply.get("user_id")).single().execute()
                        if user_result.data:
                            reply["user_name"] = user_result.data.get("full_name")
                    except Exception:
                        pass
                
                # Recursively get nested replies
                reply["replies"] = get_replies(reply["id"])
                replies.append(reply)
            
            return replies
        
        comments = []
        for comment in comments_result.data or []:
            # Get user name
            usr = comment.get("users")
            if usr:
                if isinstance(usr, list):
                    usr = usr[0] if usr else None
                if usr:
                    comment["user_name"] = usr.get("full_name")
            
            # Get employee name
            emp = comment.get("employees")
            if emp:
                if isinstance(emp, list):
                    emp = emp[0] if emp else None
                if emp:
                    comment["employee_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            
            # If join didn't work, try to get employee name by employee_id, then by user_id
            if not comment.get("employee_name"):
                # 1) By employee_id on the comment (nếu có)
                employee_id = comment.get("employee_id")
                if employee_id:
                    try:
                        emp_result = supabase.table("employees").select("first_name, last_name").eq("id", employee_id).single().execute()
                        if emp_result.data:
                            emp_data = emp_result.data
                            comment["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                    except Exception:
                        pass
                
                # 2) Fallback: tìm employee theo user_id (nếu không có employee_id)
                if not comment.get("employee_name") and comment.get("user_id"):
                    try:
                        emp_result = supabase.table("employees").select("first_name, last_name").eq("user_id", comment.get("user_id")).single().execute()
                        if emp_result.data:
                            emp_data = emp_result.data
                            comment["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                    except Exception:
                        pass
            
            # Get replies for this comment (only if parent_id column exists)
            try:
                comment["replies"] = get_replies(comment["id"])
            except Exception:
                comment["replies"] = []
            comments.append(comment)
        
        return comments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch comments: {str(e)}"
        )

@router.post("/{task_id}/comments", response_model=TaskComment)
async def create_task_comment(
    task_id: str,
    comment_data: TaskCommentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a task"""
    try:
        supabase = get_supabase_client()
        
        # Get employee_id: ưu tiên từ request, nếu không có thì lấy từ user_id
        employee_id = comment_data.employee_id
        if not employee_id:
            employee_result = supabase.table("employees").select("id").eq("user_id", current_user.id).execute()
            employee_id = employee_result.data[0]["id"] if employee_result.data else None
        
        # Validate parent_id if provided
        if comment_data.parent_id:
            parent_result = supabase.table("task_comments").select("id").eq("id", comment_data.parent_id).eq("task_id", task_id).execute()
            if not parent_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )
        
        comment_record = {
            "task_id": task_id,
            "user_id": current_user.id,
            "employee_id": employee_id,
            "comment": comment_data.comment,
            "type": comment_data.type,
            "file_url": comment_data.file_url,
            "is_pinned": comment_data.is_pinned,
            "parent_id": comment_data.parent_id
        }
        
        result = supabase.table("task_comments").insert(comment_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create comment"
            )
        
        # Enrich comment with user_name / employee_name dựa trên user_id / employee_id vừa lưu
        comment = result.data[0]

        # Lấy tên user từ bảng users
        try:
            user_result = supabase.table("users").select("full_name").eq("id", current_user.id).single().execute()
            if user_result.data:
                comment["user_name"] = user_result.data.get("full_name")
        except Exception:
            pass

        # Lấy tên nhân viên: ưu tiên theo employee_id, sau đó fallback theo user_id
        try:
            emp_data = None
            if employee_id:
                emp_result = supabase.table("employees").select("first_name, last_name").eq("id", employee_id).single().execute()
                if emp_result.data:
                    emp_data = emp_result.data
            if not emp_data:
                emp_result = supabase.table("employees").select("first_name, last_name").eq("user_id", current_user.id).single().execute()
                if emp_result.data:
                    emp_data = emp_result.data
            if emp_data:
                comment["employee_name"] = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
        except Exception:
            pass

        return comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )

@router.put("/comments/{comment_id}", response_model=TaskComment)
async def update_task_comment(
    comment_id: str,
    comment_data: TaskCommentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a task comment (pin, edit text, switch attachment)."""
    try:
        supabase = get_supabase_client()

        existing = (
            supabase.table("task_comments")
            .select("user_id")
            .eq("id", comment_id)
            .single()
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        owner_id = existing.data.get("user_id")
        if owner_id != current_user.id and not _has_comment_moderation_rights(current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this comment")

        update_data = {}
        if comment_data.comment is not None:
            update_data["comment"] = comment_data.comment
        if comment_data.type is not None:
            update_data["type"] = comment_data.type
        if comment_data.file_url is not None:
            update_data["file_url"] = comment_data.file_url
        if comment_data.is_pinned is not None:
            update_data["is_pinned"] = comment_data.is_pinned

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        result = (
            supabase.table("task_comments")
            .update(update_data)
            .eq("id", comment_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update comment: {str(e)}"
        )


@router.delete("/comments/{comment_id}")
async def delete_task_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a task comment. If it has an attachment, also delete the stored file + attachment record."""
    try:
        supabase = get_supabase_client()

        existing = (
            supabase.table("task_comments")
            .select("user_id, task_id, file_url")
            .eq("id", comment_id)
            .single()
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        owner_id = existing.data.get("user_id")
        if owner_id != current_user.id and not _has_comment_moderation_rights(current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

        # Nếu comment có file đính kèm, xóa luôn file trong storage + bản ghi attachment
        file_url = existing.data.get("file_url")
        task_id = existing.data.get("task_id")
        if file_url and task_id:
            try:
                # Tìm attachment theo file_url và task_id
                attachment_result = (
                    supabase.table("task_attachments")
                    .select("id, file_name, task_id")
                    .eq("task_id", task_id)
                    .eq("file_url", file_url)
                    .execute()
                )
                attachments = attachment_result.data or []
                if attachments:
                    # Lấy group_id của task để build đúng path
                    task_result = (
                        supabase.table("tasks")
                        .select("id, group_id")
                        .eq("id", task_id)
                        .single()
                        .execute()
                    )
                    task_group_id = ""
                    if task_result.data:
                        task_group_id = task_result.data.get("group_id") or ""

                    upload_service = get_file_upload_service()

                    for att in attachments:
                        try:
                            if task_group_id:
                                file_path = f"Groups/{task_group_id}/Tasks/{att['task_id']}/{att['file_name']}"
                            else:
                                file_path = f"Tasks/{att['task_id']}/{att['file_name']}"
                            # Xóa file khỏi storage
                            await upload_service.delete_file(file_path)
                        except Exception:
                            # Log nhưng không chặn việc xóa comment
                            logger.warning(f"Failed to delete attachment file for comment {comment_id}")

                    # Xóa bản ghi attachment trong DB
                    supabase.table("task_attachments").delete().eq("task_id", task_id).eq("file_url", file_url).execute()
            except Exception as e:
                logger.warning(f"Error while cleaning up attachments for comment {comment_id}: {e}")

        supabase.table("task_comments").delete().eq("id", comment_id).execute()
        return {"message": "Comment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete comment: {str(e)}"
        )

# ==================== Task Checklists ====================
@router.get("/{task_id}/checklists", response_model=List[TaskChecklist])
async def get_task_checklists(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        return _fetch_task_checklists(supabase, task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch checklists: {str(e)}"
        )


@router.post("/{task_id}/checklists", response_model=TaskChecklist)
async def create_task_checklist(
    task_id: str,
    checklist_data: TaskChecklistCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        insert_data = {
            "task_id": task_id,
            "title": checklist_data.title,
            "created_by": current_user.id
        }
        result = supabase.table("task_checklists").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create checklist"
            )
        checklist = result.data[0]
        checklist["items"] = []
        checklist["progress"] = 0.0
        return checklist
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checklist: {str(e)}"
        )


@router.put("/checklists/{checklist_id}", response_model=TaskChecklist)
async def update_task_checklist(
    checklist_id: str,
    checklist_data: TaskChecklistUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        if checklist_data.title is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        supabase = get_supabase_client()
        result = (
            supabase.table("task_checklists")
            .update({"title": checklist_data.title})
            .eq("id", checklist_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist not found"
            )
        task_id = result.data[0]["task_id"]
        refreshed = _fetch_task_checklists(supabase, task_id)
        updated = next((c for c in refreshed if c["id"] == checklist_id), None)
        return updated or result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update checklist: {str(e)}"
        )


@router.delete("/checklists/{checklist_id}")
async def delete_task_checklist(
    checklist_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        supabase.table("task_checklists").delete().eq("id", checklist_id).execute()
        return {"message": "Checklist deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete checklist: {str(e)}"
        )


@router.post("/checklists/{checklist_id}/items", response_model=TaskChecklistItem)
async def create_checklist_item(
    checklist_id: str,
    item_data: TaskChecklistItemCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        insert_data = {
            "checklist_id": checklist_id,
            "content": item_data.content,
            "assignee_id": item_data.assignee_id,
            "sort_order": item_data.sort_order or 0
        }
        result = supabase.table("task_checklist_items").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create checklist item"
            )
        
        item = result.data[0]
        item_id = item["id"]
        
        # Handle assignments if provided
        assignments = item_data.assignments or []
        if assignments:
            assignment_records = [
                {
                    "checklist_item_id": item_id,
                    "employee_id": assignment.employee_id,
                    "responsibility_type": assignment.responsibility_type
                }
                for assignment in assignments
            ]
            if assignment_records:
                supabase.table("task_checklist_item_assignments").insert(assignment_records).execute()
        
        # Fetch the item with assignments
        items_result = (
            supabase.table("task_checklist_items")
            .select("""
                *,
                employees:assignee_id(id, first_name, last_name)
            """)
            .eq("id", item_id)
            .execute()
        )
        if items_result.data:
            item = items_result.data[0]
            employee = item.get("employees")
            if employee:
                item["assignee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            
            # Fetch assignments
            assignments_result = (
                supabase.table("task_checklist_item_assignments")
                .select("""
                    *,
                    employees:employee_id(id, first_name, last_name)
                """)
                .eq("checklist_item_id", item_id)
                .execute()
            )
            assignments = []
            for assignment in assignments_result.data or []:
                employee = assignment.get("employees")
                assignment_data = {
                    "employee_id": assignment["employee_id"],
                    "responsibility_type": assignment["responsibility_type"]
                }
                if employee:
                    assignment_data["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                assignments.append(assignment_data)
            item["assignments"] = assignments
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checklist item: {str(e)}"
        )


@router.put("/checklist-items/{item_id}", response_model=TaskChecklistItem)
async def update_checklist_item(
    item_id: str,
    item_data: TaskChecklistItemUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        update_data = {}
        if item_data.content is not None:
            update_data["content"] = item_data.content
        if item_data.is_completed is not None:
            update_data["is_completed"] = item_data.is_completed
            update_data["completed_at"] = datetime.utcnow().isoformat() if item_data.is_completed else None
        if item_data.assignee_id is not None:
            update_data["assignee_id"] = item_data.assignee_id
        if item_data.sort_order is not None:
            update_data["sort_order"] = item_data.sort_order

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        result = supabase.table("task_checklist_items").update(update_data).eq("id", item_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist item not found"
            )
        
        item = result.data[0]
        
        # Handle assignments update if provided
        if item_data.assignments is not None:
            # Delete existing assignments
            supabase.table("task_checklist_item_assignments").delete().eq("checklist_item_id", item_id).execute()
            
            # Insert new assignments
            if item_data.assignments:
                assignment_records = [
                    {
                        "checklist_item_id": item_id,
                        "employee_id": assignment.employee_id,
                        "responsibility_type": assignment.responsibility_type
                    }
                    for assignment in item_data.assignments
                ]
                if assignment_records:
                    supabase.table("task_checklist_item_assignments").insert(assignment_records).execute()
        
        # Fetch the item with assignments
        items_result = (
            supabase.table("task_checklist_items")
            .select("""
                *,
                employees:assignee_id(id, first_name, last_name)
            """)
            .eq("id", item_id)
            .execute()
        )
        if items_result.data:
            item = items_result.data[0]
            employee = item.get("employees")
            if employee:
                item["assignee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            
            # Fetch assignments
            assignments_result = (
                supabase.table("task_checklist_item_assignments")
                .select("""
                    *,
                    employees:employee_id(id, first_name, last_name)
                """)
                .eq("checklist_item_id", item_id)
                .execute()
            )
            assignments = []
            for assignment in assignments_result.data or []:
                employee = assignment.get("employees")
                assignment_data = {
                    "employee_id": assignment["employee_id"],
                    "responsibility_type": assignment["responsibility_type"]
                }
                if employee:
                    assignment_data["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                assignments.append(assignment_data)
            item["assignments"] = assignments
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update checklist item: {str(e)}"
        )


@router.delete("/checklist-items/{item_id}")
async def delete_checklist_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        supabase.table("task_checklist_items").delete().eq("id", item_id).execute()
        return {"message": "Checklist item deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete checklist item: {str(e)}"
        )

# ==================== Task Time Logs ====================

@router.get("/{task_id}/time-logs", response_model=List[TaskTimeLog])
async def get_task_time_logs(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        return _fetch_task_time_logs(supabase, task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch time logs: {str(e)}"
        )


@router.post("/{task_id}/time-logs/start", response_model=TaskTimeLog)
async def start_time_log(
    task_id: str,
    time_log_data: TaskTimeLogStart,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()

        active_log = (
            supabase.table("task_time_logs")
            .select("*")
            .eq("task_id", task_id)
            .eq("user_id", current_user.id)
            .is_("end_time", None)
            .limit(1)
            .execute()
        )
        if active_log.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a running timer for this task"
            )

        insert_data = {
            "task_id": task_id,
            "user_id": current_user.id,
            "start_time": datetime.utcnow().isoformat(),
            "description": time_log_data.description
        }
        result = supabase.table("task_time_logs").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to start time log"
            )
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start time log: {str(e)}"
        )


@router.post("/time-logs/{log_id}/stop", response_model=TaskTimeLog)
async def stop_time_log(
    log_id: str,
    stop_data: TaskTimeLogStop,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        log_result = supabase.table("task_time_logs").select("*").eq("id", log_id).limit(1).execute()
        if not log_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time log not found"
            )
        log = log_result.data[0]
        if log.get("end_time"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time log already stopped"
            )

        if log.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only stop your own time logs"
            )

        end_time = datetime.utcnow().isoformat()
        update_data = {"end_time": end_time}
        if stop_data.description is not None:
            update_data["description"] = stop_data.description

        result = supabase.table("task_time_logs").update(update_data).eq("id", log_id).execute()
        updated_log = result.data[0]
        _recalculate_task_time_spent(supabase, log["task_id"])
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop time log: {str(e)}"
        )


@router.delete("/time-logs/{log_id}")
async def delete_time_log(
    log_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        log_result = supabase.table("task_time_logs").select("task_id, user_id").eq("id", log_id).limit(1).execute()
        if not log_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time log not found"
            )
        log = log_result.data[0]
        if log.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own time logs"
            )

        supabase.table("task_time_logs").delete().eq("id", log_id).execute()
        _recalculate_task_time_spent(supabase, log["task_id"])
        return {"message": "Time log deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete time log: {str(e)}"
        )

# ==================== Task Participants ====================

@router.get("/{task_id}/participants", response_model=List[TaskParticipant])
async def get_task_participants(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        return _fetch_task_participants(supabase, task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch participants: {str(e)}"
        )


@router.post("/{task_id}/participants", response_model=TaskParticipant)
async def add_task_participant(
    task_id: str,
    participant_data: TaskParticipantCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        insert_data = {
            "task_id": task_id,
            "employee_id": participant_data.employee_id,
            "role": participant_data.role.value,
            "added_by": current_user.id
        }
        result = supabase.table("task_participants").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add participant"
            )
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add participant: {str(e)}"
        )


@router.put("/participants/{participant_id}", response_model=TaskParticipant)
async def update_task_participant(
    participant_id: str,
    participant_data: TaskParticipantUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        update_data = {}
        if participant_data.employee_id is not None:
            update_data["employee_id"] = participant_data.employee_id
        if participant_data.role is not None:
            update_data["role"] = participant_data.role.value

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        result = supabase.table("task_participants").update(update_data).eq("id", participant_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found"
            )
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update participant: {str(e)}"
        )


@router.delete("/participants/{participant_id}")
async def delete_task_participant(
    participant_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        supabase.table("task_participants").delete().eq("id", participant_id).execute()
        return {"message": "Participant removed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete participant: {str(e)}"
        )

# ==================== Task Notifications ====================

@router.get("/notifications", response_model=List[TaskNotification])
async def get_task_notifications(
    current_user: User = Depends(get_current_user),
    is_read: Optional[bool] = Query(None, description="Filter by read status")
):
    """Get task notifications for current user"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("task_notifications").select("""
            *,
            tasks:task_id(id, title)
        """).eq("user_id", current_user.id)
        
        if is_read is not None:
            query = query.eq("is_read", is_read)
        
        result = query.order("created_at", desc=True).limit(50).execute()
        
        notifications = []
        for notification in result.data or []:
            task = notification.get("tasks")
            if task:
                notification["task_title"] = task.get("title")
            notifications.append(notification)
        
        return notifications
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        supabase = get_supabase_client()
        
        supabase.table("task_notifications").update({
            "is_read": True,
            "read_at": datetime.utcnow().isoformat()
        }).eq("id", notification_id).eq("user_id", current_user.id).execute()
        
        return {"message": "Notification marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

"""
Task Attachments Upload Endpoint
Add this to tasks.py router
"""

from fastapi import UploadFile, File
from services.file_upload_service import get_file_upload_service

@router.post("/{task_id}/attachments")
async def upload_task_attachment(
    task_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload attachment for a task"""
    try:
        supabase = get_supabase_client()
        
        # Verify task exists and get group_id
        task_result = supabase.table("tasks").select("id, group_id").eq("id", task_id).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = task_result.data[0]
        task_group_id = task.get("group_id", "")
        
        # Get original filename
        original_filename = file.filename or "untitled"
        # Sanitize original filename for Supabase Storage
        # Supabase Storage doesn't accept Unicode characters (Vietnamese) and spaces in keys
        # Convert Vietnamese to ASCII (remove diacritics) and replace spaces with underscores
        name_part = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        ext_part = '.' + original_filename.rsplit('.', 1)[1] if '.' in original_filename else ''
        
        # Normalize Unicode: convert Vietnamese characters to ASCII (remove diacritics)
        # Example: "Chú Chuyển Tân BÌnh" -> "Chu Chuyen Tan BInh"
        normalized_name = unicodedata.normalize('NFD', name_part)
        # Remove diacritical marks (combining characters)
        ascii_name = ''.join(c for c in normalized_name if unicodedata.category(c) != 'Mn')
        # Handle special Vietnamese characters: đ -> d, Đ -> D
        ascii_name = ascii_name.replace('đ', 'd').replace('Đ', 'D')
        
        # Replace spaces with underscores and remove invalid file name characters
        # Also remove % which can cause issues in URLs
        sanitized_name = ascii_name.replace(' ', '_')
        sanitized_name = re.sub(r'[<>:"/\\|?*%]', '_', sanitized_name)
        # Remove multiple consecutive underscores
        sanitized_name = re.sub(r'_+', '_', sanitized_name).strip('_')
        
        # Create storage filename: keep original name (sanitized to ASCII) without adding task_id
        # File uniqueness is handled by folder structure (Groups/{group_id}/Tasks/{task_id})
        # and file_upload_service will add (2), (3), etc. if duplicate names exist
        storage_filename = f"{sanitized_name}{ext_part}"
        
        # Create folder path: Groups/{group_id}/Tasks/{task_id} or Tasks/{task_id} if no group
        if task_group_id:
            folder_path = f"Groups/{task_group_id}/Tasks/{task_id}"
        else:
            folder_path = f"Tasks/{task_id}"
        
        # Upload file to storage with custom filename
        upload_service = get_file_upload_service()
        file_result = await upload_service.upload_file(
            file=file,
            folder_path=folder_path,
            generate_unique_name=False,
            custom_filename=storage_filename
        )
        
        # Create attachment record
        attachment_data = {
            "id": str(uuid.uuid4()),
            "task_id": task_id,
            "file_name": storage_filename,  # Storage filename (sanitized original name, kept in task folder)
            "original_file_name": original_filename,  # Original filename for display
            "file_url": file_result["url"],
            "file_type": file_result["content_type"],
            "file_size": file_result["size"],
            "uploaded_by": current_user.id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("task_attachments").insert(attachment_data).execute()
        
        return {
            "id": attachment_data["id"],
            "file_name": storage_filename,  # Storage filename (sanitized original name)
            "original_file_name": original_filename,  # Original filename for display
            "file_url": file_result["url"],
            "file_type": file_result["content_type"],
            "file_size": file_result["size"],
            "uploaded_by_name": current_user.full_name,
            "created_at": attachment_data["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload attachment: {str(e)}"
        )

@router.delete("/attachments/{attachment_id}")
async def delete_task_attachment(
    attachment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a task attachment"""
    try:
        supabase = get_supabase_client()
        
        # Get attachment info
        attachment_result = supabase.table("task_attachments").select("*").eq("id", attachment_id).execute()
        if not attachment_result.data:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        attachment = attachment_result.data[0]
        
        # Get task to find group_id for correct path
        task_result = supabase.table("tasks").select("id, group_id").eq("id", attachment['task_id']).execute()
        task_group_id = ""
        if task_result.data:
            task_group_id = task_result.data[0].get("group_id", "")
        
        # Reconstruct path: Groups/{group_id}/Tasks/{task_id}/{filename} or Tasks/{task_id}/{filename}
        if task_group_id:
            file_path = f"Groups/{task_group_id}/Tasks/{attachment['task_id']}/{attachment['file_name']}"
        else:
            file_path = f"Tasks/{attachment['task_id']}/{attachment['file_name']}"
        
        # Delete from storage
        upload_service = get_file_upload_service()
        await upload_service.delete_file(file_path)
        
        # Delete from database
        supabase.table("task_attachments").delete().eq("id", attachment_id).execute()
        
        return {"message": "Attachment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete attachment: {str(e)}"
        )
@router.post("/groups/upload")
async def upload_group_avatar(
    file: UploadFile = File(...),
    group_id: Optional[str] = Query(None, description="Group ID (optional, for existing groups)"),
    current_user: User = Depends(get_current_user)
):
    """Upload avatar for a group
    
    If group_id is provided, uploads to Groups/{group_id}/avatar/
    If not provided, uploads to temporary location (for new groups)
    """
    try:
        upload_service = get_file_upload_service()
        
        # Get original filename
        original_filename = file.filename or "avatar"
        # Get file extension
        file_ext = original_filename.rsplit('.', 1)[1] if '.' in original_filename else 'jpg'
        
        if group_id:
            # Upload to group's avatar folder: Groups/{group_id}/avatar/
            folder_path = f"Groups/{group_id}/avatar"
            # Use simple filename: avatar.{ext}
            custom_filename = f"avatar.{file_ext}"
        else:
            # Upload to temporary location for new groups
            folder_path = f"Groups/Temp/{uuid.uuid4()}"
            custom_filename = None  # Use generated unique name
        
        file_result = await upload_service.upload_file(
            file=file,
            folder_path=folder_path,
            allowed_types=upload_service.ALLOWED_IMAGE_TYPES,
            generate_unique_name=(custom_filename is None),
            custom_filename=custom_filename
        )
        
        return {"url": file_result["url"]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )


# ==================== Task Notes ====================

@router.get("/{task_id}/notes", response_model=List[TaskNote])
async def get_task_notes(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        return _fetch_task_notes(supabase, task_id, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notes: {str(e)}"
        )


@router.post("/{task_id}/notes", response_model=TaskNote)
async def create_task_note(
    task_id: str,
    note_data: TaskNoteCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        insert_data = {
            "task_id": task_id,
            "content": note_data.content,
            "visibility": note_data.visibility.value,
            "created_by": current_user.id
        }
        result = supabase.table("task_notes").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create note"
            )
        
        # Enrich with user name
        note = result.data[0]
        note["created_by_name"] = current_user.full_name
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.put("/notes/{note_id}", response_model=TaskNote)
async def update_task_note(
    note_id: str,
    note_data: TaskNoteUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        
        # Check ownership
        existing = supabase.table("task_notes").select("created_by").eq("id", note_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Note not found")
        if existing.data["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this note")

        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if note_data.content is not None:
            update_data["content"] = note_data.content
        if note_data.visibility is not None:
            update_data["visibility"] = note_data.visibility.value
        
        result = (
            supabase.table("task_notes")
            .update(update_data)
            .eq("id", note_id)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Note not found")
            
        note = result.data[0]
        note["created_by_name"] = current_user.full_name
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )


@router.delete("/notes/{note_id}")
async def delete_task_note(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        
        # Check ownership
        existing = supabase.table("task_notes").select("created_by").eq("id", note_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Note not found")
        if existing.data["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this note")

        supabase.table("task_notes").delete().eq("id", note_id).execute()
        return {"message": "Note deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )
