"""
Email service for sending quotes and invoices to customers
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from typing import Dict, Any
from datetime import datetime
from services.supabase_client import get_supabase_client

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "phannguyendangkhoa0915@gmail.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "wozhwluxehsfuqjm")
        # Resolve logo path robustly: allow env override, then project-root/image/logo_phucdat.jpg
        env_logo = os.getenv("COMPANY_LOGO_PATH")
        if env_logo and os.path.exists(env_logo):
            self.logo_path = env_logo
        else:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            self.logo_path = os.path.join(project_root, 'image', 'logo_phucdat.jpg')

    def _attach_company_logo(self, msg: MIMEMultipart) -> str | None:
        """Attach company logo inline and return its content-id.
        Returns 'company_logo' if attached successfully, otherwise None.
        """
        try:
            if os.path.exists(self.logo_path):
                with open(self.logo_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', '<company_logo>')
                    img.add_header('Content-Disposition', 'inline', filename='logo_phucdat.jpg')
                    msg.attach(img)
                    return 'company_logo'
            return None
        except Exception:
            return None

    def _html_to_pdf_bytes(self, html: str) -> bytes | None:
        """Best-effort HTML→PDF conversion. Tries WeasyPrint, then xhtml2pdf. Returns None if unavailable."""
        # Try WeasyPrint
        try:
            from weasyprint import HTML  # type: ignore
            pdf_bytes = HTML(string=html).write_pdf()
            return pdf_bytes
        except Exception:
            pass
        # Try xhtml2pdf
        try:
            from xhtml2pdf import pisa  # type: ignore
            import io
            src = io.StringIO(html)
            out = io.BytesIO()
            pisa.CreatePDF(src, dest=out)  # returns pisaStatus, but we can ignore
            return out.getvalue()
        except Exception:
            return None
        
    async def send_quote_email(self, quote_data: Dict[str, Any], customer_email: str, customer_name: str, quote_items: list = None) -> bool:
        """Send quote email to customer"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("Email credentials not configured, skipping email send")
                return False
                
            # Resolve employee in charge from ID if needed
            employee_name = quote_data.get('employee_in_charge_name')
            employee_phone = quote_data.get('employee_in_charge_phone')
            emp_id = quote_data.get('employee_in_charge_id') or quote_data.get('created_by')
            if not employee_name:
                try:
                    if emp_id:
                        supabase = get_supabase_client()
                        # Step 1: read employee basic fields including user_id
                        emp_res = (
                            supabase
                            .table('employees')
                            .select('id, user_id, full_name, first_name, last_name, phone')
                            .eq('id', emp_id)
                            .single()
                            .execute()
                        )
                        if emp_res.data:
                            emp = emp_res.data
                            employee_phone = emp.get('phone')
                            # Candidate names from employees table
                            candidate_name = emp.get('full_name') or f"{emp.get('first_name','')} {emp.get('last_name','')}".strip()
                            # Step 2: prefer users.full_name if available
                            user_full_name = None
                            user_id = emp.get('user_id')
                            if user_id:
                                try:
                                    user_res = (
                                        supabase
                                        .table('users')
                                        .select('full_name')
                                        .eq('id', user_id)
                                        .single()
                                        .execute()
                                    )
                                    if user_res.data and user_res.data.get('full_name'):
                                        user_full_name = user_res.data.get('full_name')
                                except Exception:
                                    pass
                            employee_name = user_full_name or candidate_name or None
                except Exception:
                    pass

            # Build display string: prefer "<id> - <name>", fallback id only
            employee_display = None
            try:
                if emp_id:
                    employee_display = f"{emp_id} - {employee_name}" if employee_name else str(emp_id)
            except Exception:
                employee_display = employee_name

            # Create email content
            subject = f"Báo giá {quote_data['quote_number']} - {customer_name}"
            
            # Format currency
            def format_currency(amount):
                return f"{amount:,.0f} VND"
            
                # Create simple HTML email body with quote details
            quote_items_html = ""
            if quote_items:
                # Get category names for items if needed
                category_map = {}
                try:
                    supabase = get_supabase_client()
                    category_ids = [item.get('product_category_id') for item in quote_items if item.get('product_category_id')]
                    if category_ids:
                        categories_result = supabase.table("product_categories").select("id, name").in_("id", category_ids).execute()
                        if categories_result.data:
                            category_map = {cat['id']: cat.get('name', '') for cat in categories_result.data}
                except Exception:
                    pass
                
                quote_items_html = """
                <div style=\"margin: 20px 0;\">
                    <h3 style=\"margin: 0 0 15px 0; color: #333;\">Chi tiết sản phẩm/dịch vụ</h3>
                    <table style=\"width: 100%; border-collapse: collapse; border: 1px solid #ddd;\">
                        <thead>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">STT</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;\">HẠNG MỤC</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;\">MÔ TẢ CHI TIẾT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">ĐVT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\" colspan=\"3\">QUY CÁCH</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">KHỐI LƯỢNG (m)</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;\">ĐƠN GIÁ</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;\">THÀNH TIỀN</th>
                            </tr>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">NGANG (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">SÂU (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\">CAO (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;\"></th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for idx, item in enumerate(quote_items, 1):
                    category_name = ''
                    if item.get('product_category_id'):
                        category_name = category_map.get(item.get('product_category_id'), '')
                    if not category_name and item.get('category_name'):
                        category_name = item.get('category_name', '')
                    
                    length = item.get('length') or ''
                    depth = item.get('depth') or ''
                    height = item.get('height') or ''
                    
                    # Format dimensions
                    def format_dimension(val):
                        if val is None or val == '':
                            return ''
                        try:
                            num_val = float(val)
                            return f'{num_val:.2f}' if num_val != 0 else ''
                        except:
                            return str(val) if val else ''
                    
                    quantity_display = item.get('quantity', 0)
                    # Try to use area or volume if available
                    if item.get('area'):
                        quantity_display = item.get('area')
                    elif item.get('volume'):
                        quantity_display = item.get('volume')
                    
                    quote_items_html += f"""
                            <tr>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{idx}</td>
                                <td style=\"padding: 8px; text-align: left; border: 1px solid #ddd;\">{category_name or '—'}</td>
                                <td style=\"padding: 8px; text-align: left; border: 1px solid #ddd;\">
                                    <div style=\"font-weight:600;\">{item.get('name_product', '')}</div>
                                    {f"<div style='font-size:12px;color:#666;margin-top:4px;'>{item.get('description','')}</div>" if (item.get('description')) else ''}
                                </td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{item.get('unit', '')}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{format_dimension(length)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{format_dimension(depth)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{format_dimension(height)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{format_dimension(quantity_display)}</td>
                                <td style=\"padding: 8px; text-align: right; border: 1px solid #ddd;\">{format_currency(item.get('unit_price', 0))}</td>
                                <td style=\"padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;\">{format_currency(item.get('total_price', 0))}</td>
                            </tr>
                    """
                
                quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """
            
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">
                <div style="border: 1px solid #ddd;">
                    <!-- Header (giống mẫu hình) -->
                    <div style="padding: 12px 20px 0 20px; border-bottom: 1px solid #ddd;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="width:40%; vertical-align:middle; padding:10px 0;">
                                    <!-- Logo công ty -->
                                    <div style="display:inline-block;">
                                        <img src="cid:company_logo" alt="PHÚC ĐẠT" style="height:64px; display:block;">
                                        <div style="font-size:12px; color:#1f2937; margin-top:6px; letter-spacing:1px;">KẾT NỐI KHÔNG GIAN</div>
                                    </div>
                                </td>
                                <td style="width:60%; text-align:right; vertical-align:middle; padding:10px 0;">
                                    <div style="font-size:13px; color:#111; font-weight:600;">Công Ty TNHH Nhôm Kính Phúc Đạt</div>
                                    <div style="font-size:12px; color:#374151; margin-top:4px;">Showroom: 480/3 Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú, TP.HCM</div>
                                    <div style="font-size:12px; color:#374151;">Xưởng sản xuất: 334/6A Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú</div>
                                    <div style="font-size:12px; color:#374151;">
                                        <a href="https://www.kinhphucdat.com" style="color:#2563eb; text-decoration:none;">www.kinhphucdat.com</a>
                                        <span style="color:#6b7280;"> | Hotline: 0901.116.118</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Tiêu đề trung tâm -->
                        <div style="text-align:center; padding: 8px 0 16px 0;">
                            <div style="font-size:20px; font-weight:800; letter-spacing:1px;">BẢNG BÁO GIÁ</div>
                            <div style="font-size:12px; color:#374151; margin-top:6px;">
                                Công ty TNHH Nhôm Kính Phúc Đạt xin chân thành cám ơn Quý khách đã quan tâm đến dịch vụ và sản phẩm của công ty.
                            </div>
                            <div style="font-size:12px; color:#374151;">
                                Phúc Đạt xin gửi đến Quý khách bảng báo giá khối lượng công trình như sau:
                            </div>
                        </div>

                        <!-- Thông tin khách hàng & nhân viên phụ trách -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:10px;">
                            <tr>
                                <td style="font-size:13px; color:#111; font-weight:600; padding:6px 0;">
                                    Khách Hàng: <span style="text-transform:uppercase;">{customer_name}</span>
                                </td>
                            </tr>
                            {f'''<tr><td style="font-size:12px; color:#374151; padding:2px 0;">Địa chỉ: {quote_data.get('customer_address','')}</td></tr>''' if quote_data.get('customer_address') else ''}
                            <tr>
                                <td style="font-size:12px; color:#111; font-weight:600; padding:6px 0; text-align:right;">
                                    Nhân viên phụ trách: {employee_display or '—'}
                                    {f'&nbsp;&nbsp; SDT: {employee_phone}' if employee_phone else ''}
                                </td>
                            </tr>
                        </table>
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
            # Root related (for inline images)
            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            # Set display name for sender
            msg['From'] = f"Bộ phận Công ty Phúc Đạt <{self.smtp_username}>"
            msg['To'] = customer_email
            
            # Alternative container inside related
            alt = MIMEMultipart('alternative')
            alt.attach(MIMEText(text_body, 'plain', 'utf-8'))
            alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(alt)
            self._attach_company_logo(msg)

            # Try attach PDF version of the quote
            try:
                pdf_bytes = self._html_to_pdf_bytes(html_body)
                if pdf_bytes:
                    pdf_part = MIMEApplication(pdf_bytes, _subtype='pdf')
                    pdf_part.add_header('Content-Disposition', 'attachment', filename=f"Bao-gia-{quote_data.get('quote_number','')}.pdf")
                    msg.attach(pdf_part)
            except Exception:
                pass
            
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

    async def send_notification_email(self, employee_email: str, title: str, message: str, action_url: str | None = None) -> bool:
        """Send a simple notification email to an employee"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("Email credentials not configured, skipping notification email send")
                return False

            subject = title or "Thông báo"
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="border: 1px solid #ddd;">
                <div style="padding: 16px; border-bottom: 1px solid #ddd;">
                  <h2 style="margin: 0; color: #333;">{subject}</h2>
                </div>
                <div style="padding: 16px;">
                  <p style="margin: 0 0 12px 0; white-space: pre-line;">{message or ''}</p>
                  {f'<div style="margin-top:16px"><a href="{action_url}" style="background:#0f172a;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px;">Xem chi tiết</a></div>' if action_url else ''}
                </div>
                <div style="padding: 12px; border-top: 1px solid #ddd; text-align: center; color:#666; font-size:12px;">
                  Bộ phận Công ty Phúc Đạt
                </div>
              </div>
            </body>
            </html>
            """

            text_body = f"{title or 'Thông báo'}\n\n{message or ''}\n\n{('Xem chi tiết: ' + action_url) if action_url else ''}"

            # Root related (for inline images)
            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            msg['From'] = f"Bộ phận Công ty Phúc Đạt <{self.smtp_username}>"
            msg['To'] = employee_email

            alt = MIMEMultipart('alternative')
            alt.attach(MIMEText(text_body, 'plain', 'utf-8'))
            alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(alt)
            self._attach_company_logo(msg)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            print(f"Notification email sent successfully to {employee_email}")
            return True
        except Exception as e:
            print(f"Failed to send notification email: {e}")
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
                    <div style="padding: 12px 20px; border-bottom: 1px solid #ddd; background: #f8f9fa; display:flex; align-items:center; gap:12px;">
                        <img src=\"cid:company_logo\" alt=\"PHÚC ĐẠT\" style=\"height:40px; display:block;\" />
                        <div>
                            <h1 style=\"margin: 0; color: #28a745; font-size: 20px;\">Báo Giá Đã Được Duyệt</h1>
                            <p style=\"margin: 6px 0 0 0; color: #666;\">Chúc mừng! Báo giá của bạn đã được phê duyệt</p>
                        </div>
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
            # Root related (for inline images)
            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            msg['From'] = self.smtp_username
            msg['To'] = employee_email
            
            alt = MIMEMultipart('alternative')
            alt.attach(MIMEText(text_body, 'plain', 'utf-8'))
            alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(alt)
            self._attach_company_logo(msg)
            
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
