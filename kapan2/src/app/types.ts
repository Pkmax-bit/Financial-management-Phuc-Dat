// Status types
export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  type: 'individual' | 'company';
  creditLimit?: number;
  statusId: string;
  assignedTo: string;
  avatar?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  id: string;
  code: string;
  name: string;
  customerId: string;
  customerName: string;
  managerId: string;
  managerName: string;
  budget: number;
  progress: number;
  statusId: string;
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  createdAt: string;
}

// Quote types
export interface Quote {
  id: string;
  quoteNumber: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  validUntil: string;
  statusId: string;
  assignedTo: string;
  assignedToName: string;
  createdAt: string;
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  statusId: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
}

// View type
export type ViewType = 'kanban' | 'list';

// Module type
export type ModuleType = 'customers' | 'projects' | 'quotes' | 'invoices';
