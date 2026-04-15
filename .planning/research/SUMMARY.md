# Project Research Summary

**Project:** Pasabay - USC Campus Rideshare App
**Domain:** Peer-to-Peer Mobile Rideshare
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

Pasabay is a mobile rideshare app connecting USC students for campus transportation. The app requires USC email verification (`@usc.edu.ph`), supports passenger and driver roles, and features real-time matching to connect riders with nearby verified drivers.

**Recommended approach:** Build with Expo/React Native for mobile, Express 5 + Socket.IO for real-time API, PostgreSQL + Drizzle for data, and Redis Geo for driver matching. Firebase Auth handles email verification. Key pitfalls center on safety verification (fake drivers, GPS spoofing) and matching fairness (ignoring wait time). Launch with 10 core features, defer chat/payments/scheduled rides to v2.

---

## Key Findings

### Recommended Stack

**Core technologies:**
- **Expo SDK 55** — Industry standard for React Native; prebuild for native modules
- **react-native-maps + expo-location** — Map rendering and GPS tracking (NOT expo-maps, which is alpha-only)
- **Socket.IO** — Real-time driver-passenger matching with rooms and auto-reconnection
- **Firebase Auth** — Built-in email verification, session persistence
- **Redis** — Geo-indexing for fast "find nearest driver" queries
- **Drizzle ORM + PostgreSQL** — Already in codebase, type-safe

**Why this stack:**
- Maps: react-native-maps is battle-tested vs. expo-maps (alpha, Android-only)
- Real-time: Socket.IO handles rooms/reconnection essential for driver matching
- Auth: Firebase provides verification emails out-of-the-box vs. building custom SMTP

### Expected Features

**Must have (table stakes):**
- USC email verification — Required by school policy, gates all access
- User registration + role selection — Passenger vs driver flow
- Driver verification (license + vehicle) — Safety baseline before accepting rides
- Passenger home with pickup/dropoff — Map-based location selection
- Driver home showing requests — How drivers receive ride requests
- Real-time matching — Core algorithm connecting users
- Matching animation + confirmation — User feedback during match
- Trip history + ratings — Trust system

**Should have (competitive):**
- Live driver tracking on map — Real-time ETA
- Driver earnings dashboard
- Trip receipts

**Defer (v2+):**
- In-app chat/messaging — Moderation liability
- In-app payment — Regulatory complexity, keep cash-only
- Scheduled rides — Queue complexity
- Multi-stop trips — Route optimization

### Architecture Approach

**Major components:**
1. **Mobile Client** — Expo/React Native; location capture, map display, real-time UI
2. **API Server** — Express 5 + Socket.IO; auth, matching service, REST endpoints
3. **Matching Service** — Redis Geo (GEOSEARCH) for finding nearest drivers
4. **Location Service** — Redis for real-time driver positions; PostgreSQL for history
5. **WebSocket Layer** — Rooms for driver-passenger pairing; location broadcast

**Key patterns:**
- **WebSocket Gateway:** Connection registry maps user IDs to active sockets
- **Redis Geo Index:** `GEOADD` driver locations, `GEOSEARCH` for nearby drivers
- **Trip State Machine:** REQUESTED → MATCHED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED

### Critical Pitfalls

1. **Fake Driver / Identity Impersonation** — Implement in-app photo verification before going online; require license plate matching
2. **GPS Location Manipulation** — Use multi-signal verification (GPS + WiFi + cell); implement "challenge" system for random location confirmation
3. **Matching Ignores Wait Time** — Prioritize nearest driver; implement 2-minute auto-match queue
4. **Safety Incidents Without Emergency Response** — Add in-app emergency button sharing ride details + GPS with campus security
5. **No Driver Background Check** — Require consent for background check; check sex offender registries

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: User Registration & Verification
**Rationale:** All other features require verified users; drivers cannot go online without verification
**Delivers:** USC email verification, user registration with role selection, driver verification flow (license + vehicle)
**Addresses:** PITFALLS.md (Fake Driver, No Background Check), FEATURES.md (email verification, driver verification)
**Avoids:** Pitfall #1 (identity impersonation), Pitfall #6 (no background check)

### Phase 2: Home Screens & Matching UI
**Rationale:** Core interaction; passenger needs to request, driver needs to receive
**Delivers:** Passenger home (pickup/dropoff), driver home (ride requests), matching animation, match confirmation
**Uses:** react-native-maps, expo-location, Socket.IO client
**Implements:** Map display, location selection, request/accept flow

### Phase 3: Real-Time Matching Engine
**Rationale:** Backend must exist before real-time features work; depends on Phase 1+2
**Delivers:** Real-time matching algorithm, live driver location on map, trip state machine
**Uses:** Socket.IO server, Redis Geo index, express server
**Implements:** Matching Service, Location Service, WebSocket layer
**Avoids:** Pitfall #3 (GPS spoofing), Pitfall #4 (matching ignores wait time)

### Phase 4: Trip Completion & Trust
**Rationale:** Users need to complete rides and build trust
**Delivers:** Trip history, ratings, receipts, driver earnings dashboard
**Uses:** Drizzle ORM, PostgreSQL

### Phase Ordering Rationale

- **Phase 1 first** — No user can access app without verification; safety-critical
- **Phase 2 before 3** — UI exists before backend completes; easier to test with mocked data
- **Phase 3 before 4** — Matching must work before completion flow
- **Pitfalls inform sequencing:** Photo verification in Phase 1 prevents identity fraud; Redis Geo in Phase 3 enables fair matching

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Verification):** Background check integration — third-party services like Sumsub need API research
- **Phase 3 (Matching):** Redis Geo performance at scale — may need PostGIS fallback for >1K concurrent

Phases with standard patterns (skip research-phase):
- **Phase 2 (Home Screens):** react-native-maps + expo-location well-documented
- **Phase 4 (Completion):** Drizzle CRUD patterns established in existing codebase

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Context7 verified, Expo SDK 55 docs, multiple production ride-app examples |
| Features | HIGH | Industry sources (Volta, Shuffl, Uber) confirm feature expectations |
| Architecture | HIGH | Redis Geo + WebSocket patterns verified across Uber-clone tutorials |
| Pitfalls | MEDIUM | Safety research from incident reports; some mitigations speculative |

**Overall confidence:** HIGH

### Gaps to Address

- **Background check implementation:** How to integrate third-party service vs. manual verification for Philippine context
- **Payment integration:** V1 is cash-only; need to research payment API for v2 (consider GCash or traditional payment gateway)
- **Push notifications:** Need to compare expo-notifications vs. Firebase Cloud Messaging for production

---

## Sources

### Primary (HIGH confidence)
- Context7: /websites/expo_dev_versions_v55_0_0 — Location permissions, watchPositionAsync
- Websearch: react-native-maps setup, Socket.IO in React Native, ride-share app architecture
- Expo SDK 55 documentation — expo-location, react-native-maps

### Secondary (MEDIUM confidence)
- GitHub: Ryde (uber-clone), WeTaxi — Real-world implementation patterns
- DEV Community: WebSocket handling in React Native
- White Label Taxi App: Enterprise architecture comparison

### Tertiary (LOW confidence)
- Pitfall mitigation strategies — Based on incident reports, need implementation validation

---
*Research completed: 2026-04-15*
*Ready for roadmap: yes*