/**
 * Automated Chat Test Script
 * Tests chat functionality with 2 users (Dương and Quân)
 * 
 * Usage:
 * 1. Install dependencies: npm install -D @playwright/test playwright
 * 2. Update credentials below
 * 3. Run: npx playwright test test-chat-automated.ts
 */

import { test, expect, chromium, Browser, Page } from '@playwright/test';

// Credentials for testing
const USER_DUONG = {
  email: 'phucdatdoors7@gmail.com',
  password: '123456',
  name: 'Dương'
};

const USER_QUAN = {
  email: 'tranhoangquan2707@gmail.com',
  password: '123456',
  name: 'Quân'
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Chat Realtime Test', () => {
  let browser: Browser;
  let pageDuong: Page;
  let pageQuan: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false }); // Set to true for headless
  });

  test.beforeEach(async () => {
    // Create two browser contexts (like two different users)
    const contextDuong = await browser.newContext();
    const contextQuan = await browser.newContext();

    pageDuong = await contextDuong.newPage();
    pageQuan = await contextQuan.newPage();

    // Navigate to app
    await pageDuong.goto(BASE_URL);
    await pageQuan.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await pageDuong.close();
    await pageQuan.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('User Dương sends message and User Quân receives it', async () => {
    // Step 1: Login both users
    console.log('🔐 Logging in users...');
    
    // Login Dương
    await pageDuong.fill('input[type="email"]', USER_DUONG.email);
    await pageDuong.fill('input[type="password"]', USER_DUONG.password);
    await pageDuong.click('button[type="submit"]');
    await pageDuong.waitForURL('**/dashboard', { timeout: 10000 });

    // Login Quân
    await pageQuan.fill('input[type="email"]', USER_QUAN.email);
    await pageQuan.fill('input[type="password"]', USER_QUAN.password);
    await pageQuan.click('button[type="submit"]');
    await pageQuan.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('✅ Both users logged in');

    // Step 2: Open chat
    console.log('💬 Opening chat...');
    
    // Navigate to chat (adjust selector based on your UI)
    await pageDuong.click('text=Chat'); // Adjust selector
    await pageQuan.click('text=Chat'); // Adjust selector

    // Wait for chat to load
    await pageDuong.waitForSelector('[data-testid="chat-conversation-list"]', { timeout: 5000 });
    await pageQuan.waitForSelector('[data-testid="chat-conversation-list"]', { timeout: 5000 });

    // Step 3: Select conversation between Dương and Quân
    // This might need adjustment based on your UI
    await pageDuong.click(`text=${USER_QUAN.name}`);
    await pageQuan.click(`text=${USER_DUONG.name}`);

    // Wait for chat messages to load
    await pageDuong.waitForSelector('[data-testid="chat-message-input"]', { timeout: 5000 });
    await pageQuan.waitForSelector('[data-testid="chat-message-input"]', { timeout: 5000 });

    console.log('✅ Chat opened for both users');

    // Step 4: Dương sends a message
    const testMessage = `Test message from ${USER_DUONG.name} at ${new Date().toISOString()}`;
    console.log(`📤 ${USER_DUONG.name} sending message: "${testMessage}"`);

    // Enable console logging for Dương
    pageDuong.on('console', msg => {
      if (msg.text().includes('API Response') || msg.text().includes('Adding real message')) {
        console.log(`[${USER_DUONG.name}] ${msg.text()}`);
      }
    });

    // Type and send message
    await pageDuong.fill('[data-testid="chat-message-input"]', testMessage);
    await pageDuong.press('[data-testid="chat-message-input"]', 'Enter');

    // Step 5: Verify Dương sees their message
    console.log(`✅ Checking if ${USER_DUONG.name} sees their message...`);
    await pageDuong.waitForSelector(`text=${testMessage}`, { timeout: 5000 });
    const duongSeesMessage = await pageDuong.locator(`text=${testMessage}`).isVisible();
    expect(duongSeesMessage).toBe(true);
    console.log(`✅ ${USER_DUONG.name} sees their message`);

    // Step 6: Verify Quân receives the message
    console.log(`✅ Checking if ${USER_QUAN.name} receives the message...`);
    
    // Enable console logging for Quân
    pageQuan.on('console', msg => {
      if (msg.text().includes('Received broadcast') || msg.text().includes('handleNewMessage')) {
        console.log(`[${USER_QUAN.name}] ${msg.text()}`);
      }
    });

    // Wait for message to appear (should be <1s after optimization)
    const startTime = Date.now();
    await pageQuan.waitForSelector(`text=${testMessage}`, { timeout: 5000 });
    const receiveTime = Date.now() - startTime;
    
    const quanReceivesMessage = await pageQuan.locator(`text=${testMessage}`).isVisible();
    expect(quanReceivesMessage).toBe(true);
    
    console.log(`✅ ${USER_QUAN.name} received message in ${receiveTime}ms`);
    
    // Verify latency is acceptable (<2s to account for network)
    expect(receiveTime).toBeLessThan(2000);
  });

  test('User Quân sends message and User Dương receives it', async () => {
    // Similar test but reversed
    // ... (similar code structure)
  });

  test('Multiple messages in quick succession', async () => {
    // Test sending multiple messages quickly
    // ... (similar code structure)
  });
});

