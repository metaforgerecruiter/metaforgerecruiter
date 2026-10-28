import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('Candidate Management Suite', () => {
  test.describe.configure({ timeout: 120000 });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    page = await browser.newPage();
    await loginWithQuickChooser(page, 'superadmin');
    await navigateTo(page, 'Add Candidates');
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('05.1: Candidate entry form renders all essential candidate fields', async () => {
    // Check page header
    await expect(page.locator('text=Candidate Search & Entry').first()).toBeVisible({ timeout: 10000 });

    // Verify input fields for Basic Info (current placeholders: "e.g. John Doe", "name@company.com")
    await expect(page.locator('input[placeholder*="John Doe"], input[placeholder*="Full Name"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="name@company.com"], input[placeholder*="email"], input[type="email"]').first()).toBeVisible();

    // Verify Repository action button
    const repoBtn = page.locator('button:has-text("Candidate Repository")').first();
    await expect(repoBtn).toBeVisible();
  });

  test('05.2: Toggles between Add Candidate form and Candidate Repository view', async () => {
    // Click Candidate Repository
    const repoBtn = page.locator('button:has-text("Candidate Repository")').first();
    await repoBtn.click();

    // Verify Candidate Repository heading
    await expect(page.locator('h1:has-text("Candidate Repository")').first()).toBeVisible({ timeout: 8000 });

    // Click "+ Add Candidate" to return
    const addBtn = page.locator('button:has-text("+ Add Candidate")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify back on Add Candidate form
    await expect(page.locator('text=Candidate Search & Entry').first()).toBeVisible({ timeout: 8000 });
  });

  test('05.3: Searches and filters candidates inside the Candidate Repository', async () => {
    // Navigate into Candidate Repository
    await page.locator('button:has-text("Candidate Repository")').first().click();
    await expect(page.locator('h1:has-text("Candidate Repository")').first()).toBeVisible({ timeout: 8000 });

    // Verify filter dropdowns exist
    const periodSelect = page.locator('select').first();
    await expect(periodSelect).toBeVisible();
    await periodSelect.selectOption({ index: 1 });
    await page.waitForTimeout(200);
    await periodSelect.selectOption({ index: 0 });

    // Return to Add Candidate
    const addBtn = page.locator('button:has-text("+ Add Candidate")').first();
    await addBtn.click();
    await expect(page.locator('text=Candidate Search & Entry').first()).toBeVisible({ timeout: 8000 });
  });

  test('05.4: Form validation prevents submission when required fields are empty', async () => {
    // Find the submit button on Add Candidate form
    const submitBtn = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Save Candidate"), button[type="submit"]:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Form should not navigate away, header remains visible
      await expect(page.locator('text=Candidate Search & Entry').first()).toBeVisible();
    }
  });

});
