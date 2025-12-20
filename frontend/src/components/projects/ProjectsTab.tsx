'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Edit, Trash2, Calendar, DollarSign, Users, Target, MoreVertical, Filter, X, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectCategoryApi, customerApi } from '@/lib/api'
import ProjectCategoriesManager from './ProjectCategoriesManager'

interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  customer_name?: string
  manager_id: string
  manager_name?: string
  category_id?: string
  category_name?: string
  category_color?: string
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface ProjectsTabProps {
  onCreateProject: () => void
  onEditProject: (project: Project) => void
  onViewProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  customerId?: string
}

const statusColors: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700'
}

const statusLabels: Record<string, string> = {
  planning: 'Lập kế hoạch',
  active: 'Đang hoạt động',
  on_hold: 'Tạm dừng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-700'
}

const priorityLabels: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp'
}

export default function ProjectsTab({
  onCreateProject,
  onEditProject,
  onViewProject,
  onDeleteProject,
  customerId
}: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  })
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, email?: string, user_id?: string, project_id?: string, project_ids?: string[], hasProjects?: boolean }>>([])
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchProjects()
    fetchTeamMembers()
    fetchCategories()
    fetchCustomers()
  }, [customerId])

  useEffect(() => {
    console.log('🔄 useEffect filterProjects triggered:', {
      projectsCount: projects.length,
      teamMembersCount: teamMembers.length,
      selectedTeamMemberId,
      searchQuery,
      statusFilter,
      categoryFilter,
      customerFilter
    })
    filterProjects()
  }, [projects, searchQuery, statusFilter, categoryFilter, customerFilter, dateFilter, selectedTeamMemberId, teamMembers])

  const fetchProjects = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.log('❌ No auth user found')
        setProjects([])
        setLoading(false)
        return
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        console.log('❌ No user data found')
        setProjects([])
        setLoading(false)
        return
      }

      // Save user role for UI display logic
      setUserRole(userData.role)

      console.log('🔍 Fetching projects for user:', userData.email, 'role:', userData.role)

      // Build query
      let query = supabase
        .from('projects')
        .select(`
          id,
          project_code,
          name,
          description,
          customer_id,
          manager_id,
          category_id,
          start_date,
          end_date,
          budget,
          actual_cost,
          status,
          priority,
          progress,
          billing_type,
          hourly_rate,
          created_at,
          updated_at,
          customers(name),
          employees!manager_id(
            id,
            first_name,
            last_name
          ),
          project_categories:category_id(
            id,
            name,
            color
          )
        `)

      // Filter by customer_id if provided
      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      // Admin and accountant see all projects
      if (userData.role === 'admin' || userData.role === 'accountant') {
        console.log('👑 Admin/Accountant: Fetching all projects')
      } else {
        // Regular users: only see projects where they are in project_team
        console.log('👤 Regular user: Fetching projects from project_team')

        // Get project_ids where user is in team
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        const allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]

        console.log(`✅ User has access to ${allowedProjectIds.length} projects:`, allowedProjectIds)

        if (allowedProjectIds.length === 0) {
          console.log('⚠️ User has no project access')
          setProjects([])
          setLoading(false)
          return
        }

        // Filter projects by allowed IDs
        query = query.in('id', allowedProjectIds)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const mappedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        project_code: p.project_code,
        name: p.name,
        description: p.description,
        customer_id: p.customer_id,
        customer_name: p.customers?.name,
        manager_id: p.manager_id,
        manager_name: p.employees
          ? `${p.employees.first_name || ''} ${p.employees.last_name || ''}`.trim()
          : undefined,
        category_id: p.category_id,
        category_name: p.project_categories?.name,
        category_color: p.project_categories?.color,
        start_date: p.start_date,
        end_date: p.end_date,
        budget: p.budget,
        actual_cost: p.actual_cost,
        status: p.status,
        priority: p.priority,
        progress: typeof p.progress === 'number' ? p.progress : Number(p.progress ?? 0),
        billing_type: p.billing_type,
        hourly_rate: p.hourly_rate,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))

      console.log(`✅ Fetched ${mappedProjects.length} projects`)
      setProjects(mappedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesData = await projectCategoryApi.getCategories(true)
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const customersData = await customerApi.getCustomers({ limit: 1000 })
      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      console.log('🔍 fetchTeamMembers started')

      // Lấy user đang đăng nhập
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.log('❌ No auth user found')
        return
      }
      console.log('✅ Auth user:', authUser.id, authUser.email)

      // Lấy thông tin user từ bảng users
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        console.log('❌ No user data found')
        return
      }
      console.log('✅ User data:', userData)

      // Lấy danh sách project_ids mà user có quyền truy cập
      let allowedProjectIds: string[] = []

      // Nếu là admin hoặc accountant, xem tất cả dự án
      if (userData.role === 'admin' || userData.role === 'accountant') {
        console.log('👑 Admin/Accountant: Getting all projects')
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id')
        allowedProjectIds = (allProjects || []).map(p => p.id)
        console.log(`✅ Allowed projects (admin): ${allowedProjectIds.length}`)
      } else {
        console.log('👤 Regular user: Getting projects from project_team')
        console.log('🔍 Searching with:', {
          user_id: userData.id,
          email: userData.email
        })

        // Lấy project_ids từ project_team theo user_id hoặc email
        // Thử query riêng biệt để debug
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id, user_id, email, name')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id, user_id, email, name')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        console.log('📊 Team data by user_id:', teamDataByUserId.data)
        console.log('📊 Team data by email:', teamDataByEmail.data)

        // Gộp kết quả từ cả hai query
        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        console.log('📊 All team data (combined):', allTeamData)
        allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]
        console.log(`✅ Allowed projects (user): ${allowedProjectIds.length}`, allowedProjectIds)

        // Log chi tiết các thành viên tìm được
        if (allTeamData.length > 0) {
          console.log('👥 Found team members for current user:')
          allTeamData.forEach((member: any) => {
            console.log(`  - ${member.name} (${member.email}) - Project: ${member.project_id}`)
          })
        } else {
          console.log('⚠️ No team members found for current user')
          console.log('💡 Checking if user exists in project_team table...')
          // Kiểm tra xem có bất kỳ record nào với email này không
          const { data: checkData } = await supabase
            .from('project_team')
            .select('email, user_id, name')
            .eq('email', userData.email)
            .limit(5)
          console.log('📋 Sample project_team records with this email:', checkData)
        }
      }

      if (allowedProjectIds.length === 0) {
        console.log('⚠️ No allowed projects, setting empty team members')
        setTeamMembers([])
        return
      }

      // Lấy tất cả nhân viên từ employees và users
      const [employeesRes, usersRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, first_name, last_name, email, user_id')
          .eq('status', 'active'),
        supabase
          .from('users')
          .select('id, full_name, email, is_active')
          .eq('is_active', true)
      ])

      const allEmployees = [
        ...(employeesRes.data || []).map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Không có tên',
          email: emp.email,
          user_id: emp.user_id,
          type: 'employee' as const
        })),
        ...(usersRes.data || []).map((user: any) => ({
          id: user.id,
          name: user.full_name || user.email || 'Không có tên',
          email: user.email,
          user_id: user.id,
          type: 'user' as const
        }))
      ]

      // Loại bỏ trùng lặp theo email
      const uniqueEmployees = Array.from(
        new Map(allEmployees.map(emp => [emp.email, emp])).values()
      )

      // Lấy thành viên dự án từ các dự án mà user có quyền
      // CHỈ lấy những thành viên trong các dự án mà user đang đăng nhập có quyền
      console.log('🔍 Fetching team members from projects:', allowedProjectIds)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('project_team')
        .select('id, name, email, project_id, user_id')
        .eq('status', 'active')
        .in('project_id', allowedProjectIds)

      if (teamMembersError) {
        console.error('❌ Error fetching team members:', teamMembersError)
      }

      console.log('📊 Team members data from project_team:', teamMembersData?.length)
      if (teamMembersData && teamMembersData.length > 0) {
        console.log('👥 Team members found:', teamMembersData.map((m: any) => ({
          name: m.name,
          email: m.email,
          user_id: m.user_id,
          project_id: m.project_id
        })))
      } else {
        console.log('⚠️ No team members found in allowed projects')
      }

      // Tạo map từ user_id -> employee_id
      const userIdToEmployeeIdMap = new Map<string, string>()
      for (const emp of uniqueEmployees) {
        if (emp.user_id && emp.type === 'employee') {
          userIdToEmployeeIdMap.set(emp.user_id, emp.id)
        }
      }

      // Tạo map để match: user_id -> employee_id -> name -> email -> project_ids
      const memberProjectMap = new Map<string, string[]>()
        ; (teamMembersData || []).forEach((member: any) => {
          // Ưu tiên: user_id -> employee_id (từ user_id) -> name -> email
          const keys: string[] = []

          if (member.user_id) {
            keys.push(`user_${member.user_id}`)
            // Tìm employee_id từ user_id
            const empId = userIdToEmployeeIdMap.get(member.user_id)
            if (empId) {
              keys.push(`emp_${empId}`)
            }
          }
          if (member.name) {
            // Normalize name: lowercase, trim, remove extra spaces
            const normalizedName = member.name.toLowerCase().trim().replace(/\s+/g, ' ')
            keys.push(`name_${normalizedName}`)
          }
          if (member.email) {
            keys.push(`email_${member.email.toLowerCase().trim()}`)
          }

          keys.forEach(key => {
            if (!memberProjectMap.has(key)) {
              memberProjectMap.set(key, [])
            }
            memberProjectMap.get(key)!.push(member.project_id)
          })
        })

      // Hiển thị TẤT CẢ nhân viên trong dropdown
      // Nhưng chỉ lọc theo project_ids của những nhân viên có trong project_team của các dự án user có quyền
      console.log('🔍 Matching employees with team members...')
      console.log('📊 Unique employees:', uniqueEmployees.length)
      console.log('📊 Team members data:', teamMembersData?.length)
      console.log('📊 Member project map size:', memberProjectMap.size)

      // TẤT CẢ nhân viên sẽ được hiển thị, nhưng chỉ những người có trong project_team mới có project_ids
      const allMembersWithProjects = uniqueEmployees
        .map(emp => {
          // Lấy project_ids theo thứ tự ưu tiên: user_id -> employee_id -> name -> email
          let projectIds: string[] = []
          let matchMethod = ''

          if (emp.user_id) {
            const key = `user_${emp.user_id}`
            projectIds = memberProjectMap.get(key) || []
            if (projectIds.length > 0) {
              matchMethod = 'user_id'
              console.log(`  ✅ Matched ${emp.name} by user_id: ${emp.user_id} -> ${projectIds.length} projects`)
            }
          }
          if (projectIds.length === 0 && emp.type === 'employee') {
            const key = `emp_${emp.id}`
            projectIds = memberProjectMap.get(key) || []
            if (projectIds.length > 0) {
              matchMethod = 'employee_id'
              console.log(`  ✅ Matched ${emp.name} by employee_id: ${emp.id} -> ${projectIds.length} projects`)
            }
          }
          if (projectIds.length === 0 && emp.name) {
            const normalizedName = emp.name.toLowerCase().trim().replace(/\s+/g, ' ')
            const key = `name_${normalizedName}`
            projectIds = memberProjectMap.get(key) || []
            if (projectIds.length > 0) {
              matchMethod = 'name'
              console.log(`  ✅ Matched ${emp.name} by name: "${normalizedName}" -> ${projectIds.length} projects`)
            }
          }
          if (projectIds.length === 0 && emp.email) {
            const key = `email_${emp.email.toLowerCase().trim()}`
            projectIds = memberProjectMap.get(key) || []
            if (projectIds.length > 0) {
              matchMethod = 'email'
              console.log(`  ✅ Matched ${emp.name} by email: ${emp.email} -> ${projectIds.length} projects`)
            }
          }

          // Lọc project_ids: chỉ giữ những project_ids mà user đang đăng nhập có quyền
          const filteredProjectIds = projectIds.filter(pid => allowedProjectIds.includes(pid))

          if (filteredProjectIds.length === 0 && projectIds.length > 0) {
            console.log(`  ⚠️ ${emp.name} has projects but none are in allowed projects for current user`)
          }

          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            user_id: emp.user_id,
            project_ids: [...new Set(filteredProjectIds)], // Chỉ giữ project_ids mà user có quyền
            project_id: filteredProjectIds[0] || '',
            matchMethod,
            hasProjects: filteredProjectIds.length > 0
          }
        })

      // CHỈ hiển thị những nhân viên có trong project_team của các dự án user có quyền
      const filteredMembers = allMembersWithProjects.filter(m => m.hasProjects)

      console.log(`✅ All members: ${allMembersWithProjects.length}`)
      console.log(`✅ Members with projects (filtered by user access): ${filteredMembers.length}`)
      console.log('👥 Final team members (only those with projects):', filteredMembers.map(m => ({
        name: m.name,
        email: m.email,
        project_ids: m.project_ids,
        hasProjects: m.hasProjects,
        matchMethod: (m as any).matchMethod
      })))

      // CHỈ hiển thị những nhân viên có trong project_team của các dự án user có quyền
      setTeamMembers(filteredMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    }
  }

  const filterProjects = () => {
    console.log('🔍 filterProjects called:', {
      totalProjects: projects.length,
      searchQuery,
      statusFilter,
      categoryFilter,
      customerFilter,
      selectedTeamMemberId,
      teamMembersCount: teamMembers.length
    })

    let filtered = [...projects]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const beforeCount = filtered.length
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.project_code.toLowerCase().includes(query) ||
          p.customer_name?.toLowerCase().includes(query) ||
          p.manager_name?.toLowerCase().includes(query)
      )
      console.log(`📝 Search filter: ${beforeCount} -> ${filtered.length}`)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter((p) => p.status === statusFilter)
      console.log(`📊 Status filter (${statusFilter}): ${beforeCount} -> ${filtered.length}`)
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter((p) => p.category_id === categoryFilter)
      console.log(`🏷️ Category filter (${categoryFilter}): ${beforeCount} -> ${filtered.length}`)
    }

    // Filter by customer
    if (customerFilter !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter((p) => p.customer_id === customerFilter)
      console.log(`👤 Customer filter (${customerFilter}): ${beforeCount} -> ${filtered.length}`)
    }

    // Filter by team member
    if (selectedTeamMemberId !== 'all') {
      const beforeCount = filtered.length
      console.log('👤 Filtering by team member:', selectedTeamMemberId)
      console.log('👥 Available team members:', teamMembers.map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        project_ids: m.project_ids,
        hasProjects: (m as any).hasProjects
      })))

      const selectedMember = teamMembers.find(m => {
        // Tìm theo id (có thể là employee id hoặc user id)
        const matches = m.id === selectedTeamMemberId || m.user_id === selectedTeamMemberId
        if (matches) {
          console.log('✅ Found matching member:', m)
        }
        return matches
      })

      if (selectedMember) {
        if (selectedMember.project_ids && selectedMember.project_ids.length > 0) {
          console.log('🎯 Filtering projects by project_ids:', selectedMember.project_ids)
          filtered = filtered.filter((p) => {
            const included = selectedMember.project_ids!.includes(p.id)
            if (included) {
              console.log(`  ✓ Project included: ${p.name} (${p.id})`)
            }
            return included
          })
          console.log(`👤 Team member filter: ${beforeCount} -> ${filtered.length}`)
        } else {
          console.log('⚠️ Selected member has no project_ids in allowed projects - showing no results')
          filtered = [] // Nếu nhân viên không có project trong danh sách allowed, không hiển thị gì
        }
      } else {
        console.log('⚠️ Selected member not found')
      }
    } else {
      console.log('👤 No team member filter (all selected)')
    }

    console.log('✅ Final filtered projects:', filtered.length)
    setFilteredProjects(filtered)

    // Filter by date range (start_date and end_date)
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter((p) => {
        // Check if project's start_date or end_date falls within the range
        const projectStartDate = p.start_date ? new Date(p.start_date) : null
        const projectEndDate = p.end_date ? new Date(p.end_date) : null
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null

        // Normalize dates (ignore time)
        if (projectStartDate) projectStartDate.setHours(0, 0, 0, 0)
        if (projectEndDate) projectEndDate.setHours(0, 0, 0, 0)
        if (fromDate) fromDate.setHours(0, 0, 0, 0)
        if (toDate) toDate.setHours(0, 0, 0, 0)

        // If both from and to are set, check if project dates overlap with range
        if (fromDate && toDate) {
          // Project is included if:
          // - Project start_date is within range, OR
          // - Project end_date is within range, OR
          // - Project spans the entire range
          const startInRange = projectStartDate && projectStartDate >= fromDate && projectStartDate <= toDate
          const endInRange = projectEndDate && projectEndDate >= fromDate && projectEndDate <= toDate
          const spansRange = projectStartDate && projectEndDate && projectStartDate <= fromDate && projectEndDate >= toDate

          return startInRange || endInRange || spansRange
        } else if (fromDate) {
          // Only from date: include projects that start on or after this date
          return projectStartDate && projectStartDate >= fromDate
        } else if (toDate) {
          // Only to date: include projects that end on or before this date
          return projectEndDate && projectEndDate <= toDate
        }

        return true
      })
    }

    console.log('✅ Final filtered projects:', filtered.length)
    setFilteredProjects(filtered)
  }

  const handleDelete = async (project: Project) => {
    try {
      // Helper function to delete files from storage folder
      const deleteProjectFiles = async (projectId: string): Promise<void> => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) {
            console.warn('No session token, skipping file deletion')
            return
          }

          // Get all timeline attachments for this project
          const { data: timelineEntries } = await supabase
            .from('project_timeline')
            .select('id')
            .eq('project_id', projectId)

          if (timelineEntries && timelineEntries.length > 0) {
            const timelineIds = timelineEntries.map(e => e.id)
            const { data: attachments } = await supabase
              .from('timeline_attachments')
              .select('url')
              .in('timeline_entry_id', timelineIds)

            if (attachments) {
              for (const attachment of attachments) {
                if (attachment.url) {
                  try {
                    // Extract file path from URL
                    const match = attachment.url.match(/\/storage\/v1\/object\/[^\/]+\/(.+)$/)
                    if (match && match[1]) {
                      const filePath = match[1]
                      const parts = filePath.split('/')
                      const filename = parts.pop() || ''
                      const folderPath = parts.join('/')

                      await fetch(`/api/uploads/${folderPath}/${encodeURIComponent(filename)}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                      })
                    }
                  } catch (e) {
                    console.warn('Error deleting timeline attachment:', e)
                  }
                }
              }
            }
          }

          // Try to delete entire project folder (if API supports it)
          // Note: This may require backend support for folder deletion
          // For now, we delete individual files found above
        } catch (e) {
          console.warn('Error deleting project files:', e)
          // Continue with project deletion even if file deletion fails
        }
      }

      // Delete project files before deleting project
      await deleteProjectFiles(project.id)

      // Delete project from database
      const { error } = await supabase.from('projects').delete().eq('id', project.id)

      if (error) throw error

      setProjects(projects.filter((p) => p.id !== project.id))
      setShowDeleteConfirm(null)
      onDeleteProject(project)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Lỗi khi xóa dự án')
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6" data-tour-id="projects-grid">
      {/* Header with Search and Filter Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án, mã dự án, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>
        {(userRole === 'admin' || userRole === 'manager') && (
          <button
            onClick={() => setShowCategoriesManager(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Quản lý nhóm phân loại"
          >
            <Settings className="h-4 w-4" />
            Quản lý nhóm
          </button>
        )}
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${showFilter
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {showFilter ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>

      {/* Main Content: Filter + Projects */}
      <div className={`flex flex-col lg:flex-row gap-6`}>
        {/* Filter Sidebar */}
        {showFilter && (
          <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-lg p-6 h-fit lg:sticky lg:top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="planning">Lập kế hoạch</option>
                <option value="active">Đang hoạt động</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Nhóm phân loại</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tất cả nhóm</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Khách hàng</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tất cả khách hàng</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member Filter - Only show for admin and accountant */}
            {(userRole === 'admin' || userRole === 'accountant') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">Thành viên dự án</label>
                <select
                  value={selectedTeamMemberId}
                  onChange={(e) => {
                    console.log('📝 Team member filter changed:', e.target.value)
                    setSelectedTeamMemberId(e.target.value)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="all">Tất cả thành viên</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.user_id || member.id}>
                      {member.name} {member.email ? `(${member.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Khoảng thời gian</label>
              <div className="space-y-3">
                <input
                  type="date"
                  placeholder="Từ ngày"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({
                    ...dateFilter,
                    from: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                <input
                  type="date"
                  placeholder="Đến ngày"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({
                    ...dateFilter,
                    to: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                {(dateFilter.from || dateFilter.to) && (
                  <button
                    onClick={() => setDateFilter({
                      from: '',
                      to: ''
                    })}
                    className="w-full px-3 py-2 text-sm text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Xóa bộ lọc thời gian
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className={`${showFilter ? 'w-full lg:w-2/3' : 'w-full'}`}>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || customerFilter !== 'all' || dateFilter.from || dateFilter.to ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || customerFilter !== 'all' || dateFilter.from || dateFilter.to
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Bắt đầu bằng cách tạo dự án mới'}
              </p>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && customerFilter === 'all' && !dateFilter.from && !dateFilter.to && (
                <button
                  onClick={onCreateProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo dự án mới
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${showFilter ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow ${showFilter ? 'p-6' : 'p-6'
                    }`}
                >
                  {showFilter ? (
                    // Horizontal card layout when filter is shown - Responsive: Stack on mobile, horizontal on large screens
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-normal break-words">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500">{project.project_code}</p>
                          </div>
                          <div className="relative group ml-4">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-5 w-5 text-gray-400" />
                            </button>
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                              <button
                                onClick={() => onViewProject(project)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => onEditProject(project)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(project.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || statusColors.planning}`}
                          >
                            {statusLabels[project.status] || project.status}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority] || priorityColors.medium}`}
                          >
                            {priorityLabels[project.priority] || project.priority}
                          </span>
                          {project.category_name && (
                            <span
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: project.category_color ? `${project.category_color}20` : '#E5E7EB',
                                color: project.category_color || '#374151'
                              }}
                            >
                              {project.category_name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                          {project.customer_name && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="break-words">{project.customer_name}</span>
                            </div>
                          )}
                          {project.manager_name && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="break-words">QL: {project.manager_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{formatDate(project.start_date)}</span>
                            {project.end_date && <span> - {formatDate(project.end_date)}</span>}
                          </div>
                          {project.budget && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{formatCurrency(project.budget)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full sm:w-60 lg:w-80 flex-shrink-0 mt-4 sm:mt-0">
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Tiến độ</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onViewProject(project)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => onEditProject(project)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Vertical card layout when filter is hidden (3 cards per row)
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-normal break-words">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500">{project.project_code}</p>
                        </div>
                        <div className="relative group">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            <button
                              onClick={() => onViewProject(project)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => onEditProject(project)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(project.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || statusColors.planning}`}
                        >
                          {statusLabels[project.status] || project.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority] || priorityColors.medium}`}
                        >
                          {priorityLabels[project.priority] || project.priority}
                        </span>
                        {project.category_name && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: project.category_color ? `${project.category_color}20` : '#E5E7EB',
                              color: project.category_color || '#374151'
                            }}
                          >
                            {project.category_name}
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Tiến độ</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {project.customer_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{project.customer_name}</span>
                          </div>
                        )}
                        {project.manager_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">QL: {project.manager_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(project.start_date)}</span>
                          {project.end_date && <span> - {formatDate(project.end_date)}</span>}
                        </div>
                        {project.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => onViewProject(project)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => onEditProject(project)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const project = projects.find((p) => p.id === showDeleteConfirm)
                  if (project) handleDelete(project)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Categories Manager */}
      <ProjectCategoriesManager
        isOpen={showCategoriesManager}
        onClose={() => setShowCategoriesManager(false)}
        onSuccess={() => {
          fetchCategories()
          fetchProjects()
        }}
      />
    </div>
  )
}

