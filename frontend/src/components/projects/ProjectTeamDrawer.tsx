import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string;
  name: string;
  email: string;
  user_id?: string;
}

interface ProjectTeamDrawerProps {
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

export const ProjectTeamDrawer: React.FC<ProjectTeamDrawerProps> = ({
  open,
  onClose,
  projectId,
  onSuccess
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<{[key: string]: string}>({});
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // First, fetch team members from project_team for this project
        const { data: teamMembersData, error: teamError } = await supabase
          .from('project_team')
          .select('user_id, email')
          .eq('project_id', projectId)
          .eq('status', 'active');

        if (teamError) {
          console.error('Error fetching team members:', teamError);
          return;
        }

        // Extract user_ids and emails from team members
        const teamUserIds = new Set((teamMembersData || []).map((tm: any) => tm.user_id).filter(Boolean));
        const teamEmails = new Set((teamMembersData || []).map((tm: any) => tm.email).filter(Boolean));

        // If no team members, return empty array
        if (teamUserIds.size === 0 && teamEmails.size === 0) {
          setEmployees([]);
          return;
        }

        // Fetch both employees and users
        const [employeesRes, usersRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/users')
        ]);
        
        // Combine and format the data, but filter to only include team members
        const combinedEmployees = [
          ...employeesRes.data
            .filter((emp: any) => {
              // Include if user_id matches or email matches
              return (emp.user_id && teamUserIds.has(emp.user_id)) || 
                     (emp.email && teamEmails.has(emp.email));
            })
            .map((emp: any) => ({
              id: emp.id,
              name: emp.name || `${emp.first_name} ${emp.last_name}`,
              email: emp.email,
              user_id: emp.user_id
            })),
          ...usersRes.data
            .filter((user: any) => {
              // Include if id matches or email matches
              return (user.id && teamUserIds.has(user.id)) || 
                     (user.email && teamEmails.has(user.email));
            })
            .map((user: any) => ({
              id: user.id,
              name: user.name || user.full_name,
              email: user.email,
              user_id: user.id
            }))
        ];

        // Remove duplicates based on email
        const uniqueEmployees = Array.from(
          new Map(combinedEmployees.map(item => [item.email, item])).values()
        );

        setEmployees(uniqueEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open, projectId]);

  const handleEmployeeRoleChange = (employeeId: string, role: string) => {
    setEmployeeRoles(prev => ({
      ...prev,
      [employeeId]: role
    }));
  };

  const handleSubmit = async () => {
    try {
      // Kiểm tra trùng lặp trước khi thêm
      const { data: existingMembers } = await supabase
        .from('project_team')
        .select('user_id, email, name')
        .eq('project_id', projectId)
        .eq('status', 'active');

      const existingUserIds = new Set((existingMembers || []).map((m: any) => m.user_id).filter(Boolean));
      const existingEmails = new Set((existingMembers || []).map((m: any) => m.email).filter(Boolean));

      // Lọc ra những thành viên chưa tồn tại
      const membersToAdd = selectedEmployees.filter(emp => {
        if (emp.user_id && existingUserIds.has(emp.user_id)) {
          return false;
        }
        if (emp.email && existingEmails.has(emp.email)) {
          return false;
        }
        return true;
      });

      // Lấy danh sách thành viên đã tồn tại (để hiển thị thông báo)
      const duplicateMembers = selectedEmployees.filter(emp => {
        if (emp.user_id && existingUserIds.has(emp.user_id)) {
          return true;
        }
        if (emp.email && existingEmails.has(emp.email)) {
          return true;
        }
        return false;
      });

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

      // Thêm những thành viên chưa tồn tại
      const results = await Promise.allSettled(
        membersToAdd.map(employee => 
          axios.post('/api/project-team', {
            project_id: projectId,
            name: employee.name,
            email: employee.email,
            role: employeeRoles[employee.id] || 'Chưa phân công',
            start_date: startDate?.toISOString().split('T')[0],
            user_id: employee.user_id,
            status: 'active'
          })
        )
      );

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      const addedCount = succeeded.length;
      const skippedCount = duplicateMembers.length;
      const errorCount = failed.length;

      // Hiển thị thông báo
      let message = '';
      if (addedCount > 0) {
        message += `✅ Đã thêm ${addedCount} thành viên thành công.`;
      }
      if (skippedCount > 0) {
        const duplicateNames = duplicateMembers.map(m => m.name).join(', ');
        message += `\n\n⚠️ Đã bỏ qua ${skippedCount} thành viên đã có trong dự án:\n${duplicateNames}`;
      }
      if (errorCount > 0) {
        const errorMessages = failed.map((f, idx) => {
          if (f.status === 'rejected') {
            const employee = membersToAdd[idx];
            const errorMsg = f.reason?.response?.data?.detail || f.reason?.message || 'Lỗi không xác định';
            return `${employee.name}: ${errorMsg}`;
          }
          return '';
        }).filter(Boolean);
        message += `\n\n❌ Có ${errorCount} lỗi xảy ra:\n${errorMessages.join('\n')}`;
      }

      if (message) {
        alert(message);
      }

      if (addedCount > 0) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Lỗi khi thêm thành viên: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClose = () => {
    setSelectedEmployees([]);
    setEmployeeRoles({});
    setStartDate(new Date());
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: '400px',
          bgcolor: 'background.paper',
          p: 3
        }
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Thêm thành viên dự án
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Autocomplete
          multiple
          options={employees}
          getOptionLabel={(option) => `${option.name} (${option.email})`}
          value={selectedEmployees}
          onChange={(_, newValue) => {
            setSelectedEmployees(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Chọn thành viên"
              placeholder="Tìm kiếm theo tên hoặc email"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
                key={option.id}
              />
            ))
          }
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Phân công vai trò
        </Typography>
        <Stack spacing={2}>
          {selectedEmployees.map((employee) => (
            <FormControl key={employee.id} fullWidth size="small">
              <InputLabel>{employee.name}</InputLabel>
              <Select
                value={employeeRoles[employee.id] || ''}
                label={employee.name}
                onChange={(e) => handleEmployeeRoleChange(employee.id, e.target.value)}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 3 }}>
        <DatePicker
          label="Ngày bắt đầu"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{
            textField: { fullWidth: true, size: 'small' }
          }}
        />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedEmployees.length === 0}
        >
          Thêm vào dự án
        </Button>
      </Box>
    </Drawer>
  );
};
