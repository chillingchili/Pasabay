# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Pasabay (Mobile App) — `artifacts/pasabay`
Expo/React Native campus rideshare app for USC (University of San Cebu) students.
- **Brand**: Teal/emerald green `#0D9E75`, accent amber `#FBBF24`
- **Auth**: USC `@usc.edu.ph` email only, AsyncStorage (no backend)
- **Roles**: Passenger (default) + Driver (requires license + vehicle verification)
- **Screens**: Splash, Welcome, Sign Up, Login, School ID Verify, Driver License Verify, Vehicle Details, Passenger Home (map), Driver Home (map + ride requests), Matching animation, Match Found, History, Profile
- **Context**: `context/AppContext.tsx` — user auth, ride history, role switching
- **Colors**: `constants/colors.ts` + `hooks/useColors.ts`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
