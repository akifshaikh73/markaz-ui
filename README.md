# Markaz Visitation UI

## API Reference

All endpoints are relative to `REACT_APP_API_URL` (configured via environment variable).

| Method | Endpoint | Query Params / Body | Description | Component |
|--------|----------|----------------------|-------------|-----------|
| `GET` | `/api/addressList/list` | `masjid_id`, `unit_id` *(optional)* | Fetch address list for a masjid; omit `unit_id` for all units | `Landing` |
| `POST` | `/api/addressList/filter/search/` | Body: `{ masjidId, unitId?, _id?, name?, address?, city?, showInactive?, filterByStudents? }` | Search/filter addresses | `Landing` |
| `GET` | `/api/addressList/search/:id` | — | Fetch a single address by ID | `AddressDetail` |
| `PUT` | `/api/addressList/:id` | Body: `{ firstName?, lastName?, unitId?, inactive? }` | Update address name, unit, or inactive flag | `AddressDetail` |
| `PUT` | `/api/addressList/visit/:id` | Body: `{ lastmodifieddate, response, comment }` | Record a visit response | `AddressDetail` |

---

## State & Caching Architecture (`Landing` component)

### Data Structures

| Name | Type | Source | Purpose |
|------|------|--------|---------|
| `addressList` | React state | API (`/list` or `/filter/search/`) | The **working set** shown in the table. May be the full unit list or search results. |
| `fullAddressList` | React state | API (`/list`) only | The **complete unit list**. Never replaced by search results. Used exclusively for Neighborhood area filtering. |
| `unitAreas` | React state | Derived from `fullAddressList` on initial fetch | Sorted unique area/neighborhood names for the Neighborhood `<select>` dropdown and the "Set Neighborhood" datalist. |
| `areaFilter` | React state | User selects from Neighborhood `<select>` | The currently active neighborhood filter string. Empty string = no filter. |
| `filteredAddressList` | Derived (render-time) | `fullAddressList` filtered by `areaFilter`; falls back to `addressList` when no filter | What `AddressList` actually renders. |
| `searchParams` | React state | Search form submit | Last submitted search field values. |
| `activeFilters` | React state | FilterUI buttons | `{ showInactive: bool, filterByStudents: bool }` |

### Update Rules

| Event | `addressList` | `fullAddressList` | `unitAreas` |
|-------|--------------|-------------------|-------------|
| Initial page load (`/list`) | Set | Set | Populated |
| Search / FilterUI button (`doSearch`) | Replaced with results | Not touched | Not touched |
| Bulk area update | Patched in-place | Patched in-place | New area appended if new |
| Unit switch | Cleared | Cleared | Cleared |
| Logout | Cleared | Cleared | Cleared |

### Storage Layers

| Storage | Keys | Scope | Cleared by |
|---------|------|-------|-----------|
| `localStorage` | `addressList`, `searchParams`, `areaFilter`, `activeFilters`, `landingContext` | Browser (survives refresh) | Logout, unit switch |
| `sessionStorage` | `unitAreas_<masjidID>_<unitID>`, `fullList_<masjidID>_<unitID>` | Browser tab | Logout (`sessionStorage.clear()`), unit switch, tab close |
| React state | All of the above + `fullAddressList`, `filteredAddressList` | Component lifetime | Component unmount |

### Why the Split (`addressList` vs `fullAddressList`)

The Neighborhood dropdown lists **all areas for the unit** (from `unitAreas`). When the user picks an area, the filter must search the **complete unit list** — not just the current search results. Without `fullAddressList`, toggling Active/Inactive or running a search would silently shrink the filterable dataset, making some neighborhoods appear empty.

**Rule**: area filter always uses `fullAddressList`. Search and sort results use `addressList`.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Production Deployment

To build and run the app in production:

1. **Build the optimized production bundle:**
   ```bash
   npm run build
   ```
   This creates a `build/` folder with minified, optimized files ready for deployment.

2. **Serve the production build locally (for testing):**
   ```bash
   npm install -g serve
   serve -s build
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the production build.

The app uses environment variables from `.env.production` for production settings, including the API endpoint (`REACT_APP_API_URL`).

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
