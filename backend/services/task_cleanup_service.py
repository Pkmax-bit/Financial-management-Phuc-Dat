"""
Task Cleanup Service
Automatically permanently deletes soft-deleted tasks and groups after 24 hours
"""

import logging
from datetime import datetime, timezone, timedelta
from services.supabase_client import get_supabase_client
from services.file_upload_service import get_file_upload_service

logger = logging.getLogger(__name__)

class TaskCleanupService:
    """Service for cleaning up soft-deleted tasks and groups"""
    
    def __init__(self):
        self.upload_service = get_file_upload_service()
    
    async def cleanup_old_deleted_items(self):
        """Permanently delete tasks and groups that were deleted more than 24 hours ago"""
        try:
            supabase = get_supabase_client()
            cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            
            # Find tasks deleted more than 24 hours ago
            old_tasks_result = supabase.table("tasks").select("id, group_id").not_.is_("deleted_at", "null").lt("deleted_at", cutoff_time).execute()
            old_tasks = old_tasks_result.data or []
            
            # Find groups deleted more than 24 hours ago
            old_groups_result = supabase.table("task_groups").select("id").not_.is_("deleted_at", "null").lt("deleted_at", cutoff_time).execute()
            old_groups = old_groups_result.data or []
            
            deleted_tasks_count = 0
            deleted_groups_count = 0
            
            # Permanently delete old tasks
            for task in old_tasks:
                try:
                    task_id = task["id"]
                    task_group_id = task.get("group_id", "")
                    
                    # Get all attachments
                    attachments_result = supabase.table("task_attachments").select("file_name").eq("task_id", task_id).execute()
                    attachments = attachments_result.data or []
                    
                    # Delete files from storage (if not already deleted)
                    for attachment in attachments:
                        try:
                            if task_group_id:
                                file_path = f"Groups/{task_group_id}/Tasks/{task_id}/{attachment['file_name']}"
                            else:
                                file_path = f"Tasks/{task_id}/{attachment['file_name']}"
                            await self.upload_service.delete_file(file_path)
                        except Exception as e:
                            logger.warning(f"Failed to delete file {attachment['file_name']}: {str(e)}")
                    
                    # Permanently delete task and related data (cascade will handle attachments, comments, etc.)
                    supabase.table("tasks").delete().eq("id", task_id).execute()
                    deleted_tasks_count += 1
                except Exception as e:
                    logger.error(f"Failed to permanently delete task {task['id']}: {str(e)}")
            
            # Permanently delete old groups
            for group in old_groups:
                try:
                    group_id = group["id"]
                    
                    # Get all tasks in this group
                    tasks_result = supabase.table("tasks").select("id").eq("group_id", group_id).execute()
                    tasks = tasks_result.data or []
                    
                    # Delete all files from group folder
                    # Delete avatar
                    try:
                        avatar_path = f"Groups/{group_id}/avatar/avatar.jpg"
                        await self.upload_service.delete_file(avatar_path)
                    except Exception:
                        try:
                            avatar_path = f"Groups/{group_id}/avatar/avatar.png"
                            await self.upload_service.delete_file(avatar_path)
                        except Exception:
                            pass
                    
                    # Delete all task files
                    for task in tasks:
                        task_id = task["id"]
                        attachments_result = supabase.table("task_attachments").select("file_name").eq("task_id", task_id).execute()
                        attachments = attachments_result.data or []
                        
                        for attachment in attachments:
                            try:
                                file_path = f"Groups/{group_id}/Tasks/{task_id}/{attachment['file_name']}"
                                await self.upload_service.delete_file(file_path)
                            except Exception as e:
                                logger.warning(f"Failed to delete task file: {str(e)}")
                    
                    # Permanently delete group (cascade will handle members and tasks)
                    supabase.table("task_groups").delete().eq("id", group_id).execute()
                    deleted_groups_count += 1
                except Exception as e:
                    logger.error(f"Failed to permanently delete group {group['id']}: {str(e)}")
            
            logger.info(f"Cleanup completed: {deleted_tasks_count} tasks and {deleted_groups_count} groups permanently deleted")
            return {
                "deleted_tasks": deleted_tasks_count,
                "deleted_groups": deleted_groups_count
            }
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
            raise

# Global instance
task_cleanup_service = TaskCleanupService()

