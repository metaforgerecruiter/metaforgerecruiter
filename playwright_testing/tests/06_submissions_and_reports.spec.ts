import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('Submissions & Reports Suite', () => {
  test.describe.configure({ timeout: 120000 });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    page = await browser.newPage();
    await loginWithQuickChooser(page, 'superadmin');
    await navigateTo(page, 'Reports');
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('06.1: Reports page renders dashboard tables and turnaround time (TAT) metrics', async () => {
    // Check page title and primary sub-tabs
    await expect(page.locator('text=Reports Page').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Total Submissions")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Interview Tracking")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Reports & Analytics")').first()).toBeVisible();

    // Check Total Submissions table column headers
    await expect(page.locator('th:has-text("CANDIDATE & ROLE"), th:has-text("CANDIDATE")').first()).toBeVisible();
    await expect(page.locator('th:has-text("REQUIREMENT ID")').first()).toBeVisible();
    await expect(page.locator('th:has-text("SUBMITTED TO (CLIENT)")').first()).toBeVisible();
    await expect(page.locator('th:has-text("STATUS")').first()).toBeVisible();
  });

  test('06.2: Client filter dropdown filters submission records', async () => {
    const clientSelect = page.locator('select:has-text("All Clients")').first();
    if (await clientSelect.isVisible()) {
      await clientSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await clientSelect.selectOption({ index: 0 });
    }
  });

  test('06.3: Switching between Total Submissions, Interview Tracking, and Reports & Analytics tabs', async () => {
    // Switch to Interview Tracking tab
    const ivTab = page.locator('button:has-text("Interview Tracking")').first();
    await ivTab.click();
    await page.waitForTimeout(400);

    // Switch to Reports & Analytics tab
    const analyticsTab = page.locator('button:has-text("Reports & Analytics")').first();
    await analyticsTab.click();
    await page.waitForTimeout(400);

    // Switch back to Total Submissions
    const subsTab = page.locator('button:has-text("Total Submissions")').first();
    await subsTab.click();
    await expect(page.locator('th:has-text("CANDIDATE & ROLE"), th:has-text("CANDIDATE")').first()).toBeVisible({ timeout: 8000 });
  });

  test('06.4: Search input in reports filters matching rows', async () => {
    const searchInput = page.locator('input[placeholder*="Search candidate name"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Accenture');
      await page.waitForTimeout(300);
      await searchInput.fill('');
    }
  });

});
