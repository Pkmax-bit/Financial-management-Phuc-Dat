# 🔧 Troubleshooting Employee Creation 400 Error

## 🚨 Problem
Getting `400 Bad Request` when trying to create an employee via `POST /api/employees/`

## 🔍 Common Causes & Solutions

### 1. **Missing password_hash Column** ⭐ MOST LIKELY
**Problem**: The `password_hash` column doesn't exist in the `users` table.

**Solution**:
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE users ADD COLUMN password_hash TEXT;
```

**Check**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password_hash';
```

### 2. **Authentication Issues**
**Problem**: Not authenticated or insufficient permissions.

**Solution**:
- Ensure you're logged in as admin or manager
- Check if the auth token is valid
- Verify the user has `require_manager_or_admin` permission

**Test**:
```bash
# Check if you can access other protected endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/employees/
```

### 3. **Invalid user_role Value**
**Problem**: The `user_role` field contains an invalid value.

**Valid Values**:
- `admin`
- `accountant` 
- `sales`
- `workshop_employee`
- `employee`
- `worker`
- `transport`
- `customer`

**Check**: Ensure the frontend sends one of these exact values.

### 4. **Email Already Exists**
**Problem**: The email is already in use in either `users` or `employees` table.

**Solution**:
- Use a unique email address
- Check existing emails in database

**Check**:
```sql
SELECT email FROM users WHERE email = 'your_email@example.com';
SELECT email FROM employees WHERE email = 'your_email@example.com';
```

### 5. **Missing Required Fields**
**Problem**: Required fields are missing or invalid.

**Required Fields**:
- `first_name` (string, 1-255 chars)
- `last_name` (string, 1-255 chars)  
- `email` (valid email format)
- `hire_date` (date format: YYYY-MM-DD)
- `user_role` (valid role from enum)

### 6. **Database Connection Issues**
**Problem**: Supabase client can't connect to database.

**Solution**:
- Check Supabase credentials
- Verify network connectivity
- Check Supabase service status

## 🧪 Debug Steps

### Step 1: Check Database Schema
```python
# Run this script
python check_and_fix_database.py
```

### Step 2: Test Employee Creation
```python
# Run this script
python debug_employee_creation.py
```

### Step 3: Check Backend Logs
Look for specific error messages in the backend console:
```bash
# Look for lines like:
# ERROR: column "password_hash" does not exist
# ERROR: Email already exists
# ERROR: Invalid user_role
```

### Step 4: Test with Minimal Data
```json
{
    "first_name": "Test",
    "last_name": "User", 
    "email": "unique@example.com",
    "hire_date": "2024-01-01",
    "user_role": "employee"
}
```

## 🔧 Quick Fixes

### Fix 1: Add Missing Column
```sql
-- Run in Supabase SQL Editor
ALTER TABLE users ADD COLUMN password_hash TEXT;
```

### Fix 2: Check Authentication
```javascript
// In browser console, check if you have a valid token
console.log(localStorage.getItem('supabase.auth.token'));
```

### Fix 3: Validate Request Data
```javascript
// Check the request payload in browser dev tools
// Ensure all required fields are present and valid
```

## 📋 Testing Checklist

- [ ] Database has `password_hash` column in `users` table
- [ ] User is authenticated with admin/manager role
- [ ] Email is unique (not already in use)
- [ ] All required fields are provided
- [ ] `user_role` is a valid enum value
- [ ] `hire_date` is in correct format (YYYY-MM-DD)
- [ ] Backend server is running on localhost:8000
- [ ] Supabase connection is working

## 🚀 Expected Working Request

```json
POST /api/employees/
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "phone": "0123456789",
    "hire_date": "2024-01-01",
    "user_role": "employee",
    "password": "secure_password_123"
}
```

## 📞 Still Having Issues?

1. **Check Backend Logs**: Look for specific error messages
2. **Test Database Connection**: Verify Supabase is accessible
3. **Validate Request**: Ensure all fields are correct
4. **Check Permissions**: Ensure user has admin/manager role
5. **Run Debug Scripts**: Use the provided Python scripts

## 🎯 Most Likely Solution

**90% chance the issue is the missing `password_hash` column.**

Run this SQL in Supabase:
```sql
ALTER TABLE users ADD COLUMN password_hash TEXT;
```

Then try creating the employee again.
