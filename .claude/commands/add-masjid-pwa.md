---
description: Add a masjid landing slug as an installable PWA Home Screen role — updates pwa-roles.json, deploys, adds the production Render route, verifies, and logs it in the docs.
argument-hint: <masjid-landing-slug>
---

Add `$1` as a new installable PWA role for Markaz Visitation UI, following
[docs/pwa-multi-role-install.md](../../docs/pwa-multi-role-install.md) — read that file's
"Part 3" section first if it's not already in context, especially the two **Pitfall** sections;
this command exists specifically to not repeat those mistakes.

If `$1` is empty, stop and ask the user for a slug.

## Known identifiers (do not re-derive, but do verify step 2 before any mutating call)

- Production Render service: `srv-d7sh4bhj2pic73fa5ojg`, name `markaz-ui`, url
  `https://markaz-ui.onrender.com`.
- Render workspace id: `tea-d7rdq0km0tmc7388kkq0`.
- Masjid API (source of truth for slug → name): `https://visitation-api.onrender.com/api/masjids`.
- Render API base: `https://api.render.com/v1`. Auth header: `Authorization: Bearer $RENDER_API_KEY`
  — this must be set in the shell environment already (`echo $RENDER_API_KEY` to check). **Never
  hardcode the key value into this file or any command you run that gets logged/committed** — if
  it's not set, stop and ask the user to export it rather than asking them to paste the raw key.

## Steps

1. **Look up the slug.** `curl -s https://visitation-api.onrender.com/api/masjids` and find the
   entry with `landing == "$1"`. If none exists, stop and report — don't guess a masjid name.
   Note its `name` field.

2. **Check for duplicates.** Read `scripts/pwa-roles.json`. If `$1` is already present, stop and
   report — nothing to do.

3. **Update `scripts/pwa-roles.json`.** Append
   `{ "path": "$1", "name": "<masjid name> – Markaz Visitations", "shortName": "<masjid name>", "appleTitle": "<masjid name>" }`
   to the `roles` array, matching the style of existing entries.

4. **Update `render.yaml`.** Add the matching block to the `routes` list, directly above the
   `/* → /index.html` catch-all (for documentation purposes — per the doc's pitfall, this alone
   does not apply the route; it's kept as a record of intent):
   ```yaml
   - type: rewrite
     source: /$1
     destination: /$1/index.html
   ```

5. **Verify the production service identity before going further** — confirm via
   `mcp__render__get_service` (workspaceId `tea-d7rdq0km0tmc7388kkq0`, serviceId
   `srv-d7sh4bhj2pic73fa5ojg`) that `name == "markaz-ui"` and
   `serviceDetails.url == "https://markaz-ui.onrender.com"`. If either doesn't match, stop —
   something is wrong with the known identifiers above and this needs human investigation before
   any route mutation.

6. **Commit and push.** Following the repo's commit workflow (`AGENTS.md`): stage
   `scripts/pwa-roles.json` and `render.yaml`, commit as
   `feat(pwa): add $1 to installable masjid roles`, and push to `master`. This triggers a
   production redeploy that generates `build/$1/index.html` and `build/manifest-$1.json`.

7. **Wait for the deploy to go live.** Poll `mcp__render__list_deploys` (same workspaceId/serviceId
   as step 5, `limit: 1`) until the deploy for the commit just pushed has `status: "live"`. This
   is a hard prerequisite for step 8 — a route added before this finishes points at a file that
   doesn't exist yet (see the doc's production-mixup pitfall for what that risks).

8. **Create the Render route.**
   ```
   curl -s -X POST https://api.render.com/v1/services/srv-d7sh4bhj2pic73fa5ojg/routes \
     -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
     -d '{"type":"rewrite","source":"/$1","destination":"/$1/index.html"}'
   ```
   Take the returned route `id`, then immediately:
   ```
   curl -s -X PATCH https://api.render.com/v1/services/srv-d7sh4bhj2pic73fa5ojg/routes/<id> \
     -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
     -d '{"priority":-1}'
   ```
   (Render renumbers other routes/the catch-all to preserve relative order — don't try to
   compute an exact numeric gap, `-1` is sufficient. Confirmed by the verification step next,
   not assumed.)

9. **Verify**, against production directly:
   - `curl -s https://markaz-ui.onrender.com/$1 | grep 'rel="manifest"'` — must reference
     `manifest-$1.json`, not the default `manifest.json`.
   - `curl -s https://markaz-ui.onrender.com/manifest-$1.json` — confirm `start_url: "/$1"`.
   - `curl -s -o /dev/null -w '%{http_code}' https://markaz-ui.onrender.com/address/nonexistent`
     — confirm it's still `200` (the new route didn't swallow the catch-all).
   If any check fails, stop and report the failure — do not proceed to step 10 or claim success.

10. **Update the docs.** In `docs/pwa-multi-role-install.md`, append one row to the "Rollout log"
    table at the end of Part 3: `| <today's date> | \`$1\` | <masjid name> | ✅ verified on production |`.
    Commit as `docs(pwa): log $1 rollout` and push.

11. **Report** to the user: the slug, the masjid name, the route id created, and the three
    verification results from step 9.

## Rules

- Never touch the PR preview service or any other service ID for this workflow — production is
  the only target once this command is invoked directly (it has no PR/branch step of its own).
- Never skip step 5 or step 7. Both exist because skipping them is exactly what caused the two
  incidents documented in the doc's Pitfall sections.
- If any step fails, stop and report state clearly (what succeeded, what didn't, what's now
  true in `scripts/pwa-roles.json` / `render.yaml` / git / Render) rather than trying to push
  through or silently retry a mutating call.
