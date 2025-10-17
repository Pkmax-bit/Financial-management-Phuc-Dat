"""
Email service for sending quotes and invoices to customers
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
from datetime import datetime

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "phannguyendangkhoa0915@gmail.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "wozhwluxehsfuqjm")
        
    async def send_quote_email(self, quote_data: Dict[str, Any], customer_email: str, customer_name: str) -> bool:
        """Send quote email to customer"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("⚠️ Email credentials not configured, skipping email send")
                return False
                
            # Create email content
            subject = f"Báo giá {quote_data['quote_number']} - {customer_name}"
            
            # Format currency
            def format_currency(amount):
                return f"{amount:,.0f} VND"
            
            # Create HTML email body
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        Báo giá {quote_data['quote_number']}
                    </h2>
                    
                    <p>Xin chào <strong>{customer_name}</strong>,</p>
                    
                    <p>Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi. Dưới đây là báo giá chi tiết:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Thông tin báo giá</h3>
                        <p><strong>Số báo giá:</strong> {quote_data['quote_number']}</p>
                        <p><strong>Ngày phát hành:</strong> {quote_data.get('issue_date', 'N/A')}</p>
                        <p><strong>Hiệu lực đến:</strong> {quote_data.get('valid_until', 'N/A')}</p>
                        <p><strong>Tổng giá trị:</strong> {format_currency(quote_data.get('total_amount', 0))}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2c3e50;">Điều khoản và điều kiện</h3>
                        <p style="background-color: #e8f4fd; padding: 10px; border-left: 4px solid #3498db;">
                            {quote_data.get('terms', 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.')}
                        </p>
                    </div>
                    
                    {f'<div style="margin: 20px 0;"><h3 style="color: #2c3e50;">Ghi chú</h3><p>{quote_data.get("notes", "")}</p></div>' if quote_data.get('notes') else ''}
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <p style="color: #7f8c8d; font-size: 14px;">
                            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
                        </p>
                        <p style="color: #7f8c8d; font-size: 14px;">
                            Trân trọng,<br>
                            <strong>Đội ngũ bán hàng</strong>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version
            text_body = f"""
            Báo giá {quote_data['quote_number']}
            
            Xin chào {customer_name},
            
            Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi. Dưới đây là báo giá chi tiết:
            
            Số báo giá: {quote_data['quote_number']}
            Ngày phát hành: {quote_data.get('issue_date', 'N/A')}
            Hiệu lực đến: {quote_data.get('valid_until', 'N/A')}
            Tổng giá trị: {format_currency(quote_data.get('total_amount', 0))}
            
            Điều khoản và điều kiện:
            {quote_data.get('terms', 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.')}
            
            {f'Ghi chú: {quote_data.get("notes", "")}' if quote_data.get('notes') else ''}
            
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
            
            Trân trọng,
            Đội ngũ bán hàng
            """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_username
            msg['To'] = customer_email
            
            # Attach both plain text and HTML versions
            text_part = MIMEText(text_body, 'plain', 'utf-8')
            html_part = MIMEText(html_body, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"Quote email sent successfully to {customer_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send quote email: {e}")
            return False

# Global email service instance
email_service = EmailService()
