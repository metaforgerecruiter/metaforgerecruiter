import { test, expect } from '@playwright/test';
import { gotoLanding, loginWithQuickChooser, loginWithCredentials, logout, DEMO_USERS } from './fixtures/auth.helper';

test.describe('Authentication & Session Suite', () => {

  test('02.1: Invalid credentials error handling on manual password sign-in', async ({ page }) => {
    await gotoLanding(page);
    await loginWithCredentials(page, 'nonexistent.user@example.com', 'WrongPassword123!');
    // An error alert or validation message should be visible
    const alert = page.locator('text=Invalid').or(page.locator('.text-rose-500')).or(page.locator('text=not found')).first();
    await expect(alert).toBeVisible({ timeout: 8000 });
  });

  test('02.2: Login as Super Admin and verify administrator permissions and navigation', async ({ page }) => {
    await gotoLanding(page);
    await loginWithQuickChooser(page, 'superadmin');

    // Verify role label in sidebar
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('text=Super Admin').first()).toBeVisible();

    // Verify Super Admin specific nav items
    await expect(page.locator('aside button:has-text("Requirements")').first()).toBeVisible();
    await expect(page.locator('aside button:has-text("User Management")').first()).toBeVisible();
    await expect(page.locator('aside button:has-text("Clients")').first()).toBeVisible();
    await expect(page.locator('aside button:has-text("Audit Logs")').first()).toBeVisible();

    // Verify topbar
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('02.3: Login as Client, verify client-scoped access and successful sign-out', async ({ page }) => {
    await gotoLanding(page);
    // Client logs in via password form credentials
    await loginWithCredentials(page, DEMO_USERS.client.email, DEMO_USERS.client.pass);

    // Wait until sidebar appears
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 12000 });

    // Verify client role indicator
    await expect(page.locator('text=Client').first()).toBeVisible();
    // Client should see My Requirements or Reports
    await expect(page.locator('aside button:has-text("My Requirements"), aside button:has-text("Requirements")').first()).toBeVisible();

    // Client should NOT have User Management access
    await expect(page.locator('aside button:has-text("User Management")')).toHaveCount(0);

    // Test sign-out and session invalidation
    await logout(page);
    await expect(page.locator('button:has-text("Sign In to MRAP")').first()).toBeVisible();

    // Reloading page returns to landing page
    await page.reload();
    await expect(page.locator('button:has-text("Sign In to MRAP")').first()).toBeVisible();
  });

});
