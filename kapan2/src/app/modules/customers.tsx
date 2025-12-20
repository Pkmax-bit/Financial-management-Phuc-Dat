import { useState } from 'react';
import { ModuleHeader } from '../components/module-header';
import { KanbanBoard } from '../components/kanban-board';
import { ListView } from '../components/list-view';
import { CustomerCard } from '../components/cards/customer-card';
import { StatusManagementModal } from '../components/status-management-modal';
import { ViewType, Status, Customer } from '../types';
import { customerStatuses as initialStatuses, mockCustomers } from '../data/mock-data';
import { Building2, User } from 'lucide-react';

export function CustomersModule() {
  const [view, setView] = useState<ViewType>('kanban');
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isManagingStatuses, setIsManagingStatuses] = useState(false);

  const handleStatusChange = (customerId: string, newStatusId: string) => {
    setCustomers(
      customers.map((customer) =>
        customer.id === customerId
          ? { ...customer, statusId: newStatusId }
          : customer
      )
    );
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const listViewColumns = [
    {
      key: 'name',
      label: 'Tên khách hàng',
      sortable: true,
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{
              backgroundColor: statuses.find((s) => s.id === customer.statusId)?.color || '#9CA3AF',
            }}
          >
            {customer.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-[#000000]">{customer.name}</div>
            <div className="text-xs text-[#9CA3AF]">{customer.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Loại',
      sortable: true,
      render: (customer: Customer) => (
        <div className="flex items-center gap-1">
          {customer.type === 'company' ? (
            <Building2 size={14} className="text-[#9CA3AF]" />
          ) : (
            <User size={14} className="text-[#9CA3AF]" />
          )}
          <span>{customer.type === 'company' ? 'Công ty' : 'Cá nhân'}</span>
        </div>
      ),
    },
    {
      key: 'creditLimit',
      label: 'Hạn mức tín dụng',
      sortable: true,
      render: (customer: Customer) => (
        <span className="font-semibold">{formatCurrency(customer.creditLimit)}</span>
      ),
    },
    {
      key: 'statusId',
      label: 'Trạng thái',
      sortable: true,
      render: (customer: Customer) => {
        const status = statuses.find((s) => s.id === customer.statusId);
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
      key: 'assignedTo',
      label: 'Người phụ trách',
      sortable: true,
    },
    {
      key: 'updatedAt',
      label: 'Cập nhật',
      sortable: true,
      render: (customer: Customer) =>
        new Date(customer.updatedAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F5F7F8]">
      <ModuleHeader
        title="Khách hàng"
        view={view}
        onViewChange={setView}
        onManageStatuses={() => setIsManagingStatuses(true)}
        onAddNew={() => alert('Thêm khách hàng mới')}
      />

      <div className="flex-1 overflow-auto py-4">
        {view === 'kanban' ? (
          <KanbanBoard
            statuses={statuses}
            items={customers}
            renderCard={(customer, status) => (
              <CustomerCard customer={customer} status={status} />
            )}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="px-6">
            <ListView columns={listViewColumns} items={customers} />
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
