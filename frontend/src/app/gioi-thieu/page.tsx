/**
 * Trang Giới thiệu - Hệ thống Quản lý Tài chính
 * Hiển thị các chức năng và lợi ích của hệ thống
 */

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Building2, 
  FolderOpen, 
  Receipt, 
  FileText, 
  BarChart3,
  DollarSign,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Globe,
  Heart,
  Star,
  Award,
  Rocket,
  FileSpreadsheet,
  Eye,
  Kanban,
  Brain,
  Mail,
  Bell,
  Settings
} from 'lucide-react'

interface Feature {
  id: string
  icon: any
  title: string
  description: string
  href: string
  color: string
  bgColor: string
  iconColor: string
  benefits: string[]
}

export default function IntroductionPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const handleBack = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  const features: Feature[] = [
    {
      id: 'employees',
      icon: Users,
      title: 'Quản lý Nhân viên',
      description: 'Quản lý thông tin nhân viên, vai trò và quyền hạn một cách hiệu quả',
      href: '/employees',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      benefits: [
        'Quản lý tập trung thông tin nhân viên',
        'Phân quyền chi tiết theo vai trò',
        'Theo dõi lịch sử hoạt động',
        'Tự động tạo mã nhân viên',
        'Quản lý phòng ban và chức vụ',
        'Xuất dữ liệu Excel nhanh chóng'
      ]
    },
    {
      id: 'customers',
      icon: Building2,
      title: 'Quản lý Khách hàng',
      description: 'Theo dõi thông tin khách hàng và mối quan hệ kinh doanh',
      href: '/customers',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      benefits: [
        'Lưu trữ thông tin khách hàng đầy đủ',
        'Tự động tạo mã khách hàng',
        'Theo dõi lịch sử giao dịch',
        'Quản lý hạn mức tín dụng',
        'Phân loại khách hàng (cá nhân/công ty)',
        'Tích hợp với dự án và báo giá'
      ]
    },
    {
      id: 'projects',
      icon: FolderOpen,
      title: 'Quản lý Dự án',
      description: 'Giám sát tiến độ dự án và ngân sách chi tiết',
      href: '/projects',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      benefits: [
        'Theo dõi tiến độ dự án real-time',
        'Quản lý team và phân công công việc',
        'Timeline trực quan với hình ảnh',
        'Kanban board quản lý công việc',
        'Theo dõi ngân sách và chi phí',
        'Báo cáo tiến độ tự động'
      ]
    },
    {
      id: 'expenses',
      icon: DollarSign,
      title: 'Theo dõi Chi phí',
      description: 'Theo dõi và phê duyệt các khoản chi phí kinh doanh',
      href: '/expenses',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      benefits: [
        'Theo dõi chi phí theo danh mục',
        'Quy trình phê duyệt tự động',
        'So sánh chi phí kế hoạch vs thực tế',
        'Quản lý chi phí dự án chi tiết',
        'Tự động snapshot khi tạo chi phí con',
        'Khôi phục dữ liệu chi phí dễ dàng'
      ]
    },
    {
      id: 'sales',
      icon: Receipt,
      title: 'Bán hàng & Báo giá',
      description: 'Tạo và quản lý báo giá, đơn hàng khách hàng chuyên nghiệp',
      href: '/sales',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      benefits: [
        'Tạo báo giá nhanh chóng và chuyên nghiệp',
        'Tự động tính toán thuế và tổng tiền',
        'Quy trình duyệt báo giá tự động',
        'Chuyển đổi báo giá thành đơn hàng',
        'Theo dõi thanh toán chi tiết',
        'Gửi email báo giá tự động'
      ]
    },
    {
      id: 'invoices',
      icon: FileText,
      title: 'Quản lý Đơn hàng',
      description: 'Tạo và quản lý đơn hàng khách hàng chuyên nghiệp',
      href: '/sales/invoices',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      benefits: [
        'Tạo đơn hàng từ báo giá đã duyệt',
        'Theo dõi trạng thái thanh toán',
        'Quản lý công nợ khách hàng',
        'Xuất đơn hàng PDF chuyên nghiệp',
        'Gửi email đơn hàng tự động',
        'Tích hợp với báo cáo tài chính'
      ]
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Báo cáo & Phân tích',
      description: 'Xem báo cáo tài chính và phân tích dữ liệu chi tiết',
      href: '/reports',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      benefits: [
        'Báo cáo P&L (Lãi/Lỗ) chi tiết',
        'Bảng cân đối kế toán',
        'Báo cáo lưu chuyển tiền tệ',
        'Báo cáo dự án chi tiết',
        'Xuất Excel với đầy đủ dữ liệu',
        'Phân tích xu hướng tài chính'
      ]
    },
    {
      id: 'ai',
      icon: Brain,
      title: 'AI Thông minh',
      description: 'Trí tuệ nhân tạo tự động phân tích và tối ưu hóa chi phí',
      href: '/ai-assistant',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      benefits: [
        'Phân tích chi phí thông minh',
        'Gợi ý tối ưu hóa ngân sách',
        'Dự đoán xu hướng tài chính',
        'Chatbot hỗ trợ 24/7',
        'Đọc và phân tích hình ảnh',
        'Tự động hóa quy trình'
      ]
    },
    {
      id: 'timeline',
      icon: Eye,
      title: 'Timeline Khách hàng',
      description: 'Khách hàng xem tiến độ dự án trực quan với hình ảnh',
      href: '/projects/timeline',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      benefits: [
        'Timeline trực quan với hình ảnh',
        'Cập nhật tiến độ real-time',
        'Khách hàng tự xem tiến độ',
        'Tương tác với hình ảnh (like/comment)',
        'Thông báo tự động khi có cập nhật',
        'Tăng độ tin cậy với khách hàng'
      ]
    },
    {
      id: 'kanban',
      icon: Kanban,
      title: 'Kanban Board',
      description: 'Quản lý công việc dự án với bảng Kanban trực quan',
      href: '/projects/kanban',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      benefits: [
        'Quản lý công việc trực quan',
        'Kéo thả để cập nhật trạng thái',
        'Theo dõi tiến độ từng công việc',
        'Phân công nhân viên dễ dàng',
        'Lọc và tìm kiếm nhanh chóng',
        'Tích hợp với timeline dự án'
      ]
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Thông báo',
      description: 'Hệ thống thông báo tự động cho mọi hoạt động quan trọng',
      href: '/notifications',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      benefits: [
        'Thông báo real-time',
        'Nhắc nhở công việc quan trọng',
        'Thông báo phê duyệt',
        'Cập nhật tiến độ dự án',
        'Thông báo thanh toán',
        'Lịch sử thông báo đầy đủ'
      ]
    },
    {
      id: 'budget',
      icon: Target,
      title: 'Ngân sách Dự án',
      description: 'Lập và quản lý ngân sách dự án chi tiết',
      href: '/expenses',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      benefits: [
        'Lập ngân sách theo danh mục',
        'Phân bổ chi phí chi tiết',
        'So sánh kế hoạch vs thực tế',
        'Cảnh báo vượt ngân sách',
        'Báo cáo chênh lệch tự động',
        'Tối ưu hóa chi phí dự án'
      ]
    }
  ]

  const systemBenefits = [
    {
      icon: Shield,
      title: 'Bảo mật Cao',
      description: 'Hệ thống bảo mật đa lớp, mã hóa dữ liệu, phân quyền chi tiết'
    },
    {
      icon: Clock,
      title: 'Tiết kiệm Thời gian',
      description: 'Tự động hóa quy trình, giảm 70% thời gian xử lý thủ công'
    },
    {
      icon: CheckCircle,
      title: 'Chính xác 100%',
      description: 'Tính toán tự động, loại bỏ sai sót, đảm bảo độ chính xác'
    },
    {
      icon: Zap,
      title: 'Tốc độ Cao',
      description: 'Xử lý nhanh chóng, phản hồi tức thì, real-time updates'
    },
    {
      icon: TrendingUp,
      title: 'Tăng Hiệu quả',
      description: 'Tăng 300% hiệu suất quản lý, tối ưu hóa quy trình làm việc'
    },
    {
      icon: Globe,
      title: 'Dễ sử dụng',
      description: 'Giao diện thân thiện, hướng dẫn chi tiết, hỗ trợ 24/7'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-semibold transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại</span>
              </button>
              <div className="flex items-center space-x-3 ml-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75"></div>
                  <TrendingUp className="relative h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hệ thống Quản lý Tài chính
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Giải pháp tài chính thông minh</span>
              </div>
              
              <h2 className="text-5xl lg:text-7xl font-bold mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Giới thiệu Hệ thống
                </span>
                <br />
                <span className="text-gray-800">Quản lý Tài chính</span>
              </h2>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Hệ thống quản lý tài chính toàn diện giúp doanh nghiệp quản lý nhân viên, khách hàng, 
                dự án, chi phí và báo cáo một cách <span className="font-semibold text-blue-600">hiệu quả và chuyên nghiệp</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-6 py-3 mb-6">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-semibold text-blue-700">Tính năng nổi bật</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Các Chức năng Chính
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hệ thống được trang bị đầy đủ các tính năng cần thiết cho quản lý tài chính doanh nghiệp
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Link 
                key={feature.id} 
                href={feature.href}
                className={`group transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="ml-3 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Table Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 mb-6">
              <Award className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Bảng lợi ích</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Lợi ích của các Chức năng
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mỗi chức năng được thiết kế để mang lại giá trị thực tế cho doanh nghiệp của bạn
            </p>
          </div>

          {/* Benefits Table */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider w-1/4">
                      Chức năng
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Lợi ích
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {features.map((feature, index) => (
                    <tr 
                      key={feature.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color} shadow-md`}>
                            <feature.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{feature.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* System Benefits Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-6 py-3 mb-6">
              <Rocket className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Ưu điểm hệ thống</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Tại sao chọn hệ thống của chúng tôi?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những ưu điểm nổi bật giúp doanh nghiệp của bạn phát triển bền vững
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {systemBenefits.map((benefit, index) => (
              <div 
                key={index}
                className={`transform transition-all duration-700 hover:scale-105 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng bắt đầu?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Đăng nhập ngay để trải nghiệm hệ thống quản lý tài chính hiện đại
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/login" 
              className="group bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Rocket className="h-5 w-5" />
              <span>Đăng nhập</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/" 
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-75"></div>
                <TrendingUp className="relative h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hệ thống Quản lý Tài chính
              </span>
            </div>
            
            <div className="border-t border-gray-700 pt-8">
              <p className="text-gray-300 mb-4">
                © 2025 Hệ thống Quản lý Tài chính - Phuc Dat. Tất cả quyền được bảo lưu.
              </p>
              <div className="flex justify-center items-center space-x-2 text-sm text-gray-400">
                <span>Được xây dựng với</span>
                <span className="text-blue-400 font-semibold">Next.js</span>
                <span>,</span>
                <span className="text-green-400 font-semibold">FastAPI</span>
                <span>và</span>
                <span className="text-purple-400 font-semibold">Supabase</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

