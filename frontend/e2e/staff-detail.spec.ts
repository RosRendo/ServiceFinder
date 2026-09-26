import { test, expect } from '@playwright/test';

// Visual verification of the redesigned staff detail page.
// Uses seeded demo owner (owner1@demo.com / password123) against the
// locally running dev servers (:3000 web, :5000 API).

test('staff detail page renders with real data', async ({ page }) => {
  // Dismiss cookie banner if it appears
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const btn = document.querySelector('button');
    });
  });

  // Login
  await page.goto('/auth/login');
  await page.fill('input[type="email"], input[name="email"]', 'owner1@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.getByRole('button', { name: /ចូលគណនី|Login|Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 });

  // Resolve a real staff id for this owner's company via the API
  const staffId = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5000/api/companies/my-company/staff', { credentials: 'include' });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || data.staff || []);
    return list[0]?.id ? String(list[0].id) : null;
  });
  expect(staffId).toBeTruthy();

  await page.goto(`/company/staff/${staffId}`);

  // We must stay on the staff detail page (no auth bounce)
  await page.waitForURL(new RegExp(`/company/staff/${staffId}`), { timeout: 15000 });

  // Header shows the real staff member's name from the API
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

  // Key metric cards exist
  await expect(page.getByText('Average Rating', { exact: true })).toBeVisible();
  await expect(page.getByText('Completed Jobs', { exact: true })).toBeVisible();
  await expect(page.getByText('Generated Revenue', { exact: true })).toBeVisible();
  await expect(page.getByText('Completion Rate', { exact: true })).toBeVisible();

  // Tabs render
  for (const tab of ['Overview', 'Schedule', 'Compliance', 'Notes']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }

  // No fabricated content anywhere on the page
  await expect(page.getByText(/AI Performance Summary/i)).toHaveCount(0);
  await expect(page.getByText(/AI Risk Detection/i)).toHaveCount(0);
  await expect(page.getByText(/\$42,918/)).toHaveCount(0);
  await expect(page.getByText(/Aug 18 – Aug 22/)).toHaveCount(0);
  await expect(page.getByText(/Export Report/)).toHaveCount(0);

  // Overview tab: recent jobs section with rows or empty state
  await expect(page.getByText('Recent Jobs').or(page.getByText('No jobs assigned yet'))).toBeVisible();

  // Compliance tab loads documents or empty state
  await page.getByRole('tab', { name: 'Compliance' }).click();
  await expect(
    page.getByText('No compliance documents').or(page.locator('a', { hasText: /\.(pdf|jpg|png|id|card)/i }).first())
  ).toBeVisible({ timeout: 10000 });

  // Notes tab loads editor or existing notes
  await page.getByRole('tab', { name: 'Notes' }).click();
  await expect(page.getByPlaceholder(/private staff log note/i)).toBeVisible();

  // Schedule tab renders the manager
  await page.getByRole('tab', { name: 'Schedule' }).click();
  await expect(page.getByText('Availability Schedule')).toBeVisible();
});
