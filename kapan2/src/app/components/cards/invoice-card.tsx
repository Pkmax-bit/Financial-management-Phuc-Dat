import { MoreVertical, FileText, Calendar, DollarSign, User, CreditCard } from 'lucide-react';
import { Invoice, Status } from '../../types';
import { motion } from 'motion/react';

interface InvoiceCardProps {
  invoice: Invoice;
  status: Status;
}

export function InvoiceCard({ invoice, status }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  return (
    <motion.div
      className="bg-white rounded border border-[#E1E3E5] p-3 mb-2 cursor-pointer transition-all hover:border-[#2066B0] hover:shadow-[0_2px_8px_rgba(32,102,176,0.15)]"
      style={{ 
        borderLeftWidth: '4px', 
        borderLeftColor: status.color,
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '12px'
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
            <FileText size={16} className="text-[#2066B0] shrink-0" />
            <h4 className="font-semibold text-[#000000] text-sm" style={{ fontSize: '14px', fontWeight: 600 }}>
              {invoice.invoiceNumber}
            </h4>
          </div>
        </div>
        <button 
          className="text-[#9CA3AF] hover:text-[#535C69] transition-colors ml-2"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Open actions menu
          }}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Body - theo FIGMA spec */}
      <div className="space-y-2">
        {/* Dự án (link) */}
        <div className="text-[13px] text-[#535C69]">
          <span className="text-[#9CA3AF]">Dự án:</span>{' '}
          <span className="text-[#2066B0] hover:underline cursor-pointer">
            {invoice.projectName}
          </span>
        </div>

        {/* Khách hàng */}
        <div className="flex items-center gap-2 text-[13px] text-[#535C69]">
          <User size={14} className="text-[#9CA3AF] shrink-0" />
          <span className="truncate">{invoice.customerName}</span>
        </div>

        {/* Tổng tiền - theo FIGMA spec */}
        <div className="flex items-center gap-2 text-[13px] text-[#000000] font-semibold" style={{ fontWeight: 600 }}>
          <DollarSign size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{formatCurrency(invoice.totalAmount)}</span>
        </div>

        {/* Hạn thanh toán & Trạng thái thanh toán */}
        <div className="pt-2 border-t border-[#F5F7F8]">
          <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mb-2" style={{ fontSize: '12px' }}>
            <Calendar size={12} />
            <span>
              Hạn thanh toán: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
          {/* Trạng thái thanh toán (badge) - theo FIGMA spec */}
          <div className="flex items-center gap-1">
            <CreditCard size={12} className="text-[#9CA3AF]" />
            <span
              className="text-[11px] px-2 py-0.5 rounded text-white"
              style={{ 
                backgroundColor: getPaymentStatusColor(invoice.paymentStatus),
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '2px'
              }}
            >
              {getPaymentStatusLabel(invoice.paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer - theo FIGMA spec: Ngày tạo */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F5F7F8]">
        <div className="text-[11px] text-[#9CA3AF]" style={{ fontSize: '11px' }}>
          {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </motion.div>
  );
}