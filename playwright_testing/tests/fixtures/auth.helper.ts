import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export type DemoRole = 'superadmin' | 'admin' | 'lead' | 'recruiter' | 'devteam' | 'client';

export const DEMO_USERS: Record<DemoRole, { email: string; pass: string; label: string; name: string }> = {
  superadmin: {
    email: 'r.haines@talentflow.io',
    pass: 'Admin@2026',
    label: 'Super Admin',
    name: 'Robert Haines',
  },
  admin: {
    email: 'd.park@talentflow.io',
    pass: 'Admin@2026',
    label: 'Admin',
    name: 'David Park',
  },
  lead: {
    email: 'harish.g@metaforgeit.com',
    pass: 'Lead@2026',
    label: 'Team Lead',
    name: 'Harish Gadipally',
  },
  recruiter: {
    email: 'm.chen@talentflow.io',
    pass: 'Rec@2026',
    label: 'Recruiter',
    name: 'Marcus Chen',
  },
  devteam: {
    email: 'dev.team@talentflow.io',
    pass: 'Dev@2026',
    label: 'Dev Team',
    name: 'Dev Team Engineer',
  },
  client: {
    email: 'client@accenture.com',
    pass: 'Client@2026',
    label: 'Client',
    name: 'Accenture Hiring Partner',
  },
};

/** Cookie storageState cache (HttpOnly tokens — never localStorage JWTs). */
const STATE_DIR = path.join(__dirname, '..', '..', '.auth_states');

function statePath(role: string) {
  return path.join(STATE_DIR, `${role}.json`);
}

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Reset cookies/storage and navigate to a clean landing page.
 */
export async function gotoLanding(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  const logoutBtn = page.locator('aside button:has-text("Logout"), aside button:has-text("Sign Out")').first();
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(400);
  }

  await expect(page.locator('button:has-text("Sign In to MRAP")').first()).toBeVisible({ timeout: 10000 });
}

/**
 * Reuse a saved Playwright storageState (cookies) for this role.
 */
async function tryLoginWithCachedCookies(page: Page, role: string): Promise<boolean> {
  const file = statePath(role);
  if (!fs.existsSync(file)) return false;

  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!state?.cookies?.length) return false;
    await page.context().addCookies(state.cookies);
  } catch {
    return false;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    if (await page.locator('aside').first().isVisible({ timeout: 10000 }).catch(() => false)) {
      return true;
    }
    if (attempt < 3) {
      await page.waitForTimeout(2500 * attempt);
    }
  }
  return false;
}

async function saveCookieState(page: Page, role: string) {
  try {
    ensureStateDir();
    const state = await page.context().storageState();
    fs.writeFileSync(statePath(role), JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}

async function interactiveQuickLogin(page: Page, role: Exclude<DemoRole, 'client'>) {
  await gotoLanding(page);
  await page.locator('button:has-text("Sign In to MRAP")').first().click();
  await expect(page.locator('text=Dev Quick Login').first()).toBeVisible({ timeout: 8000 });

  const user = DEMO_USERS[role];
  const card = page.locator('div.rounded-xl').filter({ hasText: user.email }).first();
  await expect(card).toBeVisible({ timeout: 5000 });

  const clickSignIn = async () => {
    await page.waitForTimeout(300);
    await card.locator('button:has-text("1-Click Sign In")').click();
  };

  await clickSignIn();

  const apiError = page.locator('text=Unable to reach the API').first();
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (await page.locator('aside').first().isVisible({ timeout: 8000 }).catch(() => false)) {
      break;
    }
    if (await apiError.isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.waitForTimeout(attempt === 3 ? 62000 : 4000 * attempt);
      await clickSignIn();
    } else {
      await page.waitForTimeout(1500);
    }
  }

  await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });
}

/**
 * 1-Click login using Dev Quick Login; caches HttpOnly cookie storageState (not localStorage JWTs).
 */
export async function loginWithQuickChooser(page: Page, role: Exclude<DemoRole, 'client'>) {
  if (await tryLoginWithCachedCookies(page, role)) {
    return;
  }

  await interactiveQuickLogin(page, role);
  await saveCookieState(page, role);
}

/**
 * Password form login helper
 */
export async function loginWithCredentials(page: Page, email: string, pass: string) {
  await gotoLanding(page);
  await page.locator('button:has-text("Sign In to MRAP")').first().click();

  const switchBtn = page.locator('button:has-text("Sign in with password instead")');
  if (await switchBtn.isVisible()) {
    await switchBtn.click();
  }

  const emailInput = page.locator('input[type="email"], input[placeholder*="you@company.com"], input[placeholder*="registered@email.com"]').first();
  await emailInput.fill(email);

  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(pass);

  const submitBtn = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Sign in")').first();
  await submitBtn.click();
}

/**
 * Log out from the application
 */
export async function logout(page: Page) {
  const logoutBtn = page.locator('aside button:has-text("Logout"), aside button:has-text("Sign Out")').first();
  await expect(logoutBtn).toBeVisible({ timeout: 6000 });
  await logoutBtn.click();
  await expect(page.locator('button:has-text("Sign In to MRAP")').first()).toBeVisible({ timeout: 10000 });
}

/**
 * Click navigation link in sidebar
 */
export async function navigateTo(page: Page, navTitle: string) {
  const navBtn = page.locator(`aside nav button:has-text("${navTitle}")`).first();
  await expect(navBtn).toBeVisible({ timeout: 6000 });
  await navBtn.click();
}
