# Phase 1: Project Setup - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure existing scaffold with Socket.IO, Expo prebuild, and Zustand state management. This phase sets up the foundation for real-time communication and client-side state that future phases will build on.

**NOT in this phase:**
- Google Maps / location features (deferred — no Apple Developer account)
- Authentication (Phase 2)
- Database schema (Phase 2)

</domain>

<decisions>
## Implementation Decisions

### Socket.IO Setup
- Install `socket.io` on api-server (Express integration)
- Install `socket.io-client` on pasabay (mobile client)
- Mount Socket.IO on same port as Express server (shared auth, simpler deployment)
- Use EXPO_PUBLIC_API_URL for WebSocket connection URL (same as REST API)

### Expo Prebuild
- Install `expo-dev-client` in pasabay
- Run `npx expo prebuild` to generate native android directory
- Basic prebuild only — no custom icons, splash, or bundle ID changes yet

### State Management
- Install `zustand` in pasabay
- Set up basic store structure for client state
- Existing AppContext.tsx can coexist — Zustand for new state needs

### Environment Variables
- Set up EXPO_PUBLIC_API_URL for API base URL
- Socket.IO connects to same URL (no separate WS_URL)

### Out of Scope (Phase 1)
- Google Maps / react-native-maps — user declined (no Apple Developer account)
- Firebase Auth — deferred to Phase 2
- Database schema — deferred to Phase 2

### OpenCode's Discretion
- Exact Socket.IO event naming conventions
- Zustand store structure and slice organization
- Prebuild command flags and configuration
- Package versions (use latest compatible)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- AppContext.tsx: Already exists in artifacts/pasabay/context/
- AsyncStorage: Already installed (@react-native-async-storage/async-storage@2.2.0)
- expo-location: Already installed (~19.0.8)
- react-native-screens, react-native-gesture-handler: Already installed

### Integration Points
- api-server: Add Socket.IO to existing Express app in src/index.ts or src/app.ts
- pasabay: Add Zustand store in new store/ directory or alongside context/
- app.json: Add expo-dev-client to plugins

### Workspace Structure
- pnpm monorepo — new packages need own package.json
- Use workspace:* protocol for internal packages

</code_context>

<specifics>
## Specific Ideas

- "Keep it minimal for Phase 1 — just the foundations"
- "Socket.IO attached to Express for simpler deployment"
- "Zustand for new state, AppContext can coexist"

</specifics>

<deferred>
## Deferred Ideas

- Google Maps / react-native-maps — Phase 5 (Passenger Home) or later when Apple Developer account available
- Firebase Auth — Phase 2 (Authentication)
- Database schema (users table) — Phase 2 (Authentication)
- Background location permissions — Phase 5+ when driver features needed

</deferred>

---

*Phase: 01-project-setup*
*Context gathered: 2026-04-15*
