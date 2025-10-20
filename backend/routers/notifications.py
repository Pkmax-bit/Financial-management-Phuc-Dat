"""
Notification System Router
Handles email notifications, system alerts, and notification management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client
from config import settings

router = APIRouter()

class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str  # 'info', 'warning', 'error', 'success'
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    read: bool
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    created_at: datetime

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = 'info'
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_url: Optional[str] = None

class EmailNotification(BaseModel):
    to_email: str
    subject: str
    body: str
    template: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class SystemAlert(BaseModel):
    type: str  # 'invoice_due', 'expense_approval', 'project_deadline', 'system_maintenance'
    title: str
    message: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    target_users: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None

def create_notification_email_template(subject: str, message: str, notification_type: str = "info") -> str:
    """Create beautiful HTML email template for notifications"""
    from datetime import datetime
    
    # Color scheme based on notification type
    color_schemes = {
        'info': {'primary': '#3b82f6', 'secondary': '#dbeafe', 'accent': '#1d4ed8'},
        'success': {'primary': '#10b981', 'secondary': '#d1fae5', 'accent': '#047857'},
        'warning': {'primary': '#f59e0b', 'secondary': '#fef3c7', 'accent': '#d97706'},
        'error': {'primary': '#ef4444', 'secondary': '#fee2e2', 'accent': '#dc2626'}
    }
    
    colors = color_schemes.get(notification_type, color_schemes['info'])
    
    # Icon based on type
    icons = {
        'info': '📢',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }
    
    icon = icons.get(notification_type, icons['info'])
    
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }}
            .email-container {{
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, {colors['primary']} 0%, {colors['accent']} 100%);
                color: white;
                padding: 24px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }}
            .header .icon {{
                font-size: 32px;
                margin-bottom: 8px;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .notification-card {{
                background: {colors['secondary']};
                border-left: 4px solid {colors['primary']};
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }}
            .notification-title {{
                font-size: 18px;
                font-weight: 600;
                color: {colors['accent']};
                margin: 0 0 12px 0;
            }}
            .notification-message {{
                font-size: 16px;
                color: #4b5563;
                margin: 0;
                white-space: pre-wrap;
            }}
            .footer {{
                background: #f8fafc;
                padding: 20px 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }}
            .timestamp {{
                color: #9ca3af;
                font-size: 14px;
                margin-top: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="icon">{icon}</div>
                <h1>Thông báo hệ thống</h1>
            </div>
            
            <div class="content">
                <div class="notification-card">
                    <h2 class="notification-title">{subject}</h2>
                    <p class="notification-message">{message}</p>
                </div>
                
                <div class="timestamp">
                    Thời gian: {datetime.now().strftime('%d/%m/%Y lúc %H:%M:%S')}
                </div>
            </div>
            
            <div class="footer">
                <p>Hệ thống quản lý tài chính</p>
                <p>Email này được gửi tự động từ hệ thống</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_template

async def send_email_notification(email_data: EmailNotification):
    """Send email notification using SMTP with beautiful template"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"Hệ thống quản lý tài chính <{settings.SMTP_USER}>"
        msg['To'] = email_data.to_email
        msg['Subject'] = email_data.subject

        # Create beautiful HTML template
        html_body = create_notification_email_template(
            email_data.subject, 
            email_data.body.replace('<p>', '').replace('</p>', ''),  # Remove existing HTML tags
            email_data.template or 'info'
        )
        
        # Create plain text version
        text_body = f"""
        {email_data.subject}
        
        {email_data.body.replace('<p>', '').replace('</p>', '')}
        
        Thời gian: {datetime.now().strftime('%d/%m/%Y lúc %H:%M:%S')}
        
        ---
        Hệ thống quản lý tài chính
        Email này được gửi tự động từ hệ thống
        """

        # Add both versions
        text_part = MIMEText(text_body, 'plain', 'utf-8')
        html_part = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(text_part)
        msg.attach(html_part)

        # Send email
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.SMTP_USER, email_data.to_email, text)
        server.quit()

        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get user notifications"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("notifications").select("*").eq("user_id", current_user.id)
        
        if unread_only:
            query = query.eq("is_read", False)
        
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        # Map database fields to frontend format
        mapped_notifications = []
        for notification in result.data:
            mapped_notification = notification.copy()
            mapped_notification['read'] = notification.get('is_read', False)
            if 'is_read' in mapped_notification:
                del mapped_notification['is_read']
            mapped_notifications.append(Notification(**mapped_notification))
        
        return mapped_notifications
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )

@router.post("/notifications", response_model=Notification)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new notification"""
    try:
        supabase = get_supabase_client()
        
        notification_dict = notification_data.dict()
        notification_dict["id"] = str(uuid.uuid4())
        notification_dict["is_read"] = False
        notification_dict["created_at"] = datetime.utcnow().isoformat()
        
        # Remove data field if it exists since the database doesn't have this column
        if "data" in notification_dict:
            del notification_dict["data"]
        
        # Debug: Print the data being sent to the database
        print(f"Inserting notification data: {notification_dict}")
        
        result = supabase.table("notifications").insert(notification_dict).execute()
        
        if result.data:
            # Map database fields to frontend format
            notification_data = result.data[0].copy()
            notification_data['read'] = notification_data.get('is_read', False)
            if 'is_read' in notification_data:
                del notification_data['is_read']
            return Notification(**notification_data)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create notification"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        supabase = get_supabase_client()
        
        # Check if notification belongs to user
        existing = supabase.table("notifications").select("id").eq("id", notification_id).eq("user_id", current_user.id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Mark as read
        result = supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
        
        if result.data:
            return {"message": "Notification marked as read"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to mark notification as read"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all user notifications as read"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("notifications").update({"read": True}).eq("user_id", current_user.id).eq("read", False).execute()
        
        return {"message": f"Marked {len(result.data)} notifications as read"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )

@router.post("/notifications/email")
async def send_email_notification_endpoint(
    email_data: EmailNotification,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send email notification"""
    try:
        # Add to background tasks
        background_tasks.add_task(send_email_notification, email_data)
        
        return {"message": "Email notification queued for sending"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email notification: {str(e)}"
        )

@router.post("/notifications/system-alert")
async def create_system_alert(
    alert_data: SystemAlert,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create system alert and notify users"""
    try:
        supabase = get_supabase_client()
        
        # Get target users
        if alert_data.target_users:
            user_ids = alert_data.target_users
        else:
            # Get all active users
            users = supabase.table("users").select("id").eq("status", "active").execute()
            user_ids = [user["id"] for user in users.data]
        
        # Create notifications for each user
        notifications = []
        for user_id in user_ids:
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": alert_data.title,
                "message": alert_data.message,
                "type": alert_data.severity,
                "read": False,
                "created_at": datetime.utcnow().isoformat(),
                "data": alert_data.data
            }
            notifications.append(notification)
        
        # Insert notifications
        if notifications:
            supabase.table("notifications").insert(notifications).execute()
        
        # Send email notifications for critical alerts
        if alert_data.severity == "critical":
            for user_id in user_ids:
                user = supabase.table("users").select("email,full_name").eq("id", user_id).single().execute()
                if user.data:
                    email_data = EmailNotification(
                        to_email=user.data["email"],
                        subject=f"Critical Alert: {alert_data.title}",
                        body=f"""
                        <h2>Critical System Alert</h2>
                        <p><strong>Title:</strong> {alert_data.title}</p>
                        <p><strong>Message:</strong> {alert_data.message}</p>
                        <p><strong>Severity:</strong> {alert_data.severity.upper()}</p>
                        <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
                        <p>Please take immediate action if required.</p>
                        """
                    )
                    background_tasks.add_task(send_email_notification, email_data)
        
        return {"message": f"System alert created and sent to {len(user_ids)} users"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create system alert: {str(e)}"
        )

@router.get("/notifications/stats")
async def get_notification_stats(
    current_user: User = Depends(get_current_user)
):
    """Get notification statistics for user"""
    try:
        supabase = get_supabase_client()
        
        # Get total notifications
        total = supabase.table("notifications").select("id", count="exact").eq("user_id", current_user.id).execute().count or 0
        
        # Get unread notifications
        unread = supabase.table("notifications").select("id", count="exact").eq("user_id", current_user.id).eq("read", False).execute().count or 0
        
        # Get notifications by type
        notifications = supabase.table("notifications").select("type").eq("user_id", current_user.id).execute()
        type_counts = {}
        for notification in notifications.data:
            type_name = notification["type"]
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        
        return {
            "total": total,
            "unread": unread,
            "read": total - unread,
            "by_type": type_counts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notification stats: {str(e)}"
        )

@router.post("/notifications/invoice-due-reminder")
async def send_invoice_due_reminder(
    invoice_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send invoice due reminder"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice details
        invoice = supabase.table("invoices").select("*,customers(*)").eq("id", invoice_id).single().execute()
        if not invoice.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        invoice_data = invoice.data
        customer = invoice_data["customers"]
        
        # Send email to customer
        email_data = EmailNotification(
            to_email=customer["email"],
            subject=f"Payment Reminder - Invoice #{invoice_data['invoice_number']}",
            body=f"""
            <h2>Payment Reminder</h2>
            <p>Dear {customer['name']},</p>
            <p>This is a friendly reminder that your invoice is due for payment.</p>
            <p><strong>Invoice Details:</strong></p>
            <ul>
                <li>Invoice Number: {invoice_data['invoice_number']}</li>
                <li>Amount: {invoice_data['total_amount']:,} VND</li>
                <li>Due Date: {invoice_data['due_date']}</li>
            </ul>
            <p>Please make payment at your earliest convenience.</p>
            <p>Thank you for your business!</p>
            """
        )
        background_tasks.add_task(send_email_notification, email_data)
        
        # Create notification for admin
        notification = NotificationCreate(
            user_id=current_user.id,
            title="Invoice Reminder Sent",
            message=f"Payment reminder sent for invoice #{invoice_data['invoice_number']} to {customer['name']}",
            type="info"
        )
        
        notification_dict = notification.dict()
        notification_dict["id"] = str(uuid.uuid4())
        notification_dict["read"] = False
        notification_dict["created_at"] = datetime.utcnow().isoformat()
        
        supabase.table("notifications").insert(notification_dict).execute()
        
        return {"message": "Invoice due reminder sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send invoice due reminder: {str(e)}"
        )

@router.post("/notifications/expense-approval")
async def send_expense_approval_notification(
    expense_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send expense approval notification"""
    try:
        supabase = get_supabase_client()
        
        # Get expense details
        expense = supabase.table("expenses").select("*,employees(*)").eq("id", expense_id).single().execute()
        if not expense.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense_data = expense.data
        employee = expense_data["employees"]
        
        # Send email to employee
        email_data = EmailNotification(
            to_email=employee["email"],
            subject=f"Expense Approval - {expense_data['description']}",
            body=f"""
            <h2>Expense Approval Notification</h2>
            <p>Dear {employee['first_name']} {employee['last_name']},</p>
            <p>Your expense has been approved.</p>
            <p><strong>Expense Details:</strong></p>
            <ul>
                <li>Description: {expense_data['description']}</li>
                <li>Amount: {expense_data['amount']:,} VND</li>
                <li>Date: {expense_data['expense_date']}</li>
                <li>Category: {expense_data['category']}</li>
            </ul>
            <p>Thank you for submitting your expense report.</p>
            """
        )
        background_tasks.add_task(send_email_notification, email_data)
        
        return {"message": "Expense approval notification sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send expense approval notification: {str(e)}"
        )
