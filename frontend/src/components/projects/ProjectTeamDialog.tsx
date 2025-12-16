'use client'

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string;
  name: string;
  email: string;
  user_id?: string;
  type: 'employee' | 'user';
  department?: string;
  position?: string;
  role?: string;
  phone?: string;
  avatar_url?: string;
  employee_code?: string;
  hire_date?: string;
  manager_name?: string;
  address?: string;
  status?: string;
  department_id?: string;
}

interface ProjectTeamDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onSuccess: () => void;
  currentUser?: {
    full_name?: string;
    email?: string;
    id?: string;
  };
}

const ROLES = [
  'Người phụ trách',
  'Người tạo',
  'Thành viên dự án',
  'Giám sát',
  'Lắp đặt',
  'Vận chuyển',
  'Xưởng',
  'Kỹ thuật',
  'Thiết kế',
  'Quản lý dự án'
];

export const ProjectTeamDialog: React.FC<ProjectTeamDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  onSuccess,
  currentUser
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<{[key: string]: string}>({});
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchEmployeesAndUsers();
      if (currentUser?.full_name && currentUser?.email) {
        const currentUserEmployee: Employee = {
          id: currentUser.id || 'current-user',
          name: currentUser.full_name,
          email: currentUser.email,
          type: 'user',
          user_id: currentUser.id
        };
        setSelectedEmployees([currentUserEmployee]);
        setEmployeeRoles(prev => ({
          ...prev,
          [currentUserEmployee.id]: 'Quản lý dự án'
        }));
      }
    }
  }, [open, currentUser]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setDepartments((data || []) as Array<{id: string, name: string}>);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchEmployeesAndUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Bắt đầu lấy dữ liệu nhân viên...');
      
      const { data: teamMembersData } = await supabase
        .from('project_team')
        .select('user_id, email')
        .eq('project_id', projectId)
        .eq('status', 'active');

      const existingTeamUserIds = new Set((teamMembersData || []).map(tm => tm.user_id).filter(Boolean));
      const existingTeamEmails = new Set((teamMembersData || []).map(tm => tm.email).filter(Boolean));

      // Query TẤT CẢ nhân viên (active) - không filter gì thêm
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id, 
          user_id, 
          employee_code, 
          first_name, 
          last_name, 
          email, 
          phone,
          department_id,
          position_id,
          hire_date, 
          status, 
          avatar_url, 
          address,
          manager_id,
          salary
        `)
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (employeesError) {
        console.error('❌ Error fetching employees:', employeesError);
        throw new Error(`Error fetching employees: ${employeesError.message}`);
      }

      console.log(`✅ Lấy được ${employeesData?.length || 0} nhân viên từ database`);

      // Lấy TẤT CẢ departments (không chỉ những cái có trong employees)
      const { data: allDeptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');
      
      let departmentsMap = new Map<string, {id: string, name: string, code?: string}>();
      if (deptError) {
        console.error('❌ Error fetching all departments:', deptError);
      } else if (allDeptData) {
        allDeptData.forEach((dept: any) => {
          departmentsMap.set(dept.id, { id: dept.id, name: dept.name, code: dept.code });
        });
        console.log(`✅ Lấy được ${allDeptData.length} phòng ban`);
      }
      
      // Lấy TẤT CẢ positions (không chỉ những cái có trong employees)
      const { data: allPosData, error: posError } = await supabase
        .from('positions')
        .select('id, name, code')
        .order('name');
      
      let positionsMap = new Map<string, {id: string, name: string, code?: string}>();
      if (posError) {
        console.error('❌ Error fetching all positions:', posError);
      } else if (allPosData) {
        allPosData.forEach((pos: any) => {
          positionsMap.set(pos.id, { id: pos.id, name: pos.name, code: pos.code });
        });
        console.log(`✅ Lấy được ${allPosData.length} vị trí`);
      }
      
      // Query managers nếu có
      const managerIds = new Set<string>();
      (employeesData || []).forEach((emp: any) => {
        if (emp.manager_id) managerIds.add(emp.manager_id);
      });
      
      let managersMap = new Map<string, {first_name: string, last_name: string}>();
      if (managerIds.size > 0) {
        const { data: mgrData } = await supabase
          .from('employees')
          .select('id, first_name, last_name, employee_code')
          .in('id', Array.from(managerIds));
        
        if (mgrData) {
          mgrData.forEach((mgr: any) => {
            managersMap.set(mgr.id, { first_name: mgr.first_name, last_name: mgr.last_name });
          });
          console.log(`✅ Lấy được ${mgrData.length} quản lý`);
        }
      }

      // Query users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, phone, is_active')
        .eq('is_active', true);

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        throw new Error(`Error fetching users: ${usersError.message}`);
      }
      
      console.log(`✅ Lấy được ${usersData?.length || 0} users`);

      // Format employees với đầy đủ thông tin
      const formattedEmployees = (employeesData || [])
        .filter((emp: any) => !((emp.user_id && existingTeamUserIds.has(emp.user_id)) || 
                   (emp.email && existingTeamEmails.has(emp.email))))
        .map((emp: any) => {
          // Lấy department từ map
          let departmentName: string | undefined;
          let departmentId: string | undefined = emp.department_id;
          let departmentCode: string | undefined;
          
          if (emp.department_id && departmentsMap.has(emp.department_id)) {
            const dept = departmentsMap.get(emp.department_id);
            departmentName = dept?.name;
            departmentId = dept?.id || emp.department_id;
            departmentCode = dept?.code;
          } else if (emp.department_id) {
            // Nếu có department_id nhưng không tìm thấy trong map, vẫn giữ ID
            departmentId = emp.department_id;
            console.warn(`⚠️ Không tìm thấy phòng ban với ID: ${emp.department_id} cho nhân viên ${emp.first_name} ${emp.last_name}`);
          }
          
          // Lấy position từ map
          let positionName: string | undefined;
          let positionCode: string | undefined;
          if (emp.position_id && positionsMap.has(emp.position_id)) {
            const pos = positionsMap.get(emp.position_id);
            positionName = pos?.name;
            positionCode = pos?.code;
          } else if (emp.position_id) {
            console.warn(`⚠️ Không tìm thấy vị trí với ID: ${emp.position_id} cho nhân viên ${emp.first_name} ${emp.last_name}`);
          }
          
          // Lấy manager từ map
          let managerName: string | undefined;
          if (emp.manager_id && managersMap.has(emp.manager_id)) {
            const mgr = managersMap.get(emp.manager_id);
            managerName = mgr ? `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim() : undefined;
          }
          
          const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
          
          return {
            id: emp.id,
            name: fullName || emp.email || 'Không có tên',
            email: emp.email,
            user_id: emp.user_id,
            type: 'employee' as const,
            department: departmentName || (emp.department_id ? `[ID: ${emp.department_id}]` : undefined),
            department_id: departmentId,
            position: positionName || (emp.position_id ? `[ID: ${emp.position_id}]` : undefined),
            phone: emp.phone,
            avatar_url: emp.avatar_url,
            employee_code: emp.employee_code,
            hire_date: emp.hire_date,
            manager_name: managerName,
            address: emp.address,
            status: emp.status
          } as Employee;
        });
      
      console.log(`✅ Đã format ${formattedEmployees.length} nhân viên (sau khi loại bỏ thành viên đã có trong dự án)`);

      // Tạo map từ user_id -> employee để map users với employees
      const userIdToEmployeeMap = new Map<string, any>();
      (employeesData || []).forEach((emp: any) => {
        if (emp.user_id) {
          userIdToEmployeeMap.set(emp.user_id, emp);
        }
      });
      console.log(`✅ Đã tạo map: ${userIdToEmployeeMap.size} users có employee record`);

      // Format users và map với employees nếu có
      const formattedUsers = (usersData || [])
        .filter(user => !((user.id && existingTeamUserIds.has(user.id)) || 
                   (user.email && existingTeamEmails.has(user.email))))
        .map(user => {
          // Tìm employee tương ứng với user này
          const correspondingEmployee = userIdToEmployeeMap.get(user.id);
          
          let departmentName: string | undefined;
          let departmentId: string | undefined;
          let positionName: string | undefined;
          
          if (correspondingEmployee) {
            // Nếu user có employee record, lấy thông tin phòng ban và vị trí
            if (correspondingEmployee.department_id && departmentsMap.has(correspondingEmployee.department_id)) {
              const dept = departmentsMap.get(correspondingEmployee.department_id);
              departmentName = dept?.name;
              departmentId = dept?.id || correspondingEmployee.department_id;
            } else if (correspondingEmployee.department_id) {
              departmentId = correspondingEmployee.department_id;
            }
            
            if (correspondingEmployee.position_id && positionsMap.has(correspondingEmployee.position_id)) {
              const pos = positionsMap.get(correspondingEmployee.position_id);
              positionName = pos?.name;
            }
          }
          
          // Nếu user có employee record, lấy thêm thông tin từ employee
          // Nhưng vẫn giữ type là 'user' để phân biệt
          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            user_id: user.id,
            type: 'user' as const,
            role: user.role,
            phone: user.phone || correspondingEmployee?.phone,
            avatar_url: user.avatar_url || correspondingEmployee?.avatar_url,
            // Thêm thông tin từ employee nếu có (phòng ban, vị trí, etc.)
            department: departmentName,
            department_id: departmentId,
            position: positionName,
            employee_code: correspondingEmployee?.employee_code,
            hire_date: correspondingEmployee?.hire_date,
            manager_name: correspondingEmployee?.manager_id && managersMap.has(correspondingEmployee.manager_id) 
              ? (() => {
                  const mgr = managersMap.get(correspondingEmployee.manager_id);
                  return mgr ? `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim() : undefined;
                })()
              : undefined,
            address: correspondingEmployee?.address,
            status: correspondingEmployee?.status
          } as Employee;
        });
      
      const usersWithDept = formattedUsers.filter(u => u.department || u.department_id).length;
      const usersWithPos = formattedUsers.filter(u => u.position).length;
      console.log(`✅ Đã format ${formattedUsers.length} users (sau khi map với employees nếu có)`);
      console.log(`   - Users có phòng ban: ${usersWithDept}/${formattedUsers.length}`);
      console.log(`   - Users có vị trí: ${usersWithPos}/${formattedUsers.length}`);

      // Gộp employees và users, ưu tiên employee nếu trùng email
      const allEmployees = [...formattedEmployees, ...formattedUsers];
      const uniqueEmployeesMap = new Map<string, Employee>();
      
      // Ưu tiên employees trước (có đầy đủ thông tin hơn)
      formattedEmployees.forEach(emp => {
        uniqueEmployeesMap.set(emp.email, emp);
      });
      
      // Thêm users nếu chưa có trong map (không trùng email với employees)
      formattedUsers.forEach(user => {
        if (!uniqueEmployeesMap.has(user.email)) {
          uniqueEmployeesMap.set(user.email, user);
        }
      });
      
      const uniqueEmployees = Array.from(uniqueEmployeesMap.values());

      console.log(`✅ Tổng cộng: ${uniqueEmployees.length} nhân viên/users (sau khi loại bỏ trùng lặp)`);
      console.log(`📊 Thống kê:`);
      console.log(`   - Nhân viên có phòng ban: ${uniqueEmployees.filter(e => e.type === 'employee' && ((e as Employee).department_id || (e as Employee).department)).length}`);
      console.log(`   - Nhân viên không có phòng ban: ${uniqueEmployees.filter(e => e.type === 'employee' && !(e as Employee).department_id && !(e as Employee).department).length}`);
      console.log(`   - Nhân viên có vị trí: ${uniqueEmployees.filter(e => e.type === 'employee' && (e as Employee).position).length}`);
      console.log(`   - Nhân viên có quản lý: ${uniqueEmployees.filter(e => e.type === 'employee' && (e as Employee).manager_name).length}`);

      setEmployees(uniqueEmployees);
    } catch (error) {
      console.error('Error in fetchEmployeesAndUsers:', error);
      alert(error instanceof Error ? error.message : 'Lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.some(e => e.id === employee.id);
      if (isSelected) {
        return prev.filter(e => e.id !== employee.id);
      } else {
        return [...prev, employee];
      }
    });
  };

  const handleEmployeeRoleChange = (employeeId: string, role: string) => {
    setEmployeeRoles(prev => ({
      ...prev,
      [employeeId]: role
    }));
  };

  const uploadAvatarToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${projectId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('minhchung_chiphi')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('minhchung_chiphi')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatarToSupabase(file);
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Lỗi khi upload hình ảnh: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Kiểm tra trùng lặp trước khi thêm
      const { data: existingMembers } = await supabase
        .from('project_team')
        .select('user_id, email, name')
        .eq('project_id', projectId)
        .eq('status', 'active');

      const existingUserIds = new Set((existingMembers || []).map(m => m.user_id).filter(Boolean));
      const existingEmails = new Set((existingMembers || []).map(m => m.email).filter(Boolean));

      // Lọc ra những thành viên đã tồn tại (để hiển thị thông báo)
      const duplicateMembers = selectedEmployees.filter(emp => {
        if (emp.user_id && existingUserIds.has(emp.user_id)) {
          return true;
        }
        if (emp.email && existingEmails.has(emp.email)) {
          return true;
        }
        return false;
      });

      // Chỉ lấy những thành viên chưa tồn tại để thêm
      const membersToAdd = selectedEmployees
        .filter(emp => {
          // Bỏ qua nếu đã tồn tại
          if (emp.user_id && existingUserIds.has(emp.user_id)) {
            return false;
          }
          if (emp.email && existingEmails.has(emp.email)) {
            return false;
          }
          return true;
        })
        .map(employee => ({
          project_id: projectId,
          name: employee.name,
          email: employee.email,
          role: employeeRoles[employee.id] || 'Chưa phân công',
          start_date: startDate,
          user_id: employee.user_id,
          status: 'active',
          phone: employee.phone,
          avatar: employee.avatar_url
        }));

      // Nếu không có thành viên nào để thêm
      if (membersToAdd.length === 0) {
        if (duplicateMembers.length > 0) {
          const duplicateNames = duplicateMembers.map(m => m.name).join(', ');
          alert(`Tất cả thành viên đã có trong dự án:\n${duplicateNames}`);
        } else {
          alert('Không có thành viên nào để thêm.');
        }
        return;
      }

      // Upload avatar nếu có (chỉ upload một lần cho tất cả thành viên)
      let avatarUrl = null;
      if (selectedAvatar) {
        avatarUrl = await handleAvatarUpload(selectedAvatar);
        if (!avatarUrl) {
          alert('Lỗi khi upload hình ảnh. Vui lòng thử lại.');
          return;
        }
        // Áp dụng avatar cho tất cả thành viên
        membersToAdd.forEach(member => {
          member.avatar = avatarUrl;
        });
      }

      // Thêm những thành viên chưa tồn tại
      const { error } = await supabase
        .from('project_team')
        .insert(membersToAdd);

      if (error) throw error;

      const addedCount = membersToAdd.length;
      const skippedCount = duplicateMembers.length;
      
      // Hiển thị thông báo
      if (skippedCount > 0) {
        const duplicateNames = duplicateMembers.map(m => m.name).join(', ');
        alert(`✅ Đã thêm ${addedCount} thành viên thành công.\n\n⚠️ Đã bỏ qua ${skippedCount} thành viên đã có trong dự án:\n${duplicateNames}`);
      } else {
        alert(`✅ Đã thêm ${addedCount} thành viên thành công.`);
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding team members:', error);
      alert('Lỗi khi thêm thành viên: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClose = () => {
    setSelectedEmployees([]);
    setEmployeeRoles({});
    setStartDate(new Date().toISOString().split('T')[0]);
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedAvatar(null);
    onClose();
  };

  const filteredEmployees = employees.filter(emp => {
    // Lọc theo tìm kiếm
    const matchesSearch = (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Lọc theo phòng ban
    let matchesDepartment = true;
    
    if (selectedDepartment === 'all') {
      // Hiển thị tất cả
      matchesDepartment = true;
    } else if (selectedDepartment === 'no-department') {
      // Chỉ hiển thị nhân viên không có phòng ban (chỉ áp dụng cho employee type)
      if (emp.type === 'employee') {
        const empWithDeptId = emp as Employee & { department_id?: string };
        matchesDepartment = !empWithDeptId.department_id && !emp.department;
      } else {
        // Users không có phòng ban, nên hiển thị khi chọn "no-department"
        matchesDepartment = true;
      }
    } else {
      // Chỉ hiển thị nhân viên thuộc phòng ban được chọn
      if (emp.type === 'employee') {
        const empWithDeptId = emp as Employee & { department_id?: string };
        // So sánh department_id với selectedDepartment (là department ID)
        matchesDepartment = empWithDeptId.department_id === selectedDepartment;
      } else {
        // Users không có phòng ban, nên không hiển thị khi chọn một phòng ban cụ thể
        matchesDepartment = false;
      }
    }

    return matchesSearch && matchesDepartment;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center">
            <Plus className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quản lý thành viên dự án</h2>
              <p className="text-sm text-gray-600 mt-1">
                {projectName ? `Dự án: ${projectName}` : 'Thêm thành viên mới và phân công vai trò cho dự án'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-900" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {projectName && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Dự án được chọn</h3>
                  <p className="text-sm text-blue-700 font-medium">{projectName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo phòng ban
              {selectedDepartment !== 'all' && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  ({filteredEmployees.length} nhân viên)
                </span>
              )}
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                // Reset search khi đổi phòng ban để dễ thấy kết quả
                if (e.target.value !== 'all') {
                  setSearchTerm('');
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-black font-medium"
            >
              <option value="all">🔍 Tất cả phòng ban</option>
              {departments.map((dept) => {
                const deptEmployeeCount = employees.filter(emp => {
                  if (emp.type !== 'employee') return false;
                  const empWithDeptId = emp as Employee & { department_id?: string };
                  return empWithDeptId.department_id === dept.id;
                }).length;
                return (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({deptEmployeeCount} nhân viên)
                  </option>
                );
              })}
              <option value="no-department">
                Không có phòng ban ({employees.filter(emp => emp.type === 'employee' && !(emp as Employee).department_id && !(emp as Employee).department).length} nhân viên)
              </option>
            </select>
          </div>

          <div className="relative mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-black placeholder-gray-500"
              />
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chọn thành viên</h3>
                {selectedDepartment !== 'all' && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedDepartment === 'no-department' 
                      ? 'Đang hiển thị nhân viên chưa có phòng ban'
                      : `Đang lọc theo phòng ban: ${departments.find(d => d.id === selectedDepartment)?.name || 'N/A'}`
                    }
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {filteredEmployees.length} thành viên
                {selectedDepartment !== 'all' && employees.length !== filteredEmployees.length && (
                  <span className="text-xs text-gray-400 ml-1">
                    / {employees.length} tổng
                  </span>
                )}
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl divide-y bg-white shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-black">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Đang tải danh sách...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-black">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thành viên nào'}
                  </p>
                  <p className="text-sm mt-1">
                    {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm thành viên vào hệ thống'}
                  </p>
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployees.some(e => e.id === employee.id);
                  return (
                    <div
                      key={employee.id}
                      className={`flex items-start p-4 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {employee.avatar_url ? (
                            <img 
                              src={employee.avatar_url} 
                              alt={employee.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-sm">
                              <span className="text-blue-700 text-lg font-medium">
                                {employee.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-black text-lg">{employee.name}</p>
                              {employee.type === 'employee' && employee.department && (
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                  {employee.department}
                                </span>
                              )}
                            </div>
                            {employee.type === 'employee' && (
                              <p className="text-sm font-medium text-blue-700 mt-1">Mã: {employee.employee_code}</p>
                            )}
                            <p className="text-sm font-medium text-black">{employee.email}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-1.5">
                          {employee.type === 'employee' && (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                {employee.department ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">🏢</span>
                                    <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                      {employee.department}
                                    </span>
                                  </div>
                                ) : employee.department_id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">🏢</span>
                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                      ID: {employee.department_id.substring(0, 8)}...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">🏢</span>
                                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                      Chưa được gán
                                    </span>
                                  </div>
                                )}
                                
                                {employee.position && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">💼</span>
                                    <span className="text-sm font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                                      {employee.position}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {employee.manager_name && (
                                <p className="text-sm text-black">
                                  <span className="font-semibold">👤 Quản lý:</span> {employee.manager_name}
                                </p>
                              )}
                              
                              {employee.phone && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold">📱 SĐT:</span> {employee.phone}
                                </p>
                              )}
                              
                              {employee.address && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold">📍 Địa chỉ:</span> {employee.address}
                                </p>
                              )}
                            </>
                          )}

                          {employee.type === 'user' && employee.role && (
                            <p className="text-sm text-black">
                              <span className="font-semibold">Vai trò hệ thống:</span> {employee.role}
                            </p>
                          )}

                          {employee.phone && employee.type === 'user' && (
                            <p className="text-sm text-black">
                              <span className="font-semibold">📱 SĐT:</span> {employee.phone}
                            </p>
                          )}
                        </div>

                        <div className="mt-3">
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                            employee.type === 'employee' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {employee.type === 'employee' ? '👥 Nhân viên' : '👤 Người dùng'}
                          </span>
                        </div>
                      </div>
                      <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center mt-2">
                        {isSelected && <div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedEmployees.length > 0 && (
            <div className="space-y-4 mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Phân công vai trò</h3>
                <span className="text-sm font-medium text-black">
                  {selectedEmployees.length} thành viên được chọn
                </span>
              </div>
              <div className="space-y-4">
                {selectedEmployees.map((employee) => (
                  <div key={employee.id} className="space-y-2">
                    <label className="text-sm font-medium text-black flex items-center gap-2">
                      {employee.name}
                      {employee.type === 'employee' && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {employee.employee_code}
                        </span>
                      )}
                    </label>
                    <select
                      value={employeeRoles[employee.id] || ''}
                      onChange={(e) => handleEmployeeRoleChange(employee.id, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black font-medium"
                    >
                      <option value="" className="text-black font-medium">Chọn vai trò</option>
                      {ROLES.map((role) => (
                        <option key={role} value={role} className="text-black font-medium">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-lg font-semibold text-black">Ngày bắt đầu</label>
            <p className="text-sm font-medium text-black mb-4">Chọn ngày bắt đầu tham gia dự án</p>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-lg font-semibold text-gray-900">Hình ảnh đại diện</label>
            <p className="text-sm font-medium text-gray-600 mb-4">Upload hình ảnh đại diện cho thành viên (tùy chọn)</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedAvatar(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
                {selectedAvatar ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(selectedAvatar)}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-200"
                    />
                    <p className="text-sm text-blue-600 font-medium">{selectedAvatar.name}</p>
                    <p className="text-xs text-gray-500">Click để thay đổi hình ảnh</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">Click để chọn hình ảnh</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF (tối đa 5MB)</p>
                  </div>
                )}
              </label>
              {uploadingAvatar && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-1">Đang upload...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              {selectedEmployees.length} thành viên được chọn
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedEmployees.length === 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  selectedEmployees.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {projectName ? `Thêm vào ${projectName}` : 'Thêm vào dự án'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

