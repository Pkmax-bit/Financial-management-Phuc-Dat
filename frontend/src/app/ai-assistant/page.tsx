/**
 * Trang AI Assistant - Hỗ trợ quản lý chi phí thông minh
 */

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Zap, 
  Brain, 
  TrendingUp, 
  Target, 
  Shield, 
  Clock, 
  CheckCircle,
  BarChart3,
  DollarSign,
  FileText,
  Users,
  Lightbulb,
  Sparkles,
  Rocket,
  Star,
  Award,
  Heart,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Image,
  Upload,
  Scan
} from 'lucide-react'

export default function AIAssistantPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % aiFeatures.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const aiFeatures = [
    {
      icon: Brain,
      title: 'Phân tích thông minh',
      description: 'AI tự động phân tích dữ liệu chi phí và đưa ra insights có giá trị',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Dự đoán xu hướng',
      description: 'Dự báo chi phí tương lai dựa trên dữ liệu lịch sử và xu hướng thị trường',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Tối ưu hóa ngân sách',
      description: 'Đề xuất cách phân bổ ngân sách hiệu quả và tiết kiệm chi phí',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Phát hiện bất thường',
      description: 'Cảnh báo sớm về các khoản chi phí bất thường hoặc vượt ngân sách',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      icon: Camera,
      title: 'Phân tích hình ảnh chi phí',
      description: 'AI đọc và phân tích hóa đơn, biên lai từ hình ảnh, tự động nhập dữ liệu chi phí',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      icon: Scan,
      title: 'Quét tài liệu thông minh',
      description: 'Quét và nhận diện thông tin từ hóa đơn, hợp đồng, báo cáo tài chính',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600'
    }
  ]

  const benefits = [
    {
      icon: Clock,
      title: 'Tiết kiệm 80% thời gian',
      description: 'Tự động hóa quy trình phân tích và báo cáo chi phí'
    },
    {
      icon: DollarSign,
      title: 'Giảm 25% chi phí',
      description: 'Tối ưu hóa ngân sách và loại bỏ chi phí không cần thiết'
    },
    {
      icon: CheckCircle,
      title: 'Độ chính xác 99%',
      description: 'Phân tích chính xác và đáng tin cậy với AI tiên tiến'
    },
    {
      icon: BarChart3,
      title: 'Insights sâu sắc',
      description: 'Hiểu rõ xu hướng chi phí và cơ hội tối ưu hóa'
    }
  ]

  const useCases = [
    {
      title: 'Phân tích chi phí dự án',
      description: 'AI phân tích chi phí theo từng giai đoạn dự án và đưa ra khuyến nghị',
      icon: FileText,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Dự báo ngân sách',
      description: 'Dự đoán chi phí cần thiết cho các dự án sắp tới',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Tối ưu hóa nhân lực',
      description: 'Phân tích hiệu quả sử dụng nhân lực và đề xuất cải thiện',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Báo cáo thông minh',
      description: 'Tự động tạo báo cáo chi tiết với insights và khuyến nghị',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Quét hóa đơn tự động',
      description: 'Chụp ảnh hóa đơn, AI tự động đọc và nhập dữ liệu chi phí vào hệ thống',
      icon: Camera,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Nhận diện tài liệu',
      description: 'AI nhận diện và trích xuất thông tin từ hợp đồng, báo cáo tài chính',
      icon: Scan,
      color: 'from-teal-500 to-teal-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Trở về trang chủ</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75"></div>
                <Zap className="relative h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Assistant
              </h1>
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
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Trí tuệ nhân tạo thông minh</span>
              </div>
              
              <h2 className="text-5xl lg:text-7xl font-bold mb-8">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  AI Hỗ trợ Quản lý
                </span>
                <br />
                <span className="text-gray-800">Chi phí Thông minh</span>
              </h2>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Trí tuệ nhân tạo tự động phân tích và tối ưu hóa chi phí, 
                <span className="font-semibold text-purple-600"> đưa ra gợi ý thông minh</span> giúp tiết kiệm ngân sách và tăng hiệu quả kinh doanh
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="relative py-20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-6 py-3 mb-6">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Tính năng AI nổi bật</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Công nghệ AI Tiên tiến
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá sức mạnh của trí tuệ nhân tạo trong việc quản lý tài chính doanh nghiệp
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`transform transition-all duration-700 hover:scale-105 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-6 py-3 mb-6">
              <Award className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Lợi ích vượt trội</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Tại sao chọn AI Assistant?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những ưu điểm nổi bật giúp doanh nghiệp của bạn tối ưu hóa chi phí và tăng hiệu quả
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
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
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

      {/* Use Cases Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-6 py-3 mb-6">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Ứng dụng thực tế</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Các Trường hợp Sử dụng
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI Assistant có thể giúp bạn trong nhiều tình huống quản lý chi phí khác nhau
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div 
                key={index}
                className={`transform transition-all duration-700 hover:scale-105 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${useCase.color} shadow-lg`}>
                      <useCase.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="ml-4 text-xl font-bold text-gray-900">
                      {useCase.title}
                    </h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h3 className="text-4xl font-bold text-white mb-6">
              Sẵn sàng trải nghiệm AI Assistant?
            </h3>
            <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto">
              Khám phá sức mạnh của trí tuệ nhân tạo trong việc quản lý chi phí và tối ưu hóa ngân sách doanh nghiệp
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/login" 
                className="group bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Rocket className="h-5 w-5" />
                <span>Bắt đầu ngay</span>
              </Link>
              <Link 
                href="/" 
                className="group bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 border border-white/30"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur opacity-75"></div>
                <Zap className="relative h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </div>
            
            <p className="text-gray-300 mb-4">
              © 2025 AI Assistant - Hệ thống Quản lý Tài chính. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex justify-center items-center space-x-2 text-sm text-gray-400">
              <span>Được phát triển với</span>
              <span className="text-purple-400 font-semibold">Machine Learning</span>
              <span>và</span>
              <span className="text-pink-400 font-semibold">AI Technology</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
