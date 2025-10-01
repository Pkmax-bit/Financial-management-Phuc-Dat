"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, TrendingDown, DollarSign, Clock, Users, Filter } from 'lucide-react';

interface ProjectProfitability {
  project_id: string;
  project_code: string;
  project_name: string;
  customer_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  progress: number;
  total_income: number;
  total_costs: number;
  profit: number;
  profit_margin: number;
  invoice_amount: number;
  sales_receipt_amount: number;
  labor_cost: number;
  expenses_cost: number;
  bills_cost: number;
  total_hours: number;
}

interface ProfitabilitySummary {
  total_projects: number;
  total_income: number;
  total_costs: number;
  total_profit: number;
  average_profit_margin: number;
  profitable_projects: number;
  loss_projects: number;
  break_even_projects: number;
  filters_applied: {
    status?: string;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
  };
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function ProjectReportsPage() {
  const [projects, setProjects] = useState<ProjectProfitability[]>([]);
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('profit');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  useEffect(() => {
    fetchProjectsReport();
    fetchSummary();
  }, [statusFilter, sortBy, sortOrder]);

  const fetchProjectsReport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const response = await fetch(`/api/reports/projects/profitability?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/reports/projects/profitability/summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-black';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (profit < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project reports...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Profitability Reports</h1>
        <p className="text-black">Analyze and compare project profitability across your portfolio</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_projects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${summary.total_income.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${summary.total_costs.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getProfitColor(summary.total_profit)}`}>
                    ${summary.total_profit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg Margin: {summary.average_profit_margin}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Profitable Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary?.profitable_projects || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {summary ? Math.round((summary.profitable_projects / summary.total_projects) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Loss Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{summary?.loss_projects || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {summary ? Math.round((summary.loss_projects / summary.total_projects) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-black">Break Even</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black">{summary?.break_even_projects || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {summary ? Math.round((summary.break_even_projects / summary.total_projects) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="profit_margin">Profit Margin</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="costs">Costs</SelectItem>
                <SelectItem value="project_name">Project Name</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Profitability Details</CardTitle>
              <CardDescription>
                Detailed financial breakdown for each project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Costs</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.project_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.project_name}</div>
                          <div className="text-sm text-black">{project.project_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{project.customer_name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{project.progress}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${project.total_income.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        ${project.total_costs.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${getProfitColor(project.profit)}`}>
                          {getProfitIcon(project.profit)}
                          ${project.profit.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getProfitColor(project.profit)}>
                          {project.profit_margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Most Profitable Projects</CardTitle>
                <CardDescription>Top 5 projects by profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProjects
                    .filter(p => p.profit > 0)
                    .sort((a, b) => b.profit - a.profit)
                    .slice(0, 5)
                    .map((project, index) => (
                      <div key={project.project_id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{project.project_name}</div>
                          <div className="text-sm text-black">{project.customer_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            ${project.profit.toLocaleString()}
                          </div>
                          <div className="text-sm text-black">
                            {project.profit_margin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Least Profitable Projects</CardTitle>
                <CardDescription>Bottom 5 projects by profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProjects
                    .filter(p => p.profit < 0)
                    .sort((a, b) => a.profit - b.profit)
                    .slice(0, 5)
                    .map((project, index) => (
                      <div key={project.project_id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{project.project_name}</div>
                          <div className="text-sm text-black">{project.customer_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            ${project.profit.toLocaleString()}
                          </div>
                          <div className="text-sm text-black">
                            {project.profit_margin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown Analysis</CardTitle>
              <CardDescription>Average cost distribution across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-black mb-2">Labor Costs</div>
                  <div className="text-2xl font-bold">
                    ${filteredProjects.reduce((sum, p) => sum + p.labor_cost, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-black">
                    Avg: ${filteredProjects.length > 0 ? (filteredProjects.reduce((sum, p) => sum + p.labor_cost, 0) / filteredProjects.length).toLocaleString() : 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black mb-2">Expenses</div>
                  <div className="text-2xl font-bold">
                    ${filteredProjects.reduce((sum, p) => sum + p.expenses_cost, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-black">
                    Avg: ${filteredProjects.length > 0 ? (filteredProjects.reduce((sum, p) => sum + p.expenses_cost, 0) / filteredProjects.length).toLocaleString() : 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black mb-2">Bills</div>
                  <div className="text-2xl font-bold">
                    ${filteredProjects.reduce((sum, p) => sum + p.bills_cost, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-black">
                    Avg: ${filteredProjects.length > 0 ? (filteredProjects.reduce((sum, p) => sum + p.bills_cost, 0) / filteredProjects.length).toLocaleString() : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
