// @ts-check
const { test, expect } = require('@playwright/test');
const { loginWithMasjidPin, selectUnitOnMasjidLanding } = require('./helpers');

// Regression coverage for:
//   1. Landing (Full Listing) -> AddressDetail -> Back (must return to Landing, same unit/neighborhood)
//   2. Landing -> Route (selected addresses) -> AddressDetail -> Back (must return to Route, not empty)
//                 -> Back to List (must return to Landing)
// Requires TEST_MASJID_PIN env var (see tests/helpers.js).

test.describe('Landing (Full Listing) navigation', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithMasjidPin(page);
        await selectUnitOnMasjidLanding(page); // keep whatever unit is pre-selected
        await page.getByRole('button', { name: /Full Listings/ }).click();
        await expect(page.getByRole('heading', { name: /Address List/ })).toBeVisible();
    });

    test('AddressDetail back returns to Landing with unchanged unit/neighborhood', async ({ page }) => {
        await expect(page.locator('a[href^="/address/"]').first()).toBeVisible();

        const urlBefore = page.url();
        const neighborhoodBefore = await page.getByLabel('Neighborhood:').inputValue();

        await page.locator('a[href^="/address/"]').first().click();
        await expect(page.getByRole('heading', { name: 'Address Detail' })).toBeVisible();

        await page.getByRole('button', { name: '← Back' }).click();

        await expect(page.getByRole('heading', { name: /Address List/ })).toBeVisible();
        expect(page.url()).toBe(urlBefore);
        await expect(page.getByLabel('Neighborhood:')).toHaveValue(neighborhoodBefore);
    });

    test('Route (selected addresses) -> AddressDetail -> Back keeps route context, then Back to List returns to Landing', async ({ page }) => {
        await page.locator('input[title="Select for area assignment"]').first().check();
        await page.getByRole('button', { name: /🗺 Route \(\d+\)/ }).click();
        await expect(page).toHaveURL(/\/route$/);

        const routeRows = page.locator('table:has(th:text("Coords")) tbody tr');
        const rowCountBeforeDetail = await routeRows.count();
        expect(rowCountBeforeDetail).toBeGreaterThan(0);

        await routeRows.first().locator('td').nth(1).click();
        await expect(page.getByRole('heading', { name: 'Address Detail' })).toBeVisible();

        await page.getByRole('button', { name: '← Back' }).click();

        // Back on Route — listings/map context must be restored, not empty
        await expect(page).toHaveURL(/\/route$/);
        await expect(routeRows).toHaveCount(rowCountBeforeDetail);

        await page.getByRole('button', { name: '← Back to List' }).click();
        await expect(page.getByRole('heading', { name: /Address List/ })).toBeVisible();
    });
});
