import { Mail, Phone, MoreVertical, Building2, User } from 'lucide-react';
import { Customer, Status } from '../../types';
import { motion } from 'motion/react';

interface CustomerCardProps {
  customer: Customer;
  status: Status;
}

export function CustomerCard({ customer, status }: CustomerCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <motion.div
      className="bg-white rounded border border-[#E1E3E5] mb-2 cursor-pointer transition-all hover:border-[#2066B0] hover:shadow-[0_2px_8px_rgba(32,102,176,0.15)]"
      style={{ 
        borderLeftWidth: '4px', 
        borderLeftColor: status.color,
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '12px',
        marginBottom: '8px',
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar - 40px theo FIGMA spec */}
        <div
          className="rounded-full flex items-center justify-center text-white shrink-0"
          style={{ 
            width: '40px', 
            height: '40px',
            backgroundColor: status.color,
            borderRadius: '50%',
          }}
        >
          <span className="text-sm font-semibold">{getInitials(customer.name)}</span>
        </div>

        {/* Name & Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 
              className="font-semibold text-[#000000] truncate" 
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {customer.name}
            </h4>
            <button 
              className="text-[#9CA3AF] hover:text-[#535C69] transition-colors ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open actions menu
              }}
              aria-label="Menu hành động"
            >
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {customer.type === 'company' ? (
              <Building2 size={12} className="text-[#9CA3AF]" />
            ) : (
              <User size={12} className="text-[#9CA3AF]" />
            )}
            <span 
              className="bg-[#F5F7F8] border border-[#E1E3E5] rounded"
              style={{ 
                fontSize: '11px', 
                padding: '4px 8px', 
                borderRadius: '2px' 
              }}
            >
              {customer.type === 'company' ? 'Công ty' : 'Cá nhân'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        {/* Mã khách hàng - theo FIGMA spec */}
        <div 
          className="text-[#9CA3AF]" 
          style={{ fontSize: '12px', marginTop: '4px' }}
        >
          Mã: {customer.code}
        </div>

        {/* Email - theo FIGMA spec */}
        <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#535C69' }}>
          <Mail size={14} className="text-[#9CA3AF] shrink-0" />
          <span className="truncate">{customer.email}</span>
        </div>

        {/* Số điện thoại - theo FIGMA spec */}
        <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#535C69' }}>
          <Phone size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{customer.phone}</span>
        </div>

        {/* Hạn mức tín dụng - theo FIGMA spec */}
        {customer.creditLimit && (
          <div className="pt-2">
            <div 
              className="font-semibold text-[#000000]" 
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {formatCurrency(customer.creditLimit)}
            </div>
          </div>
        )}

        {/* Tags/Labels - theo FIGMA spec */}
        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {customer.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-[#F5F7F8] border border-[#E1E3E5] rounded"
                style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px', 
                  borderRadius: '2px' 
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer - theo FIGMA spec */}
      <div 
        className="flex items-center justify-between mt-3 pt-2 border-t"
        style={{ borderTopColor: '#F5F7F8', paddingTop: '8px' }}
      >
        <div 
          className="text-[#9CA3AF]" 
          style={{ fontSize: '11px' }}
        >
          {new Date(customer.updatedAt).toLocaleDateString('vi-VN')}
        </div>
        {/* User avatar (người phụ trách) - 20px theo FIGMA spec */}
        <div className="flex items-center gap-1">
          <div
            className="rounded-full bg-[#2066B0] flex items-center justify-center text-white font-semibold"
            style={{ 
              width: '20px', 
              height: '20px',
              fontSize: '10px',
            }}
            title={customer.assignedTo}
          >
            {getInitials(customer.assignedTo)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}