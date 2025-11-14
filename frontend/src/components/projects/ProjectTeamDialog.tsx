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
  const [selectedType, setSelectedType] = useState<'all' | 'employee' | 'user'>('all');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      fetchEmployeesAndUsers();
      // Auto-select current user if available
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

  const fetchEmployeesAndUsers = async () => {
    try {
      setLoading(true);

      // First, fetch team members from project_team for this project to filter out existing members
      const { data: teamMembersData, error: teamError } = await supabase
        .from('project_team')
        .select('user_id, email')
        .eq('project_id', projectId)
        .eq('status', 'active');

      if (teamError) {
        console.error('Error fetching team members:', teamError);
        // Continue anyway - we'll show all employees
      }

      // Extract user_ids and emails from existing team members (to exclude them)
      const existingTeamUserIds = new Set((teamMembersData || []).map(tm => tm.user_id).filter(Boolean));
      const existingTeamEmails = new Set((teamMembersData || []).map(tm => tm.email).filter(Boolean));

      // Fetch ALL employees with their department, position and manager
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
          departments:department_id (name),
          positions:position_id (name),
          hire_date,
          status,
          avatar_url,
          address,
          managers:manager_id (first_name, last_name)
        `)
        .eq('status', 'active');

      if (employeesError) throw new Error(`Error fetching employees: ${employeesError.message}`);

      // Fetch ALL users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          avatar_url,
          phone,
          is_active
        `)
        .eq('is_active', true);

      if (usersError) throw new Error(`Error fetching users: ${usersError.message}`);

      // Format employee data - exclude those already in team
      const formattedEmployees = (employeesData || [])
        .filter(emp => {
          // Exclude if already in team (by user_id or email)
          return !((emp.user_id && existingTeamUserIds.has(emp.user_id)) || 
                   (emp.email && existingTeamEmails.has(emp.email)));
        })
        .map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          email: emp.email,
          user_id: emp.user_id,
          type: 'employee' as const,
          department: emp.departments?.name,
          position: emp.positions?.name,
          phone: emp.phone,
          avatar_url: emp.avatar_url,
          employee_code: emp.employee_code,
          hire_date: emp.hire_date,
          manager_name: emp.managers ? `${emp.managers.first_name} ${emp.managers.last_name}` : undefined,
          address: emp.address,
          status: emp.status
        }));

      // Format user data - exclude those already in team
      const formattedUsers = (usersData || [])
        .filter(user => {
          // Exclude if already in team (by id or email)
          return !((user.id && existingTeamUserIds.has(user.id)) || 
                   (user.email && existingTeamEmails.has(user.email)));
        })
        .map(user => ({
          id: user.id,
          name: user.full_name,
          email: user.email,
          user_id: user.id,
          type: 'user' as const,
          role: user.role,
          phone: user.phone,
          avatar_url: user.avatar_url
        }));

      // Combine all data
      const allEmployees = [...formattedEmployees, ...formattedUsers];
      
      // Remove duplicates based on email
      const uniqueEmployees = Array.from(
        new Map(allEmployees.map(item => [item.email, item])).values()
      );

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
      // Upload avatar if selected
      let avatarUrl = null;
      if (selectedAvatar) {
        avatarUrl = await handleAvatarUpload(selectedAvatar);
        if (!avatarUrl) {
          alert('Lỗi khi upload hình ảnh. Vui lòng thử lại.');
          return;
        }
      }

      const { error } = await supabase
        .from('project_team')
        .insert(
          selectedEmployees.map(employee => ({
            project_id: projectId,
            name: employee.name,
            email: employee.email,
            role: employeeRoles[employee.id] || 'Chưa phân công',
            start_date: startDate,
            user_id: employee.user_id,
            status: 'active',
            phone: employee.phone,
            avatar: avatarUrl || employee.avatar_url
          }))
        );

      if (error) throw error;

      alert('Thêm thành viên thành công');
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
    setSelectedType('all');
    setSelectedAvatar(null);
    onClose();
  };

  const filteredEmployees = employees.filter(emp => {
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

    const matchesType = selectedType === 'all' || emp.type === selectedType;

    return matchesSearch && matchesType;
  });

  if (!open) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-900">
          {/* Project Info */}
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

          {/* Filter Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo loại</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'employee' | 'user')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-black font-medium"
            >
              <option value="all">🔍 Tất cả</option>
              <option value="employee">👥 Nhân viên</option>
              <option value="user">👤 Người dùng</option>
            </select>
          </div>

          {/* Search */}
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

          {/* Employee List */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Chọn thành viên</h3>
              <span className="text-sm font-medium text-gray-600">
                {filteredEmployees.length} thành viên
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
                          <div>
                            <p className="font-medium text-black text-lg">{employee.name}</p>
                            {employee.type === 'employee' && (
                              <p className="text-sm font-medium text-blue-700">Mã: {employee.employee_code}</p>
                            )}
                            <p className="text-sm font-medium text-black">{employee.email}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-1">
                          {employee.type === 'employee' && (
                            <>
                              {(employee.department || employee.position) && (
                                <p className="text-sm text-black">
                                  <span className="font-semibold">Vị trí:</span> {[employee.department, employee.position].filter(Boolean).join(' - ')}
                                </p>
                              )}
                              {employee.manager_name && (
                                <p className="text-sm text-black">
                                  <span className="font-semibold">Quản lý:</span> {employee.manager_name}
                                </p>
                              )}
                              {employee.hire_date && (
                                <p className="text-sm text-black">
                                  <span className="font-semibold">Ngày vào:</span> {new Date(employee.hire_date).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </>
                          )}

                          {employee.type === 'user' && employee.role && (
                            <p className="text-sm text-black">
                              <span className="font-semibold">Vai trò:</span> {employee.role}
                            </p>
                          )}

                          {employee.phone && (
                            <p className="text-sm text-black">
                              <span className="font-semibold">SĐT:</span> {employee.phone}
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

          {/* Selected Employees */}
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

          {/* Start Date */}
          <div className="space-y-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-lg font-semibold text-black">
              Ngày bắt đầu
            </label>
            <p className="text-sm font-medium text-black mb-4">
              Chọn ngày bắt đầu tham gia dự án
            </p>
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

          {/* Avatar Upload */}
          <div className="space-y-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-lg font-semibold text-gray-900">
              Hình ảnh đại diện
            </label>
            <p className="text-sm font-medium text-gray-600 mb-4">
              Upload hình ảnh đại diện cho thành viên (tùy chọn)
            </p>
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
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {selectedAvatar ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(selectedAvatar)}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-200"
                    />
                    <p className="text-sm text-blue-600 font-medium">
                      {selectedAvatar.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click để thay đổi hình ảnh
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Click để chọn hình ảnh
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF (tối đa 5MB)
                    </p>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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

export default ProjectTeamDialog;