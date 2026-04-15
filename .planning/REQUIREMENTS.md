# Requirements: Pasabay

**Defined:** 2026-04-15
**Core Value:** USC students can get safe, affordable rides to campus from verified students

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email (must be `@usc.edu.ph` domain)
- [ ] **AUTH-02**: System rejects non-USC email domains during registration
- [ ] **AUTH-03**: User can log in with email/password
- [ ] **AUTH-04**: User session persists across app restarts
- [ ] **AUTH-05**: User can log out from any screen

### User Roles

- [ ] **ROLE-01**: User can select role (Passenger or Driver) during signup
- [ ] **ROLE-02**: Passenger role is default for new users
- [ ] **ROLE-03**: User can switch roles from profile (requires re-verification if Driver)

### Driver Verification

- [ ] **DRVR-01**: Driver can submit driver license photo
- [ ] **DRVR-02**: Driver can submit vehicle details (plate number, model, color)
- [ ] **DRVR-03**: Driver cannot access driver home until verified
- [ ] **DRVR-04**: Verification status displays in user profile

### Passenger Home

- [ ] **PASS-01**: Passenger can select pickup location on map
- [ ] **PASS-02**: Passenger can select dropoff location on map
- [ ] **PASS-03**: Passenger can view nearby available drivers
- [ ] **PASS-04**: Passenger can request a ride

### Driver Home

- [ ] **DRIV-01**: Driver can view incoming ride requests
- [ ] **DRIV-02**: Driver can accept a ride request
- [ ] **DRIV-03**: Driver can decline a ride request
- [ ] **DRIV-04**: Driver can view their earnings total
- [ ] **DRIV-05**: Driver can navigate to passenger pickup location

### Matching

- [ ] **MATCH-01**: Passenger sees matching animation while waiting
- [ ] **MATCH-02**: Matching finds available verified driver
- [ ] **MATCH-03**: Passenger sees match confirmation with driver details
- [ ] **MATCH-04**: Driver sees match confirmation with passenger details
- [ ] **MATCH-05**: Match timeout after 60 seconds if no driver accepts

### Trip Flow

- [ ] **TRIP-01**: Passenger can confirm driver arrived
- [ ] **TRIP-02**: Trip status updates visible to both parties
- [ ] **TRIP-03**: Passenger can confirm trip completed
- [ ] **TRIP-04**: Fare calculated and displayed

### Ratings & History

- [ ] **RATE-01**: Passenger can rate driver (1-5 stars) after trip
- [ ] **RATE-02**: Driver can rate passenger (1-5 stars) after trip
- [ ] **RATE-03**: Trip history displays past trips with driver info
- [ ] **RATE-04**: Trip receipt available with fare details

### Profile

- [ ] **PROF-01**: User can view their profile information
- [ ] **PROF-02**: User can view trip history
- [ ] **PROF-03**: User can update display name
- [ ] **PROF-04**: Driver can view/edit vehicle details
- [ ] **PROF-05**: User can log out

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: Passenger receives notification when driver accepts ride
- **NOTF-02**: Driver receives notification when new ride request matches route

### Live Tracking

- **TRACK-01**: Passenger can view driver's real-time location during trip
- **TRACK-02**: Estimated arrival time displayed

### Payments

- **PAY-01**: In-app payment via GCash/PayMaya
- **PAY-02**: Driver earnings auto-calculated from trips
- **PAY-03**: Trip receipts sent via email

### Safety

- **SAFE-01**: Emergency button contacts campus security
- **SAFE-02**: Trip sharing (share live location with friend)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Non-USC users | Hackathon scope, USC-only event |
| In-app chat | Moderation complexity, defer to v2 |
| Scheduled rides | On-demand matching is core v1 value |
| Multi-stop trips | Single pickup/dropoff for hackathon |
| Background checks | Legal complexity, not feasible in hackathon timeframe |
| Driver-to-driver messaging | Potential for abuse |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| ROLE-01 | — | Pending |
| ROLE-02 | — | Pending |
| ROLE-03 | — | Pending |
| DRVR-01 | — | Pending |
| DRVR-02 | — | Pending |
| DRVR-03 | — | Pending |
| DRVR-04 | — | Pending |
| PASS-01 | — | Pending |
| PASS-02 | — | Pending |
| PASS-03 | — | Pending |
| PASS-04 | — | Pending |
| DRIV-01 | — | Pending |
| DRIV-02 | — | Pending |
| DRIV-03 | — | Pending |
| DRIV-04 | — | Pending |
| DRIV-05 | — | Pending |
| MATCH-01 | — | Pending |
| MATCH-02 | — | Pending |
| MATCH-03 | — | Pending |
| MATCH-04 | — | Pending |
| MATCH-05 | — | Pending |
| TRIP-01 | — | Pending |
| TRIP-02 | — | Pending |
| TRIP-03 | — | Pending |
| TRIP-04 | — | Pending |
| RATE-01 | — | Pending |
| RATE-02 | — | Pending |
| RATE-03 | — | Pending |
| RATE-04 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| PROF-04 | — | Pending |
| PROF-05 | — | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 0
- Unmapped: 34 ⚠️

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after initial definition*
