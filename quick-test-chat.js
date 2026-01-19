/**
 * Quick Chat Test - Simple Node.js script
 * Tests chat API endpoints directly
 * 
 * Run: node quick-test-chat.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const USER_DUONG = {
  email: 'phucdatdoors7@gmail.com',
  password: '123456',
};

const USER_QUAN = {
  email: 'tranhoangquan2707@gmail.com',
  password: '123456',
};

async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token || data.token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function sendMessage(token, conversationId, messageText) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message_text: messageText }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Send message failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, duration };
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

async function getMessages(token, conversationId) {
  try {
    const response = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages?skip=0&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get messages failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

async function testChat() {
  console.log('🧪 Starting Chat Test...\n');

  try {
    // Step 1: Login both users
    console.log('🔐 Logging in users...');
    const tokenDuong = await login(USER_DUONG.email, USER_DUONG.password);
    console.log('✅ Dương logged in');

    const tokenQuan = await login(USER_QUAN.email, USER_QUAN.password);
    console.log('✅ Quân logged in\n');

    // Step 2: Get or create conversation
    // Note: This might need adjustment based on your API
    console.log('💬 Getting conversation...');
    // You might need to create conversation first or get existing one
    // For now, assuming conversation exists or you'll provide conversation_id
    
    // Step 3: Send message from Dương
    console.log('📤 Dương sending message...');
    const testMessage = `Test message at ${new Date().toISOString()}`;
    
    // You'll need to provide actual conversation_id
    const conversationId = 'YOUR_CONVERSATION_ID'; // Update this
    
    const sendResult = await sendMessage(tokenDuong, conversationId, testMessage);
    console.log(`✅ Message sent in ${sendResult.duration}ms`);
    console.log(`   Message ID: ${sendResult.data.id}`);
    console.log(`   Message Text: ${sendResult.data.message_text}\n`);

    // Step 4: Check if Quân can see the message
    console.log('📥 Quân checking for new message...');
    const messages = await getMessages(tokenQuan, conversationId);
    const latestMessage = messages.messages?.[0];
    
    if (latestMessage && latestMessage.message_text === testMessage) {
      console.log('✅ Quân received the message!');
      console.log(`   Message ID: ${latestMessage.id}`);
    } else {
      console.log('⚠️ Message not found in Quân\'s view');
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testChat();


