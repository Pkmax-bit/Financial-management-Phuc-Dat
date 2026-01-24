"""
Project Team Management API
Handles team member CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from models.user import User
from services.supabase_client import get_supabase_client
from services.notification_service import notification_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class TeamMember(BaseModel):
    id: str
    project_id: str
    name: str
    role: str
    responsibility_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    start_date: str
    hourly_rate: Optional[float] = None
    status: str
    skills: List[str] = []
    avatar: Optional[str] = None
    created_at: str
    updated_at: str

class TeamMemberCreate(BaseModel):
    name: str
    role: str
    responsibility_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: str
    hourly_rate: Optional[float] = None
    status: str = "active"
    skills: List[str] = []
    avatar: Optional[str] = None
    user_id: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    responsibility_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar: Optional[str] = None

@router.get("/projects/{project_id}/team")
async def get_project_team(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get all team members for a project"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_team").select("*").eq("project_id", project_id).execute()
        members_raw = result.data or []

        if not members_raw:
            return {"team_members": []}

        # Preload employees to avoid N+1 queries when mapping user/email to employee_id
        user_ids = list({member.get("user_id") for member in members_raw if member.get("user_id")})
        emails = list({(member.get("email") or "").lower() for member in members_raw if member.get("email")})

        employees_by_user_id = {}
        employees_by_email = {}

        if user_ids:
            try:
                employees_result = supabase.table("employees").select("id, user_id, email, first_name, last_name").in_("user_id", user_ids).execute()
                for employee in employees_result.data or []:
                    if employee.get("user_id"):
                        employees_by_user_id[employee["user_id"]] = employee
                    email_value = (employee.get("email") or "").lower()
                    if email_value:
                        employees_by_email[email_value] = employee
            except Exception as e:
                logger.warning(f"Error loading employees by user_id: {str(e)}")

        if emails:
            try:
                email_employees_result = supabase.table("employees").select("id, user_id, email, first_name, last_name").in_("email", emails).execute()
                for employee in email_employees_result.data or []:
                    email_value = (employee.get("email") or "").lower()
                    if email_value and email_value not in employees_by_email:
                        employees_by_email[email_value] = employee
                    # Also add to user_id map if has user_id
                    if employee.get("user_id") and employee["user_id"] not in employees_by_user_id:
                        employees_by_user_id[employee["user_id"]] = employee
            except Exception as e:
                logger.warning(f"Error loading employees by email: {str(e)}")

        def build_employee_name(employee: dict) -> str:
            first_name = (employee or {}).get("first_name") or ""
            last_name = (employee or {}).get("last_name") or ""
            return f"{first_name} {last_name}".strip()

        team_members = []
        for member in members_raw:
            linked_employee = None

            user_id = member.get("user_id")
            email = (member.get("email") or "").lower() if member.get("email") else None

            if user_id and user_id in employees_by_user_id:
                linked_employee = employees_by_user_id[user_id]
            elif email and email in employees_by_email:
                linked_employee = employees_by_email[email]

            if linked_employee:
                member["employee_id"] = linked_employee.get("id")
                if not member.get("name") or not member.get("name").strip():
                    generated_name = build_employee_name(linked_employee)
                    if generated_name:
                        member["name"] = generated_name
            else:
                # If no linked employee found, try one more time with a broader search
                # This handles cases where the link might have been missed
                if user_id:
                    try:
                        # Try direct lookup by user_id
                        direct_emp_result = supabase.table("employees").select("id, first_name, last_name").eq("user_id", user_id).limit(1).execute()
                        if direct_emp_result.data and len(direct_emp_result.data) > 0:
                            linked_employee = direct_emp_result.data[0]
                            member["employee_id"] = linked_employee.get("id")
                            if not member.get("name") or not member.get("name").strip():
                                generated_name = build_employee_name(linked_employee)
                                if generated_name:
                                    member["name"] = generated_name
                    except Exception:
                        pass  # If lookup fails, continue without employee_id

            # Normalize nullable fields from DB
            if member.get("skills") is None:
                member["skills"] = []
            team_members.append(TeamMember(**member))
        
        return {"team_members": team_members}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team members: {str(e)}"
        )

@router.post("/projects/{project_id}/team")
async def add_team_member(
    project_id: str,
    member_data: TeamMemberCreate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Add a new team member to a project and automatically add them to all project tasks"""
    print(f"🚀 add_team_member called: project_id={project_id}, member_data={member_data}")
    logger.info(f"🚀 add_team_member called: project_id={project_id}, member_data={member_data}")
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create team member
        member_dict = member_data.model_dump()
        member_dict["project_id"] = project_id
        member_dict["created_at"] = datetime.now().isoformat()
        member_dict["updated_at"] = datetime.now().isoformat()
        
        # Đảm bảo role luôn có giá trị (NOT NULL constraint)
        if not member_dict.get("role") or member_dict["role"] is None:
            member_dict["role"] = "member"  # Giá trị mặc định
        
        # Đảm bảo start_date luôn có giá trị (NOT NULL constraint)
        # Nếu không có, lấy từ project.start_date hoặc dùng ngày hiện tại
        if not member_dict.get("start_date") or member_dict["start_date"] is None:
            try:
                # Lấy start_date từ project
                project_result = supabase.table("projects").select("start_date").eq("id", project_id).single().execute()
                if project_result.data and project_result.data.get("start_date"):
                    project_start_date = project_result.data["start_date"]
                    # Nếu là datetime string, chỉ lấy phần date
                    if isinstance(project_start_date, str) and 'T' in project_start_date:
                        project_start_date = project_start_date.split('T')[0]
                    member_dict["start_date"] = project_start_date
                else:
                    # Fallback: dùng ngày hiện tại
                    member_dict["start_date"] = datetime.now().date().isoformat()
            except Exception:
                # Nếu không lấy được, dùng ngày hiện tại
                member_dict["start_date"] = datetime.now().date().isoformat()
        
        result = supabase.table("project_team").insert(member_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create team member"
            )
        
        created_member = result.data[0]
        print(f"✅ Team member created: {created_member.get('id')} - {created_member.get('name')}")
        logger.info(f"✅ Team member created: {created_member.get('id')} - {created_member.get('name')}")
        
        # Get employee_id from user_id if available
        employee_id = None
        if created_member.get("user_id"):
            employee_result = supabase.table("employees").select("id").eq("user_id", created_member["user_id"]).limit(1).execute()
            if employee_result.data:
                employee_id = employee_result.data[0]["id"]
        
        # If we have employee_id, add them to all tasks in this project
        if employee_id:
            try:
                # Get all tasks for this project
                tasks_result = supabase.table("tasks").select("id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                
                if tasks_result.data:
                    # Get current user_id for added_by (use the team member's user_id if available, otherwise use a system user)
                    added_by = created_member.get("user_id")
                    if not added_by:
                        # Try to get from employees table
                        emp_user_result = supabase.table("employees").select("user_id").eq("id", employee_id).limit(1).execute()
                        if emp_user_result.data and emp_user_result.data[0].get("user_id"):
                            added_by = emp_user_result.data[0]["user_id"]
                    
                    # Prepare participants to add
                    participants_to_add = []
                    for task in tasks_result.data:
                        # Check if participant already exists
                        existing_participant = supabase.table("task_participants").select("id").eq("task_id", task["id"]).eq("employee_id", employee_id).limit(1).execute()
                        
                        if not existing_participant.data:
                            participants_to_add.append({
                                "task_id": task["id"],
                                "employee_id": employee_id,
                                "role": "participant",
                                "added_by": added_by
                            })
                    
                    # Insert participants in batch
                    if participants_to_add:
                        supabase.table("task_participants").insert(participants_to_add).execute()
            except Exception as task_error:
                # Log error but don't fail the team member creation
                print(f"Warning: Failed to add team member to tasks: {str(task_error)}")
        
        # Tạo thông báo cho đội ngũ dự án về việc thêm thành viên mới
        print(f"🔔 ===== STARTING NOTIFICATION PROCESS =====")
        print(f"   Project ID: {project_id}")
        print(f"   Created member: {created_member.get('id')} - {created_member.get('name')}")
        logger.info(f"🔔 ===== STARTING NOTIFICATION PROCESS =====")
        logger.info(f"   Project ID: {project_id}")
        logger.info(f"   Created member: {created_member.get('id')} - {created_member.get('name')}")
        logger.info(f"   Member data: {member_data.model_dump() if hasattr(member_data, 'model_dump') else member_data}")
        try:
            # Lấy tên dự án
            project_result = supabase.table("projects").select("name").eq("id", project_id).limit(1).execute()
            project_name = project_result.data[0].get("name", "N/A") if project_result.data else "N/A"
            logger.info(f"   Project name: {project_name}")
            
            # Lấy tên thành viên mới
            member_name = created_member.get("name", "Thành viên mới")
            
            # Lấy tên người thêm (nếu có current_user, nhưng endpoint này không có auth hiện tại)
            # Có thể lấy từ user_id nếu có trong member_data
            added_by_name = None
            added_by_user_id = None
            if member_data.user_id:
                user_result = supabase.table("users").select("full_name, email, id").eq("id", member_data.user_id).limit(1).execute()
                if user_result.data:
                    added_by_name = user_result.data[0].get("full_name") or user_result.data[0].get("email")
                    added_by_user_id = user_result.data[0].get("id")
            
            # Lấy user_id của thành viên mới để exclude khỏi thông báo
            new_member_user_id = created_member.get("user_id")
            
            # Gửi thông báo cho đội ngũ dự án
            # Sử dụng hàm notify_team_member_added từ notification_service
            try:
                print(f"🔔 Starting notification process for team member addition: {member_name} to project {project_id}")
                logger.info(f"🔔 Starting notification process for team member addition: {member_name} to project {project_id}")
                
                # Gọi hàm notify_team_member_added với exclude cả người thêm và thành viên mới
                result = await notification_service.notify_team_member_added(
                    project_id=project_id,
                    project_name=project_name,
                    member_name=member_name,
                    added_by_name=added_by_name,
                    added_by_user_id=added_by_user_id,
                    new_member_user_id=new_member_user_id
                )
                
                if result.get("created", 0) > 0:
                    print(f"✅ Created {result.get('created')} notifications for team member addition: {member_name} to project {project_name}")
                    logger.info(f"✅ Created {result.get('created')} notifications for team member addition: {member_name} to project {project_name}")
                elif result.get("errors"):
                    print(f"⚠️  Notification creation had errors: {result.get('errors')}")
                    logger.warning(f"⚠️  Notification creation had errors: {result.get('errors')}")
                else:
                    print(f"ℹ️  No notifications created (no team members to notify)")
                    logger.info(f"ℹ️  No notifications created (no team members to notify)")
                    
            except Exception as notify_err:
                print(f"❌ Failed to send team member addition notification: {str(notify_err)}")
                import traceback
                print(traceback.format_exc())
                logger.error(f"❌ Failed to send team member addition notification: {str(notify_err)}")
                logger.error(traceback.format_exc())
        except Exception as notify_error:
            # Log error nhưng không fail team member creation
            print(f"❌ Outer exception handler: Failed to send team member addition notification: {str(notify_error)}")
            import traceback
            print(f"Outer exception traceback:\n{traceback.format_exc()}")
            logger.error(f"❌ Outer exception handler: Failed to send team member addition notification: {str(notify_error)}")
            logger.error(f"Outer exception traceback:\n{traceback.format_exc()}")
        
        return {"message": "Team member added successfully", "member": created_member}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add team member: {str(e)}"
        )

@router.put("/projects/{project_id}/team/{member_id}")
async def update_team_member(
    project_id: str,
    member_id: str,
    member_data: TeamMemberUpdate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Update a team member"""
    try:
        supabase = get_supabase_client()
        
        # Check if team member exists
        existing_result = supabase.table("project_team").select("*").eq("id", member_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        # Update team member
        update_data = member_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Nếu role được cập nhật và là None, không cho phép (giữ nguyên giá trị cũ)
        if "role" in update_data and (update_data["role"] is None or update_data["role"] == ""):
            # Nếu role là None hoặc rỗng, không cập nhật role (giữ nguyên giá trị cũ)
            del update_data["role"]
        
        result = supabase.table("project_team").update(update_data).eq("id", member_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update team member"
            )
        
        return {"message": "Team member updated successfully", "member": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update team member: {str(e)}"
        )

@router.delete("/projects/{project_id}/team/{member_id}")
async def delete_team_member(
    project_id: str,
    member_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Delete a team member"""
    try:
        supabase = get_supabase_client()
        
        # Check if team member exists
        existing_result = supabase.table("project_team").select("*").eq("id", member_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        member = existing_result.data[0]

        # If member has user_id -> find employee_id
        employee_id = None
        user_id = member.get("user_id")
        if user_id:
            emp_result = supabase.table("employees").select("id").eq("user_id", user_id).limit(1).execute()
            if emp_result.data:
                employee_id = emp_result.data[0].get("id")

        # Delete team member
        result = supabase.table("project_team").delete().eq("id", member_id).execute()
        
        # Also remove from task participants and task_group_members if employee_id is known
        if employee_id:
            try:
                # Get all task ids of this project
                tasks_result = supabase.table("tasks").select("id, group_id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                task_ids = [t["id"] for t in (tasks_result.data or []) if t.get("id")]
                if task_ids:
                    # Remove from task participants
                    supabase.table("task_participants").delete().in_("task_id", task_ids).eq("employee_id", employee_id).execute()
                
                # Get all unique group_ids from tasks in this project
                group_ids = list(set([t.get("group_id") for t in (tasks_result.data or []) if t.get("group_id")]))
                if group_ids:
                    # Remove from all task_group_members in this project's task groups
                    supabase.table("task_group_members").delete().in_("group_id", group_ids).eq("employee_id", employee_id).execute()
            except Exception as rm_err:
                # Log but do not fail delete
                print(f"Warning: failed to remove participant/group member when deleting team member: {rm_err}")

        return {"message": "Team member deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete team member: {str(e)}"
        )
