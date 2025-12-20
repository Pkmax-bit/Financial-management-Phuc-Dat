import { Columns3, List } from 'lucide-react';
import { ViewType } from '../types';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border border-[#D5D7DB] rounded-[2px] overflow-hidden" role="group">
      <button
        onClick={() => onViewChange('kanban')}
        className={`
          h-8 w-10 flex items-center justify-center transition-all duration-200
          ${view === 'kanban' 
            ? 'bg-[#E8F4FD] border-r border-[#2066B0]' 
            : 'bg-white border-r border-[#D5D7DB] hover:bg-[#F5F7F8]'
          }
        `}
        style={{
          borderRadius: view === 'kanban' ? '2px 0 0 2px' : '0',
        }}
        aria-label="Chuyển sang xem Kanban"
        aria-pressed={view === 'kanban'}
      >
        <Columns3 
          size={16} 
          className={view === 'kanban' ? 'text-[#2066B0]' : 'text-[#535C69]'}
          style={{ fontWeight: view === 'kanban' ? 600 : 400 }}
        />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`
          h-8 w-10 flex items-center justify-center transition-all duration-200
          ${view === 'list' 
            ? 'bg-[#E8F4FD]' 
            : 'bg-white hover:bg-[#F5F7F8]'
          }
        `}
        style={{
          borderRadius: view === 'list' ? '0 2px 2px 0' : '0',
        }}
        aria-label="Chuyển sang xem danh sách"
        aria-pressed={view === 'list'}
      >
        <List 
          size={16} 
          className={view === 'list' ? 'text-[#2066B0]' : 'text-[#535C69]'}
          style={{ fontWeight: view === 'list' ? 600 : 400 }}
        />
      </button>
    </div>
  );
}
