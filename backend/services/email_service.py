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
        # Debug flag to control verbose logging
        self.debug = os.getenv("EMAIL_DEBUG", "0") == "1"
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
        
    def _format_additional_notes(self, additional_notes: str) -> str:
        """Format additional notes as bullet points (same style as GHI CHÚ)"""
        if not additional_notes:
            return ''
        
        lines = [line.strip() for line in additional_notes.split('\n') if line.strip()]
        bullet_points = ''.join([f'<p style="margin:5px 0;">• {line}</p>' for line in lines])
        
        return f'''<div style="margin-top:15px;"><div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">Thông tin bổ sung:</div><div style="font-size:12px; color:#000000; line-height:1.8;">{bullet_points}</div></div>'''
    
    def _format_default_notes(self, default_notes: list) -> str:
        """Format default notes as bullet points for GHI CHÚ section"""
        if not default_notes or not isinstance(default_notes, list):
            return ''
        
        bullet_points = ''.join([f'<p style="margin:5px 0;">• {note}</p>' for note in default_notes if note and note.strip()])
        return bullet_points
    
    def generate_quote_email_html(self, quote_data: Dict[str, Any], customer_name: str, employee_name: str = None, employee_phone: str = None, quote_items: list = None, custom_payment_terms: list = None, additional_notes: str = None, company_info: Dict[str, Any] = None, bank_info: Dict[str, Any] = None, default_notes: list = None) -> str:
        """Generate HTML content for quote email (for preview or sending)"""
        # Format currency
        def format_currency(amount):
            return f"{amount:,.0f} VND"
        
        # Format additional notes before using in f-string
        additional_notes_html = self._format_additional_notes(additional_notes) if additional_notes else ''
        
        # Create simple HTML email body with quote details
        quote_items_html = ""
        if quote_items:
            # Get category names for items from product_service_id -> products -> product_categories
            category_map = {}
            product_category_map = {}  # Map product_id -> category_id
            supabase = get_supabase_client()
            try:
                # Get product_service_ids from quote_items
                product_ids = [item.get('product_service_id') for item in quote_items if item.get('product_service_id')]
                if product_ids:
                    # Get products with their category_id
                    products_result = supabase.table("products").select("id, category_id").in_("id", product_ids).execute()
                    if products_result.data:
                        # Map product_id -> category_id
                        product_category_map = {p['id']: p.get('category_id') for p in products_result.data if p.get('category_id')}
                        # Get unique category_ids
                        category_ids = list(set([cat_id for cat_id in product_category_map.values() if cat_id]))
                        if category_ids:
                            # Get category names
                            categories_result = supabase.table("product_categories").select("id, name").in_("id", category_ids).execute()
                            if categories_result.data:
                                # Map category_id -> category_name
                                category_map = {cat['id']: cat.get('name', '') for cat in categories_result.data}
            except Exception as e:
                print(f"Error fetching category names from product_service_id: {e}")
                pass
            
            quote_items_html = """
                <div style=\"margin: 20px 0;\">
                    <table style=\"width: 100%; border-collapse: collapse; border: 1px solid #000;\">
                        <thead>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">STT</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">HẠNG MỤC</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">MÔ TẢ CHI TIẾT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">ĐVT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\" colspan=\"3\">QUY CÁCH</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">KHỐI LƯỢNG (m)</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\">ĐƠN GIÁ</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\">THÀNH TIỀN</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">GHI CHÚ</th>
                            </tr>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">NGANG (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">SÂU (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">CAO (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                            </tr>
                        </thead>
                        <tbody>
                """
            
            for idx, item in enumerate(quote_items, 1):
                # Lấy category_name từ product_service_id -> products -> product_categories
                category_name = item.get('category_name', '')
                
                # Nếu chưa có, lấy từ product_service_id sử dụng product_category_map đã tạo sẵn
                if not category_name:
                    product_service_id = item.get('product_service_id')
                    if product_service_id and product_service_id in product_category_map:
                        category_id = product_category_map[product_service_id]
                        if category_id and category_id in category_map:
                            category_name = category_map[category_id]
                        elif category_id:
                            try:
                                cat_result = supabase.table("product_categories").select("name").eq("id", category_id).single().execute()
                                if cat_result.data:
                                    category_name = cat_result.data.get('name', '')
                                    category_map[category_id] = category_name
                            except Exception:
                                pass
                
                # Fallback: nếu vẫn chưa có, thử lấy từ product_category_id (backward compatibility)
                if not category_name:
                    product_category_id = item.get('product_category_id')
                    if product_category_id:
                        if product_category_id in category_map:
                            category_name = category_map[product_category_id]
                        else:
                            try:
                                cat_result = supabase.table("product_categories").select("name").eq("id", product_category_id).single().execute()
                                if cat_result.data:
                                    category_name = cat_result.data.get('name', '')
                                    category_map[product_category_id] = category_name
                            except Exception:
                                pass
                
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
                if item.get('area'):
                    quantity_display = item.get('area')
                elif item.get('volume'):
                    quantity_display = item.get('volume')
                
                # Format total_price - if it's "TẶNG" or 0, show "TẶNG"
                total_price_display = item.get('total_price', 0)
                if total_price_display == 0 or str(total_price_display).upper() == 'TẶNG':
                    total_price_display = 'TẶNG'
                else:
                    total_price_display = format_currency(total_price_display)
                
                quote_items_html += f"""
                        <tr>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{idx}</td>
                            <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\">{category_name or ''}</td>
                            <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\">
                                <div style=\"font-weight:600; color:#000000;\">{item.get('name_product', '')}</div>
                                {f"<div style='font-size:12px;color:#000000;margin-top:4px;'>{item.get('description','')}</div>" if (item.get('description')) else ''}
                            </td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{item.get('unit', '')}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(length)}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(depth)}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(height)}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(quantity_display)}</td>
                            <td style=\"padding: 8px; text-align: right; border: 1px solid #000; color:#000000;\">{format_currency(item.get('unit_price', 0))}</td>
                            <td style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold; color:#000000;\">{total_price_display}</td>
                            <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\"></td>
                        </tr>
                """
            
            quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """
        
        # Calculate total product amount
        total_product_amount = 0
        if quote_items:
            for item in quote_items:
                total_price = item.get('total_price', 0)
                if isinstance(total_price, (int, float)) and total_price > 0:
                    total_product_amount += total_price
        
        # Calculate total and subtotal
        total_amount = quote_data.get('total_amount', total_product_amount)
        discount_amount = quote_data.get('discount_amount', 0)
        
        # Function to convert number to Vietnamese words (simplified)
        def number_to_words(num):
            if num == 0:
                return "Không"
            return f"{num:,.0f}"
        
        # Generate payment terms HTML - Always show payment terms section
        payment_terms_html = ""
        if custom_payment_terms and isinstance(custom_payment_terms, list) and len(custom_payment_terms) > 0:
            for term in custom_payment_terms:
                description = term.get('description', '') if isinstance(term, dict) else ''
                amount = term.get('amount', '') if isinstance(term, dict) else ''
                received = term.get('received', False) if isinstance(term, dict) else False
                received_text = 'ĐÃ NHẬN' if received else ''
                payment_terms_html += f"""
                                <tr style="background: #ffd700;">
                                    <td style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000;">{description}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #000; color:#000000;">{amount if amount else ''}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #000; color:#000000;">{received_text}</td>
                                </tr>
                                """
        
        # Always show default payment terms if custom_payment_terms is empty or None
        if not payment_terms_html:
            # Default payment terms
            default_terms = [
                {'description': 'CỌC ĐỢT 1 : LÊN THIẾT KẾ 3D', 'amount': '', 'received': False},
                {'description': 'CỌC ĐỢT 2: 50% KÍ HỢP ĐỒNG, RA ĐƠN SẢN XUẤT', 'amount': '', 'received': False},
                {'description': 'CÒN LẠI : KHI BÀN GIAO VÀ KIỂM TRA NGHIỆM THU CÔNG TRÌNH', 'amount': '', 'received': False}
            ]
            for term in default_terms:
                payment_terms_html += f"""
                                <tr style="background: #ffd700;">
                                    <td style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000;">{term['description']}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #000; color:#000000;"></td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #000; color:#000000;"></td>
                                </tr>
                                """
        
        # Get company info from customization or use defaults
        company_name_display = (company_info.get("company_name") if company_info else None) or "Công Ty TNHH Nhôm Kính Phúc Đạt"
        company_showroom = (company_info.get("company_showroom") if company_info else None) or "480/3 Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú, TP.HCM"
        company_factory = (company_info.get("company_factory") if company_info else None) or "334/6A Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú"
        company_website = (company_info.get("company_website") if company_info else None) or "https://www.kinhphucdat.com"
        company_hotline = (company_info.get("company_hotline") if company_info else None) or "0901.116.118"
        
        # Logo handling
        logo_src = "cid:company_logo"  # For email, use cid:company_logo
        if company_info and company_info.get("company_logo_base64"):
            logo_src = company_info.get("company_logo_base64")
        elif company_info and company_info.get("company_logo_url"):
            logo_src = company_info.get("company_logo_url")
        
        # Get bank info from customization or use defaults
        bank_account_name = (bank_info.get("bank_account_name") if bank_info else None) or "CÔNG TY TNHH NHÔM KÍNH PHÚC ĐẠT"
        bank_account_number = (bank_info.get("bank_account_number") if bank_info else None) or "197877019"
        bank_name = (bank_info.get("bank_name") if bank_info else None) or "Ngân Hàng TMCP Á Châu (ACB)"
        bank_branch = (bank_info.get("bank_branch") if bank_info else None) or "PGD Gò Mây"
        
        # Make all text colors black for better readability
        # This will be applied in the HTML template
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: white; border: 1px solid #000; padding: 0;">
                <!-- Header -->
                <div style="padding: 12px 20px 0 20px; border-bottom: 1px solid #000;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:40%; vertical-align:middle; padding:10px 0;">
                                <div style="display:inline-block;">
                                    <img src="{logo_src}" alt="PHÚC ĐẠT" style="height:64px; display:block;">
                                    <div style="font-size:12px; color:#000000; margin-top:6px; letter-spacing:1px;">KẾT NỐI KHÔNG GIAN</div>
                                </div>
                            </td>
                            <td style="width:60%; text-align:right; vertical-align:middle; padding:10px 0;">
                                <div style="font-size:13px; color:#000000; font-weight:600;">{company_name_display}</div>
                                <div style="font-size:12px; color:#000000; margin-top:4px;">Showroom: {company_showroom}</div>
                                <div style="font-size:12px; color:#000000;">Xưởng sản xuất: {company_factory}</div>
                                <div style="font-size:12px; color:#000000;">
                                    {f'<a href="{company_website}" style="color:#2563eb; text-decoration:none;">{company_website.replace("https://", "").replace("http://", "")}</a>' if company_website else ''}
                                    {f'<span style="color:#000000;"> | Hotline: {company_hotline}</span>' if company_hotline else ''}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Tiêu đề trung tâm -->
                    <div style="text-align:center; padding: 8px 0 16px 0;">
                        <div style="font-size:20px; font-weight:800; letter-spacing:1px; color:#000000;">BẢNG BÁO GIÁ</div>
                        <div style="font-size:12px; color:#000000; margin-top:6px;">
                            Công ty TNHH Nhôm Kính Phúc Đạt xin chân thành cảm ơn Quý khách đã quan tâm đến dịch vụ và sản phẩm của công ty.
                        </div>
                        <div style="font-size:12px; color:#000000;">
                            Phúc Đạt xin gửi đến Quý khách bảng báo giá khối lượng công trình như sau:
                        </div>
                    </div>

                    <!-- Thông tin khách hàng & nhân viên phụ trách -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:10px;">
                        <tr>
                            <td style="font-size:13px; color:#000000; font-weight:600; padding:6px 0;">
                                Khách Hàng: <span style="text-transform:uppercase;">{customer_name}</span>
                                {f' - {quote_data.get("customer_phone", "")}' if quote_data.get('customer_phone') else ''}
                            </td>
                        </tr>
                        {f'''<tr><td style="font-size:12px; color:#000000; padding:2px 0;">Địa chỉ: {quote_data.get('customer_address','')}</td></tr>''' if quote_data.get('customer_address') else ''}
                        <tr>
                            <td style="font-size:12px; color:#000000; font-weight:600; padding:6px 0; text-align:right;">
                                Kĩ Thuật Phụ Trách: {employee_name or '—'}
                                {f'&nbsp;&nbsp; SĐT: {employee_phone}' if employee_phone else ''}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Content -->
                <div style="padding: 20px;">
                    {quote_items_html}
                    
                    <!-- Tổng hạng mục -->
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background: #ffd700;">
                            <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">{format_currency(total_product_amount)}</td>
                            <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                        </tr>
                        {f'''
                        <tr style="background: #add8e6;">
                            <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">CHIẾT KHẤU {quote_data.get("discount_percentage", 0)}% KHÁCH THANH TOÁN TIỀN MẶT</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">-{format_currency(discount_amount)}</td>
                            <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                        </tr>
                        <tr style="background: #ffd700;">
                            <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">{format_currency(total_amount)}</td>
                            <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                        </tr>
                        ''' if discount_amount > 0 else ''}
                    </table>
                    
                    <!-- Giá thành tạm tính -->
                    <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border: 1px solid #000;">
                        <div style="font-size:14px; font-weight:bold; color:#000000;">
                            Giá thành tạm tính : {number_to_words(total_product_amount)} đồng.
                        </div>
                    </div>
                    
                    <!-- Phương thức thanh toán -->
                    <div style="margin: 20px 0;">
                        <div style="text-align:center; font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">PHƯƠNG THỨC THANH TOÁN</div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #ffd700;">
                                    <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: left;">Mô tả</th>
                                    <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: right;">Giá tiền</th>
                                    <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: center;">Đã nhận</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payment_terms_html}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Ghi chú -->
                    <div style="margin: 20px 0;">
                        <div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">GHI CHÚ</div>
                        <div style="font-size:12px; color:#000000; line-height:1.8;">
                            {self._format_default_notes(default_notes) if default_notes else '''
                            <p style="margin:5px 0;">• Nếu phụ kiện, thiết bị của khách hàng mà CTy lắp sẽ tính công 200k/1 bộ</p>
                            <p style="margin:5px 0;">• Giá đã bao gồm nhân công lắp đặt trọn gói trong khu vực TPHCM</p>
                            <p style="margin:5px 0;">• Giá chưa bao gồm Thuế GTGT 10%</p>
                            <p style="margin:5px 0;">• Thời gian lắp đặt từ 7 - 9 ngày, không tính chủ nhật hoặc ngày Lễ</p>
                            <p style="margin:5px 0;">• Bản vẽ 3D mang tính chất minh họa (giống thực tế 80% - 90%)</p>
                            <p style="margin:5px 0;">• Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao</p>
                            '''}
                            
                            {additional_notes_html}
                            
                            <div style="margin-top:15px;">
                                <p style="margin:5px 0; font-weight:bold; color:#000000;">* Thông tin tài khoản: {bank_account_name} : STK: {bank_account_number} - Tại {bank_name} - {bank_branch}.</p>
                                <p style="margin:5px 0; color:#000000;">Nội dung chuyển khoản: Tên khách hàng, địa chỉ công trình.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_body

    async def send_quote_email(self, quote_data: Dict[str, Any], customer_email: str, customer_name: str, quote_items: list = None, custom_payment_terms: list = None, additional_notes: str = None, prepared_html: str | None = None, company_info: Dict[str, Any] = None, bank_info: Dict[str, Any] = None, default_notes: list = None) -> bool:
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
            
            # Prefer regenerated HTML when there are custom edits so they are guaranteed to appear
            # Only fall back to prepared_html when there are no custom overrides
            if (custom_payment_terms or (additional_notes and additional_notes.strip()) or company_info or bank_info or default_notes):
                html_body = self.generate_quote_email_html(
                    quote_data=quote_data,
                    customer_name=customer_name,
                    employee_name=employee_name,
                    employee_phone=employee_phone,
                    quote_items=quote_items,
                    custom_payment_terms=custom_payment_terms,
                    additional_notes=additional_notes,
                    company_info=company_info,
                    bank_info=bank_info,
                    default_notes=default_notes
                )
            else:
                # Use prepared HTML if provided, but inject additional notes if available and not present
                if prepared_html and prepared_html.strip():
                    html_body = prepared_html.strip()
                    try:
                        if additional_notes and ('Thông tin bổ sung' not in html_body):
                            add_html = self._format_additional_notes(additional_notes)
                            # Insert before bank info block if possible, else before closing of GHI CHÚ container
                            inserted = False
                            if '* Thông tin tài khoản' in html_body:
                                html_body = html_body.replace(
                                    '* Thông tin tài khoản',
                                    f"{add_html}\n\n* Thông tin tài khoản",
                                    1
                                )
                                inserted = True
                            if not inserted and '</div>\n\t\t\t\t\t\t</div>' in html_body:
                                html_body = html_body.replace('</div>\n\t\t\t\t\t\t</div>', f"{add_html}</div>\n\t\t\t\t\t\t</div>", 1)
                    except Exception:
                        pass
                else:
                    html_body = self.generate_quote_email_html(
                        quote_data=quote_data,
                        customer_name=customer_name,
                        employee_name=employee_name,
                        employee_phone=employee_phone,
                        quote_items=quote_items,
                        custom_payment_terms=custom_payment_terms,
                        additional_notes=additional_notes,
                        company_info=company_info,
                        bank_info=bank_info,
                        default_notes=default_notes
                    )
            
            # Ensure additional notes are present in HTML if available
            try:
                if additional_notes and 'Thông tin bổ sung' not in html_body:
                    add_html = self._format_additional_notes(additional_notes)
                    if '* Thông tin tài khoản' in html_body:
                        html_body = html_body.replace(
                            '* Thông tin tài khoản',
                            f"{add_html}\n\n* Thông tin tài khoản",
                            1
                        )
                    else:
                        # Fallback: append before end of body
                        html_body = html_body.replace('</body>', f"{add_html}</body>")
            except Exception:
                pass

            # Format currency for text body
            def format_currency(amount):
                return f"{amount:,.0f} VND"
            
            # Create simple HTML email body with quote details (legacy - will be removed)
            quote_items_html = ""
            if quote_items:
                # Get category names for items from product_service_id -> products -> product_categories
                category_map = {}
                product_category_map = {}  # Map product_id -> category_id
                supabase = get_supabase_client()
                try:
                    # Get product_service_ids from quote_items
                    product_ids = [item.get('product_service_id') for item in quote_items if item.get('product_service_id')]
                    if product_ids:
                        if self.debug:
                            print(f"[Email Debug] Fetching categories for {len(product_ids)} products")
                        # Get products with their category_id
                        products_result = supabase.table("products").select("id, category_id").in_("id", product_ids).execute()
                        if products_result.data:
                            if self.debug:
                                print(f"[Email Debug] Found {len(products_result.data)} products")
                            # Map product_id -> category_id
                            product_category_map = {p['id']: p.get('category_id') for p in products_result.data if p.get('category_id')}
                            if self.debug:
                                print(f"[Email Debug] product_category_map: {product_category_map}")
                            # Get unique category_ids
                            category_ids = list(set([cat_id for cat_id in product_category_map.values() if cat_id]))
                            if category_ids:
                                if self.debug:
                                    print(f"[Email Debug] Fetching category names for {len(category_ids)} categories")
                                # Get category names
                                categories_result = supabase.table("product_categories").select("id, name").in_("id", category_ids).execute()
                                if categories_result.data:
                                    # Map category_id -> category_name
                                    category_map = {cat['id']: cat.get('name', '') for cat in categories_result.data}
                                    if self.debug:
                                        print(f"[Email Debug] category_map: {category_map}")
                except Exception as e:
                    print(f"Error fetching category names from product_service_id: {e}")
                    import traceback
                    traceback.print_exc()
                    pass
                
                quote_items_html = """
                <div style=\"margin: 20px 0;\">
                    <table style=\"width: 100%; border-collapse: collapse; border: 1px solid #000;\">
                        <thead>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">STT</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">HẠNG MỤC</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">MÔ TẢ CHI TIẾT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">ĐVT</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\" colspan=\"3\">QUY CÁCH</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">KHỐI LƯỢNG (m)</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\">ĐƠN GIÁ</th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\">THÀNH TIỀN</th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\">GHI CHÚ</th>
                            </tr>
                            <tr style=\"background: #1e40af; color: #fff;\">
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">NGANG (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">SÂU (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\">CAO (m)</th>
                                <th style=\"padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;\"></th>
                                <th style=\"padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;\"></th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for idx, item in enumerate(quote_items, 1):
                    # Lấy category_name từ product_service_id -> products -> product_categories
                    # Ưu tiên category_name đã được map sẵn từ router (nếu có)
                    category_name = item.get('category_name', '')
                    
                    # Nếu chưa có, lấy từ product_service_id sử dụng product_category_map đã tạo sẵn
                    if not category_name:
                        product_service_id = item.get('product_service_id')
                        if product_service_id:
                            if product_service_id in product_category_map:
                                category_id = product_category_map[product_service_id]
                                if category_id and category_id in category_map:
                                    category_name = category_map[category_id]
                                    if self.debug:
                                        print(f"[Email Debug] Item {idx}: Found category_name '{category_name}' from product_service_id {product_service_id}")
                                elif category_id:
                                    # Fallback: query trực tiếp nếu chưa có trong category_map
                                    try:
                                        cat_result = supabase.table("product_categories").select("name").eq("id", category_id).single().execute()
                                        if cat_result.data:
                                            category_name = cat_result.data.get('name', '')
                                            # Cache vào category_map
                                            category_map[category_id] = category_name
                                            if self.debug:
                                                print(f"[Email Debug] Item {idx}: Found category_name '{category_name}' from direct query")
                                    except Exception as e:
                                        if self.debug:
                                            print(f"[Email Debug] Item {idx}: Error querying category: {e}")
                            else:
                                if self.debug:
                                    print(f"[Email Debug] Item {idx}: product_service_id {product_service_id} not found in product_category_map")
                    
                    # Fallback: nếu vẫn chưa có, thử lấy từ product_category_id (backward compatibility)
                    if not category_name:
                        product_category_id = item.get('product_category_id')
                        if product_category_id:
                            if product_category_id in category_map:
                                category_name = category_map[product_category_id]
                            else:
                                try:
                                    cat_result = supabase.table("product_categories").select("name").eq("id", product_category_id).single().execute()
                                    if cat_result.data:
                                        category_name = cat_result.data.get('name', '')
                                        # Cache vào category_map
                                        category_map[product_category_id] = category_name
                                except Exception:
                                    pass
                    
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
                    
                    # Format total_price - if it's "TẶNG" or 0, show "TẶNG"
                    total_price_display = item.get('total_price', 0)
                    if total_price_display == 0 or str(total_price_display).upper() == 'TẶNG':
                        total_price_display = 'TẶNG'
                    else:
                        total_price_display = format_currency(total_price_display)
                    
                    quote_items_html += f"""
                            <tr>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{idx}</td>
                                <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\">{category_name or ''}</td>
                                <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\">
                                    <div style=\"font-weight:600; color:#000000;\">{item.get('name_product', '')}</div>
                                    {f"<div style='font-size:12px;color:#000000;margin-top:4px;'>{item.get('description','')}</div>" if (item.get('description')) else ''}
                                </td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{item.get('unit', '')}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(length)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(depth)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(height)}</td>
                                <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(quantity_display)}</td>
                                <td style=\"padding: 8px; text-align: right; border: 1px solid #000; color:#000000;\">{format_currency(item.get('unit_price', 0))}</td>
                                <td style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold; color:#000000;\">{total_price_display}</td>
                                <td style=\"padding: 8px; text-align: left; border: 1px solid #000; color:#000000;\"></td>
                            </tr>
                    """
                
                quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """
            
            # Calculate total product amount (sum of all total_price from quote_items)
            total_product_amount = 0
            if quote_items:
                for item in quote_items:
                    total_price = item.get('total_price', 0)
                    # Ignore "TẶNG" items (0 or string "TẶNG")
                    if isinstance(total_price, (int, float)) and total_price > 0:
                        total_product_amount += total_price
            
            # Calculate total and subtotal
            total_amount = quote_data.get('total_amount', total_product_amount)
            subtotal = quote_data.get('subtotal', total_product_amount)
            discount_amount = quote_data.get('discount_amount', 0)
            
            # Function to convert number to Vietnamese words (simplified)
            def number_to_words(num):
                # Simplified version - can be enhanced
                if num == 0:
                    return "Không"
                # For now, return formatted number
                return f"{num:,.0f}"
            
            # Generate payment terms HTML - Always show payment terms section
            payment_terms_html = ""
            if custom_payment_terms and isinstance(custom_payment_terms, list) and len(custom_payment_terms) > 0:
                for term in custom_payment_terms:
                    description = term.get('description', '') if isinstance(term, dict) else ''
                    amount = term.get('amount', '') if isinstance(term, dict) else ''
                    received = term.get('received', False) if isinstance(term, dict) else False
                    received_text = 'ĐÃ NHẬN' if received else ''
                    payment_terms_html += f"""
                                    <tr style="background: #ffd700;">
                                        <td style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000;">{description}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #000; color:#000000;">{amount if amount else ''}</td>
                                        <td style="padding: 10px; text-align: center; border: 1px solid #000; color:#000000;">{received_text}</td>
                                    </tr>
                                    """
            
            # Always show default payment terms if custom_payment_terms is empty or None
            if not payment_terms_html:
                # Default payment terms
                default_terms = [
                    {'description': 'CỌC ĐỢT 1 : LÊN THIẾT KẾ 3D', 'amount': '', 'received': False},
                    {'description': 'CỌC ĐỢT 2: 50% KÍ HỢP ĐỒNG, RA ĐƠN SẢN XUẤT', 'amount': '', 'received': False},
                    {'description': 'CÒN LẠI : KHI BÀN GIAO VÀ KIỂM TRA NGHIỆM THU CÔNG TRÌNH', 'amount': '', 'received': False}
                ]
                for term in default_terms:
                    payment_terms_html += f"""
                                    <tr style="background: #ffd700;">
                                        <td style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000;">{term['description']}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #000; color:#000000;"></td>
                                        <td style="padding: 10px; text-align: center; border: 1px solid #000; color:#000000;"></td>
                                    </tr>
                                    """
            
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: white; border: 1px solid #000; padding: 0;">
                    <!-- Header -->
                    <div style="padding: 12px 20px 0 20px; border-bottom: 1px solid #000;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="width:40%; vertical-align:middle; padding:10px 0;">
                                    <div style="display:inline-block;">
                                        <img src="cid:company_logo" alt="PHÚC ĐẠT" style="height:64px; display:block;">
                                        <div style="font-size:12px; color:#000000; margin-top:6px; letter-spacing:1px;">KẾT NỐI KHÔNG GIAN</div>
                                    </div>
                                </td>
                                <td style="width:60%; text-align:right; vertical-align:middle; padding:10px 0;">
                                    <div style="font-size:13px; color:#000000; font-weight:600;">Công Ty TNHH Nhôm Kính Phúc Đạt</div>
                                    <div style="font-size:12px; color:#000000; margin-top:4px;">Showroom: 480/3 Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú, TP.HCM</div>
                                    <div style="font-size:12px; color:#000000;">Xưởng sản xuất: 334/6A Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú</div>
                                    <div style="font-size:12px; color:#000000;">
                                        <a href="https://www.kinhphucdat.com" style="color:#2563eb; text-decoration:none;">www.kinhphucdat.com</a>
                                        <span style="color:#000000;"> | Hotline: 0901.116.118</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Tiêu đề trung tâm -->
                        <div style="text-align:center; padding: 8px 0 16px 0;">
                            <div style="font-size:20px; font-weight:800; letter-spacing:1px; color:#000000;">BẢNG BÁO GIÁ</div>
                            <div style="font-size:12px; color:#000000; margin-top:6px;">
                                Công ty TNHH Nhôm Kính Phúc Đạt xin chân thành cảm ơn Quý khách đã quan tâm đến dịch vụ và sản phẩm của công ty.
                            </div>
                            <div style="font-size:12px; color:#000000;">
                                Phúc Đạt xin gửi đến Quý khách bảng báo giá khối lượng công trình như sau:
                            </div>
                        </div>

                        <!-- Thông tin khách hàng & nhân viên phụ trách -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:10px;">
                            <tr>
                                <td style="font-size:13px; color:#000000; font-weight:600; padding:6px 0;">
                                    Khách Hàng: <span style="text-transform:uppercase;">{customer_name}</span>
                                    {f' - {quote_data.get("customer_phone", "")}' if quote_data.get('customer_phone') else ''}
                                </td>
                            </tr>
                            {f'''<tr><td style="font-size:12px; color:#000000; padding:2px 0;">Địa chỉ: {quote_data.get('customer_address','')}</td></tr>''' if quote_data.get('customer_address') else ''}
                            <tr>
                                <td style="font-size:12px; color:#000000; font-weight:600; padding:6px 0; text-align:right;">
                                    Kĩ Thuật Phụ Trách: {employee_name or '—'}
                                    {f'&nbsp;&nbsp; SĐT: {employee_phone}' if employee_phone else ''}
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 20px;">
                        {quote_items_html}
                        
                        <!-- Tổng hạng mục -->
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <tr style="background: #ffd700;">
                                <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">{format_currency(total_product_amount)}</td>
                                <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                            </tr>
                            {f'''
                            <tr style="background: #add8e6;">
                                <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">CHIẾT KHẤU {quote_data.get("discount_percentage", 0)}% KHÁCH THANH TOÁN TIỀN MẶT</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">-{format_currency(discount_amount)}</td>
                                <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                            </tr>
                            <tr style="background: #ffd700;">
                                <td colspan="10" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">{format_currency(total_amount)}</td>
                                <td style="padding: 10px; border: 1px solid #000; color:#000000;"></td>
                            </tr>
                            ''' if discount_amount > 0 else ''}
                        </table>
                        
                        <!-- Giá thành tạm tính -->
                        <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border: 1px solid #000;">
                            <div style="font-size:14px; font-weight:bold; color:#000000;">
                                Giá thành tạm tính : {number_to_words(total_product_amount)} đồng.
                            </div>
                        </div>
                        
                        <!-- Phương thức thanh toán -->
                        <div style="margin: 20px 0;">
                            <div style="text-align:center; font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">PHƯƠNG THỨC THANH TOÁN</div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                <tr style="background: #ffd700;">
                                        <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: left;">Mô tả</th>
                                        <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: right;">Giá tiền</th>
                                        <th style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000; text-align: center;">Đã nhận</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {payment_terms_html}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Ghi chú -->
                        <div style="margin: 20px 0;">
                            <div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">GHI CHÚ</div>
                            <div style="font-size:12px; color:#000000; line-height:1.8;">
                                <p style="margin:5px 0; color:#000000;">• Nếu phụ kiện, thiết bị của khách hàng mà CTy lắp sẽ tính công 200k/1 bộ</p>
                                <p style="margin:5px 0; color:#000000;">• Giá đã bao gồm nhân công lắp đặt trọn gói trong khu vực TPHCM</p>
                                <p style="margin:5px 0; color:#000000;">• Giá chưa bao gồm Thuế GTGT 10%</p>
                                <p style="margin:5px 0; color:#000000;">• Thời gian lắp đặt từ 7 - 9 ngày, không tính chủ nhật hoặc ngày Lễ</p>
                                <p style="margin:5px 0; color:#000000;">• Bản vẽ 3D mang tính chất minh họa (giống thực tế 80% - 90%)</p>
                                <p style="margin:5px 0; color:#000000;">• Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao</p>
                                
                                <div style="margin-top:15px;">
                                    <p style="margin:5px 0; font-weight:bold; color:#000000;">* Thông tin tài khoản: CÔNG TY TNHH NHÔM KÍNH PHÚC ĐẠT : STK: 197877019 - Tại Ngân Hàng TMCP Á Châu (ACB) - PGD Gò Mây.</p>
                                    <p style="margin:5px 0; color:#000000;">Nội dung chuyển khoản: Tên khách hàng, địa chỉ công trình.</p>
                                </div>
                                </div>
                                </div>
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
              <div style="border: 1px solid #000;">
                <div style="padding: 16px; border-bottom: 1px solid #000;">
                  <h2 style="margin: 0; color: #333;">{subject}</h2>
                </div>
                <div style="padding: 16px;">
                  <p style="margin: 0 0 12px 0; white-space: pre-line;">{message or ''}</p>
                  {f'<div style="margin-top:16px"><a href="{action_url}" style="background:#0f172a;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px;">Xem chi tiết</a></div>' if action_url else ''}
                </div>
                <div style="padding: 12px; border-top: 1px solid #000; text-align: center; color:#000000; font-size:12px;">
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
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #000;">Tên sản phẩm</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Số lượng</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Đơn vị</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #000;">Đơn giá</th>
                                <th style="padding: 10px; text-align: right; border: 1px solid #000;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                """
                
                for item in quote_items:
                    quote_items_html += f"""
                            <tr>
                                <td style="padding: 10px; border: 1px solid #000;">{item.get('name_product', '')}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #000;">{item.get('quantity', 0)}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #000;">{item.get('unit', '')}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #000;">{format_currency(item.get('unit_price', 0))}</td>
                                <td style="padding: 10px; text-align: right; border: 1px solid #000; font-weight: bold;">{format_currency(item.get('total_price', 0))}</td>
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
                <div style="border: 1px solid #000;">
                    <!-- Header -->
                    <div style="padding: 12px 20px; border-bottom: 1px solid #000; background: #f8f9fa; display:flex; align-items:center; gap:12px;">
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
                            <p style="margin: 0; padding: 10px; border: 1px solid #000;">
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
