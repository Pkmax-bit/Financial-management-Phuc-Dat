// Test script để kiểm tra đăng nhập và xác thực
const testLogin = async () => {
  try {
    console.log('🔍 Testing login with admin@example.com...');
    
    // Test 1: Kiểm tra Supabase connection
    console.log('\n1. Testing Supabase connection...');
    const supabaseUrl = 'https://your-project.supabase.co'; // Thay bằng URL thực
    const supabaseKey = 'your-anon-key'; // Thay bằng key thực
    
    // Test 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData);
      
      // Test 3: Test authenticated API call
      console.log('\n3. Testing authenticated API call...');
      const employeesResponse = await fetch('http://localhost:8000/api/employees', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        console.log('✅ Authenticated API call successful:', employeesData);
        console.log(`📊 Found ${employeesData.length || 0} employees`);
      } else {
        console.log('❌ Authenticated API call failed:', await employeesResponse.text());
      }
      
    } else {
      console.log('❌ Login failed:', await loginResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Chạy test
testLogin();
