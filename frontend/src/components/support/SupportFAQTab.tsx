'use client'

import React, { useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'

interface SupportFAQTabProps {
  searchTerm: string
  onCreateGuide?: () => void
}

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
  },
  {
    id: 7,
    question: "Làm sao để tạo báo giá cho khách hàng?",
    answer: "Vào mục Bán hàng > Báo giá > Tạo báo giá. Chọn khách hàng, thêm sản phẩm/dịch vụ, điền thông tin và gửi cho khách hàng.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 8,
    question: "Cách chuyển đổi báo giá thành hóa đơn?",
    answer: "Vào mục Bán hàng > Báo giá. Tìm báo giá đã được chấp nhận và nhấn 'Chuyển thành hóa đơn' để tạo hóa đơn mới.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 9,
    question: "Làm thế nào để tạo phiếu thu bán hàng?",
    answer: "Vào mục Bán hàng > Phiếu thu > Tạo phiếu thu. Chọn khách hàng, nhập thông tin thanh toán và lưu phiếu thu.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 10,
    question: "Cách xử lý credit memo?",
    answer: "Vào mục Bán hàng > Credit Memo > Tạo credit memo. Chọn hóa đơn gốc, nhập lý do và số tiền giảm trừ.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 11,
    question: "Làm sao để tạo đơn đặt hàng?",
    answer: "Vào mục Chi phí > Đơn đặt hàng > Tạo đơn đặt hàng. Chọn nhà cung cấp, thêm sản phẩm và gửi phê duyệt.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 12,
    question: "Cách quản lý nhà cung cấp?",
    answer: "Vào mục Chi phí > Nhà cung cấp > Thêm nhà cung cấp. Điền thông tin liên hệ, tài chính và lưu thông tin.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 13,
    question: "Làm thế nào để tạo đề nghị hoàn ứng?",
    answer: "Vào mục Chi phí > Đề nghị hoàn ứng > Tạo đề nghị. Điền thông tin chi phí, đính kèm chứng từ và gửi phê duyệt.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 14,
    question: "Cách theo dõi ngân sách so với chi tiêu thực tế?",
    answer: "Vào mục Chi phí > Báo cáo Ngân sách. Xem báo cáo so sánh ngân sách với chi tiêu thực tế theo từng danh mục.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 15,
    question: "Làm sao để tạo hóa đơn nhà cung cấp?",
    answer: "Vào mục Chi phí > Đơn hàng > Tạo hóa đơn. Chọn nhà cung cấp, thêm sản phẩm/dịch vụ và lưu hóa đơn.",
    category: "Chi phí",
    module: "expenses"
  }
]

export default function SupportFAQTab({ searchTerm, onCreateGuide }: SupportFAQTabProps) {
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
        <p className="text-black mb-6">
          Tìm câu trả lời cho các vấn đề phổ biến
        </p>
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
