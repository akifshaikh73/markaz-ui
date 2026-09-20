# Multiple Home Screen Install Targets From One PWA

How to let different users install *different* entry points of the same PWA to their
phone's Home Screen — e.g. a parent gets `/family/`, a teacher gets `/teacher/` — from a
single codebase, single build, single service worker, and single deployment.

Part 1 documents exactly what's implemented for Pick n Drop. Part 2 is the generic,
project-agnostic recipe to reuse for other apps (Classroom Activities, Tuition Tracker, etc.).

## The problem

A Web App Manifest's `start_url` controls where an installed PWA opens when launched from
its Home Screen icon. A single `<link rel="manifest">` means every install of that app gets
the same `start_url`, regardless of what page the user was actually on when they installed it.

That's fine for a single-audience app. It breaks down the moment one PWA serves multiple
audiences (parent vs. teacher, student vs. admin) who each need their own icon that reopens
to their own section.

The tempting-but-wrong fix is to swap the manifest link's `href` at runtime with JavaScript
based on the current route. **This does not reliably work on iOS Safari.** iOS reads the
`<link rel="manifest">` from the static HTML as served, at the moment you use Share → Add to
Home Screen — not from the DOM after your app's JS has mutated it. We hit this directly (see
[Pitfall](#pitfall-the-js-swap-that-didnt-work-on-ios) below): the swap worked perfectly in a
browser DevTools check, and still failed on a real iPhone.

The reliable fix is to make the *server* return the correct manifest link in the initial HTML,
per route — no client-side mutation required.

## Part 1 — Pick n Drop implementation (case study)

### Architecture

One Vite build, one `sw.js`, one CloudFront distribution. Two static HTML entry documents and
two manifest files, routed by path.

```
pickndrop/pwa/
├── index.html                          # base template — manifest link + <script src="/src/main.tsx">
├── public/
│   ├── manifest.webmanifest            # start_url: /pickndrop/family/  (default)
│   ├── manifest-teacher.webmanifest    # start_url: /pickndrop/teacher/
│   └── sw.js                           # shared by both roles — no role-specific logic
└── src/main.tsx                        # belt-and-suspenders runtime manifest swap (see below)
```

Deploy produces **two** copies of the built `index.html` in S3:

```
s3://<bucket>/pickndrop/index.html            # manifest link → manifest.webmanifest
s3://<bucket>/pickndrop/teacher/index.html    # manifest link → manifest-teacher.webmanifest
```

Both reference the exact same hashed JS/CSS bundle (`/pickndrop/assets/*`), so there's no
duplicate app code — only the manifest `<link>` differs between the two HTML files.

A CloudFront Function (`PlatformUiSpaRouter`, in
[`infrastructure/template.yaml`](../infrastructure/template.yaml)) rewrites incoming requests
so each route resolves to the right HTML file:

```js
if (uri === '/pickndrop/teacher' || uri.indexOf('/pickndrop/teacher/') === 0) {
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {          // not a real asset request
    request.uri = '/pickndrop/teacher/index.html';
  }
  return request;
}
// ...falls through to the generic /pickndrop/index.html rewrite for everything else
```

This is a viewer-request function — it runs on every request before the cache and the S3
origin, and costs a fraction of a cent per million invocations. It only rewrites *paths that
don't already point at a real file* (i.e. no `.` in the last path segment), so JS/CSS/manifest
asset requests pass straight through untouched.

`deploy-pwa.ps1` builds once, then derives the teacher HTML from the build output instead of
building twice:

```powershell
(Get-Content dist/index.html -Raw) -replace 'manifest\.webmanifest', 'manifest-teacher.webmanifest' |
    Set-Content dist/teacher/index.html -NoNewline
```

Both `index.html` files deploy with `Cache-Control: no-cache` (they're small and must always
be revalidated), and both manifest files deploy the same way — **not** with the
`public,max-age=31536000,immutable` cache header used for hashed JS/CSS assets, since manifest
filenames don't change on every edit. Both new paths are added to the CloudFront invalidation
list on every deploy.

### Runtime swap (defense in depth, not the primary mechanism)

`src/main.tsx` still flips the manifest `<link>`'s `href` client-side, keyed off
`window.location.pathname`:

```ts
const manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null
if (manifestLink && window.location.pathname.startsWith('/pickndrop/teacher')) {
  manifestLink.href = '/pickndrop/manifest-teacher.webmanifest'
}
```

This is now redundant on the routes it matters for (the static HTML is already correct), but
it's harmless and keeps the manifest correct if the route is ever reached in a way that
bypasses the CloudFront Function. It is **not sufficient on its own** — see the pitfall below.

### Pitfall: the JS swap that didn't work on iOS

Original implementation shipped with only the runtime swap above, no separate static HTML.
Verified with Playwright in a real browser that `document.getElementById('app-manifest').href`
correctly reported the teacher manifest on the teacher route. Shipped it, and a teacher who
installed the dashboard from her iPhone still landed on `/family/` after tapping the Home
Screen icon.

Root cause, confirmed by curling the deployed site directly: **CloudFront served the exact
same `index.html` object for every `/pickndrop/*` deep link** (a single-page-app fallback
rewrite collapses all of them to one file). That file's manifest link always pointed at the
family manifest. The JS ran and mutated the DOM correctly, but iOS's Add to Home Screen reads
the manifest from the page as *fetched*, before or independent of app JS execution — the DOM
mutation was invisible to it.

**Takeaway: don't trust a client-side manifest swap for iOS. Serve the right manifest link in
the actual HTML response for each route.**

## Part 2 — Generic recipe for future apps

Use this whenever one app has more than one "role" or "persona" that should install as
distinct Home Screen icons with distinct `start_url`s (or distinct `name`/`icons`, for that
matter — same mechanism covers icon/name branding per role too).

### Decision: what NOT to do

| Approach | Why not |
|---|---|
| Single manifest, single `start_url` | Only one role gets an accurate install; everyone else's icon opens to the wrong place. |
| Client-side JS swap of the manifest `<link>` | Works on Chrome/Android in practice, but **iOS Safari does not reliably honor it** — confirmed above. Don't rely on this alone. |
| Fully separate build/deploy/subdomain per role | Works, but means duplicate JS/CSS bundles, duplicate deploys, and duplicate service worker registrations for what's usually a single-page app with a route-level difference. Only worth it if the roles are close to entirely different apps. |

### Recommended approach

One build, one service worker, one deploy — multiple static HTML entry documents and
multiple manifest files, routed at the CDN/server layer:

1. **One manifest file per role**, differing only in `start_url` (and optionally `name`,
   `short_name`, `icons`, `theme_color` if you want distinct branding per role on the Home
   Screen). Put them all in `public/` so the build copies them verbatim.
2. **One HTML entry document per role**, each with its manifest `<link>` pointed at the
   matching manifest file. If every role shares the same JS bundle (typical for a client-routed
   SPA), generate the extra HTML files by string-replacing the manifest filename in the primary
   build output — don't hand-maintain a second template that can drift.
3. **Route at the server/CDN**, not in the browser: whatever serves your SPA fallback
   (CloudFront Function, Nginx `try_files`, a Lambda@Edge, a platform-specific rewrite rule)
   needs a rule *per role path prefix* that resolves to that role's HTML file, before the
   catch-all fallback. This is the one piece of actual infrastructure work — everything else is
   static files.
4. **Keep the service worker role-agnostic.** Registration and scope don't need to change; a
   single `sw.js` covering the whole app's path prefix is correct regardless of which HTML
   entry point loaded it.
5. **Cache headers**: HTML and manifest files should be `no-cache` (small, must revalidate on
   every load); hashed JS/CSS assets can be `immutable, max-age=1year` as usual. Don't let a
   manifest file accidentally inherit a long immutable cache — it has no content hash in its
   filename, so a stale cached copy can persist for the full TTL.
6. **Invalidate all of it** on deploy: every role's HTML file and every role's manifest file,
   not just the default ones.

### Platform behavior differences (why you can't skip step 3)

| Platform | Reads manifest from | Notes |
|---|---|---|
| iOS Safari, pre-16.4 | Doesn't read the manifest at all | "Add to Home Screen" just bookmarks the current URL — actually the most forgiving case, but you can't rely on your users' iOS version. |
| iOS Safari, 16.4+ | The `<link rel="manifest">` in the served HTML, at install time | Does **not** reliably reflect JS-mutated `href` values. This is the case that requires the server-side routing above. |
| Android Chrome | The manifest resolved from the live page, including JS mutations | The client-side swap alone would actually work here — but build for the strictest platform (iOS 16.4+) and every other platform is automatically covered. |
| Desktop Chrome/Edge | Same as Android Chrome | Same conclusion. |

### Verification checklist

1. `curl` (not a browser) each role's route directly and grep for the manifest `<link>` —
   confirm each resolves to a *different* HTML response with the correct manifest reference,
   with no JavaScript execution involved. This is the ground truth check; a browser-based
   DevTools check can lie to you (it reflects the post-JS DOM, not what the server actually sent).
2. `curl` each manifest file directly and confirm its `start_url` and `Cache-Control` header.
3. Confirm the default/unmatched route still resolves correctly (don't let a new special-case
   rule swallow it).
4. Only after 1–3 pass: real-device check. Install from each role's link on an actual iPhone
   (iOS 16.4+) and confirm the Home Screen icon reopens to the right route. A simulator or
   BrowserStack iOS session does not reliably reproduce the Add to Home Screen manifest read —
   test on real hardware if you can.

### End-user install instructions template

Reuse this structure per role in onboarding emails/docs (see
[teacher-admin-email.md](teacher-admin-email.md) for the Pick n Drop teacher version and
[parent-app-email.md](parent-app-email.md) for the family version):

```markdown
## Install [App Name] on Your Phone

### Install on iPhone
1. Open **Safari** on your iPhone (must be Safari — other browsers can't install to the Home Screen on iOS).
2. Go to the [App Name] link above.
3. Tap the **Share** button.
4. Scroll down and select **Add to Home Screen**.
5. Tap **Add**.
6. Open [App Name] from the new icon on your Home Screen.

### Install on Android Using Chrome
1. Open the [App Name] link in Chrome.
2. Tap the three-dot menu in the upper-right corner.
3. Select **Install app** (some phones show **Add to Home screen** instead).
4. Confirm by tapping **Install** or **Add**.
5. Open [App Name] from your phone's Home Screen or app list.
```

If a role's icon should reinstall (e.g. after a manifest fix like the one in Part 1), the old
icon must be removed and re-added — a stale installed icon keeps whatever `start_url` it
captured at install time and won't pick up server-side changes on its own.

## Part 3 — Markaz Visitation UI implementation (case study)

Markaz Visitation UI is a Create React App app deployed as a Render Static Site, not a Vite +
CloudFront app like Pick n Drop in Part 1 — so there's no CDN function layer to write routing
logic in. The build-time half of the recipe (per-role manifest + HTML generation) is identical
in spirit to Part 1. The deploy-time routing half turned out **not** to work the way `render.yaml`
implies — see the pitfall below before copying this pattern to another Render-hosted app.

This app has two kinds of "role": three fixed entry points defined as routes in `src/App.js`
(`/masjid-login`, `/user-login`, `/admin-login`), and per-masjid landing pages (`/:masjidSlug`).
The masjid list is **not** known at build time — `src/hooks/useMasjids.js` fetches it from
`GET /api/masjids` at runtime, and masjids can be added via `/admin/masjids` with no frontend
deploy. So only a curated, manually maintained subset of masjid slugs gets its own installable
icon; everyone else still installs fine, just via whichever role manifest was active
(`start_url` points at that role's URL, not the specific masjid).

### Architecture

```
markaz-ui/
├── public/
│   ├── index.html                 # base template — manifest link + apple-mobile-web-app-title
│   └── manifest.json              # base manifest — start_url: /masjid-login (default/fallback)
├── scripts/
│   ├── pwa-roles.json             # curated list of installable roles/slugs — single source of truth
│   └── generate-pwa-entries.js    # postbuild: derives per-role manifest + HTML from the list
└── render.yaml                    # documents the intended routes/headers (see pitfall — not
                                    # actually applied by Render for this service)
```

`scripts/generate-pwa-entries.js` runs as the `postbuild` npm script (wired in `package.json`),
so it fires automatically after every `react-scripts build` — no change to `render.yaml`'s
`buildCommand` needed. For each entry in `pwa-roles.json` it:
1. Clones `build/manifest.json`, overrides `start_url`/`name`/`short_name`, writes
   `build/manifest-<path>.json`.
2. Clones `build/index.html`, rewrites the `rel="manifest"` href to point at that file and the
   `apple-mobile-web-app-title` meta tag to the role's display name (handles iOS pre-16.4, which
   ignores the manifest entirely and uses that meta tag instead), writes `build/<path>/index.html`.

This part works exactly as designed — verified locally by running `npm run build` and checking
every `build/<role>/index.html` references the right `manifest-<role>.json`.

### Pitfall: `render.yaml`'s `routes`/`headers` were never actually applied

`render.yaml` has a `routes` block (one rewrite per role before the SPA catch-all) and a
`headers` block (`Cache-Control: no-cache` on HTML/manifest files) — the natural way to express
this on Render, mirroring the CloudFront Function in Part 1. **Neither took effect**, on
production or on the PR preview built from this branch.

Root cause: the `markaz-ui` Render service was created directly in the dashboard, not as a
**Blueprint** (Render's Infrastructure-as-Code mode). Render only reads `render.yaml` for a
Blueprint-managed service, and even then only for the initial creation of a service — routing
rules for an existing, dashboard-created static site live entirely in that service's own
Settings → Redirects/Rewrites, independent of any `render.yaml` in the repo. We confirmed this
two ways:
- The live service's `pullRequestPreviewsEnabled` setting didn't match what `render.yaml` said,
  even after multiple deploys of a `render.yaml` with `pullRequestPreviewsEnabled: true`.
- After deploying this branch, `curl`-ing every role path on the PR preview
  (`https://markaz-ui-pr-26.onrender.com/muthman`, etc.) returned the **default** manifest, not
  the role-specific one, despite the generated files existing correctly at
  `/muthman/index.html` and `/manifest-muthman.json` directly.

**Takeaway: on Render, don't assume `render.yaml` is authoritative for an existing service.**
Check `GET https://api.render.com/v1/services/{serviceId}` (`pullRequestPreviewsEnabled`,
`previews.generation`) against what `render.yaml` says before relying on any of `render.yaml`'s
`routes`/`headers`/`envVars` having actually been synced. `render.yaml` is left in this repo as
a record of intent (and as the config a future Blueprint conversion would adopt), but routing is
currently managed out-of-band via the Render API/dashboard, as described next.

### Actual routing mechanism: the Render REST API

Render exposes a routes resource per service — this is what actually controls request routing,
regardless of what `render.yaml` says:

```
GET    /v1/services/{serviceId}/routes
POST   /v1/services/{serviceId}/routes    { "type": "rewrite", "source": "/<path>", "destination": "/<path>/index.html" }
PATCH  /v1/services/{serviceId}/routes/{routeId}   { "priority": <n> }
DELETE /v1/services/{serviceId}/routes/{routeId}
```

(Auth: `Authorization: Bearer <Render API key>`, generated from Render dashboard → Account
Settings → API Keys.)

**Priority gotcha**: routes are evaluated in ascending `priority` order — **lower number wins**.
The pre-existing catch-all (`/* → /index.html`) sits at `priority: 0`. A `POST` to create a new
route auto-assigns the *next positive integer* (1, 2, 3, …), which sorts **after** the catch-all
and is therefore never reached — the catch-all matches `/*` first and wins every time. Creating
the 8 role routes this way silently did nothing until each was `PATCH`ed to an explicit
**negative** priority (e.g. `-1` through `-8`), which then correctly sorts before the catch-all.
This is the opposite of what the dashboard UI's "drag rules above the catch-all" framing
suggests — order in the UI list reflects priority, but new rules don't default to "on top."

### Pitfall: mutated production instead of the PR preview

While probing this API's schema, a test `POST` was run against the **production** service ID
(`srv-d7sh4bhj2pic73fa5ojg`, `markaz-ui`) instead of the intended PR preview service ID
(`srv-dao51o17lnhs73en4l40`, `markaz-ui-pr-26`) — both IDs had been in play in the same session
and it's easy to reuse the wrong one. This created a real (if likely inert, given the priority
gotcha above — it landed at `priority: 1`, after the catch-all) rewrite rule on the live site,
pointing at a file (`/masjid-login/index.html`) that didn't exist in production's build yet.
Caught and reverted via the same API before it could matter.

**Takeaway**: when a service has both a production ID and a preview/staging ID in scope in the
same session, double-check which one a mutating call targets *before* sending it — read-only
calls (`GET`) are cheap to run against the wrong target by mistake; `POST`/`PATCH`/`DELETE`
are not. Prefer testing schema/behavior against an ephemeral preview service first, never
production.

### Adding a new installable masjid

1. Append `{ "path": "<slug>", "name": "...", "shortName": "...", "appleTitle": "..." }` to
   `scripts/pwa-roles.json` (keeps the build-time generation and the doc's record of intent
   in sync).
2. Add the matching block to `render.yaml`'s `routes` (for documentation/future Blueprint
   adoption — see pitfall above, this alone does **not** apply the change).
3. Create the actual route via the Render API against the **production** service
   (`srv-d7sh4bhj2pic73fa5ojg`) — only after the merge that adds the new role's build output has
   deployed, otherwise the route points at a file that doesn't exist yet:
   ```
   POST /v1/services/srv-d7sh4bhj2pic73fa5ojg/routes
   { "type": "rewrite", "source": "/<slug>", "destination": "/<slug>/index.html" }
   ```
   then immediately `PATCH` its `priority` to a negative number (any value lower than every
   existing role route's priority) so it actually takes effect.
4. Re-run the verification checklist against production.

### Known gap: `Cache-Control` headers

`render.yaml`'s `headers` block (forcing `no-cache` on `*.html`/`manifest*.json`) has the same
"not actually applied" problem as `routes`, for the same reason. Unlike routes, this hasn't been
fixed yet — the live site currently serves Render's own default (`public, max-age=0,
s-maxage=300`) on these paths, which happens to be short enough (5 min) that it's a minor risk
rather than the long/immutable-cache failure mode this doc originally warned about, but it
should still be fixed properly (likely a parallel `/v1/services/{serviceId}/headers` resource —
unconfirmed, not yet investigated) before relying on it.

### Verification performed

Full [Verification checklist](#verification-checklist) run against the live PR preview
(`https://markaz-ui-pr-26.onrender.com`, built from this branch) after fixing the route
priorities above:
- All 8 roles (`masjid-login`, `user-login`, `admin-login`, `muthman`, `masjid-ds`, `msi`,
  `diman`, `oswego`) `curl`ed directly and confirmed to return a distinct
  `rel="manifest" href="/manifest-<role>.json"` each, with no JS/browser involved.
- `manifest-muthman.json` `curl`ed directly and confirmed `start_url: "/muthman"`.
- An unmatched deep link (`/address/nonexistent`) still resolves (200) with the default
  manifest — the new routes don't swallow anything else.
- Real iPhone install check (iOS 16.4+) against the preview URL is still outstanding — needs to
  be done on real hardware, can't be verified from this environment.
- Production rollout (adding the same 8 routes to `srv-d7sh4bhj2pic73fa5ojg` with negative
  priorities) is intentionally **not done yet** — see step 3 above, it has to wait until this PR
  merges and production redeploys with the per-role build output.
