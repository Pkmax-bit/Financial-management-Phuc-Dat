"""
Customer Code Generator Utility
Tự động tạo mã khách hàng theo định dạng CUS000
"""

from typing import Optional
from services.supabase_client import get_supabase_client

def generate_customer_code() -> str:
    """
    Tự động tạo mã khách hàng theo định dạng CUS000
    Tìm mã khách hàng lớn nhất hiện tại và tăng lên 1
    """
    try:
        supabase = get_supabase_client()
        
        # Lấy tất cả mã khách hàng hiện tại, sắp xếp theo thứ tự giảm dần
        result = supabase.table("customers").select("customer_code").order("customer_code", desc=True).limit(1).execute()
        
        if not result.data:
            # Nếu chưa có khách hàng nào, bắt đầu từ CUS001
            return "CUS001"
        
        # Lấy mã khách hàng lớn nhất
        latest_code = result.data[0].get("customer_code", "")
        
        # Kiểm tra xem mã có đúng định dạng CUS không
        if not latest_code.startswith("CUS"):
            # Nếu không đúng định dạng, bắt đầu từ CUS001
            return "CUS001"
        
        try:
            # Trích xuất số từ mã (ví dụ: CUS123 -> 123)
            number_part = latest_code[3:]  # Bỏ qua "CUS"
            current_number = int(number_part)
            
            # Tăng lên 1 và format lại
            next_number = current_number + 1
            return f"CUS{next_number:03d}"  # Format với 3 chữ số, thêm 0 ở đầu nếu cần
            
        except (ValueError, IndexError):
            # Nếu không parse được số, bắt đầu từ CUS001
            return "CUS001"
            
    except Exception as e:
        print(f"Error generating customer code: {e}")
        # Fallback: tạo mã dựa trên timestamp
        import time
        timestamp = int(time.time())
        return f"CUS{timestamp % 1000:03d}"

def validate_customer_code(code: str) -> bool:
    """
    Kiểm tra xem mã khách hàng có đúng định dạng không
    """
    if not code:
        return False
    
    # Kiểm tra định dạng CUS + 3 chữ số
    if len(code) != 6:
        return False
    
    if not code.startswith("CUS"):
        return False
    
    try:
        number_part = code[3:]
        int(number_part)
        return True
    except ValueError:
        return False

def check_customer_code_exists(code: str) -> bool:
    """
    Kiểm tra xem mã khách hàng đã tồn tại chưa
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("customers").select("id").eq("customer_code", code).execute()
        return len(result.data) > 0
    except Exception as e:
        print(f"Error checking customer code existence: {e}")
        return False

def get_next_available_customer_code() -> str:
    """
    Lấy mã khách hàng tiếp theo có sẵn
    Đảm bảo mã không bị trùng lặp
    """
    max_attempts = 1000  # Giới hạn số lần thử để tránh vòng lặp vô hạn
    
    for attempt in range(max_attempts):
        code = generate_customer_code()
        
        if not check_customer_code_exists(code):
            return code
        
        # Nếu mã đã tồn tại, thử tạo mã khác
        import time
        time.sleep(0.001)  # Thêm delay nhỏ để tránh conflict
    
    # Nếu không tìm được mã sau max_attempts lần thử
    import time
    timestamp = int(time.time())
    return f"CUS{timestamp % 10000:04d}"  # Sử dụng timestamp làm fallback
