# Architecture Research

**Domain:** Campus Rideshare App (Pasabay)
**Researched:** 2026-04-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MOBILE CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Passenger  │  │    Driver    │  │  Shared UI   │  │   State      │   │
│  │    Screens   │  │    Screens   │  │  Components  │  │  Management  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  └──────┬───────┘   │
│         │                 │                                      │          │
├─────────┴─────────────────┴──────────────────────────────────────┴──────────┤
│                       API CLIENT LAYER                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   REST API   │  │  WebSocket   │  │   Expo       │  │  React      │   │
│  │   (fetch)    │  │  (real-time) │  │  SecureStore │  │  Query      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │        SECURE GATEWAY          │
                    │    Rate limiting, Auth, TLS     │
                    └───────────────┬───────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                          SERVICES LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │  Auth Service  │  │  Matching      │  │  Trip Service  │              │
│  │  (verification)│  │  Service       │  │  (lifecycle)   │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │ Location       │  │ Notification   │  │ User/Profile   │              │
│  │ Service        │  │ Service        │  │ Service        │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
├─────────────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │  PostgreSQL    │  │    Redis       │  │   External     │              │
│  │  (durable)     │  │  (geo index)   │  │   APIs         │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Mobile Client | UI, location capture, real-time display | Expo/React Native |
| API Client | HTTP requests, WebSocket management | Custom fetch + ws |
| Auth Service | Email verification, session tokens | Express + JWT |
| Matching Service | Driver-passenger pairing, geo queries | Node.js + Redis Geo |
| Location Service | GPS ingestion, driver tracking | Node.js + Redis |
| Trip Service | Trip state machine, completion | Node.js + PostgreSQL |
| Notification Service | Push notifications | Expo Notifications |
| PostgreSQL | User data, trips, history | Drizzle ORM |
| Redis | Real-time driver locations | Redis Geo commands |

## Recommended Project Structure

```
pasabay/
├── artifacts/
│   ├── api-server/                    # Express API server
│   │   ├── src/
│   │   │   ├── routes/                # Route handlers
│   │   │   │   ├── auth.ts            # Email verification, login
│   │   │   │   ├── users.ts           # Profile, verification status
│   │   │   │   ├── trips.ts           # Trip CRUD, history
│   │   │   │   ├── matching.ts        # Match requests
│   │   │   │   └── location.ts         # GPS updates
│   │   │   ├── services/              # Business logic
│   │   │   │   ├── matching.service.ts
│   │   │   │   ├── location.service.ts
│   │   │   │   ├── trip.service.ts
│   │   │   │   └── verification.service.ts
│   │   │   ├── websocket/             # Real-time handlers
│   │   │   │   ├── connection.manager.ts
│   │   │   │   ├── driver.handler.ts
│   │   │   │   └── passenger.handler.ts
│   │   │   ├── lib/
│   │   │   │   ├── db.ts              # Drizzle client
│   │   │   │   └── redis.ts           # Redis client
│   │   │   └── index.ts
│   │   └── drizzle.config.ts
│   │
│   └── pasabay/                       # Expo mobile app (future)
│       └── src/
│           ├── app/                    # Expo Router screens
│           ├── components/            # Reusable UI
│           ├── hooks/                  # Custom hooks
│           ├── services/               # API client layer
│           ├── stores/                 # Zustand stores
│           └── lib/
│
├── lib/
│   ├── db/                            # Database layer
│   │   ├── src/
│   │   │   ├── schema/                # Drizzle schema
│   │   │   │   ├── users.ts
│   │   │   │   ├── trips.ts
│   │   │   │   ├── drivers.ts
│   │   │   │   └── index.ts
│   │   │   └── migrations/
│   │   └── drizzle.config.ts
│   │
│   ├── api-client-react/               # Typed API client
│   │   ├── src/
│   │   │   ├── api.ts                 # Generated from OpenAPI
│   │   │   ├── websocket.ts            # WebSocket client
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api-zod/                       # Shared Zod schemas
│       └── src/
│           └── schemas.ts
│
└── scripts/                            # Dev utilities
```

### Structure Rationale

- **`services/` in api-server:** Isolates business logic from HTTP concerns, making matching algorithm testable independently
- **`websocket/` directory:** Separates real-time connection handling from REST routes, allowing independent scaling
- **`lib/db` as shared package:** Schema definitions shared between server and future mobile app
- **`api-client-react` package:** Generated types + custom fetch ensures type safety across all API calls

## Architectural Patterns

### Pattern 1: WebSocket Gateway with Connection Registry

**What:** Persistent WebSocket connections maintained by a dedicated layer that maps user IDs to active connections.

**When to use:** Real-time features like live driver location on map, matching animations, trip status updates.

**Trade-offs:**
- Pros: Sub-second latency, bidirectional communication, natural fit for location streaming
- Cons: Stateful connections complicate horizontal scaling; requires connection registry (Redis)

**Example:**
```typescript
// artifacts/api-server/src/websocket/connection.manager.ts
import { WebSocket } from 'ws';
import { redis } from '../lib/redis';

interface DriverConnection {
  ws: WebSocket;
  driverId: string;
  lastPing: number;
}

const connections = new Map<string, DriverConnection>();

export async function registerDriver(driverId: string, ws: WebSocket): Promise<void> {
  connections.set(driverId, { ws, driverId, lastPing: Date.now() });
  await redis.hset(`driver:session:${driverId}`, { connectedAt: Date.now() });
}

export async function broadcastToPassenger(
  passengerId: string,
  event: string,
  data: unknown
): Promise<void> {
  const connection = connections.get(`passenger:${passengerId}`);
  if (connection?.ws.readyState === WebSocket.OPEN) {
    connection.ws.send(JSON.stringify({ event, data }));
  }
}
```

### Pattern 2: Redis Geo Index for Driver Availability

**What:** Real-time driver positions stored in Redis using `GEOADD`, queried with `GEOSEARCH` to find nearest available drivers.

**When to use:** Finding nearby drivers for matching; scales to thousands of concurrent drivers.

**Trade-offs:**
- Pros: O(N + log M) query time, built-in distance calculations, atomic operations
- Cons: Additional infrastructure; data TTL management required

**Example:**
```typescript
// Driver goes online
await redis.geoadd('drivers:available', longitude, latitude, driverId);
await redis.hset(`driver:${driverId}`, {
  status: 'available',
  rating: '4.8',
  vehicleType: 'sedan'
});

// Find nearest drivers within 5km
const nearby = await redis.geosearch(
  'drivers:available',
  { longitude: pickupLng, latitude: pickupLat },
  { radius: 5, unit: 'km' },
  { WITHDIST: true, SORT: 'ASC', COUNT: 10 }
);

// On driver accepting trip - remove from available pool
await redis.zrem('drivers:available', driverId);
await redis.hset(`driver:${driverId}`, 'status', 'on_trip');
```

### Pattern 3: Trip State Machine

**What:** Trips transition through defined states: REQUESTED → MATCHED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED (or CANCELLED).

**When to use:** Any multi-step workflow where state determines available actions.

**Trade-offs:**
- Pros: Clear state transitions prevent invalid states; event sourcing possible
- Cons: Requires careful handling of state transition failures

**Example:**
```typescript
// Trip state transitions
const TripStatus = {
  REQUESTED: 'requested',
  MATCHED: 'matched',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

type Trip = {
  id: string;
  passengerId: string;
  driverId: string | null;
  status: typeof TripStatus[keyof typeof TripStatus];
  // ...
};

function transition(trip: Trip, newStatus: string): Trip {
  const validTransitions: Record<string, string[]> = {
    requested: ['matched', 'cancelled'],
    matched: ['driver_arriving', 'cancelled'],
    driver_arriving: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [],
    cancelled: []
  };
  
  if (!validTransitions[trip.status]?.includes(newStatus)) {
    throw new Error(`Invalid transition: ${trip.status} -> ${newStatus}`);
  }
  
  return { ...trip, status: newStatus as Trip['status'] };
}
```

### Pattern 4: Location Update Throttling

**What:** Adaptive polling where location update frequency depends on driver state (idle vs. active trip).

**When to use:** Battery-conscious GPS tracking in mobile apps.

**Trade-offs:**
- Pros: Reduces battery drain, server load, and bandwidth when not needed
- Cons: Slightly delayed location updates during state transitions

**Example:**
```typescript
// Mobile app location strategy
const LOCATION_CONFIG = {
  IDLE_INTERVAL_MS: 30_000,    // 30 seconds when waiting for rides
  ACTIVE_INTERVAL_MS: 4_000,    // 4 seconds during trip
  ACCURACY_METERS: 50
};

function getLocationUpdateInterval(driverStatus: string): number {
  switch (driverStatus) {
    case 'on_trip':
    case 'driver_arriving':
      return LOCATION_CONFIG.ACTIVE_INTERVAL_MS;
    default:
      return LOCATION_CONFIG.IDLE_INTERVAL_MS;
  }
}
```

## Data Flow

### Request Flow (REST)

```
[Mobile App] 
    ↓ POST /api/trips/request
[Express Router] → [Trip Service] → [Matching Service]
    ↓                    ↓               ↓
[Response]         [Redis Geo]     [PostgreSQL]
                   (find drivers)  (persist trip)
```

### WebSocket Flow (Real-time)

```
[Driver App]                    [API Server]                  [Passenger App]
    │                                  │                               │
    │──── GPS update ──────────────────>                               │
    │       (location: {lat, lng})     │                               │
    │                                  │                               │
    │                      [Update Redis Geo Index]                     │
    │                                  │                               │
    │                                  │<───── Match request ──────────│
    │                                  │                               │
    │<──────── Offer ride ─────────────│                               │
    │    { tripId, pickup, fare }       │                               │
    │                                  │                               │
    │──── Accept/Decline ─────────────>│                               │
    │                                  │<───── Match status ──────────│
    │                                  │      (matched/declined)       │
```

### State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ authStore   │  │ tripStore   │  │ driverStore │         │
│  │ - user      │  │ - current   │  │ - isOnline  │         │
│  │ - token     │  │ - status    │  │ - location  │         │
│  │ - role      │  │ - driver    │  │ - accepting │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                          ↓                                    │
│              ┌──────────────────────┐                       │
│              │   Persist (SecureStore) │                     │
│              │   Sync (React Query)   │                     │
│              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Ride Request Flow:**
   - Passenger selects pickup/dropoff → App sends POST /api/trips/request
   - Server finds nearest drivers via Redis GEOSEARCH
   - Server pushes ride offers to top N drivers via WebSocket
   - First driver to accept gets the trip → Both apps notified

2. **Live Location Flow:**
   - Driver app gets GPS coordinates every 4-30 seconds
   - Sends location to WebSocket endpoint
   - Server updates Redis geo index
   - Server broadcasts to associated passenger app
   - Passenger app updates map marker position

3. **Email Verification Flow:**
   - User submits USC email → Server generates 6-digit code
   - Code stored in Redis with 15-minute TTL (key: `verify:${code}`)
   - Email sent via SMTP (college email server)
   - User submits code → Server validates against Redis
   - On success: mark email verified in PostgreSQL, clear Redis key

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|-------------------------|
| 0-100 concurrent users | Monolith sufficient; PostGIS for geo queries; polling acceptable |
| 100-1K concurrent users | Add Redis for geo index; introduce WebSocket server; Redis pub/sub |
| 1K-10K concurrent users | Shard Redis by region; horizontal WebSocket scaling; connection registry |
| 10K+ concurrent users | Full microservices; H3 hexagonal indexing; Kafka for event streaming |

### Scaling Priorities

1. **First bottleneck: Geo queries**
   - PostGIS `ST_DWithin` is too slow at >100 concurrent drivers
   - Fix: Add Redis Geo index as read-through cache

2. **Second bottleneck: WebSocket connections**
   - Single Node.js process handles ~10K connections
   - Fix: Horizontal scaling with Redis pub/sub for cross-server messaging

## Anti-Patterns

### Anti-Pattern 1: Polling for Location Updates

**What people do:** Client polls `/api/driver/location/:id` every 2-3 seconds.

**Why it's wrong:** Wastes bandwidth, battery, and server resources; latency spikes cause janky map animations.

**Do this instead:** Use WebSocket connection; server pushes location updates when driver moves >10 meters.

### Anti-Pattern 2: Storing Location in PostgreSQL

**What people do:** INSERT location row for every GPS ping; query for "latest" with ORDER BY timestamp.

**Why it's wrong:** Write amplification; bloat from millions of rows; slow reads.

**Do this instead:** Redis for real-time location (GEOADD/GEOPOS); periodic snapshots to PostgreSQL for history.

### Anti-Pattern 3: Blocking Match on Database

**What people do:** BEGIN transaction → find driver → update trip → COMMIT (single transaction).

**Why it's wrong:** Long-held locks; race conditions between concurrent requests; no timeout on finding drivers.

**Do this instead:** Redis atomic operations (WATCH/MULTI or Lua script); async match with timeout queue.

### Anti-Pattern 4: Email Verification in Main Flow

**What people do:** Synchronous SMTP send + wait for delivery confirmation.

**Why it's wrong:** Email delivery is eventually consistent; blocks HTTP request; times out users.

**Do this instead:** Async email send with Redis-stored verification code; user submits code in separate request.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Maps / Mapbox | REST API for routing, geocoding | Use Directions API for ETA calculation |
| USC Email (SMTP) | Nodemailer with SMTP | `@usc.edu.ph` domain only; may need SPF/DKIM |
| Expo Push Notifications | Expo SDK | Token-based; handles iOS APNs / FCM |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile App ↔ API Server | REST (HTTP) + WebSocket | REST for commands; WS for real-time data |
| Matching Service ↔ Redis | Redis client | Geo commands for driver positions |
| Trip Service ↔ PostgreSQL | Drizzle ORM | CRUD for user/trip data |
| API Server ↔ Notification Service | Direct function call | Can extract to message queue later |

### Build Order Implications

**Phase 1 (MVP):** `api-server` must exist before mobile app can connect
- Implement auth + verification first (mobile login depends on it)
- Implement REST endpoints before WebSocket (simpler debugging)

**Phase 2 (Real-time):** WebSocket layer depends on REST being stable
- Connection management needs user auth (reuse JWT verification)
- Location storage needs Redis provisioned

**Phase 3 (Mobile):** Mobile app depends on complete API contract
- Use OpenAPI spec to generate types first
- Mock responses for offline UI development

## Sources

- [Designing Uber: Geospatial Indexing, WebSockets, and Distributed Locks - DEV Community](https://dev.to/ganesh_parella/designing-uber-geospatial-indexing-websockets-and-distributed-locks-4mhb)
- [How to Build a Ride-Sharing Matching System with Redis - OneUptime](https://oneuptime.com/blog/post/2026-03-31-redis-ride-sharing-matching-system/view)
- [Design Uber/Ola/Rapido/Lyft - Medium](https://medium.com/thesystemdesign/design-uber-ola-rapido-lyft-599ac5d6c0a5)
- [Designing Uber: Real-Time Ride Matching System at Scale](https://braziliandevs.forum.com/ishaanthedev/designing-uber-a-real-time-ride-matching-system-at-scale-pc9)
- [Building Your Own Ride-Hailing Platform - Medium](https://blog.stackademic.com/building-your-own-ride-hailing-platform-a-complete-technical-blueprint-a6e779f53b5b)
- [Optimizing Carpooling with PostGIS - Medium](https://medium.com/@alexandroskaza23/optimizing-carpooling-with-postgis-the-ride-matching-algorithm-behind-job-rider-4ad2948df675)
- [Uber Driver Match: Real-World System Design - Medium](https://medium.com/@singh.sanjiv/uber-driver-match-from-blueprint-to-bytes-real-world-system-design-part-2-98246648c224)
- [Geofencing in Ride-Hailing Apps](https://www.appicial.com/blog/geofencing-in-ride-hailing-apps-the-invisible-boundary-that-powers-your-next-ride.html)
- [Expo Router API Routes - Expo Documentation](https://docs.expo.dev/router/reference/api-routes)

---
*Architecture research for: Campus Rideshare App*
*Researched: 2026-04-15*
