# Markaz Visitation UI — Copilot Instructions

See `AGENTS.md` at the repo root for full architecture, conventions, and API details.

## Documentation Maintenance

When making any change to the following data structures in `src/Components/Landing.js`, **always update both `README.md` and `AGENTS.md`** in the same response:

- `addressList` — working set state (may be full list or search results)
- `unitAreas` — unique area names state (sessionStorage-cached; never replaced by search)
- `unitAreas` — unique area names state
- `areaFilter` — neighborhood filter state
- `filteredAddressList` — derived render list
- `searchParams` / `activeFilters` — search/filter state
- Any `localStorage` or `sessionStorage` keys (add, remove, or rename)
- The `doSearch`, `handleUpdateArea`, `handleUnitChange`, or `onLogout` functions (if their effect on the above states changes)

In `README.md`: update the **State & Caching Architecture** section (tables for Data Structures, Update Rules, Storage Layers).
In `AGENTS.md`: update the **localStorage keys**, **sessionStorage keys**, and **Landing Component — State & Data Flow** sections.

## Commit Workflow

When asked to commit files, always follow these steps:

1. Run `git status --short` to see all modified files.
2. Stage each changed file: `git add <file>`.
3. For each file (or group of closely related files), generate a concise commit message:
   `<type>(<scope>): <short description>`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
   - Scope: component name, route, or area of change
4. Present the staged files and proposed commit message(s) to the user for confirmation.
5. After confirmation, run: `git commit -m "<message>"`

## Running Locally

Dev server runs on **port 3001**. The API runs separately on port 3000.

### Against local API (default)

```bash
npm start
# REACT_APP_API_URL is unset → fetch calls use relative URLs → proxied to localhost:3000
```

### Against remote (Render) API

**PowerShell (one-off):**
```powershell
$env:REACT_APP_API_URL="https://visitation-api.onrender.com"; npm start
```

**Persistent (recommended) — create `markaz-ui/.env.local`:**
```
REACT_APP_API_URL=https://visitation-api.onrender.com
```
Then run `npm start`. `.env.local` is gitignored by CRA and overrides `.env.development`.

## API Base URL

All fetch calls must use `process.env.REACT_APP_API_URL` as the base:

```js
const API_URL = process.env.REACT_APP_API_URL || '';
fetch(`${API_URL}/api/addressList/...`)
```

Never hardcode `localhost` URLs.
