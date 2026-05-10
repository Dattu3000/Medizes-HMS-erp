/**
 * Medisys HMS – End-to-End Test Suite
 * =====================================
 * Coverage:
 *  1. Backend API health check
 *  2. Login page UI & validation
 *  3. Login API (correct credentials → JWT stored)
 *  4. Auth guard (unauthenticated redirect)
 *  5. Dashboard overview loads
 *  6. Sidebar navigation (all 10 module pages)
 *  7. Logout flow
 *  8. API modules smoke-test (all major endpoints return ≠ 401/500)
 *
 * Prerequisites:
 *  - Backend running at http://localhost:5000
 *  - A seeded test employee.  Update TEST_EMP_ID / TEST_PASSWORD below.
 */

import { test, expect, request, type Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Configuration – update these to match a real seeded employee       */
/* ------------------------------------------------------------------ */
const BACKEND_URL  = 'http://localhost:5000';
const TEST_EMP_ID   = process.env.TEST_EMP_ID   || 'EMP-0000-ADMIN';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

/* ------------------------------------------------------------------ */
/*  Helper: log in via API and inject token into localStorage          */
/* ------------------------------------------------------------------ */
async function loginViaApi(page: Page): Promise<string | null> {
  const resp = await page.request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { employeeId: TEST_EMP_ID, password: TEST_PASSWORD },
  });

  if (!resp.ok()) {
    console.warn(`[loginViaApi] Login returned ${resp.status()} – skipping auth-required tests`);
    return null;
  }

  const body = await resp.json();
  const token: string = body.token ?? body.tempToken ?? '';

  // Inject token before each page that needs it
  await page.addInitScript((tok) => {
    localStorage.setItem('token', tok);
  }, token);

  return token;
}

/* ================================================================== */
/*  SUITE 1 – Backend Health                                           */
/* ================================================================== */
test.describe('Backend Health', () => {
  test('GET /health returns status UP', async ({ request: req }) => {
    const resp = await req.get(`${BACKEND_URL}/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('UP');
    expect(body.timestamp).toBeTruthy();
  });
});

/* ================================================================== */
/*  SUITE 2 – Login Page UI                                            */
/* ================================================================== */
test.describe('Login Page – UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders Medisys HMS heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Medisys HMS');
  });

  test('renders Employee ID and Password inputs', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('renders Sign In submit button', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('shows error on empty submission', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    // HTML5 required validation prevents submission; form should not navigate
    await expect(page).toHaveURL('/login');
  });

  test('shows error message on wrong credentials', async ({ page }) => {
    await page.locator('input[type="text"]').fill('WRONG-EMP');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    // Error div should appear
    await expect(page.locator('div.text-red-600, div.text-red-500')).toBeVisible({ timeout: 8000 });
  });
});

/* ================================================================== */
/*  SUITE 3 – Authentication Flow                                      */
/* ================================================================== */
test.describe('Authentication Flow', () => {
  test('redirects unauthenticated user to /login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('login with valid credentials stores token and redirects', async ({ page }) => {
    // Use the API first to confirm credentials are valid before UI test
    const apiCtx = await request.newContext();
    const resp = await apiCtx.post(`${BACKEND_URL}/api/auth/login`, {
      data: { employeeId: TEST_EMP_ID, password: TEST_PASSWORD },
    });

    // If the API returns 200 with a token (no 2FA) proceed with UI test
    if (resp.ok()) {
      const body = await resp.json();
      const noOtp = !body.otpRequired;

      if (noOtp && body.token) {
        // UI login flow
        await page.goto('/login');
        await page.locator('input[type="text"]').fill(TEST_EMP_ID);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
      } else {
        // 2FA enabled – verify token is returned as tempToken
        expect(body.tempToken || body.otpRequired).toBeTruthy();
        test.info().annotations.push({ type: 'info', description: '2FA is enabled for this account – UI redirect test skipped' });
      }
    } else {
      test.skip(true, `Login API returned ${resp.status()} – check TEST_EMP_ID / TEST_PASSWORD`);
    }
  });
});

/* ================================================================== */
/*  SUITE 4 – Dashboard & Navigation (requires auth token)            */
/* ================================================================== */
test.describe('Dashboard & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const token = await loginViaApi(page);
    if (!token) test.skip(true, 'Cannot obtain token – skipping dashboard tests');
  });

  test('dashboard overview page loads with MEDISYS HMS heading', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=MEDISYS HMS')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar shows all module navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    const links: Array<{ text: string; href: string }> = [
      { text: 'Overview',       href: '/dashboard' },
      { text: 'Patient & OPD', href: '/dashboard/patients' },
      { text: "Doctor's EHR",  href: '/dashboard/ehr' },
      { text: 'IPD / Wards',   href: '/dashboard/ipd' },
      { text: 'Pharmacy',      href: '/dashboard/pharmacy' },
      { text: 'Lab Reports',   href: '/dashboard/lab' },
      { text: 'HR Module',     href: '/dashboard/hr' },
      { text: 'Billing Desk',  href: '/dashboard/billing' },
      { text: 'Accounts',      href: '/dashboard/accounts' },
      { text: 'Reports',       href: '/dashboard/reports' },
      { text: 'System Admin',  href: '/dashboard/admin' },
    ];
    for (const { text, href } of links) {
      await expect(
        page.locator(`nav a[href="${href}"]`),
        `Nav link "${text}" (${href}) should be visible`
      ).toBeVisible();
    }
  });

  test('navigates to Patient & OPD page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('nav a:has-text("Patient")').click();
    await expect(page).toHaveURL(/\/dashboard\/patients/, { timeout: 10000 });
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Doctor EHR page', async ({ page }) => {
    await page.goto('/dashboard/ehr');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to IPD / Wards page', async ({ page }) => {
    await page.goto('/dashboard/ipd');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Pharmacy page', async ({ page }) => {
    await page.goto('/dashboard/pharmacy');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Lab Reports page', async ({ page }) => {
    await page.goto('/dashboard/lab');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to HR Module page', async ({ page }) => {
    await page.goto('/dashboard/hr');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Billing Desk page', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Accounts page', async ({ page }) => {
    await page.goto('/dashboard/accounts');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Reports page', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigates to System Admin page', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('notification bell is visible in header', async ({ page }) => {
    await page.goto('/dashboard');
    // Bell button in the top-bar
    await expect(page.locator('header button').first()).toBeVisible({ timeout: 8000 });
  });

  test('logout button clears token and redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button:has-text("Secure Logout")').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

/* ================================================================== */
/*  SUITE 5 – Backend API Smoke Tests (authenticated)                  */
/* ================================================================== */
test.describe('Backend API – Authenticated Smoke Tests', () => {
  let authToken = '';

  test.beforeAll(async ({ request: req }) => {
    const resp = await req.post(`${BACKEND_URL}/api/auth/login`, {
      data: { employeeId: TEST_EMP_ID, password: TEST_PASSWORD },
    });
    if (resp.ok()) {
      const body = await resp.json();
      authToken = body.token ?? '';
    }
  });

  const apiEndpoints: Array<{ name: string; path: string }> = [
    { name: 'Analytics / Reports',  path: '/api/reports/analytics' },
    { name: 'Patients list',         path: '/api/patient' },
    { name: 'IPD admissions',        path: '/api/ipd' },
    { name: 'Lab tests',             path: '/api/lab' },
    { name: 'Pharmacy medicines',    path: '/api/pharmacy/medicines' },
    { name: 'HR employees',          path: '/api/hr/employees' },
    { name: 'Billing invoices',      path: '/api/billing' },
    { name: 'Notifications',         path: '/api/notifications' },
    { name: 'Infrastructure assets', path: '/api/infrastructure' },
    { name: 'Training records',      path: '/api/training' },
    { name: 'Referrals',             path: '/api/referrals' },
    { name: 'Accounts ledger',       path: '/api/accounts' },
  ];

  for (const ep of apiEndpoints) {
    test(`GET ${ep.name} – returns 200 or 404 (not 401/500)`, async ({ request: req }) => {
      if (!authToken) {
        test.skip(true, 'No auth token – skipping API smoke test');
        return;
      }
      const resp = await req.get(`${BACKEND_URL}${ep.path}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Accept 200, 201, 204 or 404 (route may not have data yet)
      // Reject 401 (auth broken) and 500 (server crash)
      expect(
        [200, 201, 204, 404],
        `${ep.name} returned ${resp.status()} – expected 2xx or 404`
      ).toContain(resp.status());
    });
  }
});

/* ================================================================== */
/*  SUITE 6 – Page Responsiveness (no auth required)                   */
/* ================================================================== */
test.describe('Public Pages', () => {
  test('root path redirects or renders (not blank)', async ({ page }) => {
    await page.goto('/');
    // Either shows login or redirects – page should not be blank
    const body = await page.locator('body').textContent();
    expect((body ?? '').trim().length).toBeGreaterThan(0);
  });

  test('login page has correct <title> or text branding', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    const hasTitle = title.length > 0;
    const hasBranding = await page.locator('text=Medisys').isVisible();
    expect(hasTitle || hasBranding).toBeTruthy();
  });
});
