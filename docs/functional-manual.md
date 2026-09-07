# Chicago Visitations Functional Manual

This manual describes the current screens, roles, and workflows in Chicago Visitations. Menu names in the application are the source of truth; disabled cards labeled **Coming Soon** are displayed for planned features but are not currently usable.

## 1. Roles and access

| Role | Sign-in method | Main access |
| --- | --- | --- |
| Masjid User | Four-digit masjid PIN, or a valid masjid link such as `/di` | View and work with addresses for the selected masjid; record visit responses |
| Masjid Admin | Email and PIN from the **Masjid Admin Login** section | Masjid User access plus address editing, adding addresses, bulk updates, Excel export, and map access |
| Markaz Admin | Markaz admin password at `/admin-login` | Global admin dashboard, all masjid data, all user data, and shared address tools |

Access is enforced by role. An unauthenticated user is sent to masjid login for shared user screens and to Markaz admin login for admin-only screens.

## 2. Sign-in and starting a session

### Masjid User

1. Open `/masjid-login` or the masjid's shared link.
2. Enter the four-digit masjid PIN.
3. Select a unit, or choose **All** when available.
4. Choose **Visitations**, **Full Listings**, or **Quick Links**.

A valid masjid landing link can also identify the masjid directly. The app then assigns the normal masjid-user role when the user proceeds into the working screens.

### Masjid Admin

1. Open `/user-login`.
2. Expand **Masjid Admin Login**.
3. Enter the administrator email and PIN.
4. The app opens the primary assigned masjid.
5. On the masjid landing screen, open **Other Masjids** to switch among assigned masjids.

The app can resume a masjid administrator session when its cached session information is still present. Use **Logout** when the device is shared or when the session should be cleared.

### Markaz Admin

1. Open `/admin-login`.
2. Enter the Markaz administrator password.
3. Continue to the Markaz admin dashboard.

The Markaz password is not cached by the app. Markaz admin access must be authenticated again after logout.

## 3. Masjid landing screen

The masjid landing screen is the starting hub for a selected masjid.

- **Masjid ID** shows the current masjid and cannot be edited here.
- **Unit ID** selects one unit or **All**.
- **Visitations** opens the daily/weekly visitation queue.
- **Full Listings** opens the address list and search tools.
- **Quick Links** opens shortcuts to visitations, lists, routes, and reports.
- **Other Masjids** is available to Masjid Admin users with access to more than one masjid.
- **Logout** clears the user session and returns to the appropriate login screen.

The last selected masjid, unit, and landing view may be restored by the browser. The available units depend on the selected masjid.

## 4. Full Listings

The Full Listings view is the main address-management screen at `/landing/:masjidID/:unitID`.

### Find addresses

1. Choose a unit in the search controls, if available.
2. Enter the relevant search fields, such as ID, name, address, city, or other available criteria.
3. Use the neighborhood selector to narrow results by area.
4. Use the inactive or student filters when needed.
5. Submit the search. Use reset to return to the normal list.

Results are grouped by neighborhood. Addresses without an area appear under **(No Area)**. Search results and the neighborhood filter work together, so the area filter narrows the current result set.

### Address rows and details

- Select an address using its checkbox for bulk actions.
- Open the address ID to view the complete record.
- Review contact details, address, neighborhood, unit, coordinates, inactive status, student information, and visit history.
- Use **Back** or **Home** to return without losing the working context where possible.

### Update addresses

Masjid Admin and Markaz Admin users can:

- Add a new address with **Add Address**.
- Edit the name, unit, neighborhood, or other editable fields from the address detail view.
- Record a visit response with a date, response, and optional comments.
- Select multiple rows and use **Set Neighborhood** to update their area.
- Select multiple rows and use **Set Unit** to move them to another unit.
- Export the current address data to Excel.

Masjid Users can view records, record visit activity where the screen permits it, and use **Set Unit** for selected addresses. Neighborhood bulk updates, address creation, editing, Excel export, and other administrator-only management controls remain restricted to Masjid Admin and Markaz Admin users.

## 5. Visitations

The Visitations view is opened from the masjid landing screen or Quick Links.

It loads active addresses for the masjid and presents a manageable visitation queue.

1. Choose **Earliest** to prioritize the least recently visited records, or **Latest** to prioritize recently visited records.
2. Choose how many addresses to show per unit: 5, 10, 25, or a custom number.
3. Filter by unit and then by neighborhood.
4. Search by name or address.
5. Review the latest visit date and response.
6. Select individual addresses when building a route.
7. Use **Route Selected** or **Route Unit** to open route planning.
8. Use **Add Address** when an administrator needs to create a new address from this workflow.

Inactive records are excluded from the visitation queue. Filters are remembered for the current browser session per masjid.

## 6. Address detail and visit history

The address detail view is opened by selecting an address ID.

It provides:

- Identity and contact information
- Masjid and unit assignment
- Street address, neighborhood, latitude, and longitude
- Active/inactive and met status
- Students associated with the address
- Visit history sorted with the newest activity first

To record a visit, choose a date, select a response, optionally enter comments, and select **Update Response**. A response is required before the update can be submitted. Use **Route** when coordinates are available.

## 7. Maps and routes

### Map View

Map View plots addresses that have latitude and longitude coordinates. Select a marker to see the name, address, area, latest response, date, and most recent comment. Addresses without coordinates cannot be plotted.

Use **Back to List** to return to the selected masjid and unit.

### Route View

Route planning can be opened from selected address rows, an entire visitation unit, an address detail record, or Quick Links.

1. Select one or more addresses with usable coordinates.
2. Open the route view.
3. Review the plotted stops.
4. Choose **Optimize Route** to calculate a driving route.
5. Review the total distance and estimated duration.
6. Use **Clear Route** to remove the calculated route while keeping the address list available.

Quick Links can also open Route View with the masjid as the reference point and no preselected addresses.

## 8. Quick Links

Quick Links provides shortcuts for the selected masjid:

| Shortcut | Current behavior |
| --- | --- |
| Visitations | Opens the visitation queue |
| Full List | Opens the full address list for all units |
| Routes | Opens route planning |
| Reports | Opens the reports screen |
| Visitations Report | Coming Soon |
| Old Workers | Coming Soon |
| Masturat Work | Coming Soon |

Use **Home** to return to the masjid landing screen.

## 9. Reports

The Reports screen currently provides **Inactive Listings**, which opens the address list with inactive records shown.

The following cards are visible but currently disabled: Unvisited Addresses, High Priority, Visit Statistics, Area Summary, and Export Data. They should not be treated as available reporting functions until enabled in a future release.

## 10. Markaz Admin dashboard

The Markaz Admin dashboard is available after Markaz admin authentication at `/admin-home`.

### Masjid Management

Use **Masjid Management** to:

- View all masjids
- Search by masjid name
- Open a masjid by ID
- Review the masjid landing slug and configured units
- Open masjid details

Masjid details include the masjid address and location information. Administrators can edit the masjid address, use current location when supported, and edit or reset the masjid PIN.

### User Management

Use **User Management** to:

- Search users by email, first name, or last name
- Filter users by masjid ID
- Review enabled/disabled status and assigned roles
- Open user details
- Reset a user's password/PIN and generate a new PIN where permitted
- Follow a user's masjid link to Masjid Management

Use **Home** to return to the dashboard and **Logout** to end Markaz admin access.

## 11. Navigation and session behavior

- **Home** usually returns to the selected masjid landing screen.
- **Back** returns to the previous list or detail context when available.
- Direct links to protected screens require a valid role and redirect to login if the role is missing.
- Logging out clears cached address filters, the selected landing context, and browser session data used by the app.
- A browser refresh may preserve the selected masjid and some filters, but it does not replace a required login.

## 12. Troubleshooting

### No data appears

Confirm that the API is reachable, the correct masjid and unit are selected, and the browser is online. A cold-start API may take a moment to become ready.

### A route has no stops

Only addresses with latitude and longitude can be mapped or routed. Return to the address detail view and confirm that coordinates exist.

### A menu item is unavailable

Some features are intentionally disabled and labeled **Coming Soon**. Other missing controls may be role-restricted; sign in with the administrator role that owns the required operation.

### The app opens at login after installation

This is expected for a new session. Use the correct masjid PIN, administrator email and PIN, or Markaz admin password. Masjid Admin sessions may resume automatically when their saved session information is still valid.