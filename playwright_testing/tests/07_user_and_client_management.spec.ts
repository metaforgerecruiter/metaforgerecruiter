import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('User & Client Management Suite', () => {
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

  test('07.1: User Management renders governance dashboard and accounts table', async () => {
    await navigateTo(page, 'User Management');

    // Verify page header
    await expect(page.locator('h1:has-text("User & Access Governance")').first()).toBeVisible({ timeout: 10000 });

    // Verify tabs
    await expect(page.locator('button:has-text("User Accounts")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Roles & Permissions")').first()).toBeVisible();

    // Verify User table is present
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('07.2: Switches between User Accounts and Role Definitions & Permissions tabs', async () => {
    // Switch to Roles & Permissions tab
    const roleDefBtn = page.locator('button:has-text("Roles & Permissions")').first();
    await roleDefBtn.click();
    await page.waitForTimeout(400);

    // Verify role definitions view is shown
    await expect(page.locator('text=Enterprise System Role Definitions').first()).toBeVisible();

    // Switch back to User Accounts
    const usersTabBtn = page.locator('button:has-text("User Accounts")').first();
    await usersTabBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('07.3: Client Management renders clients list and metrics', async () => {
    await navigateTo(page, 'Clients');

    // Verify Client Management header
    await expect(page.locator('h1:has-text("Client Management")').first()).toBeVisible({ timeout: 10000 });

    // Verify client search bar
    const searchInput = page.locator('input[placeholder*="Search client"]').first();
    await expect(searchInput).toBeVisible();

    // Verify client table is visible
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('07.4: Client search filters client partners by name or domain', async () => {
    const searchInput = page.locator('input[placeholder*="Search client"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Accenture');
    await page.waitForTimeout(300);

    // Verify Accenture appears in filtered table body
    await expect(page.locator('table tbody').locator('text=Accenture').first()).toBeVisible();

    await searchInput.fill('');
  });

});
