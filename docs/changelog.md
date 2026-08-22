# Changelog

All notable changes to Markaz Visitation UI are documented here.  
Format: `<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---
## 2026-08-22 (Session 3)

### Route Planning & Visitation Analytics
- **feat(RouteView):** New `/route` page component for visualizing selected addresses on an interactive map with numbered markers and route polylines. Displays address list with details below map.
- **feat(VisitationView):** New `/visitation` page component for analyzing visitation patterns across addresses. Allows filtering by unit and neighborhood to identify least-visited addresses and generate metrics.
- **feat(Landing - routing):** Added "Visitation" button to Landing navbar (green, available to all users) for accessing visitation analytics. Shows "Route" button when addresses are selected for route planning (orange, with count).
- **refactor(Landing - MapView):** Restricted Map View button to admins only (checks `getAdmin()`). General users now access map visualization through Visitation and Route features.
- **feat(AddressList - route selection):** Added route selection checkboxes to ID column with orange accent color. Supports select-all-for-route and individual address selection for building custom routes.
- **feat(AddressRow - route selection):** Added checkbox in ID column to toggle individual address selection for routes. Orange accent matches route theme.
- **refactor(App):** Added two new protected routes: `/route` (RouteView) and `/visitation` (VisitationView), both protected by ProtectedUserRoute.

### Address List Improvements
- **feat(AddressList - date sorting):** Made Date column clickable to toggle sort order between oldest-first (↑) and newest-first (↓). Default oldest-first shows unmet addresses at top of each neighborhood group. Addresses still grouped by neighborhood first.
- **refactor(AddressList - date sorting):** Reorganized sort logic: Neighborhood (primary) → Date (toggleable secondary) → Name → ID, replacing previous hardcoded descending date sort.

---
## 2026-08-22 (Session 2 Continued)

### Navigation & Role System Cleanup
- **fix(MasjidLogin):** Removed "Markaz Admin Login" form section entirely. MasjidLogin now handles ONLY PIN-only access (MasjidUser role). Admin password authentication belongs exclusively at `/admin-login` → MarkazAdmin role. Prevents role tier crisscross.
- **fix(Landing):** Updated logout redirect from removed `/admin/login` to `/admin-login` for MarkazAdmin users. Non-admin logout now consistently redirects to `/user-login` (main MasjidAdmin/MasjidUser entry point) instead of masjid slug.
- **refactor(Home):** Replaced deprecated `getAdmin()` boolean check with role-based check: `getUserRole() === 'MarkazAdmin'`. Added logout button to admin dashboard for MarkazAdmin users. Redirects to `/admin-login` on logout.
- **chore(App):** Removed legacy `/admin/login` route and AdminLogin component import (was duplicate of `/admin-login` route with AdminPasswordLogin component).

### Documentation Updates (Role Naming)
- **docs(terminology):** Clarified role naming throughout documentation: `GeneralUser` → `MasjidUser` (lowest tier), `MasjidAdmin` (mid tier), `MarkazAdmin` (highest tier).
- **docs(AGENTS.md):** Updated routing table with corrected component notes, role checks, and navigation descriptions. Removed references to `/admin/login` route.
- **docs(README.md):** Comprehensive rewrite of "Authentication & Role System" section with clear MasjidUser/MasjidAdmin/MarkazAdmin tier descriptions, flow diagrams, and per-role logout behavior.
- **docs(logout):** Documented distinct logout flows: MasjidUser → `/user-login`, MasjidAdmin → `/user-login` (clears all credentials), MarkazAdmin → `/admin-login`.

### UI & Feature Improvements
- **fix(AddressList):** Removed duplicate Unit column from AddressRow.js that was causing table column misalignment. Data rows now correctly match header column count (9 when isAdmin, 8 when not).
- **feat(MapView):** Enabled Map View button for all authenticated users (MasjidUser, MasjidAdmin, MarkazAdmin), not just admins. Allows general users to visualize address locations on map.

---

## 2026-08-22 (Session 2)

### Three-Tier Role System Implementation
- **feat(auth):** Implemented comprehensive three-tier authentication and role-based access control system with three distinct user roles and entry points.
- **feat(auth - GeneralUser):** PIN-only authentication via `/masjid-login` route. Users enter Masjid ID + PIN, granted `GeneralUser` role, access address listings for selected masjid. No credential caching; logout returns to login screen.
- **feat(auth - MasjidAdmin):** Email + PIN authentication via `/user-login` route (PWA entry point). API verifies credentials and returns list of assigned masjids. Role set to `MasjidAdmin`; credentials cached in localStorage for persistent auto-login on PWA launch. Logout only triggered by explicit user action (button click).
- **feat(auth - MarkazAdmin):** Markaz password authentication via `/admin-login` route. Password from `REACT_APP_ADMIN_PASSWORD` env var. Role set to `MarkazAdmin`; access to `/admin/masjids` and `/admin/users` management pages. Logout via admin interface.
- **feat(auth - public access):** Public masjid landing pages (`/:masjidSlug`, e.g., `/di`) now auto-grant `GeneralUser` role on "Go to Listings" click. Knowledge of valid masjid slug treated as equivalent to PIN entry. Enables shareable public links.
- **refactor(auth):** Updated App.js with three new protected route components: `ProtectedMarkazAdminRoute` (MarkazAdmin-only), `ProtectedMasjidAdminRoute` (MasjidAdmin + MarkazAdmin), `ProtectedUserRoute` (all authenticated roles).
- **refactor(auth):** Updated `userRole` localStorage key to store explicit role values: `'GeneralUser'`, `'MasjidAdmin'`, `'MarkazAdmin'`, or `''` (not logged in). Replaces previous boolean `ADMIN` flag.
- **refactor(auth):** Updated `loginSource` localStorage key to distinguish authentication entry points: `'pin'` (GeneralUser PIN-only), `'user'` (MasjidAdmin email+PIN), `'markaz-admin'` (MarkazAdmin password), `'masjid-slug'` (public masjid link).

### Component Updates
- **feat(MasjidLogin):** Added PIN-only login form with state management; `handlePinLogin()` function sets `GeneralUser` role; stores PIN in localStorage.
- **feat(MasjidLogin):** Displays collapsible "Markaz Admin Login" toggle for admin password verification (sets `MasjidAdmin` role).
- **refactor(UserLogin):** Updated to explicitly set `userRole = 'MasjidAdmin'` (was API-based role assignment). Stores `userMasjids` array for "Other Masjids" quick-switch links.
- **refactor(AdminPasswordLogin):** Verified `userRole = 'MarkazAdmin'` assignment; added `loginSource = 'markaz-admin'` tracking.
- **refactor(MasjidLanding):** Auto-grants `GeneralUser` role when accessed via valid `/:masjidSlug` and user clicks "Go to Listings"; sets `loginSource = 'masjid-slug'`.
- **refactor(Landing):** Updated `onLogout()` to clear all authentication credentials (`userRole`, `userEmail`, `userPin`, `userMasjids`, `loginSource`) preventing unwanted auto-login after explicit logout.

### Documentation
- **docs(auth):** Completely rewrote `README.md` "Authentication & Role System" section documenting all three roles with entry points, authentication flows, access levels, and use cases.
- **docs(auth):** Added detailed "Manifest & PWA" and "Logout Behavior" subsections explaining auto-login behavior and role-specific logout flows.
- **docs(routing):** Updated `AGENTS.md` routing table with three-tier role requirements and redirect behavior for each route.
- **docs(auth):** Added new "Three-Tier Role System" section to `AGENTS.md` with role comparison table and protected route descriptions.
- **docs(auth):** Documented all four authentication flows in new "Authentication Flows" section: GeneralUser (PIN), MasjidAdmin (Email+PIN with auto-login), MarkazAdmin (password), and public masjid slug access.
- **docs(storage):** Reorganized and expanded `localStorage keys` documentation with detailed explanations of authentication, credentials, and address-list-related keys.

---

## 2026-08-22 (Session 1)

### Routing & Entry Points
- **refactor(routing):** Changed home route from `/` to `/admin-home` (admin-only dashboard); `/` now redirects to `/user-login` as new PWA entry point.
- **feat(auth):** New `/user-login` route enables user login with email + PIN; credentials stored in localStorage for auto-login on PWA launch; after successful verification, redirects to user's masjid landing page.
- **feat(auth):** New `/admin-login` route provides password prompt for Markaz admin access; grants `MarkazAdmin` role and redirects to `/admin-home` on success.
- **feat(security):** Protected `/landing/:masjidID/:unitID`, `/address/:id`, and `/map/:masjidID/:unitID` routes with user login requirement; unauthenticated users redirected to `/user-login`.
- **refactor(auth):** `/admin-home` now redirects to `/admin-login` if user lacks admin privileges (instead of redirecting to `/user-login`).
- **refactor(auth):** Updated all admin component Home buttons to navigate to `/admin-home` instead of `/`; MasjidLogin and AdminLogin back buttons now point to `/user-login` instead.
- **feat(pwa):** Updated `public/manifest.json` `start_url` to `/user-login` — PWA app now launches directly to user login page.

### Components
- **feat(components):** Created new `UserLogin` component (`src/Components/UserLogin.js`) with email + PIN input, auto-login on mount if credentials exist, and error handling.
- **feat(components):** Created new `AdminPasswordLogin` component (`src/Components/AdminPasswordLogin.js`) for Markaz admin password verification; sets `MarkazAdmin` role and redirects to `/admin-home` on success.
- **feat(masjid-access):** UserLogin now stores `userMasjids` array in localStorage (list of all masjids user has access to); MasjidLanding displays these as a collapsible "Other Masjids" section for quick switching (click arrow to expand/collapse).
- **feat(logout):** MasjidLanding now shows user logout button when logged in via UserLogin; clears credentials and redirects to `/user-login`.
- **refactor(ui):** Removed "Login as Admin" button from UserLogin page; removed admin logout from MasjidLanding page (admin login now accessible only via `/admin-login` route).
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
