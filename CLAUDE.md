# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

**Neeom Modular Dashboard** — internal order-tracking web app for Neeom Modular. Tracks manufacturing/fabrication orders through status stages (BOM → … → Packed → Dispatch → Order Close) with role-based access for admins, managers, and regular users.

Bootstrapped with Create React App. Backed by Firebase (Auth + Firestore). Deployed to Netlify (primary) and Firebase Hosting (configured).

## Tech Stack

- React 17 (Create React App, `react-scripts` 4.0.1)
- React Router DOM v5 (`BrowserRouter`, `Switch`, `Route`)
- React Bootstrap 1.x + Bootstrap 4.5 CSS
- Firebase v8 (compat namespaced API: `firebase/app`, `firebase/auth`, `firebase/firestore`)
- `underscore` for groupBy / countBy
- `xlsx` (SheetJS) for CSV/XLSX export
- Netlify CLI for deploy

Note: Node version requires legacy OpenSSL provider (`NODE_OPTIONS=--openssl-legacy-provider`) — wired into `start` and `deploy` scripts.

## Scripts

```bash
yarn start    # dev server on :3000 (legacy openssl flag set)
yarn build    # CRA production build → ./build
yarn test     # CRA test runner
yarn deploy   # build + netlify deploy --prod
```

Firebase Hosting also configured (`firebase.json` → serves `build/`, SPA rewrite to `index.html`).

## Architecture

Single-page React app, all state local to components, data lives in Firestore.

```
src/
├── index.js              # ReactDOM root + Bootstrap CSS
├── firebase.js           # firebase.initializeApp from REACT_APP_FIREBASE_* env
├── contexts/
│   └── AuthContext.js    # currentUser, isAdmin, isManager, login/logout/etc.
└── components/
    ├── App.js            # Router + AuthProvider + route table
    ├── Header.js         # Navbar (Add/Dashboard/Logout, role-gated)
    ├── Login.js          # email/password sign-in
    ├── PrivateRoute.js   # logged-in gate
    ├── AdminRoute.js     # admin-only gate
    ├── ManagerRoute.js   # manager-or-admin gate
    ├── Add.js            # admin: create new order
    ├── List.js           # admin: full order list, search, XLSX export
    ├── UserList.js       # regular user: read-only order lookup by orderId
    ├── Dashboard.js      # manager/admin: counts by orderType / orderStatus, daily SqFt
    ├── Detail.js         # order detail + advance status, delete (admin)
    └── utils/index.js    # getOrderAge helper
```

### Routes

| Path | Guard | Component |
|------|-------|-----------|
| `/` | AdminRoute | List |
| `/list/:filter` | PrivateRoute | List (filter is `key=value`, e.g. `orderType=...` or `orderStatus=...`) |
| `/dashboard` | ManagerRoute | Dashboard |
| `/add` | AdminRoute | Add |
| `/records` | PrivateRoute | UserList |
| `/detail/:orderId` | PrivateRoute | Detail |
| `/login` | public | Login |

Non-admin logged-in users land on `/records` when hitting admin routes.

## Roles (AuthContext)

Computed from `currentUser.email` on auth state change:

- **Admin** — email in hard-coded list: `vishal@neeommodular.com`, `chirag@neeommodular.com`, `office@neeommodular.com`, `admin@neeommodular.com`
- **Manager** — email matches regex `manager[0-9]+@neeommodular.com`
- **Regular user** — anyone else who signs in

Signup is disabled (`signup` is a no-op stub). Accounts created out-of-band in Firebase console.

## Firestore Collections

- **`orders`** — active orders. Key fields:
  - `orderId` (string, user-facing id, unique on add)
  - `partyId`, `orderType`, `orderArea`, `orderQuantity`, `orderSqFt`
  - `orderDate` (string `dd-mm-yyyy`)
  - `orderStatus` (string label, current stage)
  - `nextOrderStatus` (number index into `statusType[orderType]`)
  - `createdBy` (email)
  - `orderHistory` (array of `{updatedBy, updatedTo, updateDate}`)
- **`orderHistory`** — flat append-only log of every status change, one doc per transition. Shape: `{orderId, orderSqFt, updatedBy, updatedTo, updateDate}`. Used by Dashboard for "Daily Work" SqFt rollups.
- **`orderType`** — list of order types, each doc has `value`.
- **`areas`** — single doc with `areas: string[]`.
- **`statusType`** — single doc keyed by orderType → array of status labels (drives the Detail.js status checklist progression).
- **`ordersClosed`** (referenced in commented code) — archive target for closed orders. Currently inert.

### Data flow notes

- All reads use `onSnapshot` (real-time). No pagination.
- Dates everywhere are strings `d-m-yyyy` (no zero-pad in most places — `Add.js` zero-pads, others don't). Comparing dates means comparing these strings.
- Status advancement (Detail.js `handleSave`): looks up next label via `statusType[orderType][nextOrderStatus]`, increments `nextOrderStatus`, appends to `orderHistory`, also writes a separate doc to `orderHistory` collection.
- Order age (`utils/getOrderAge`): days since orderDate, but freezes once a "Packed" entry exists in history (returns negative-then-+1 of days from packed date — see file before changing).

## Environment

`.env.local` provides Firebase config via `REACT_APP_FIREBASE_*` vars. Note typo in keys: most are `REACT_APP_FIREABASE_*` (sic — auth domain, db url, project id, storage bucket, messaging sender id, app id) except `REACT_APP_FIREBASE_API_KEY`. Don't "fix" the typo without updating `.env.local` in the same change — `firebase.js` reads the misspelled names.

`measurementId` is hard-coded in `firebase.js`.

## Conventions / Gotchas

- React 17, function components + hooks. No TypeScript.
- `useEffect` with empty deps for initial load is the pattern; eslint-disable comments suppress exhaustive-deps warnings — keep consistent.
- Lots of `console.log` left in for debugging — match existing style; don't crusade-remove unless asked.
- Bootstrap 4 + react-bootstrap 1 — stick with these (don't introduce v5 components).
- `react-router-dom` is v5 — `Switch`, `useHistory`, `props.match.params`. Don't pull in v6 idioms.
- XLSX export in `List.js` uses SheetJS `json_to_sheet` + `writeFile`.
- Admin email list lives in `AuthContext.js`. New admins added there.

## Deployment

- **Netlify**: `yarn deploy` (build + `netlify deploy --prod`). `.netlify/` holds site link.
- **Firebase Hosting**: `firebase.json` configured (`build/` → SPA rewrite). `.firebaserc` present. Deploy with `firebase deploy --only hosting` if used.

## Firestore cost / read budget

Read cost is the dominant Firestore expense. Rules to keep it down:

- **Always filter server-side, not in render.** Don't fetch closed orders just to skip them in the table.
- **Detach `onSnapshot` on unmount.** `useEffect` must capture the unsubscribe and return it. Stacked listeners are silent multipliers.
- **Don't use `onSnapshot` if the screen doesn't need realtime.** `.get()` charges once.
- **Cache config collections** (`orderType`, `areas`, `statusType`) via [utils/configCache.js](src/components/utils/configCache.js). They change rarely; refetching per mount is waste.
- **Daily-work / dashboard rollups must be date-bounded server-side** (`where('updateDate','==',date)`). Never pull entire `orderHistory`.

### Required composite indexes ([firestore.indexes.json](firestore.indexes.json))

Deploy with `firebase deploy --only firestore:indexes`.

| Collection | Fields | Used by |
|------------|--------|---------|
| `orders` | `orderStatus ASC, orderId DESC` | `List.getOrders`, `UserList.getOrders` |
| `orders` | `orderType ASC, orderStatus ASC, orderId DESC` | `List.getOrdersByOrderType` (when filtering by orderType) |

`orderHistory.updateDate` (single-field) used by `Dashboard.getOrderHistoryForDate` — Firestore auto-builds single-field indexes, do not declare in `firestore.indexes.json` or deploy fails with HTTP 400 "configure using single field index controls".

If the user navigates to `/list/orderStatus=...` the query filters on `orderStatus ==` (no `!=`) so the existing single-field auto index suffices.

## Open optimization work (Tier 3 — needs approval / migration)

Not done yet, deferred until explicitly requested:

1. **Archive closed orders** to `ordersClosed`. Trigger on `Order Close` transition in `Detail.handleSave`. Migrates existing closed docs out of `orders`. Keeps active collection bounded.
2. **Stop double-writing `orderHistory` collection.** Embedded `orders.orderHistory[]` is already the source of truth used by List/Detail. After (1), Dashboard daily-work can be derived from active `orders` + archived `ordersClosed`. Eliminates ~50% of writes on every status change.
3. **Add `updateDateISO` (`yyyy-mm-dd`)** to history entries for proper range queries (week/month rollups). Backfill required.
4. **Date-format inconsistency**: `Add.js` writes zero-padded `dd-mm-yyyy`, `Detail.js` writes unpadded `d-m-yyyy`. Dashboard equality query matches one form only. Pick one and migrate.

## What NOT to do

- Don't migrate Firebase v8 (compat) → modular v9 SDK without explicit ask — touches every component.
- Don't replace `react-scripts` 4 / Bootstrap 4 / RR v5 piecemeal — full upgrade or none.
- Don't enable signup — `AuthContext.signup` is intentionally stubbed; accounts are provisioned manually.
- Don't remove the `NODE_OPTIONS=--openssl-legacy-provider` flag from scripts — current Node versions need it for webpack 4.
