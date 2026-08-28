// Shared helpers for navigation regression tests.

const PIN = process.env.TEST_MASJID_PIN || '1208';

/**
 * Logs in via the Masjid PIN form on /masjid-login and waits for the
 * MasjidLanding ("home") page to load.
 * @param {import('@playwright/test').Page} page
 */
async function loginWithMasjidPin(page) {
    await page.goto('/masjid-login');
    await page.getByPlaceholder('Enter Masjid PIN').fill(PIN);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // MasjidLanding shows the masjid name as an <h2>; any masjid name qualifies.
    await page.waitForURL(/\/[^/]+$/);
    await page.locator('h2').first().waitFor();
}

/**
 * On MasjidLanding, selects the given unit (or leaves the default selection)
 * and returns the unit value actually selected.
 * @param {import('@playwright/test').Page} page
 * @param {string} [unit] - explicit unit value to select; keeps current default if omitted
 */
async function selectUnitOnMasjidLanding(page, unit) {
    const unitSelect = page.getByLabel(/Unit ID/i);
    await unitSelect.waitFor();
    if (unit) {
        await unitSelect.selectOption(unit);
    }
    return unitSelect.inputValue();
}

module.exports = { loginWithMasjidPin, selectUnitOnMasjidLanding };
