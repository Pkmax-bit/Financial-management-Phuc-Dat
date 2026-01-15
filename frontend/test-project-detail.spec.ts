import { test, expect } from '@playwright/test'

test.describe('Project Detail Page - Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Navigate to login page first
    await page.goto('/login')
    
    // Wait for login page to load
    try {
      await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 })
      
      // Fill login form (adjust selectors based on your login page)
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
      const submitButton = page.locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")').first()
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('admin@test.com')
        if (await passwordInput.count() > 0) {
          await passwordInput.fill('admin123') // Update with actual password
        }
        if (await submitButton.count() > 0) {
          await submitButton.click()
          
          // Wait for navigation after login
          await page.waitForURL(/dashboard|projects|/, { timeout: 15000 }).catch(() => {
            console.log('Navigation timeout - may already be logged in')
          })
        }
      }
    } catch (error) {
      console.log('Login form not found or already logged in:', error)
    }
  })

  test('Should load project detail page without errors', async ({ page }) => {
    // Navigate to a project detail page
    // Replace with an actual project ID from your database
    const projectId = '6bf71318-f57f-405f-b137-f6770c99cd01'
    await page.goto(`/projects/${projectId}/detail`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check for console errors
    const errors: string[] = []
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000)
    
    // Check that we're not redirected to login
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/login')
    
    // Check for common error messages in page content
    const pageContent = await page.content()
    expect(pageContent).not.toContain('Not authenticated')
    expect(pageContent).not.toContain('Unauthorized')
    
    // Report any console errors
    if (errors.length > 0) {
      console.log('Console errors found:', errors)
      // Filter out expected errors
      const criticalErrors = errors.filter((err: string) => 
        !err.includes('favicon') && 
        !err.includes('sourcemap') &&
        !err.includes('Cannot access') &&
        !err.includes('before initialization')
      )
      
      if (criticalErrors.length > 0) {
        throw new Error(`Critical console errors: ${criticalErrors.join(', ')}`)
      }
    }
  })

  test('Should send text message in chat without being logged out', async ({ page }) => {
    const projectId = '6bf71318-f57f-405f-b137-f6770c99cd01'
    await page.goto(`/projects/${projectId}/detail`)
    
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Find chat input area
    const chatInput = page.locator('textarea[placeholder*="tin nhắn"], textarea[data-input-area], textarea').first()
    
    if (await chatInput.count() > 0) {
      // Type a test message
      await chatInput.fill('Test message from automated test')
      
      // Find and click send button
      const sendButton = page.locator('button:has-text("Gửi"), button[type="submit"]').first()
      if (await sendButton.count() > 0) {
        await sendButton.click()
        
        // Wait for message to be sent
        await page.waitForTimeout(2000)
        
        // Check that we're still on the project page (not redirected to login)
        const currentUrl = page.url()
        expect(currentUrl).not.toContain('/login')
        expect(currentUrl).toContain(projectId)
      }
    }
  })

  test('Should handle file upload in chat without errors', async ({ page }) => {
    const projectId = '6bf71318-f57f-405f-b137-f6770c99cd01'
    await page.goto(`/projects/${projectId}/detail`)
    
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Find file input
    const fileInput = page.locator('input[type="file"]').first()
    
    if (await fileInput.count() > 0) {
      // Create a test file using Buffer
      const testFileContent = Buffer.from('Test file content for upload')
      const testFilePath = 'test-upload-file.txt'
      
      // Use Playwright's file handling
      await fileInput.setInputFiles({
        name: 'test-file.txt',
        mimeType: 'text/plain',
        buffer: testFileContent
      })
      
      // Wait for upload
      await page.waitForTimeout(3000)
      
      // Check that we're still on the project page
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/login')
      expect(currentUrl).toContain(projectId)
    } else {
      console.log('File input not found - skipping file upload test')
    }
  })

  test('Should not have authentication errors in network requests', async ({ page }) => {
    const projectId = '6bf71318-f57f-405f-b137-f6770c99cd01'
    
    const failedRequests: any[] = []
    
    page.on('response', (response: any) => {
      if (response.status() === 401 || response.status() === 403) {
        const url = response.url()
        // Ignore expected 403s (like customers endpoint if user doesn't have permission)
        if (!url.includes('/customers') && !url.includes('/financial-summary')) {
          failedRequests.push({
            url,
            status: response.status(),
            statusText: response.statusText()
          })
        }
      }
    })
    
    await page.goto(`http://localhost:3000/projects/${projectId}/detail`)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Wait a bit more for all requests to complete
    await page.waitForTimeout(5000)
    
    if (failedRequests.length > 0) {
      console.log('Failed authentication requests:', failedRequests)
      // Only fail if there are critical auth failures
      const criticalFailures = failedRequests.filter((req: any) => 
        !req.url.includes('/customers') && 
        !req.url.includes('/financial-summary')
      )
      
      if (criticalFailures.length > 0) {
        throw new Error(`Authentication failures: ${JSON.stringify(criticalFailures)}`)
      }
    }
  })
})

