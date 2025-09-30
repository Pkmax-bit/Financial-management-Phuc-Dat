/**
 * Dashboard Hooks
 * Custom React hooks for dashboard state management and data fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardService, type DashboardStats, type CashflowProjection, type PlannerEvent } from '@/services/dashboardService'

// Hook for dashboard stats
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Use ref to track if component is mounted
  const mountedRef = useRef(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await dashboardService.getDashboardStats()
      
      if (mountedRef.current) {
        setStats(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
        setError(errorMessage)
        console.error('Dashboard stats error:', err)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchStats()

    const interval = setInterval(() => {
      if (mountedRef.current && !loading) {
        fetchStats()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
      mountedRef.current = false
    }
  }, [fetchStats, loading])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh
  }
}

// Hook for cashflow projection
export function useCashflowProjection(months: number = 6) {
  const [projection, setProjection] = useState<CashflowProjection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await dashboardService.getCashflowProjection(months)
      setProjection(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cashflow projection'
      setError(errorMessage)
      console.error('Cashflow projection error:', err)
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchProjection()
  }, [fetchProjection])

  return {
    projection,
    loading,
    error,
    refresh: fetchProjection
  }
}

// Hook for planner events
export function usePlannerEvents() {
  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await dashboardService.getPlannerEvents()
      setEvents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load planner events'
      setError(errorMessage)
      console.error('Planner events error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refresh: fetchEvents
  }
}

// Hook for what-if scenario calculations
export function useScenarioCalculator() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateScenario = useCallback(async (scenarioData: {
    revenue_change: number
    expense_change: number
    new_expense: number
    months: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await dashboardService.calculateScenario(scenarioData)
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate scenario'
      setError(errorMessage)
      console.error('Scenario calculation error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resetScenario = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    result,
    loading,
    error,
    calculateScenario,
    resetScenario
  }
}

// Hook for real-time dashboard updates
export function useRealtimeDashboard() {
  const [isRealtime, setIsRealtime] = useState(false)
  const statsHook = useDashboardStats()

  // Enable/disable real-time updates
  const toggleRealtime = useCallback(() => {
    setIsRealtime(prev => !prev)
  }, [])

  // More frequent updates when real-time is enabled
  useEffect(() => {
    if (!isRealtime) return

    const interval = setInterval(() => {
      statsHook.refresh()
    }, 30 * 1000) // 30 seconds

    return () => clearInterval(interval)
  }, [isRealtime, statsHook.refresh])

  return {
    ...statsHook,
    isRealtime,
    toggleRealtime
  }
}

// Hook for dashboard widget management
export function useDashboardWidgets() {
  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'stats',
    'charts',
    'planner',
    'accounts'
  ])
  const [widgetSettings, setWidgetSettings] = useState<Record<string, any>>({})

  const toggleWidget = useCallback((widgetId: string) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  const updateWidgetSettings = useCallback((widgetId: string, settings: any) => {
    setWidgetSettings(prev => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], ...settings }
    }))
  }, [])

  const isWidgetActive = useCallback((widgetId: string) => {
    return activeWidgets.includes(widgetId)
  }, [activeWidgets])

  return {
    activeWidgets,
    widgetSettings,
    toggleWidget,
    updateWidgetSettings,
    isWidgetActive
  }
}

// Hook for dashboard filters and date ranges
export function useDashboardFilters() {
  const [dateRange, setDateRange] = useState<{
    start: Date
    end: Date
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })
  
  const [filters, setFilters] = useState({
    customer: null as string | null,
    category: null as string | null,
    status: null as string | null
  })

  const updateDateRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end })
  }, [])

  const updateFilter = useCallback((key: string, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      customer: null,
      category: null,
      status: null
    })
  }, [])

  return {
    dateRange,
    filters,
    updateDateRange,
    updateFilter,
    clearFilters
  }
}

// Main dashboard hook that combines everything
export function useDashboard() {
  const stats = useDashboardStats()
  const cashflow = useCashflowProjection()
  const events = usePlannerEvents()
  const widgets = useDashboardWidgets()
  const filters = useDashboardFilters()
  const scenario = useScenarioCalculator()

  // Global refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      stats.refresh(),
      cashflow.refresh(),
      events.refresh()
    ])
  }, [stats.refresh, cashflow.refresh, events.refresh])

  // Check if any data is loading
  const isLoading = stats.loading || cashflow.loading || events.loading

  // Check if there are any errors
  const hasErrors = !!(stats.error || cashflow.error || events.error)

  return {
    stats,
    cashflow,
    events,
    widgets,
    filters,
    scenario,
    isLoading,
    hasErrors,
    refreshAll
  }
}