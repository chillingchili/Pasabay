# Stack Research

**Domain:** Campus Rideshare Mobile App
**Researched:** 2026-04-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK 55 | Latest | Mobile framework | Industry standard for RN development; excellent docs, prebuild, and native module support |
| React Native | 0.79.x | Core runtime | Powers Expo; shares codebase with existing api-server |
| Express 5 | ^5 | API server | Already in use; excellent WebSocket support with socket.io |
| PostgreSQL | Latest | Database | Already in use; relational integrity for rides/transactions |
| Drizzle ORM | ^0.45.1 | Database ORM | Already in use; type-safe, lightweight |

### Maps & Geolocation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-maps | ^1.x | Map rendering | Mature, well-documented; works with Expo Go; supports Google Maps on Android/iOS |
| expo-location | Latest | GPS tracking | Native Expo module; `watchPositionAsync()` for real-time updates |
| Google Maps API | External | Directions/routing | Industry standard for ETA, routing, geocoding |

**Why react-native-maps over expo-maps:** expo-maps is in alpha and only supports Google Maps on Android. For cross-platform iOS/Android production apps in 2026, react-native-maps remains the battle-tested choice with full feature parity across platforms.

### Real-Time Communication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| socket.io | ^4.x | WebSocket abstraction | Auto-reconnection, rooms, event-based messaging; battle-tested in production ride apps |
| socket.io-client | ^4.x | Client library | Works in React Native; handles network transitions |

**Why Socket.IO over raw WebSockets:**
- Automatic reconnection with exponential backoff
- Room-based messaging (essential for driver/passenger pairing)
- Acknowledgements ensure message delivery
- Fallback to polling if WebSocket fails

**Alternative considered:** Pusher — Easier setup but add costs and vendor lock-in. Socket.IO gives full control.

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Firebase Auth | ^11.x | Email verification | Native RN support; handles verification emails, password reset, session management |
| zod | ^3.25.x | Email validation | Already in use; validates @usc.edu.ph domain on client before API call |

**Why Firebase Auth:**
- Built-in email verification flow (sends verification emails, handles tokens)
- Session persistence across app restarts
- Works with Expo (requires dev build for native modules)
- Free tier generous for hackathon scale

**Alternative:** Clerk — Excellent React Native support, but requires more setup than Firebase for email verification alone.

### Driver/Passenger Verification

| Technology | Purpose | Implementation |
|------------|---------|----------------|
| Custom API endpoint | License/vehicle validation | New Express endpoint; stores verification status in users table |
| Image storage | License/vehicle photos | Base64 or file upload to backend/Supabase Storage |

**Note:** No dedicated library needed. Verification is a business logic feature implemented via:
1. Form fields for license number, vehicle plate, model
2. Photo upload (expo-image-picker or react-native-image-picker)
3. Admin approval flag in database

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| expo-image-picker | Latest | Driver license/vehicle photos | Driver verification flow |
| @react-native-async-storage/async-storage | Latest | Session persistence | Store auth tokens locally |
| expo-notifications | Latest | Push notifications | Trip status updates to users |
| zustand | ^5.x | Client state management | User role, active ride state |
| react-hook-form | ^7.x | Form handling | Registration, verification forms |

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| expo-dev-client | Development builds | Required for native modules (maps, notifications) |
| npx expo prebuild | Generate native projects | Run before building iOS/Android |
| ngrok | Local webhook testing | Expose localhost to Firebase for email verification |

## Installation

```bash
# Core mobile dependencies
npx expo install react-native-maps expo-location expo-image-picker
npx expo install expo-notifications expo-device

# Real-time communication
npm install socket.io-client@^4

# Authentication
npm install @react-native-firebase/auth

# State & forms
npm install zustand react-hook-form @hookform/resolvers

# Development
npm install -D expo-dev-client
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-native-maps | expo-maps | Only if targeting Android-only with New Architecture |
| Socket.IO | Pusher | Pusher if simplicity > cost control |
| Firebase Auth | Clerk | Clerk if already using Clerk for other features |
| Custom verification | Stripe Identity | If needing AI-powered ID verification |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|------------|
| Google Maps JavaScript API | Not native; poor mobile UX | react-native-maps |
| WebSocket directly | No reconnection, no rooms | Socket.IO client |
| Parse Server | Deprecated | Firebase Auth or custom Express auth |
| Native Base64 images | Memory issues with large photos | File upload to server/S3 |

## Stack Patterns by Variant

**If using Expo Go (development):**
- Use react-native-maps with default provider (Apple Maps on iOS)
- Socket.IO connects to localhost or ngrok tunnel
- Note: Firebase Auth requires dev build, not available in Expo Go

**If building for production:**
- Generate native projects with `npx expo prebuild`
- Add Google Maps API keys in app.json for both platforms
- Consider background location for driver tracking

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo-location@latest | Expo SDK 54-55 | Uses native location APIs |
| react-native-maps@latest | RN 0.76+, Expo SDK 54+ | New Architecture support |
| socket.io-client@4.x | Express+socket.io 4.x | Must match server version |
| firebase@11.x | RN 0.76+, Expo SDK 54+ | Requires dev build |

## Critical Considerations for Rideshare Apps

### Location Accuracy
- Use `Location.Accuracy.High` for driver tracking
- Set `distanceInterval: 10` (update every 10 meters)
- Set `timeInterval: 5000` (or every 5 seconds)
- Consider battery impact vs. update frequency

### Background Location
- Requires `requestBackgroundPermissionsAsync()`
- Must use `TaskManager` for background updates
- iOS requires background mode capability
- Android requires foreground service

### Real-Time Matching
- Socket.IO rooms: `ride-{rideId}`
- Emit location every 3-5 seconds from drivers
- Broadcast to passenger app via room subscription

---

*Stack research for: Campus Rideshare App*
*Researched: 2026-04-15*
*Sources: Context7, Expo Docs, websearch (production ride-share examples)*