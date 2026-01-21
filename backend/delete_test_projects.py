"""
Script để xóa tất cả các dự án có tên chứa "test"
"""
import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import get_supabase_client

def delete_test_projects(auto_confirm=False):
    """Xóa tất cả các dự án có tên chứa 'test' (case-insensitive)"""
    try:
        supabase = get_supabase_client()
        
        # Tìm tất cả các dự án có tên chứa "test" (case-insensitive)
        print("🔍 Đang tìm các dự án có tên chứa 'test'...")
        result = supabase.table("projects")\
            .select("id, name, project_code")\
            .ilike("name", "%test%")\
            .execute()
        
        if not result.data:
            print("✅ Không tìm thấy dự án nào có tên chứa 'test'")
            return
        
        projects = result.data
        print(f"📋 Tìm thấy {len(projects)} dự án có tên chứa 'test':")
        for project in projects:
            print(f"   - {project.get('name')} (ID: {project.get('id')}, Code: {project.get('project_code')})")
        
        # Xác nhận trước khi xóa
        if not auto_confirm:
            print(f"\n⚠️  Bạn sắp xóa {len(projects)} dự án. Điều này không thể hoàn tác!")
            try:
                confirm = input("Nhập 'YES' để xác nhận xóa: ")
                if confirm != "YES":
                    print("❌ Đã hủy. Không có dự án nào bị xóa.")
                    return
            except (EOFError, KeyboardInterrupt):
                print("\n❌ Đã hủy. Không có dự án nào bị xóa.")
                return
        else:
            print(f"\n⚠️  Sẽ xóa {len(projects)} dự án (auto-confirm mode)...")
        
        # Xóa từng dự án
        deleted_count = 0
        failed_count = 0
        
        for project in projects:
            project_id = project.get('id')
            project_name = project.get('name')
            
            try:
                # Xóa dự án (các bảng liên quan sẽ tự động xóa nhờ CASCADE)
                delete_result = supabase.table("projects")\
                    .delete()\
                    .eq("id", project_id)\
                    .execute()
                
                if delete_result.data:
                    print(f"✅ Đã xóa: {project_name} (ID: {project_id})")
                    deleted_count += 1
                else:
                    print(f"⚠️  Không thể xóa: {project_name} (ID: {project_id})")
                    failed_count += 1
                    
            except Exception as e:
                print(f"❌ Lỗi khi xóa {project_name} (ID: {project_id}): {str(e)}")
                failed_count += 1
        
        # Tóm tắt
        print(f"\n{'='*60}")
        print(f"📊 KẾT QUẢ:")
        print(f"   ✅ Đã xóa: {deleted_count} dự án")
        print(f"   ❌ Thất bại: {failed_count} dự án")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Kiểm tra nếu có flag --yes hoặc -y thì tự động xác nhận
    auto_confirm = "--yes" in sys.argv or "-y" in sys.argv
    delete_test_projects(auto_confirm=auto_confirm)
