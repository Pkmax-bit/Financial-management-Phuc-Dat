import { Plus, Filter, Search, Settings } from 'lucide-react';
import { ViewToggle } from './view-toggle';
import { ViewType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ModuleHeaderProps {
  title: string;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onManageStatuses: () => void;
  onAddNew?: () => void;
  teamMembers?: Array<{ id: string; name: string; project_ids?: string[] }>;
  selectedTeamMemberId?: string;
  onTeamMemberFilterChange?: (memberId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ModuleHeader({
  title,
  view,
  onViewChange,
  onManageStatuses,
  onAddNew,
  teamMembers = [],
  selectedTeamMemberId = 'all',
  onTeamMemberFilterChange,
  searchQuery = '',
  onSearchChange,
}: ModuleHeaderProps) {
  return (
    <div className="bg-white border-b border-[#E1E3E5] px-6 py-4" style={{ background: '#FFFFFF' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 
            className="font-semibold text-[#000000]"
            style={{ fontSize: '18px', fontWeight: 600 }}
          >
            {title}
          </h1>
          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Team Member - CHỈ hiển thị cho module projects */}
          {title === 'Dự án' && teamMembers.length > 0 && onTeamMemberFilterChange && (
            <Select
              value={selectedTeamMemberId}
              onValueChange={onTeamMemberFilterChange}
            >
              <SelectTrigger
                className="h-8 w-[200px] text-sm border-[#D5D7DB] text-[#535C69]"
                style={{ 
                  height: '32px',
                  fontSize: '13px',
                  borderRadius: '2px',
                  border: '1px solid #D5D7DB',
                }}
              >
                <SelectValue placeholder="Lọc theo nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 w-[250px] h-8 text-sm border-[#D5D7DB]"
              style={{ 
                width: '250px',
                height: '32px',
                fontSize: '13px',
                borderRadius: '2px',
                border: '1px solid #D5D7DB',
              }}
            />
          </div>

          {/* Manage Statuses */}
          <Button
            variant="outline"
            size="sm"
            onClick={onManageStatuses}
            className="h-8 border-[#D5D7DB] text-[#535C69] hover:bg-[#F5F7F8]"
            style={{ height: '32px' }}
          >
            <Settings size={16} className="mr-1" />
            Quản lý trạng thái
          </Button>

          {/* Add New */}
          {onAddNew && (
            <Button
              size="sm"
              onClick={onAddNew}
              className="h-8 bg-[#2066B0] hover:bg-[#1a4d8a] text-white"
              style={{ 
                height: '32px',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '2px',
              }}
            >
              <Plus size={16} className="mr-1" />
              Thêm mới
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
