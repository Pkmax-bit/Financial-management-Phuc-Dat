import { Plus, Filter, Search, Settings } from 'lucide-react';
import { ViewToggle } from './view-toggle';
import { ViewType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ModuleHeaderProps {
  title: string;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onManageStatuses: () => void;
  onAddNew?: () => void;
}

export function ModuleHeader({
  title,
  view,
  onViewChange,
  onManageStatuses,
  onAddNew,
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
          {/* Filter */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[#D5D7DB] text-[#535C69] hover:bg-[#F5F7F8]"
            style={{ height: '32px' }}
          >
            <Filter size={16} />
          </Button>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
            <Input
              placeholder="Tìm kiếm..."
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
