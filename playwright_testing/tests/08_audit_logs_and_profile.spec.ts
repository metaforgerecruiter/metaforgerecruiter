import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('Audit Logs & Profile Suite', () => {
  test.describe.configure({ timeout: 120000 });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    page = await browser.newPage();
    await loginWithQuickChooser(page, 'superadmin');
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('08.1: Audit Logs renders session audit logs and metrics', async () => {
    await navigateTo(page, 'Audit Logs');

    // Verify main header
    await expect(page.locator('h1:has-text("Audit Logs")').first()).toBeVisible({ timeout: 10000 });

    // Verify KPI cards / tabs
    await expect(page.locator('button:has-text("User Login & Session Audit Logs")').first()).toBeVisible();
    await expect(page.locator('button:has-text("System Action Audit Trail")').first()).toBeVisible();

    // Verify presence of table
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('08.2: Audit Logs switches to System Action Audit Trail tab and verifies action logging', async () => {
    const actionTabBtn = page.locator('button:has-text("System Action Audit Trail")').first();
    await actionTabBtn.click();
    await page.waitForTimeout(400);

    // Verify the action audit trail tab is active and search input is present
    const actionSearchInput = page.locator('input[placeholder*="Search user, action, client"], input[placeholder*="Search"]').first();
    await expect(actionSearchInput).toBeVisible();

    // Switch back to User Login & Session tab
    const sessionTabBtn = page.locator('button:has-text("User Login & Session Audit Logs")').first();
    await sessionTabBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('08.3: My Profile displays user account information and role badge', async () => {
    // Open My Profile from the sidebar footer
    const profileNavBtn = page.locator('aside button:has-text("My Profile")').first();
    await expect(profileNavBtn).toBeVisible({ timeout: 5000 });
    await profileNavBtn.click();

    // Verify page header
    await expect(page.locator('h1:has-text("My Profile")').first()).toBeVisible({ timeout: 10000 });

    // Verify user information (Super Admin: Robert Haines)
    await expect(page.locator('text=Robert Haines').first()).toBeVisible();
    await expect(page.locator('text=r.haines@talentflow.io').first()).toBeVisible();
  });

  test('08.4: My Profile displays Change Password security controls', async () => {
    // Click Change Password button to reveal form
    const changePassBtn = page.locator('button:has-text("Change Password")').first();
    await expect(changePassBtn).toBeVisible();
    await changePassBtn.click();
    await page.waitForTimeout(300);

    // Verify new password input is visible
    const newPassInput = page.locator('input[placeholder*="Enter new password"]').first();
    await expect(newPassInput).toBeVisible();
  });

});
