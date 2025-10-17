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
        
    async def send_quote_email(self, quote_data: Dict[str, Any], customer_email: str, customer_name: str, quote_items: list = None) -> bool:
        """Send quote email to customer"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("Email credentials not configured, skipping email send")
                return False
                
            # Create email content
            subject = f"Báo giá {quote_data['quote_number']} - {customer_name}"
            
            # Format currency
            def format_currency(amount):
                return f"{amount:,.0f} VND"
            
                # Create simple HTML email body with quote details
            quote_items_html = ""
            if quote_items:
                quote_items_html = """
                <div style="margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">Chi tiết sản phẩm/dịch vụ</h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tên sản phẩm</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Số lượng</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Đơn vị</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Đơn giá</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for item in quote_items:
                    quote_items_html += f"""
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">{item.get('name_product', '')}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{item.get('quantity', 0)}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{item.get('unit', '')}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">{format_currency(item.get('unit_price', 0))}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">{format_currency(item.get('total_price', 0))}</td>
                            </tr>
                    """
                
                quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """
            
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="border: 1px solid #ddd;">
                    <!-- Header -->
                    <div style="padding: 20px; border-bottom: 1px solid #ddd;">
                        <h1 style="margin: 0; color: #333; font-size: 24px;">Báo Giá Dịch Vụ</h1>
                        <p style="margin: 10px 0 0 0; color: #666;">Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 20px;">
                        <!-- Quote Info -->
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #333;">Thông tin báo giá</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Số báo giá:</td>
                                    <td style="padding: 5px 0;">{quote_data['quote_number']}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Ngày phát hành:</td>
                                    <td style="padding: 5px 0;">{quote_data.get('issue_date', 'N/A')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Hiệu lực đến:</td>
                                    <td style="padding: 5px 0;">{quote_data.get('valid_until', 'N/A')}</td>
                                </tr>
                                {f'''
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Dự án:</td>
                                    <td style="padding: 5px 0;">{quote_data.get('project_name')}</td>
                                </tr>
                                ''' if quote_data.get('project_name') else ''}
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Tổng giá trị:</td>
                                    <td style="padding: 5px 0; font-size: 18px; font-weight: bold;">{format_currency(quote_data.get('total_amount', 0))}</td>
                                </tr>
                            </table>
                        </div>
                        
                        {quote_items_html}
                        
                        <!-- Terms -->
                        <div style="margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #333;">Điều khoản và điều kiện</h3>
                            <p style="margin: 0; padding: 10px; border: 1px solid #ddd;">
                                {quote_data.get('terms', 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.')}
                            </p>
                        </div>
                        
                        <!-- Notes -->
                        {f'''
                        <div style="margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #333;">Ghi chú</h3>
                            <p style="margin: 0; padding: 10px; border: 1px solid #ddd;">
                                {quote_data.get("notes", "")}
                            </p>
                        </div>
                        ''' if quote_data.get('notes') else ''}
                        
                        <!-- Action Buttons -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/sales/quotes/{quote_data.get('id')}" style="background: #666; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 5px;">
                                Xem Chi Tiết Báo Giá
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 20px; border-top: 1px solid #ddd; text-align: center;">
                        <p style="margin: 0; color: #666;">
                            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #333; font-weight: bold;">
                            Trân trọng,<br>Đội ngũ bán hàng
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
            # Set display name for sender
            msg['From'] = f"Bộ phận Công ty Phúc Đạt <{self.smtp_username}>"
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

    async def send_quote_approved_notification_email(self, quote_data: Dict[str, Any], employee_email: str, employee_name: str, quote_items: list = None) -> bool:
        """Send quote approved notification email to employee"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("Email credentials not configured, skipping notification email send")
                return False
                
            # Create email content
            subject = f"Báo giá {quote_data['quote_number']} đã được duyệt"
            
            # Format currency
            def format_currency(amount):
                return f"{amount:,.0f} VND"
            
            # Create simple HTML email body for employee notification
            quote_items_html = ""
            if quote_items:
                quote_items_html = """
                <div style="margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">Chi tiết sản phẩm/dịch vụ</h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Tên sản phẩm</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Số lượng</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Đơn vị</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Đơn giá</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for item in quote_items:
                    quote_items_html += f"""
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">{item.get('name_product', '')}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{item.get('quantity', 0)}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{item.get('unit', '')}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">{format_currency(item.get('unit_price', 0))}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">{format_currency(item.get('total_price', 0))}</td>
                            </tr>
                    """
                
                quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """
            
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="border: 1px solid #ddd;">
                    <!-- Header -->
                    <div style="padding: 20px; border-bottom: 1px solid #ddd; background: #f8f9fa;">
                        <h1 style="margin: 0; color: #28a745; font-size: 24px;">Báo Giá Đã Được Duyệt</h1>
                        <p style="margin: 10px 0 0 0; color: #666;">Chúc mừng! Báo giá của bạn đã được phê duyệt</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 20px;">
                        <!-- Quote Info -->
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #333;">Thông tin báo giá</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Số báo giá:</td>
                                    <td style="padding: 5px 0;">{quote_data['quote_number']}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Ngày phát hành:</td>
                                    <td style="padding: 5px 0;">{quote_data.get('issue_date', 'N/A')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Hiệu lực đến:</td>
                                    <td style="padding: 5px 0;">{quote_data.get('valid_until', 'N/A')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Tổng giá trị:</td>
                                    <td style="padding: 5px 0; font-size: 18px; font-weight: bold; color: #28a745;">{format_currency(quote_data.get('total_amount', 0))}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Trạng thái:</td>
                                    <td style="padding: 5px 0; color: #28a745; font-weight: bold;">ĐÃ ĐƯỢC DUYỆT</td>
                                </tr>
                            </table>
                        </div>
                        
                        {quote_items_html}
                        
                        <!-- Success Message -->
                        <div style="margin: 20px 0; padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">
                            <h3 style="margin: 0 0 10px 0; color: #155724;">Thông báo quan trọng</h3>
                            <p style="margin: 0; color: #155724;">
                                Báo giá <strong>{quote_data['quote_number']}</strong> của bạn đã được phê duyệt thành công. 
                                Bạn có thể tiến hành các bước tiếp theo trong quy trình bán hàng.
                            </p>
                        </div>
                        
                        <!-- Notes -->
                        {f'''
                        <div style="margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #333;">Ghi chú</h3>
                            <p style="margin: 0; padding: 10px; border: 1px solid #ddd;">
                                {quote_data.get("notes", "")}
                            </p>
                        </div>
                        ''' if quote_data.get('notes') else ''}
                        
                        <!-- Action Buttons -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/sales/quotes/{quote_data.get('id')}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 5px; border-radius: 5px;">
                                Xem Chi Tiết Báo Giá
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 20px; border-top: 1px solid #ddd; text-align: center; background: #f8f9fa;">
                        <p style="margin: 0; color: #666;">
                            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản lý.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #333; font-weight: bold;">
                            Trân trọng,<br>Đội ngũ quản lý
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version
            text_body = f"""
            Báo giá {quote_data['quote_number']} đã được duyệt
            
            Xin chào {employee_name},
            
            Chúc mừng! Báo giá của bạn đã được phê duyệt thành công.
            
            Thông tin báo giá:
            - Số báo giá: {quote_data['quote_number']}
            - Ngày phát hành: {quote_data.get('issue_date', 'N/A')}
            - Hiệu lực đến: {quote_data.get('valid_until', 'N/A')}
            - Tổng giá trị: {format_currency(quote_data.get('total_amount', 0))}
            - Trạng thái: ĐÃ ĐƯỢC DUYỆT
            
            Bạn có thể tiến hành các bước tiếp theo trong quy trình bán hàng.
            
            {f'Ghi chú: {quote_data.get("notes", "")}' if quote_data.get('notes') else ''}
            
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản lý.
            
            Trân trọng,
            Đội ngũ quản lý
            """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_username
            msg['To'] = employee_email
            
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
            
            print(f"Quote approved notification email sent successfully to {employee_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send quote approved notification email: {e}")
            return False

# Global email service instance
email_service = EmailService()
