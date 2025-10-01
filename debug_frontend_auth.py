#!/usr/bin/env python3
# -*- coding: utf-8 -*-

print("=" * 60)
print("FRONTEND AUTHENTICATION DEBUG GUIDE")
print("=" * 60)

print("\n1. CHECK USER LOGIN STATUS:")
print("   - Open browser Developer Tools (F12)")
print("   - Go to Application/Storage tab")
print("   - Check Local Storage for 'sb-xxx-auth-token'")
print("   - Check if user is logged in")

print("\n2. CHECK BROWSER CONSOLE:")
print("   - Open Console tab in Developer Tools")
print("   - Look for authentication errors")
print("   - Check for 'OAuth2 API Request Debug' logs")
print("   - Look for 'No OAuth2 session token found' warnings")

print("\n3. MANUAL LOGIN TEST:")
print("   - Go to http://localhost:3000/login")
print("   - Login with: admin@example.com / admin123")
print("   - Check if login is successful")
print("   - Then try accessing Sales page")

print("\n4. API TEST IN BROWSER:")
print("   - Open Developer Tools > Network tab")
print("   - Go to Sales page")
print("   - Look for failed requests to /api/sales/dashboard/stats")
print("   - Check request headers for Authorization")

print("\n5. BACKEND LOGS:")
print("   - Check backend terminal for debug logs")
print("   - Look for 'DEBUG: Received token' messages")
print("   - Check for authentication errors")

print("\n" + "=" * 60)
print("COMMON SOLUTIONS:")
print("=" * 60)
print("1. Clear browser cache and cookies")
print("2. Logout and login again")
print("3. Check if Supabase configuration is correct")
print("4. Verify backend is running on port 8000")
print("5. Check if sample data has been inserted")
print("=" * 60)


