import { useState } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Status } from '../types';

interface StatusManagementModalProps {
  open: boolean;
  onClose: () => void;
  statuses: Status[];
  onSave: (statuses: Status[]) => void;
}

const colorOptions = [
  { name: 'Xanh nhạt', value: '#2FC6F6' },
  { name: 'Xanh đậm', value: '#2066B0' },
  { name: 'Xanh lá', value: '#9ECF00' },
  { name: 'Vàng', value: '#FFA900' },
  { name: 'Đỏ', value: '#FF5752' },
  { name: 'Tím', value: '#A855F7' },
  { name: 'Xám', value: '#9CA3AF' },
  { name: 'Xám đậm', value: '#6B7280' },
];

export function StatusManagementModal({
  open,
  onClose,
  statuses: initialStatuses,
  onSave,
}: StatusManagementModalProps) {
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#2FC6F6',
  });

  const handleAddStatus = () => {
    if (!newStatus.name.trim()) return;

    const status: Status = {
      id: Date.now().toString(),
      name: newStatus.name,
      color: newStatus.color,
      order: statuses.length + 1,
    };

    setStatuses([...statuses, status]);
    setNewStatus({ name: '', color: '#2FC6F6' });
    setIsAdding(false);
  };

  const handleEditStatus = (id: string) => {
    setEditingId(id);
  };

  const handleUpdateStatus = (id: string, updates: Partial<Status>) => {
    setStatuses(
      statuses.map((status) =>
        status.id === id ? { ...status, ...updates } : status
      )
    );
    setEditingId(null);
  };

  const handleDeleteStatus = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa trạng thái này?')) {
      setStatuses(statuses.filter((status) => status.id !== id));
    }
  };

  const handleSave = () => {
    onSave(statuses);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Quản lý trạng thái</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="bg-white border border-[#E1E3E5] rounded p-3 flex items-center gap-3"
              style={{ borderLeftWidth: '4px', borderLeftColor: status.color }}
            >
              <GripVertical size={16} className="text-[#9CA3AF] cursor-move" />

              {editingId === status.id ? (
                <>
                  <div className="flex-1 flex gap-3">
                    <Input
                      value={status.name}
                      onChange={(e) =>
                        handleUpdateStatus(status.id, { name: e.target.value })
                      }
                      className="flex-1"
                      placeholder="Tên trạng thái"
                    />
                    <select
                      value={status.color}
                      onChange={(e) =>
                        handleUpdateStatus(status.id, { color: e.target.value })
                      }
                      className="px-3 py-2 border border-[#E1E3E5] rounded text-sm"
                    >
                      {colorOptions.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setEditingId(null)}
                    className="bg-[#2066B0] hover:bg-[#1a4d8a]"
                  >
                    Lưu
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="flex-1 text-sm font-semibold text-[#535C69]">
                    {status.name}
                  </span>
                  <button
                    onClick={() => handleEditStatus(status.id)}
                    className="text-[#9CA3AF] hover:text-[#2066B0] transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-[#9CA3AF] hover:text-[#FF5752] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}

          {isAdding ? (
            <div className="bg-[#F5F7F8] border border-[#E1E3E5] rounded p-3">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="statusName" className="text-sm">
                    Tên trạng thái
                  </Label>
                  <Input
                    id="statusName"
                    value={newStatus.name}
                    onChange={(e) =>
                      setNewStatus({ ...newStatus, name: e.target.value })
                    }
                    placeholder="Nhập tên trạng thái"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="statusColor" className="text-sm">
                    Màu sắc
                  </Label>
                  <select
                    id="statusColor"
                    value={newStatus.color}
                    onChange={(e) =>
                      setNewStatus({ ...newStatus, color: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[#E1E3E5] rounded text-sm"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddStatus}
                    className="bg-[#2066B0] hover:bg-[#1a4d8a]"
                  >
                    Thêm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewStatus({ name: '', color: '#2FC6F6' });
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-[#E1E3E5] rounded text-[#2066B0] hover:bg-[#E8F4FD] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Thêm trạng thái mới
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#E1E3E5]">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#2066B0] hover:bg-[#1a4d8a]"
          >
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
