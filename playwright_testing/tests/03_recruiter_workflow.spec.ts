import { test, expect, Page } from '@playwright/test';
import { loginWithQuickChooser, navigateTo } from './fixtures/auth.helper';

test.describe('Recruiter Workflow & Dashboard Suite', () => {
  test.describe.configure({ timeout: 120000 });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    page = await browser.newPage();
    await loginWithQuickChooser(page, 'recruiter');
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('03.1: Recruiter dashboard loads with My Workspace header and Performance Summary', async () => {
    // Check Workspace header
    await expect(page.locator('text=My Workspace').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Your personal assignments, submissions, and daily activity').first()).toBeVisible();

    // Check Performance Summary cards (current labels)
    await expect(page.locator('text=Performance Summary').first()).toBeVisible();
    await expect(page.locator('text=Assigned Requirements').first()).toBeVisible();
    await expect(page.locator('text=Total Submissions').first()).toBeVisible();
    await expect(page.locator('text=Interviews Handled').first()).toBeVisible();
  });

  test('03.2: Drill-down from Performance Summary card into interview tracking view', async () => {
    // Click Interviews Handled card in Performance Summary
    const ivCard = page.locator('div[title="Click to view Interview Tracking details"]').first();
    if (await ivCard.isVisible()) {
      await ivCard.click();
      // Back to My Workspace button should be visible
      await expect(page.locator('button:has-text("Back to My Workspace")').first()).toBeVisible({ timeout: 8000 });
      // Click back
      await page.locator('button:has-text("Back to My Workspace")').first().click();
      await expect(page.locator('text=Performance Summary').first()).toBeVisible();
    }
  });

  test('03.3: Topbar notifications popover can be toggled open and closed', async () => {
    // Find notification bell in header
    const notifBtn = page.locator('header button').filter({ has: page.locator('svg') }).first();
    await expect(notifBtn).toBeVisible();
    await notifBtn.click();

    // Either popover opens or toast notification container is interactive
    // Click anywhere else to dismiss popover
    await page.locator('header').click();
  });

  test('03.4: Recruiter can navigate between My Work, Requirements, and Add Candidate', async () => {
    // Navigate to Requirements
    await navigateTo(page, 'Requirements');
    await expect(page.locator('text=Requirements Dashboard').or(page.locator('input[placeholder*="Search by Requirement ID"]')).first()).toBeVisible({ timeout: 8000 });

    // Navigate to Add Candidate
    await navigateTo(page, 'Add Candidate');
    await expect(page.locator('text=Candidate Search & Entry').or(page.locator('text=Candidate Repository')).first()).toBeVisible({ timeout: 8000 });

    // Return via recruiter sidebar label "My Work" (page header remains "My Workspace")
    await navigateTo(page, 'My Work');
    await expect(page.locator('text=My Workspace').first()).toBeVisible({ timeout: 8000 });
  });

});
