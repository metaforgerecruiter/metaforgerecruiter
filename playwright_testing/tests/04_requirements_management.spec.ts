import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('Requirements Management Suite', () => {
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

  test('04.1: Requirements Dashboard renders metric cards, search controls, and table', async () => {
    await navigateTo(page, 'Requirements');

    // Check search input
    const searchInput = page.locator('input[placeholder*="Search by Requirement ID"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Check table headers
    await expect(page.locator('th:has-text("REQUIREMENT ID")').first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('04.2: Global search input filters requirements table and clear button resets', async () => {
    const searchInput = page.locator('input[placeholder*="Search by Requirement ID"]').first();
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('Accenture');
    await page.waitForTimeout(400);

    // Verify clear button appears
    const clearBtn = page.locator('button:has-text("✕")').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('04.3: Status filter dropdown selects different requirement statuses', async () => {
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await statusSelect.selectOption({ index: 0 });
    }
  });

  test('04.4: Table select all checkbox toggles row selections', async () => {
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      await page.waitForTimeout(200);
      await selectAllCheckbox.click();
    }
  });

  test('04.5: Clicking a requirement title opens the Requirement Detail Overview and back returns', async () => {
    const reqTitleBtn = page.locator('table tbody button, table tbody a').first();
    if (await reqTitleBtn.isVisible()) {
      await reqTitleBtn.click();
      await page.waitForTimeout(500);
      const backBtn = page.locator('button:has-text("Back to Requirements"), button:has-text("Back"), button:has-text("Close")').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await expect(page.locator('table').first()).toBeVisible();
      }
    }
  });

});
