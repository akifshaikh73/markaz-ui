// @ts-check
const { test, expect } = require('@playwright/test');
const { loginWithMasjidPin, selectUnitOnMasjidLanding } = require('./helpers');

// Regression coverage for:
//   1. Visitation -> AddressDetail -> Back (must return to Visitation, same unit/area filters)
//   2. Visitation -> Route (unit-level) -> AddressDetail -> Back (must return to Route, not an empty map)
//                  -> Back to List (must return to Visitation)
// Requires TEST_MASJID_PIN env var (see tests/helpers.js).

test.describe('Visitation navigation', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithMasjidPin(page);
        await selectUnitOnMasjidLanding(page); // keep whatever unit is pre-selected
        await page.getByRole('button', { name: /Visitations/ }).click();
        await expect(page.getByRole('heading', { name: 'Visitations' })).toBeVisible();
    });

    test('AddressDetail back returns to Visitation with unchanged unit/area filters', async ({ page }) => {
        const unitSelect = page.getByLabel('Unit:');
        const areaSelect = page.getByLabel('Area:');
        await expect(page.locator('a[href^="/address/"]').first()).toBeVisible();

        const unitBefore = await unitSelect.inputValue();
        const areaBefore = await areaSelect.inputValue();

        await page.locator('a[href^="/address/"]').first().click();
        await expect(page.getByRole('heading', { name: 'Address Detail' })).toBeVisible();

        await page.getByRole('button', { name: '← Back' }).click();

        await expect(page.getByRole('heading', { name: 'Visitations' })).toBeVisible();
        await expect(page.getByLabel('Unit:')).toHaveValue(unitBefore);
        await expect(page.getByLabel('Area:')).toHaveValue(areaBefore);
    });

    test('Route (unit level) -> AddressDetail -> Back keeps route context, then Back to List returns to Visitation', async ({ page }) => {
        // "Route Unit" button routes every address currently shown for that unit group
        await page.getByRole('button', { name: '🗺 Route Unit' }).first().click();
        await expect(page).toHaveURL(/\/route$/);

        const routeRows = page.locator('table:has(th:text("Coords")) tbody tr');
        const rowCountBeforeDetail = await routeRows.count();
        expect(rowCountBeforeDetail).toBeGreaterThan(0);

        // Click first address row's ID cell (2nd td — 1st is the selection checkbox) to open AddressDetail
        await routeRows.first().locator('td').nth(1).click();
        await expect(page.getByRole('heading', { name: 'Address Detail' })).toBeVisible();

        await page.getByRole('button', { name: '← Back' }).click();

        // Back on Route — listings/map context must be restored, not empty
        await expect(page).toHaveURL(/\/route$/);
        await expect(routeRows).toHaveCount(rowCountBeforeDetail);

        await page.getByRole('button', { name: '← Back to List' }).click();
        await expect(page.getByRole('heading', { name: 'Visitations' })).toBeVisible();
    });
});
