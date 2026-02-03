'use client'

import React, { useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'

const faqs = [
  {
    id: 1,
    question: "Làm thế nào để tạo tài khoản người dùng mới?",
    answer: "Vào mục Nhân sự > Quản lý Nhân viên > Thêm nhân viên mới. Điền đầy đủ thông tin và hệ thống sẽ tự động tạo tài khoản đăng nhập.",
    category: "Nhân sự",
    module: "employees"
  },
  {
    id: 2,
    question: "Cách thiết lập ngân sách cho doanh nghiệp?",
    answer: "Vào mục Chi phí > Quản lý Ngân sách > Tạo ngân sách. Chọn chu kỳ (tháng/quý/năm) và thiết lập ngân sách cho từng danh mục chi phí.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 3,
    question: "Làm sao để tạo hóa đơn bán hàng?",
    answer: "Vào mục Bán hàng > Đơn hàng > Tạo hóa đơn. Chọn khách hàng, thêm sản phẩm/dịch vụ, điền thông tin và lưu hóa đơn.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 4,
    question: "Cách quản lý thanh toán của khách hàng?",
    answer: "Vào mục Bán hàng > Thanh toán > Ghi nhận thanh toán. Chọn hóa đơn cần thanh toán, nhập số tiền và phương thức thanh toán.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 5,
    question: "Làm thế nào để phê duyệt chi phí?",
    answer: "Vào mục Chi phí > Danh sách chi phí. Tìm chi phí cần phê duyệt và nhấn 'Phê duyệt' hoặc 'Từ chối' với ghi chú.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 6,
    question: "Cách tạo báo cáo tài chính?",
    answer: "Vào mục Báo cáo > Báo cáo Tài chính. Chọn loại báo cáo, khoảng thời gian và nhấn 'Tạo báo cáo' để xem kết quả.",
    category: "Báo cáo",
    module: "reports"
  }
]

interface FAQTabProps {
  searchTerm: string
  onSearchChange: (term: string) => void
}

export default function FAQTab({ searchTerm, onSearchChange }: FAQTabProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Câu hỏi Thường gặp</h3>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-gray-100 text-black px-2 py-1 rounded">
                  {faq.category}
                </span>
                <span className="font-medium text-gray-900">{faq.question}</span>
              </div>
              {expandedFaq === faq.id ? (
                <ChevronDown className="h-4 w-4 text-black" />
              ) : (
                <ChevronRight className="h-4 w-4 text-black" />
              )}
            </button>
            {expandedFaq === faq.id && (
              <div className="px-4 pb-3 border-t bg-gray-50">
                <p className="text-black text-sm pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {filteredFaqs.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-black mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy câu hỏi</h3>
          <p className="text-black">Thử tìm kiếm với từ khóa khác hoặc liên hệ hỗ trợ</p>
        </div>
      )}

      {/* FAQ Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Danh mục FAQ</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-black">Bán hàng</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-sm text-black">Chi phí</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">1</div>
            <div className="text-sm text-black">Nhân sự</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">1</div>
            <div className="text-sm text-black">Báo cáo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
