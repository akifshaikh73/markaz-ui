// @ts-check
const { test, expect } = require('@playwright/test');
const { loginWithMasjidPin, selectUnitOnMasjidLanding } = require('./helpers');

// Test coverage for new login flow architecture:
//   1. Masjid PIN login at /masjid-login
//   2. User email/PIN login at /user-login with masjid list result page
//   3. Session resume from both login types
//   4. Navigation between login pages
// Requires TEST_MASJID_PIN env var (see tests/helpers.js).

test.describe('Login Flow Navigation', () => {
    test.describe('Masjid PIN Login (/masjid-login)', () => {
        test('successfully logs in with PIN and shows MasjidLanding', async ({ page }) => {
            await loginWithMasjidPin(page);
            
            // Verify we're on MasjidLanding by checking for unit selector and buttons
            await expect(page.getByLabel(/Unit ID/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /Visitations/ })).toBeVisible();
            await expect(page.getByRole('button', { name: /Full Listings/ })).toBeVisible();
            await expect(page.getByRole('button', { name: /Quick Links/ })).toBeVisible();
        });

        test('shows error on invalid PIN and stays on form', async ({ page }) => {
            await page.goto('/masjid-login');
            await page.getByPlaceholder('Enter Masjid PIN').fill('0000');
            await page.getByRole('button', { name: 'Login', exact: true }).click();
            
            // Should see error message
            await expect(page.getByText(/Invalid PIN|Login failed/i)).toBeVisible();
            
            // Should still be on /masjid-login
            expect(page.url()).toContain('/masjid-login');
            
            // Form should still be visible
            await expect(page.getByPlaceholder('Enter Masjid PIN')).toBeVisible();
        });

        test('shows link to staff login on masjid login page', async ({ page }) => {
            await page.goto('/masjid-login');
            
            // Look for link to user-login
            const adminLink = page.locator('a[href="/user-login"]');
            await expect(adminLink).toBeVisible();
            await expect(adminLink).toContainText(/Admin Login/i);
        });

        test('session resume: returns to MasjidLanding on page refresh', async ({ page }) => {
            await loginWithMasjidPin(page);
            const initialUrl = page.url();
            
            // Refresh the page
            await page.reload();
            
            // Should be back on MasjidLanding without showing login form
            expect(page.url()).toBe(initialUrl);
            await expect(page.getByLabel(/Unit ID/i)).toBeVisible();
        });

        test('session resume: navigates to MasjidLanding when visiting /masjid-login while logged in', async ({ page }) => {
            await loginWithMasjidPin(page);
            const masjidUrl = page.url();
            
            // Try to visit /masjid-login while already logged in
            await page.goto('/masjid-login');
            
            // Should be redirected to MasjidLanding
            expect(page.url()).toBe(masjidUrl);
            await expect(page.getByLabel(/Unit ID/i)).toBeVisible();
        });
    });

    test.describe('User Email/PIN Login (/user-login)', () => {
        test('user email/pin login form is visible and distinct from masjid pin', async ({ page }) => {
            await page.goto('/user-login');
            
            // Should show email field and staff login heading
            await expect(page.getByRole('heading', { name: /Staff Login/i })).toBeVisible();
            await expect(page.getByLabel(/Email/i)).toBeVisible();
            await expect(page.getByLabel(/PIN/i)).toBeVisible();
            
            // Should show back link to masjid-login
            const backLink = page.locator('a[href="/masjid-login"]');
            await expect(backLink).toBeVisible();
            await expect(backLink).toContainText(/Masjid Login/i);
        });

        test('shows error on missing email', async ({ page }) => {
            await page.goto('/user-login');
            
            // Try to submit with empty email
            await page.getByLabel(/PIN/i).fill('1234');
            await page.getByRole('button', { name: /Staff Login/i }).click();
            
            // Should see error
            await expect(page.getByText(/Email is required/i)).toBeVisible();
            
            // Should still be on form
            expect(page.url()).toContain('/user-login');
        });

        test('shows error on missing PIN', async ({ page }) => {
            await page.goto('/user-login');
            
            // Try to submit with empty pin
            await page.getByLabel(/Email/i).fill('test@example.com');
            await page.getByRole('button', { name: /Staff Login/i }).click();
            
            // Should see error
            await expect(page.getByText(/PIN is required/i)).toBeVisible();
            
            // Should still be on form
            expect(page.url()).toContain('/user-login');
        });

        test('shows error on invalid credentials and stays on form', async ({ page }) => {
            await page.goto('/user-login');
            await page.getByLabel(/Email/i).fill('invalid@example.com');
            await page.getByLabel(/PIN/i).fill('0000');
            await page.getByRole('button', { name: /Staff Login/i }).click();
            
            // Should see error message
            await expect(page.getByText(/Invalid credentials|Login failed/i)).toBeVisible();
            
            // Should still be on /user-login
            expect(page.url()).toContain('/user-login');
            
            // Form should still be visible
            await expect(page.getByLabel(/Email/i)).toBeVisible();
        });

        test('session resume: navigates to MasjidLanding when visiting /user-login while logged in', async ({ page }) => {
            // First, log in normally via masjid PIN to set up cached credentials
            await loginWithMasjidPin(page);
            const masjidUrl = page.url();
            
            // Try to visit /user-login while already logged in
            await page.goto('/user-login');
            
            // Should be redirected to MasjidLanding
            expect(page.url()).toBe(masjidUrl);
            await expect(page.getByLabel(/Unit ID/i)).toBeVisible();
        });
    });

    test.describe('Homepage Redirect', () => {
        test('/ redirects to /masjid-login', async ({ page }) => {
            await page.goto('/');
            
            // Should redirect to /masjid-login
            await page.waitForURL('/masjid-login');
            expect(page.url()).toContain('/masjid-login');
            
            // And show the masjid PIN form
            await expect(page.getByPlaceholder('Enter Masjid PIN')).toBeVisible();
        });

        test('/ redirects to MasjidLanding if already logged in', async ({ page }) => {
            // First log in to set cached credentials
            await loginWithMasjidPin(page);
            const masjidUrl = page.url();
            
            // Try to visit /
            await page.goto('/');
            
            // Should redirect to MasjidLanding (because session resume fires before redirect)
            expect(page.url()).toBe(masjidUrl);
            await expect(page.getByLabel(/Unit ID/i)).toBeVisible();
        });
    });

    test.describe('Navigation Between Login Pages', () => {
        test('can navigate from masjid-login to user-login via link', async ({ page }) => {
            await page.goto('/masjid-login');
            
            // Click admin login link
            await page.locator('a[href="/user-login"]').click();
            
            // Should be on user-login
            await expect(page).toHaveURL('/user-login');
            await expect(page.getByRole('heading', { name: /Staff Login/i })).toBeVisible();
        });

        test('can navigate from user-login to masjid-login via link', async ({ page }) => {
            await page.goto('/user-login');
            
            // Click back to masjid login link
            await page.locator('a[href="/masjid-login"]').click();
            
            // Should be on masjid-login
            await expect(page).toHaveURL('/masjid-login');
            await expect(page.getByRole('heading', { name: /Masjid Login/i })).toBeVisible();
        });
    });
});
