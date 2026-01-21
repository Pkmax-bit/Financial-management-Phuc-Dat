import { useState, useEffect } from 'react';
import { ModuleHeader } from '../components/module-header';
import { KanbanBoard } from '../components/kanban-board';
import { ListView } from '../components/list-view';
import { ProjectCard } from '../components/cards/project-card';
import { StatusManagementModal } from '../components/status-management-modal';
import { ViewType, Status, Project } from '../types';
import { projectStatuses as initialStatuses, mockProjects } from '../data/mock-data';
import { Progress } from '../components/ui/progress';

// API client helper
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiGet(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export function ProjectsModule() {
  const [view, setView] = useState<ViewType>('kanban');
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isManagingStatuses, setIsManagingStatuses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; project_ids?: string[] }>>([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects từ API và lọc theo nhân viên trong đội ngũ
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch team members sau khi projects đã được load
  useEffect(() => {
    if (projects.length > 0) {
      fetchTeamMembers();
    }
  }, [projects]);

  // Filter projects khi có thay đổi
  useEffect(() => {
    filterProjects();
  }, [projects, selectedTeamMemberId, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects từ API - API sẽ tự động lọc chỉ trả về projects mà user đăng nhập là thành viên
      // (trừ admin/accountant xem tất cả)
      const projectsData = await apiGet('/api/projects');
      
      // Map dữ liệu từ API sang format của Project type
      const mappedProjects: Project[] = (projectsData || []).map((p: any) => ({
        id: p.id,
        code: p.project_code || '',
        name: p.name || '',
        customerId: p.customer_id || '',
        customerName: p.customer_name || p.customers?.name || '',
        managerId: p.manager_id || '',
        managerName: p.manager_name || (p.employees ? `${p.employees.first_name || ''} ${p.employees.last_name || ''}`.trim() : ''),
        budget: p.budget || 0,
        progress: p.progress || 0,
        statusId: p.status_id || p.status || '',
        priority: (p.priority || 'medium') as 'low' | 'medium' | 'high',
        startDate: p.start_date || p.created_at || '',
        endDate: p.end_date || '',
        createdAt: p.created_at || '',
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Fallback to mock data nếu API fail
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Lấy project_ids từ projects đã fetch (đã được filter theo user đăng nhập ở backend)
      const projectIds = projects.map(p => p.id);
      
      if (projectIds.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Fetch team members từ project_team của các projects này
      // Gọi API để lấy team members - tạm thời dùng logic đơn giản
      // Lấy unique team members từ các projects
      const teamMembersMap = new Map<string, { id: string; name: string; project_ids: string[] }>();
      
      // Fetch team data từ từng project
      for (const projectId of projectIds) {
        try {
          const teamData = await apiGet(`/api/projects/${projectId}/team`);
          const members = teamData?.team_members || teamData || [];
          
          members.forEach((member: any) => {
            const memberId = member.employee_id || member.user_id || member.id;
            const memberName = member.employee_name || member.name || member.full_name || member.email || 'Không có tên';
            
            if (memberId) {
              if (!teamMembersMap.has(memberId)) {
                teamMembersMap.set(memberId, {
                  id: memberId,
                  name: memberName,
                  project_ids: []
                });
              }
              teamMembersMap.get(memberId)!.project_ids.push(projectId);
            }
          });
        } catch (error) {
          console.error(`Error fetching team for project ${projectId}:`, error);
        }
      }

      // Convert map to array
      const uniqueMembers = Array.from(teamMembersMap.values()).map(m => ({
        id: m.id,
        name: m.name,
        project_ids: m.project_ids
      }));

      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.customerName?.toLowerCase().includes(query) ||
          p.managerName?.toLowerCase().includes(query)
      );
    }

    // Filter by team member - chỉ hiển thị projects mà team member đó có trong đội ngũ
    if (selectedTeamMemberId !== 'all') {
      const selectedMember = teamMembers.find(m => m.id === selectedTeamMemberId);
      if (selectedMember && (selectedMember as any).project_ids) {
        const memberProjectIds = (selectedMember as any).project_ids;
        filtered = filtered.filter(p => memberProjectIds.includes(p.id));
      } else {
        // Nếu không tìm thấy member hoặc không có project_ids, không hiển thị gì
        filtered = [];
      }
    }

    setFilteredProjects(filtered);
  };

  const handleStatusChange = async (projectId: string, newStatusId: string) => {
    try {
      // Update status via API
      await fetch(`${API_BASE_URL}/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status_id: newStatusId }),
      });

      // Update local state
      setProjects(
        projects.map((project) =>
          project.id === projectId
            ? { ...project, statusId: newStatusId }
            : project
        )
      );
      setFilteredProjects(
        filteredProjects.map((project) =>
          project.id === projectId
            ? { ...project, statusId: newStatusId }
            : project
        )
      );
    } catch (error) {
      console.error('Error updating project status:', error);
      // Fallback: update local state anyway
      setProjects(
        projects.map((project) =>
          project.id === projectId
            ? { ...project, statusId: newStatusId }
            : project
        )
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  const listViewColumns = [
    {
      key: 'name',
      label: 'Dự án',
      sortable: true,
      render: (project: Project) => (
        <div>
          <div className="font-semibold text-[#000000]">{project.name}</div>
          <div className="text-xs text-[#9CA3AF]">{project.code}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
    },
    {
      key: 'managerName',
      label: 'Quản lý',
      sortable: true,
    },
    {
      key: 'startDate',
      label: 'Ngày bắt đầu - Kết thúc',
      sortable: true,
      render: (project: Project) => (
        <div className="text-[13px]">
          {new Date(project.startDate).toLocaleDateString('vi-VN')} -{' '}
          {new Date(project.endDate).toLocaleDateString('vi-VN')}
        </div>
      ),
    },
    {
      key: 'budget',
      label: 'Ngân sách',
      sortable: true,
      render: (project: Project) => (
        <span className="font-semibold">{formatCurrency(project.budget)}</span>
      ),
    },
    {
      key: 'progress',
      label: 'Tiến độ',
      sortable: true,
      render: (project: Project) => (
        <div className="w-32">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      ),
    },
    {
      key: 'statusId',
      label: 'Trạng thái',
      sortable: true,
      render: (project: Project) => {
        const status = statuses.find((s) => s.id === project.statusId);
        return status ? (
          <span
            className="px-2 py-1 rounded text-xs text-white font-semibold"
            style={{ backgroundColor: status.color }}
          >
            {status.name}
          </span>
        ) : null;
      },
    },
    {
      key: 'priority',
      label: 'Ưu tiên',
      sortable: true,
      render: (project: Project) => getPriorityLabel(project.priority),
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F5F7F8]">
      <ModuleHeader
        title="Dự án"
        view={view}
        onViewChange={setView}
        onManageStatuses={() => setIsManagingStatuses(true)}
        onAddNew={() => alert('Thêm dự án mới')}
        teamMembers={teamMembers}
        selectedTeamMemberId={selectedTeamMemberId}
        onTeamMemberFilterChange={setSelectedTeamMemberId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2066B0] mx-auto mb-4"></div>
              <p className="text-[#535C69]">Đang tải dự án...</p>
            </div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            statuses={statuses}
            items={filteredProjects}
            renderCard={(project, status) => (
              <ProjectCard project={project} status={status} />
            )}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="px-6">
            <ListView columns={listViewColumns} items={filteredProjects} />
          </div>
        )}
      </div>

      <StatusManagementModal
        open={isManagingStatuses}
        onClose={() => setIsManagingStatuses(false)}
        statuses={statuses}
        onSave={setStatuses}
      />
    </div>
  );
}
