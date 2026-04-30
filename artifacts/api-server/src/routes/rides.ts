import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, vehiclesTable, ridesTable, ridePassengersTable, activeRoutesTable } from "@workspace/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { calculatePassengerFare } from "../lib/fare.js";
import { getRoute, projectPointOnPolyline, polylineDistanceKm, haversineKm } from "../lib/osrm.js";
import type { RoutePoint } from "../lib/osrm.js";
import { z } from "zod/v4";
import { getIo } from "../lib/io.js";
import { matchTimeouts } from "../sockets/index.js";

const router = Router();

const requestSchema = z.object({
  pickupName: z.string().min(1),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffName: z.string().min(1),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  radiusKm: z.number().optional(),
});

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ridePassengerId: z.string().optional(),
  passengerId: z.string().optional(),
});

router.get("/history", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const offset = Number(req.query.offset ?? 0);

  const asPassenger = await db
    .select({
      id: ridesTable.id,
      role: sql<string>`'passenger'`,
      fromName: ridesTable.fromName,
      toName: ridesTable.toName,
      status: ridesTable.status,
      fare: ridePassengersTable.fare,
      matchingFee: ridePassengersTable.matchingFee,
      distanceKm: ridePassengersTable.distanceKm,
      createdAt: ridesTable.createdAt,
      completedAt: ridesTable.completedAt,
      driverId: ridesTable.driverId,
    })
    .from(ridesTable)
    .innerJoin(ridePassengersTable, eq(ridePassengersTable.rideId, ridesTable.id))
    .where(eq(ridePassengersTable.passengerId, userId))
    .orderBy(desc(ridesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const asDriver = await db
    .select({
      id: ridesTable.id,
      role: sql<string>`'driver'`,
      fromName: ridesTable.fromName,
      toName: ridesTable.toName,
      status: ridesTable.status,
      fare: sql<number>`0`,
      matchingFee: sql<number>`0`,
      distanceKm: ridesTable.totalDistanceKm,
      createdAt: ridesTable.createdAt,
      completedAt: ridesTable.completedAt,
      driverId: ridesTable.driverId,
    })
    .from(ridesTable)
    .where(eq(ridesTable.driverId, userId))
    .orderBy(desc(ridesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const combined = [...asPassenger, ...asDriver]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  res.json({ rides: combined, total: combined.length });
});

router.get("/:id", requireAuth, async (req, res) => {
  const [ride] = await db.select().from(ridesTable)
    .where(eq(ridesTable.id, req.params.id)).limit(1);
  if (!ride) { res.status(404).json({ error: "Ride not found" }); return; }

  const passengers = await db.select({
    id: ridePassengersTable.id,
    passengerId: ridePassengersTable.passengerId,
    pickupName: ridePassengersTable.pickupName,
    dropoffName: ridePassengersTable.dropoffName,
    fare: ridePassengersTable.fare,
    matchingFee: ridePassengersTable.matchingFee,
    distanceKm: ridePassengersTable.distanceKm,
    status: ridePassengersTable.status,
  }).from(ridePassengersTable).where(eq(ridePassengersTable.rideId, ride.id));

  const [driver] = await db.select({
    id: usersTable.id, name: usersTable.name, rating: usersTable.rating, avatar: usersTable.avatar,
  }).from(usersTable).where(eq(usersTable.id, ride.driverId)).limit(1);

  const [vehicle] = ride.vehicleId
    ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, ride.vehicleId)).limit(1)
    : [null];

  res.json({ ...ride, driver, vehicle, passengers });
});

router.post("/request", requireAuth, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation failed" });
    return;
  }

  const passengerId = req.user!.sub;
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, pickupName, dropoffName, radiusKm } = parsed.data;

  const pickup: RoutePoint = { lat: pickupLat, lng: pickupLng };
  const dropoff: RoutePoint = { lat: dropoffLat, lng: dropoffLng };

  const activeRoutes = await db.select().from(activeRoutesTable)
    .where(eq(activeRoutesTable.status, "active"));

  console.log("[MATCH-STAGE-2] Active drivers found:", activeRoutes.length);

  const MATCH_RADIUS_KM = radiusKm ?? 0.3;
  const matches: { routeId: string; driverId: string; pickupSnapped: RoutePoint; dropoffSnapped: RoutePoint; passengerDistKm: number; fare: number; matchingFee: number; pickupEtaMin: number }[] = [];

  for (const route of activeRoutes) {
    if (route.driverId === passengerId) continue;
    const polyline = route.polyline as RoutePoint[];
    if (!polyline?.length) continue;

    const pickupProj = projectPointOnPolyline(pickup, polyline);
    if (pickupProj.distKm > MATCH_RADIUS_KM) continue;

    const dropoffProj = projectPointOnPolyline(dropoff, polyline);
    if (dropoffProj.distKm > MATCH_RADIUS_KM) continue;

    if (pickupProj.segmentIndex >= dropoffProj.segmentIndex) continue;

    const passengerDistKm = polylineDistanceKm(polyline, pickupProj.segmentIndex, dropoffProj.segmentIndex);
    const totalRouteDistKm = route.distanceKm;

    const fareResult = calculatePassengerFare({
      passengerDistanceKm: passengerDistKm,
      allPassengerDistancesKm: [passengerDistKm],
      totalRouteDistanceKm: totalRouteDistKm,
      fuelPricePhp: route.id ? 65 : 65,
    });

    const currentPos: RoutePoint = { lat: route.currentLat, lng: route.currentLng };
    const distToPickup = haversineKm(currentPos, pickupProj.snapped);
    const pickupEtaMin = Math.round((distToPickup / 30) * 60);

    matches.push({
      routeId: route.id,
      driverId: route.driverId,
      pickupSnapped: pickupProj.snapped,
      dropoffSnapped: dropoffProj.snapped,
      passengerDistKm,
      fare: fareResult.fare,
      matchingFee: fareResult.matchingFee,
      pickupEtaMin,
    });
  }

  if (matches.length === 0) {
    res.json({ matched: false, message: "No drivers found on your route. Try again in a few minutes." });
    return;
  }

  matches.sort((a, b) => a.pickupEtaMin - b.pickupEtaMin);
  const best = matches[0];

  console.log("[MATCH-STAGE-2] Best match selected:", { routeId: best.routeId, driverId: best.driverId, pickupEtaMin: best.pickupEtaMin });

  const [passenger] = await db.select({
    id: usersTable.id, name: usersTable.name, rating: usersTable.rating, avatar: usersTable.avatar,
  }).from(usersTable).where(eq(usersTable.id, passengerId)).limit(1);

  const matchPayload = {
    passengerId,
    passengerName: passenger?.name ?? "Passenger",
    passengerRating: passenger?.rating ?? 5.0,
    passengerAvatar: passenger?.avatar ?? null,
    routeId: best.routeId,
    pickup: { ...best.pickupSnapped, name: pickupName },
    dropoff: { ...best.dropoffSnapped, name: dropoffName },
    distanceKm: best.passengerDistKm,
    fare: best.fare,
    matchingFee: best.matchingFee,
    total: best.fare + best.matchingFee,
    pickupEtaMin: best.pickupEtaMin,
  };

  try {
    getIo().to(`user:${best.driverId}`).emit("match:request", matchPayload);
  } catch {
    // socket not initialized yet — ignore
  }

  console.log("[MATCH-STAGE-3] match:request emitted to driver:", best.driverId);

  // 30-second driver response timeout — auto-decline if driver doesn't respond
  const timeoutKey = `${best.routeId}:${passengerId}`;
  const timeout = setTimeout(() => {
    getIo().to(`user:${passengerId}`).emit("match:declined", {
      message: "No drivers available. Please try again.",
    });
    matchTimeouts.delete(timeoutKey);
  }, 30000);
  matchTimeouts.set(timeoutKey, timeout);

  res.json({
    matched: true,
    routeId: best.routeId,
    driverId: best.driverId,
    pickup: best.pickupSnapped,
    dropoff: best.dropoffSnapped,
    pickupName,
    dropoffName,
    distanceKm: best.passengerDistKm,
    fare: best.fare,
    matchingFee: best.matchingFee,
    total: best.fare + best.matchingFee,
    pickupEtaMin: best.pickupEtaMin,
  });
});

router.post("/:id/rate", requireAuth, async (req, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }
  const { rating } = parsed.data;
  const raterId = req.user!.sub;

  const [ride] = await db.select().from(ridesTable)
    .where(eq(ridesTable.id, req.params.id)).limit(1);
  if (!ride) { res.status(404).json({ error: "Ride not found" }); return; }

  if (ride.driverId === raterId) {
    const passengerId = parsed.data.passengerId;
    if (!passengerId) { res.status(400).json({ error: "passengerId required" }); return; }
    await db.update(ridePassengersTable)
      .set({ passengerRating: rating, ratedAt: new Date() })
      .where(and(eq(ridePassengersTable.rideId, ride.id), eq(ridePassengersTable.passengerId, passengerId)));

    const [passenger] = await db.select().from(usersTable).where(eq(usersTable.id, passengerId)).limit(1);
    if (passenger) {
      const newCount = passenger.ratingCount + 1;
      const newRating = (passenger.rating * passenger.ratingCount + rating) / newCount;
      await db.update(usersTable).set({ rating: Math.round(newRating * 10) / 10, ratingCount: newCount })
        .where(eq(usersTable.id, passengerId));
    }
  } else {
    const [rp] = await db.select().from(ridePassengersTable)
      .where(and(eq(ridePassengersTable.rideId, ride.id), eq(ridePassengersTable.passengerId, raterId))).limit(1);
    if (!rp) { res.status(403).json({ error: "You were not a passenger on this ride" }); return; }

    await db.update(ridePassengersTable)
      .set({ driverRatingGiven: rating, ratedAt: new Date() })
      .where(eq(ridePassengersTable.id, rp.id));

    const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, ride.driverId)).limit(1);
    if (driver) {
      const newCount = driver.ratingCount + 1;
      const newRating = (driver.rating * driver.ratingCount + rating) / newCount;
      await db.update(usersTable).set({ rating: Math.round(newRating * 10) / 10, ratingCount: newCount })
        .where(eq(usersTable.id, ride.driverId));
    }
  }

  res.json({ success: true, message: "Rating submitted" });
});

export default router;
