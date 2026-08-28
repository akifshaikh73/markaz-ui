// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Requires the UI dev server (npm start / scripts/start.ps1) and the API to
 * already be running — this config does not spin them up automatically since
 * both a frontend and backend process are needed.
 *
 * Required env vars (see tests/README below in this file's header comment):
 *   PLAYWRIGHT_BASE_URL  - defaults to http://localhost:3001
 *   TEST_MASJID_PIN      - a valid Masjid PIN (MasjidUser role) with at least
 *                          one unit that has addresses assigned to it
 */
module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: false,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
