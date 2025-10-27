/**
 * Utility functions for role-based expense object filtering and selection
 * Centralized logic for handling user roles and expense object permissions
 */

export interface ExpenseObject {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  parent_id?: string;
  is_parent?: boolean;
  role?: string;
}

export interface UserRole {
  role: string;
  full_name: string;
  email: string;
}

/**
 * Role-based filtering logic
 */
export class ExpenseObjectRoleFilter {
  /**
   * Filter expense objects based on user role
   * @param expenseObjects - Array of expense objects to filter
   * @param userRole - User's role
   * @returns Filtered array of expense objects
   */
  static filterByRole(expenseObjects: ExpenseObject[], userRole: string): ExpenseObject[] {
    console.log(`🔍 [ExpenseObjectRoleFilter] Filtering ${expenseObjects.length} objects for role: ${userRole}`);
    
    // Admin, accountant, sales see all objects
    if (['admin', 'accountant', 'sales'].includes(userRole)) {
      console.log('✅ [ExpenseObjectRoleFilter] Admin/accountant/sales: showing all objects');
      return expenseObjects;
    }
    
    // Customer sees no objects
    if (userRole === 'customer') {
      console.log('❌ [ExpenseObjectRoleFilter] Customer: showing no objects');
      return [];
    }
    
    // Filter by exact role match
    const filteredObjects = expenseObjects.filter(obj => {
      // Objects without role are excluded (strict filtering)
      if (!obj.role || obj.role.trim() === '') {
        console.log(`❌ [ExpenseObjectRoleFilter] Object "${obj.name}" has no role - excluding`);
        return false;
      }
      
      // Exact role match required
      const hasAccess = obj.role === userRole;
      console.log(`🔍 [ExpenseObjectRoleFilter] Object "${obj.name}" (role: ${obj.role}) vs User (role: ${userRole}) = ${hasAccess ? 'ALLOW' : 'DENY'}`);
      return hasAccess;
    });
    
    console.log(`📊 [ExpenseObjectRoleFilter] Filtered ${filteredObjects.length} objects for role ${userRole}:`, 
      filteredObjects.map(o => `${o.name}(${o.role})`));
    
    return filteredObjects;
  }

  /**
   * Auto-select children objects for actual expenses
   * @param expenseObjects - Array of expense objects
   * @param userRole - User's role
   * @param category - Expense category ('actual' or 'planned')
   * @returns Array of selected object IDs
   */
  static autoSelectObjects(
    expenseObjects: ExpenseObject[], 
    userRole: string, 
    category: string
  ): string[] {
    console.log(`🎯 [ExpenseObjectRoleFilter] Auto-selecting objects for role: ${userRole}, category: ${category}`);
    
    // Only auto-select for actual expenses
    if (category !== 'actual') {
      console.log('📋 [ExpenseObjectRoleFilter] Planned expenses - no auto-selection');
      return [];
    }
    
    // Find children objects (objects with parent_id)
    const childrenObjects = expenseObjects.filter(obj => obj.parent_id);
    
    if (childrenObjects.length === 0) {
      console.log('⚠️ [ExpenseObjectRoleFilter] No children objects found');
      return [];
    }
    
    const selectedIds = childrenObjects.map(obj => obj.id);
    console.log(`✅ [ExpenseObjectRoleFilter] Auto-selected ${selectedIds.length} children objects:`, 
      childrenObjects.map(o => o.name));
    
    return selectedIds;
  }

  /**
   * Find parent object for children
   * @param expenseObjects - Array of expense objects
   * @param selectedIds - Array of selected object IDs
   * @returns Parent object if found
   */
  static findParentObject(expenseObjects: ExpenseObject[], selectedIds: string[]): ExpenseObject | null {
    if (selectedIds.length === 0) {
      return null;
    }
    
    // Find first selected object to get its parent
    const firstSelected = expenseObjects.find(obj => selectedIds.includes(obj.id));
    if (!firstSelected || !firstSelected.parent_id) {
      return null;
    }
    
    // Find parent object
    const parentObject = expenseObjects.find(obj => obj.id === firstSelected.parent_id);
    if (parentObject) {
      console.log(`🔍 [ExpenseObjectRoleFilter] Found parent object: ${parentObject.name}`);
    }
    
    return parentObject || null;
  }

  /**
   * Get expense objects for specific role and category
   * @param allExpenseObjects - All available expense objects
   * @param userRole - User's role
   * @param category - Expense category
   * @returns Object containing filtered objects and auto-selected IDs
   */
  static getExpenseObjectsForRole(
    allExpenseObjects: ExpenseObject[],
    userRole: string,
    category: string
  ): {
    filteredObjects: ExpenseObject[];
    selectedIds: string[];
    parentObject: ExpenseObject | null;
  } {
    console.log(`🚀 [ExpenseObjectRoleFilter] Getting expense objects for role: ${userRole}, category: ${category}`);
    
    // Step 1: Filter objects by role
    const filteredObjects = this.filterByRole(allExpenseObjects, userRole);
    
    // Step 2: Auto-select children objects
    const selectedIds = this.autoSelectObjects(filteredObjects, userRole, category);
    
    // Step 3: Find parent object
    const parentObject = this.findParentObject(filteredObjects, selectedIds);
    
    console.log(`📊 [ExpenseObjectRoleFilter] Final result:`, {
      filteredCount: filteredObjects.length,
      selectedCount: selectedIds.length,
      hasParent: !!parentObject
    });
    
    return {
      filteredObjects,
      selectedIds,
      parentObject
    };
  }
}

/**
 * Hook for managing expense object role filtering
 */
export const useExpenseObjectRoleFilter = () => {
  /**
   * Process expense objects based on user role and category
   * @param expenseObjects - All expense objects
   * @param userRole - User's role
   * @param category - Expense category
   * @param isEdit - Whether in edit mode
   * @returns Processed expense objects and selections
   */
  const processExpenseObjects = (
    expenseObjects: ExpenseObject[],
    userRole: string,
    category: string,
    isEdit: boolean = false
  ) => {
    console.log(`🔄 [useExpenseObjectRoleFilter] Processing expense objects:`, {
      totalObjects: expenseObjects.length,
      userRole,
      category,
      isEdit
    });

    // Get filtered objects and auto-selections
    const result = ExpenseObjectRoleFilter.getExpenseObjectsForRole(
      expenseObjects,
      userRole,
      category
    );

    // For planned expenses, only show parent objects
    if (category === 'planned') {
      const parentObjects = result.filteredObjects.filter(obj => !obj.parent_id);
      console.log(`📋 [useExpenseObjectRoleFilter] Planned expenses - showing only parent objects:`, 
        parentObjects.map(o => o.name));
      
      return {
        ...result,
        filteredObjects: parentObjects,
        selectedIds: [] // No auto-selection for planned expenses
      };
    }

    return result;
  };

  /**
   * Check if user can access specific expense object
   * @param expenseObject - Expense object to check
   * @param userRole - User's role
   * @returns True if user can access the object
   */
  const canAccessExpenseObject = (expenseObject: ExpenseObject, userRole: string): boolean => {
    // Admin, accountant, sales can access all
    if (['admin', 'accountant', 'sales'].includes(userRole)) {
      return true;
    }
    
    // Customer cannot access any
    if (userRole === 'customer') {
      return false;
    }
    
    // Check role match
    if (!expenseObject.role || expenseObject.role.trim() === '') {
      return false;
    }
    
    return expenseObject.role === userRole;
  };

  return {
    processExpenseObjects,
    canAccessExpenseObject
  };
};

/**
 * Utility functions for expense object display
 */
export const ExpenseObjectDisplayUtils = {
  /**
   * Format expense object name for display
   * @param expenseObject - Expense object
   * @returns Formatted name
   */
  formatName: (expenseObject: ExpenseObject | undefined): string => {
    return expenseObject?.name || 'Đối tượng';
  },

  /**
   * Get expense object by ID
   * @param expenseObjects - Array of expense objects
   * @param id - Object ID
   * @returns Expense object or undefined
   */
  getById: (expenseObjects: ExpenseObject[], id: string): ExpenseObject | undefined => {
    return expenseObjects.find(obj => obj.id === id);
  },

  /**
   * Get children objects for a parent
   * @param expenseObjects - Array of expense objects
   * @param parentId - Parent object ID
   * @returns Array of children objects
   */
  getChildren: (expenseObjects: ExpenseObject[], parentId: string): ExpenseObject[] => {
    return expenseObjects.filter(obj => obj.parent_id === parentId);
  },

  /**
   * Get parent object for a child
   * @param expenseObjects - Array of expense objects
   * @param childId - Child object ID
   * @returns Parent object or undefined
   */
  getParent: (expenseObjects: ExpenseObject[], childId: string): ExpenseObject | undefined => {
    const child = expenseObjects.find(obj => obj.id === childId);
    if (!child || !child.parent_id) {
      return undefined;
    }
    return expenseObjects.find(obj => obj.id === child.parent_id);
  }
};

export default ExpenseObjectRoleFilter;





