"""
Email service for sending quotes and invoices to customers
"""

import smtplib
import os
import base64
import io
import asyncio
import json
import requests
from concurrent.futures import ThreadPoolExecutor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from typing import Dict, Any, Optional, List
from datetime import datetime
from decimal import Decimal, InvalidOperation
# Lazy import to avoid initialization issues during testing
# from services.supabase_client import get_supabase_client
from config import settings

class EmailService:
    def __init__(self):
        # Email provider: 'smtp' (default for local), 'resend' (recommended for Render), or 'n8n' (for n8n automation)
        self.email_provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()

        # SMTP Configuration (for local development)
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        # Support both SMTP_USER (from config.py) and SMTP_USERNAME (legacy) for backward compatibility
        # SECURITY: No default values for credentials
        self.smtp_username = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        # SMTP timeout in seconds (important for Render to avoid hanging)
        self.smtp_timeout = int(os.getenv("SMTP_TIMEOUT", "30"))

        # Resend API Configuration (for Render/production)
        self.resend_api_key = os.getenv("RESEND_API_KEY", "")
        self.resend_from_email = os.getenv("RESEND_FROM_EMAIL", "noreply@resend.dev")
        self.resend_api_url = "https://api.resend.com/emails"

        # n8n Webhook Configuration (for n8n automation)
        self.n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "")
        self.n8n_webhook_id = os.getenv("N8N_WEBHOOK_ID", "")  # Optional: webhook ID for authentication
        self.n8n_api_key = os.getenv("N8N_API_KEY", "")  # Optional: API key if n8n requires authentication

        # Debug flag to control verbose logging
        self.debug = os.getenv("EMAIL_DEBUG", "0") == "1"
        # Thread pool executor for running blocking SMTP operations
        self.executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="email_smtp")
        # Resolve logo path robustly
        from utils.file_utils import get_company_logo_path
        self.logo_path = get_company_logo_path()

        # Log email provider being used
        if self.debug:
            print(f"Email Service initialized with provider: {self.email_provider}")
            if self.email_provider == "resend":
                print(f"   Resend API Key: {'SET' if self.resend_api_key else 'NOT SET'}")
                print(f"   Resend From Email: {self.resend_from_email}")
            elif self.email_provider == "n8n":
                print(f"   n8n Webhook URL: {'SET' if self.n8n_webhook_url else 'NOT SET'}")
                print(f"   n8n Webhook ID: {'SET' if self.n8n_webhook_id else 'NOT SET'}")
                print(f"   n8n API Key: {'SET' if self.n8n_api_key else 'NOT SET'}")

    def _send_smtp_sync(self, msg: MIMEMultipart, to_email: str) -> bool:
        """Synchronous SMTP send operation (runs in thread pool)"""
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            return True
        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication Error: {e}")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Username: {self.smtp_username}")
            raise
        except smtplib.SMTPConnectError as e:
            print(f"SMTP Connection Error: {e}")
            print(f"   Failed to connect to {self.smtp_server}:{self.smtp_port}")
            raise
        except smtplib.SMTPException as e:
            print(f"SMTP Error: {e}")
            raise
        except Exception as e:
            print(f"Unexpected SMTP Error: {type(e).__name__}: {e}")
            raise

    async def _send_via_n8n(self, to_email: str, subject: str, html_content: str, text_content: str, email_type: str = "general", attachments: Optional[List[Dict]] = None, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Send email via n8n webhook (HTTP) - For n8n automation workflows"""
        try:
            if not self.n8n_webhook_url:
                print("N8N_WEBHOOK_URL not set. Please set it in environment variables.")
                return False

            headers = {
                "Content-Type": "application/json"
            }

            # Add API key to headers if provided
            if self.n8n_api_key:
                headers["X-N8N-API-KEY"] = self.n8n_api_key

            # Prepare payload for n8n webhook
            payload = {
                "to_email": to_email,
                "subject": subject,
                "html_content": html_content,
                "text_content": text_content,
                "email_type": email_type,  # "password_reset", "quote", "notification", etc.
                "metadata": metadata or {}
            }

            # Add attachments if provided
            if attachments:
                payload["attachments"] = attachments

            # Add webhook ID if provided (for n8n webhook authentication)
            if self.n8n_webhook_id:
                payload["webhook_id"] = self.n8n_webhook_id

            # Run HTTP request in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                lambda: requests.post(self.n8n_webhook_url, headers=headers, json=payload, timeout=30)
            )

            if response.status_code in [200, 201]:
                if self.debug:
                    print(f"Email sent via n8n to {to_email} (Status: {response.status_code})")
                    try:
                        result = response.json()
                        print(f"   n8n Response: {result}")
                    except:
                        print(f"   n8n Response: {response.text[:200]}")
                return True
            else:
                error_msg = response.text
                print(f"n8n Webhook Error ({response.status_code}): {error_msg}")
                return False

        except requests.exceptions.Timeout:
            print(f"n8n Webhook Timeout - Request took longer than 30s")
            return False
        except requests.exceptions.RequestException as e:
            print(f"n8n Webhook Request Error: {e}")
            return False
        except Exception as e:
            print(f"Unexpected n8n Webhook Error: {type(e).__name__}: {e}")
            if self.debug:
                import traceback
                traceback.print_exc()
            return False

    async def _send_via_resend(self, to_email: str, subject: str, html_content: str, text_content: str, attachments: Optional[List[Dict]] = None) -> bool:
        """Send email via Resend API (HTTP) - Recommended for Render"""
        try:
            if not self.resend_api_key:
                print("ERROR: RESEND_API_KEY not set. Please set it in Render environment variables.")
                return False

            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "from": self.resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content
            }

            # Add attachments if provided - Resend expects format: [{"filename": "name", "content": "base64_string"}]
            if attachments:
                resend_attachments = []
                for att in attachments:
                    if isinstance(att, dict):
                        filename = att.get('name') or att.get('filename', 'attachment')
                        content = att.get('content', '')
                        # If content is already base64 string, use it directly
                        # Otherwise, assume it's bytes and encode it
                        if isinstance(content, bytes):
                            content = base64.b64encode(content).decode('utf-8')
                        elif not content:
                            continue
                        resend_attachments.append({
                            "filename": filename,
                            "content": content
                        })
                if resend_attachments:
                    payload["attachments"] = resend_attachments

            # Run HTTP request in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                lambda: requests.post(self.resend_api_url, headers=headers, json=payload, timeout=30)
            )

            if response.status_code == 200:
                result = response.json()
                if self.debug:
                    print(f"SUCCESS: Email sent via Resend to {to_email} (ID: {result.get('id', 'N/A')})")
                return True
            else:
                error_msg = response.text
                print(f"ERROR: Resend API Error ({response.status_code}): {error_msg}")
                return False

        except requests.exceptions.Timeout:
            print(f"ERROR: Resend API Timeout - Request took longer than 30s")
            return False
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Resend API Request Error: {e}")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected Resend API Error: {type(e).__name__}: {e}")
            if self.debug:
                import traceback
                traceback.print_exc()
            return False

    def _resize_image(self, image_data: bytes, max_width: int = 300, max_height: int = 100) -> bytes:
        """Resize image if too large. Returns resized image bytes or original if resize fails."""
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_data))

            # Get original dimensions
            width, height = img.size

            # Resize if too large
            if width > max_width or height > max_height:
                # Calculate new dimensions maintaining aspect ratio
                ratio = min(max_width / width, max_height / height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)

                # Resize image
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Convert back to bytes
                output = io.BytesIO()
                # Preserve format if possible, otherwise use JPEG
                if img.format and img.format in ['PNG', 'JPEG', 'JPG']:
                    img.save(output, format=img.format, quality=90, optimize=True)
                else:
                    img.save(output, format='JPEG', quality=90, optimize=True)
                return output.getvalue()

            return image_data
        except Exception as e:
            # If resize fails, return original
            print(f"Warning: Failed to resize image: {e}")
            return image_data

    def _attach_company_logo(self, msg: MIMEMultipart) -> str | None:
        """Attach company logo inline and return its content-id.
        Returns 'company_logo' if attached successfully, otherwise None.
        """
        try:
            if os.path.exists(self.logo_path):
                with open(self.logo_path, 'rb') as f:
                    img_data = f.read()
                    # Resize if too large (max 300x100 for email)
                    img_data = self._resize_image(img_data, max_width=300, max_height=100)
                    img = MIMEImage(img_data)
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

    def generate_quote_email_html(self, quote_data: Dict[str, Any], customer_name: str, employee_name: str = None, employee_phone: str = None, quote_items: list = None, custom_payment_terms: list = None, additional_notes: str = None, company_info: Dict[str, Any] = None, bank_info: Dict[str, Any] = None, default_notes: list = None, logo_src: str = None) -> str:
        """Generate HTML content for quote email (for preview or sending)"""
        # Format currency
        def format_currency(amount):
            return f"{amount:,.0f} VND"

        # Format additional notes before using in f-string
        additional_notes_html = self._format_additional_notes(additional_notes) if additional_notes else ''

        # Create simple HTML email body with quote details
        quote_items_html = ""
        if quote_items:
            quote_items_html = """
                <div style="margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                        <thead>
                            <tr style="background: #1e40af; color: #fff;">
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">STT</th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;">HẠNG MỤC</th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;">MÔ TẢ CHI TIẾT</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">ĐVT</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;" colspan="2">QUY CÁCH</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">DIỆN TÍCH (m²)</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;">ĐƠN GIÁ</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">VAT (%)</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;">THÀNH TIỀN</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">HÌNH ẢNH</th>
                            </tr>
                            <tr style="background: #1e40af; color: #fff;">
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">NGANG (mm)</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;">CAO (mm)</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold;"></th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #000; font-weight: bold;"></th>
                            </tr>
                        </thead>
                        <tbody>
                """

            for idx, item in enumerate(quote_items, 1):
                # Category name is now expected to be pre-populated in item['category_name']
                category_name = item.get('category_name', '')

                length = item.get('length') or ''
                depth = item.get('depth') or ''
                height = item.get('height') or ''

                # Format dimensions
                def format_dimension(val):
                    if val is None or val == '':
                        return ''
                    try:
                        decimal_val = Decimal(str(val))
                    except (InvalidOperation, ValueError):
                        try:
                            decimal_val = Decimal(float(val))
                        except Exception:
                            return str(val) if val else ''
                    if decimal_val == 0:
                        return ''
                    # Round to 2 decimal places for area display
                    rounded = round(float(decimal_val), 2)
                    # Format with 2 decimal places, remove trailing zeros
                    formatted = f"{rounded:.2f}".rstrip('0').rstrip('.')
                    return formatted

                quantity_display = item.get('quantity', 0)
                if item.get('area'):
                    quantity_display = item.get('area')
                elif item.get('volume'):
                    quantity_display = item.get('volume')

                # Get VAT rate for this item from database (tax_rate column), fallback to vat_rate, then quote tax_rate, then default 10%
                # Priority: item.tax_rate > item.vat_rate > quote.tax_rate > 10.0
                vat_rate = None
                if item.get('tax_rate') is not None:
                    vat_rate = float(item.get('tax_rate'))
                elif item.get('vat_rate') is not None:
                    vat_rate = float(item.get('vat_rate'))
                elif quote_data.get('tax_rate') is not None:
                    vat_rate = float(quote_data.get('tax_rate'))
                else:
                    vat_rate = 10.0

                vat_display = f"{vat_rate:.2f}" if vat_rate else "10.00"

                # Calculate total price WITH tax included
                # Formula: Thành tiền = Đơn giá × Số lượng × Diện tích × (1 + VAT%)
                # total_price in database = unit_price × quantity × area (or unit_price × quantity if no area)
                # This is BEFORE tax, so we need to multiply by (1 + tax_rate / 100) to get price WITH tax
                total_price_before_tax = float(item.get('total_price', 0))
                if total_price_before_tax == 0 or str(total_price_before_tax).upper() == 'TẶNG':
                    total_price_display = 'TẶNG'
                else:
                    # Calculate: total_price × (1 + VAT%)
                    # This gives us: (Đơn giá × Số lượng × Diện tích) × (1 + VAT%)
                    total_price_after_tax = total_price_before_tax * (1 + vat_rate / 100)
                    total_price_display = format_currency(total_price_after_tax)
                    # Debug log (only if debug is enabled)
                    if self.debug:
                        unit_price = item.get('unit_price', 0)
                        quantity = item.get('quantity', 0)
                        area = item.get('area')
                        try:
                            print(f"Item {idx}: unit_price={unit_price}, quantity={quantity}, area={area}, total_price_before_tax={total_price_before_tax}, tax_rate={vat_rate}%, total_price_after_tax={total_price_after_tax}")
                        except UnicodeEncodeError:
                            print(f"Item {idx}: Debug info with special characters")

                # Get product image URL(s)
                product_image_html = ''
                product_image_url = item.get('product_image_url') or item.get('image_url')
                product_image_urls = item.get('product_image_urls') or item.get('image_urls')

                # Try to get first image from image_urls array or use image_url
                if product_image_urls and isinstance(product_image_urls, list) and len(product_image_urls) > 0:
                    # Use first image from array
                    first_image_url = product_image_urls[0] if isinstance(product_image_urls[0], str) else product_image_urls[0].get('url', '') if isinstance(product_image_urls[0], dict) else ''
                    if first_image_url:
                        product_image_html = f'<img src="{first_image_url}" alt="{item.get("name_product", "Product")}" style="max-width: 80px; max-height: 80px; object-fit: contain; display: block; margin: 0 auto;" />'
                elif product_image_url:
                    # Use single image_url
                    product_image_html = f'<img src="{product_image_url}" alt="{item.get("name_product", "Product")}" style="max-width: 80px; max-height: 80px; object-fit: contain; display: block; margin: 0 auto;" />'

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
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(height)}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{format_dimension(quantity_display)}</td>
                            <td style=\"padding: 8px; text-align: right; border: 1px solid #000; color:#000000;\">{format_currency(item.get('unit_price', 0))}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000;\">{vat_display}</td>
                            <td style=\"padding: 8px; text-align: right; border: 1px solid #000; font-weight: bold; color:#000000;\">{total_price_display}</td>
                            <td style=\"padding: 8px; text-align: center; border: 1px solid #000; color:#000000; vertical-align: middle;\">{product_image_html if product_image_html else '—'}</td>
                        </tr>
                """

            quote_items_html += """
                        </tbody>
                    </table>
                </div>
                """

        # Calculate total product amount (sum of all items with tax included)
        total_product_amount = 0
        if quote_items:
            for item in quote_items:
                total_price_before_tax = item.get('total_price', 0)
                if isinstance(total_price_before_tax, (int, float)) and total_price_before_tax > 0:
                    # Get tax rate for this item
                    item_tax_rate = None
                    if item.get('tax_rate') is not None:
                        item_tax_rate = float(item.get('tax_rate'))
                    elif item.get('vat_rate') is not None:
                        item_tax_rate = float(item.get('vat_rate'))
                    elif quote_data.get('tax_rate') is not None:
                        item_tax_rate = float(quote_data.get('tax_rate'))
                    else:
                        item_tax_rate = 10.0

                    # Calculate price after tax
                    total_price_after_tax = total_price_before_tax * (1 + item_tax_rate / 100)
                    total_product_amount += total_price_after_tax

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
        company_showroom = (company_info.get("company_showroom") if company_info else None) or "480/3 Tân Kỳ Tân Quý, P.Sơn Kỳ, Q.Tân Phú, TpHCM"
        company_factory = (company_info.get("company_factory") if company_info else None) or "165/4 Bờ Bao Tân Thắng, P.Tân Quý, Q.Tân Phú, TpHCM"
        company_website = (company_info.get("company_website") if company_info else None) or "http://phucdatdoor.vn"
        company_hotline = (company_info.get("company_hotline") if company_info else None) or "0901.116.118"

        # Logo handling - use provided logo_src or default to CID for email attachment
        if not logo_src:
            logo_src = "cid:company_logo"  # For email, use CID when logo will be attached

        # Get bank info from customization or use defaults
        bank_account_name = (bank_info.get("bank_account_name") if bank_info else None) or "CÔNG TY TNHH NHÔM KÍNH PHÚC ĐẠT"
        bank_account_number = (bank_info.get("bank_account_number") if bank_info else None) or "197877019"
        bank_name = (bank_info.get("bank_name") if bank_info else None) or "Ngân Hàng TMCP Á Châu (ACB)"
        bank_branch = (bank_info.get("bank_branch") if bank_info else None) or "PGD Gò Mây"

        # Make all text colors black for better readability
        # This will be applied in the HTML template

        # Build HTML using string concatenation to avoid f-string issues
        html_parts = []

        html_parts.append("""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
    <div style="background: white; border: 1px solid #000; padding: 0;">
        <!-- Header -->
        <div style="padding: 12px 20px 0 20px; border-bottom: 1px solid #000;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                    <td style="width:40%; vertical-align:middle; padding:10px 0;">
                        <div style="display:inline-block;">
                            <img src=\"""" + logo_src + """\" alt="PHÚC ĐẠT" style="max-width:300px; max-height:100px; height:auto; width:auto; display:block; object-fit:contain;">
                            <div style="font-size:12px; color:#000000; margin-top:6px; letter-spacing:1px;">KẾT NỐI KHÔNG GIAN</div>
                        </div>
                    </td>
                    <td style="width:60%; text-align:right; vertical-align:middle; padding:10px 0;">
                        <div style="font-size:13px; color:#000000; font-weight:600;\">""" + company_name_display + """</div>
                        <div style="font-size:12px; color:#000000; margin-top:4px;">1. Trụ sở: """ + company_showroom + """</div>
                        <div style="font-size:12px; color:#000000;">2. Showroom & Xưởng SX nhôm: """ + company_factory + """</div>
                        <div style="font-size:12px; color:#000000;\">""")

        if company_website:
            html_parts.append("""<a href=\"""" + company_website + """\" style="color:#2563eb; text-decoration:none;\">""" + company_website.replace("https://", "").replace("http://", "") + """</a>""")

        if company_hotline:
            html_parts.append("""<span style="color:#000000;"> | Hotline: """ + company_hotline + """</span>""")

        html_parts.append("""</div>
                    </td>
                </tr>
            </table>

            <!-- Tiêu đề trung tâm -->
            <div style="text-align:center; padding: 8px 0 16px 0;">
                <div style="font-size:20px; font-weight:800; letter-spacing:1px; color:#000000; font-family:'Times New Roman', Times, serif;">BẢNG BÁO GIÁ</div>
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
                        Khách Hàng: <span style="text-transform:uppercase;\">""" + customer_name + """</span>""")

        if quote_data.get('customer_phone'):
            html_parts.append(" - " + str(quote_data.get('customer_phone', '')))

        html_parts.append("""</td>
                </tr>""")

        if quote_data.get('customer_address'):
            html_parts.append("""<tr><td style="font-size:12px; color:#000000; padding:2px 0;">Địa chỉ: """ + str(quote_data.get('customer_address','')) + """</td></tr>""")

        html_parts.append("""<tr>
                    <td style="font-size:12px; color:#000000; font-weight:600; padding:6px 0; text-align:right;">
                        Kĩ Thuật Phụ Trách: """ + (employee_name or '—') + """""")

        if employee_phone:
            html_parts.append("&nbsp;&nbsp; SĐT: " + employee_phone)

        html_parts.append("""</td>
                </tr>
            </table>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">""")

        html_parts.append(quote_items_html)

        # Tổng hạng mục
        html_parts.append("""
            <!-- Tổng hạng mục -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background: #ffd700;">
                    <td colspan="11" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;\">""" + format_currency(total_product_amount) + """</td>
                </tr>""")

        if discount_amount > 0:
            html_parts.append(f"""
                <tr style="background: #add8e6;">
                    <td colspan="11" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">CHIẾT KHẤU {quote_data.get("discount_percentage", 0)}% KHÁCH THANH TOÁN TIỀN MẶT</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">-{format_currency(discount_amount)}</td>
                </tr>
                <tr style="background: #ffd700;">
                    <td colspan="11" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;">TỔNG HẠNG MỤC</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #000; color:#000000;\">""" + format_currency(total_amount) + """</td>
                </tr>""")

        html_parts.append("""
            </table>

            <!-- Giá thành tạm tính -->
            <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border: 1px solid #000;">
                <div style="font-size:14px; font-weight:bold; color:#000000;">
                    Giá thành tạm tính : """ + number_to_words(total_product_amount) + """ đồng.
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
                    <tbody>""")

        html_parts.append(payment_terms_html)

        html_parts.append("""
                    </tbody>
                </table>
            </div>

            <!-- Ghi chú -->
            <div style="margin: 20px 0;">
                <div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">GHI CHÚ</div>
                <div style="font-size:12px; color:#000000; line-height:1.8;\">""")

        if default_notes:
            html_parts.append(self._format_default_notes(default_notes))
        else:
            html_parts.append("""
                    <p style="margin:5px 0;">• Nếu phụ kiện, thiết bị của khách hàng mà CTy lắp sẽ tính công 200k/1 bộ</p>
                    <p style="margin:5px 0;">• Giá đã bao gồm nhân công lắp đặt trọn gói trong khu vực TPHCM</p>
                    <p style="margin:5px 0;">• Giá chưa bao gồm Thuế GTGT 10%</p>
                    <p style="margin:5px 0;">• Thời gian lắp đặt từ 7 - 9 ngày, không tính chủ nhật hoặc ngày Lễ</p>
                    <p style="margin:5px 0;">• Bản vẽ 3D mang tính chất minh họa (giống thực tế 80% - 90%)</p>
                    <p style="margin:5px 0;">• Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao</p>""")

        if additional_notes_html:
            html_parts.append(additional_notes_html)

        html_parts.append("""
                    <div style="margin-top:15px;">
                        <p style="margin:5px 0; font-weight:bold; color:#000000;">* Thông tin tài khoản: """ + bank_account_name + """ : STK: """ + bank_account_number + """ - Tại """ + bank_name + """ - """ + bank_branch + """.</p>
                        <p style="margin:5px 0; color:#000000;">Nội dung chuyển khoản: Tên khách hàng, địa chỉ công trình.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>""")

        return ''.join(html_parts)

        return html_body

    async def send_quote_email(self, quote_data: Dict[str, Any], customer_email: str, customer_name: str, quote_items: list = None, custom_payment_terms: list = None, additional_notes: str = None, prepared_html: str | None = None, company_info: Dict[str, Any] = None, bank_info: Dict[str, Any] = None, default_notes: list = None, attachments: list = None) -> bool:
        """Send quote email to customer"""
        try:
            # Check credentials based on email provider
            if self.email_provider == "resend":
                if not self.resend_api_key:
                    print("ERROR: RESEND_API_KEY not set. Please set it in Render environment variables.")
                    return False
            else:
                if not self.smtp_username or not self.smtp_password:
                    print("Email credentials not configured, skipping email send")
                    print(f"   Please set EMAIL_PROVIDER=resend and RESEND_API_KEY, or configure SMTP credentials")
                    return False

            # Resolve employee in charge from created_by -> employees -> users
            employee_name = quote_data.get('employee_in_charge_name')
            employee_phone = quote_data.get('employee_in_charge_phone')
            emp_id = quote_data.get('employee_in_charge_id') or quote_data.get('created_by')

            # Always try to get employee name from database if not provided or empty
            if not employee_name or not employee_name.strip():
                try:
                    if emp_id:
                        # Lazy import to avoid initialization issues
                        from services.supabase_client import get_supabase_client
                        supabase = get_supabase_client()
                        # Step 1: Get employee info including user_id
                        emp_res = (
                            supabase
                            .table('employees')
                            .select('id, user_id, first_name, last_name, phone')
                            .eq('id', emp_id)
                            .single()
                            .execute()
                        )
                        if emp_res.data:
                            emp = emp_res.data
                            if not employee_phone:
                                employee_phone = emp.get('phone')
                            # Candidate name from employees table (first_name + last_name)
                            candidate_name = f"{emp.get('first_name','')} {emp.get('last_name','')}".strip()

                            # Step 2: Prefer users.full_name if available
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
                                        employee_name = user_res.data.get('full_name')
                                    else:
                                        employee_name = candidate_name if candidate_name else None
                                except Exception as e:
                                    print(f"Error fetching user full_name: {e}")
                                    employee_name = candidate_name if candidate_name else None
                            else:
                                employee_name = candidate_name if candidate_name else None
                except Exception as e:
                    print(f"Error fetching employee info: {e}")
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

            # Priority: prepared_html (raw_html from email_customizations) > generate with customization data > generate default
            # Use prepared_html if provided (from email_customizations table)
            if prepared_html and prepared_html.strip():
                html_body = prepared_html.strip()

                # Replace logo in prepared_html if needed
                if company_info and company_info.get("company_logo_base64"):
                    # Replace any base64 logo with CID
                    base64_data = company_info.get("company_logo_base64")
                    import re
                    if base64_data.startswith('data:image'):
                        html_body = re.sub(re.escape(base64_data), 'cid:company_logo', html_body)
                    else:
                        patterns = [
                            f'data:image/[^;]+;base64,{re.escape(base64_data)}',
                            re.escape(base64_data),
                        ]
                        for pattern in patterns:
                            html_body = re.sub(pattern, 'cid:company_logo', html_body)
                elif company_info and company_info.get("company_logo_url"):
                    # Replace URL logo with CID
                    logo_url = company_info.get("company_logo_url")
                    html_body = html_body.replace(logo_url, 'cid:company_logo')

                # Inject additional notes if available and not present
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
                # Generate HTML with customization data from email_customizations
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

            # Note: HTML body is already generated above using generate_quote_email_html()
            # or prepared_html from email_customizations table
            # All customization data (company_info, bank_info, payment_terms, etc.)
            # is already included in html_body

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

            # Use n8n webhook if configured
            if self.email_provider == "n8n":
                # For n8n, use Supabase URL directly for logo (simpler and more reliable)
                n8n_html = html_body

                # Prepare attachments for n8n
                n8n_attachments = []

                # Default Supabase logo URL
                default_logo_url = "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/logo_phucdat.jpg"

                # Handle logo in HTML - replace CID with URL or base64
                if 'cid:company_logo' in n8n_html:
                    logo_base64 = None
                    logo_mime_type = "image/jpeg"

                    # Try to get logo from company_info first
                    if company_info and company_info.get("company_logo_base64"):
                        logo_base64 = company_info.get("company_logo_base64")
                        if ',' in logo_base64:
                            # Extract mime type from data URI
                            mime_part = logo_base64.split(',', 1)[0]
                            if 'image/png' in mime_part:
                                logo_mime_type = "image/png"
                            elif 'image/jpeg' in mime_part or 'image/jpg' in mime_part:
                                logo_mime_type = "image/jpeg"
                            logo_base64 = logo_base64.split(',', 1)[1]

                        # If we have base64 logo, use it as data URI in HTML
                        if logo_base64:
                            data_uri = f"data:{logo_mime_type};base64,{logo_base64}"
                            n8n_html = n8n_html.replace('cid:company_logo', data_uri)
                    else:
                        # Use Supabase URL directly in HTML (no download needed)
                        n8n_html = n8n_html.replace('cid:company_logo', default_logo_url)

                # Add file attachments
                if attachments and isinstance(attachments, list):
                    for attachment in attachments:
                        try:
                            file_name = attachment.get('name', 'attachment')
                            file_content = attachment.get('content', '')

                            if file_content:
                                # Content is already base64 string
                                n8n_attachments.append({
                                    "name": file_name,
                                    "content": file_content,
                                    "mimeType": attachment.get('mimeType', 'application/octet-stream')
                                })
                        except Exception as e:
                            if self.debug:
                                print(f"WARNING: Failed to prepare attachment {attachment.get('name', 'unknown')} for n8n: {e}")

                # Try to add PDF version if available
                try:
                    pdf_bytes = self._html_to_pdf_bytes(html_body)
                    if pdf_bytes:
                        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
                        n8n_attachments.append({
                            "name": f"Bao-gia-{quote_data.get('quote_number','')}.pdf",
                            "content": pdf_base64,
                            "mimeType": "application/pdf"
                        })
                except Exception:
                    pass

                # Send via n8n
                return await self._send_via_n8n(
                    to_email=customer_email,
                    subject=subject,
                    html_content=n8n_html,
                    text_content=text_body,
                    email_type="quote",
                    attachments=n8n_attachments if n8n_attachments else None,
                    metadata={
                        "quote_number": quote_data.get('quote_number'),
                        "customer_name": customer_name,
                        "customer_email": customer_email,
                        "total_amount": quote_data.get('total_amount', 0),
                        "issue_date": quote_data.get('issue_date'),
                        "valid_until": quote_data.get('valid_until'),
                        "employee_name": employee_name,
                        "employee_phone": employee_phone
                    }
                )

            # Use Resend API if configured
            if self.email_provider == "resend":
                # For Resend, we need to handle logo differently - convert CID to base64 data URI
                resend_html = html_body

                # Replace CID logo with base64 data URI if needed
                if 'cid:company_logo' in resend_html:
                    logo_base64 = None
                    # Try to get logo from company_info first
                    if company_info and company_info.get("company_logo_base64"):
                        logo_base64 = company_info.get("company_logo_base64")
                        if ',' in logo_base64:
                            logo_base64 = logo_base64.split(',', 1)[1]
                    else:
                        # Try to get default logo from file
                        try:
                            if os.path.exists(self.logo_path):
                                with open(self.logo_path, 'rb') as f:
                                    img_data = f.read()
                                    img_data = self._resize_image(img_data, max_width=300, max_height=100)
                                    logo_base64 = base64.b64encode(img_data).decode('utf-8')
                        except Exception as e:
                            print(f"WARNING: Failed to load default logo for Resend: {e}")

                    if logo_base64:
                        # Replace CID with base64 data URI
                        data_uri = f"data:image/jpeg;base64,{logo_base64}"
                        resend_html = resend_html.replace('cid:company_logo', data_uri)

                # Prepare attachments for Resend
                resend_attachments = []

                # Add file attachments
                if attachments and isinstance(attachments, list):
                    for attachment in attachments:
                        try:
                            file_name = attachment.get('name', 'attachment')
                            file_content = attachment.get('content', '')

                            if file_content:
                                # Content is already base64 string
                                resend_attachments.append({
                                    "name": file_name,
                                    "content": file_content
                                })
                        except Exception as e:
                            if self.debug:
                                print(f"WARNING: Failed to prepare attachment {attachment.get('name', 'unknown')} for Resend: {e}")

                # Try to add PDF version if available
                try:
                    pdf_bytes = self._html_to_pdf_bytes(html_body)
                    if pdf_bytes:
                        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
                        resend_attachments.append({
                            "name": f"Bao-gia-{quote_data.get('quote_number','')}.pdf",
                            "content": pdf_base64
                        })
                except Exception:
                    pass

                # Send via Resend
                return await self._send_via_resend(
                    to_email=customer_email,
                    subject=subject,
                    html_content=resend_html,
                    text_content=text_body,
                    attachments=resend_attachments if resend_attachments else None
                )

            # SMTP fallback - check credentials
            if not self.smtp_username or not self.smtp_password:
                print("ERROR: Email credentials not configured")
                print(f"   Please set EMAIL_PROVIDER=n8n and N8N_WEBHOOK_URL, or EMAIL_PROVIDER=resend and RESEND_API_KEY, or configure SMTP credentials")
                return False

            # Handle logo in HTML - ensure it uses CID for email attachment
            # Replace any base64 logo or URL logo with CID reference
            import re
            logo_should_attach = False

            # First, ensure HTML uses CID for logo
            if 'cid:company_logo' not in html_body:
                # Try to replace any logo reference with CID
                if company_info and company_info.get("company_logo_base64"):
                    # Replace base64 logo with CID
                    base64_data = company_info.get("company_logo_base64")
                    # Pattern to match data:image/...;base64,... or just the base64 string
                    if base64_data.startswith('data:image'):
                        # Full data URI
                        html_body = re.sub(re.escape(base64_data), 'cid:company_logo', html_body)
                    else:
                        # Just base64 string, might be in src="data:image/...;base64,{base64_data}"
                        # Try to find it in various formats
                        patterns = [
                            f'data:image/[^;]+;base64,{re.escape(base64_data)}',
                            re.escape(base64_data),
                        ]
                        for pattern in patterns:
                            html_body = re.sub(pattern, 'cid:company_logo', html_body)
                    logo_should_attach = True
                elif company_info and company_info.get("company_logo_url"):
                    # Replace URL logo with CID
                    logo_url = company_info.get("company_logo_url")
                    html_body = html_body.replace(logo_url, 'cid:company_logo')
                    logo_should_attach = False  # URL logo won't be attached, use default

            # Check if CID is now in HTML
            if 'cid:company_logo' in html_body:
                logo_should_attach = True
            else:
                if self.debug:
                    print(f"WARNING: Warning: CID not found in HTML after replacement")
                # Force add CID if we have logo to attach
                if company_info and company_info.get("company_logo_base64"):
                    # Try to find img tag and replace src
                    html_body = re.sub(r'<img[^>]*src=["\'][^"\']*["\']', r'<img src="cid:company_logo"', html_body, count=1)
                    if 'cid:company_logo' in html_body:
                        logo_should_attach = True

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

            # Attach logo if HTML references CID or if we have logo to attach
            if 'cid:company_logo' in html_body or (company_info and company_info.get("company_logo_base64")):
                if company_info and company_info.get("company_logo_base64"):
                    # Attach base64 logo (resized)
                    try:
                        # Extract base64 data (remove data:image/...;base64, prefix if present)
                        base64_data = company_info.get("company_logo_base64")
                        if ',' in base64_data:
                            base64_data = base64_data.split(',', 1)[1]

                        # Decode base64 to bytes
                        img_bytes = base64.b64decode(base64_data)

                        # Resize if too large
                        img_bytes = self._resize_image(img_bytes, max_width=300, max_height=100)

                        # Attach as inline image
                        img = MIMEImage(img_bytes)
                        img.add_header('Content-ID', '<company_logo>')
                        img.add_header('Content-Disposition', 'inline', filename='company_logo.jpg')
                        msg.attach(img)
                    except Exception as e:
                        if self.debug:
                            print(f"WARNING: Failed to attach base64 logo: {e}")
                            import traceback
                            traceback.print_exc()
                        # Fallback to default logo
                        self._attach_company_logo(msg)
                else:
                    # Use default logo from file
                    self._attach_company_logo(msg)

            # Attach file attachments if provided
            if attachments and isinstance(attachments, list):
                for attachment in attachments:
                    try:
                        # Get attachment data
                        file_name = attachment.get('name', 'attachment')
                        file_content = attachment.get('content', '')
                        mime_type = attachment.get('mimeType', 'application/octet-stream')

                        if file_content:
                            # Decode base64 content
                            file_bytes = base64.b64decode(file_content)

                            # Create MIME attachment
                            if mime_type.startswith('image/'):
                                # For images, use MIMEImage
                                attachment_part = MIMEImage(file_bytes, _subtype=mime_type.split('/')[-1])
                            elif mime_type == 'application/pdf':
                                # For PDF, use MIMEApplication
                                attachment_part = MIMEApplication(file_bytes, _subtype='pdf')
                            else:
                                # For other files, use MIMEApplication with appropriate subtype
                                attachment_part = MIMEApplication(file_bytes, _subtype=mime_type.split('/')[-1] if '/' in mime_type else 'octet-stream')

                            attachment_part.add_header('Content-Disposition', 'attachment', filename=file_name)
                            msg.attach(attachment_part)
                    except Exception as e:
                        if self.debug:
                            print(f"WARNING: Failed to attach file {attachment.get('name', 'unknown')}: {e}")
                            import traceback
                            traceback.print_exc()

            # Try attach PDF version of the quote
            try:
                pdf_bytes = self._html_to_pdf_bytes(html_body)
                if pdf_bytes:
                    pdf_part = MIMEApplication(pdf_bytes, _subtype='pdf')
                    pdf_part.add_header('Content-Disposition', 'attachment', filename=f"Bao-gia-{quote_data.get('quote_number','')}.pdf")
                    msg.attach(pdf_part)
            except Exception:
                pass

            # Run SMTP send in thread pool to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(
                self.executor,
                self._send_smtp_sync,
                msg,
                customer_email
            )

            if success:
                if self.debug:
                    print(f"SUCCESS: Quote email sent successfully to {customer_email}")
                return True
            else:
                return False

        except smtplib.SMTPAuthenticationError as e:
            print(f"ERROR: SMTP Authentication Error - Failed to send quote email to {customer_email}: {e}")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Username: {self.smtp_username}")
            print(f"   Check: 1) SMTP_USER/SMTP_USERNAME env var is set, 2) SMTP_PASSWORD is correct (use App Password for Gmail), 3) Gmail 'Less secure app access' is enabled if needed")
            return False
        except smtplib.SMTPConnectError as e:
            print(f"ERROR: SMTP Connection Error - Failed to connect to {self.smtp_server}:{self.smtp_port}: {e}")
            print(f"   Check: 1) SMTP_SERVER and SMTP_PORT env vars are correct, 2) Network/firewall allows outbound connections on port {self.smtp_port}")
            return False
        except smtplib.SMTPException as e:
            print(f"ERROR: SMTP Error - Failed to send quote email to {customer_email}: {e}")
            return False
        except asyncio.TimeoutError:
            print(f"ERROR: Timeout Error - SMTP operation timed out after {self.smtp_timeout}s for {customer_email}")
            print(f"   This may happen on Render if SMTP server is slow or network is unstable")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected Error - Failed to send quote email to {customer_email}: {type(e).__name__}: {e}")
            import traceback
            if self.debug:
                traceback.print_exc()
            return False

    async def send_notification_email(self, employee_email: str, title: str, message: str, action_url: str | None = None) -> bool:
        """Send a simple notification email to an employee"""
        try:
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
                  {f'<div style="margin-top:16px"><a href="{action_url}" style="background:#0f172a;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px;display:inline-block;">Xem chi tiết</a></div>' if action_url else ''}
                </div>
                <div style="padding: 12px; border-top: 1px solid #000; text-align: center; color:#000000; font-size:12px;">
                  Bộ phận Công ty Phúc Đạt
                </div>
              </div>
            </body>
            </html>
            """

            text_body = f"{title or 'Thông báo'}\n\n{message or ''}\n\n{('Xem chi tiết: ' + action_url) if action_url else ''}"

            # Use n8n webhook if configured
            if self.email_provider == "n8n":
                return await self._send_via_n8n(
                    to_email=employee_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body,
                    email_type="notification",
                    metadata={
                        "title": title,
                        "message": message,
                        "action_url": action_url
                    }
                )

            # Use Resend API if configured
            if self.email_provider == "resend":
                return await self._send_via_resend(
                    to_email=employee_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body
                )

            # SMTP fallback
            if not self.smtp_username or not self.smtp_password:
                print("ERROR: Email credentials not configured")
                print(f"   Please set EMAIL_PROVIDER=n8n and N8N_WEBHOOK_URL, or EMAIL_PROVIDER=resend and RESEND_API_KEY, or configure SMTP credentials")
                return False

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

            # Run SMTP send in thread pool to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(
                self.executor,
                self._send_smtp_sync,
                msg,
                employee_email
            )

            if success:
                if self.debug:
                    print(f"SUCCESS: Notification email sent successfully to {employee_email}")
                return True
            return False
        except Exception as e:
            print(f"ERROR: Failed to send notification email: {e}")
            import traceback
            if self.debug:
                traceback.print_exc()
            return False

    async def send_password_reset_email(self, user_email: str, user_name: str | None, reset_link: str) -> bool:
        """Send password reset instructions to a user"""
        try:
            expire_minutes = settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            subject = "Hướng dẫn đặt lại mật khẩu tài khoản Phúc Đạt"

            greeting_name = user_name or "bạn"
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="border: 1px solid #000;">
                <div style="padding: 16px; border-bottom: 1px solid #000;">
                  <h2 style="margin: 0; color: #0f172a;">Đặt lại mật khẩu</h2>
                </div>
                <div style="padding: 16px;">
                  <p>Xin chào {greeting_name},</p>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống Quản lý tài chính Phúc Đạt.</p>
                  <p>Vui lòng nhấn nút bên dưới để đặt lại mật khẩu mới. Liên kết có hiệu lực trong {expire_minutes} phút.</p>
                  <div style="text-align:center; margin: 24px 0;">
                    <a href="{reset_link}" style="background:#0f172a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
                      Đặt lại mật khẩu
                    </a>
                  </div>
                  <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn an toàn.</p>
                </div>
                <div style="padding: 12px; border-top: 1px solid #000; text-align: center; color:#000000; font-size:12px;">
                  Bộ phận Công ty Phúc Đạt
                </div>
              </div>
            </body>
            </html>
            """

            text_body = f"""Xin chào {greeting_name},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống Quản lý tài chính Phúc Đạt.

Vui lòng nhấn vào nút "Đặt lại mật khẩu" trong email HTML. Liên kết có hiệu lực trong {expire_minutes} phút.

Nếu bạn không yêu cầu, hãy bỏ qua email này.
"""

            # Use n8n webhook if configured
            if self.email_provider == "n8n":
                return await self._send_via_n8n(
                    to_email=user_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body,
                    email_type="password_reset",
                    metadata={
                        "user_name": user_name,
                        "reset_link": reset_link,
                        "expire_minutes": expire_minutes
                    }
                )

            # Use Resend API if configured
            if self.email_provider == "resend":
                return await self._send_via_resend(
                    to_email=user_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body
                )

            # SMTP fallback
            if not self.smtp_username or not self.smtp_password:
                print("ERROR: Email credentials not configured")
                print(f"   Please set EMAIL_PROVIDER=n8n and N8N_WEBHOOK_URL, or EMAIL_PROVIDER=resend and RESEND_API_KEY, or configure SMTP credentials")
                return False

            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            msg['From'] = f"Hệ thống Phúc Đạt <{self.smtp_username}>"
            msg['To'] = user_email

            alt = MIMEMultipart('alternative')
            alt.attach(MIMEText(text_body, 'plain', 'utf-8'))
            alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(alt)
            self._attach_company_logo(msg)

            # Run SMTP send in thread pool to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(
                self.executor,
                self._send_smtp_sync,
                msg,
                user_email
            )

            if success:
                if self.debug:
                    print(f"SUCCESS: Password reset email sent successfully to {user_email}")
                return True
            else:
                return False

        except smtplib.SMTPAuthenticationError as e:
            print(f"ERROR: SMTP Authentication Error - Failed to send password reset email to {user_email}: {e}")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Username: {self.smtp_username}")
            print(f"   Check: 1) SMTP_USER/SMTP_USERNAME env var is set, 2) SMTP_PASSWORD is correct (use App Password for Gmail), 3) Gmail 'Less secure app access' is enabled if needed")
            return False
        except smtplib.SMTPConnectError as e:
            print(f"ERROR: SMTP Connection Error - Failed to connect to {self.smtp_server}:{self.smtp_port}: {e}")
            print(f"   Check: 1) SMTP_SERVER and SMTP_PORT env vars are correct, 2) Network/firewall allows outbound connections on port {self.smtp_port}")
            return False
        except smtplib.SMTPException as e:
            print(f"ERROR: SMTP Error - Failed to send password reset email to {user_email}: {e}")
            return False
        except asyncio.TimeoutError:
            print(f"ERROR: Timeout Error - SMTP operation timed out after {self.smtp_timeout}s for {user_email}")
            print(f"   This may happen on Render if SMTP server is slow or network is unstable")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected Error - Failed to send password reset email to {user_email}: {type(e).__name__}: {e}")
            import traceback
            if self.debug:
                traceback.print_exc()
            return False

    async def send_password_change_confirmation(self, user_email: str, user_name: str | None, via: str = "manual") -> bool:
        """Notify user that their password has been changed"""
        try:
            subject = "Mật khẩu của bạn đã được cập nhật"
            greeting_name = user_name or "bạn"
            via_text = "bởi chính bạn" if via == "manual" else "thông qua liên kết đặt lại mật khẩu"

            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="border: 1px solid #000;">
                <div style="padding: 16px; border-bottom: 1px solid #000;">
                  <h2 style="margin: 0; color: #0f172a;">Xác nhận thay đổi mật khẩu</h2>
                </div>
                <div style="padding: 16px;">
                  <p>Xin chào {greeting_name},</p>
                  <p>Mật khẩu cho tài khoản của bạn vừa được cập nhật {via_text}.</p>
                  <p>Nếu đây là bạn, không cần thêm hành động nào.</p>
                  <p>Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng:</p>
                  <ul>
                    <li>Đặt lại mật khẩu ngay lập tức bằng chức năng "Quên mật khẩu"</li>
                    <li>Thông báo cho quản trị viên hệ thống</li>
                  </ul>
                </div>
                <div style="padding: 12px; border-top: 1px solid #000; text-align: center; color:#000000; font-size:12px;">
                  Bộ phận Công ty Phúc Đạt
                </div>
              </div>
            </body>
            </html>
            """

            text_body = f"""Xin chào {greeting_name},

Mật khẩu cho tài khoản của bạn vừa được cập nhật {via_text}.
Nếu bạn không thực hiện thay đổi này, hãy đặt lại mật khẩu ngay và liên hệ quản trị viên.
"""

            # Use n8n webhook if configured
            if self.email_provider == "n8n":
                return await self._send_via_n8n(
                    to_email=user_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body,
                    email_type="password_change_confirmation",
                    metadata={
                        "user_name": user_name,
                        "via": via
                    }
                )

            # Use Resend API if configured
            if self.email_provider == "resend":
                return await self._send_via_resend(
                    to_email=user_email,
                    subject=subject,
                    html_content=html_body,
                    text_content=text_body
                )

            # SMTP fallback
            if not self.smtp_username or not self.smtp_password:
                print("ERROR: Email credentials not configured")
                print(f"   Please set EMAIL_PROVIDER=n8n and N8N_WEBHOOK_URL, or EMAIL_PROVIDER=resend and RESEND_API_KEY, or configure SMTP credentials")
                return False

            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            msg['From'] = f"Hệ thống Phúc Đạt <{self.smtp_username}>"
            msg['To'] = user_email

            alt = MIMEMultipart('alternative')
            alt.attach(MIMEText(text_body, 'plain', 'utf-8'))
            alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(alt)
            self._attach_company_logo(msg)

            # Run SMTP send in thread pool to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(
                self.executor,
                self._send_smtp_sync,
                msg,
                user_email
            )

            if success:
                if self.debug:
                    print(f"SUCCESS: Password change confirmation email sent successfully to {user_email}")
                return True
            else:
                return False

        except smtplib.SMTPAuthenticationError as e:
            print(f"ERROR: SMTP Authentication Error - Failed to send password change confirmation to {user_email}: {e}")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Username: {self.smtp_username}")
            print(f"   Check: 1) SMTP_USER/SMTP_USERNAME env var is set, 2) SMTP_PASSWORD is correct (use App Password for Gmail)")
            return False
        except smtplib.SMTPConnectError as e:
            print(f"ERROR: SMTP Connection Error - Failed to connect to {self.smtp_server}:{self.smtp_port}: {e}")
            print(f"   Check: 1) SMTP_SERVER and SMTP_PORT env vars are correct, 2) Network/firewall allows outbound connections on port {self.smtp_port}")
            return False
        except smtplib.SMTPException as e:
            print(f"ERROR: SMTP Error - Failed to send password change confirmation to {user_email}: {e}")
            return False
        except asyncio.TimeoutError:
            print(f"ERROR: Timeout Error - SMTP operation timed out after {self.smtp_timeout}s for {user_email}")
            print(f"   This may happen on Render if SMTP server is slow or network is unstable")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected Error - Failed to send password change confirmation to {user_email}: {type(e).__name__}: {e}")
            import traceback
            if self.debug:
                traceback.print_exc()
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
                                <th style="padding: 10px; text-align: right; border: 1px solid #000; font-weight: bold;">Thành tiền</th>
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
                        <h1 style=\"margin: 0; color: #28a745; font-size: 20px;\">Báo Giá Đã Được Duyệt</h1>
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