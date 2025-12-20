import { useState } from 'react';
import { ModuleHeader } from '../components/module-header';
import { KanbanBoard } from '../components/kanban-board';
import { ListView } from '../components/list-view';
import { QuoteCard } from '../components/cards/quote-card';
import { StatusManagementModal } from '../components/status-management-modal';
import { ViewType, Status, Quote } from '../types';
import { quoteStatuses as initialStatuses, mockQuotes } from '../data/mock-data';

export function QuotesModule() {
  const [view, setView] = useState<ViewType>('kanban');
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [isManagingStatuses, setIsManagingStatuses] = useState(false);

  const handleStatusChange = (quoteId: string, newStatusId: string) => {
    setQuotes(
      quotes.map((quote) =>
        quote.id === quoteId
          ? { ...quote, statusId: newStatusId }
          : quote
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const listViewColumns = [
    {
      key: 'quoteNumber',
      label: 'Số báo giá',
      sortable: true,
      render: (quote: Quote) => (
        <div className="font-semibold text-[#000000]">{quote.quoteNumber}</div>
      ),
    },
    {
      key: 'projectName',
      label: 'Dự án',
      sortable: true,
      render: (quote: Quote) => (
        <span className="text-[#2066B0] hover:underline cursor-pointer">
          {quote.projectName}
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
      render: (quote: Quote) => (
        <span className="font-semibold">{formatCurrency(quote.totalAmount)}</span>
      ),
    },
    {
      key: 'statusId',
      label: 'Trạng thái',
      sortable: true,
      render: (quote: Quote) => {
        const status = statuses.find((s) => s.id === quote.statusId);
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
      key: 'validUntil',
      label: 'Hạn hiệu lực',
      sortable: true,
      render: (quote: Quote) =>
        new Date(quote.validUntil).toLocaleDateString('vi-VN'),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      sortable: true,
      render: (quote: Quote) =>
        new Date(quote.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'assignedToName',
      label: 'Nhân viên phụ trách',
      sortable: true,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F5F7F8]">
      <ModuleHeader
        title="Báo giá"
        view={view}
        onViewChange={setView}
        onManageStatuses={() => setIsManagingStatuses(true)}
        onAddNew={() => alert('Thêm báo giá mới')}
      />

      <div className="flex-1 overflow-auto py-4">
        {view === 'kanban' ? (
          <KanbanBoard
            statuses={statuses}
            items={quotes}
            renderCard={(quote, status) => (
              <QuoteCard quote={quote} status={status} />
            )}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="px-6">
            <ListView columns={listViewColumns} items={quotes} />
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
