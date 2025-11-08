# 🔧 Fix Employee Creation 403 "Not authenticated" Error

## 🚨 Problem Identified
The employee creation is failing with `403 Forbidden` and "Not authenticated" error.

## 🔍 Root Cause
The API endpoint requires authentication with admin or manager role, but the request is not properly authenticated.

## ✅ Solutions

### Solution 1: Check Authentication in Frontend
The frontend needs to include the authentication token in the request.

**Check in browser console:**
```javascript
// Check if you have a valid auth token
console.log('Auth token:', localStorage.getItem('supabase.auth.token'));
console.log('Session:', localStorage.getItem('supabase.auth.session'));
```

**Fix in frontend API call:**
```javascript
// In the employee creation API call, ensure headers include auth token
const token = localStorage.getItem('supabase.auth.token');
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};
```

### Solution 2: Verify User Role
Ensure the logged-in user has admin or manager role.

**Check user role:**
```sql
-- Run in Supabase SQL Editor
SELECT email, role, is_active 
FROM users 
WHERE email = 'your_email@example.com';
```

**Required roles for employee creation:**
- `admin`
- `manager` (if this role exists)

### Solution 3: Test Authentication
Create a simple test to verify authentication is working:

```python
# test_auth.py
import requests

# Test with your actual token
token = "YOUR_SUPABASE_TOKEN_HERE"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test a simple protected endpoint first
response = requests.get("http://localhost:8000/api/employees/", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

### Solution 4: Check Backend Authentication
Verify the authentication middleware is working correctly.

**Check in backend logs:**
- Look for authentication errors
- Verify the token is being parsed correctly
- Check if the user lookup is working

## 🧪 Step-by-Step Debugging

### Step 1: **Check if you're logged in**
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Step 2: **Check user role in database**
```sql
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'your_email@example.com';
```

### Step 3: **Test with curl**
```bash
# Get your token from browser localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:8000/api/employees/
```

### Step 4: **Check backend authentication**
Look for these in backend logs:
- Token parsing errors
- User lookup failures
- Role validation errors

## 🔧 Quick Fixes

### Fix 1: Ensure Proper Authentication
```javascript
// In your frontend API call
const createEmployee = async (employeeData) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/employees/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(employeeData)
    });
    
    return response.json();
};
```

### Fix 2: Check User Role
```sql
-- Make sure your user has admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'your_email@example.com';
```

### Fix 3: Test Authentication Endpoint
```python
# Test if auth is working
import requests

# Test with a simple GET request first
response = requests.get(
    "http://localhost:8000/api/employees/",
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
print(f"Status: {response.status_code}")
```

## 📋 Expected Working Flow

1. **User logs in** → Gets authentication token
2. **Frontend stores token** → In localStorage or session
3. **API call includes token** → In Authorization header
4. **Backend validates token** → Checks user role
5. **Employee creation succeeds** → If user has admin/manager role

## 🎯 Most Likely Solutions

1. **90% chance**: Missing Authorization header
2. **80% chance**: User doesn't have admin/manager role
3. **70% chance**: Token is expired or invalid
4. **60% chance**: Backend authentication middleware issue

## 🚀 Test Commands

```bash
# Test 1: Check if backend is running
curl http://localhost:8000/api/employees/

# Test 2: Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/employees/

# Test 3: Test employee creation
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@example.com","hire_date":"2024-01-01","user_role":"employee"}' \
     http://localhost:8000/api/employees/
```

## 📞 Still Having Issues?

1. **Check browser network tab** - Look for the actual request headers
2. **Check backend logs** - Look for authentication errors
3. **Verify user role** - Ensure you have admin/manager role
4. **Test with Postman** - Use a tool like Postman to test the API directly
5. **Check token validity** - Ensure the token is not expired
