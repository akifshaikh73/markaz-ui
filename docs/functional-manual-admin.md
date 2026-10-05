# Chicago Visitations — Admin Manual (Masjid Admin and Markaz Admin)

This manual covers what is different for administrators. Day-to-day work — Visitations, Full Listings, adding addresses and the duplicate check, address details and visits, routes, Quick Links — works the same for every role and is described in the [User Manual](functional-manual-user.md).

Menu names in the application are the source of truth. Cards labeled **Coming Soon** are planned features and are not usable yet.

## 1. Roles

| Role | Sign-in | Access |
| --- | --- | --- |
| Masjid User | Masjid PIN, or the masjid link (e.g. `/di`) | One masjid's listings — see the [User Manual](functional-manual-user.md) |
| **Masjid Admin** | Email and PIN under **Masjid Admin Login** at `/user-login` | Everything a Masjid User can do, for each assigned masjid, plus [Map View, Excel export and coordinates](#3-admin-tools-on-the-listing-screens) |
| **Markaz Admin** | Markaz admin password at `/admin-login` | Everything a Masjid Admin can do for **all** masjids, plus the [Markaz Admin dashboard](#4-markaz-admin-dashboard) (masjid and user management) |

Access is enforced by role: shared screens send a signed-out visitor to the masjid login, and dashboard screens send anyone who is not a Markaz Admin to `/admin-login`.

## 2. Signing in

### Masjid Admin

1. Open `/user-login`.
2. Expand **Masjid Admin Login**.
3. Enter your email and PIN.
4. The app opens your primary masjid.
5. On the masjid landing screen, use **Other Masjids** to switch between the masjids assigned to you.

The installed app resumes a Masjid Admin session while its saved session is still valid. Use **Logout** on shared devices.

### Markaz Admin

1. Open `/admin-login`.
2. Enter the Markaz admin password.
3. Continue to the Markaz Admin dashboard (`/admin-home`).

The Markaz password is never saved by the app; sign in again after **Logout**.

## 3. Admin tools on the listing screens

All [User Manual](functional-manual-user.md) workflows apply. In addition:

- **🗺 Map View** (Full Listings, top right) plots the listings that have coordinates. Select a marker for the name, address, area, latest response, date, and most recent comment. **Back to List** returns to the masjid and unit.
- **⬇ Export Excel** (Full Listings, top right) downloads the current address list for the masjid and unit.
- **Latitude** and **Longitude** are shown on the address detail page.
- Any masjid's listing can be opened by its ID or link (Masjid Users get an **Access Denied** page for another masjid's listing).
- **Markaz Admin only:**
  - Searches on Full Listings return matching listings from **all** masjids, not just the one being viewed. (For Masjid Users and Masjid Admins, results are limited to the current masjid, with a "does not belong to this masjid" notice when a search only matches other masjids.)
  - A **⌂ Home** link on Full Listings and address details returns to the Markaz Admin dashboard.

## 4. Markaz Admin dashboard

Available to Markaz Admins at `/admin-home`.

### Masjid Management

- View all masjids, search by name, or open one by ID.
- Review each masjid's landing link (slug) and configured units.
- Open a masjid's details to edit its address, use the current location when the browser supports it, and edit or reset the masjid PIN.

### User Management

- Search users by email, first name, or last name; filter by masjid ID.
- Review enabled/disabled status and assigned roles.
- Open a user's details to reset their password/PIN (or generate a new PIN where permitted).
- Follow a user's masjid link to Masjid Management.

Use **Home** to return to the dashboard and **Logout** to end Markaz admin access.

## 5. Troubleshooting

**Map View or Export Excel is missing.** These buttons appear only for Masjid Admins and Markaz Admins. Sign in through **Masjid Admin Login** or `/admin-login`; a masjid PIN or masjid link signs you in as a Masjid User.

**A search does not find another masjid's address.** Masjid Admin searches are limited to the masjid being viewed; switch with **Other Masjids**. Markaz Admin searches cover all masjids.

**Markaz Admin is asked for the password again.** Expected — the Markaz password is not saved; sign in again after logout or a new session.

**The installed app opens at login.** Normal for a new session. Masjid Admin sessions resume automatically while the saved session is still valid.

For listing, search, duplicate-check, and route problems, see [Troubleshooting](functional-manual-user.md#10-troubleshooting) in the User Manual.
