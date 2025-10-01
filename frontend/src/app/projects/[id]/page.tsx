"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, DollarSign, Clock, Users, TrendingUp, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  customer_id: string;
  customer_name?: string;
  manager_id: string;
  manager_name?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  billing_type: 'fixed' | 'hourly' | 'milestone';
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

interface FinancialSummary {
  project: Project;
  customer: any;
  financial_summary: {
    total_income: number;
    total_paid_income: number;
    outstanding_income: number;
    total_costs: number;
    gross_profit: number;
    net_profit: number;
    gross_profit_margin: number;
    net_profit_margin: number;
  };
  income_breakdown: {
    invoices: {
      total_amount: number;
      paid_amount: number;
      outstanding: number;
      count: number;
    };
    sales_receipts: {
      total_amount: number;
      count: number;
    };
  };
  costs_breakdown: {
    labor: {
      total_hours: number;
      total_cost: number;
      average_hourly_rate: number;
    };
    expenses: {
      total_cost: number;
      count: number;
    };
    bills: {
      total_amount: number;
      paid_amount: number;
      outstanding: number;
      count: number;
    };
  };
  budget_analysis: {
    allocated: number;
    actual_costs: number;
    variance: number;
    utilization_percentage: number;
  };
  recent_transactions: any[];
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchFinancialSummary();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/financial-summary`);
      if (response.ok) {
        const data = await response.json();
        setFinancialSummary(data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-black">{project.project_code}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={statusColors[project.status]}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <Progress value={project.progress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Priority</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={priorityColors[project.priority]}>
                  {project.priority.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.budget?.toLocaleString() || 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-black">Description</label>
                  <p className="text-sm mt-1">{project.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-black">Customer</label>
                  <p className="text-sm mt-1">{project.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-black">Project Manager</label>
                  <p className="text-sm mt-1">{project.manager_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-black">Billing Type</label>
                  <p className="text-sm mt-1 capitalize">{project.billing_type.replace('_', ' ')}</p>
                </div>
                {project.hourly_rate && (
                  <div>
                    <label className="text-sm font-medium text-black">Hourly Rate</label>
                    <p className="text-sm mt-1">${project.hourly_rate}/hour</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-black" />
                  <div>
                    <label className="text-sm font-medium text-black">Start Date</label>
                    <p className="text-sm">{format(new Date(project.start_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                {project.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-black" />
                    <div>
                      <label className="text-sm font-medium text-black">End Date</label>
                      <p className="text-sm">{format(new Date(project.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-black" />
                  <div>
                    <label className="text-sm font-medium text-black">Created</label>
                    <p className="text-sm">{format(new Date(project.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {financialSummary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financialSummary.financial_summary.total_income.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Outstanding: ${financialSummary.financial_summary.outstanding_income.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financialSummary.financial_summary.total_costs.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financialSummary.financial_summary.gross_profit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margin: {financialSummary.financial_summary.gross_profit_margin}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financialSummary.financial_summary.net_profit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margin: {financialSummary.financial_summary.net_profit_margin}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-black">Invoices</label>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Total: ${financialSummary.income_breakdown.invoices.total_amount.toLocaleString()}</span>
                        <span className="text-sm">Count: {financialSummary.income_breakdown.invoices.count}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-green-600">Paid: ${financialSummary.income_breakdown.invoices.paid_amount.toLocaleString()}</span>
                        <span className="text-sm text-orange-600">Outstanding: ${financialSummary.income_breakdown.invoices.outstanding.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Sales Receipts</label>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Total: ${financialSummary.income_breakdown.sales_receipts.total_amount.toLocaleString()}</span>
                        <span className="text-sm">Count: {financialSummary.income_breakdown.sales_receipts.count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Costs Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-black">Labor</label>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Hours: {financialSummary.costs_breakdown.labor.total_hours}</span>
                        <span className="text-sm">Cost: ${financialSummary.costs_breakdown.labor.total_cost.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-black mt-1">
                        Avg Rate: ${financialSummary.costs_breakdown.labor.average_hourly_rate.toFixed(2)}/hour
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Expenses</label>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Cost: ${financialSummary.costs_breakdown.expenses.total_cost.toLocaleString()}</span>
                        <span className="text-sm">Count: {financialSummary.costs_breakdown.expenses.count}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Bills</label>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Total: ${financialSummary.costs_breakdown.bills.total_amount.toLocaleString()}</span>
                        <span className="text-sm">Count: {financialSummary.costs_breakdown.bills.count}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-green-600">Paid: ${financialSummary.costs_breakdown.bills.paid_amount.toLocaleString()}</span>
                        <span className="text-sm text-orange-600">Outstanding: ${financialSummary.costs_breakdown.bills.outstanding.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-black">Allocated Budget</label>
                      <p className="text-lg font-semibold">${financialSummary.budget_analysis.allocated.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Actual Costs</label>
                      <p className="text-lg font-semibold">${financialSummary.budget_analysis.actual_costs.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black">Variance</label>
                      <p className={`text-lg font-semibold ${financialSummary.budget_analysis.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${financialSummary.budget_analysis.variance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-black">Budget Utilization</label>
                    <Progress value={financialSummary.budget_analysis.utilization_percentage} className="mt-2" />
                    <p className="text-sm text-black mt-1">
                      {financialSummary.budget_analysis.utilization_percentage.toFixed(1)}% of budget used
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-black">Financial data not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-black">Team information will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-black">Timeline information will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
