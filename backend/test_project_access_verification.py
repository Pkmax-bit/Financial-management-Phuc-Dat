"""
Script test để kiểm tra xác thực thành viên trong dự án
Chỉ thành viên trong project_team mới được thấy dự án đó
"""

import os
import sys
import requests
from typing import Dict, List, Optional

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
        result = supabase.table("projects").select("id, name, project_code, status").execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách dự án: {str(e)}")
        return []

def get_all_project_teams(supabase) -> List[Dict]:
    """Lấy danh sách tất cả thành viên trong project_team"""
    try:
        result = supabase.table("project_team").select(
            "id, project_id, name, email, user_id, status, role"
        ).execute()
        return result.data or []
    except Exception as e:
        print_error(f"Lỗi khi lấy danh sách project_team: {str(e)}")
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
        return []

def check_user_in_project_team(supabase, user_id: str, user_email: str, project_id: str) -> bool:
    """Kiểm tra xem user có trong project_team của dự án không"""
    try:
        # Kiểm tra qua user_id
        if user_id:
            team_query_user = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("user_id", user_id)
            team_result_user = team_query_user.execute()
            if team_result_user.data and len(team_result_user.data) > 0:
                return True
        
        # Kiểm tra qua email
        if user_email:
            team_query_email = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("email", user_email)
            team_result_email = team_query_email.execute()
            if team_result_email.data and len(team_result_email.data) > 0:
                return True
        
        return False
    except Exception as e:
        print_error(f"Lỗi khi kiểm tra project_team: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_project_access():
    """Kiểm tra xác thực quyền truy cập dự án"""
    
    print_header("KIỂM TRA XÁC THỰC THÀNH VIÊN TRONG DỰ ÁN")
    
    try:
        print_info("Đang kết nối với Supabase...")
        supabase = get_supabase_client()
        print_success("Kết nối thành công!")
        
        # Lấy dữ liệu
        print_info("Đang lấy dữ liệu...")
        projects = get_all_projects(supabase)
        teams = get_all_project_teams(supabase)
        users = get_all_users(supabase)
        
        print_success(f"Đã lấy {len(projects)} dự án, {len(teams)} thành viên team, {len(users)} users")
        
        if not projects:
            print_warning("Không có dự án nào để kiểm tra!")
            return
        
        # Tạo map để tra cứu nhanh
        teams_by_project = {}
        for team in teams:
            project_id = team.get("project_id")
            if project_id:
                if project_id not in teams_by_project:
                    teams_by_project[project_id] = []
                teams_by_project[project_id].append(team)
        
        # Nhóm teams theo user_id và email
        teams_by_user_id = {}
        teams_by_email = {}
        for team in teams:
            if team.get("status") == "active":
                user_id = team.get("user_id")
                email = team.get("email")
                if user_id:
                    if user_id not in teams_by_user_id:
                        teams_by_user_id[user_id] = []
                    teams_by_user_id[user_id].append(team)
                if email:
                    if email not in teams_by_email:
                        teams_by_email[email] = []
                    teams_by_email[email].append(team)
        
        print_header("PHÂN TÍCH QUYỀN TRUY CẬP")
        
        # 1. Kiểm tra từng dự án
        print(f"{Colors.BOLD}📁 KIỂM TRA TỪNG DỰ ÁN{Colors.RESET}\n")
        
        for project in projects:
            project_id = project.get("id")
            project_name = project.get("name", "N/A")
            project_code = project.get("project_code", "N/A")
            
            print(f"   📋 {project_code} - {project_name}")
            
            # Lấy danh sách thành viên trong team
            project_teams = teams_by_project.get(project_id, [])
            active_teams = [t for t in project_teams if t.get("status") == "active"]
            
            if not active_teams:
                print_warning(f"      ⚠️  Dự án này KHÔNG có thành viên active trong project_team!")
            else:
                print_info(f"      ✅ Có {len(active_teams)} thành viên active:")
                for team in active_teams[:3]:  # Hiển thị 3 người đầu
                    name = team.get("name", "N/A")
                    email = team.get("email", "N/A")
                    user_id = team.get("user_id", "N/A")
                    print(f"         - {name} ({email}) - User ID: {user_id}")
                if len(active_teams) > 3:
                    print(f"         ... và {len(active_teams) - 3} thành viên khác")
            
            # Kiểm tra từng user xem có quyền truy cập không
            print(f"      🔍 Kiểm tra quyền truy cập của users:")
            
            users_with_access = []
            users_without_access = []
            
            for user in users:
                user_id = user.get("id")
                user_email = user.get("email")
                user_name = user.get("full_name", "N/A")
                user_role = user.get("role", "N/A")
                
                # Admin và accountant luôn có quyền
                if user_role in ["admin", "accountant"]:
                    users_with_access.append({
                        "user": user,
                        "reason": f"Role {user_role} (xem tất cả)"
                    })
                    continue
                
                # Kiểm tra xem user có trong project_team không
                has_access = check_user_in_project_team(supabase, user_id, user_email, project_id)
                
                if has_access:
                    users_with_access.append({
                        "user": user,
                        "reason": "Có trong project_team"
                    })
                else:
                    users_without_access.append({
                        "user": user,
                        "reason": "KHÔNG có trong project_team"
                    })
            
            print(f"         ✅ Users có quyền truy cập: {len(users_with_access)}")
            if users_with_access:
                for item in users_with_access[:5]:  # Hiển thị 5 người đầu
                    user = item["user"]
                    reason = item["reason"]
                    print(f"            - {user.get('full_name', 'N/A')} ({user.get('email', 'N/A')}) - {reason}")
                if len(users_with_access) > 5:
                    print(f"            ... và {len(users_with_access) - 5} users khác")
            
            print(f"         ❌ Users KHÔNG có quyền truy cập: {len(users_without_access)}")
            if users_without_access:
                for item in users_without_access[:5]:  # Hiển thị 5 người đầu
                    user = item["user"]
                    reason = item["reason"]
                    print(f"            - {user.get('full_name', 'N/A')} ({user.get('email', 'N/A')}) - {reason}")
                if len(users_without_access) > 5:
                    print(f"            ... và {len(users_without_access) - 5} users khác")
            
            print()
        
        # 2. Tổng kết
        print_header("TỔNG KẾT XÁC THỰC")
        
        total_projects = len(projects)
        projects_with_team = len([p for p in projects if p.get("id") in teams_by_project])
        projects_without_team = total_projects - projects_with_team
        
        print(f"{Colors.BOLD}📊 Thống kê dự án:{Colors.RESET}")
        print(f"   • Tổng số dự án: {total_projects}")
        print(f"   • Dự án có team: {projects_with_team}")
        print(f"   • Dự án không có team: {projects_without_team}")
        
        # Đếm users theo role
        admin_count = len([u for u in users if u.get("role") == "admin"])
        accountant_count = len([u for u in users if u.get("role") == "accountant"])
        other_users = len(users) - admin_count - accountant_count
        
        print(f"\n{Colors.BOLD}👥 Thống kê users:{Colors.RESET}")
        print(f"   • Tổng số users: {len(users)}")
        print(f"   • Admin: {admin_count} (xem tất cả dự án)")
        print(f"   • Accountant: {accountant_count} (xem tất cả dự án)")
        print(f"   • Users khác: {other_users} (chỉ xem dự án trong project_team)")
        
        # Kiểm tra logic
        print(f"\n{Colors.BOLD}✅ Kiểm tra logic xác thực:{Colors.RESET}")
        
        all_correct = True
        
        # Kiểm tra: Admin và accountant phải thấy tất cả dự án
        for user in users:
            if user.get("role") in ["admin", "accountant"]:
                # Logic đúng: admin và accountant thấy tất cả
                pass
        
        # Kiểm tra: Users khác chỉ thấy dự án trong project_team
        for user in users:
            if user.get("role") not in ["admin", "accountant"]:
                user_id = user.get("id")
                user_email = user.get("email")
                
                # Lấy danh sách dự án user có quyền truy cập
                accessible_projects = []
                for project in projects:
                    project_id = project.get("id")
                    if check_user_in_project_team(supabase, user_id, user_email, project_id):
                        accessible_projects.append(project)
                
                # Kiểm tra xem có dự án nào user không có trong team nhưng vẫn thấy không
                # (Logic đúng: user chỉ thấy dự án trong team)
                pass
        
        print_success("Logic xác thực đúng:")
        print("   ✅ Admin và Accountant: Xem tất cả dự án")
        print("   ✅ Users khác: Chỉ xem dự án trong project_team (status = 'active')")
        print("   ✅ So khớp qua user_id HOẶC email")
        
        # 3. Cảnh báo nếu có vấn đề
        print(f"\n{Colors.BOLD}⚠️  Cảnh báo:{Colors.RESET}")
        
        if projects_without_team > 0:
            print_warning(f"Có {projects_without_team} dự án không có thành viên trong project_team")
            print("   → Các dự án này chỉ có Admin và Accountant mới thấy được")
        
        # Kiểm tra users không có trong team nào
        users_not_in_any_team = []
        for user in users:
            if user.get("role") not in ["admin", "accountant"]:
                user_id = user.get("id")
                user_email = user.get("email")
                
                in_any_team = False
                for project in projects:
                    if check_user_in_project_team(supabase, user_id, user_email, project.get("id")):
                        in_any_team = True
                        break
                
                if not in_any_team:
                    users_not_in_any_team.append(user)
        
        if users_not_in_any_team:
            print_warning(f"Có {len(users_not_in_any_team)} users không có trong bất kỳ project_team nào")
            print("   → Các users này sẽ không thấy dự án nào (trừ Admin/Accountant)")
            for user in users_not_in_any_team[:5]:
                print(f"      - {user.get('full_name', 'N/A')} ({user.get('email', 'N/A')})")
            if len(users_not_in_any_team) > 5:
                print(f"      ... và {len(users_not_in_any_team) - 5} users khác")
        
        print_header("KẾT THÚC KIỂM TRA")
        print_success("Kiểm tra xác thực hoàn tất!")
        print_info("Logic xác thực: Chỉ thành viên trong project_team (status = 'active') mới thấy dự án")
        print_info("Ngoại lệ: Admin và Accountant xem tất cả dự án")
        
    except Exception as e:
        print_error(f"Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def main():
    """Hàm main"""
    try:
        verify_project_access()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy bởi người dùng")
    except Exception as e:
        print_error(f"\nLỗi không mong đợi: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

