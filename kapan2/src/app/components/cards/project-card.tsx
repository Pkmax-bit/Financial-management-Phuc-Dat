import { MoreVertical, User, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Project, Status } from '../../types';
import { Progress } from '../ui/progress';
import { motion } from 'motion/react';

interface ProjectCardProps {
  project: Project;
  status: Status;
}

export function ProjectCard({ project, status }: ProjectCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF5752';
      case 'medium':
        return '#FFA900';
      case 'low':
        return '#9ECF00';
      default:
        return '#9CA3AF';
    }
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

  return (
    <motion.div
      className="bg-white rounded border border-[#E1E3E5] mb-2 cursor-pointer transition-all hover:border-[#2066B0] hover:shadow-[0_2px_8px_rgba(32,102,176,0.15)]"
      style={{ 
        borderLeftWidth: '4px', 
        borderLeftColor: status.color,
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '12px',
        marginBottom: '8px',
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      {/* Header - theo FIGMA spec */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-[#2066B0] shrink-0" />
            <h4 
              className="font-semibold text-[#000000] truncate" 
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {project.name}
            </h4>
          </div>
          <div 
            className="text-[#9CA3AF]" 
            style={{ fontSize: '12px' }}
          >
            Mã: {project.code}
          </div>
        </div>
        <button 
          className="text-[#9CA3AF] hover:text-[#535C69] transition-colors ml-2"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Open actions menu
          }}
          aria-label="Menu hành động"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Body - theo FIGMA spec */}
      <div className="space-y-2">
        {/* Khách hàng (link) */}
        <div style={{ fontSize: '13px', color: '#535C69' }}>
          <span style={{ color: '#9CA3AF' }}>Khách hàng:</span>{' '}
          <span 
            className="hover:underline cursor-pointer"
            style={{ color: '#2066B0' }}
          >
            {project.customerName}
          </span>
        </div>

        {/* Người quản lý (avatar nhỏ + tên) */}
        <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#535C69' }}>
          <div
            className="rounded-full bg-[#2066B0] flex items-center justify-center text-white font-semibold shrink-0"
            style={{
              width: '16px',
              height: '16px',
              fontSize: '8px',
            }}
            title={project.managerName}
          >
            {getInitials(project.managerName)}
          </div>
          <span className="truncate">{project.managerName}</span>
        </div>

        {/* Ngân sách - theo FIGMA spec */}
        <div 
          className="flex items-center gap-2 font-semibold text-[#000000]" 
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          <DollarSign size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{formatCurrency(project.budget)}</span>
        </div>

        {/* Tiến độ (progress bar) - theo FIGMA spec */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#9CA3AF]">Tiến độ</span>
            <span className="text-xs font-semibold text-[#535C69]">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      </div>

      {/* Footer - theo FIGMA spec: Ngày bắt đầu/kết thúc, User avatar */}
      <div 
        className="flex items-center justify-between mt-3 pt-2 border-t"
        style={{ borderTopColor: '#F5F7F8', paddingTop: '8px' }}
      >
        <div 
          className="flex items-center gap-1 text-[#9CA3AF]" 
          style={{ fontSize: '11px' }}
        >
          <Calendar size={12} />
          <span>
            {new Date(project.startDate).toLocaleDateString('vi-VN')} -{' '}
            {new Date(project.endDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
        {/* User avatar - 20px theo FIGMA spec */}
        <div
          className="rounded-full bg-[#2066B0] flex items-center justify-center text-white font-semibold"
          style={{ 
            width: '20px', 
            height: '20px',
            fontSize: '10px',
          }}
          title={project.managerName}
        >
          {getInitials(project.managerName)}
        </div>
      </div>
    </motion.div>
  );
}