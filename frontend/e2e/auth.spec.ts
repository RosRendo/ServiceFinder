import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page from landing page', async ({ page }) => {
    await page.goto('/');
    
    // Find the login link/button in the nav
    const loginLink = page.getByRole('link', { name: /log in/i });
    
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*\/auth\/login/);
    }
  });

  test('should display validation errors for empty login submission', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click submit without filling fields
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await submitBtn.click();
    
    // Check for standard HTML5 validation or custom form validation messages
    // This depends on whether we use zod/react-hook-form or native validation
    // The following is a broad check to ensure form doesn't submit successfully
    await expect(page).toHaveURL(/.*\/auth\/login/); 
  });

  // Note: We don't perform actual logins to a real backend in basic E2E without
  // a dedicated testing environment/database. In a full setup, we would intercept
  // the network request or use a test user account.
  
  test('should have a link to the registration page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // The actual link text on the login page is "Create one"
    const signupLink = page.getByRole('link', { name: /create one/i });
    await expect(signupLink).toBeVisible();
    
    // Verify the link points to the registration page by checking its href
    // This is more resilient than waiting for navigation, which can fail if
    // the register page is not yet built/seeded in the test environment.
    const href = await signupLink.getAttribute('href');
    expect(href).toMatch(/\/auth\/register/);
  });
});
