import { test, expect } from '@playwright/test'

test.describe('Project Detail Page - Simple Connectivity Test', () => {
  test('Should be able to access login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    
    // Check that page loaded
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Check URL
    const url = page.url()
    expect(url).toContain('login')
  })

  test('Should check if frontend server is running', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(500) // Should not be server error
  })
})


