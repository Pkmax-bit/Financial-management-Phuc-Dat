"""
Notification service for employee notifications
"""

import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from supabase import create_client, Client

class NotificationService:
    def __init__(self):
        # ⚠️ SECURITY: No hardcoded credentials - must use environment variables
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_key:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
    
    async def create_quote_notification(self, quote_data: Dict[str, Any], employee_id: str) -> bool:
        """Create notification for new quote"""
        try:
            notification_data = {
                "user_id": employee_id,
                "title": f"Báo giá mới: {quote_data.get('quote_number', 'N/A')}",
                "message": f"Báo giá {quote_data.get('quote_number', 'N/A')} đã được tạo với tổng giá trị {quote_data.get('total_amount', 0):,.0f} VND",
                "type": "quote_created",
                "entity_type": "quote",
                "entity_id": quote_data.get('id'),
                "is_read": False,
                "action_url": f"/sales/quotes/{quote_data.get('id')}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("notifications").insert(notification_data).execute()
            
            if result.data:
                print(f"Notification created for employee {employee_id}")
                return True
            else:
                print(f"Failed to create notification: {result}")
                return False
                
        except Exception as e:
            print(f"Error creating notification: {e}")
            return False
    
    async def create_quote_sent_notification(self, quote_data: Dict[str, Any], employee_id: str) -> bool:
        """Create notification for quote sent to customer"""
        try:
            notification_data = {
                "user_id": employee_id,
                "title": f"Báo giá đã gửi: {quote_data.get('quote_number', 'N/A')}",
                "message": f"Báo giá {quote_data.get('quote_number', 'N/A')} đã được gửi đến khách hàng",
                "type": "quote_sent",
                "entity_type": "quote",
                "entity_id": quote_data.get('id'),
                "is_read": False,
                "action_url": f"/sales/quotes/{quote_data.get('id')}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("notifications").insert(notification_data).execute()
            
            if result.data:
                print(f"Quote sent notification created for employee {employee_id}")
                return True
            else:
                print(f"Failed to create quote sent notification: {result}")
                return False
                
        except Exception as e:
            print(f"Error creating quote sent notification: {e}")
            return False
    
    async def get_employee_notifications(self, user_id: str, limit: int = 50) -> list:
        """Get notifications for a specific user"""
        try:
            result = self.supabase.table("notifications")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            if result.data:
                # Map is_read to read for frontend compatibility
                mapped_notifications = []
                for notification in result.data:
                    mapped_notification = notification.copy()
                    mapped_notification['read'] = notification.get('is_read', False)
                    # Remove the old is_read field to avoid confusion
                    if 'is_read' in mapped_notification:
                        del mapped_notification['is_read']
                    mapped_notifications.append(mapped_notification)
                return mapped_notifications
            else:
                return []
            
        except Exception as e:
            print(f"Error getting notifications: {e}")
            return []

    async def create_notifications_bulk(self, title: str, message: str, user_ids: List[str], action_url: Optional[str] = None, send_email: bool = True) -> Dict[str, Any]:
        """Create notifications for multiple users and optionally send email"""
        results = {"created": 0, "emails_sent": 0, "errors": []}
        try:
            notifications_payload = []
            for uid in user_ids:
                notifications_payload.append({
                    "user_id": uid,
                    "title": title,
                    "message": message,
                    "type": "manual",
                    "entity_type": None,
                    "entity_id": None,
                    "is_read": False,
                    "action_url": action_url,
                    "created_at": datetime.utcnow().isoformat()
                })
            if notifications_payload:
                result = self.supabase.table("notifications").insert(notifications_payload).execute()
                if result.data:
                    results["created"] = len(result.data)
                else:
                    results["errors"].append("Insert returned no data")
            # Optionally send emails
            if send_email:
                try:
                    # Fetch user emails from users table
                    ures = self.supabase.table("users").select("id,email,full_name").in_("id", user_ids).execute()
                    from services.email_service import email_service
                    if ures.data:
                        for user in ures.data:
                            email = user.get("email")
                            full_name = user.get("full_name", "")
                            if email:
                                ok = await email_service.send_notification_email(email, title, message, action_url)
                                if ok:
                                    results["emails_sent"] += 1
                except Exception as e:
                    results["errors"].append(f"Email error: {e}")
            return results
        except Exception as e:
            return {"created": 0, "emails_sent": 0, "errors": [str(e)]}
    
    async def mark_notification_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            result = self.supabase.table("notifications")\
                .update({
                    "is_read": True,
                    "read_at": datetime.utcnow().isoformat()
                })\
                .eq("id", notification_id)\
                .execute()
            
            return bool(result.data)
            
        except Exception as e:
            print(f"Error marking notification as read: {e}")
            return False
    
    async def create_quote_approved_notification(self, quote_data: Dict[str, Any], user_id: str, employee_name: str) -> bool:
        """Create notification for employee when their quote is approved"""
        try:
            notification_data = {
                "user_id": user_id,
                "title": f"Báo giá đã được duyệt: {quote_data.get('quote_number', 'N/A')}",
                "message": f"Báo giá {quote_data.get('quote_number', 'N/A')} của bạn đã được duyệt thành công. Tổng giá trị: {quote_data.get('total_amount', 0):,.0f} VND",
                "type": "quote_approved",
                "entity_type": "quote",
                "entity_id": quote_data.get('id'),
                "is_read": False,
                "action_url": f"/sales/quotes/{quote_data.get('id')}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("notifications").insert(notification_data).execute()
            
            if result.data:
                print(f"Quote approved notification created for employee {employee_name}")
                return True
            else:
                print(f"Failed to create quote approved notification: {result}")
                return False
                
        except Exception as e:
            print(f"Error creating quote approved notification: {e}")
            return False
    
    async def create_quote_approved_manager_notification(self, quote_data: Dict[str, Any], manager_user_id: str, manager_name: str, employee_name: str) -> bool:
        """Create notification for managers when a quote is approved"""
        try:
            notification_data = {
                "user_id": manager_user_id,
                "title": f"Báo giá đã được duyệt: {quote_data.get('quote_number', 'N/A')}",
                "message": f"Báo giá {quote_data.get('quote_number', 'N/A')} của {employee_name} đã được duyệt. Tổng giá trị: {quote_data.get('total_amount', 0):,.0f} VND",
                "type": "quote_approved_manager",
                "entity_type": "quote",
                "entity_id": quote_data.get('id'),
                "is_read": False,
                "action_url": f"/sales/quotes/{quote_data.get('id')}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("notifications").insert(notification_data).execute()
            
            if result.data:
                print(f"Quote approved manager notification created for {manager_name}")
                return True
            else:
                print(f"Failed to create quote approved manager notification: {result}")
                return False
                
        except Exception as e:
            print(f"Error creating quote approved manager notification: {e}")
            return False
    
    async def get_admin_user_ids(self) -> List[str]:
        """Get list of admin user IDs (only active users)"""
        try:
            result = self.supabase.table("users")\
                .select("id")\
                .eq("role", "admin")\
                .eq("is_active", True)\
                .execute()
            
            if result.data:
                return [user["id"] for user in result.data]
            return []
        except Exception as e:
            print(f"Error getting admin user IDs: {e}")
            return []
    
    async def notify_admins_quote_created(self, quote_data: Dict[str, Any], creator_name: str = None) -> Dict[str, Any]:
        """Notify all admin users when a new quote is created"""
        try:
            admin_user_ids = await self.get_admin_user_ids()
            
            if not admin_user_ids:
                print("No admin users found to notify")
                return {"created": 0, "errors": ["No admin users found"]}
            
            quote_number = quote_data.get('quote_number', 'N/A')
            total_amount = quote_data.get('total_amount', 0)
            quote_id = quote_data.get('id')
            
            creator_text = f" bởi {creator_name}" if creator_name else ""
            title = f"Báo giá mới: {quote_number}"
            message = f"Báo giá {quote_number}{creator_text} đã được tạo với tổng giá trị {total_amount:,.0f} VND"
            action_url = f"/sales/quotes/{quote_id}" if quote_id else None
            
            return await self.create_notifications_bulk(
                title=title,
                message=message,
                user_ids=admin_user_ids,
                action_url=action_url,
                send_email=False  # Don't send email for quote creation notifications
            )
        except Exception as e:
            print(f"Error notifying admins about quote creation: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def get_project_team_user_ids(self, project_id: str) -> List[str]:
        """Get list of user IDs from project team members (active members only)"""
        try:
            result = self.supabase.table("project_team")\
                .select("user_id")\
                .eq("project_id", project_id)\
                .eq("status", "active")\
                .not_.is_("user_id", "null")\
                .execute()
            
            if result.data:
                # Filter out None values and return unique user IDs
                user_ids = list(set([member["user_id"] for member in result.data if member.get("user_id")]))
                print(f"get_project_team_user_ids: Found {len(user_ids)} user IDs for project {project_id}: {user_ids}")
                return user_ids
            print(f"get_project_team_user_ids: No team members found for project {project_id}")
            return []
        except Exception as e:
            print(f"Error getting project team user IDs: {e}")
            import traceback
            print(traceback.format_exc())
            return []
    
    async def notify_project_team(self, project_id: str, title: str, message: str, notification_type: str, entity_type: Optional[str] = "project", entity_id: Optional[str] = None, action_url: Optional[str] = None, exclude_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Notify all project team members about a project event"""
        try:
            user_ids = await self.get_project_team_user_ids(project_id)
            
            if not user_ids:
                print(f"No team members found for project {project_id}")
                return {"created": 0, "errors": ["No team members found"]}
            
            # Exclude the user who triggered the event (if provided)
            if exclude_user_id and exclude_user_id in user_ids:
                user_ids = [uid for uid in user_ids if uid != exclude_user_id]
            
            if not user_ids:
                print(f"No team members to notify after excluding user {exclude_user_id}")
                return {"created": 0, "errors": ["No team members to notify"]}
            
            # Create notifications with specific type
            results = {"created": 0, "emails_sent": 0, "errors": []}
            try:
                notifications_payload = []
                for uid in user_ids:
                    notifications_payload.append({
                        "user_id": uid,
                        "title": title,
                        "message": message,
                        "type": notification_type,
                        "entity_type": entity_type,
                        "entity_id": entity_id or project_id,
                        "is_read": False,
                        "action_url": action_url,
                        "created_at": datetime.utcnow().isoformat()
                    })
                if notifications_payload:
                    result = self.supabase.table("notifications").insert(notifications_payload).execute()
                    if result.data:
                        results["created"] = len(result.data)
                    else:
                        results["errors"].append("Insert returned no data")
            except Exception as e:
                results["errors"].append(str(e))
            return results
        except Exception as e:
            print(f"Error notifying project team: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def notify_project_created(self, project_data: Dict[str, Any], creator_name: Optional[str] = None, creator_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Notify project team when a new project is created"""
        try:
            project_id = project_data.get('id')
            project_name = project_data.get('name', 'N/A')
            project_code = project_data.get('project_code', '')
            
            if not project_id:
                return {"created": 0, "errors": ["Project ID is required"]}
            
            creator_text = f" bởi {creator_name}" if creator_name else ""
            title = f"Dự án mới: {project_name}"
            message = f"Dự án {project_code} - {project_name}{creator_text} đã được tạo"
            action_url = f"/projects/{project_id}" if project_id else None
            
            return await self.notify_project_team(
                project_id=project_id,
                title=title,
                message=message,
                notification_type="project_created",
                entity_type="project",
                entity_id=project_id,
                action_url=action_url,
                exclude_user_id=creator_user_id
            )
        except Exception as e:
            print(f"Error notifying project creation: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def notify_project_status_changed(self, project_id: str, project_name: str, old_status: Optional[str], new_status: str, changed_by_name: Optional[str] = None, changed_by_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Notify project team when project status is changed"""
        try:
            status_text = f" từ '{old_status}'" if old_status else ""
            changed_by_text = f" bởi {changed_by_name}" if changed_by_name else ""
            
            title = f"Cập nhật trạng thái dự án: {project_name}"
            message = f"Trạng thái dự án {project_name} đã được chuyển{status_text} sang '{new_status}'{changed_by_text}"
            action_url = f"/projects/{project_id}" if project_id else None
            
            return await self.notify_project_team(
                project_id=project_id,
                title=title,
                message=message,
                notification_type="project_status_changed",
                entity_type="project",
                entity_id=project_id,
                action_url=action_url,
                exclude_user_id=changed_by_user_id
            )
        except Exception as e:
            print(f"Error notifying project status change: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def notify_team_member_added(self, project_id: str, project_name: str, member_name: str, added_by_name: Optional[str] = None, added_by_user_id: Optional[str] = None, new_member_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Notify project team when a new team member is added"""
        try:
            added_by_text = f" bởi {added_by_name}" if added_by_name else ""
            
            title = f"Thành viên mới: {project_name}"
            message = f"{member_name} đã được thêm vào đội ngũ dự án {project_name}{added_by_text}"
            action_url = f"/projects/{project_id}" if project_id else None
            
            # Get team user IDs
            user_ids = await self.get_project_team_user_ids(project_id)
            
            if not user_ids:
                print(f"No team members found for project {project_id}")
                return {"created": 0, "errors": ["No team members found"]}
            
            # Exclude both the person who added and the new member
            user_ids_to_notify = [uid for uid in user_ids if uid and uid != added_by_user_id and uid != new_member_user_id]
            
            if not user_ids_to_notify:
                print(f"No team members to notify after excluding added_by_user_id={added_by_user_id} and new_member_user_id={new_member_user_id}")
                return {"created": 0, "errors": ["No team members to notify"]}
            
            # Create notifications
            results = {"created": 0, "emails_sent": 0, "errors": []}
            try:
                notifications_payload = []
                for uid in user_ids_to_notify:
                    notifications_payload.append({
                        "user_id": uid,
                        "title": title,
                        "message": message,
                        "type": "team_member_added",
                        "entity_type": "project",
                        "entity_id": project_id,
                        "is_read": False,
                        "action_url": action_url,
                        "created_at": datetime.utcnow().isoformat()
                    })
                
                if notifications_payload:
                    result = self.supabase.table("notifications").insert(notifications_payload).execute()
                    if result.data:
                        results["created"] = len(result.data)
                        print(f"Created {len(result.data)} notifications for team member addition")
                    else:
                        results["errors"].append("Insert returned no data")
                else:
                    results["errors"].append("No notifications to create")
            except Exception as e:
                print(f"Error creating notifications: {e}")
                results["errors"].append(str(e))
            
            return results
        except Exception as e:
            print(f"Error notifying team member addition: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def notify_employee_assigned_to_task(self, task_id: str, task_title: str, project_id: str, project_name: str, employee_id: str, employee_name: str, assigned_by_name: Optional[str] = None, assigned_by_user_id: Optional[str] = None, checklist_title: Optional[str] = None, responsibility_type: Optional[str] = None) -> Dict[str, Any]:
        """Notify project team when an employee is assigned to a task"""
        try:
            # Get employee's user_id
            emp_result = self.supabase.table("employees").select("user_id").eq("id", employee_id).limit(1).execute()
            employee_user_id = emp_result.data[0].get("user_id") if emp_result.data else None
            
            assigned_by_text = f" bởi {assigned_by_name}" if assigned_by_name else ""
            
            # Map responsibility_type sang tiếng Việt
            responsibility_labels = {
                "accountable": "Chịu trách nhiệm",
                "responsible": "Thực hiện",
                "consulted": "Tư vấn",
                "informed": "Thông báo"
            }
            responsibility_text = f" với vai trò {responsibility_labels.get(responsibility_type, responsibility_type)}" if responsibility_type else ""
            
            # Tạo message rõ ràng hơn về nhiệm vụ được gán
            if checklist_title:
                title = f"Gán nhân viên vào nhiệm vụ: {task_title}"
                message = f"{employee_name} đã được gán vào nhiệm vụ '{task_title}' - công việc '{checklist_title}'{responsibility_text} trong dự án {project_name}{assigned_by_text}"
            else:
                title = f"Gán nhân viên vào nhiệm vụ: {task_title}"
                message = f"{employee_name} đã được gán vào nhiệm vụ '{task_title}'{responsibility_text} trong dự án {project_name}{assigned_by_text}"
            
            action_url = f"/projects/{project_id}/tasks/{task_id}" if project_id and task_id else None
            
            # Get team user IDs
            user_ids = await self.get_project_team_user_ids(project_id)
            
            if not user_ids:
                print(f"No team members found for project {project_id}")
                return {"created": 0, "errors": ["No team members found"]}
            
            # Exclude only the person who assigned (nhân viên được gán cũng nên nhận thông báo để biết họ đã được gán)
            user_ids_to_notify = [uid for uid in user_ids if uid and uid != assigned_by_user_id]
            
            # Nhân viên được gán cũng nên nhận thông báo (nếu có user_id và là thành viên của đội ngũ)
            if employee_user_id and employee_user_id in user_ids:
                if employee_user_id not in user_ids_to_notify:
                    user_ids_to_notify.append(employee_user_id)
            
            if not user_ids_to_notify:
                print(f"No team members to notify after excluding assigned_by_user_id={assigned_by_user_id}")
                return {"created": 0, "errors": ["No team members to notify"]}
            
            # Create notifications
            results = {"created": 0, "emails_sent": 0, "errors": []}
            try:
                notifications_payload = []
                for uid in user_ids_to_notify:
                    notifications_payload.append({
                        "user_id": uid,
                        "title": title,
                        "message": message,
                        "type": "employee_assigned_to_task",
                        "entity_type": "task",
                        "entity_id": task_id,
                        "is_read": False,
                        "action_url": action_url,
                        "created_at": datetime.utcnow().isoformat()
                    })
                
                if notifications_payload:
                    result = self.supabase.table("notifications").insert(notifications_payload).execute()
                    if result.data:
                        results["created"] = len(result.data)
                        print(f"Created {len(result.data)} notifications for employee assignment to task")
                    else:
                        results["errors"].append("Insert returned no data")
                else:
                    results["errors"].append("No notifications to create")
            except Exception as e:
                print(f"Error creating notifications: {e}")
                results["errors"].append(str(e))
            
            return results
        except Exception as e:
            print(f"Error notifying employee assignment to task: {e}")
            return {"created": 0, "errors": [str(e)]}
    
    async def notify_task_completed(self, task_id: str, task_title: str, project_id: str, project_name: str, completed_by_name: Optional[str] = None, completed_by_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Notify project team when a task is completed"""
        try:
            completed_by_text = f" bởi {completed_by_name}" if completed_by_name else ""
            
            title = f"Nhiệm vụ hoàn thành: {task_title}"
            message = f"Nhiệm vụ '{task_title}' trong dự án {project_name} đã được hoàn thành{completed_by_text}"
            action_url = f"/projects/{project_id}/tasks/{task_id}" if project_id and task_id else None
            
            return await self.notify_project_team(
                project_id=project_id,
                title=title,
                message=message,
                notification_type="task_completed",
                entity_type="task",
                entity_id=task_id,
                action_url=action_url,
                exclude_user_id=completed_by_user_id
            )
        except Exception as e:
            print(f"Error notifying task completion: {e}")
            return {"created": 0, "errors": [str(e)]}

# Global notification service instance
notification_service = NotificationService()
