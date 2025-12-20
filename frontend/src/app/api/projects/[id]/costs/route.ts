import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // Fetch project costs from database
    const { data: projectCosts, error } = await supabase
      .from('project_costs')
      .select(`
        *,
        cost_categories(name, type),
        employees(name, position)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching project costs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch project costs' },
        { status: 500 }
      )
    }
    
    // Get project budget
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('budget')
      .eq('id', projectId)
      .single()
    
    if (projectError) {
      console.error('Error fetching project:', projectError)
    }
    
    // Calculate cost breakdown
    const costBreakdown = calculateCostBreakdown(projectCosts || [])
    
    // Get recent expenses (last 10)
    const recentExpenses = (projectCosts || []).slice(0, 10).map(cost => ({
      id: cost.id,
      amount: cost.amount,
      description: cost.description,
      vendor: cost.vendor,
      cost_date: cost.cost_date,
      status: cost.status,
      ai_generated: cost.ai_generated,
      ai_confidence: cost.ai_confidence,
      cost_categories: cost.cost_categories
    }))
    
    const costData = {
      totalCost: costBreakdown.totalCost,
      laborCosts: costBreakdown.laborCosts,
      materialCosts: costBreakdown.materialCosts,
      serviceCosts: costBreakdown.serviceCosts,
      overheadCosts: costBreakdown.overheadCosts,
      costBreakdown: costBreakdown.costBreakdown,
      budgetedCost: project?.budget || 0,
      actualCost: costBreakdown.totalCost,
      variance: costBreakdown.totalCost - (project?.budget || 0),
      recentExpenses
    }
    
    return NextResponse.json({
      success: true,
      costData
    })
    
  } catch (error) {
    console.error('Error in project costs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateCostBreakdown(costs: any[]) {
  const breakdown = {
    totalCost: 0,
    laborCosts: 0,
    materialCosts: 0,
    serviceCosts: 0,
    overheadCosts: 0,
    costBreakdown: {
      labor: 0,
      material: 0,
      service: 0,
      overhead: 0
    }
  }
  
  costs.forEach(cost => {
    breakdown.totalCost += cost.amount || 0
    
    switch (cost.cost_categories?.type) {
      case 'labor':
        breakdown.laborCosts += cost.amount || 0
        breakdown.costBreakdown.labor += cost.amount || 0
        break
      case 'material':
        breakdown.materialCosts += cost.amount || 0
        breakdown.costBreakdown.material += cost.amount || 0
        break
      case 'service':
        breakdown.serviceCosts += cost.amount || 0
        breakdown.costBreakdown.service += cost.amount || 0
        break
      case 'overhead':
        breakdown.overheadCosts += cost.amount || 0
        breakdown.costBreakdown.overhead += cost.amount || 0
        break
      default:
        // Default to service for unknown types
        breakdown.serviceCosts += cost.amount || 0
        breakdown.costBreakdown.service += cost.amount || 0
        break
    }
  })
  
  return breakdown
}
