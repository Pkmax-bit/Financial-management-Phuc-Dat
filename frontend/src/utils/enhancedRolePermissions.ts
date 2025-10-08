/**
 * Enhanced Role-Based Access Control (RBAC) System
 * Comprehensive role and permission management for the frontend
 */

export type UserRole = 
  | 'admin'
  | 'sales'
  | 'accountant'
  | 'workshop_employee'
  | 'worker'
  | 'transport'
  | 'customer'
  | 'employee';

export type Permission = 
  | 'create_project'
  | 'view_project'
  | 'edit_project'
  | 'delete_project'
  | 'create_quote'
  | 'view_quote'
  | 'edit_quote'
  | 'approve_quote'
  | 'create_invoice'
  | 'view_invoice'
  | 'edit_invoice'
  | 'pay_invoice'
  | 'create_cost'
  | 'view_cost'
  | 'edit_cost'
  | 'approve_cost'
  | 'view_customer_progress'
  | 'view_customer_projects'
  | 'view_reports'
  | 'create_reports'
  | 'manage_users'
  | 'manage_roles';

export type ProjectStage = 'planning' | 'execution' | 'completion';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  projectStageAccess: Record<ProjectStage, Permission[]>;
  features: string[];
  navigation: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  permissions: Permission[];
  children?: NavigationItem[];
  badge?: string;
  disabled?: boolean;
}

// Role hierarchy levels (higher number = more privileges)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  sales: 80,
  accountant: 70,
  workshop_employee: 60,
  worker: 50,
  transport: 40,
  customer: 30,
  employee: 20
};

// Comprehensive role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    permissions: [
      'create_project', 'view_project', 'edit_project', 'delete_project',
      'create_quote', 'view_quote', 'edit_quote', 'approve_quote',
      'create_invoice', 'view_invoice', 'edit_invoice', 'pay_invoice',
      'create_cost', 'view_cost', 'edit_cost', 'approve_cost',
      'view_customer_progress', 'view_customer_projects',
      'view_reports', 'create_reports', 'manage_users', 'manage_roles'
    ],
    projectStageAccess: {
      planning: ['create_project', 'view_project', 'edit_project', 'create_quote', 'view_quote', 'edit_quote', 'approve_quote'],
      execution: ['view_project', 'edit_project', 'create_cost', 'view_cost', 'edit_cost', 'approve_cost', 'view_customer_progress'],
      completion: ['view_project', 'view_cost', 'view_reports', 'create_reports']
    },
    features: ['customers', 'projects', 'quotes', 'invoices', 'expenses', 'reports', 'users', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_reports']
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        permissions: ['view_customer_progress', 'view_customer_projects']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'sales',
        label: 'Sales',
        path: '/sales',
        icon: 'trending_up',
        permissions: ['view_quote', 'view_invoice'],
        children: [
          {
            id: 'quotes',
            label: 'Quotes',
            path: '/sales/quotes',
            icon: 'description',
            permissions: ['view_quote']
          },
          {
            id: 'invoices',
            label: 'Invoices',
            path: '/sales/invoices',
            icon: 'receipt',
            permissions: ['view_invoice']
          }
        ]
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: 'assessment',
        permissions: ['view_reports']
      },
      {
        id: 'users',
        label: 'User Management',
        path: '/users',
        icon: 'admin_panel_settings',
        permissions: ['manage_users']
      }
    ]
  },
  
  sales: {
    role: 'sales',
    permissions: [
      'create_project', 'view_project', 'edit_project',
      'create_quote', 'view_quote', 'edit_quote', 'approve_quote',
      'view_invoice', 'view_customer_progress', 'view_customer_projects',
      'view_reports'
    ],
    projectStageAccess: {
      planning: ['create_project', 'view_project', 'edit_project', 'create_quote', 'view_quote', 'edit_quote', 'approve_quote'],
      execution: ['view_project', 'edit_project', 'view_customer_progress'],
      completion: ['view_project', 'view_reports']
    },
    features: ['customers', 'projects', 'quotes', 'reports', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_reports']
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        permissions: ['view_customer_progress', 'view_customer_projects']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'sales',
        label: 'Sales',
        path: '/sales',
        icon: 'trending_up',
        permissions: ['view_quote'],
        children: [
          {
            id: 'quotes',
            label: 'Quotes',
            path: '/sales/quotes',
            icon: 'description',
            permissions: ['view_quote']
          },
          {
            id: 'invoices',
            label: 'Invoices',
            path: '/sales/invoices',
            icon: 'receipt',
            permissions: ['view_invoice']
          }
        ]
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: 'assessment',
        permissions: ['view_reports']
      }
    ]
  },
  
  accountant: {
    role: 'accountant',
    permissions: [
      'view_project', 'view_quote', 'approve_quote',
      'create_invoice', 'view_invoice', 'edit_invoice', 'pay_invoice',
      'create_cost', 'view_cost', 'edit_cost', 'approve_cost',
      'view_customer_progress', 'view_customer_projects',
      'view_reports', 'create_reports'
    ],
    projectStageAccess: {
      planning: ['view_project', 'view_quote', 'approve_quote'],
      execution: ['view_project', 'create_cost', 'view_cost', 'edit_cost', 'approve_cost', 'view_customer_progress'],
      completion: ['view_project', 'view_cost', 'view_reports', 'create_reports']
    },
    features: ['customers', 'projects', 'quotes', 'invoices', 'expenses', 'reports', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_reports']
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        permissions: ['view_customer_progress', 'view_customer_projects']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'sales',
        label: 'Sales',
        path: '/sales',
        icon: 'trending_up',
        permissions: ['view_quote', 'view_invoice'],
        children: [
          {
            id: 'quotes',
            label: 'Quotes',
            path: '/sales/quotes',
            icon: 'description',
            permissions: ['view_quote']
          },
          {
            id: 'invoices',
            label: 'Invoices',
            path: '/sales/invoices',
            icon: 'receipt',
            permissions: ['view_invoice']
          }
        ]
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: 'assessment',
        permissions: ['view_reports']
      }
    ]
  },
  
  workshop_employee: {
    role: 'workshop_employee',
    permissions: [
      'view_project', 'create_cost', 'view_cost', 'edit_cost'
    ],
    projectStageAccess: {
      planning: ['view_project'],
      execution: ['view_project', 'create_cost', 'view_cost', 'edit_cost'],
      completion: ['view_project', 'view_cost']
    },
    features: ['projects', 'expenses', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_cost']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      }
    ]
  },
  
  worker: {
    role: 'worker',
    permissions: [
      'view_project', 'create_cost', 'view_cost', 'edit_cost'
    ],
    projectStageAccess: {
      planning: ['view_project'],
      execution: ['view_project', 'create_cost', 'view_cost', 'edit_cost'],
      completion: ['view_project', 'view_cost']
    },
    features: ['projects', 'expenses', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_cost']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      }
    ]
  },
  
  transport: {
    role: 'transport',
    permissions: [
      'view_project', 'create_cost', 'view_cost', 'edit_cost'
    ],
    projectStageAccess: {
      planning: ['view_project'],
      execution: ['view_project', 'create_cost', 'view_cost', 'edit_cost'],
      completion: ['view_project', 'view_cost']
    },
    features: ['projects', 'expenses', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_cost']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      }
    ]
  },
  
  customer: {
    role: 'customer',
    permissions: [
      'view_customer_progress', 'view_customer_projects',
      'view_quote', 'approve_quote', 'view_invoice', 'pay_invoice'
    ],
    projectStageAccess: {
      planning: ['view_customer_projects', 'view_quote', 'approve_quote'],
      execution: ['view_customer_progress', 'view_customer_projects', 'view_invoice', 'pay_invoice'],
      completion: ['view_customer_progress', 'view_customer_projects']
    },
    features: ['projects', 'quotes', 'invoices', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'My Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_customer_progress']
      },
      {
        id: 'projects',
        label: 'My Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_customer_projects']
      },
      {
        id: 'quotes',
        label: 'Quotes',
        path: '/quotes',
        icon: 'description',
        permissions: ['view_quote']
      },
      {
        id: 'invoices',
        label: 'Invoices',
        path: '/invoices',
        icon: 'receipt',
        permissions: ['view_invoice']
      }
    ]
  },
  
  employee: {
    role: 'employee',
    permissions: [
      'view_project', 'create_cost', 'view_cost', 'edit_cost'
    ],
    projectStageAccess: {
      planning: ['view_project'],
      execution: ['view_project', 'create_cost', 'view_cost', 'edit_cost'],
      completion: ['view_project', 'view_cost']
    },
    features: ['projects', 'expenses', 'dashboard'],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: ['view_cost']
      },
      {
        id: 'projects',
        label: 'Projects',
        path: '/projects',
        icon: 'work',
        permissions: ['view_project']
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        icon: 'money_off',
        permissions: ['view_cost']
      }
    ]
  }
};

// Utility functions
export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee;
};

export const hasPermission = (userRole: UserRole, permission: Permission, projectStage?: ProjectStage): boolean => {
  const rolePermissions = getRolePermissions(userRole);
  
  // Check general permissions
  if (rolePermissions.permissions.includes(permission)) {
    return true;
  }
  
  // Check project stage specific permissions
  if (projectStage && rolePermissions.projectStageAccess[projectStage]?.includes(permission)) {
    return true;
  }
  
  return false;
};

export const hasFeatureAccess = (userRole: UserRole, feature: string): boolean => {
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.features.includes(feature);
};

export const getAccessibleNavigation = (userRole: UserRole): NavigationItem[] => {
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.navigation.filter(item => 
    item.permissions.some(permission => hasPermission(userRole, permission))
  );
};

export const canAccessRoute = (userRole: UserRole, path: string): boolean => {
  const navigation = getAccessibleNavigation(userRole);
  
  const checkPath = (items: NavigationItem[]): boolean => {
    return items.some(item => {
      if (item.path === path) return true;
      if (item.children) return checkPath(item.children);
      return false;
    });
  };
  
  return checkPath(navigation);
};

export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role] || 0;
};

export const hasHigherOrEqualRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};

// Role-based feature access
export const getAccessibleFeatures = (userRole: UserRole): string[] => {
  return getRolePermissions(userRole).features;
};

// Project stage access
export const canAccessProjectStage = (userRole: UserRole, projectStage: ProjectStage): boolean => {
  const rolePermissions = getRolePermissions(userRole);
  return projectStage in rolePermissions.projectStageAccess;
};

export const getProjectStagePermissions = (userRole: UserRole, projectStage: ProjectStage): Permission[] => {
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.projectStageAccess[projectStage] || [];
};
