# Changelog

All notable changes to Markaz Visitation UI are documented here.  
Format: `<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---

## 2026-08-22

### Routing & Entry Points
- **refactor(routing):** Changed home route from `/` to `/admin-home` (admin-only dashboard); `/` now redirects to `/user-login` as new PWA entry point.
- **feat(auth):** New `/user-login` route enables user login with email + PIN; credentials stored in localStorage for auto-login on PWA launch; after successful verification, redirects to user's masjid landing page.
- **feat(auth):** New `/admin-login` route provides password prompt for Markaz admin access; grants `MarkazAdmin` role and redirects to `/admin-home` on success.
- **refactor(auth):** `/admin-home` now redirects to `/admin-login` if user lacks admin privileges (instead of redirecting to `/user-login`).
- **refactor(auth):** Updated all admin component Home buttons to navigate to `/admin-home` instead of `/`; MasjidLogin and AdminLogin back buttons now point to `/user-login` instead.
- **feat(pwa):** Updated `public/manifest.json` `start_url` to `/user-login` — PWA app now launches directly to user login page.

### Components
- **feat(components):** Created new `UserLogin` component (`src/Components/UserLogin.js`) with email + PIN input, auto-login on mount if credentials exist, and error handling; button to switch to admin login.
- **feat(components):** Created new `AdminPasswordLogin` component (`src/Components/AdminPasswordLogin.js`) for Markaz admin password verification; sets `MarkazAdmin` role and redirects to `/admin-home` on success.
- **fix(auth):** Changed UserLogin to use `email` parameter instead of `userId` for API compatibility; stored in `userEmail` localStorage key.
- **refactor(home):** Updated `Home.js` — now redirects to `/admin-login` if user lacks admin privileges (instead of `/user-login`).

### Documentation
- **docs(routing):** Updated `AGENTS.md` routing table with new `/admin-home`, `/user-login` routes and removed obsolete paths.
- **docs(storage):** Updated `AGENTS.md` localStorage keys to include `userEmail`, `userPin`, and `loginSource` for user login and PWA auto-login flow.
- **docs(api):** Added user login endpoint to `README.md` API Reference: `POST /api/users/login`.
- **docs(pwa):** Documented PWA entry point and auto-login flow in `README.md` under "User Login (PWA Entry Point)" section.

---

## 2026-08-21

### Address List & Neighborhoods
- **feat(access):** "Add Address" button now available to general users (non-admin), removed admin-only restriction.
- **fix(neighborhoods):** Neighborhood dropdown now properly populates when "All units" is selected; always extracts areas from fetched data instead of only when cache is empty.

### Navigation & Home Button
- **fix(navigation):** Home button fixed across admin pages (Masjid Management, Masjid Detail, User Management, Address Detail, MasjidLogin, AdminLogin) to display home page instead of auto-redirecting to `/admin/masjids`; all Home buttons now pass `intentionalHome: true` state via React Router.
- **refactor(home):** Home component now uses `useRef` to track redirects and prevent redirect loops; dependency array updated to include `location.state` for proper state tracking.
- **feat(home):** User Management link added to Home page admin section.

### User Management
- **feat(users):** User Management and User Detail pages added to admin panel (`/admin/users` and `/admin/users/:id` routes); displays active/disabled user status, role, and masjid association.

---

## 2026-08-20

- **feat(pwa):** Smart PWA entry point — Home component redirects to preferred masjid on app launch if stored; saves masjid preference on login and clears on logout. Users on returning visits go directly to their last masjid instead of home page.
- **feat(pwa):** PWA now detects masjid slug from URL path (`/di`, `/mvnu`, etc.) and saves it automatically. Users can pin the app from any masjid URL and it will launch to that specific masjid on future opens.

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
