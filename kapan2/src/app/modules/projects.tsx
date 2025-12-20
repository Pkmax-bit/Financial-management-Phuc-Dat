import { useState } from 'react';
import { ModuleHeader } from '../components/module-header';
import { KanbanBoard } from '../components/kanban-board';
import { ListView } from '../components/list-view';
import { ProjectCard } from '../components/cards/project-card';
import { StatusManagementModal } from '../components/status-management-modal';
import { ViewType, Status, Project } from '../types';
import { projectStatuses as initialStatuses, mockProjects } from '../data/mock-data';
import { Progress } from '../components/ui/progress';

export function ProjectsModule() {
  const [view, setView] = useState<ViewType>('kanban');
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isManagingStatuses, setIsManagingStatuses] = useState(false);

  const handleStatusChange = (projectId: string, newStatusId: string) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId
          ? { ...project, statusId: newStatusId }
          : project
      )
    );
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
      />

      <div className="flex-1 overflow-auto py-4">
        {view === 'kanban' ? (
          <KanbanBoard
            statuses={statuses}
            items={projects}
            renderCard={(project, status) => (
              <ProjectCard project={project} status={status} />
            )}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="px-6">
            <ListView columns={listViewColumns} items={projects} />
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
