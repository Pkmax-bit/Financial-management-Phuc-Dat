'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Calendar, DollarSign, Users, Target, Clock, AlertCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectApi, customerApi, employeeApi, projectCategoryApi, apiPost, apiGet } from '@/lib/api'
import ProjectSuccessModal from '../ProjectSuccessModal'

interface Customer {
  id: string
  name: string
  email: string
  address?: string
}

interface Employee {
  id: string
  name: string
  email: string
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    description: '',
    customer_id: '',
    manager_id: '',
    category_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planning' as const,
    status_id: '' as string,
    priority: 'medium' as const,
    progress: 0,
    billing_type: 'fixed' as const,
    hourly_rate: ''
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [taskGroups, setTaskGroups] = useState<Array<{ id: string; name: string; category_id?: string }>>([])
  const [loadingTaskGroups, setLoadingTaskGroups] = useState(false)
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState<string>('')
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; category_id?: string | null }>>([])
  const [loadingStatuses, setLoadingStatuses] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdProject, setCreatedProject] = useState({ name: '', code: '' })

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchEmployees()
      fetchCategories()
      fetchTaskGroups()
      fetchStatuses() // Fetch statuses toàn cục khi mở modal
      generateProjectCode()
    }
  }, [isOpen])

  const fetchTaskGroups = async () => {
    try {
      setLoadingTaskGroups(true)
      const groups = await apiGet('/api/tasks/groups?is_active=true')
      // Đảm bảo lưu category_id vào state
      const groupsWithCategory = (groups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        category_id: g.category_id
      }))
      setTaskGroups(groupsWithCategory)
      
      // Nếu đã chọn category, tự động chọn task_group tương ứng
      if (formData.category_id) {
        const categoryGroup = groupsWithCategory.find((g: any) => g.category_id === formData.category_id)
        if (categoryGroup) {
          setSelectedTaskGroupId(categoryGroup.id)
        }
      }
    } catch (error) {
      console.error('Error fetching task groups:', error)
    } finally {
      setLoadingTaskGroups(false)
    }
  }

  const fetchStatuses = async (categoryId?: string) => {
    try {
      setLoadingStatuses(true)
      const url = categoryId 
        ? `/api/projects/statuses?category_id=${categoryId}`
        : '/api/projects/statuses'
      const statusesData = await apiGet(url)
      setStatuses(statusesData || [])
      
      // Nếu có statuses và chưa chọn status, chọn status đầu tiên
      if (statusesData && statusesData.length > 0 && !formData.status_id) {
        const firstStatus = statusesData[0]
        setFormData(prev => ({
          ...prev,
          status_id: firstStatus.id,
          status: firstStatus.name.toLowerCase().replace(/\s+/g, '_') as any // Fallback cho legacy status enum
        }))
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
      // Fallback: dùng statuses mặc định nếu API fail
      setStatuses([])
    } finally {
      setLoadingStatuses(false)
    }
  }

  // createDefaultTaskGroup function removed - task_groups are now auto-created from project_categories

  const generateProjectCode = async () => {
    try {
      // Get the last project code from database ordered by created_at
      const { data, error } = await supabase
        .from('projects')
        .select('project_code')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNumber = 1
      
      if (data && data.length > 0 && data[0].project_code) {
        // Extract number from the last project code
        const lastCode = data[0].project_code
        const match1 = lastCode.match(/#PRJ(\d+)/)
        const match2 = lastCode.match(/PRJ(\d+)/)
        
        if (match1) {
          nextNumber = parseInt(match1[1]) + 1
        } else if (match2) {
          nextNumber = parseInt(match2[1]) + 1
        }
      }

      // Format as PRJXXX (3 digits)
      const newCode = `PRJ${nextNumber.toString().padStart(3, '0')}`
      
      setFormData(prev => ({
        ...prev,
        project_code: newCode
      }))
    } catch (error) {
      console.error('Error generating project code:', error)
      // Fallback to timestamp-based code
      const timestamp = Date.now().toString().slice(-6)
      setFormData(prev => ({
        ...prev,
        project_code: `PRJ${timestamp}`
      }))
    }
  }

  const fetchCustomers = async () => {
    try {
      // Try API first, fallback to Supabase
      try {
        const data = await customerApi.getCustomers()
        setCustomers(data || [])
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, address')
          .order('name')

        if (error) throw error
        setCustomers(data || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      console.log('🔄 Fetching project categories...')
      const categoriesData = await projectCategoryApi.getCategories(true)
      console.log('✅ Categories fetched:', categoriesData)
      setCategories(categoriesData || [])
      
      if (!categoriesData || categoriesData.length === 0) {
        console.warn('⚠️ No categories found. Make sure migration has been run.')
      }
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error)
      console.error('Error details:', error.response?.data || error.message)
      // Set empty array to prevent errors
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      // Try API first, fallback to Supabase
      try {
        const data = await employeeApi.getEmployees()
        console.log('API employees data:', data)
        
        // Transform API data to expected format
        const employees = data?.map((emp: any) => ({
          id: emp.id,
          name: emp.full_name || `${emp.first_name} ${emp.last_name}`,
          email: emp.email
        })) || []
        
        setEmployees(employees)
        console.log('Employees set:', employees)
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email')
          .order('first_name')

        if (error) throw error
        
        const employees = data?.map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          email: emp.email
        })) || []
        
        setEmployees(employees)
        console.log('Supabase employees set:', employees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        end_date: formData.end_date || null,
        progress: parseFloat(formData.progress.toString()) || 0,
        actual_cost: 0.0  // Add default actual_cost
      }
      
      console.log('Submitting project data:', submitData)

      // Try API first, fallback to Supabase
      let createdProjectData: any = null
      try {
        console.log('Trying API first...')
        createdProjectData = await projectApi.createProject(submitData)
        console.log('API success')
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('projects')
          .insert(submitData)
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        createdProjectData = data?.[0]
        console.log('Supabase success:', data)
      }

      // Task sẽ được tự động tạo bởi database trigger khi project có category_id
      // Không cần tạo task thủ công ở đây nữa
      if (createdProjectData && formData.category_id) {
        console.log('✅ Project created with category. Task will be auto-created by database trigger.')
      }

      // Show success notification
      setSuccess(true)
      setCreatedProject({ name: formData.name, code: formData.project_code })
      setShowSuccessModal(true)
      
      // Play success sound (if available)
      try {
        const audio = new Audio('/sounds/success.mp3')
        audio.play().catch(() => {
          // Ignore if audio file doesn't exist
        })
      } catch (error) {
        // Ignore audio errors
      }
      
      // Call onSuccess to reload data
      onSuccess()
      
      // Reset form
      setFormData({
        project_code: '',
        name: '',
        description: '',
        customer_id: '',
        manager_id: '',
        category_id: '',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'planning',
        status_id: '',
        priority: 'medium',
        progress: 0,
        billing_type: 'fixed',
        hourly_rate: ''
      })
      setStatuses([]) // Reset statuses
      // selectedTaskGroupId sẽ được tự động set khi chọn category
      
      // Don't auto-close modal, let success modal handle it
    } catch (error) {
      console.error('Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Khi chọn khách hàng, tự động tạo tên dự án từ tên khách hàng và địa chỉ
    if (name === 'customer_id' && value) {
      const selectedCustomer = customers.find(c => c.id === value)
      if (selectedCustomer) {
        let customerName = selectedCustomer.name || ''
        let customerAddress = selectedCustomer.address || ''
        
        // Nếu chưa có address trong danh sách, fetch thông tin chi tiết
        if (!customerAddress) {
          // Try to get customer details from API or Supabase
          try {
            const customerDetail = await customerApi.getCustomer(value)
            if (customerDetail?.address) {
              customerAddress = customerDetail.address
              // Update customer in list
              setCustomers(prev => prev.map(c => 
                c.id === value ? { ...c, address: customerDetail.address } : c
              ))
            }
          } catch (err) {
            // Fallback to Supabase
            try {
              const { data, error } = await supabase
                .from('customers')
                .select('name, address')
                .eq('id', value)
                .single()
              
              if (!error && data) {
                customerAddress = data.address || ''
                customerName = data.name || customerName
                // Update customer in list
                setCustomers(prev => prev.map(c => 
                  c.id === value ? { ...c, address: data.address, name: data.name } : c
                ))
              }
            } catch (supabaseErr) {
              console.error('Error fetching customer address:', supabaseErr)
            }
          }
        }
        
        // Tạo tên dự án: "Tên khách hàng - Địa chỉ khách hàng"
        // Chỉ tự động tạo nếu tên dự án đang trống
        setFormData(prev => {
          // Chỉ tự động tạo tên nếu chưa có hoặc đang trống
          if (!prev.name || prev.name.trim() === '') {
            let projectName = customerName
            if (customerAddress) {
              projectName = `${customerName} - ${customerAddress}`
            }
            return {
              ...prev,
              name: projectName
            }
          }
          return prev
        })
      }
    }
    
    // Khi chọn category, tự động tìm và chọn task_group tương ứng và fetch statuses
    if (name === 'category_id' && value) {
      try {
        // Fetch statuses cho category này
        await fetchStatuses(value)
        
        // Tìm task_group có category_id tương ứng trong danh sách đã fetch
        const matchingGroup = taskGroups.find(g => g.category_id === value)
        if (matchingGroup) {
          setSelectedTaskGroupId(matchingGroup.id)
          console.log('✅ Auto-selected task group:', matchingGroup.name, 'for category:', value)
        } else {
          // Nếu không tìm thấy trong danh sách, fetch từ API
          const groups = await apiGet(`/api/tasks/groups?category_id=${value}`)
          if (groups && groups.length > 0) {
            setSelectedTaskGroupId(groups[0].id)
            // Cập nhật danh sách taskGroups nếu cần
            setTaskGroups(prev => {
              const existing = prev.find(g => g.id === groups[0].id)
              if (!existing) {
                return [...prev, { id: groups[0].id, name: groups[0].name, category_id: value }]
              }
              return prev
            })
            console.log('✅ Auto-selected task group:', groups[0].name, 'for category:', value)
          } else {
            // Nếu chưa có task_group, đợi trigger tạo (hoặc có thể tạo thủ công)
            console.log('⚠️ No task group found for category, waiting for auto-creation...')
            // Retry sau 1 giây để đợi trigger tạo task_group
            setTimeout(async () => {
              const retryGroups = await apiGet(`/api/tasks/groups?category_id=${value}`)
              if (retryGroups && retryGroups.length > 0) {
                setSelectedTaskGroupId(retryGroups[0].id)
                setTaskGroups(prev => {
                  const existing = prev.find(g => g.id === retryGroups[0].id)
                  if (!existing) {
                    return [...prev, { id: retryGroups[0].id, name: retryGroups[0].name, category_id: value }]
                  }
                  return prev
                })
                console.log('✅ Task group created, auto-selected:', retryGroups[0].name)
              }
            }, 1000)
          }
        }
      } catch (error) {
        console.error('Error fetching task group for category:', error)
      }
    } else if (name === 'category_id' && !value) {
      // Nếu bỏ chọn category, cũng bỏ chọn task_group và fetch statuses toàn cục
      setSelectedTaskGroupId('')
      await fetchStatuses() // Fetch statuses toàn cục
    }
  }

  if (!isOpen) return null

  return (
    <>
      <ProjectSuccessModal
        isVisible={showSuccessModal}
        projectName={createdProject.name}
        projectCode={createdProject.code}
        onContinue={() => {
          setShowSuccessModal(false)
          onClose()
          router.push('/sales?tab=quotes')
        }}
        onCancel={() => {
          setShowSuccessModal(false)
          onClose()
        }}
      />
      <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right"
        data-tour-id="projects-create-modal"
      >
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo dự án mới</h2>
            <p className="text-sm font-semibold text-black">Thêm dự án vào hệ thống</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-semibold">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-green-800">
                    🎉 Dự án đã được tạo thành công!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Dự án <strong>"{formData.name}"</strong> với mã <strong>"{formData.project_code}"</strong> đã được tạo thành công.
                  </p>
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    📋 Đang chuyển sang trang báo giá để tạo báo giá cho dự án mới...
                  </p>
                  <div className="mt-3 flex items-center text-sm text-green-600 bg-green-100 rounded-lg p-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">Vui lòng chờ trong giây lát...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-tour-id="project-field-code">
              <label className="block text-sm font-medium text-black mb-2">
                Mã dự án *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="project_code"
                  value={formData.project_code}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="VD: PRJ001"
                />
              </div>
            </div>

            <div data-tour-id="project-field-name">
              <label className="block text-sm font-medium text-black mb-2">
                Tên dự án *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="Nhập tên dự án"
                />
              </div>
            </div>
          </div>

          <div data-tour-id="project-field-description">
            <label className="block text-sm font-medium text-black mb-2">
              Mô tả
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Nhập mô tả dự án"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-tour-id="project-field-customer">
              <label className="block text-sm font-medium text-black mb-2">
                Khách hàng *
              </label>
              <div className="relative">
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="">Chọn khách hàng</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div data-tour-id="project-field-team">
              <label className="block text-sm font-medium text-black mb-2">
                Nhân viên *
              </label>
              <div className="relative">
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div data-tour-id="project-field-category">
            <label className="block text-sm font-medium text-black mb-2">
              Nhóm phân loại
            </label>
            <div className="relative">
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                disabled={loadingCategories}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingCategories ? 'Đang tải...' : categories.length === 0 ? 'Chưa có nhóm phân loại' : 'Chọn nhóm phân loại'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !loadingCategories && (
                <p className="mt-1 text-xs text-gray-500">
                  Chưa có nhóm phân loại. Vui lòng chạy migration hoặc tạo nhóm phân loại trong phần Quản lý nhóm.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-tour-id="project-field-start-date">
              <label className="block text-sm font-medium text-black mb-2">
                Ngày bắt đầu *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                />
              </div>
            </div>

            <div data-tour-id="project-field-end-date">
              <label className="block text-sm font-medium text-black mb-2">
                Ngày kết thúc
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-tour-id="project-field-budget">
              <label className="block text-sm font-medium text-black mb-2">
                Ngân sách
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div data-tour-id="project-field-status">
              <label className="block text-sm font-medium text-black mb-2">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  name="status_id"
                  value={formData.status_id}
                  onChange={(e) => {
                    const selectedStatusId = e.target.value
                    const selectedStatus = statuses.find(s => s.id === selectedStatusId)
                    setFormData(prev => ({
                      ...prev,
                      status_id: selectedStatusId,
                      status: selectedStatus?.name.toLowerCase().replace(/\s+/g, '_') as any || 'planning' // Fallback cho legacy
                    }))
                  }}
                  disabled={loadingStatuses}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStatuses ? (
                    <option value="">Đang tải...</option>
                  ) : statuses.length > 0 ? (
                    <>
                      <option value="">Chọn trạng thái</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="planning">Lập kế hoạch</option>
                      <option value="active">Đang hoạt động</option>
                      <option value="on_hold">Tạm dừng</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Độ ưu tiên
              </label>
              <div className="relative">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Loại thanh toán
              </label>
              <div className="relative">
                <select
                  name="billing_type"
                  value={formData.billing_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="fixed">Giá cố định</option>
                  <option value="hourly">Theo giờ</option>
                  <option value="milestone">Theo mốc</option>
                </select>
              </div>
            </div>
          </div>

          {formData.billing_type === 'hourly' && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Tỷ lệ theo giờ
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Nhóm nhiệm vụ *
            </label>
            <div className="relative">
              <select
                value={selectedTaskGroupId}
                onChange={(e) => {
                  const selectedGroupId = e.target.value
                  setSelectedTaskGroupId(selectedGroupId)
                  
                  // Khi chọn task_group, tự động chọn category tương ứng
                  if (selectedGroupId) {
                    const selectedGroup = taskGroups.find(g => g.id === selectedGroupId)
                    if (selectedGroup?.category_id) {
                      setFormData(prev => ({
                        ...prev,
                        category_id: selectedGroup.category_id
                      }))
                      console.log('✅ Auto-selected category:', selectedGroup.category_id, 'for task group:', selectedGroupId)
                    }
                  } else {
                    // Nếu bỏ chọn task_group, cũng bỏ chọn category
                    setFormData(prev => ({
                      ...prev,
                      category_id: ''
                    }))
                  }
                }}
                required
                disabled={loadingTaskGroups}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loadingTaskGroups ? 'Đang tải...' : 'Chọn nhóm'}</option>
                {taskGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Nhiệm vụ sẽ được tạo tự động trong nhóm này khi tạo dự án
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
            >
              {loading ? 'Đang tạo...' : success ? 'Đã tạo thành công!' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
