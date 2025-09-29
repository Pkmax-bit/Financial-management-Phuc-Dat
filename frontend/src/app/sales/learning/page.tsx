'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Play, 
  HelpCircle, 
  Video,
  FileText,
  Users,
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Download,
  ExternalLink
} from 'lucide-react'

export default function SalesLearningPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const learningPaths = [
    {
      id: 'beginner',
      title: 'Người mới bắt đầu',
      description: 'Học từ cơ bản đến nâng cao',
      duration: '2-3 giờ',
      difficulty: 'Dễ',
      color: 'green',
      steps: [
        {
          title: 'Giới thiệu hệ thống',
          duration: '15 phút',
          type: 'video',
          completed: false
        },
        {
          title: 'Tạo báo giá đầu tiên',
          duration: '30 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Gửi hóa đơn',
          duration: '25 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Ghi nhận thanh toán',
          duration: '20 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Kiểm tra báo cáo',
          duration: '15 phút',
          type: 'video',
          completed: false
        }
      ]
    },
    {
      id: 'intermediate',
      title: 'Người dùng trung bình',
      description: 'Nâng cao kỹ năng sử dụng',
      duration: '1-2 giờ',
      difficulty: 'Trung bình',
      color: 'blue',
      steps: [
        {
          title: 'Bán hàng trực tiếp',
          duration: '25 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Xử lý trả hàng',
          duration: '20 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Quản lý khách hàng',
          duration: '30 phút',
          type: 'video',
          completed: false
        },
        {
          title: 'Báo cáo nâng cao',
          duration: '25 phút',
          type: 'video',
          completed: false
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Người dùng nâng cao',
      description: 'Tối ưu hóa quy trình',
      duration: '1 giờ',
      difficulty: 'Khó',
      color: 'purple',
      steps: [
        {
          title: 'Tích hợp kế toán',
          duration: '20 phút',
          type: 'video',
          completed: false
        },
        {
          title: 'Tự động hóa quy trình',
          duration: '25 phút',
          type: 'interactive',
          completed: false
        },
        {
          title: 'Phân tích dữ liệu',
          duration: '15 phút',
          type: 'video',
          completed: false
        }
      ]
    }
  ]

  const resources = [
    {
      title: 'Hướng dẫn chi tiết',
      description: 'Hướng dẫn từng bước cho tất cả chức năng',
      icon: BookOpen,
      type: 'documentation',
      url: '/sales/guide',
      color: 'blue'
    },
    {
      title: 'Video hướng dẫn',
      description: 'Xem video hướng dẫn trực quan',
      icon: Video,
      type: 'video',
      url: '/sales/help#videos',
      color: 'green'
    },
    {
      title: 'Hướng dẫn tương tác',
      description: 'Thực hành với hướng dẫn tương tác',
      icon: Play,
      type: 'interactive',
      url: '/sales/help#interactive',
      color: 'purple'
    },
    {
      title: 'FAQ & Hỗ trợ',
      description: 'Câu hỏi thường gặp và hỗ trợ',
      icon: HelpCircle,
      type: 'support',
      url: '/sales/help',
      color: 'orange'
    }
  ]

  const achievements = [
    {
      title: 'Người mới bắt đầu',
      description: 'Hoàn thành hướng dẫn cơ bản',
      icon: Star,
      unlocked: true,
      progress: 100
    },
    {
      title: 'Chuyên gia báo giá',
      description: 'Tạo được 10 báo giá',
      icon: FileText,
      unlocked: false,
      progress: 30
    },
    {
      title: 'Quản lý hóa đơn',
      description: 'Gửi được 20 hóa đơn',
      icon: BookOpen,
      unlocked: false,
      progress: 15
    },
    {
      title: 'Thu tiền chuyên nghiệp',
      description: 'Ghi nhận 50 thanh toán',
      icon: Award,
      unlocked: false,
      progress: 0
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BookOpen },
    { id: 'learning-paths', name: 'Lộ trình học', icon: Play },
    { id: 'resources', name: 'Tài nguyên', icon: FileText },
    { id: 'achievements', name: 'Thành tích', icon: Award }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trung tâm học tập Sales</h1>
                <p className="text-sm text-gray-600">Học cách sử dụng hệ thống Sales hiệu quả</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Tiến độ tổng thể:</span> 45%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Chào mừng đến với Trung tâm học tập Sales</h2>
                    <p className="text-gray-600 mb-6">
                      Hệ thống Sales giúp bạn quản lý toàn bộ quy trình bán hàng từ báo giá đến thanh toán. 
                      Hãy bắt đầu với lộ trình học phù hợp với trình độ của bạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Users className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Người mới</h3>
                          <p className="text-green-700">Bắt đầu từ cơ bản</p>
                        </div>
                      </div>
                      <p className="text-green-800 text-sm mb-4">
                        Học cách tạo báo giá, gửi hóa đơn và ghi nhận thanh toán
                      </p>
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        Bắt đầu học
                      </button>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Award className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Trung bình</h3>
                          <p className="text-blue-700">Nâng cao kỹ năng</p>
                        </div>
                      </div>
                      <p className="text-blue-800 text-sm mb-4">
                        Học bán hàng trực tiếp, xử lý trả hàng và quản lý khách hàng
                      </p>
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Tiếp tục học
                      </button>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Star className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-purple-900">Nâng cao</h3>
                          <p className="text-purple-700">Tối ưu hóa quy trình</p>
                        </div>
                      </div>
                      <p className="text-purple-800 text-sm mb-4">
                        Học tích hợp kế toán, tự động hóa và phân tích dữ liệu
                      </p>
                      <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                        Học nâng cao
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-start">
                      <Clock className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Mẹo học hiệu quả</h3>
                        <ul className="text-yellow-800 space-y-2">
                          <li>• Học từng bước một, không vội vàng</li>
                          <li>• Thực hành ngay sau khi học lý thuyết</li>
                          <li>• Ghi chú lại những điểm quan trọng</li>
                          <li>• Đặt câu hỏi khi không hiểu</li>
                          <li>• Ôn tập định kỳ để nhớ lâu</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Paths Tab */}
              {activeTab === 'learning-paths' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Lộ trình học tập</h2>
                  <div className="space-y-6">
                    {learningPaths.map((path) => (
                      <div key={path.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 bg-${path.color}-100 rounded-full flex items-center justify-center mr-4`}>
                              <BookOpen className={`h-6 w-6 text-${path.color}-600`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{path.title}</h3>
                              <p className="text-gray-600">{path.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Thời gian: {path.duration}</div>
                            <div className="text-sm text-gray-500">Độ khó: {path.difficulty}</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {path.steps.map((step, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {step.duration}
                                    <span className="mx-2">•</span>
                                    {step.type === 'video' ? (
                                      <Video className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Play className="h-3 w-3 mr-1" />
                                    )}
                                    {step.type === 'video' ? 'Video' : 'Tương tác'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {step.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <button className="text-blue-600 hover:text-blue-700">
                                    <ArrowRight className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button className={`w-full bg-${path.color}-600 text-white px-4 py-2 rounded-md hover:bg-${path.color}-700`}>
                            Bắt đầu lộ trình
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Tài nguyên học tập</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resources.map((resource, index) => {
                      const Icon = resource.icon
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className={`w-12 h-12 bg-${resource.color}-100 rounded-full flex items-center justify-center mr-4`}>
                              <Icon className={`h-6 w-6 text-${resource.color}-600`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                              <p className="text-gray-600">{resource.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 capitalize">{resource.type}</span>
                            <a
                              href={resource.url}
                              className="inline-flex items-center text-blue-600 hover:text-blue-700"
                            >
                              Xem ngay
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Thành tích của bạn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {achievements.map((achievement, index) => {
                      const Icon = achievement.icon
                      return (
                        <div key={index} className={`border rounded-lg p-6 ${
                          achievement.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                        }`}>
                          <div className="flex items-center mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                              achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                achievement.unlocked ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${
                                achievement.unlocked ? 'text-green-900' : 'text-gray-900'
                              }`}>
                                {achievement.title}
                              </h3>
                              <p className={`text-sm ${
                                achievement.unlocked ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Tiến độ</span>
                              <span className="text-sm font-medium text-gray-900">{achievement.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                          </div>
                          {achievement.unlocked ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Đã mở khóa</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Còn {100 - achievement.progress}% để mở khóa
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
