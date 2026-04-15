# Pitfalls Research

**Domain:** Campus Rideshare (Peer-to-Peer Carpooling)
**Researched:** 2026-04-15
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Fake Driver / Identity Impersonation

**What goes wrong:**
A driver creates an account with stolen USC credentials and verified documents, but uses a different vehicle or allows someone else to drive. Passengers have no way to verify the actual driver matches the verified identity.

**Why it happens:**
- Verification only happens once at signup, not per-trip
- No photo verification at ride time
- No real-time license plate matching with verified records

**How to avoid:**
- Implement in-app photo verification (driver takes selfie before going online)
- Require license plate photo on vehicle verification, then verify plate matches before each ride
- Show driver photo prominently in passenger app with "Verify Driver" button

**Warning signs:**
- Driver photo doesn't match the person who arrives
- License plate differs from what's in the app
- Vehicle make/model/color doesn't match verification documents

**Phase to address:** Phase 1 (Verification Flow)

---

### Pitfall 2: Fake Rides for Incentives

**What goes wrong:**
A driver collaborates with a fake passenger account (or real passenger in on scheme) to create phantom rides that never happen, earning incentive bonuses or inflating their ride count for higher ratings.

**Why it happens:**
- No mechanism to verify ride actually occurred between verified locations
- Rating system rewards high ride count without quality validation
- No requirement for passenger to confirm ride completion

**How to avoid:**
- Require both driver and passenger to confirm ride start and end
- Log GPS coordinates at ride start/end and verify reasonable distance between pickup and dropoff
- Flag rides with unusually short duration or distance for review

**Warning signs:**
- Same passenger appears in multiple rides with the same driver repeatedly
- Rides completed in suspiciously short time
- Driver has high ride count but low average rating

**Phase to address:** Phase 3 (Matching & Completion)

---

### Pitfall 3: GPS Location Manipulation

**What goes wrong:**
A driver uses GPS spoofing apps to appear at a different location than where they actually are. They position themselves in a high-demand area (like USC Main Gate) while physically being elsewhere, getting matched to rides they shouldn't receive.

**Why it happens:**
- Mobile GPS can be spoofed on rooted/jailbroken devices
- No continuous location verification during active driver mode

**How to avoid:**
- Use multiple location signals (GPS + WiFi + cell towers) for verification
- Implement "challenge" system — periodically ask driver to tap a random on-screen location within 5 seconds of where they claim to be
- Detect impossible travel — if driver claims to travel X distance in Y time, flag it

**Warning signs:**
- Driver's location jumps significantly without logical travel
- Location updates are erratic or show teleportation

**Phase to address:** Phase 3 (Matching & Completion)

---

### Pitfall 4: Matching Algorithm Ignores Wait Time

**What goes wrong:**
A passenger requests a ride, sees nearby drivers, but gets matched to a driver 15 minutes away instead of one 3 minutes away. Passenger waits 20+ minutes while closer drivers stay "available" but don't get matched.

**Why it happens:**
- Matching algorithm optimizes for driver convenience or distance rather than passenger wait time
- No queue system — first driver to accept wins, not most optimal match
- No penalty for drivers who accept but then "can't find" passenger

**How to avoid:**
- Prioritize nearest available driver by default
- Implement a waiting queue — if no driver accepts within 2 minutes, auto-match to nearest
- Show passenger estimated wait time before confirming ride request
- Penalize drivers who cancel after accepting (count against them)

**Warning signs:**
- Passengers report "drivers accept then never show up"
- App shows nearby drivers but requests keep timing out
- Students wait 20+ minutes for a ride that should take 5 minutes

**Phase to address:** Phase 2 (Passenger & Driver Home Screens)

---

### Pitfall 5: Safety Incidents Without Emergency Response

**What goes wrong:**
A passenger or driver experiences an emergency (medical, assault, accident) during a ride but has no way to alert authorities quickly. 911 calls require explaining location, which is difficult in a moving vehicle. Traditional emergency systems weren't designed for rideshare scenarios.

**Why it happens:**
- No in-app emergency button that shares ride details with dispatch automatically
- No way to silently trigger alarm without alerting the other party
- Location sharing ends when ride ends

**How to avoid:**
- Add prominent emergency button in app that: shares ride ID, both parties' names, vehicle info, and current GPS coordinates with campus security
- Add "silent alarm" feature that silently sends location to campus police
- Continue location tracking for 10 minutes after ride ends (grace period)

**Warning signs:**
- Students feel unsafe at night with drivers
- No way to share trip info with friends during ride

**Phase to address:** Phase 3 (Matching & Completion)

---

### Pitfall 6: No Driver Background Check Beyond USC Email

**What goes wrong:**
A student with a USC email but a serious criminal record passes verification because verification only confirms email ownership, not checks criminal history. A driver with prior assault convictions is matched with female passengers.

**Why it happens:**
- USC email verification confirms student status but doesn't validate character
- No background check process in place
- Privacy concerns prevent accessing criminal records without consent

**How to avoid:**
- Require drivers to consent to a background check as part of verification
- Check against sex offender registries (public information)
- Consider requiring driver's license verification through third-party service
- Display "Verified Driver" badge only when all checks pass

**Warning signs:**
- No background check required to become driver
- "Verified" status means only email confirmed, not safe

**Phase to address:** Phase 1 (Verification Flow)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip background checks | Faster driver onboarding | Safety incidents, liability | Never |
| Mock ride matching with hardcoded data | Demo works | Can't scale to real users | MVP only |
| Cash-only transactions | Avoid payment complexity | No audit trail, no dispute resolution | V1 only |
| No real-time location tracking | Simpler to build | Can't detect fraud, can't show ETA | Never |
| Single device accounts | Simpler auth | Can't detect multi-account fraud | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google OAuth | Hardcoding `hd` parameter instead of making domain configurable | Make school domain a deployment-time config |
| Location Services | Requesting "always" permission from start | Request "when in use" first, upgrade only when driver goes online |
| Push Notifications | Not handling permission denial gracefully | App must work fully without push — no "you must enable" blocks |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Broadcasting all ride requests to all nearby drivers | Battery drain, network congestion | Filter by distance (2km radius), not all | At 500+ concurrent users |
| Real-time matching on main thread | UI freezes when finding drivers | Offload matching to background thread | On older devices |
| No driver supply forecast | No rides available during peak hours | Predict demand based on time of day, send notifications to drivers | At 100+ concurrent rides |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing user passwords in plain text | Mass account compromise if DB leaked | Use proper hashing (bcrypt/argon2) |
| No rate limiting on login | Brute force attacks on accounts | Limit to 5 attempts per minute |
| Exposing other users' phone numbers | Stalking, harassment | Use in-app anonymous calling only |
| No session expiry | Stolen devices give permanent access | Auto-logout after 30 days of inactivity |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No way to cancel after requesting | Stuck in unwanted ride | Add "Cancel Request" for up to 2 minutes before matching |
| Can't contact driver before ride | Can't coordinate pickup | Show driver phone (anonymized) once matched |
| Rating only after ride ends | Ratings are punitive/revenge | Prompt within 30 minutes, allow up to 24 hours |
| No trip receipt | Can't verify fare, no proof of ride | Auto-generate receipt with route, fare, both parties |

## "Looks Done But Isn't" Checklist

- [ ] **Driver Verification:** Often missing actual license check — verify license number against LTO database
- [ ] **Vehicle Verification:** Often missing plate number verification — match against registered vehicle
- [ ] **Trip Matching:** Often missing passenger confirmation step — passenger must confirm driver arrived
- [ ] **Emergency Button:** Often missing from home screens — add to both passenger and driver flow
- [ ] **Rating System:** Often missing feedback to drivers — drivers can't improve without knowing why they got low rating

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fake driver identity used | HIGH | Disable account, review verification flow, add photo verification |
| Fake rides gamed | MEDIUM | Implement detection, disable fraudulent accounts, add trip confirmation |
| GPS spoofing detected | MEDIUM | Device ban, switch to multi-signal verification |
| Safety incident without emergency response | CRITICAL | Has legal implications — add emergency features before launch |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fake Driver Identity | Phase 1 (Verification Flow) | Photo verification + license plate matching |
| Fake Rides | Phase 3 (Matching & Completion) | Both-party confirmation, GPS validation |
| GPS Spoofing | Phase 3 (Matching & Completion) | Location signal triangulation |
| Matching Ignores Wait Time | Phase 2 (Home Screens) | Show nearby drivers, prioritize nearest |
| No Emergency Response | Phase 3 (Matching & Completion) | In-app emergency button |
| No Background Check | Phase 1 (Verification Flow) | Background check integration |

## Sources

- Fox 29 Philadelphia: Villanova student reports sexual assault by rideshare driver (2024-09-21)
- 3rd-i Podcast: Social Safety Revolution for Students (2025-10-01)
- The State News: Staying safe on rideshare apps - MSU (2024-09-30)
- Daily Northwestern: New Safe Ride challenges (2024-11-25)
- Minnesota Daily: Gopher Chauffeur unreliable (2024-01-22)
- MTD SafeRides ridership decline (2023-11-28)
- The GW Hatchet: 4-RIDE student complaints (2018-11-01)
- United Educators: Student Ride-Share Safety (2022-12-19)
- Insurance Journal: $40M Rideshare Fraud Scheme - Screwber & Fake GPS (2024-08-30)
- Inc.com: Uber Drivers Game Algorithm (2017-08-02)
- Drive.com.au: Fake Surge Pricing (2023-06-01)
- FrankonFraud: Screwber App Analysis (2024-09-01)
- SHIELD: Collusion Fraud Prevention (2024)

---

*Pitfalls research for: Campus Rideshare*
*Researched: 2026-04-15*