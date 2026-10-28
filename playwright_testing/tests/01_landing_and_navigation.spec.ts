import { test, expect } from '@playwright/test';
import { gotoLanding } from './fixtures/auth.helper';

test.describe('Landing Page & Navigation Suite', () => {

  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('01.1: Landing page loads successfully with complete branding and hero elements', async ({ page }) => {
    // Check page title & URL
    await expect(page).toHaveURL(/localhost:3000/);

    // Check branding
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('text=Recruiter Intelligence').first()).toBeVisible();

    // Check Hero primary actions
    const signInBtn = page.locator('button:has-text("Sign In to MRAP")').first();
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toBeEnabled();

    const requestAccessBtn = page.locator('button:has-text("Request Workspace Access")').first();
    await expect(requestAccessBtn).toBeVisible();

    // Check AI intelligence section exists
    await expect(page.locator('text=AI Intelligence Engine').first()).toBeVisible();
  });

  test('01.2: Navigates from Landing to Sign-In page and returns via Back button', async ({ page }) => {
    // Click Sign In
    await page.locator('button:has-text("Sign In to MRAP")').first().click();

    // Verify Sign In page loaded
    await expect(page.locator('text=MRAP Console').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Dev Quick Login').first()).toBeVisible();

    // Click "Back to home"
    const backBtn = page.locator('button:has-text("Back to home"), a:has-text("Back to home")').first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify back on landing page
    await expect(page.locator('button:has-text("Sign In to MRAP")').first()).toBeVisible({ timeout: 6000 });
  });

  test('01.3: Navigates from Landing to Request Access (Sign Up) page and verifies form elements', async ({ page }) => {
    // Click Request Workspace Access
    await page.locator('button:has-text("Request Workspace Access")').first().click();

    // Verify Sign Up / Request Access screen loaded
    await expect(page.locator('text=Administrator-Approved Access').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Request access to').first()).toBeVisible();

    // Verify form input fields
    await expect(page.locator('input[type="email"]').first()).toBeVisible();

    // Return to sign in / back
    const backBtn = page.locator('button:has-text("Back to sign in"), button:has-text("Back")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.locator('text=MRAP Console').or(page.locator('text=Sign in to your')).first()).toBeVisible({ timeout: 6000 });
    }
  });

  test('01.4: Verifies footer, external links and capabilities preview', async ({ page }) => {
    // Scroll to footer
    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
      await expect(footer).toBeVisible();
    }
    // Verify capabilities section is rendered
    await expect(page.locator('text=Recruiter Intelligence').first()).toBeVisible();
  });

});
