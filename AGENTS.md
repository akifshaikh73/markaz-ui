# Markaz Visitation UI — Project Guidelines

## Architecture

React 18 SPA (Create React App). All components live in `src/Components/`. Shared utilities in `src/utils.js`. Excel export logic in `src/exportExcel.js`.

**Routing** (react-router-dom v6): When asked to display routes, always read `src/App.js` — it is the single source of truth for all routes.

| Path | Component | Notes |
|------|-----------|-------|
| `/` | — | Redirects to `/masjid-login` |
| `/all` | `All` | Protected — requires admin auth (`ProtectedAdminRoute`) |
| `/masjid-login` | `MasjidLogin` | Entry point for regular users |
| `/admin-login` | `AdminLogin` | Admin password login; redirects to `/all` on success |
| `/:masjidSlug` | `MasjidLanding` | Masjid-specific landing page |
| `/landing/:masjidID/:unitID` | `Landing` | Main list view |
| `/address/:id` | `AddressDetail` | Detail/edit view |
| `/map/:masjidID/:unitID` | `MapView` | Leaflet map view |

## Masjid Config (`src/config.js`)

`MASJID_CONFIG` is the single source of truth for all masjids:

| id | name | landing slug | units |
|----|------|-------------|-------|
| 156 | Masjid Uthhman | `muthman` | 1,2,3 |
| 109 | CPSA | `cpsa` | 1 |
| 203 | Aurora Masjid | `aurora` | 1,2 |
| 112 | Masjid Darussalam | `masjid-ds` | 1,2,3,4 |
| 105 | Al Hira | `alhira` | 1 |
| 230 | ICW | `icw` | 1,2 |
| 102 | Al Hidayah | `oleson` | 1,2,3 |
| 111 | Masjid Darul Iman | `di` | 1,2,3,4 |

`MASJID_UNITS` — derived map `{ id: units[] }`. `UNIT_OPTIONS = [1]` is the fallback.

`getMasjidByLanding(slug)` — looks up config by `landing` field.

`getHijriYear()` — returns current Hijri year via `Intl` (used for masjid passwords).

**Admin flag**: `ADMIN` is stored in `localStorage('ADMIN')`; mutate only via `setAdmin(bool)`.

**Env var**: `REACT_APP_ADMIN_PASSWORD` — admin password for `/admin-login`.

## MasjidLanding Auth Flow

Route `/:masjidSlug` → resolves `getMasjidByLanding(slug)` → password is `${masjid.landing}${getHijriYear()}` → navigates to `/landing/:id/:unit` with `{ state: { isLoggedIn: true } }`. Unknown slug shows error + "Go to Login" button.

## API

All fetch calls use `process.env.REACT_APP_API_URL` as the base:

```js
const API_URL = process.env.REACT_APP_API_URL || '';
fetch(`${API_URL}/api/addressList/...`)
```

- **Dev**: `http://localhost:3000` (`.env.development`)
- **Prod**: `https://visitation-api.onrender.com` (`.env.production`)

Never hardcode `localhost` URLs.

## Key Conventions

**Dates** — always use `formatDate()` from `src/utils.js`. Never use `toLocaleDateString()` directly; it causes off-by-one day errors with MongoDB UTC dates. `formatDate` handles MongoDB `{ $date: "..." }` objects, ISO strings, and Date instances.

**localStorage keys**:
- `addressList` — working set from last fetch or search (cleared on logout)
- `searchParams` — last search form values (cleared on logout)
- `areaFilter` — last area filter text (cleared on logout)
- `activeFilters` — `{ showInactive, filterByStudents }` (cleared on logout)
- `landingContext` — `{ masjidID, unitID }` last visited (cleared on logout; used to restore unit selection)
- `ADMIN` — `'true'`/`'false'` string; read on init, written by `setAdmin()`

**sessionStorage keys** (keyed per masjid+unit; cleared on logout via `sessionStorage.clear()`):
- `unitAreas_<masjidID>_<unitID>` — sorted unique area/neighborhood strings for the Neighborhood dropdown
- `fullList_<masjidID>_<unitID>` — complete unit address list; never replaced by search results

## Landing Component — State & Data Flow

| State | Source | Rule |
|-------|--------|------|
| `addressList` | `/list` on load; `/filter/search/` on search | Working set. Replaced by search results. |
| `fullAddressList` | `/list` on load only | Full unit list. Never replaced by search. Used for area filtering. |
| `unitAreas` | Derived from `fullAddressList` on load | Unique sorted area names. Only grows (new areas appended on bulk update). |
| `areaFilter` | Neighborhood `<select>` | Filters `fullAddressList`, not `addressList`. |
| `filteredAddressList` | Derived at render | `fullAddressList` filtered by `areaFilter`; falls back to `addressList` when filter is empty. |

**Key invariant**: `doSearch()` only updates `addressList` — never `fullAddressList` or `unitAreas`. This ensures the Neighborhood dropdown always reflects the complete unit dataset regardless of active searches.

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
npm start         # dev server on port 3001 (3000 is reserved for the API)
npm run build     # production build → build/
```

### Running locally against local API (default)

```bash
npm start
# REACT_APP_API_URL defaults to '' which hits relative URLs → works when API is on localhost:3000
```

Or explicitly set it:

```bash
# PowerShell
$env:REACT_APP_API_URL="http://localhost:3000"; npm start

# CMD
set REACT_APP_API_URL=http://localhost:3000 && npm start
```

### Running locally against remote (Render) API

```powershell
# PowerShell (one-off, not persisted)
$env:REACT_APP_API_URL="https://visitation-api.onrender.com"; npm start
```

Or create a `.env.local` file in `markaz-ui/` (gitignored by CRA):

```
REACT_APP_API_URL=https://visitation-api.onrender.com
```

Then just run `npm start`. `.env.local` overrides `.env.development`.

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
- **Logout** navigates to `/masjid-login` with `{ state: { masjidID } }` so the login page restores the same masjid ID instead of defaulting to 156.
- `MasjidLogin` initialises `masjidID` state as: `lockedMasjidID || location.state?.masjidID || 156`.
