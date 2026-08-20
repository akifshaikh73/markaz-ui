# Changelog

All notable changes to Markaz Visitation UI are documented here.  
Format: `<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---

## 2026-08-20

- **feat(pwa):** Smart PWA entry point — Home component redirects to preferred masjid on app launch if stored; saves masjid preference on login and clears on logout. Users on returning visits go directly to their last masjid instead of home page.

---

## 2026-08-19

- **refactor(nav):** Removed redundant Masjid Quick Access page (`All.js`) and its Home link; landing slug in Masjid Management list is now a clickable link to the masjid's login page.
- **fix(masjid-detail):** Renamed "Landing" field to "Landing Page URL" with a clickable link, matching the management list style.
- **fix(search):** Unit value `0` no longer treated as falsy in search form state init, sync effect, and `doSearch` — selecting unit 0 now correctly filters results instead of returning all units.

---

## 2026-08-18

### Auth
- **refactor(auth):** Replaced dual `ADMIN` + `loginSource` localStorage keys with a single `userRole` key (`MarkazAdmin` | `MasjidAdmin` | `''`); `getAdmin()` now derives from role; `loginSource` removed entirely.
- **feat(auth):** "Continue as Admin" shortcut on `/masjid-login` when an admin session already exists in localStorage; password input gains `autocomplete="current-password"`.

### Config / Data
- **feat(config):** Removed hardcoded `MASJID_CONFIG` list from `config.js`; replaced with `MasjidProvider` context (`src/hooks/useMasjids.js`) that fetches `/api/masjids` at startup with sessionStorage caching. `All`, `Landing`, `MasjidLanding`, and `AddressDetail` now consume live DB data.
- **feat(config):** Unit options on the address list page are now populated from the API's `units` field for the selected masjid, not the static local config.

### UI
- **feat(ui):** Role badge (Markaz Admin / Masjid Admin / General) shown top-left on address list and detail pages; Markaz Admin gets a "⌂ Home" link.
- **fix(ui):** Generic masjid login no longer shows unit selection — unit is chosen on the address list page after login.
- **fix(ui):** "Landing Slug" column renamed to "Landing" in Masjid Management table and detail view; Landing value is now a clickable hyperlink to the masjid's landing page.
- **fix(ui):** Masjid landing page logout button only shown when user has an active session for that masjid (`landingContext` match).
- **fix(ui):** Neighborhood column hidden on mobile (≤768px); API/DB status badges moved to fixed top-left corner, hidden on mobile.
- **feat(ui):** Reset button in search form clears all filter and search criteria (except Masjid ID) and reloads the full address list.
- **fix(unit):** Unit value `0` no longer treated as falsy — fixed in MasjidLanding initial state and Landing unit-change navigation.
- **feat(bulk-unit):** Unit column added to address list (admin-only) with independent header + row checkboxes; selecting rows shows a separate bulk bar to reassign unit via dropdown.

---

## 2026-08-13

### Auth & Login Flow
- **feat(auth):** `admin/login` redirects to `/admin/all` after successful Markaz Admin login; `loginSource` tracked in localStorage to route logout correctly (`admin` → `/admin/login`, masjid-slug → `/:slug`).
- **feat(auth):** Removed general Login button from `/masjid-login`; Masjid ID now mandatory before admin login toggle; buttons renamed to "Markaz Admin Login" and "Masjid Admin Login".
- **feat(auth):** Logout added to `MasjidLanding`, `MasjidManagement`, and `All` pages — each clears relevant storage and routes by `loginSource`.
- **feat(auth):** `AdminLogin` uses uncontrolled password input with hidden username field to enable browser credential autofill.

### Admin Capabilities
- **feat(admin):** Markaz Admin (`loginSource=admin`) bypasses cross-masjid filter in all data-loading paths on the address list page.
- **feat(admin):** Masjid ID field in search form is locked (read-only) for masjid-slug logins; editable for Markaz Admin.

### Navigation & UI
- **feat(nav):** Home links added to `AdminLogin`, `MasjidLogin`, `All`, `MasjidManagement`, and `MasjidDetail`.
- **feat(nav):** `/admin/all` redesigned as a table showing masjid name, ID, and landing route with logout button.
- **feat(nav):** Home page restructured — removed General section; Masjid Quick Access moved to `/admin/all`; Admin section links renamed ("Any Masjid Login", "Masjid Landing Pages", "Masjid Management").

### Security / Access Control
- **feat(access):** Restrict address list and detail to the logged-in masjid. Search results are client-side filtered by `masjidId`; cross-masjid results show a red "This listing does not belong to this masjid" banner; empty results show a yellow "No listing found" banner.
- **fix(auth):** `getAdmin()` now always reads directly from `localStorage` instead of a cached module-level variable, eliminating stale-admin bypass. `MasjidLanding` regular login now calls `setAdmin(false)` to clear any inherited admin state.

### Navigation / Routes
- **feat(home):** New home page at `/` with three sections — General (Masjid Login), Masjid Quick Access (per-masjid slug links), and Admin (Admin Login, All Masjids, Masjid Management).
- **feat(routes):** Admin routes reorganised under `/admin/*`: `/all` → `/admin/all`, `/admin-login` → `/admin/login`. All protected admin routes share a single layout-level `ProtectedAdminRoute` using React Router v6 `<Outlet />`.

### Address Detail
- **feat(address):** `address2` field now displayed alongside `address1` in both `AddressDetail` and `AddressRow`.

---

## 2026-08-12

### Documentation
- **docs(agents):** `AGENTS.md` updated — added `/admin/masjids` and `/admin/masjids/:id` routes, fixed ICW unit count (2 → 1), added `## Hooks` section documenting `useApiReady` and `isRemoteApi`.

### Address Fixes
- **fix(address):** Renamed `source` field to `listingSource` with value `render-app`; fixed `unitId` type mismatch in unit dropdown.

### Build & Run
- **docs:** Updated run instructions for `scripts/` folder; API port documented as 5000.

---

## Earlier

### Admin
- **feat(admin):** `MasjidManagement` and `MasjidDetail` components added with `/admin/masjids` routes.

### Splash / API Readiness
- **feat(splash):** `useApiReady` hook and `ApiSplash` component added to all entry points; default masjid ID cleared on cold start.

### Scripts
- **feat(scripts):** `start.ps1` moved to `scripts/`; `stop.ps1` and `status.ps1` added.

### Landing / Search
- **feat(landing):** Neighborhood `<select>` with session-cached area options and full-list filtering. Bulk area update. Terminology updated from "Area" to "Neighborhood".

### Login
- **feat(masjid):** Logout preserves `masjidID` in navigation state so login page restores the same masjid instead of defaulting to 156.
