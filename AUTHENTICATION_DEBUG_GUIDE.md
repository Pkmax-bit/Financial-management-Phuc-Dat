# 🔐 Authentication Debug Guide

## 📋 Overview

Hướng dẫn debug lỗi 401 Unauthorized khi gọi API `/api/customers/next-customer-code`.

## 🐛 Error Analysis

### **Error Message:**
```
INFO: 127.0.0.1:56383 - "GET /api/customers/next-customer-code HTTP/1.1" 401 Unauthorized
```

### **Root Causes:**
1. **Người dùng chưa đăng nhập** - Không có token trong localStorage
2. **Token không hợp lệ** - Token đã hết hạn hoặc bị lỗi
3. **Token không được gửi** - Frontend không gửi Authorization header
4. **Người dùng không có quyền** - Role không có quyền truy cập `customers`

## 🔍 Debug Steps

### **Step 1: Check Authentication Status**

#### **Frontend Debug:**
```javascript
// 1. Open browser developer tools (F12)
// 2. Go to Console tab
// 3. Run this command:

// Check if user is logged in
const token = localStorage.getItem('access_token');
console.log('Token exists:', !!token);
console.log('Token value:', token);

// Check if token is valid
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
    console.log('Token expired:', Date.now() > payload.exp * 1000);
  } catch (e) {
    console.error('Token is invalid:', e);
  }
}
```

#### **Backend Debug:**
```bash
# Test authentication endpoints
curl -X GET "http://localhost:8000/api/customers/test"
curl -X GET "http://localhost:8000/api/customers/auth-test"
curl -X GET "http://localhost:8000/api/customers/debug-permissions"
```

### **Step 2: Check Network Requests**

#### **Frontend Debug:**
```javascript
// 1. Open browser developer tools (F12)
// 2. Go to Network tab
// 3. Try to create a customer
// 4. Look for the request to /api/customers/next-customer-code
// 5. Check the request headers for Authorization
// 6. Check the response status and error message
```

#### **Expected Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Step 3: Check User Permissions**

#### **Frontend Debug:**
```javascript
// Check user permissions
fetch('/api/customers/debug-permissions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('User permissions:', data);
  console.log('Can access customers:', data.permissions?.customers);
})
.catch(error => {
  console.error('Permission check failed:', error);
});
```

## 🛠️ Solutions

### **Solution 1: User Not Logged In**

#### **Problem:**
- No token in localStorage
- User needs to log in

#### **Fix:**
```javascript
// Check if user is logged in
if (!localStorage.getItem('access_token')) {
  // Redirect to login page
  window.location.href = '/login';
}
```

### **Solution 2: Token Expired**

#### **Problem:**
- Token exists but is expired
- Need to refresh token or re-login

#### **Fix:**
```javascript
// Check token expiration
const token = localStorage.getItem('access_token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() > payload.exp * 1000) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  } catch (e) {
    // Invalid token, redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
}
```

### **Solution 3: Missing Authorization Header**

#### **Problem:**
- Token exists but not sent in request
- Frontend not including Authorization header

#### **Fix:**
```javascript
// Ensure Authorization header is included
const token = localStorage.getItem('access_token');
if (token) {
  fetch('/api/customers/next-customer-code', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
```

### **Solution 4: User Role Permissions**

#### **Problem:**
- User is authenticated but doesn't have `customers` permission
- Need to check user role and permissions

#### **Fix:**
```javascript
// Check user permissions
fetch('/api/customers/debug-permissions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(response => response.json())
.then(data => {
  if (data.permissions?.customers) {
    console.log('User has customers permission');
  } else {
    console.log('User does not have customers permission');
    console.log('User role:', data.user?.role);
    console.log('Available permissions:', data.permissions);
  }
});
```

## 🔧 Backend Configuration

### **RBAC Configuration:**

#### **Check User Roles:**
```python
# In backend/utils/rbac_middleware.py
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        'permissions': [Permission.ALL],
        'features': ['customers', 'projects', 'financial', 'reports']
    },
    UserRole.SALES: {
        'permissions': [Permission.READ, Permission.WRITE],
        'features': ['customers', 'projects']
    },
    # ... other roles
}
```

#### **Check Feature Access:**
```python
# In backend/utils/rbac_middleware.py
def can_access_feature(self, user: User, feature: str) -> bool:
    """Check if user can access a specific feature"""
    if user.role not in ROLE_PERMISSIONS:
        return False
    
    role_permissions = ROLE_PERMISSIONS[user.role]
    return feature in role_permissions.get('features', [])
```

## 📱 Frontend Implementation

### **Auto-Fill Customer Code Implementation:**

#### **1. Check Authentication:**
```javascript
const generateNextCode = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No authentication token found');
    return;
  }
  
  try {
    const response = await fetch('/api/customers/next-customer-code', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      setCustomerCode(data.next_customer_code);
    } else if (response.status === 401) {
      console.error('Authentication failed - please log in');
      // Redirect to login
    } else if (response.status === 403) {
      console.error('Access denied - insufficient permissions');
      // Show error message
    }
  } catch (error) {
    console.error('Error generating customer code:', error);
  }
};
```

#### **2. Handle Errors:**
```javascript
const handleAuthError = (error) => {
  if (error.status === 401) {
    // Authentication failed
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  } else if (error.status === 403) {
    // Permission denied
    alert('Bạn không có quyền truy cập tính năng này');
  } else {
    // Other errors
    alert('Có lỗi xảy ra: ' + error.message);
  }
};
```

## 🧪 Testing

### **Test Authentication:**
```bash
# Test without token (should return 401)
curl -X GET "http://localhost:8000/api/customers/next-customer-code"

# Test with invalid token (should return 401)
curl -X GET "http://localhost:8000/api/customers/next-customer-code" \
  -H "Authorization: Bearer invalid_token"

# Test with valid token (should return 200)
curl -X GET "http://localhost:8000/api/customers/next-customer-code" \
  -H "Authorization: Bearer <valid_jwt_token>"
```

### **Test Permissions:**
```bash
# Test debug permissions
curl -X GET "http://localhost:8000/api/customers/debug-permissions" \
  -H "Authorization: Bearer <valid_jwt_token>"
```

## 🎯 Quick Fixes

### **Immediate Solutions:**

#### **1. Clear Cache and Re-login:**
```javascript
// Clear all stored data
localStorage.clear();
sessionStorage.clear();

// Redirect to login
window.location.href = '/login';
```

#### **2. Check User Role:**
```javascript
// Check if user has admin or sales role
const userRole = localStorage.getItem('user_role');
if (!['admin', 'sales'].includes(userRole)) {
  alert('Bạn không có quyền truy cập tính năng này');
  return;
}
```

#### **3. Verify Token:**
```javascript
// Verify token is valid
const token = localStorage.getItem('access_token');
if (!token || token === 'null' || token === 'undefined') {
  console.error('No valid token found');
  window.location.href = '/login';
}
```

## 🎉 Summary

Để sửa lỗi 401 Unauthorized:

1. **Kiểm tra đăng nhập** - Đảm bảo user đã đăng nhập
2. **Kiểm tra token** - Verify token hợp lệ và chưa hết hạn
3. **Kiểm tra quyền** - Đảm bảo user có quyền truy cập `customers`
4. **Kiểm tra header** - Đảm bảo Authorization header được gửi
5. **Debug network** - Kiểm tra request/response trong browser

Hệ thống authentication và authorization đang hoạt động đúng - vấn đề là ở phía frontend cần đảm bảo user đã đăng nhập và có quyền truy cập! 🔐
