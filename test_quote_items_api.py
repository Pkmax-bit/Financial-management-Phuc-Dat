"""
Test API báo giá - Kiểm tra xem API có lấy được dữ liệu sản phẩm không
"""
import requests
import json
import sys

BASE_URL = "https://financial-management-backend-3m78.onrender.com/api"

# Có thể truyền token qua command line: python test_quote_items_api.py YOUR_TOKEN
# Hoặc đặt token vào biến môi trường
TOKEN = None
if len(sys.argv) > 1:
    TOKEN = sys.argv[1]
elif hasattr(sys, 'environ') and 'API_TOKEN' in sys.environ:
    TOKEN = sys.environ.get('API_TOKEN')

def test_quote_items_api():
    print("=" * 80)
    print("TEST API BÁO GIÁ - KIỂM TRA DỮ LIỆU SẢN PHẨM")
    print("=" * 80)
    
    # Headers với token nếu có
    headers = {}
    if TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'
        print(f"✓ Sử dụng token để authenticate")
    else:
        print("⚠ Không có token - API có thể trả về lỗi 403")
        print("  Cách sử dụng: python test_quote_items_api.py YOUR_TOKEN")
        print("  Hoặc: export API_TOKEN=YOUR_TOKEN (Linux/Mac)")
        print("  Hoặc: $env:API_TOKEN='YOUR_TOKEN' (PowerShell)")
    
    # 1. Get all quotes
    print("\n1. Lấy danh sách báo giá...")
    try:
        response = requests.get(f"{BASE_URL}/sales/quotes?limit=5", headers=headers)
        response.raise_for_status()
        quotes = response.json()
        print(f"✓ Tổng số báo giá: {len(quotes)}")
        
        if not quotes:
            print("⚠ Không có báo giá nào trong hệ thống")
            return
        
        # Lấy báo giá đầu tiên để test
        test_quote = quotes[0]
        quote_id = test_quote.get('id')
        quote_number = test_quote.get('quote_number', 'N/A')
        
        print(f"\n✓ Chọn báo giá để test:")
        print(f"  - ID: {quote_id}")
        print(f"  - Số báo giá: {quote_number}")
        print(f"  - Khách hàng: {test_quote.get('customer', {}).get('name', 'N/A') if test_quote.get('customer') else 'N/A'}")
        print(f"  - Dự án: {test_quote.get('project', {}).get('name', 'N/A') if test_quote.get('project') else 'N/A'}")
        
        # 2. Get quote detail by ID
        print(f"\n2. Lấy chi tiết báo giá (GET /sales/quotes/{quote_id})...")
        try:
            detail_response = requests.get(f"{BASE_URL}/sales/quotes/{quote_id}", headers=headers)
            detail_response.raise_for_status()
            quote_detail = detail_response.json()
            
            print(f"✓ Lấy chi tiết báo giá thành công")
            print(f"  - ID: {quote_detail.get('id')}")
            print(f"  - Số báo giá: {quote_detail.get('quote_number')}")
            print(f"  - Trạng thái: {quote_detail.get('status')}")
            print(f"  - Tổng tiền: {quote_detail.get('total_amount', 0):,.0f} VND")
            
            # Kiểm tra quote_items
            quote_items = quote_detail.get('quote_items')
            if quote_items is None:
                print("\n⚠ QUAN TRỌNG: quote_items là NULL trong response!")
                print("  - Kiểm tra xem API có trả về field quote_items không")
            elif isinstance(quote_items, list):
                print(f"\n✓ Tìm thấy quote_items: {len(quote_items)} sản phẩm")
                
                if len(quote_items) > 0:
                    print(f"\n3. Chi tiết sản phẩm đầu tiên:")
                    first_item = quote_items[0]
                    
                    # Kiểm tra các field quan trọng
                    fields_to_check = [
                        ('id', 'ID'),
                        ('description', 'Mô tả'),
                        ('name_product', 'Tên sản phẩm (name_product)'),
                        ('product_name', 'Tên sản phẩm (product_name - từ API service)'),
                        ('quantity', 'Số lượng'),
                        ('unit', 'Đơn vị'),
                        ('product_unit', 'Đơn vị (product_unit - từ API service)'),
                        ('unit_price', 'Đơn giá'),
                        ('total_price', 'Tổng tiền (total_price)'),
                        ('line_total', 'Tổng tiền (line_total - từ database)'),
                        ('product_service_id', 'ID sản phẩm'),
                        ('category_name', 'Danh mục (category_name - từ API service)'),
                        ('product_image_url', 'Hình ảnh (product_image_url)'),
                        ('product_price', 'Giá sản phẩm (product_price - từ API service)'),
                    ]
                    
                    print("\n  Các field có trong response:")
                    for field, label in fields_to_check:
                        value = first_item.get(field)
                        if value is not None:
                            if isinstance(value, (int, float)):
                                print(f"  ✓ {label}: {value}")
                            elif isinstance(value, str) and len(value) > 50:
                                print(f"  ✓ {label}: {value[:50]}...")
                            else:
                                print(f"  ✓ {label}: {value}")
                        else:
                            print(f"  ✗ {label}: NULL/Không có")
                    
                    # Hiển thị toàn bộ JSON của item đầu tiên
                    print(f"\n4. JSON đầy đủ của sản phẩm đầu tiên:")
                    print(json.dumps(first_item, indent=2, ensure_ascii=False))
                    
                    # Tóm tắt
                    print(f"\n5. TÓM TẮT:")
                    has_product_name = first_item.get('product_name') is not None
                    has_category_name = first_item.get('category_name') is not None
                    has_product_unit = first_item.get('product_unit') is not None
                    has_line_total = first_item.get('line_total') is not None
                    
                    print(f"  - Có product_name (từ API service): {'✓' if has_product_name else '✗'}")
                    print(f"  - Có category_name (từ API service): {'✓' if has_category_name else '✗'}")
                    print(f"  - Có product_unit (từ API service): {'✓' if has_product_unit else '✗'}")
                    print(f"  - Có line_total (từ database): {'✓' if has_line_total else '✗'}")
                    
                    if has_product_name and has_category_name:
                        print(f"\n  ✅ API ĐÃ TRẢ VỀ ĐẦY ĐỦ DỮ LIỆU SẢN PHẨM!")
                    else:
                        print(f"\n  ⚠️ API THIẾU MỘT SỐ DỮ LIỆU SẢN PHẨM")
                        if not has_product_name:
                            print(f"     - Thiếu product_name (cần từ quote_service.get_quote_items_with_categories)")
                        if not has_category_name:
                            print(f"     - Thiếu category_name (cần từ quote_service.get_quote_items_with_categories)")
                else:
                    print("\n⚠ Báo giá này không có sản phẩm nào")
            else:
                print(f"\n⚠ quote_items không phải là list, type: {type(quote_items)}")
                print(f"  Giá trị: {quote_items}")
            
            # Hiển thị toàn bộ response để debug
            print(f"\n6. JSON đầy đủ của response (chỉ hiển thị các field chính):")
            print(json.dumps({
                'id': quote_detail.get('id'),
                'quote_number': quote_detail.get('quote_number'),
                'status': quote_detail.get('status'),
                'total_amount': quote_detail.get('total_amount'),
                'quote_items_count': len(quote_items) if isinstance(quote_detail.get('quote_items'), list) else 0,
                'has_quote_items': 'quote_items' in quote_detail,
                'quote_items_type': type(quote_detail.get('quote_items')).__name__ if 'quote_items' in quote_detail else 'N/A'
            }, indent=2, ensure_ascii=False))
            
        except requests.exceptions.HTTPError as e:
            print(f"✗ Lỗi HTTP khi lấy chi tiết báo giá: {e}")
            if detail_response.status_code == 403:
                print(f"  ⚠ Lỗi 403: Cần authentication token")
                print(f"  Cách sử dụng: python test_quote_items_api.py YOUR_TOKEN")
            print(f"  Response: {detail_response.text}")
        except Exception as e:
            print(f"✗ Lỗi: {e}")
            import traceback
            traceback.print_exc()
        
    except requests.exceptions.HTTPError as e:
        print(f"✗ Lỗi HTTP: {e}")
        if response.status_code == 403:
            print(f"  ⚠ Lỗi 403: Cần authentication token")
            print(f"  Cách sử dụng: python test_quote_items_api.py YOUR_TOKEN")
            print(f"  Hoặc test bằng Postman/curl với header: Authorization: Bearer YOUR_TOKEN")
        print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_quote_items_api()

