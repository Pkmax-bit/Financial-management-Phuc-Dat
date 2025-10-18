"""
Notification service for employee notifications
"""

import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from supabase import create_client, Client

class NotificationService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "https://mfmijckzlhevduwfigkl.supabase.co")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero")
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
            
            return result.data if result.data else []
            
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

# Global notification service instance
notification_service = NotificationService()
