# Changelog

All notable changes to Markaz Visitation UI are documented here.  
Format: `<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

---

## 2026-08-13

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
