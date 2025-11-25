import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

interface Project {
    id: string
    name: string
    project_code: string
    status: string
    customer_id: string
    manager_id: string
    // Add other project fields as needed
}

interface ProjectState {
    // UI State
    selectedProject: Project | null
    showCreateModal: boolean
    showEditSidebar: boolean
    showDetailSidebar: boolean

    // Filters
    searchQuery: string
    statusFilter: string | null
    customerFilter: string | null

    // Actions
    setSelectedProject: (project: Project | null) => void
    setShowCreateModal: (show: boolean) => void
    setShowEditSidebar: (show: boolean) => void
    setShowDetailSidebar: (show: boolean) => void

    setSearchQuery: (query: string) => void
    setStatusFilter: (status: string | null) => void
    setCustomerFilter: (customerId: string | null) => void

    // Combined actions
    openCreateModal: () => void
    openEditModal: (project: Project) => void
    openDetailModal: (project: Project) => void
    closeAllModals: () => void

    // Reset
    reset: () => void
}

// ============================================================================
// STORE
// ============================================================================

export const useProjectStore = create<ProjectState>()(
    devtools(
        (set) => ({
            // Initial state
            selectedProject: null,
            showCreateModal: false,
            showEditSidebar: false,
            showDetailSidebar: false,
            searchQuery: '',
            statusFilter: null,
            customerFilter: null,

            // Basic setters
            setSelectedProject: (project) => set({ selectedProject: project }),
            setShowCreateModal: (show) => set({ showCreateModal: show }),
            setShowEditSidebar: (show) => set({ showEditSidebar: show }),
            setShowDetailSidebar: (show) => set({ showDetailSidebar: show }),

            setSearchQuery: (query) => set({ searchQuery: query }),
            setStatusFilter: (status) => set({ statusFilter: status }),
            setCustomerFilter: (customerId) => set({ customerFilter: customerId }),

            // Combined actions
            openCreateModal: () => set({
                showCreateModal: true,
                showEditSidebar: false,
                showDetailSidebar: false,
                selectedProject: null,
            }),

            openEditModal: (project) => set({
                selectedProject: project,
                showEditSidebar: true,
                showCreateModal: false,
                showDetailSidebar: false,
            }),

            openDetailModal: (project) => set({
                selectedProject: project,
                showDetailSidebar: true,
                showCreateModal: false,
                showEditSidebar: false,
            }),

            closeAllModals: () => set({
                showCreateModal: false,
                showEditSidebar: false,
                showDetailSidebar: false,
                selectedProject: null,
            }),

            // Reset all to initial state
            reset: () => set({
                selectedProject: null,
                showCreateModal: false,
                showEditSidebar: false,
                showDetailSidebar: false,
                searchQuery: '',
                statusFilter: null,
                customerFilter: null,
            }),
        }),
        { name: 'ProjectStore' }
    )
)

// ============================================================================
// SELECTORS (for better performance)
// ============================================================================

export const useProjectFilters = () => useProjectStore((state) => ({
    search: state.searchQuery,
    status: state.statusFilter,
    customer_id: state.customerFilter,
}))

export const useProjectModals = () => useProjectStore((state) => ({
    showCreate: state.showCreateModal,
    showEdit: state.showEditSidebar,
    showDetail: state.showDetailSidebar,
    openCreate: state.openCreateModal,
    openEdit: state.openEditModal,
    openDetail: state.openDetailModal,
    closeAll: state.closeAllModals,
}))
