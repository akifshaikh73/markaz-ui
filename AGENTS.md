# Markaz Visitation UI — Project Guidelines

## Architecture

React 18 SPA (Create React App). All components live in `src/Components/`. Shared utilities in `src/utils.js`. Excel export logic in `src/exportExcel.js`.

**Routing** (react-router-dom v6):
| Path | Component | Notes |
|------|-----------|-------|
| `/login` | `Login.js` | Entry point; navigates to landing on submit |
| `/landing/:masjidID/:unitID` | `Landing.js` | Main list view; requires `location.state.isLoggedIn` |
| `/address/:id` | `AddressDetail.js` | Detail/edit view; works standalone or inside a modal |
| `/map/:masjidID/:unitID` | `MapView.js` | Leaflet map; reads from localStorage |

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
- `addressList` — full fetched list (cleared on logout)
- `searchParams` — last search form values (cleared on logout)
- `areaFilter` — last area filter text (cleared on logout)

**Address data shape** (key fields):
`_id`, `firstName`, `lastName`, `masjidId`, `unitId`, `address1`, `city`, `state`, `area`, `latitude`, `longitude`, `phoneNumber`, `bestTime`, `profession`, `inactive`, `met`, `lastModifiedDate`, `visitHistory[]`, `students[]`

`visitHistory` entries: `{ response, comments, createdDate }` — `createdDate` may be a MongoDB `{ $date }` object.

**Sorting**: address lists sort by `lastModifiedDate` descending; visit history sorts newest-first.

**Grouping**: `AddressList` groups rows by `area` attribute with a header row per group. Addresses with no `area` fall into `(No Area)`.

## Build & Run

```bash
npm install       # install dependencies
npm start         # dev server on port 3001 (3000 is reserved for the API)
npm run build     # production build → build/
```

Deploy target: Render Static Site via `render.yaml` at repo root.

## Conventions

- Keep `console.log` out of production-bound code.
- Guard all `useNavigate` / `navigate()` calls inside `useEffect` — never call during render.
- `useEffect` deps must not include derived values that change every render (e.g., `array.length` after a setState).
- The `FilterUI` prop is named `onFilter` (not `handleFilter`).
