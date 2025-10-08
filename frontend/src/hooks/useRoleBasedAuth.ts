/**
 * Role-Based Authentication Hook
 * Manages user authentication, role, and permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserRole, 
  Permission, 
  getRolePermissions, 
  hasPermission, 
  hasFeatureAccess,
  getAccessibleNavigation,
  canAccessRoute,
  getAccessibleFeatures
} from '@/utils/enhancedRolePermissions';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RoleInfo {
  role: UserRole;
  permissions: string[];
  features: string[];
  navigation: any[];
  canManageCustomers: boolean;
  canManageProjects: boolean;
  canAccessFinancial: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

export const useRoleBasedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication'
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      router.push('/login');
    }
  }, [router]);

  // Get user permissions
  const getUserPermissions = useCallback((): Permission[] => {
    if (!authState.user) return [];
    const rolePermissions = getRolePermissions(authState.user.role);
    return rolePermissions.permissions;
  }, [authState.user]);

  // Get user role info
  const getUserRoleInfo = useCallback((): RoleInfo | null => {
    if (!authState.user) return null;
    
    const rolePermissions = getRolePermissions(authState.user.role);
    
    return {
      role: authState.user.role,
      permissions: rolePermissions.permissions,
      features: rolePermissions.features,
      navigation: getAccessibleNavigation(authState.user.role),
      canManageCustomers: hasFeatureAccess(authState.user.role, 'customers'),
      canManageProjects: hasFeatureAccess(authState.user.role, 'projects'),
      canAccessFinancial: ['admin', 'accountant', 'sales'].includes(authState.user.role),
      canViewReports: hasFeatureAccess(authState.user.role, 'reports'),
      canManageUsers: hasFeatureAccess(authState.user.role, 'users')
    };
  }, [authState.user]);

  // Check if user has permission
  const hasUserPermission = useCallback((permission: Permission): boolean => {
    if (!authState.user) return false;
    return hasPermission(authState.user.role, permission);
  }, [authState.user]);

  // Check if user has feature access
  const hasUserFeatureAccess = useCallback((feature: string): boolean => {
    if (!authState.user) return false;
    return hasFeatureAccess(authState.user.role, feature);
  }, [authState.user]);

  // Check if user can access route
  const canUserAccessRoute = useCallback((path: string): boolean => {
    if (!authState.user) return false;
    return canAccessRoute(authState.user.role, path);
  }, [authState.user]);

  // Get accessible navigation
  const getAccessibleNavigationItems = useCallback(() => {
    if (!authState.user) return [];
    return getAccessibleNavigation(authState.user.role);
  }, [authState.user]);

  // Get accessible features
  const getAccessibleFeaturesList = useCallback(() => {
    if (!authState.user) return [];
    return getAccessibleFeatures(authState.user.role);
  }, [authState.user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return authState.user?.role === 'admin';
  }, [authState.user]);

  // Check if user is manager (sales or accountant)
  const isManager = useCallback((): boolean => {
    return authState.user?.role === 'sales' || authState.user?.role === 'accountant';
  }, [authState.user]);

  // Check if user is employee
  const isEmployee = useCallback((): boolean => {
    return authState.user?.role !== 'customer';
  }, [authState.user]);

  // Check if user is customer
  const isCustomer = useCallback((): boolean => {
    return authState.user?.role === 'customer';
  }, [authState.user]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!authState.user) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/customers/user-permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...authState.user, ...data.user };
        
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [authState.user]);

  return {
    // Auth state
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    
    // Auth actions
    login,
    logout,
    refreshUserData,
    
    // Permission checks
    hasPermission: hasUserPermission,
    hasFeatureAccess: hasUserFeatureAccess,
    canAccessRoute: canUserAccessRoute,
    getUserPermissions,
    getUserRoleInfo,
    getAccessibleNavigation: getAccessibleNavigationItems,
    getAccessibleFeatures: getAccessibleFeaturesList,
    
    // Role checks
    isAdmin,
    isManager,
    isEmployee,
    isCustomer,
    
    // Utility functions
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  };
};
