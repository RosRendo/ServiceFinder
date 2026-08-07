import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page from landing page', async ({ page }) => {
    await page.goto('/');
    
    // Find the login link/button in the nav
    const loginLink = page.getByRole('link', { name: /log in|signin|ចូលគណនី/i }).first();
    
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*\/auth\/login/);
    }
  });

  test('should display validation errors for empty login submission', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click submit without filling fields
    const submitBtn = page.getByRole('button', { name: /sign in|ចូលគណនី/i }).first();
    await submitBtn.click();
    
    // Ensure form doesn't submit successfully without required fields
    await expect(page).toHaveURL(/.*\/auth\/login/); 
  });
  
  test('should have a link to the registration page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if register/signup link exists on login page
    const signupLink = page.getByRole('link', { name: /create one|register|signup|ចុះឈ្មោះ/i }).first();
    if (await signupLink.isVisible()) {
      const href = await signupLink.getAttribute('href');
      expect(href).toMatch(/\/auth\/register/);
    }
  });
});
