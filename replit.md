# Pasabay — Campus Rideshare App

## Project Overview

Full-stack campus rideshare app for USC (University of San Cebu, Philippines) students.
Passengers find drivers on the same route with verified identity and LTFRB-compliant cost-sharing fares.
USC-only `@usc.edu.ph` emails enforced. Brand: teal/emerald `#0D9E75`.

## Architecture

pnpm workspace monorepo (TypeScript).

### Packages
- `artifacts/pasabay` — Expo / React Native mobile app
- `artifacts/api-server` — Express 5 + Socket.io backend (port 8080)
- `lib/db` — Drizzle ORM schema + PostgreSQL pool (PostGIS enabled)

### Key Tech
- **Node.js**: 24 · **pnpm**: 10.x (no `packageManager` field — uses system pnpm)
- **Database**: PostgreSQL 16 + PostGIS 3.5 · **ORM**: Drizzle (`drizzle-orm@^0.45`)
- **API**: Express 5 · **WebSockets**: Socket.io 4.8 · **Validation**: Zod (`zod/v4` via `zod@^3.25`)
- **Auth**: JWT (HMAC-SHA256, built-in crypto) + refresh tokens stored in DB
- **Build**: esbuild with `@workspace/db` alias pointing to `lib/db/src/index.ts`
- **Routing**: OSRM (`router.project-osrm.org`) · **Fare**: LTFRB fuel-cost-sharing formula
- **Payments**: Xendit (Phase 2, not yet integrated)

## Workflows

| Workflow | Command | Port |
|---|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | 8080 |
| `artifacts/pasabay: expo` | (Expo start) | 24434 → :80 |
| `artifacts/mockup-sandbox: Component Preview Server` | (Vite) | 8081 |

## Database Schema (PostgreSQL, auto-migrated on startup)

Tables: `users`, `vehicles`, `refresh_tokens`, `active_routes`, `rides`, `ride_passengers`

Migrations are run automatically by `artifacts/api-server/src/lib/migrate.ts` on every server startup using raw SQL (`IF NOT EXISTS`).

## API Routes

All routes under `/api`:
- `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/google`
- `POST /api/auth/refresh` → returns `{ accessToken, refreshToken, user }`
- `POST /api/auth/logout` · `GET /api/auth/me`
- `GET /api/users/profile` · `POST /api/users/school-id` · `POST /api/users/driver`
- `POST /api/users/switch-role`
- `GET /api/rides/history` · `GET /api/rides/match` · `POST /api/rides/request`
- `POST /api/rides/rate`
- `GET /api/healthz`

## Socket.io Events

Driver: `driver:online`, `driver:location`, `driver:offline`
Matching: `match:accept`, `match:decline`
Ride: `ride:complete`, `ride:cancel`
Server emits: `match:confirmed`, `match:declined`, `ride:completed`, `ride:canceled`

## Expo App

- **Auth**: JWT in AsyncStorage via `lib/api.ts` (auto-refresh on 401)
- **Context**: `context/AppContext.tsx` — calls real API endpoints
- **API utility**: `lib/api.ts` — constructs URL from `EXPO_PUBLIC_DOMAIN:8080`
- **Screens**: Welcome, Login, Signup (with name field), School ID Verify, Driver License Verify, Vehicle Details, Passenger Home, Driver Home, Matching, Match Found, History, Profile

## Implementation Status

### ✅ Phase 1 — Backend + DB
- DB schema (6 tables) with auto-migration on startup
- Full auth API (signup/login/Google/refresh/logout)
- Users API (profile/school-id/driver/switch-role)
- Rides API (history/request/match/rate)
- Socket.io handlers (driver presence, matching, ride lifecycle)
- OSRM routing integration + perpendicular distance matching algorithm
- LTFRB fare formula (fuel cost-sharing + PHP8 matching fee)

### ✅ Phase 2 — Mobile → API Integration
- `lib/api.ts` — JWT-aware fetch wrapper with auto-refresh
- `AppContext.tsx` — all methods call real API (no more mock data)
- Signup screen with name field
- Error messages from API shown in alerts

### ⏳ Phase 3 — Real-time Socket.io (Pending)
- Wire socket.io-client to authenticated socket connection
- Real-time driver location updates on passenger home
- Live matching flow (request → match found)

### ⏳ Phase 4 — Maps (Pending)
- Replace SVG/animated map with `react-native-maps`
- Show OSRM route polyline on driver home
- Real-time driver marker on passenger home

## Key Files

- `lib/db/src/schema/` — Drizzle table definitions
- `artifacts/api-server/src/lib/osrm.ts` — OSRM routing + 300m perpendicular buffer matching
- `artifacts/api-server/src/lib/fare.ts` — LTFRB fare calculation
- `artifacts/api-server/src/lib/jwt.ts` — HMAC-SHA256 JWT (no external deps)
- `artifacts/api-server/src/lib/password.ts` — PBKDF2 password hashing
- `artifacts/api-server/src/sockets/index.ts` — Socket.io event handlers
- `artifacts/pasabay/lib/api.ts` — Mobile API client
- `artifacts/pasabay/context/AppContext.tsx` — App-wide state + auth

## Notes

- `packageManager` field removed from root `package.json` to stop pnpm SIGABRT boot loop
- `ignore-workspace-root-check=true` added to `.npmrc` to allow workspace-root package installs
- esbuild `alias` in `build.mjs` resolves `@workspace/db` → `lib/db/src/index.ts` (no symlink needed)
- `zod/v4` works with `zod@3.25.76` (subpath export added in that version)
- Google OAuth: `EXPO_PUBLIC_GOOGLE_CLIENT_ID` env var, redirect `pasabay://auth/callback`
