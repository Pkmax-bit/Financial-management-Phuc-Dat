/**
 * Financial Management System - Home Page
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Users, 
  Building2, 
  FolderOpen, 
  Receipt, 
  FileText, 
  BarChart3,
  DollarSign,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Financial Management System - Phuc Dat',
  description: 'Comprehensive financial management solution for businesses',
}

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Manage employee information, roles, and permissions',
      href: '/employees',
      color: 'bg-blue-500'
    },
    {
      icon: Building2,
      title: 'Customer Management',
      description: 'Track customer information and relationships',
      href: '/customers',
      color: 'bg-green-500'
    },
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Monitor project progress and budgets',
      href: '/projects',
      color: 'bg-purple-500'
    },
    {
      icon: Receipt,
      title: 'Expense Tracking',
      description: 'Track and approve business expenses',
      href: '/expenses',
      color: 'bg-orange-500'
    },
    {
      icon: FileText,
      title: 'Invoice Management',
      description: 'Create and manage customer invoices',
      href: '/invoices',
      color: 'bg-red-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'View financial reports and analytics',
      href: '/reports',
      color: 'bg-indigo-500'
    }
  ]

  const stats = [
    { label: 'Total Employees', value: '0', icon: Users },
    { label: 'Active Projects', value: '0', icon: FolderOpen },
    { label: 'Total Customers', value: '0', icon: Building2 },
    { label: 'Monthly Revenue', value: '₫0', icon: DollarSign }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Financial Management
              </h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/login" className="text-gray-500 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Welcome to Financial Management System
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Streamline your business operations with our comprehensive financial management solution
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/dashboard" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/demo" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Key Features
            </h3>
            <p className="text-lg text-gray-600">
              Everything you need to manage your business finances
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link 
                key={index} 
                href={feature.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="ml-3 text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <span className="ml-2 text-lg font-semibold">Financial Management</span>
            </div>
            <p className="text-gray-400 mb-4">
              © 2025 Financial Management System - Phuc Dat. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Built with Next.js, FastAPI, and Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}