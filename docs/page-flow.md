# Page Navigation Flow Documentation

Complete navigation flows for all major pages in Markaz Visitation UI, including entry points, transitions, and back navigation.

---

## 1. Authentication & Login Flow

### 1.1 UserLogin Entry
**Route:** `/user-login` (or `/` PWA entry)

**Flow:**
```
/user-login
  ↓
Check localStorage for cached credentials (userPin, loginSource, userMasjidSlug)
  ↓
If all three exist:
  → Navigate to /:masjidSlug (skip login form entirely)
  ↓
Else show login form:
  ├─ Masjid PIN (top section)
  │   → POST /api/masjids/login
  │   → Set: userPin, loginSource='masjid', userMasjidSlug
  │   → Navigate to /:masjidSlug with state: { isLoggedIn: true }
  │
  ├─ Masjid Admin Email+PIN (collapsible section)
  │   → POST /api/users/login
  │   → Set: userPin, userEmail, userMasjids, userMasjidSlug, loginSource='user'
  │   → Navigate to /:masjidSlug with state: { isLoggedIn: true }
  │
  └─ (Link to /admin-login or direct slug access)
```

---

## 2. MasjidLanding Page Flow

**Route:** `/:masjidSlug` (e.g., `/msi`, `/muthman`, `/diman`)

### 2.1 Direct Slug Access (Auto-Login)
```
/:masjidSlug (direct URL or bookmarked)
  ↓
MasjidLanding component loads
  ↓
Auto-extract PIN from masjid config
  ↓
Cache: userPin, userMasjidSlug, loginSource='masjid-slug-direct', userRole='MasjidUser'
  ↓
Display unit selector + 3 navigation buttons
  ↓
User selects unit + clicks button
```

### 2.2 After Login (from /user-login)
```
/user-login (after successful login)
  ↓
Navigate to /:masjidSlug with state: { isLoggedIn: true }
  ↓
MasjidLanding sees isLoggedIn flag
  ↓
Skip auto-navigation, display unit selector + buttons
```

### 2.3 Return from Child Page (Visitations/Quick Links)
```
/visitation or /quick-links
  ↓
User clicks Back button
  ↓
Navigate to /:masjidSlug with state: { fromChildPage: true }, replace: true
  ↓
MasjidLanding sees fromChildPage flag
  ↓
Skip auto-navigation, display unit selector
  ↓
lastView_<slug> NOT triggered (stays on selection screen)
```

### 2.4 Return Visit (Auto-Navigate)
```
/:masjidSlug (return visit, no special state)
  ↓
MasjidLanding loads with cached data
  ↓
Checks: isLoggedIn? fromChildPage?
  ↓
If neither: check lastView_<slug>
  ↓
If lastView exists:
  → Auto-navigate to last viewed page
  │   ├─ 'visitations' → /visitation
  │   ├─ 'listings' → /landing/:id/:unit
  │   └─ 'quicklinks' → /quick-links/:id
  ↓
Else: display unit selector
```

### 2.5 Navigation Button Clicks (Save & Navigate)
```
User selects unit + clicks button
  ↓
Save to localStorage:
  ├─ preferredMasjid = masjidSlug
  ├─ landingContext = { masjidID, unitID }
  └─ lastView_<slug> = 'visitations'|'listings'|'quicklinks'
  ↓
Navigate to selected page with state: { isLoggedIn: true, masjidID, unitID }
```

---

## 3. Visitation View Page Flow

**Route:** `/visitation`

### 3.1 Entry
```
/visitation (via Visitations button from MasjidLanding)
  ↓
Incoming state: { isLoggedIn: true, masjidID, unitID }
  ↓
Load all addresses for masjid
  ↓
Apply unit filter + display least/most-recently-visited
```

### 3.2 Back Navigation
```
User at /visitation
  ↓
Clicks Back button (orange button with ← Back)
  ↓
Check localStorage for masjidSlug
  ↓
If masjidSlug exists:
  → Navigate to /:masjidSlug with:
      ├─ replace: true (replaces history entry)
      └─ state: { fromChildPage: true }
  ↓
Else: navigate(-1) [browser back]
  ↓
Lands on /:masjidSlug with fromChildPage flag
  ↓
MasjidLanding skips auto-navigation, shows unit selector
```

### 3.3 Other Navigation
```
Quick Links button → /quick-links/:id
Route All button → /route with selected addresses
Unit/Area filters → Re-compute and display
```

---

## 4. Full Listings Page Flow

**Route:** `/landing/:masjidID/:unitID`

### 4.1 Entry
```
/landing/:id/:unit (via Full Listings button from MasjidLanding)
  ↓
Incoming state: { isLoggedIn: true }
  ↓
Fetch addresses for masjid + apply unit filter
  ↓
Display address table with search, filter, bulk actions
```

### 4.2 Back Navigation
```
User at /landing/:id/:unit
  ↓
Clicks link/button to go back (uses navigate(-1) browser back)
  ↓
Returns to previous page in history
  ↓
Usually lands on MasjidLanding or source page
```

### 4.3 Other Navigation
```
Address row → /address/:id [address detail]
Map button → /map/:id/:unit [map view]
Route button → /route [route planning]
Back to admin/login links
```

---

## 5. Quick Links Page Flow

**Route:** `/quick-links/:masjidID`

### 5.1 Entry
```
/quick-links/:id (via Quick Links button from MasjidLanding)
  ↓
Incoming state: { isLoggedIn: true, masjidID }
  ↓
Display grid of quick action links
```

### 5.2 Back Navigation
```
User at /quick-links/:id
  ↓
Clicks Back button (blue link at top)
  ↓
Check localStorage for masjidSlug
  ↓
If masjidSlug exists:
  → Navigate to /:masjidSlug with:
      ├─ replace: true
      └─ state: { fromChildPage: true }
  ↓
Else: navigate(-1) [browser back]
  ↓
Lands on /:masjidSlug with fromChildPage flag
  ↓
MasjidLanding skips auto-navigation, shows unit selector
```

### 5.3 Available Actions
```
Quick Links Grid:
  ├─ Visitations → /visitation
  ├─ Listings → /landing/:id/:unit
  ├─ Map → /map/:id/:unit
  ├─ Route → /route (empty)
  ├─ Export → Download CSV
  └─ [Others based on config]
```

---

## 6. Address Detail Page Flow

**Route:** `/address/:addressID`

### 6.1 Entry
```
/address/:id
  ↓
Can be reached from:
  ├─ Landing (address table row click)
  ├─ VisitationView (address table row click)
  ├─ MapView (marker click)
  └─ RouteView (selected address)
  ↓
Load address details + visit history
```

### 6.2 Back Navigation
```
User at /address/:id
  ↓
Clicks "Go Back" button
  ↓
Navigate(-1) [browser back]
  ↓
Returns to previous page that opened the detail
  ├─ Could be /landing/:id/:unit
  ├─ Could be /visitation
  ├─ Could be /map/:id/:unit
  └─ Could be /route
```

### 6.3 Actions
```
Save changes → PUT /api/addressList/:id
Record visit → PUT /api/addressList/visit/:id
Delete → DELETE /api/addressList/:id
Back → Browser history
```

---

## 7. Map View Page Flow

**Route:** `/map/:masjidID/:unitID`

### 7.1 Entry
```
/map/:id/:unit
  ↓
Incoming state: { isLoggedIn: true }
  ↓
Load all addresses, display on Leaflet map
  ↓
Apply unit filter
```

### 7.2 Interactions
```
Click address marker → Show popup + link to /address/:id
Zoom/Pan map
Select multiple addresses for routing
```

### 7.3 Back Navigation
```
Clicks Back or browser back button
  ↓
Navigate(-1) or navigate to previous page
  ↓
Usually returns to Landing or source page
```

---

## 8. Route Planning Page Flow

**Route:** `/route`

### 8.1 Entry
```
/route
  ↓
Incoming state: { listings: [...], masjidID, [unitID] }
  ↓
Display map with selected addresses
  ↓
Allow re-selection and area assignment
```

### 8.2 Back Navigation
```
Clicks Back button
  ↓
Navigate(-1) [browser back]
  ↓
Returns to page that sent addresses (VisitationView, Landing, etc.)
```

### 8.3 Actions
```
Assign area bulk → PUT /api/addressList/bulk/area
Deselect address → Remove from selection
Select all in unit → Select all visible
Save & Exit → Navigate back
```

---

## 9. Admin Pages Flow

### 9.1 Admin Login
```
/admin-login
  ↓
Enter Markaz admin password
  ↓
Navigate to /admin-home
```

### 9.2 Admin Home
```
/admin-home (MarkazAdmin role required)
  ↓
Navigation hub for admin functions
  ↓
Links to:
  ├─ Masjid Management → /masjid-management
  ├─ User Management → /user-management
  ├─ Back to login → /admin-login
  └─ Logout → /admin-login
```

### 9.3 Masjid Management
```
/masjid-management
  ↓
CRUD operations for masjids
  ↓
Back button → navigate(-1) → /admin-home
```

### 9.4 User Management
```
/user-management
  ↓
CRUD operations for admin users
  ↓
Back button → navigate(-1) → /admin-home
```

---

## 10. Session & Caching Strategy

| Page | Entry State | Storage Set | Storage Check | Back Behavior |
|------|-------------|-------------|---------------|---------------|
| `/user-login` | None | userPin, userMasjidSlug | Check cached creds | N/A |
| `/:masjidSlug` (new) | None/fromChildPage | userPin, loginSource | Check lastView_* | N/A (home page) |
| `/:masjidSlug` (login) | isLoggedIn | landingContext, lastView_* | Skip auto-nav | N/A |
| `/visitation` | isLoggedIn, unitID | visitationFilters_* | Check sessionStorage | → /:slug (replace) |
| `/landing/:id/:unit` | isLoggedIn | areaFilter, addressList | Check sessionStorage | Browser back |
| `/quick-links/:id` | isLoggedIn, masjidID | (none) | (none) | → /:slug (replace) |
| `/address/:id` | (any) | (none) | (none) | Browser back |
| `/map/:id/:unit` | isLoggedIn | (none) | (none) | Browser back |
| `/route` | listings, masjidID | (none) | (none) | Browser back |

---

## 11. Key Navigation Patterns

### Pattern 1: Auto-Navigation (MasjidLanding)
- **When:** Return visit to `/:masjidSlug` without special state
- **How:** Check `lastView_<slug>` localStorage key
- **Purpose:** Resume last viewed page automatically
- **Skip Conditions:** isLoggedIn, fromChildPage flags present

### Pattern 2: Child Page Back (VisitationView, QuickLinks)
- **When:** User clicks Back in child page
- **How:** Navigate to `/:masjidSlug` with `fromChildPage: true` and `replace: true`
- **Purpose:** Show selection screen again, not auto-jump back to child page
- **Fallback:** Browser history if no masjidSlug

### Pattern 3: Browser History Back
- **When:** Landing, Address Detail, Map, Route pages
- **How:** `navigate(-1)` or browser back button
- **Purpose:** Return to source page with full context preserved
- **Works:** Because browser stack has full entry state

### Pattern 4: Direct Slug Access (Auto-Login)
- **When:** User visits `/:masjidSlug` directly
- **How:** Extract PIN from config, cache credentials
- **Purpose:** Skip `/user-login` entirely
- **Works:** PIN known to both frontend and backend

---

## 12. State Flow Diagram

```
START (Browser)
  ↓
[/user-login OR /:masjidSlug]
  ↓
  ├─→ Cached credentials? → YES → /:masjidSlug (auto)
  │
  └─→ NO → /user-login form OR direct slug login
           ↓
           Login successful
           ↓
           /:masjidSlug with state: { isLoggedIn: true }
           ↓
┌──────────────────────────────────────────────────┐
│         MasjidLanding (Unit Selector)             │
│                                                   │
│  User selects unit + clicks button               │
│  Saves lastView_<slug>                           │
│  lastView_<slug> = 'visitations' | 'listings'...│
└──────────────────────────────────────────────────┘
           ↓ (3 options)
      ┌────┴──────┬─────────────┐
      ↓           ↓             ↓
  /visitation  /landing    /quick-links
      │           │             │
      │ Back      │ Back        │ Back
      │ (replace) │ (history)   │ (replace)
      │           │             │
      └─────┬─────┴─────┬───────┘
            ↓           ↓
    /:masjidSlug
    (state: fromChildPage)
            ↓
    Skip auto-nav
    Show unit selector again
            ↓
    Return to step: User selects unit...
           OR
    (on next visit without special state)
    Auto-navigate to lastView_<slug>
```

---

## 13. Related Files

- [login_flow.md](login_flow.md) — Detailed authentication flows
- [MasjidLanding.js](../src/Components/MasjidLanding.js) — Auto-nav and unit selection logic
- [VisitationView.js](../src/Components/VisitationView.js) — Back navigation to slug
- [QuickLinks.js](../src/Components/QuickLinks.js) — Back navigation to slug
- [UserLogin.js](../src/Components/UserLogin.js) — Session resume logic
- [Landing.js](../src/Components/Landing.js) — Address list page
- [AGENTS.md](../AGENTS.md) — Architecture & API endpoints
