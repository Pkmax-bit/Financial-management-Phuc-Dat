import { MoreVertical, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { Quote, Status } from '../../types';
import { motion } from 'motion/react';

interface QuoteCardProps {
  quote: Quote;
  status: Status;
}

export function QuoteCard({ quote, status }: QuoteCardProps) {
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
              {quote.quoteNumber}
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
            {quote.projectName}
          </span>
        </div>

        {/* Khách hàng */}
        <div className="flex items-center gap-2 text-[13px] text-[#535C69]">
          <User size={14} className="text-[#9CA3AF] shrink-0" />
          <span className="truncate">{quote.customerName}</span>
        </div>

        {/* Tổng tiền - theo FIGMA spec */}
        <div className="flex items-center gap-2 text-[13px] text-[#000000] font-semibold" style={{ fontWeight: 600 }}>
          <DollarSign size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{formatCurrency(quote.totalAmount)}</span>
        </div>

        {/* Hạn hiệu lực */}
        <div className="pt-2 border-t border-[#F5F7F8]">
          <div className="flex items-center gap-1 text-xs text-[#9CA3AF]" style={{ fontSize: '12px' }}>
            <Calendar size={12} />
            <span>
              Hạn hiệu lực: {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer - theo FIGMA spec: Ngày tạo, Nhân viên phụ trách */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F5F7F8]">
        <div className="text-[11px] text-[#9CA3AF]" style={{ fontSize: '11px' }}>
          {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
        </div>
        {/* User avatar - 20px theo FIGMA spec */}
        <div
          className="w-5 h-5 rounded-full bg-[#2066B0] flex items-center justify-center text-white text-[10px] font-semibold"
          style={{ width: '20px', height: '20px' }}
          title={quote.assignedToName}
        >
          {getInitials(quote.assignedToName)}
        </div>
      </div>
    </motion.div>
  );
}