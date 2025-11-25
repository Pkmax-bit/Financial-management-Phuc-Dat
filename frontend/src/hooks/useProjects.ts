import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/lib/api'
import { CACHE_TIME } from '@/lib/constants'

// ============================================================================
// TYPES
// ============================================================================

interface ProjectFilters {
    search?: string
    customer_id?: string
    status?: string
    skip?: number
    limit?: number
}

interface ProjectCreate {
    project_code: string
    name: string
    description?: string
    customer_id: string
    manager_id: string
    start_date: string
    end_date?: string
    budget?: number
    status: string
    priority: string
    progress: number
    billing_type: string
    hourly_rate?: number
}

interface ProjectUpdate extends Partial<ProjectCreate> { }

// ============================================================================
// QUERY KEYS
// ============================================================================

export const projectKeys = {
    all: ['projects'] as const,
    lists: () => [...projectKeys.all, 'list'] as const,
    list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
    details: () => [...projectKeys.all, 'detail'] as const,
    detail: (id: string) => [...projectKeys.details(), id] as const,
    byCustomer: (customerId: string) => [...projectKeys.all, 'by-customer', customerId] as const,
} as const

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch projects with optional filters
 * Cached for 5 minutes
 */
export const useProjects = (filters?: ProjectFilters) => {
    return useQuery({
        queryKey: projectKeys.list(filters || {}),
        queryFn: () => projectApi.getProjects(filters),
        staleTime: CACHE_TIME.MEDIUM,
        placeholderData: (previousData) => previousData, // Keep previous data while fetching
    })
}

/**
 * Hook to fetch a single project by ID
 * Cached for 5 minutes
 */
export const useProject = (projectId: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: projectKeys.detail(projectId),
        queryFn: () => projectApi.getProject(projectId),
        staleTime: CACHE_TIME.MEDIUM,
        enabled: options?.enabled !== false && !!projectId,
    })
}

/**
 * Hook to fetch projects by customer ID
 * Useful for dropdowns and customer-specific views
 */
export const useProjectsByCustomer = (customerId: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: projectKeys.byCustomer(customerId),
        queryFn: () => projectApi.getProjects({ customer_id: customerId }),
        staleTime: CACHE_TIME.MEDIUM,
        enabled: options?.enabled !== false && !!customerId,
    })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new project
 * Automatically invalidates project list queries on success
 */
export const useCreateProject = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: ProjectCreate) => projectApi.createProject(data),
        onSuccess: (newProject) => {
            // Invalidate and refetch project lists
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() })

            // Optionally set the new project in cache
            queryClient.setQueryData(
                projectKeys.detail(newProject.id),
                newProject
            )
        },
    })
}

/**
 * Hook to update an existing project
 * Uses optimistic updates for better UX
 */
export const useUpdateProject = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
            projectApi.updateProject(id, data),

        // Optimistic update
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) })

            // Snapshot the previous value
            const previousProject = queryClient.getQueryData(projectKeys.detail(id))

            // Optimistically update to the new value
            if (previousProject) {
                queryClient.setQueryData(
                    projectKeys.detail(id),
                    { ...previousProject, ...data }
                )
            }

            return { previousProject }
        },

        // If mutation fails, rollback
        onError: (err, { id }, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    projectKeys.detail(id),
                    context.previousProject
                )
            }
        },

        // Always refetch after error or success
        onSettled: (data, error, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
        },
    })
}

/**
 * Hook to delete a project
 * Automatically invalidates project queries on success
 */
export const useDeleteProject = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (projectId: string) => projectApi.deleteProject(projectId),
        onSuccess: (_, projectId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
        },
    })
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch projects for better performance
 * Useful when you know the user will navigate to projects page
 */
export const usePrefetchProjects = () => {
    const queryClient = useQueryClient()

    return (filters?: ProjectFilters) => {
        queryClient.prefetchQuery({
            queryKey: projectKeys.list(filters || {}),
            queryFn: () => projectApi.getProjects(filters),
            staleTime: CACHE_TIME.MEDIUM,
        })
    }
}

/**
 * Prefetch a single project
 */
export const usePrefetchProject = () => {
    const queryClient = useQueryClient()

    return (projectId: string) => {
        queryClient.prefetchQuery({
            queryKey: projectKeys.detail(projectId),
            queryFn: () => projectApi.getProject(projectId),
            staleTime: CACHE_TIME.MEDIUM,
        })
    }
}
