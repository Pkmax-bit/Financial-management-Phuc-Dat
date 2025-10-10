import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Search } from 'lucide-react';
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
  onSuccess: () => void;
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
  onSuccess
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<{[key: string]: string}>({});
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'employee' | 'user'>('all');

  useEffect(() => {
    if (open) {
      fetchEmployeesAndUsers();
    }
  }, [open]);

  const fetchEmployeesAndUsers = async () => {
    try {
      setLoading(true);

      // Fetch employees with their department, position and manager
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

      // Fetch users
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

      // Format employee data
      const formattedEmployees = (employeesData || []).map(emp => ({
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

      // Format user data
      const formattedUsers = (usersData || []).map(user => ({
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

  const handleSubmit = async () => {
    try {
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
            avatar: employee.avatar_url
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
    <div 
      className={`fixed top-0 right-0 h-full w-[600px] bg-gradient-to-br from-white to-blue-50/30 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        zIndex: 40,
        marginLeft: 'auto'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <div>
            <h2 className="text-2xl font-semibold text-white">Thêm thành viên dự án</h2>
            <p className="text-blue-100 mt-1 text-sm">Chọn thành viên và phân công vai trò</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Filter Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">Lọc theo loại</label>
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
            <label className="block text-sm font-medium text-black mb-2">Tìm kiếm</label>
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
              <h3 className="text-lg font-semibold text-black">Chọn thành viên</h3>
              <span className="text-sm font-medium text-black">
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
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-black">
              {selectedEmployees.length} thành viên được chọn
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedEmployees.length === 0}
                className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow transition-all ${
                  selectedEmployees.length === 0
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Thêm vào dự án
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTeamDialog;