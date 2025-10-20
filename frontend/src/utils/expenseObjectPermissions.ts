/**
 * Cấu hình phân quyền đối tượng chi phí theo role
 * Nhân viên xưởng chỉ thấy đối tượng chi phí xưởng
 * Nhân công chỉ thấy đối tượng chi phí nhân công
 */

export const EXPENSE_OBJECT_ROLE_PERMISSIONS = {
  workshop_employee: [], // Sẽ được cập nhật sau khi tạo đối tượng xưởng
  worker: [], // Sẽ được cập nhật sau khi tạo đối tượng nhân công
  admin: [], // Admin thấy tất cả
  accountant: [], // Kế toán thấy tất cả
  sales: [], // Sales thấy tất cả
  transport: [], // Vận chuyển thấy tất cả
  employee: [], // Nhân viên chung thấy tất cả
  customer: [] // Khách hàng không thấy
};

/**
 * Hàm kiểm tra quyền truy cập đối tượng chi phí
 */
export const canAccessExpenseObject = (userRole: string, expenseObjectId: string): boolean => {
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole as keyof typeof EXPENSE_OBJECT_ROLE_PERMISSIONS];
  
  // Admin, accountant, sales thấy tất cả
  if (['admin', 'accountant', 'sales'].includes(userRole)) {
    return true;
  }
  
  // Khách hàng không thấy
  if (userRole === 'customer') {
    return false;
  }
  
  // Kiểm tra quyền cụ thể
  return rolePermissions.includes(expenseObjectId);
};

/**
 * Hàm lọc đối tượng chi phí theo role
 */
export const filterExpenseObjectsByRole = (expenseObjects: any[], userRole: string): any[] => {
  if (['admin', 'accountant', 'sales'].includes(userRole)) {
    return expenseObjects; // Thấy tất cả
  }
  
  if (userRole === 'customer') {
    return []; // Không thấy gì
  }
  
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole as keyof typeof EXPENSE_OBJECT_ROLE_PERMISSIONS];
  return expenseObjects.filter(obj => rolePermissions.includes(obj.id));
};

/**
 * Hàm lọc đối tượng chi phí theo tên (fallback)
 */
export const filterExpenseObjectsByName = (expenseObjects: any[], userRole: string): any[] => {
  if (['admin', 'accountant', 'sales'].includes(userRole)) {
    return expenseObjects; // Thấy tất cả
  }
  
  if (userRole === 'customer') {
    return []; // Không thấy gì
  }
  
  // WORKSHOP_EMPLOYEE: Chỉ thấy đối tượng xưởng
  if (userRole === 'workshop_employee') {
    return expenseObjects.filter(obj => 
      obj.name.includes('Xưởng') || 
      obj.name.includes('Nguyên vật liệu') ||
      obj.name.includes('Nhân công xưởng')
    );
  }
  
  // WORKER: Chỉ thấy đối tượng nhân công
  if (userRole === 'worker') {
    return expenseObjects.filter(obj => 
      obj.name.includes('Nhân công') && 
      !obj.name.includes('xưởng')
    );
  }
  
  // TRANSPORT: Có thể thấy đối tượng vận chuyển
  if (userRole === 'transport') {
    return expenseObjects.filter(obj => 
      obj.name.includes('Vận chuyển') ||
      obj.name.includes('Transport')
    );
  }
  
  // EMPLOYEE: Thấy tất cả (nhân viên chung)
  return expenseObjects;
};

/**
 * Hàm cập nhật phân quyền sau khi tạo đối tượng chi phí
 */
export const updateExpenseObjectPermissions = (expenseObjects: any[]) => {
  // Tìm đối tượng xưởng
  const workshopObjects = expenseObjects.filter(obj => 
    obj.name.includes('Xưởng') || 
    obj.name.includes('Nguyên vật liệu') ||
    obj.name.includes('Nhân công xưởng')
  );
  
  // Tìm đối tượng nhân công
  const workerObjects = expenseObjects.filter(obj => 
    obj.name.includes('Nhân công') && 
    !obj.name.includes('xưởng')
  );
  
  // Cập nhật phân quyền
  EXPENSE_OBJECT_ROLE_PERMISSIONS.workshop_employee = workshopObjects.map(obj => obj.id);
  EXPENSE_OBJECT_ROLE_PERMISSIONS.worker = workerObjects.map(obj => obj.id);
  
  console.log('Updated expense object permissions:', {
    workshop_employee: EXPENSE_OBJECT_ROLE_PERMISSIONS.workshop_employee,
    worker: EXPENSE_OBJECT_ROLE_PERMISSIONS.worker
  });
};

/**
 * Hàm lấy đối tượng chi phí theo role (hàm chính)
 */
export const getExpenseObjectsByRole = (expenseObjects: any[], userRole: string): any[] => {
  // Thử lọc theo ID trước
  const filteredById = filterExpenseObjectsByRole(expenseObjects, userRole);
  
  // Nếu không có kết quả, lọc theo tên
  if (filteredById.length === 0) {
    return filterExpenseObjectsByName(expenseObjects, userRole);
  }
  
  return filteredById;
};
