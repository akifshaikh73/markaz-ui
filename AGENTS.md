# Markaz Visitation UI — Project Guidelines

## Three-Tier Role System

The app enforces role-based access control with three distinct roles:

| Role | Entry Point | Authentication | Storage | Access Level |
|------|-------------|-----------------|---------|--------------|
| `MasjidUser` | `/user-login` (Masjid PIN) or `/:masjidSlug` | Masjid PIN (plain, matched against `masjids.pin`) OR masjid slug | `userRole: 'MasjidUser'`; `loginSource: 'masjid'` or `'masjid-slug'` | Address listings for the matched masjid |
| `MasjidAdmin` | `/user-login` (Admin section — email + PIN) | Email + PIN (bcrypt-verified against `users` collection) | `userRole: 'MasjidAdmin'`; `userEmail`, `userPin`, `userMasjids`, `userMasjidSlug` cached; `loginSource: 'user'` | Full address management for assigned masjids; auto-login on PWA return |
| `MarkazAdmin` | `/admin-login` | Markaz password (`REACT_APP_ADMIN_PASSWORD`) | `userRole: 'MarkazAdmin'`; `loginSource: 'markaz-admin'` | Global admin dashboard; manage all masjids and users |

### Protected Routes & Redirect Behavior

- **`ProtectedUserRoute`** (`/landing/*`, `/address/*`, `/map/*`): Requires `userRole` in `['MasjidUser', 'MasjidAdmin', 'MarkazAdmin']`. Redirects unauthenticated users to `/user-login`.
- **`ProtectedMasjidAdminRoute`**: Requires `userRole` in `['MasjidAdmin', 'MarkazAdmin']`. Redirects to `/user-login`.
- **`ProtectedMarkazAdminRoute`** (`/admin/*`): Requires `userRole === 'MarkazAdmin'`. Redirects to `/admin-login`.

## Architecture

React 18 SPA (Create React App). All components live in `src/Components/`. Shared utilities in `src/utils.js`. Excel export logic in `src/exportExcel.js`.

**Routing** (react-router-dom v6): When asked to display routes, always read `src/App.js` — it is the single source of truth for all routes.

| Path | Component | Role Required | Notes |
|------|-----------|----------------|-------|
| `/` | `UserLogin` | None | PWA entry point — same as `/user-login` |
| `/user-login` | `UserLogin` | None | MasjidAdmin entry: Email + PIN login; auto-login on PWA return if credentials cached; redirects to `/:masjidSlug` on success |
| `/:masjidSlug` | `MasjidLanding` | None | Public landing page; auto-grants `MasjidUser` role when user makes a selection; shows unit selector and three navigation options (Visitations, Full Listings, Quick Links); on return visits, auto-navigates to last viewed page; collapsible "Other Masjids" section for MasjidAdmin users |
| `/admin-login` | `AdminPasswordLogin` | None | MarkazAdmin entry: Markaz password prompt; sets `userRole = 'MarkazAdmin'`; redirects to `/admin-home` on success |
| `/admin-home` | `Home` | `MarkazAdmin` | Admin dashboard; redirects to `/admin-login` if not MarkazAdmin; shows navigation links and logout button |
| `/landing/:masjidID/:unitID` | `Landing` | Any authenticated | Protected — main address list view; accessible to MasjidUser, MasjidAdmin, or MarkazAdmin |
| `/address/:id` | `AddressDetail` | Any authenticated | Protected — address detail/edit view; requires any authenticated role |
| `/map/:masjidID/:unitID` | `MapView` | Any authenticated | Protected — Leaflet map view; requires any authenticated role |
| `/admin/masjids` | `MasjidManagement` | `MarkazAdmin` | Protected — browse/search all masjids; MarkazAdmin only |
| `/admin/masjids/:id` | `MasjidDetail` | `MarkazAdmin` | Protected — view single masjid; MarkazAdmin only |
| `/admin/users` | `UserManagement` | `MarkazAdmin` | Protected — browse/search all users; MarkazAdmin only |
| `/admin/users/:id` | `UserDetail` | `MarkazAdmin` | Protected — view single user; MarkazAdmin only |
| `/admin-login` | `AdminPasswordLogin` | None | MarkazAdmin entry: Markaz password; sets `userRole = 'MarkazAdmin'`; redirects to `/admin-home` |
| `/admin-home` | `Home` | `MarkazAdmin` | Admin dashboard |
| `/landing/:masjidID/:unitID` | `Landing` | `MasjidUser`, `MasjidAdmin`, or `MarkazAdmin` | Protected — main address list view |
| `/address/:id` | `AddressDetail` | `MasjidUser`, `MasjidAdmin`, or `MarkazAdmin` | Protected — address detail/edit view |
| `/map/:masjidID/:unitID` | `MapView` | `MasjidUser`, `MasjidAdmin`, or `MarkazAdmin` | Protected — Leaflet map view |
| `/admin/masjids` | `MasjidManagement` | `MarkazAdmin` | Protected — browse/search all masjids |
| `/admin/masjids/:id` | `MasjidDetail` | `MarkazAdmin` | Protected — view/manage single masjid; shows Masjid PIN with reset button |
| `/admin/users` | `UserManagement` | `MarkazAdmin` | Protected — browse/search all users |
| `/admin/users/:id` | `UserDetail` | `MarkazAdmin` | Protected — view single user; password reset button |

## Masjid Config (`src/config.js`)

`MASJID_CONFIG` is the single source of truth for all masjids:

| id | name | landing slug | units |
|----|------|-------------|-------|
| 156 | Masjid Uthhman | `muthman` | 1,2,3,4 |
| 203 | Aurora Masjid | `aurora` | 1,2 |
| 112 | Masjid Darussalam | `masjid-ds` | 1,2,3,4 |
| 105 | Al Hira | `alhira` | 1 |
| 230 | ICW | `icw` | 1 |
| 102 | Al Hidayah | `oleson` | 1,2,3 |
| 111 | Masjid Darul Iman | `di` | 1,2,3,4 |

`MASJID_UNITS` — derived map `{ id: units[] }`. `UNIT_OPTIONS = [1]` is the fallback.

`getMasjidByLanding(slug)` — looks up config by `landing` field.

`getHijriYear()` — returns current Hijri year via `Intl` (used for masjid passwords).

**Admin flag**: `ADMIN` is stored in `localStorage('ADMIN')`; mutate only via `setAdmin(bool)`.

**Env var**: `REACT_APP_ADMIN_PASSWORD` — Markaz admin password; used by both `/admin-login` and `/admin/login` routes.

## Authentication Flows

**Note**: Knowledge of a valid masjid slug is treated as sufficient authentication (equivalent to PIN entry).

## Authentication Flows

### MasjidUser Entry — Masjid PIN
Route `/user-login` (top section) → enter 4-digit PIN → `POST /api/masjids/login` (plain match against `masjids.pin`) → `userRole = 'MasjidUser'`; `loginSource = 'masjid'`; `userMasjidSlug` cached → navigate to `/:slug` → MasjidLanding shows unit selector and three navigation options. On subsequent visits via slug, auto-navigates to last viewed page (Visitations, Full Listings, or Quick Links).

### MasjidUser Entry — Direct Slug (Auto-Login)
Route `/:masjidSlug` (e.g., `/msi`, `/diman`) → auto-extracts PIN from masjid config → caches: `userPin`, `userMasjidSlug`, `loginSource = 'masjid-slug-direct'` → MasjidLanding shows unit selector immediately → user selects unit and navigation option (no `/user-login` needed). If visiting different slug, auto-switches PIN (Option A). Return visits via same slug navigate directly to last viewed page.

### MasjidUser Entry — Slug Selection
Route `/:masjidSlug` → select unit → click Login button → `userRole = 'MasjidUser'`; `loginSource = 'masjid-slug'` → navigate to `/landing/:id/:unit`. (Alternative explicit login path)

### MasjidAdmin Entry — Email + PIN
Route `/user-login` (expand "Masjid Admin Login" section) → enter email + PIN → `POST /api/users/login` (bcrypt verify) → `userRole = 'MasjidAdmin'`; `userEmail`, `userPin`, `userMasjids`, `userMasjidSlug` cached; `loginSource = 'user'` → navigate to primary `/:slug`.

**Session resume**: On next visit to `/user-login`, if `userPin`, `loginSource`, and `userMasjidSlug` exist in localStorage → navigate directly to stored slug; no API call.

### MarkazAdmin Entry
Route `/admin-login` → enter Markaz password (`REACT_APP_ADMIN_PASSWORD`) → `userRole = 'MarkazAdmin'`; `loginSource = 'markaz-admin'` → redirect to `/admin-home`.

All fetch calls use `process.env.REACT_APP_API_URL` as the base:

```js
const API_URL = process.env.REACT_APP_API_URL || '';
fetch(`${API_URL}/api/addressList/...`)
```

- **Dev**: `http://localhost:3000` (`.env.development`)
- **Prod**: `https://visitation-api.onrender.com` (`.env.production`)

Never hardcode `localhost` URLs.

## Hooks

**`src/hooks/useApiReady.js`** — polls `GET /api/dbStatus` every 3 s until the remote API is reachable, then returns `true`. Returns `true` immediately when `REACT_APP_API_URL` is localhost/127.0.0.1 (local dev). Use this hook to gate any UI that depends on a cold-start Render API being awake.

`isRemoteApi` (named export) — `true` when `REACT_APP_API_URL` is not localhost.

## Key Conventions

**Dates** — always use `formatDate()` from `src/utils.js`. Never use `toLocaleDateString()` directly; it causes off-by-one day errors with MongoDB UTC dates. `formatDate` handles MongoDB `{ $date: "..." }` objects, ISO strings, and Date instances.

**localStorage keys**:

**Authentication & Role**:
- `userRole` — Active role: `'MasjidUser'`, `'MasjidAdmin'`, `'MarkazAdmin'`, or `''` (empty = not logged in). Used by route protection components.
- `loginSource` — Authentication entry point: `'masjid'` (Masjid PIN), `'masjid-slug'` (slug login), `'user'` (email+PIN), `'markaz-admin'` (Markaz password). Guides logout routing and session resume.
- `userMasjidSlug` — Masjid slug for session resume. Set on login; used by `UserLogin` `useEffect` to navigate without re-calling the API. Cleared on logout.

**MasjidAdmin Credentials** (cached for session resume):
- `userEmail` — User email (MasjidAdmin only). Cleared on logout.
- `userPin` — User PIN (set for both MasjidUser and MasjidAdmin). Cleared on logout.
- `userMasjids` — JSON array of masjid slugs MasjidAdmin has access to; shown as "Other Masjids" on MasjidLanding. Cleared on logout.

**Address List & Filtering**:
- `addressList` — working set from last fetch or search (cleared on logout)
- `searchParams` — last search form values (cleared on logout)
- `areaFilter` — last area filter text (cleared on logout)
- `activeFilters` — `{ showInactive, filterByStudents }` (cleared on logout)

**Context & Preferences**:
- `landingContext` — `{ masjidID, unitID }` last visited (cleared on logout; used to restore unit selection)
- `preferredMasjid` — masjid slug cached for PWA app launch (cleared on logout)
- `lastView_<masjidSlug>` — Last viewed page for masjid slug access: `'visitations'`, `'listings'`, or `'quicklinks'` (cleared on logout; auto-navigates to stored view on subsequent slug visits)

**sessionStorage keys** (keyed per masjid+unit; cleared on logout via `sessionStorage.clear()`):
- `unitAreas_<masjidID>_<unitID>` — sorted unique area/neighborhood strings for the Neighborhood dropdown

## Landing Component — State & Data Flow

| State | Source | Rule |
|-------|--------|------|
| `addressList` | `/list` on load; `/filter/search/` on search | Working set. Replaced by search results. Area filter applied on top. |
| `unitAreas` | Derived from initial `/list` fetch | Unique sorted area names. Cached in sessionStorage. Only grows (new areas appended on bulk update). |
| `areaFilter` | Neighborhood `<select>` | Filters `addressList`. `''` = none; `'__NO_AREA__'` = unassigned addresses. |
| `filteredAddressList` | Derived at render | `addressList` filtered by `areaFilter`. Area and search filters compose on the same dataset. |

**Key invariant**: `doSearch()` only updates `addressList` — never `unitAreas`. Area dropdown options always reflect the full unit dataset (from initial fetch, cached in sessionStorage) regardless of active searches.

**Address data shape** (key fields):
`_id`, `firstName`, `lastName`, `masjidId`, `unitId`, `address1`, `city`, `state`, `area`, `latitude`, `longitude`, `phoneNumber`, `bestTime`, `profession`, `inactive`, `met`, `lastModifiedDate`, `visitHistory[]`, `students[]`

`visitHistory` entries: `{ response, comments, createdDate }` — `createdDate` may be a MongoDB `{ $date }` object.

**Sorting**: address lists sort by `lastModifiedDate` descending; visit history sorts newest-first.

**Grouping**: `AddressList` groups rows by `area` attribute with a header row per group. Addresses with no `area` fall into `(No Area)`.

## Commit Workflow

When asked to commit files, always follow these steps:

1. Run `git status --short` to see all modified files.
2. Stage each changed file individually: `git add <file>`.
3. For each file (or group of closely related files), generate a concise commit message following the format:
   `<type>(<scope>): <short description>`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
   - Scope: component name, route, or area of change
4. Present the staged files and proposed commit message(s) to the user for confirmation before running `git commit`.
5. After confirmation, run: `git commit -m "<message>"`

## Build & Run

```bash
npm install       # install dependencies
npm run build     # production build → build/
```

### Scripts (`scripts/` folder — run from `markaz-ui/`)

| Script | Purpose |
|---|---|
| `.\scripts\start.ps1` | Start UI (defaults to local API) |
| `.\scripts\start.ps1 -api remote` | Start UI pointing to Render API |
| `.\scripts\stop.ps1` | Kill the dev server (port 3000) |
| `.\scripts\status.ps1` | Show running/stopped status |

### Running locally against local API (default)

```powershell
.\scripts\start.ps1
# or: .\scripts\start.ps1 -api local
# Sets REACT_APP_API_URL=http://localhost:5000
```

Or with npm directly:
```powershell
$env:REACT_APP_API_URL="http://localhost:5000"; npm start
```

### Running locally against remote (Render) API

```powershell
.\scripts\start.ps1 -api remote
# Sets REACT_APP_API_URL=https://visitation-api.onrender.com
```

Or with npm directly:
```powershell
$env:REACT_APP_API_URL="https://visitation-api.onrender.com"; npm start
```

### Environment precedence (CRA)

1. `.env.local` (highest — ignored by git)
2. `.env.development` / `.env.production`
3. `.env`

Deploy target: Render Static Site via `render.yaml` at repo root.

## Conventions

- Keep `console.log` out of production-bound code.
- Guard all `useNavigate` / `navigate()` calls inside `useEffect` — never call during render.
- `useEffect` deps must not include derived values that change every render (e.g., `array.length` after a setState).
- The `FilterUI` prop is named `onFilter` (not `handleFilter`).
- **Logout** navigates to `/user-login` (or `/admin-login` for `MarkazAdmin`).
