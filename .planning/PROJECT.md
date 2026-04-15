# Pasabay

## What This Is

A mobile rideshare app for USC (University of San Cebu) students to share rides to and from campus. Students can be passengers (request rides) or drivers (offer rides), with a real-time matching system that connects riders with nearby drivers. The app verifies all users have valid USC email addresses and requires drivers to verify their identity and vehicle before accepting rides.

## Core Value

USC students can get safe, affordable rides to campus from verified students — eliminating the need to rely on strangers or expensive transport options.

## Requirements

### Validated

(None yet — this is a new project with existing scaffolded codebase)

### Active

- [ ] USC email verification (`@usc.edu.ph` only)
- [ ] User registration with role selection (Passenger/Driver)
- [ ] Driver verification flow (license + vehicle details)
- [ ] Passenger home screen with pickup/dropoff location selection
- [ ] Driver home screen showing ride requests
- [ ] Real-time matching system (passenger ↔ driver)
- [ ] Matching animation/screen
- [ ] Match found confirmation with driver/passenger details
- [ ] Trip history for both passengers and drivers
- [ ] Driver earnings display
- [ ] Trip receipts with fare details
- [ ] Driver/passenger ratings

### Out of Scope

- Payment processing — Cash transactions only for v1
- Multi-stop trips — Single pickup/dropoff only
- Scheduled rides — On-demand matching only
- Non-USC users — USC email verification required
- Chat/messaging — In-app communication not in v1

## Context

**Technical Environment:**
- pnpm workspace monorepo with TypeScript
- Expo/React Native mobile app (artifacts/pasabay/)
- Express 5 API server (artifacts/api-server/)
- PostgreSQL + Drizzle ORM for database
- OpenAPI spec-driven development with Orval codegen

**Existing Scaffold:**
- Database schema placeholder exists (`lib/db/src/schema/index.ts`)
- Express server with basic health endpoint
- Expo app with screens scaffolded (splash, welcome, signup, login, verify flows, passenger/driver home, matching, history, profile)
- React Query API client structure
- Zod validation schemas

**Replit Sync:**
- App is being developed simultaneously on Replit
- Changes may be pulled from repo that weren't made locally
- OpenAPI spec is source of truth for API contracts
- Coordinate feature ownership to avoid conflicts

## Constraints

- **Tech Stack**: Expo + React Native (mobile-first), Express backend — No web-only option
- **Email Domain**: USC `@usc.edu.ph` only — Required by school policy
- **Timeline**: Hackathon deadline — Core features must ship
- **Development Model**: Dual env (Replit + local) — Sync conflicts possible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo over React Native CLI | Faster development, easier config | — Pending |
| Cash-only for v1 | Avoid payment complexity | — Pending |
| Real-time matching | Core differentiator | — Pending |
| Pull from Replit | Keep environments in sync | — Pending |
| OpenAPI spec as source of truth | API contract between dev environments | — Pending |

---
*Last updated: 2026-04-15 after initialization*
