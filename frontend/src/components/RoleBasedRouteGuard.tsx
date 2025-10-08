/**
 * Role-Based Route Guard Component
 * Protects routes based on user role and permissions
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Alert,
  Button,
  Paper
} from '@mui/material';
import { 
  UserRole, 
  canAccessRoute, 
  hasPermission, 
  getRolePermissions,
  Permission 
} from '@/utils/enhancedRolePermissions';

interface RoleBasedRouteGuardProps {
  children: React.ReactNode;
  userRole: UserRole | null;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  requiredFeature?: string;
  fallbackPath?: string;
  loading?: boolean;
}

const RoleBasedRouteGuard: React.FC<RoleBasedRouteGuardProps> = ({
  children,
  userRole,
  requiredRole,
  requiredPermission,
  requiredFeature,
  fallbackPath = '/dashboard',
  loading = false
}) => {
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      if (loading) {
        setIsChecking(true);
        return;
      }

      if (!userRole) {
        setAccessDenied(true);
        setIsChecking(false);
        return;
      }

      // Check role-based access
      if (requiredRole && userRole !== requiredRole) {
        const rolePermissions = getRolePermissions(userRole);
        const requiredPermissions = getRolePermissions(requiredRole);
        
        // Check if user has higher or equal role level
        const userLevel = rolePermissions.role === 'admin' ? 100 : 
                         rolePermissions.role === 'sales' ? 80 :
                         rolePermissions.role === 'accountant' ? 70 : 50;
        const requiredLevel = requiredPermissions.role === 'admin' ? 100 :
                             requiredPermissions.role === 'sales' ? 80 :
                             requiredPermissions.role === 'accountant' ? 70 : 50;
        
        if (userLevel < requiredLevel) {
          setAccessDenied(true);
          setIsChecking(false);
          return;
        }
      }

      // Check permission-based access
      if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
        setAccessDenied(true);
        setIsChecking(false);
        return;
      }

      // Check feature-based access
      if (requiredFeature) {
        const rolePermissions = getRolePermissions(userRole);
        if (!rolePermissions.features.includes(requiredFeature)) {
          setAccessDenied(true);
          setIsChecking(false);
          return;
        }
      }

      // Check route-based access
      const currentPath = window.location.pathname;
      if (!canAccessRoute(userRole, currentPath)) {
        setAccessDenied(true);
        setIsChecking(false);
        return;
      }

      setAccessDenied(false);
      setIsChecking(false);
    };

    checkAccess();
  }, [userRole, requiredRole, requiredPermission, requiredFeature, loading, router]);

  const handleGoBack = () => {
    router.push(fallbackPath);
  };

  if (loading || isChecking) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        p={3}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body2">
              You don't have permission to access this page.
            </Typography>
          </Alert>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your current role: <strong>{userRole}</strong>
            </Typography>
            {requiredRole && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Required role: <strong>{requiredRole}</strong>
              </Typography>
            )}
            {requiredPermission && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Required permission: <strong>{requiredPermission}</strong>
              </Typography>
            )}
            {requiredFeature && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Required feature: <strong>{requiredFeature}</strong>
              </Typography>
            )}
          </Box>

          <Button 
            variant="contained" 
            onClick={handleGoBack}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRouteGuard;
