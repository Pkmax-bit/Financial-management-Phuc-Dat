'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Layers,
  ShieldCheck,
  Target,
  Plus,
  Search,
  Clock3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
  code: string
  description: string
  level: 'foundation' | 'advanced' | 'specialized'
  status: 'draft' | 'active' | 'archived'
  owner: string
  lastUpdated: string
  credits: number
}

type UserSummary = {
  full_name?: string
  role?: string
  email?: string
}

const SUBJECT_LIBRARY: Subject[] = [
  {
    id: 'subject-planning',
    name: 'Lập kế hoạch tài chính doanh nghiệp',
    code: 'FIN-PL-01',
    description:
      'Khung nội dung chuẩn giúp doanh nghiệp thiết lập mục tiêu tài chính, dự phòng chi phí và theo dõi dòng tiền từng quý.',
    level: 'foundation',
    status: 'active',
    owner: 'Bộ phận Tư vấn CFO',
    lastUpdated: '2025-11-05T10:00:00+07:00',
    credits: 3
  },
  {
    id: 'subject-costing',
    name: 'Quản trị chi phí dự án & vật tư',
    code: 'FIN-CST-02',
    description:
      'Hướng dẫn chuẩn hoá biểu mẫu dự toán, giám sát sai lệch chi phí vật tư và tự động hoá báo cáo Excel.',
    level: 'advanced',
    status: 'active',
    owner: 'Nhóm kiểm soát nội bộ',
    lastUpdated: '2025-10-28T15:30:00+07:00',
    credits: 2
  },
  {
    id: 'subject-insight',
    name: 'Phân tích doanh thu & lợi nhuận thông minh',
    code: 'FIN-AN-07',
    description:
      'Chương trình chuyên sâu về đọc dữ liệu bán hàng, thiết lập KPI cho phòng kinh doanh và cảnh báo suy giảm biên lợi nhuận.',
    level: 'specialized',
    status: 'draft',
    owner: 'Phòng dữ liệu Phúc Đạt',
    lastUpdated: '2025-11-12T09:10:00+07:00',
    credits: 4
  }
]

const IMPLEMENTATION_CHECKLIST = [
  {
    title: 'Chuẩn hoá nội dung',
    description: 'Xác định module, mục tiêu học tập, thời lượng và người chịu trách nhiệm.',
    icon: Layers
  },
  {
    title: 'Kiểm thử & phản hồi',
    description: 'Mời đội nội bộ trải nghiệm, ghi nhận feedback và phân loại lỗi ưu tiên.',
    icon: ShieldCheck
  },
  {
    title: 'Tích hợp báo cáo',
    description: 'Kết nối dashboard, Excel export và các chỉ số đánh giá hiệu quả.',
    icon: Target
  }
]

export default function SubjectsPage() {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECT_LIBRARY)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(SUBJECT_LIBRARY[0] ?? null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const loadCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          throw error
        }

        if (!data.user) {
          router.push('/login')
          return
        }

        if (isMounted) {
          setUser({
            full_name: data.user.user_metadata?.full_name || data.user.email || 'Admin',
            role: data.user.user_metadata?.role || 'admin',
            email: data.user.email || ''
          })
        }
      } catch (err) {
        console.error('Unable to verify session for subjects page', err)
        router.push('/login')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [router])

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) {
      return subjects
    }

    return subjects.filter((subject) => {
      const haystack = `${subject.name} ${subject.code} ${subject.description} ${subject.owner}`.toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [subjects, search])

  const stats = useMemo(() => {
    const total = subjects.length
    const active = subjects.filter((subject) => subject.status === 'active').length
    const draft = subjects.filter((subject) => subject.status === 'draft').length
    const archived = subjects.filter((subject) => subject.status === 'archived').length

    return { total, active, draft, archived }
  }, [subjects])

  const handleCreateSubject = () => {
    const newSubject: Subject = {
      id: crypto.randomUUID ? crypto.randomUUID() : `subject-${Date.now()}`,
      name: 'Chương trình mới',
      code: `FIN-${(subjects.length + 1).toString().padStart(3, '0')}`,
      description:
        'Nháp nội dung. Chọn “Cập nhật nội dung” để bổ sung mục tiêu, học liệu và checklist triển khai.',
      level: 'foundation',
      status: 'draft',
      owner: user?.full_name || 'Admin',
      lastUpdated: new Date().toISOString(),
      credits: 1
    }

    setSubjects((prev) => [newSubject, ...prev])
    setSelectedSubject(newSubject)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-slate-600">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Học liệu nội bộ</p>
              <h1 className="text-2xl font-semibold text-slate-900">Thư viện môn học</h1>
              <p className="text-sm text-slate-500">
                Quản lý nội dung đào tạo cho đội ngũ triển khai tài chính & vận hành Phúc Đạt.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên, mã hoặc người phụ trách..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-72"
                />
              </div>
              <button
                onClick={handleCreateSubject}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tạo môn học nhanh
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour-id="subjects-stats">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase text-slate-500">Tổng số môn</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">{stats.total}</span>
                <span className="text-xs text-slate-500">module</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase text-emerald-500">Đang triển khai</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-600">{stats.active}</span>
                <span className="text-xs text-slate-500">module</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase text-amber-500">Bản nháp</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-amber-600">{stats.draft}</span>
                <span className="text-xs text-slate-500">module</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase text-slate-500">Lưu trữ</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">{stats.archived}</span>
                <span className="text-xs text-slate-500">module</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Danh sách môn học</p>
                  <p className="text-sm text-slate-500">Nhấn để xem chi tiết nội dung & checklist triển khai.</p>
                </div>
                <span className="text-xs text-slate-400">{filteredSubjects.length} kết quả</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {filteredSubjects.map((subject) => (
                  <li key={subject.id}>
                    <button
                      className={`w-full px-6 py-4 text-left transition-colors ${
                        selectedSubject?.id === subject.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedSubject(subject)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              {subject.code}
                            </span>
                            <p className="text-base font-semibold text-slate-900">{subject.name}</p>
                          </div>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{subject.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {subject.level === 'foundation' && 'Nền tảng'}
                              {subject.level === 'advanced' && 'Nâng cao'}
                              {subject.level === 'specialized' && 'Chuyên sâu'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              Cập nhật {new Date(subject.lastUpdated).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {subject.credits} tín chỉ nội bộ
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            subject.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : subject.status === 'draft'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {subject.status === 'active' && 'Đang triển khai'}
                          {subject.status === 'draft' && 'Đang soạn'}
                          {subject.status === 'archived' && 'Đã lưu trữ'}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
                {filteredSubjects.length === 0 && (
                  <li className="px-6 py-12 text-center text-sm text-slate-500">
                    Không tìm thấy môn học nào khớp từ khoá. Hãy thử lại với cụm từ khác.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
              {selectedSubject ? (
                <>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Chi tiết nhanh</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedSubject.name}</h2>
                    <p className="text-sm text-slate-500">{selectedSubject.description}</p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Mã nội bộ: <span className="font-medium text-slate-900">{selectedSubject.code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Số tín chỉ: <span className="font-medium text-slate-900">{selectedSubject.credits}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ShieldCheck className="h-4 w-4 text-indigo-500" />
                      Chủ nhiệm: <span className="font-medium text-slate-900">{selectedSubject.owner}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase text-slate-500">Các bước tiếp theo</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">Rà soát học liệu</p>
                          <p className="text-xs text-slate-500">
                            Chuẩn bị slide, bảng tính demo và checklist triển khai cho đội dự án.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">Gắn KPI theo module</p>
                          <p className="text-xs text-slate-500">
                            Liên kết module với báo cáo doanh thu/chi phí để đánh giá hiệu quả đào tạo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 space-y-3">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="font-medium">Chọn một môn học để xem chi tiết.</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase text-slate-500">Quy trình triển khai</p>
                <h3 className="text-xl font-semibold text-slate-900">Checklist hoàn thiện môn học</h3>
                <p className="text-sm text-slate-500">
                  Lặp lại ba bước này cho mọi module để đảm bảo chất lượng & nhất quán trải nghiệm.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {IMPLEMENTATION_CHECKLIST.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                  <item.icon className="h-6 w-6 text-blue-600" />
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </LayoutWithSidebar>
  )
}



