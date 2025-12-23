import os
from typing import Any, Dict, List, Optional


class EmailService:
    """
    Stubbed EmailService.
    Email sending is DISABLED in this environment to avoid backend startup errors.
    All public methods are no-ops and return False or dummy values.
    """

    def __init__(self) -> None:
        self.email_provider = os.getenv("EMAIL_PROVIDER", "disabled")

    # ---- Generic send helpers (no-op) ----

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        email_type: str = "general",
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Generic send email function.
        Stub implementation: prints a warning and returns False.
        """
        print(
            f"[EMAIL DISABLED] Would send '{email_type}' email to {to_email} "
            f"with subject '{subject}'. Email service is currently disabled."
        )
        return False

    # ---- Convenience wrappers used across the app (also no-op) ----

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_link: str,
    ) -> bool:
        print(
            f"[EMAIL DISABLED] Would send password reset email to {to_email} "
            f"with link {reset_link}."
        )
        return False

    async def send_quote_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        print(
            f"[EMAIL DISABLED] Would send quote email to {to_email} "
            f"with subject '{subject}'."
        )
        return False

    async def send_notification_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        print(
            f"[EMAIL DISABLED] Would send notification email to {to_email} "
            f"with subject '{subject}'."
        )
        return False


# Keep a module-level instance to match existing import pattern:
# from services.email_service import email_service
email_service = EmailService()


