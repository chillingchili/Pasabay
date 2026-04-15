# Features Research

**Domain:** Campus Rideshare Mobile App
**Researched:** 2026-04-15
**Confidence:** MEDIUM (websearch + industry sources)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| USC email verification | School policy requires @usc.edu.ph; ensures only verified students | MEDIUM | Email domain validation on signup; may need backend verification |
| User registration + roles | Passenger/driver selection is core to platform | LOW | Role stored in user profile; toggles UI |
| Driver verification (license + vehicle) | Safety requirement; matches Uber/Lyft baseline | HIGH | Requires license upload, vehicle details; store verification status |
| Passenger home (pickup/dropoff) | Core interaction point for requesting rides | MEDIUM | Map-based location selection; Expo Location API |
| Driver home (ride requests) | How drivers receive ride requests | MEDIUM | List of nearby requests; accepts/rejects |
| Real-time matching | Connects passengers with drivers | HIGH | Core algorithm; location proximity, route matching |
| Matching animation/screen | User feedback during matching | LOW | Visual feedback; loading state |
| Match confirmation | Shows driver/passenger details | LOW | Display vehicle, rating, name |
| Trip history | Required for trust/accountability | LOW | Display past trips; stored in AsyncStorage |
| Driver/passenger ratings | Builds trust in peer network; 5-star system | LOW | Post-trip rating; displayed on profiles |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live driver tracking on map | Real-time pickup ETA; reduces uncertainty | MEDIUM | Requires real-time location updates |
| Split cost calculation | Transparent fare sharing between passengers | LOW | Distance-based formula |
| Driver earnings dashboard | Driver-focused analytics; incentivizes driving | MEDIUM | Track daily/weekly earnings |
| Trip receipts | Post-trip fare breakdown | LOW | Fare, distance, time |
| Continuous monitoring (re-verification) | Ongoing safety; catches new offenses | HIGH | Annual background check re-runs |
| Verified student badge | Trust signal on profiles | LOW | Visual indicator for verified users |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-app chat/messaging | Coordination convenience | Introduces moderation liability; creates friction | Use phone call or external messaging |
| Scheduled rides | Planning ahead | Requires complex queue/logic; driver availability | Keep on-demand only |
| In-app payment | Cashless convenience | Regulatory complexity; PCI compliance | Keep cash-only for v1 |
| Multi-stop trips | Flexibility | Route optimization complexity | Single pickup-dropoff only |
| Live trip sharing with family | Safety | Real-time location sharing complexity | Simple ETA display |

## Feature Dependencies

```
[USC Email Verification]
        └──requires──> [User Registration]
        
[Driver Verification]
        └──requires──> [User Registration]
        └──requires──> [License Upload + Vehicle Details]
        
[Passenger Home]
        └──requires──> [User Registration] (verified passenger)
        
[Driver Home]
        └──requires��─> [Driver Verification] (verified driver)
        
[Real-time Matching]
        ├──requires──> [Passenger Home] location
        └──requires──> [Driver Home] location
        └──requires──> [User Registration]
        └──requires──> [User Registration]
        
[Matching Animation]
        └──requires──> [Real-time Matching]
        
[Match Confirmation]
        └──requires──> [Real-time Matching]
        
[Trip History]
        └──requires──> [User Registration]
        
[Ratings]
        └──requires──> [Trip History] (requires completed trip)
        
[Driver Earnings]
        └──requires──> [Driver Verification]
        └──requires──> [Trip History]
```

### Dependency Notes

- **Real-time Matching requires both User Registration (passenger + driver verified)** - Core flows must have both roles verified
- **Driver Verification requires License Upload** - Multi-step flow: license → vehicle → approved
- **Ratings requires completed trip** - Only rate after trip completes, not during matching
- **Driver Earnings requires driver verification** - Only verified drivers can earn

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] USC email verification (@usc.edu.ph) — Required by school policy, gates all access
- [x] User registration with role selection — Sets up passenger vs driver flow
- [x] Driver verification flow (license + vehicle) — Safety baseline before accepting rides
- [x] Passenger home with pickup/dropoff — How passengers request rides
- [x] Driver home showing requests — How drivers receive rides
- [x] Real-time matching — Core algorithm connecting users
- [x] Matching animation — Feedback during match
- [x] Match found confirmation — Shows match details
- [x] Trip history — Record of past interactions
- [x] Rating after trip — 5-star trust system

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Driver earnings display — Dashboard for drivers
- [ ] Trip receipts — Fare breakdown
- [ ] Live driver tracking — Real-time ETA on map
- [ ] Split cost calculation — Fair fare splitting

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Payment processing — Cashless option (regulatory lift)
- [ ] Scheduled rides — Planning ahead (queue complexity)
- [ ] In-app chat — Communication (moderation liability)
- [ ] Multi-stop trips — Route optimization

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| USC email verification | HIGH | MEDIUM | P1 |
| User registration + roles | HIGH | LOW | P1 |
| Driver verification | HIGH | HIGH | P1 |
| Passenger home | HIGH | MEDIUM | P1 |
| Driver home | HIGH | MEDIUM | P1 |
| Real-time matching | HIGH | HIGH | P1 |
| Matching animation | MEDIUM | LOW | P1 |
| Match confirmation | MEDIUM | LOW | P1 |
| Trip history | MEDIUM | LOW | P1 |
| Ratings | MEDIUM | LOW | P1 |
| Driver earnings | MEDIUM | MEDIUM | P2 |
| Trip receipts | MEDIUM | LOW | P2 |
| Live driver tracking | MEDIUM | MEDIUM | P2 |
| Split cost | LOW | LOW | P2 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Volta | Shuffl | RideAlong | Pasabay (Our Approach) |
|---------|------|-------|----------|---------------------|
| University email verification | Yes | Yes | Yes | Yes — @usc.edu.ph only |
| Driver verification | Yes | Yes | Yes | License + vehicle details |
| Real-time matching | Yes | Yes | Yes | On-demand matching |
| Ratings | Yes | Yes | Yes | 5-star system |
| In-app chat | Yes | No | No | NOT in v1 — external |
| Payment | Cash | Cash | Split cost | Cash-only v1 |
| Live tracking | Map | Map | No | P2 |
| Scheduled rides | Yes | Yes | Yes | NOT in v1 — on-demand |

## Sources

- **Volta - College Rideshare** (App Store) — University-specific rideshare
- **Shuffl Mobility** (shufflmobility.com) — Student-to-student matching
- **RideAlong** (ridealongapp.com) — Texas student rideshare
- **CampusRide** (ares-team.com) — Campus mobility
- **Housr Rideshare** — University Nebraska program
- **Tigers Commute** (Clemson University) — Campus mobility platform
- **UI Rideshare** (University of Iowa) — University ride-matching
- **Uber Driver Screening** (uber.com/safety) — Industry benchmark
- **Sumsub Driver Verification** (sumsub.com) — License verification best practices

---

*Feature research for: Campus Rideshare*
*Researched: 2026-04-15*