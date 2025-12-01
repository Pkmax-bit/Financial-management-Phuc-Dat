"""
Script test để lấy dữ liệu dự án và kiểm tra thành viên không có trong team dự án
"""

import os
import sys
from typing import Dict, List, Set, Optional
from datetime import datetime

# Thêm đường dẫn backend vào sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from services.supabase_client import get_supabase_client
except ImportError:
    print("❌ Không thể import supabase_client. Đảm bảo đã cấu hình đúng.")
    sys.exit(1)

class Colors:
    """Màu sắc cho output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
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
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{message}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}\n")

def get_all_projects(supabase) -> List[Dict]:
    """Lấy danh sách tất cả dự án"""
    try:
        result = supabase.table("projects").select("id, name, project_code, status, created_at").execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách dự án: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def get_all_project_teams(supabase) -> List[Dict]:
    """Lấy danh sách tất cả thành viên trong project_team"""
    try:
        result = supabase.table("project_team").select(
            "id, project_id, name, email, user_id, status, role, start_date"
        ).execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách project_team: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def get_all_employees(supabase) -> List[Dict]:
    """Lấy danh sách tất cả nhân viên"""
    try:
        result = supabase.table("employees").select(
            "id, first_name, last_name, email, user_id, status, department_id, position_id"
        ).eq("status", "active").execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách nhân viên: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def get_all_users(supabase) -> List[Dict]:
    """Lấy danh sách tất cả users"""
    try:
        result = supabase.table("users").select(
            "id, email, full_name, role, is_active"
        ).eq("is_active", True).execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách users: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def analyze_project_teams(projects: List[Dict], teams: List[Dict], employees: List[Dict], users: List[Dict]):
    """Phân tích và hiển thị thông tin về project teams"""
    
    print_header("PHÂN TÍCH DỮ LIỆU DỰ ÁN VÀ THÀNH VIÊN")
    
    # Tạo map để tra cứu nhanh
    projects_map = {p["id"]: p for p in projects}
    teams_by_project = {}
    teams_by_user_id = {}
    teams_by_email = {}
    
    # Nhóm teams theo project_id
    for team in teams:
        project_id = team.get("project_id")
        if project_id:
            if project_id not in teams_by_project:
                teams_by_project[project_id] = []
            teams_by_project[project_id].append(team)
        
        # Nhóm theo user_id
        user_id = team.get("user_id")
        if user_id:
            if user_id not in teams_by_user_id:
                teams_by_user_id[user_id] = []
            teams_by_user_id[user_id].append(team)
        
        # Nhóm theo email
        email = team.get("email")
        if email:
            if email not in teams_by_email:
                teams_by_email[email] = []
            teams_by_email[email].append(team)
    
    # 1. Thống kê tổng quan
    print(f"{Colors.BOLD}📊 THỐNG KÊ TỔNG QUAN{Colors.RESET}\n")
    print(f"   • Tổng số dự án: {len(projects)}")
    print(f"   • Tổng số thành viên trong project_team: {len(teams)}")
    print(f"   • Tổng số nhân viên (active): {len(employees)}")
    print(f"   • Tổng số users (active): {len(users)}")
    print(f"   • Số dự án có team: {len(teams_by_project)}")
    print(f"   • Số users có trong team: {len(teams_by_user_id)}")
    print(f"   • Số email có trong team: {len(teams_by_email)}")
    
    # 2. Dự án không có team
    print(f"\n{Colors.BOLD}📋 DỰ ÁN KHÔNG CÓ THÀNH VIÊN{Colors.RESET}\n")
    projects_without_team = []
    for project in projects:
        if project["id"] not in teams_by_project:
            projects_without_team.append(project)
    
    if projects_without_team:
        print_warning(f"Có {len(projects_without_team)} dự án không có thành viên:")
        for project in projects_without_team:
            print(f"   • {project.get('project_code', 'N/A')} - {project.get('name', 'N/A')} (Status: {project.get('status', 'N/A')})")
    else:
        print_success("Tất cả dự án đều có ít nhất 1 thành viên")
    
    # 3. Dự án có team
    print(f"\n{Colors.BOLD}👥 DỰ ÁN CÓ THÀNH VIÊN{Colors.RESET}\n")
    for project_id, team_members in sorted(teams_by_project.items()):
        project = projects_map.get(project_id, {})
        project_name = project.get("name", "N/A")
        project_code = project.get("project_code", "N/A")
        
        active_members = [m for m in team_members if m.get("status") == "active"]
        inactive_members = [m for m in team_members if m.get("status") != "active"]
        
        print(f"   📁 {project_code} - {project_name}")
        print(f"      • Tổng thành viên: {len(team_members)} (Active: {len(active_members)}, Inactive: {len(inactive_members)})")
        
        # Hiển thị danh sách thành viên active
        if active_members:
            print(f"      • Thành viên active:")
            for member in active_members[:5]:  # Chỉ hiển thị 5 người đầu
                name = member.get("name", "N/A")
                email = member.get("email", "N/A")
                role = member.get("role", "N/A")
                user_id = member.get("user_id", "N/A")
                print(f"        - {name} ({email}) - Role: {role} - User ID: {user_id}")
            if len(active_members) > 5:
                print(f"        ... và {len(active_members) - 5} thành viên khác")
        print()
    
    # 4. Nhân viên/Users KHÔNG có trong project_team
    print(f"\n{Colors.BOLD}🔍 THÀNH VIÊN KHÔNG CÓ TRONG TEAM DỰ ÁN{Colors.RESET}\n")
    
    # Tạo set các user_id và email đã có trong team
    user_ids_in_team = set(teams_by_user_id.keys())
    emails_in_team = set(teams_by_email.keys())
    
    # Tìm employees không có trong team
    employees_not_in_team = []
    for emp in employees:
        user_id = emp.get("user_id")
        email = emp.get("email")
        
        in_team = False
        if user_id and user_id in user_ids_in_team:
            in_team = True
        elif email and email in emails_in_team:
            in_team = True
        
        if not in_team:
            employees_not_in_team.append(emp)
    
    # Tìm users không có trong team
    users_not_in_team = []
    for user in users:
        user_id = user.get("id")
        email = user.get("email")
        
        in_team = False
        if user_id and user_id in user_ids_in_team:
            in_team = True
        elif email and email in emails_in_team:
            in_team = True
        
        if not in_team:
            users_not_in_team.append(user)
    
    # Hiển thị kết quả
    print(f"{Colors.YELLOW}📌 Nhân viên (employees) không có trong team dự án: {len(employees_not_in_team)}{Colors.RESET}\n")
    if employees_not_in_team:
        print("   Danh sách:")
        for emp in employees_not_in_team[:20]:  # Hiển thị 20 người đầu
            first_name = emp.get("first_name", "")
            last_name = emp.get("last_name", "")
            name = f"{first_name} {last_name}".strip() or "N/A"
            email = emp.get("email", "N/A")
            user_id = emp.get("user_id", "Không có")
            emp_id = emp.get("id", "N/A")
            print(f"   • {name} (ID: {emp_id})")
            print(f"     Email: {email}, User ID: {user_id}")
        if len(employees_not_in_team) > 20:
            print(f"   ... và {len(employees_not_in_team) - 20} nhân viên khác")
    else:
        print_success("Tất cả nhân viên đều có trong ít nhất 1 team dự án")
    
    print(f"\n{Colors.YELLOW}📌 Users không có trong team dự án: {len(users_not_in_team)}{Colors.RESET}\n")
    if users_not_in_team:
        print("   Danh sách:")
        for user in users_not_in_team[:20]:  # Hiển thị 20 người đầu
            name = user.get("full_name", "N/A")
            email = user.get("email", "N/A")
            role = user.get("role", "N/A")
            user_id = user.get("id", "N/A")
            print(f"   • {name} (ID: {user_id})")
            print(f"     Email: {email}, Role: {role}")
        if len(users_not_in_team) > 20:
            print(f"   ... và {len(users_not_in_team) - 20} users khác")
    else:
        print_success("Tất cả users đều có trong ít nhất 1 team dự án")
    
    # 5. Tổng kết
    print(f"\n{Colors.BOLD}📈 TỔNG KẾT{Colors.RESET}\n")
    total_people = len(employees) + len(users)
    people_in_team = len(user_ids_in_team) + len(emails_in_team)
    people_not_in_team = len(employees_not_in_team) + len(users_not_in_team)
    
    print(f"   • Tổng số người (employees + users): {total_people}")
    print(f"   • Số người có trong team: {people_in_team}")
    print(f"   • Số người KHÔNG có trong team: {people_not_in_team}")
    
    if people_not_in_team > 0:
        percentage = (people_not_in_team / total_people * 100) if total_people > 0 else 0
        print_warning(f"   • Tỷ lệ người không có trong team: {percentage:.1f}%")
    else:
        print_success("   100% người đều có trong ít nhất 1 team dự án")

def main():
    """Hàm main"""
    print_header("TEST LẤY DỮ LIỆU DỰ ÁN VÀ KIỂM TRA THÀNH VIÊN")
    
    try:
        print_info("Đang kết nối với Supabase...")
        supabase = get_supabase_client()
        print_success("Kết nối thành công!")
        
        print_info("Đang lấy dữ liệu...")
        
        # Lấy dữ liệu
        projects = get_all_projects(supabase)
        teams = get_all_project_teams(supabase)
        employees = get_all_employees(supabase)
        users = get_all_users(supabase)
        
        print_success(f"Đã lấy {len(projects)} dự án, {len(teams)} thành viên team, {len(employees)} nhân viên, {len(users)} users")
        
        # Phân tích
        analyze_project_teams(projects, teams, employees, users)
        
        print_header("KẾT THÚC TEST")
        print_success("Test hoàn tất!")
        
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy bởi người dùng")
    except Exception as e:
        print_error(f"\nLỗi không mong đợi: {str(e)}")
        import traceback
        traceback.print_exc()

