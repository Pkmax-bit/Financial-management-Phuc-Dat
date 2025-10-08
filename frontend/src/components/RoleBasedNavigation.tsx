/**
 * Role-Based Navigation Component
 * Dynamically renders navigation based on user role and permissions
 */

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard,
  People,
  Work,
  TrendingUp,
  MoneyOff,
  Assessment,
  AdminPanelSettings,
  Description,
  Receipt,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { 
  UserRole, 
  NavigationItem, 
  getAccessibleNavigation, 
  hasPermission,
  getRolePermissions 
} from '@/utils/enhancedRolePermissions';

interface RoleBasedNavigationProps {
  userRole: UserRole;
  open: boolean;
  onClose: () => void;
  currentPath?: string;
}

const iconMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  people: People,
  work: Work,
  trending_up: TrendingUp,
  money_off: MoneyOff,
  assessment: Assessment,
  admin_panel_settings: AdminPanelSettings,
  description: Description,
  receipt: Receipt
};

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  userRole,
  open,
  onClose,
  currentPath = '/'
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const rolePermissions = getRolePermissions(userRole);
  const navigationItems = getAccessibleNavigation(userRole);

  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      // Toggle expansion for items with children
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedItems(newExpanded);
    } else {
      // Navigate to the item
      router.push(item.path);
      if (isMobile) {
        onClose();
      }
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const IconComponent = iconMap[item.icon] || MenuIcon;
    const isExpanded = expandedItems.has(item.id);
    const isActive = currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              pl: 2 + level * 2,
              backgroundColor: isActive ? theme.palette.primary.light : 'transparent',
              color: isActive ? theme.palette.primary.contrastText : 'inherit',
              '&:hover': {
                backgroundColor: isActive 
                  ? theme.palette.primary.light 
                  : theme.palette.action.hover
              },
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer'
            }}
            disabled={item.disabled}
          >
            <ListItemIcon sx={{ color: isActive ? theme.palette.primary.contrastText : 'inherit' }}>
              <IconComponent />
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              secondary={item.badge ? (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              ) : undefined}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && isExpanded && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Financial Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Role: {rolePermissions.role.charAt(0).toUpperCase() + rolePermissions.role.slice(1)}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Accessible Features: {rolePermissions.features.join(', ')}
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          position: 'relative',
          whiteSpace: 'nowrap',
          width: 280,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default RoleBasedNavigation;
