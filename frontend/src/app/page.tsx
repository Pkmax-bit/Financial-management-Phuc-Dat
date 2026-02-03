/**
 * Hệ thống Quản lý Tài chính - Trang chủ
 */

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  Sparkles,
  Zap,
  Target,
  Globe,
  Heart,
  Star,
  Award,
  Rocket
} from 'lucide-react'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    // Set document title and meta description
    document.title = 'Hệ thống Quản lý Tài chính - Phuc Dat'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Giải pháp quản lý tài chính toàn diện cho doanh nghiệp')
    }
    
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Users,
      title: 'Quản lý Nhân viên',
      description: 'Quản lý thông tin nhân viên, vai trò và quyền hạn một cách hiệu quả',
      href: '/employees',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Building2,
      title: 'Quản lý Khách hàng',
      description: 'Theo dõi thông tin khách hàng và mối quan hệ kinh doanh',
      href: '/customers',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: FolderOpen,
      title: 'Quản lý Dự án',
      description: 'Giám sát tiến độ dự án và ngân sách chi tiết',
      href: '/projects',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Receipt,
      title: 'Theo dõi Chi phí',
      description: 'Theo dõi và phê duyệt các khoản chi phí kinh doanh',
      href: '/expenses',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      icon: FileText,
      title: 'Quản lý Đơn hàng',
      description: 'Tạo và quản lý hóa đơn khách hàng chuyên nghiệp',
      href: '/invoices',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      icon: BarChart3,
      title: 'Báo cáo & Phân tích',
      description: 'Xem báo cáo tài chính và phân tích dữ liệu chi tiết',
      href: '/reports',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      icon: Zap,
      title: 'AI Thông minh',
      description: 'Trí tuệ nhân tạo tự động phân tích và tối ưu hóa chi phí, đưa ra gợi ý thông minh giúp tiết kiệm ngân sách và tăng hiệu quả kinh doanh',
      href: '/ai-assistant',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    }
  ]


  const benefits = [
    {
      icon: Shield,
      title: 'Bảo mật Cao',
      description: 'Hệ thống bảo mật đa lớp, bảo vệ dữ liệu tài chính'
    },
    {
      icon: Clock,
      title: 'Tiết kiệm Thời gian',
      description: 'Tự động hóa quy trình, giảm 70% thời gian xử lý'
    },
    {
      icon: CheckCircle,
      title: 'Chính xác 100%',
      description: 'Tính toán chính xác, loại bỏ sai sót thủ công'
    },
    {
      icon: Zap,
      title: 'Tốc độ Cao',
      description: 'Xử lý nhanh chóng, phản hồi tức thì'
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75"></div>
                <TrendingUp className="relative h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hệ thống Quản lý Tài chính
              </h1>
            </div>
            <nav className="flex space-x-6">
              <Link 
                href="/gioi-thieu" 
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
              >
                Giới thiệu
              </Link>
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Đăng nhập
              </Link>
            </nav>
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
                  Chào mừng đến với
                </span>
                <br />
                <span className="text-gray-800">Hệ thống Quản lý Tài chính</span>
              </h2>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Tối ưu hóa hoạt động kinh doanh với giải pháp quản lý tài chính toàn diện, 
                <span className="font-semibold text-blue-600"> thông minh và hiệu quả</span>
              </p>
              
              <div className="flex justify-center">
                <Link 
                  href="/login" 
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Rocket className="h-5 w-5" />
                  <span>Đăng nhập</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50">
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
              Mọi thứ bạn cần để quản lý tài chính doanh nghiệp một cách hiệu quả và chuyên nghiệp
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Link 
                key={index} 
                href={feature.href}
                className={`group transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="ml-4 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Tìm hiểu thêm</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/gioi-thieu" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <span>Xem chi tiết tất cả tính năng và lợi ích</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 mb-6">
              <Award className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Lợi ích vượt trội</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Tại sao chọn chúng tôi?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những ưu điểm nổi bật giúp doanh nghiệp của bạn phát triển bền vững
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className={`transform transition-all duration-700 hover:scale-105 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-6 shadow-lg">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Được tin tưởng</h4>
                <p className="text-gray-300">Hàng nghìn doanh nghiệp đã tin tưởng sử dụng</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Hiệu quả cao</h4>
                <p className="text-gray-300">Tăng 300% hiệu suất quản lý tài chính</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Bảo mật tuyệt đối</h4>
                <p className="text-gray-300">Dữ liệu được bảo vệ với công nghệ tiên tiến</p>
              </div>
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