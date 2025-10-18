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

@router.post("/import-excel")
async def import_products_from_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import products from Excel file"""
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
            df = pd.read_excel(io.BytesIO(content))

        # Validate required columns
        required_columns = ['name', 'price', 'unit']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Thiếu các cột bắt buộc: {', '.join(missing_columns)}"
            )

        result = ProductImportResult()
        result.total_count = len(df)
        
        supabase = get_supabase_client()
        
        # Get all categories for mapping
        categories_response = supabase.table("product_categories").select("id, name").execute()
        categories = {cat["name"]: cat["id"] for cat in categories_response.data}
        
        # Process each row
        for index, row in df.iterrows():
            try:
                # Validate required fields
                if pd.isna(row['name']) or str(row['name']).strip() == '':
                    result.add_error(index + 2, "Tên sản phẩm không được để trống")
                    continue
                
                if pd.isna(row['price']) or row['price'] <= 0:
                    result.add_error(index + 2, "Giá sản phẩm phải lớn hơn 0")
                    continue
                
                if pd.isna(row['unit']) or str(row['unit']).strip() == '':
                    result.add_error(index + 2, "Đơn vị không được để trống")
                    continue

                # Prepare product data
                product_data = {
                    "name": str(row['name']).strip(),
                    "price": float(row['price']),
                    "unit": str(row['unit']).strip(),
                    "description": str(row.get('description', '')).strip() if not pd.isna(row.get('description')) else None,
                    "area": float(row.get('area', 0)) if not pd.isna(row.get('area')) and row.get('area') > 0 else None,
                    "volume": float(row.get('volume', 0)) if not pd.isna(row.get('volume')) and row.get('volume') > 0 else None,
                    "height": float(row.get('height', 0)) if not pd.isna(row.get('height')) and row.get('height') > 0 else None,
                    "length": float(row.get('length', 0)) if not pd.isna(row.get('length')) and row.get('length') > 0 else None,
                    "depth": float(row.get('depth', 0)) if not pd.isna(row.get('depth')) and row.get('depth') > 0 else None,
                    "is_active": True
                }

                # Handle category
                if 'category_name' in row and not pd.isna(row['category_name']):
                    category_name = str(row['category_name']).strip()
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
                    result.add_error(index + 2, "Không thể tạo sản phẩm")
                    
            except Exception as e:
                result.add_error(index + 2, f"Lỗi xử lý dòng: {str(e)}")

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
    """Download Excel template for product import"""
    try:
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
                'cái', 'bộ', 'bộ', 'cái', 'm²'
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
                0.8, 1.1, 2.0, 0.9, 0.6,
                1.8, 0.8, 0.9, 0.6, 0.02
            ],
            'length': [
                1.5, 0.6, 1.8, 2.1, 2.0,
                0.8, 1.8, 2.0, 0.4, 2.0
            ],
            'depth': [
                0.8, 0.6, 0.6, 0.9, 1.0,
                0.3, 0.8, 0.6, 0.4, 2.0
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
            df.to_excel(writer, sheet_name='Products', index=False)
            
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
                    'Diện tích m² (TÙY CHỌN)',
                    'Thể tích m³ (TÙY CHỌN)',
                    'Chiều cao m (TÙY CHỌN)',
                    'Chiều dài m (TÙY CHỌN)',
                    'Chiều sâu m (TÙY CHỌN)',
                    'Tên hạng mục (TÙY CHỌN)'
                ],
                'Ví dụ': [
                    'Bàn gỗ cao cấp',
                    '2500000',
                    'cái',
                    'Bàn gỗ sồi tự nhiên, chân sắt mạ chrome',
                    '2.5',
                    '0.8',
                    '0.8',
                    '1.5',
                    '0.8',
                    'Nội thất văn phòng'
                ],
                'Ghi chú': [
                    'Không được để trống',
                    'Phải > 0, không có dấu phẩy',
                    'cái, kg, m, m², bộ, thùng...',
                    'Mô tả chi tiết về sản phẩm',
                    'Số thập phân, đơn vị m²',
                    'Số thập phân, đơn vị m³',
                    'Số thập phân, đơn vị m',
                    'Số thập phân, đơn vị m',
                    'Số thập phân, đơn vị m',
                    'Tự động tạo hạng mục nếu chưa có'
                ]
            }
            
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Hướng dẫn', index=False)
            
            # Add detailed instructions sheet
            detailed_instructions = {
                'Bước': [
                    '1. Tải template',
                    '2. Mở file Excel',
                    '3. Xem sheet "Hướng dẫn"',
                    '4. Điền thông tin sản phẩm',
                    '5. Kiểm tra dữ liệu',
                    '6. Lưu file',
                    '7. Upload lên hệ thống',
                    '8. Kiểm tra kết quả'
                ],
                'Hướng dẫn': [
                    'Click nút "Tải template" để tải file mẫu',
                    'Mở file Excel bằng Microsoft Excel hoặc Google Sheets',
                    'Đọc kỹ hướng dẫn trong sheet "Hướng dẫn"',
                    'Điền thông tin sản phẩm vào sheet "Products"',
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
                    'Hạng mục sẽ tự động tạo nếu chưa có',
                    'Kiểm tra kỹ trước khi upload',
                    'Có thể import nhiều lần',
                    'Liên hệ admin nếu có lỗi'
                ]
            }
            
            detailed_df = pd.DataFrame(detailed_instructions)
            detailed_df.to_excel(writer, sheet_name='Chi tiết', index=False)
            
            # Add sample categories sheet
            sample_categories = {
                'Tên hạng mục': [
                    'Nội thất văn phòng',
                    'Nội thất phòng khách', 
                    'Nội thất phòng ngủ',
                    'Nội thất phòng ăn',
                    'Nội thất nhà bếp',
                    'Đèn chiếu sáng',
                    'Thảm và phụ kiện',
                    'Đồ điện tử',
                    'Vật liệu xây dựng',
                    'Thiết bị văn phòng'
                ],
                'Mô tả': [
                    'Bàn ghế, tủ văn phòng',
                    'Sofa, bàn trà, kệ tivi',
                    'Giường, tủ quần áo, bàn trang điểm',
                    'Bàn ăn, ghế ăn, tủ rượu',
                    'Tủ bếp, bồn rửa, tủ lạnh',
                    'Đèn chùm, đèn bàn, đèn tường',
                    'Thảm, rèm cửa, gối trang trí',
                    'Tivi, máy tính, điện thoại',
                    'Gạch, xi măng, sắt thép',
                    'Máy in, máy fax, điện thoại bàn'
                ],
                'Ghi chú': [
                    'Sử dụng trong văn phòng',
                    'Dành cho phòng khách',
                    'Sử dụng trong phòng ngủ',
                    'Dành cho phòng ăn',
                    'Sử dụng trong nhà bếp',
                    'Các loại đèn chiếu sáng',
                    'Phụ kiện trang trí',
                    'Thiết bị điện tử',
                    'Vật liệu xây dựng',
                    'Thiết bị văn phòng'
                ]
            }
            
            categories_df = pd.DataFrame(sample_categories)
            categories_df.to_excel(writer, sheet_name='Hạng mục mẫu', index=False)
        
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
