"""
Product Import Router
Handles Excel file import for products
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
import pandas as pd
import io
import os
from datetime import datetime
import uuid

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

class ProductImportResult:
    def __init__(self):
        self.imported_count = 0
        self.total_count = 0
        self.errors = []
        self.success = True

    def add_error(self, row: int, message: str):
        self.errors.append(f"Dòng {row}: {message}")
        self.success = False

    def to_dict(self):
        return {
            "imported_count": self.imported_count,
            "total_count": self.total_count,
            "errors": self.errors,
            "success": self.success
        }

@router.post("/preview-excel")
async def preview_products_from_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Preview products from Excel file without importing"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400,
                detail="File phải là Excel (.xlsx, .xls) hoặc CSV"
            )

        # Read file content
        content = await file.read()
        
        # Parse Excel/CSV file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            # Try to read from "Mẫu sản phẩm" sheet first, fallback to first sheet
            try:
                df = pd.read_excel(io.BytesIO(content), sheet_name='Mẫu sản phẩm')
            except:
                df = pd.read_excel(io.BytesIO(content))

        # Validate required columns
        required_columns = ['name', 'price', 'unit']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Thiếu các cột bắt buộc: {', '.join(missing_columns)}"
            )

        products = []
        errors = []
        
        # Get all categories for mapping
        supabase = get_supabase_client()
        categories_response = supabase.table("product_categories").select("id, name").execute()
        categories = {cat["name"]: cat["id"] for cat in categories_response.data}
        
        # Process each row
        for index, row in df.iterrows():
            product_errors = []
            
            # Validate required fields
            if pd.isna(row['name']) or str(row['name']).strip() == '':
                product_errors.append("Tên sản phẩm không được để trống")
            
            if pd.isna(row['price']) or row['price'] <= 0:
                product_errors.append("Giá sản phẩm phải lớn hơn 0")
            
            if pd.isna(row['unit']) or str(row['unit']).strip() == '':
                product_errors.append("Đơn vị không được để trống")

            # Prepare product data
            product_data = {
                "name": str(row['name']).strip() if not pd.isna(row['name']) else '',
                "price": float(row['price']) if not pd.isna(row['price']) else 0,
                "unit": str(row['unit']).strip() if not pd.isna(row['unit']) else '',
                "description": str(row.get('description', '')).strip() if not pd.isna(row.get('description')) else None,
                "area": float(row.get('area', 0)) if not pd.isna(row.get('area')) and row.get('area') > 0 else None,
                "volume": float(row.get('volume', 0)) if not pd.isna(row.get('volume')) and row.get('volume') > 0 else None,
                "height": float(row.get('height', 0)) if not pd.isna(row.get('height')) and row.get('height') > 0 else None,
                "length": float(row.get('length', 0)) if not pd.isna(row.get('length')) and row.get('length') > 0 else None,
                "depth": float(row.get('depth', 0)) if not pd.isna(row.get('depth')) and row.get('depth') > 0 else None,
                "category_name": str(row.get('category_name', '')).strip() if not pd.isna(row.get('category_name')) else None,
                "errors": product_errors
            }

            products.append(product_data)

        return {
            "products": products,
            "total_count": len(products),
            "valid_count": len([p for p in products if not p['errors']]),
            "error_count": len([p for p in products if p['errors']])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý file: {str(e)}"
        )

@router.post("/import-excel")
async def import_products_from_excel(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Import products from approved list"""
    try:
        products = request.get('products', [])
        if not products:
            raise HTTPException(
                status_code=400,
                detail="Không có sản phẩm nào để import"
            )

        result = ProductImportResult()
        result.total_count = len(products)
        
        supabase = get_supabase_client()
        
        # Get all categories for mapping
        categories_response = supabase.table("product_categories").select("id, name").execute()
        categories = {cat["name"]: cat["id"] for cat in categories_response.data}
        
        # Process each approved product
        for index, product in enumerate(products):
            try:
                # Skip if product has errors or is not approved
                if product.get('errors') and len(product['errors']) > 0:
                    result.add_error(index + 1, f"Sản phẩm có lỗi: {', '.join(product['errors'])}")
                    continue
                
                if product.get('status') != 'approved':
                    result.add_error(index + 1, "Sản phẩm chưa được duyệt")
                    continue

                # Prepare product data
                product_data = {
                    "name": product['name'],
                    "price": product['price'],
                    "unit": product['unit'],
                    "description": product.get('description'),
                    "area": product.get('area'),
                    "volume": product.get('volume'),
                    "height": product.get('height'),
                    "length": product.get('length'),
                    "depth": product.get('depth'),
                    "is_active": True
                }

                # Handle category
                if product.get('category_name'):
                    category_name = product['category_name']
                    if category_name in categories:
                        product_data["category_id"] = categories[category_name]
                    else:
                        # Create new category if it doesn't exist
                        new_category = supabase.table("product_categories").insert({
                            "name": category_name,
                            "description": f"Tự động tạo từ import Excel",
                            "is_active": True
                        }).execute()
                        
                        if new_category.data:
                            product_data["category_id"] = new_category.data[0]["id"]
                            categories[category_name] = new_category.data[0]["id"]

                # Insert product
                insert_result = supabase.table("products").insert(product_data).execute()
                
                if insert_result.data:
                    result.imported_count += 1
                else:
                    result.add_error(index + 1, "Không thể tạo sản phẩm")
                    
            except Exception as e:
                result.add_error(index + 1, f"Lỗi xử lý sản phẩm: {str(e)}")

        return {
            "message": f"Import hoàn thành. Đã import {result.imported_count}/{result.total_count} sản phẩm",
            "imported_count": result.imported_count,
            "total_count": result.total_count,
            "errors": result.errors,
            "success": result.success
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi import file: {str(e)}"
        )

@router.get("/download-template")
async def download_excel_template(
    current_user: User = Depends(get_current_user)
):
    """Download Excel template for product import with lookup sheets"""
    try:
        supabase = get_supabase_client()
        
        # Get product categories from database
        categories_response = supabase.table("product_categories").select("id, name, description").eq("is_active", True).execute()
        categories_data = categories_response.data if categories_response.data else []
        
        # Get expense objects from database
        expense_objects_response = supabase.table("expense_objects").select("id, name, description, level").eq("is_active", True).execute()
        expense_objects_data = expense_objects_response.data if expense_objects_response.data else []
        
        # Create comprehensive template data with realistic examples
        template_data = {
            'name': [
                'Bàn gỗ cao cấp',
                'Ghế văn phòng',
                'Tủ quần áo 3 cánh',
                'Sofa 3 chỗ ngồi',
                'Giường ngủ 1m6',
                'Kệ sách 5 tầng',
                'Bàn ăn 6 ghế',
                'Tủ bếp 2m',
                'Đèn chùm pha lê',
                'Thảm trải sàn'
            ],
            'price': [
                2500000,
                1200000,
                3500000,
                4500000,
                3200000,
                1800000,
                2800000,
                4200000,
                850000,
                650000
            ],
            'unit': [
                'cái', 'cái', 'cái', 'cái', 'cái',
                'cái', 'bộ', 'bộ', 'cái', 'm2'
            ],
            'description': [
                'Bàn gỗ sồi tự nhiên, chân sắt mạ chrome',
                'Ghế văn phòng có tựa lưng, bọc da PU',
                'Tủ quần áo 3 cánh, màu trắng sữa',
                'Sofa bọc vải nỉ, màu xám than',
                'Giường ngủ gỗ sồi, kèm nệm',
                'Kệ sách 5 tầng, màu nâu gỗ',
                'Bàn ăn gỗ + 6 ghế, màu nâu',
                'Tủ bếp 2m, màu trắng, kèm bồn rửa',
                'Đèn chùm pha lê 12 bóng, ánh sáng vàng',
                'Thảm trải sàn cao cấp, màu xám'
            ],
            'area': [
                2.5, 0.8, 3.2, 4.5, 2.8,
                1.2, 3.6, 2.0, 0.5, 4.0
            ],
            'volume': [
                0.8, 0.3, 1.2, 2.1, 1.5,
                0.4, 1.8, 0.6, 0.1, 0.2
            ],
            'height': [
                800, 1100, 2000, 900, 600,
                1800, 800, 900, 600, 20
            ],
            'length': [
                1500, 600, 1800, 2100, 2000,
                800, 1800, 2000, 400, 2000
            ],
            'depth': [
                800, 600, 600, 900, 1000,
                300, 800, 600, 400, 2000
            ],
            'category_name': [
                'Nội thất văn phòng',
                'Nội thất văn phòng',
                'Nội thất phòng ngủ',
                'Nội thất phòng khách',
                'Nội thất phòng ngủ',
                'Nội thất phòng khách',
                'Nội thất phòng ăn',
                'Nội thất nhà bếp',
                'Đèn chiếu sáng',
                'Thảm và phụ kiện'
            ]
        }
        
        # Create DataFrame
        df = pd.DataFrame(template_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Mẫu sản phẩm', index=False)
            
            # ===== SHEET 2: TRA CỨU NHANH =====
            # Prepare lookup data for quick reference
            lookup_rows = []
            
            # Add header
            lookup_rows.append(['=== LOẠI SẢN PHẨM / PRODUCT CATEGORIES ===', '', ''])
            lookup_rows.append(['Tên loại sản phẩm', 'Mô tả', ''])
            
            # Add product categories
            if categories_data:
                for cat in categories_data:
                    lookup_rows.append([
                        cat.get('name', ''),
                        cat.get('description', ''),
                        ''
                    ])
            else:
                # Fallback to sample categories if database is empty
                sample_categories = [
                    ['Nội thất văn phòng', 'Bàn ghế, tủ văn phòng', ''],
                    ['Nội thất phòng khách', 'Sofa, bàn trà, kệ tivi', ''],
                    ['Nội thất phòng ngủ', 'Giường, tủ quần áo, bàn trang điểm', ''],
                    ['Nội thất phòng ăn', 'Bàn ăn, ghế ăn, tủ rượu', ''],
                    ['Nội thất nhà bếp', 'Tủ bếp, bồn rửa, tủ lạnh', ''],
                    ['Đèn chiếu sáng', 'Đèn chùm, đèn bàn, đèn tường', ''],
                    ['Thảm và phụ kiện', 'Thảm, rèm cửa, gối trang trí', ''],
                ]
                lookup_rows.extend(sample_categories)
            
            # Add spacing
            lookup_rows.append(['', '', ''])
            lookup_rows.append(['', '', ''])
            
            # Add expense objects header
            lookup_rows.append(['=== ĐỐI TƯỢNG CHI PHÍ / EXPENSE OBJECTS ===', '', ''])
            lookup_rows.append(['Tên đối tượng chi phí', 'Mô tả', 'Cấp độ'])
            
            # Add expense objects
            if expense_objects_data:
                for exp_obj in expense_objects_data:
                    lookup_rows.append([
                        exp_obj.get('name', ''),
                        exp_obj.get('description', ''),
                        f"Cấp {exp_obj.get('level', '')}" if exp_obj.get('level') else ''
                    ])
            else:
                # Fallback to sample expense objects
                sample_expense_objects = [
                    ['Vật tư trực tiếp', 'Chi phí vật tư sử dụng trực tiếp cho sản phẩm', 'Cấp 1'],
                    ['Nhân công trực tiếp', 'Chi phí lao động trực tiếp sản xuất', 'Cấp 1'],
                    ['Chi phí sản xuất chung', 'Chi phí chung không trực tiếp', 'Cấp 1'],
                    ['Gỗ nguyên liệu', 'Gỗ các loại dùng cho sản xuất', 'Cấp 2'],
                    ['Sơn và vecni', 'Vật tư hoàn thiện bề mặt', 'Cấp 2'],
                    ['Phụ kiện kim loại', 'Tay nắm, bản lề, ốc vít...', 'Cấp 2'],
                ]
                lookup_rows.extend(sample_expense_objects)
            
            # Add notes
            lookup_rows.append(['', '', ''])
            lookup_rows.append(['', '', ''])
            lookup_rows.append(['=== GHI CHÚ / NOTES ===', '', ''])
            lookup_rows.append(['1. Loại sản phẩm: Chọn từ danh sách trên hoặc nhập tên mới', '', ''])
            lookup_rows.append(['2. Nếu nhập loại sản phẩm mới, hệ thống sẽ tự động tạo', '', ''])
            lookup_rows.append(['3. Đối tượng chi phí: Dùng để phân loại chi phí trong báo cáo', '', ''])
            lookup_rows.append(['4. Cấp độ: Cấp 1 = cha, Cấp 2 = con, Cấp 3 = con con...', '', ''])
            
            # Create lookup DataFrame
            lookup_df = pd.DataFrame(lookup_rows, columns=['Cột 1', 'Cột 2', 'Cột 3'])
            lookup_df.to_excel(writer, sheet_name='Tra cứu nhanh', index=False, header=False)
            
            # Add comprehensive instructions sheet
            instructions_data = {
                'Cột': [
                    'name', 'price', 'unit', 'description', 'area', 'volume', 
                    'height', 'length', 'depth', 'category_name'
                ],
                'Mô tả': [
                    'Tên sản phẩm (BẮT BUỘC)',
                    'Giá sản phẩm VND (BẮT BUỘC)',
                    'Đơn vị tính (BẮT BUỘC)',
                    'Mô tả chi tiết sản phẩm (TÙY CHỌN)',
                    'Diện tích m2 (TÙY CHỌN)',
                    'Thể tích m³ (TÙY CHỌN)',
                    'Chiều cao mm (TÙY CHỌN)',
                    'Chiều dài mm (TÙY CHỌN)',
                    'Chiều sâu mm (TÙY CHỌN)',
                    'Tên loại sản phẩm (TÙY CHỌN)'
                ],
                'Ví dụ': [
                    'Bàn gỗ cao cấp',
                    '2500000',
                    'cái',
                    'Bàn gỗ sồi tự nhiên, chân sắt mạ chrome',
                    '2.5',
                    '0.8',
                    '800',
                    '1500',
                    '800',
                    'Nội thất văn phòng'
                ],
                'Ghi chú': [
                    'Không được để trống',
                    'Phải > 0, không có dấu phẩy',
                    'cái, kg, m, m2, bộ, thùng...',
                    'Mô tả chi tiết về sản phẩm',
                    'Số thập phân, đơn vị m2',
                    'Số thập phân, đơn vị m³',
                    'Số nguyên, đơn vị mm (milimét)',
                    'Số nguyên, đơn vị mm (milimét)',
                    'Số nguyên, đơn vị mm (milimét)',
                    'Xem sheet "Tra cứu nhanh" để chọn loại sản phẩm'
                ]
            }
            
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Hướng dẫn các cột', index=False)
            
            # Add detailed instructions sheet
            detailed_instructions = {
                'Bước': [
                    '1. Tải template',
                    '2. Mở file Excel',
                    '3. Xem sheet "Tra cứu nhanh"',
                    '4. Xem sheet "Hướng dẫn các cột"',
                    '5. Điền thông tin sản phẩm',
                    '6. Kiểm tra dữ liệu',
                    '7. Lưu file',
                    '8. Upload lên hệ thống',
                    '9. Kiểm tra kết quả'
                ],
                'Hướng dẫn': [
                    'Click nút "Tải template" để tải file mẫu',
                    'Mở file Excel bằng Microsoft Excel hoặc Google Sheets',
                    'Xem sheet "Tra cứu nhanh" để biết loại sản phẩm và đối tượng chi phí có sẵn',
                    'Đọc kỹ hướng dẫn trong sheet "Hướng dẫn các cột"',
                    'Điền thông tin sản phẩm vào sheet "Mẫu sản phẩm"',
                    'Kiểm tra lại dữ liệu trước khi lưu',
                    'Lưu file với định dạng .xlsx',
                    'Upload file lên hệ thống qua giao diện web',
                    'Xem kết quả import và xử lý lỗi nếu có'
                ],
                'Lưu ý': [
                    'File phải có định dạng .xlsx',
                    'Không thay đổi tên các cột',
                    'Các cột bắt buộc: name, price, unit',
                    'Giá phải là số, không có dấu phẩy',
                    'Loại sản phẩm sẽ tự động tạo nếu chưa có',
                    'Đối tượng chi phí dùng cho phân loại vật tư',
                    'Kiểm tra kỹ trước khi upload',
                    'Có thể import nhiều lần',
                    'Liên hệ admin nếu có lỗi'
                ]
            }
            
            detailed_df = pd.DataFrame(detailed_instructions)
            detailed_df.to_excel(writer, sheet_name='Hướng dẫn chi tiết', index=False)
        
        output.seek(0)
        
        # Return streaming response
        output.seek(0)
        
        def iter_file():
            yield from output
        
        return StreamingResponse(
            iter_file(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=product_import_template.xlsx"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi tạo template: {str(e)}"
        )
