// Captures the screenshots used by the User Manual (Masjid User view). They live in one place,
// public/user-manual/, which both public/user-manual.html and docs/functional-manual-user.md use.
//
// Needs the UI dev server running (npm start / ..\..\dev.ps1), then from markaz-ui/:
//   node scripts/capture-manual-screenshots.mjs [baseUrl] [masjidSlug]
// Defaults: http://localhost:3000, muthman. Then rebuild the page with
//   node scripts/build-user-manual-html.mjs
//
// By default every /api/... request is answered from scripts/manual-demo-data.mjs (fictitious
// names and streets), so the published screenshots contain no real household data and the API
// does not need to run. Pass --real-data to capture from the real API instead (internal use only).
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MASJID, LISTINGS } from './manual-demo-data.mjs';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const REAL = process.argv.includes('--real-data');
const BASE = args[0] || 'http://localhost:3000';
const SLUG = args[1] || MASJID.landing;
const OUT = path.resolve('public/user-manual');
// Capture into a temp folder and copy at the end: the dev server live-reloads the page whenever a
// file under public/ changes, which would interrupt the walk-through mid-capture.
const TMP = mkdtempSync(path.join(os.tmpdir(), 'user-manual-'));

// Example inputs; they must exist in the demo data.
const WILDCARD_SEARCH = '1301*Larkspur';
const DUPLICATE_STREET = '1301 S Larkspur';
const DUPLICATE_APT = '55';

// ---------------------------------------------------------------------------------------------
// Demo API — mirrors the visitation_api routes the Masjid User screens call.
// ---------------------------------------------------------------------------------------------
const listings = LISTINGS.map(l => ({ ...l }));
const byId = (id) => listings.find(l => l._id === String(id));
const isStudentListing = (l) => l.isStudent === true || (Array.isArray(l.students) && l.students.length > 0);
const toRad = (d) => d * Math.PI / 180;
const miles = (a, b) => {
    const dLat = toRad(b.latitude - a.latitude), dLng = toRad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

function filterSearch(c) {
    if (c._id) return listings.filter(l => l._id === String(c._id));
    const rx = (v) => new RegExp(v || '', 'i');
    const name = rx(c.name), address = rx(c.address), city = rx(c.city), phone = rx(c.phone);
    const masjidId = parseInt(c.masjidId, 10), unitId = parseInt(c.unitId, 10);
    return listings.filter(l =>
        (name.test(l.firstName || '') || name.test(l.lastName || '')) &&
        (address.test(l.address1 || '') || address.test(l.address2 || '')) &&
        city.test(l.city || '') &&
        (Number.isNaN(masjidId) || l.masjidId === masjidId) &&
        (Number.isNaN(unitId) || l.unitId === unitId) &&
        (!c.phone || phone.test(l.phoneNumber || '')) &&
        (c.showInactive === true ? l.inactive === true : l.inactive !== true) &&
        (!(c.filterByStudents === true || c.filterByStudents === 'true') || isStudentListing(l)));
}

async function demoApi(route) {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname.replace(/\/+$/, '');
    const method = req.method();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const json = (body, status = 200) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    let m;

    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (p === '/api/dbStatus') return json({ dbStatus: 'local' });
    if (p === '/api/masjids') return json([MASJID]);
    if (/^\/api\/masjids\/[^/]+$/.test(p)) return json(MASJID);
    if (p === '/api/addressList/list') {
        const unit = url.searchParams.get('unit_id');
        return json(listings.filter(l => !l.inactive && (!unit || String(l.unitId) === unit)));
    }
    if (p === '/api/addressList/filter/search') return json(filterSearch(req.postDataJSON() || {}));
    if ((m = p.match(/^\/api\/addressList\/search\/address\/(.+)$/))) {
        const re = new RegExp(decodeURIComponent(m[1]), 'i');
        return json(listings.filter(l => re.test(l.address1 || '') || re.test(l.address2 || '')));
    }
    if ((m = p.match(/^\/api\/addressList\/search\/([^/]+)$/))) return json(byId(m[1]) || null);
    if ((m = p.match(/^\/api\/addressList\/([^/]+)\/nearby$/))) {
        const source = byId(m[1]);
        if (!source) return json({ error: 'Listing not found' }, 404);
        const count = Math.min(parseInt(url.searchParams.get('count'), 10) || 5, 50);
        return json(listings
            .filter(l => l._id !== source._id && !l.inactive && l.masjidId === source.masjidId)
            .map(l => ({ ...l, distanceMiles: miles(source, l) }))
            .sort((a, b) => a.distanceMiles - b.distanceMiles)
            .slice(0, count));
    }
    if (['PUT', 'POST', 'PATCH'].includes(method)) {
        const target = (m = p.match(/^\/api\/addressList\/([^/]+)$/)) && byId(m[1]);
        if (target && method === 'PUT') Object.assign(target, req.postDataJSON() || {});
        return json({ acknowledged: true, matchedCount: 1, modifiedCount: 1, _id: target ? target._id : '5999' });
    }
    return json({ error: `not in demo data: ${method} ${p}` }, 404);
}

// ---------------------------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------------------------
const browser = await chromium.launch();
// Service workers are blocked: the app's registration reloads the page after load, which would
// cancel the next navigation (and could serve cached responses past the demo API).
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
if (!REAL) await page.route(u => u.pathname.startsWith('/api/'), demoApi);
page.on('dialog', d => d.accept()); // e.g. "Open the existing listing?" confirmations
console.log(REAL ? 'Using the REAL API — do not publish these screenshots.' : 'Using demo data.');

const shot = async (name, target = page) => {
    await page.waitForTimeout(400);
    await target.screenshot({ path: path.join(TMP, `${name}.png`) });
    console.log('saved', name);
};
const landing = async (unit = 'all') => {
    await page.goto(`${BASE}/${SLUG}`);
    const unitSelect = page.locator('select').first();
    await unitSelect.waitFor();
    await unitSelect.selectOption(unit);
};

// 1. Masjid login
await page.goto(`${BASE}/masjid-login`);
await page.waitForLoadState('networkidle');
await shot('01-masjid-login');

// 2. Masjid landing (via the masjid link — signs in as Masjid User)
await landing('all');
await page.waitForLoadState('networkidle');
await shot('02-masjid-landing');

// 3. Visitations
await landing('1');
await page.getByText('📊 Visitations').click();
await page.getByText(/loaded/).first().waitFor({ timeout: 60000 });
await shot('03-visitations');

// 4. Full Listings (all units)
await landing('all');
await page.getByText('📋 Full Listings').click();
await page.getByPlaceholder('Address').waitFor();
await page.waitForLoadState('networkidle');
await shot('04-full-listings');

// 5. Wildcard address search
await page.getByPlaceholder('Address').fill(WILDCARD_SEARCH);
await page.getByRole('button', { name: 'Search' }).click();
await page.waitForLoadState('networkidle');
await shot('05-search-wildcard');

// 6. Add Address with the duplicate check
await page.getByRole('button', { name: '+ Add Address' }).click();
await page.getByPlaceholder('Street address').fill(DUPLICATE_STREET);
await page.getByPlaceholder('Apt / Suite / Unit').fill(DUPLICATE_APT);
await page.getByText(/This address already exists/).waitFor({ timeout: 60000 });
const form = page.getByRole('heading', { name: 'Add New Address' }).locator('..');
await form.scrollIntoViewIfNeeded();
await shot('06-add-address-duplicate', form);

// 7. Address detail (first matching listing)
await page.locator('[role="alert"] li').first().getByRole('button', { name: /Open listing|Activate & open/ }).click();
await page.getByText('Address Detail').waitFor();
await page.waitForLoadState('networkidle');
await shot('07-address-detail');

// 8. Route view from the address: add the nearest addresses, then optimize
const routeBtn = page.getByRole('button', { name: /Route/ }).first();
const tilesLoaded = () => page.locator('img.leaflet-tile-loaded').first().waitFor({ timeout: 30000 }).catch(() => {});
if (await routeBtn.isEnabled()) {
    await routeBtn.click();
    await tilesLoaded();
    const go = page.getByRole('button', { name: 'Go' });
    if (await go.isVisible()) {
        await go.click();
        await page.waitForLoadState('networkidle');
    }
    await page.getByRole('button', { name: /Optimize Route/ }).click();
    await page.getByText(/~\d+(\.\d+)? mi/).waitFor({ timeout: 30000 }).catch(() => {});
    await tilesLoaded();
    await page.waitForTimeout(2000);
    await shot('08-route');
}

// 9. Student Listings
await landing('all');
await page.getByText('🎓 Student Listings').click();
await page.getByPlaceholder('Address').waitFor();
await page.waitForLoadState('networkidle');
await shot('09-student-listings');

// 10. Quick Links
await landing('all');
await page.getByText('Access key features and tools').click();
await page.getByRole('heading', { name: 'Quick Links' }).waitFor();
await shot('10-quick-links');

await browser.close();

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(TMP)) copyFileSync(path.join(TMP, f), path.join(OUT, f));
rmSync(TMP, { recursive: true, force: true });
console.log(`copied to ${OUT}`);
