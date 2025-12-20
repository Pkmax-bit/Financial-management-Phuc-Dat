import { useState } from 'react';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: any) => React.ReactNode;
}

interface ListViewProps {
  columns: Column[];
  items: any[];
  onRowClick?: (item: any) => void;
}

export function ListView({ columns, items, onRowClick }: ListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="bg-white border border-[#E1E3E5] rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-[#F5F7F8] sticky top-0 z-10">
            <tr className="border-b-2 border-[#E1E3E5]">
              <th 
                className="w-12 px-4 text-left"
                style={{ height: '40px', padding: '12px 16px' }}
              >
                <Checkbox
                  checked={selectedIds.length === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 text-left"
                  style={{
                    height: '40px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#535C69',
                  }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-[#2066B0] transition-colors"
                    >
                      {column.label}
                      <ArrowUpDown size={14} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th 
                className="w-12 px-4"
                style={{ height: '40px', padding: '12px 16px' }}
              ></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {sortedItems.map((item, index) => (
              <tr
                key={item.id}
                className="border-b hover:bg-[#E8F4FD] transition-colors cursor-pointer"
                style={{
                  borderBottomColor: '#F5F7F8',
                  height: '48px',
                }}
                onClick={() => onRowClick?.(item)}
              >
                <td 
                  className="px-4" 
                  style={{ padding: '12px 16px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(item.id, checked as boolean)
                    }
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4"
                    style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#535C69',
                    }}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                <td 
                  className="px-4" 
                  style={{ padding: '12px 16px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    className="text-[#9CA3AF] hover:text-[#535C69] transition-colors"
                    aria-label="Menu hành động"
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div 
          className="flex items-center justify-between px-4 py-3 border-t bg-white"
          style={{
            borderTopColor: '#E1E3E5',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Hiển thị {items.length} kết quả
          </div>
          <div className="flex gap-1">
            <button 
              className="px-3 py-1 border rounded hover:bg-[#F5F7F8] transition-colors"
              style={{
                fontSize: '13px',
                borderColor: '#E1E3E5',
                borderRadius: '2px',
              }}
            >
              Trước
            </button>
            <button 
              className="px-3 py-1 text-white border rounded"
              style={{
                fontSize: '13px',
                backgroundColor: '#2066B0',
                borderColor: '#2066B0',
                borderRadius: '2px',
              }}
            >
              1
            </button>
            <button 
              className="px-3 py-1 border rounded hover:bg-[#F5F7F8] transition-colors"
              style={{
                fontSize: '13px',
                borderColor: '#E1E3E5',
                borderRadius: '2px',
              }}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
