"""
Test script để kiểm tra quyền truy cập dự án
Kiểm tra xem tài khoản có và không có trong project_team có thấy dữ liệu đúng không
"""

import requests
import json
from typing import Dict, List, Optional

# Cấu hình
API_BASE_URL = "http://localhost:8000"
# Hoặc sử dụng biến môi trường
# API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

class Colors:
    """Màu sắc cho output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.RESET}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")

def print_header(message: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def login(email: str, password: str) -> Optional[str]:
    """Đăng nhập và lấy access token"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            print_success(f"Đăng nhập thành công: {user.get('email', email)} (Role: {user.get('role', 'N/A')})")
            return token
        else:
            print_error(f"Đăng nhập thất bại: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print_error(f"Lỗi khi đăng nhập: {str(e)}")
        return None

def get_projects(token: str) -> List[Dict]:
    """Lấy danh sách dự án"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_BASE_URL}/api/projects/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print_error("Không có quyền truy cập danh sách dự án")
            return []
        else:
            print_error(f"Lỗi khi lấy danh sách dự án: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return []

def get_project(token: str, project_id: str) -> Optional[Dict]:
    """Lấy thông tin một dự án cụ thể"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_BASE_URL}/api/projects/{project_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print_error(f"Không có quyền truy cập dự án {project_id}")
            return None
        elif response.status_code == 404:
            print_warning(f"Dự án {project_id} không tồn tại")
            return None
        else:
            print_error(f"Lỗi: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return None

def get_project_financial_summary(token: str, project_id: str) -> Optional[Dict]:
    """Lấy financial summary của dự án"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_BASE_URL}/api/projects/{project_id}/financial-summary",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print_error(f"Không có quyền xem financial summary của dự án {project_id}")
            return None
        else:
            print_error(f"Lỗi: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return None

def get_invoices(token: str, project_id: Optional[str] = None) -> List[Dict]:
    """Lấy danh sách hóa đơn"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{API_BASE_URL}/api/sales/invoices"
        if project_id:
            url += f"?project_id={project_id}"
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print_error(f"Lỗi khi lấy hóa đơn: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return []

def get_quotes(token: str, project_id: Optional[str] = None) -> List[Dict]:
    """Lấy danh sách báo giá"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{API_BASE_URL}/api/sales/quotes"
        if project_id:
            url += f"?project_id={project_id}"
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print_error(f"Lỗi khi lấy báo giá: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return []

def get_project_expenses(token: str, project_id: Optional[str] = None) -> List[Dict]:
    """Lấy danh sách chi phí dự án"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{API_BASE_URL}/api/project-expenses/project-expenses"
        if project_id:
            url += f"?project_id={project_id}"
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print_error(f"Lỗi khi lấy chi phí: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        return []

def get_user_project_team(supabase_url: str, supabase_key: str, user_id: str = None, user_email: str = None) -> List[Dict]:
    """Lấy danh sách dự án mà user tham gia (từ project_team)"""
    try:
        import requests as req
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        url = f"{supabase_url}/rest/v1/project_team?select=project_id,projects(id,name,project_code)&status=eq.active"
        
        if user_id:
            url += f"&user_id=eq.{user_id}"
        elif user_email:
            url += f"&email=eq.{user_email}"
        
        response = req.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print_warning(f"Không thể lấy project_team: {response.status_code}")
            return []
    except Exception as e:
        print_warning(f"Lỗi khi lấy project_team: {str(e)}")
        return []

def test_user_access(email: str, password: str, user_name: str):
    """Test quyền truy cập của một user"""
    print_header(f"TEST QUYỀN TRUY CẬP: {user_name}")
    
    # Đăng nhập
    token = login(email, password)
    if not token:
        print_error("Không thể đăng nhập. Bỏ qua test này.")
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Lấy danh sách dự án
    print_info("Test 1: Lấy danh sách dự án...")
    projects = get_projects(token)
    print(f"   Số lượng dự án có thể truy cập: {len(projects)}")
    if projects:
        print("   Danh sách dự án:")
        for i, project in enumerate(projects[:5], 1):  # Chỉ hiển thị 5 dự án đầu
            print(f"      {i}. {project.get('name', 'N/A')} (ID: {project.get('id', 'N/A')[:8]}...)")
        if len(projects) > 5:
            print(f"      ... và {len(projects) - 5} dự án khác")
    
    # Test 2: Lấy thông tin một dự án cụ thể (nếu có)
    if projects:
        test_project_id = projects[0].get('id')
        print_info(f"Test 2: Lấy thông tin dự án cụ thể (ID: {test_project_id[:8]}...)...")
        project_detail = get_project(token, test_project_id)
        if project_detail:
            print_success(f"   Có thể xem thông tin dự án: {project_detail.get('name', 'N/A')}")
        else:
            print_error("   Không thể xem thông tin dự án")
    else:
        print_warning("   Không có dự án nào để test")
    
    # Test 3: Lấy financial summary
    if projects:
        test_project_id = projects[0].get('id')
        print_info(f"Test 3: Lấy financial summary của dự án...")
        financial = get_project_financial_summary(token, test_project_id)
        if financial:
            print_success("   Có thể xem financial summary")
            summary = financial.get('financial_summary', {})
            print(f"      - Tổng thu nhập: {summary.get('total_income', 0):,.0f}")
            print(f"      - Tổng chi phí: {summary.get('total_costs', 0):,.0f}")
        else:
            print_error("   Không thể xem financial summary")
    
    # Test 4: Lấy hóa đơn
    print_info("Test 4: Lấy danh sách hóa đơn...")
    invoices = get_invoices(token)
    print(f"   Số lượng hóa đơn có thể truy cập: {len(invoices)}")
    if invoices:
        project_ids_in_invoices = set(inv.get('project_id') for inv in invoices if inv.get('project_id'))
        print(f"   Hóa đơn thuộc {len(project_ids_in_invoices)} dự án khác nhau")
    
    # Test 5: Lấy báo giá
    print_info("Test 5: Lấy danh sách báo giá...")
    quotes = get_quotes(token)
    print(f"   Số lượng báo giá có thể truy cập: {len(quotes)}")
    if quotes:
        project_ids_in_quotes = set(q.get('project_id') for q in quotes if q.get('project_id'))
        print(f"   Báo giá thuộc {len(project_ids_in_quotes)} dự án khác nhau")
    
    # Test 6: Lấy chi phí dự án
    print_info("Test 6: Lấy danh sách chi phí dự án...")
    expenses = get_project_expenses(token)
    print(f"   Số lượng chi phí có thể truy cập: {len(expenses)}")
    if expenses:
        project_ids_in_expenses = set(exp.get('project_id') for exp in expenses if exp.get('project_id'))
        print(f"   Chi phí thuộc {len(project_ids_in_expenses)} dự án khác nhau")
    
    return {
        "token": token,
        "projects": projects,
        "invoices": invoices,
        "quotes": quotes,
        "expenses": expenses
    }

def compare_access(user1_data: Dict, user2_data: Dict, user1_name: str, user2_name: str):
    """So sánh quyền truy cập giữa 2 user"""
    print_header("SO SÁNH QUYỀN TRUY CẬP")
    
    # So sánh số lượng dự án
    projects1 = user1_data.get("projects", [])
    projects2 = user2_data.get("projects", [])
    
    project_ids1 = set(p.get('id') for p in projects1)
    project_ids2 = set(p.get('id') for p in projects2)
    
    print_info(f"Số lượng dự án:")
    print(f"   {user1_name}: {len(projects1)} dự án")
    print(f"   {user2_name}: {len(projects2)} dự án")
    
    common_projects = project_ids1 & project_ids2
    only_user1 = project_ids1 - project_ids2
    only_user2 = project_ids2 - project_ids1
    
    if common_projects:
        print_success(f"   Dự án chung: {len(common_projects)}")
    if only_user1:
        print_info(f"   Chỉ {user1_name} có quyền: {len(only_user1)}")
    if only_user2:
        print_info(f"   Chỉ {user2_name} có quyền: {len(only_user2)}")
    
    # So sánh hóa đơn
    invoices1 = user1_data.get("invoices", [])
    invoices2 = user2_data.get("invoices", [])
    
    invoice_ids1 = set(inv.get('id') for inv in invoices1)
    invoice_ids2 = set(inv.get('id') for inv in invoices2)
    
    print_info(f"Số lượng hóa đơn:")
    print(f"   {user1_name}: {len(invoices1)} hóa đơn")
    print(f"   {user2_name}: {len(invoices2)} hóa đơn")
    
    # So sánh báo giá
    quotes1 = user1_data.get("quotes", [])
    quotes2 = user2_data.get("quotes", [])
    
    print_info(f"Số lượng báo giá:")
    print(f"   {user1_name}: {len(quotes1)} báo giá")
    print(f"   {user2_name}: {len(quotes2)} báo giá")
    
    # So sánh chi phí
    expenses1 = user1_data.get("expenses", [])
    expenses2 = user2_data.get("expenses", [])
    
    print_info(f"Số lượng chi phí:")
    print(f"   {user1_name}: {len(expenses1)} chi phí")
    print(f"   {user2_name}: {len(expenses2)} chi phí")

def main():
    """Hàm main để chạy test"""
    print_header("KIỂM TRA QUYỀN TRUY CẬP DỰ ÁN")
    print_info("Script này sẽ test quyền truy cập dự án cho 2 tài khoản:")
    print_info("  1. Tài khoản CÓ trong project_team")
    print_info("  2. Tài khoản KHÔNG có trong project_team")
    print()
    
    # Yêu cầu người dùng nhập thông tin
    print("Vui lòng nhập thông tin tài khoản để test:")
    print()
    
    print("Tài khoản 1 (CÓ trong project_team):")
    email1 = input("  Email: ").strip()
    password1 = input("  Password: ").strip()
    name1 = input("  Tên (để hiển thị): ").strip() or "User 1"
    
    print()
    print("Tài khoản 2 (KHÔNG có trong project_team):")
    email2 = input("  Email: ").strip()
    password2 = input("  Password: ").strip()
    name2 = input("  Tên (để hiển thị): ").strip() or "User 2"
    
    print()
    print_info("Bắt đầu test...")
    print()
    
    # Test user 1
    user1_data = test_user_access(email1, password1, name1)
    
    print()
    
    # Test user 2
    user2_data = test_user_access(email2, password2, name2)
    
    print()
    
    # So sánh
    if user1_data and user2_data:
        compare_access(user1_data, user2_data, name1, name2)
    
    print()
    print_header("KẾT THÚC TEST")
    print_success("Test hoàn tất! Kiểm tra kết quả ở trên.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy bởi người dùng")
    except Exception as e:
        print_error(f"\n❌ Lỗi không mong đợi: {str(e)}")
        import traceback
        traceback.print_exc()

