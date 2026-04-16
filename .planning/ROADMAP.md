# Pasabay Roadmap

**Phases:**

- [x] **Phase 1: Project Setup** - Configure existing scaffold with maps and location dependencies (Completed 2026-04-15)
- [ ] **Phase 2: Authentication** - USC email verification, login, session persistence
- [ ] **Phase 3: User Roles** - Role selection and switching
- [ ] **Phase 4: Driver Verification** - License and vehicle submission, verification status
- [ ] **Phase 5: Passenger Home** - Pickup/dropoff location selection, nearby drivers
- [ ] **Phase 6: Driver Home** - Ride request management, earnings display
- [ ] **Phase 7: Real-Time Matching Backend** - Matching algorithm, Redis Geo, WebSocket
- [ ] **Phase 8: Match UI** - Matching animation, confirmation screens
- [ ] **Phase 9: Trip Flow** - Trip status, completion, fare calculation
- [ ] **Phase 10: Ratings & History** - Ratings, trip history, receipts, earnings dashboard

---

## Phase Details

### Phase 1: Project Setup

**Goal:** Configure existing scaffold with Socket.IO, Zustand state management, and Expo prebuild for native builds

**Depends on:** Nothing (first phase)

**Requirements:** None directly (infrastructure setup)

**Success Criteria** (what must be TRUE):
1. Socket.IO server mounted on api-server and accepting connections
2. Socket.IO client installed in pasabay mobile app
3. Zustand state management set up in pasabay
4. expo-dev-client installed and configured
5. Expo prebuild generates android/ directory successfully
6. Development build works with native code

**Plans:** 
- [x] 01-PLAN.md — Socket.IO, Zustand, Expo prebuild setup

---

### Phase 2: Authentication

**Goal:** Users can sign up, log in, and maintain sessions

**Depends on:** Phase 1 (maps/location setup)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

**Success Criteria** (what must be TRUE):
1. User can sign up with USC email (@usc.edu.ph) and password
2. User sees error when trying to sign up with non-USC email
3. User can log in with registered email and password
4. User stays logged in after app restarts (session persists)
5. User can log out from profile screen

**Plans:** TBD

---

### Phase 3: User Roles

**Goal:** Users can select and switch between Passenger and Driver roles

**Depends on:** Phase 2 (authentication)

**Requirements:** ROLE-01, ROLE-02, ROLE-03

**Success Criteria** (what must be TRUE):
1. New users can select Passenger or Driver role during signup
2. Default role is Passenger for new users
3. Users can switch roles from profile (drivers re-verified before going online)

**Plans:** TBD

---

### Phase 4: Driver Verification

**Goal:** Drivers can submit and verify license and vehicle details

**Depends on:** Phase 3 (user roles)

**Requirements:** DRVR-01, DRVR-02, DRVR-03, DRVR-04

**Success Criteria** (what must be TRUE):
1. Driver can upload photo of driver license
2. Driver can enter vehicle details (plate number, model, color)
3. Driver cannot access driver home until verification approved
4. Verification status (pending/approved) visible in profile

**Plans:** TBD

---

### Phase 5: Passenger Home

**Goal:** Passengers can select pickup/dropoff and request rides

**Depends on:** Phase 2 (auth), Phase 4 (driver verification for nearby drivers)

**Requirements:** PASS-01, PASS-02, PASS-03, PASS-04

**Success Criteria** (what must be TRUE):
1. Passenger can tap map to select pickup location
2. Passenger can tap map to select dropoff location
3. Passenger can see list/markers of nearby available drivers
4. Passenger can tap "Request Ride" to submit ride request

**Plans:** TBD

---

### Phase 6: Driver Home

**Goal:** Drivers can view, accept/decline ride requests, and view earnings

**Depends on:** Phase 4 (verification), Phase 5 (ride requests created)

**Requirements:** DRIV-01, DRIV-02, DRIV-03, DRIV-04, DRIV-05

**Success Criteria** (what must be TRUE):
1. Driver sees incoming ride requests with pickup location
2. Driver can tap to accept a ride request
3. Driver can tap to decline a ride request
4. Driver sees total earnings displayed on home screen
5. Driver can tap to open navigation to passenger pickup

**Plans:** TBD

---

### Phase 7: Real-Time Matching Backend

**Goal:** Backend system matches passengers with drivers in real-time

**Depends on:** Phase 5 (ride requests), Phase 6 (driver accepts)

**Requirements:** MATCH-02, MATCH-05 (backend logic)

**Success Criteria** (what must be TRUE):
1. Backend finds nearest verified available driver when passenger requests
2. Backend pushes ride offer to eligible drivers via WebSocket
3. Backend handles first driver to accept (race condition resolved)
4. Backend times out request after 60 seconds if no driver accepts

**Plans:** TBD

---

### Phase 8: Match UI

**Goal:** Users see matching animation and confirmation details

**Depends on:** Phase 5 (passenger requests), Phase 6 (driver accepts), Phase 7 (matching logic)

**Requirements:** MATCH-01, MATCH-03, MATCH-04

**Success Criteria** (what must be TRUE):
1. Passenger sees animated "Finding your driver..." screen while matching
2. Passenger sees confirmation with driver name, vehicle, rating
3. Driver sees confirmation with passenger name, pickup location

**Plans:** TBD

---

### Phase 9: Trip Flow

**Goal:** Users can complete trips and see fare

**Depends on:** Phase 8 (match confirmation)

**Requirements:** TRIP-01, TRIP-02, TRIP-03, TRIP-04

**Success Criteria** (what must be TRUE):
1. Passenger can tap to confirm driver arrived at pickup
2. Both passenger and driver see trip status (arriving, in progress, completed)
3. Passenger can tap to confirm trip completed
4. Fare calculated and displayed to both parties

**Plans:** TBD

---

### Phase 10: Ratings & History

**Goal:** Users can rate each other and view trip history

**Depends on:** Phase 9 (trip completion)

**Requirements:** RATE-01, RATE-02, RATE-03, RATE-04, PROF-01, PROF-02, PROF-03, PROF-04, PROF-05

**Success Criteria** (what must be TRUE):
1. Passenger can rate driver 1-5 stars after trip
2. Driver can rate passenger 1-5 stars after trip
3. User can view list of past trips with driver info
4. User can view trip receipt with fare breakdown
5. Driver can view earnings summary on earnings screen
6. User can view profile information
7. User can update display name in profile
8. Driver can view/edit vehicle details in profile

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup | 1/1 | Complete | 2026-04-15 |
| 2. Authentication | 0/1 | Not started | - |
| 3. User Roles | 0/1 | Not started | - |
| 4. Driver Verification | 0/1 | Not started | - |
| 5. Passenger Home | 0/1 | Not started | - |
| 6. Driver Home | 0/1 | Not started | - |
| 7. Real-Time Matching Backend | 0/1 | Not started | - |
| 8. Match UI | 0/1 | Not started | - |
| 9. Trip Flow | 0/1 | Not started | - |
| 10. Ratings & History | 0/1 | Not started | - |

---

*Roadmap created: 2026-04-15*
*Granularity: fine (10 phases)*
*Requirements coverage: 34/34 v1 requirements*