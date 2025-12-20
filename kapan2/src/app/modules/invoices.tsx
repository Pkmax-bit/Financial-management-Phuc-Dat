import { useState } from 'react';
import { ModuleHeader } from '../components/module-header';
import { KanbanBoard } from '../components/kanban-board';
import { ListView } from '../components/list-view';
import { InvoiceCard } from '../components/cards/invoice-card';
import { StatusManagementModal } from '../components/status-management-modal';
import { ViewType, Status, Invoice } from '../types';
import { invoiceStatuses as initialStatuses, mockInvoices } from '../data/mock-data';

export function InvoicesModule() {
  const [view, setView] = useState<ViewType>('kanban');
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isManagingStatuses, setIsManagingStatuses] = useState(false);

  const handleStatusChange = (invoiceId: string, newStatusId: string) => {
    setInvoices(
      invoices.map((invoice) =>
        invoice.id === invoiceId
          ? { ...invoice, statusId: newStatusId }
          : invoice
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getPaymentStatusLabel = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'Đã thanh toán';
      case 'partial':
        return 'Thanh toán một phần';
      case 'unpaid':
        return 'Chưa thanh toán';
      default:
        return paymentStatus;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return '#9ECF00';
      case 'partial':
        return '#FFA900';
      case 'unpaid':
        return '#FF5752';
      default:
        return '#9CA3AF';
    }
  };

  const listViewColumns = [
    {
      key: 'invoiceNumber',
      label: 'Số hóa đơn',
      sortable: true,
      render: (invoice: Invoice) => (
        <div className="font-semibold text-[#000000]">{invoice.invoiceNumber}</div>
      ),
    },
    {
      key: 'projectName',
      label: 'Dự án',
      sortable: true,
      render: (invoice: Invoice) => (
        <span className="text-[#2066B0] hover:underline cursor-pointer">
          {invoice.projectName}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      sortable: true,
      render: (invoice: Invoice) => (
        <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
      ),
    },
    {
      key: 'statusId',
      label: 'Trạng thái',
      sortable: true,
      render: (invoice: Invoice) => {
        const status = statuses.find((s) => s.id === invoice.statusId);
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
      key: 'paymentStatus',
      label: 'Trạng thái thanh toán',
      sortable: true,
      render: (invoice: Invoice) => (
        <span
          className="px-2 py-1 rounded text-xs text-white font-semibold"
          style={{ backgroundColor: getPaymentStatusColor(invoice.paymentStatus) }}
        >
          {getPaymentStatusLabel(invoice.paymentStatus)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Hạn thanh toán',
      sortable: true,
      render: (invoice: Invoice) =>
        new Date(invoice.dueDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      sortable: true,
      render: (invoice: Invoice) =>
        new Date(invoice.createdAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F5F7F8]">
      <ModuleHeader
        title="Hóa đơn"
        view={view}
        onViewChange={setView}
        onManageStatuses={() => setIsManagingStatuses(true)}
        onAddNew={() => alert('Thêm hóa đơn mới')}
      />

      <div className="flex-1 overflow-auto py-4">
        {view === 'kanban' ? (
          <KanbanBoard
            statuses={statuses}
            items={invoices}
            renderCard={(invoice, status) => (
              <InvoiceCard invoice={invoice} status={status} />
            )}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="px-6">
            <ListView columns={listViewColumns} items={invoices} />
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
