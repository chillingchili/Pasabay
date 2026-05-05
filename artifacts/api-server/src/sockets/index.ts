import type { Server, Socket } from "socket.io";
import { db } from "@workspace/db";
import { activeRoutesTable, ridesTable, ridePassengersTable, usersTable, vehiclesTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifyAccessToken } from "../lib/jwt.js";
import { getRoute, projectPointOnPolyline, polylineDistanceKm, haversineKm } from "../lib/osrm.js";
import { calculatePassengerFare, MATCHING_FEE_PHP as MATCHING_FEE } from "../lib/fare.js";
import type { RoutePoint } from "../lib/osrm.js";
import { logger } from "../lib/logger.js";

interface DriverSession {
  socketId: string;
  userId: string;
  routeId: string;
  currentLat: number;
  currentLng: number;
  lastSeen: number;
}

const driverSessions = new Map<string, DriverSession>();
const passengerSockets = new Map<string, string>();
export const matchTimeouts = new Map<string, NodeJS.Timeout>();
export const declinedPairs = new Map<string, number>(); // "driverId:passengerId" → timestamp

async function authenticateSocket(socket: Socket): Promise<string | null> {
  try {
    const token = socket.handshake.auth.token as string;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", async (socket) => {
    const userId = await authenticateSocket(socket);
    if (!userId) {
      logger.warn({ socketId: socket.id }, "Unauthenticated socket connection rejected");
      socket.disconnect(true);
      return;
    }

    logger.info({ socketId: socket.id, userId }, "Authenticated socket connected");
    socket.join(`user:${userId}`);

    socket.on("driver:online", async (data: {
      originName: string; originLat: number; originLng: number;
      destName: string; destLat: number; destLng: number;
    }) => {
      try {
        const origin: RoutePoint = { lat: data.originLat, lng: data.originLng };
        const dest: RoutePoint = { lat: data.destLat, lng: data.destLng };

        const route = await getRoute(origin, dest);
        if (!route) {
          socket.emit("driver:error", { message: "Could not calculate route. Check your connection." });
          return;
        }

        const [vehicle] = await db.select().from(vehiclesTable)
          .where(eq(vehiclesTable.userId, userId)).limit(1);

        const maxPassengers = vehicle ? vehicle.seats - 1 : 3;
        const availableSeats = String(maxPassengers);

        const existing = await db.select().from(activeRoutesTable)
          .where(and(eq(activeRoutesTable.driverId, userId), eq(activeRoutesTable.status, "active")));

        let routeId: string;

        if (existing.length > 0) {
          const [updated] = await db.update(activeRoutesTable).set({
            originName: data.originName, originLat: data.originLat, originLng: data.originLng,
            destName: data.destName, destLat: data.destLat, destLng: data.destLng,
            polyline: route.polyline, distanceKm: route.distanceKm,
            currentLat: data.originLat, currentLng: data.originLng,
            availableSeats,
            status: "active", updatedAt: new Date(),
          }).where(eq(activeRoutesTable.id, existing[0].id)).returning();
          routeId = updated.id;
        } else {
          const [created] = await db.insert(activeRoutesTable).values({
            driverId: userId,
            originName: data.originName, originLat: data.originLat, originLng: data.originLng,
            destName: data.destName, destLat: data.destLat, destLng: data.destLng,
            polyline: route.polyline, distanceKm: route.distanceKm,
            currentLat: data.originLat, currentLng: data.originLng,
            availableSeats,
          }).returning();
          routeId = created.id;
        }

        driverSessions.set(userId, {
          socketId: socket.id, userId, routeId,
          currentLat: data.originLat, currentLng: data.originLng, lastSeen: Date.now(),
        });

        console.log("[MATCH-STAGE-0] Driver online:", { userId, routeId });

        socket.join("drivers:active");
        socket.emit("driver:route_set", {
          routeId, distanceKm: route.distanceKm,
          durationMin: Math.round(route.durationSec / 60),
          polyline: route.polyline,
        });
        logger.info({ userId, routeId }, "Driver went online");
      } catch (err) {
        logger.error({ err, userId }, "driver:online error");
        socket.emit("driver:error", { message: "Failed to start route" });
      }
    });

    socket.on("driver:location", async (data: { lat: number; lng: number; heading?: number }) => {
      const session = driverSessions.get(userId);
      if (!session) return;

      session.currentLat = data.lat;
      session.currentLng = data.lng;
      session.lastSeen = Date.now();

      await db.update(activeRoutesTable)
        .set({ currentLat: data.lat, currentLng: data.lng, updatedAt: new Date() })
        .where(eq(activeRoutesTable.id, session.routeId));

      io.to("drivers:active").emit("driver:location_update", {
        driverId: userId, routeId: session.routeId,
        lat: data.lat, lng: data.lng, heading: data.heading,
      });
    });

    socket.on("driver:offline", async () => {
      const session = driverSessions.get(userId);
      if (session) {
        await db.update(activeRoutesTable)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(activeRoutesTable.id, session.routeId));
        driverSessions.delete(userId);
      }
      socket.leave("drivers:active");
      socket.emit("driver:offline_confirmed");
      logger.info({ userId }, "Driver went offline");
    });

    socket.on("driver:arrived", async (data: { rideId: string; passengerId?: string }) => {
      try {
        const session = driverSessions.get(userId);
        if (!session) {
          socket.emit("driver:error", { message: "No active route" });
          return;
        }

        if (!data.rideId) {
          socket.emit("driver:error", { message: "No ride ID provided" });
          return;
        }

        const [ride] = await db.select().from(ridesTable)
          .where(and(eq(ridesTable.id, data.rideId), eq(ridesTable.driverId, userId)))
          .limit(1);

        if (!ride) {
          socket.emit("driver:error", { message: "No matched ride found" });
          return;
        }

        await db.update(ridesTable)
          .set({ status: "driver_en_route" as any })
          .where(eq(ridesTable.id, ride.id));

        if (data.passengerId) {
          const [passenger] = await db.select().from(ridePassengersTable)
            .where(and(eq(ridePassengersTable.rideId, ride.id), eq(ridePassengersTable.passengerId, data.passengerId)));
          if (passenger) {
            await db.update(ridePassengersTable)
              .set({ status: "at_pickup" })
              .where(eq(ridePassengersTable.id, passenger.id));
            io.to(`user:${passenger.passengerId}`).emit("driver:arrived", {
              rideId: ride.id,
              meetingSpot: { lat: passenger.pickupLat, lng: passenger.pickupLng, name: passenger.pickupName },
            });
          }
          socket.emit("driver:arrived_confirmed", { rideId: ride.id, passengerId: data.passengerId });
          console.log("[MATCH-STAGE-5] Driver arrived:", { rideId: ride.id, passengerId: data.passengerId });
        } else {
          const passengers = await db.select().from(ridePassengersTable)
            .where(eq(ridePassengersTable.rideId, ride.id));
          for (const passenger of passengers) {
            io.to(`user:${passenger.passengerId}`).emit("driver:arrived", {
              rideId: ride.id,
              meetingSpot: { lat: passenger.pickupLat, lng: passenger.pickupLng, name: passenger.pickupName },
            });
          }
          socket.emit("driver:arrived_confirmed", { rideId: ride.id });
          console.log("[MATCH-STAGE-5] Driver arrived (all):", { rideId: ride.id, passengerCount: passengers.length });
        }

        logger.info({ rideId: ride.id, userId }, "Driver arrived at meeting spot");
      } catch (err) {
        logger.error({ err, userId }, "driver:arrived error");
        socket.emit("driver:error", { message: "Failed to confirm arrival" });
      }
    });

    socket.on("driver:start-trip", async (data: { rideId: string; passengerId?: string }) => {
      try {
        if (!data.rideId) {
          socket.emit("driver:error", { message: "No ride ID provided" });
          return;
        }

        const [ride] = await db.select().from(ridesTable)
          .where(and(eq(ridesTable.id, data.rideId), eq(ridesTable.driverId, userId)))
          .limit(1);

        if (!ride) {
          socket.emit("driver:error", { message: "No matched ride found" });
          return;
        }

        if (data.passengerId) {
          const [passenger] = await db.select().from(ridePassengersTable)
            .where(and(eq(ridePassengersTable.rideId, ride.id), eq(ridePassengersTable.passengerId, data.passengerId)));
          if (passenger) {
            await db.update(ridePassengersTable)
              .set({ status: "onboard" })
              .where(eq(ridePassengersTable.id, passenger.id));
            io.to(`user:${passenger.passengerId}`).emit("driver:start-trip", {
              rideId: ride.id,
            });
          }
          socket.emit("driver:start-trip_confirmed", { rideId: ride.id, passengerId: data.passengerId });
          console.log("[MATCH-STAGE-7] Driver started trip:", { rideId: ride.id, passengerId: data.passengerId });
        } else {
          const passengers = await db.select().from(ridePassengersTable)
            .where(eq(ridePassengersTable.rideId, ride.id));
          for (const passenger of passengers) {
            io.to(`user:${passenger.passengerId}`).emit("driver:start-trip", {
              rideId: ride.id,
            });
          }
          socket.emit("driver:start-trip_confirmed", { rideId: ride.id });
          console.log("[MATCH-STAGE-7] Driver started trip (all):", { rideId: ride.id, passengerCount: passengers.length });
        }

        logger.info({ rideId: ride.id, userId }, "Driver started trip");
      } catch (err) {
        logger.error({ err, userId }, "driver:start-trip error");
        socket.emit("driver:error", { message: "Failed to confirm trip start" });
      }
    });

    socket.on("match:accept", async (data: { routeId: string; passengerId: string; pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; pickupName: string; dropoffName: string; fare: number; matchingFee: number; distanceKm: number }) => {
      try {
        const timeoutKey = `${data.routeId}:${data.passengerId}`;
        const existingTimeout = matchTimeouts.get(timeoutKey);
        if (existingTimeout) { clearTimeout(existingTimeout); matchTimeouts.delete(timeoutKey); }

        const session = driverSessions.get(userId);
        if (!session) { socket.emit("driver:error", { message: "No active route" }); return; }

        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
        const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.userId, userId)).limit(1);

        const [route] = await db.select().from(activeRoutesTable).where(eq(activeRoutesTable.id, session.routeId)).limit(1);
        if (!route) { socket.emit("driver:error", { message: "No active route" }); return; }

        const availableSeats = parseInt(route.availableSeats, 10);
        if (availableSeats <= 0) {
          socket.emit("driver:error", { message: "No available seats. Vehicle is full." });
          return;
        }

        const existingRides = await db.select().from(ridesTable)
          .where(and(eq(ridesTable.routeId, session.routeId), eq(ridesTable.driverId, userId), eq(ridesTable.status, "matched")));

        let rideId: string;
        let finalFare = data.fare;
        let finalMatchingFee = data.matchingFee;

        if (existingRides.length > 0) {
          rideId = existingRides[0].id;
          const rideFuelPrice = existingRides[0].fuelPricePhp ?? 65;

          await db.insert(ridePassengersTable).values({
            rideId,
            passengerId: data.passengerId,
            pickupName: data.pickupName, pickupLat: data.pickupLat, pickupLng: data.pickupLng,
            dropoffName: data.dropoffName, dropoffLat: data.dropoffLat, dropoffLng: data.dropoffLng,
            distanceKm: data.distanceKm,
            fare: 0,
            matchingFee: MATCHING_FEE,
            status: "matched",
          });

          const allPassengers = await db.select().from(ridePassengersTable)
            .where(eq(ridePassengersTable.rideId, rideId));

          const allDistances = allPassengers.map(p => p.distanceKm);

          for (const passenger of allPassengers) {
            const recalculated = calculatePassengerFare({
              passengerDistanceKm: passenger.distanceKm,
              allPassengerDistancesKm: allDistances,
              totalRouteDistanceKm: route.distanceKm,
              fuelPricePhp: rideFuelPrice,
            });
            await db.update(ridePassengersTable)
              .set({ fare: recalculated.fare })
              .where(eq(ridePassengersTable.id, passenger.id));
            io.to(`user:${passenger.passengerId}`).emit("fare:updated", {
              rideId,
              fare: recalculated.fare,
              matchingFee: MATCHING_FEE,
              total: recalculated.fare + MATCHING_FEE,
              note: "Fare recalculated — another passenger joined your ride",
            });
          }

          const newPassengerEntry = allPassengers.find(p => p.passengerId === data.passengerId);
          finalFare = newPassengerEntry?.fare ?? 0;

          await db.update(activeRoutesTable)
            .set({ availableSeats: String(availableSeats - 1), updatedAt: new Date() })
            .where(eq(activeRoutesTable.id, session.routeId));

          console.log("[MATCH-STAGE-4a] Driver accepted — added to existing ride:", { rideId, passengerId: data.passengerId, remainingSeats: availableSeats - 1, allPassengers: allPassengers.length });
        } else {
          const [ride] = await db.insert(ridesTable).values({
            routeId: session.routeId,
            driverId: userId,
            vehicleId: vehicle?.id,
            fromName: route.originName, fromLat: route.originLat, fromLng: route.originLng,
            toName: route.destName, toLat: route.destLat, toLng: route.destLng,
            totalDistanceKm: route.distanceKm,
            fuelPricePhp: 65,
            status: "matched",
          }).returning();
          rideId = ride.id;

          await db.insert(ridePassengersTable).values({
            rideId,
            passengerId: data.passengerId,
            pickupName: data.pickupName, pickupLat: data.pickupLat, pickupLng: data.pickupLng,
            dropoffName: data.dropoffName, dropoffLat: data.dropoffLat, dropoffLng: data.dropoffLng,
            distanceKm: data.distanceKm,
            fare: data.fare,
            matchingFee: data.matchingFee,
            status: "matched",
          });

          await db.update(activeRoutesTable)
            .set({ availableSeats: String(availableSeats - 1), updatedAt: new Date() })
            .where(eq(activeRoutesTable.id, session.routeId));

          console.log("[MATCH-STAGE-4a] Driver accepted — ride created:", { rideId, passengerId: data.passengerId, remainingSeats: availableSeats - 1 });
        }

        const driverInfo = user ? {
          id: user.id, name: user.name, rating: user.rating, avatar: user.avatar,
          vehicle: vehicle ? { make: vehicle.make, model: vehicle.model, color: vehicle.color, plate: vehicle.plate, seats: vehicle.seats } : null,
        } : null;

        for (const [pairKey] of declinedPairs) {
          if (pairKey.startsWith(`${userId}:`)) declinedPairs.delete(pairKey);
        }

        io.to(`user:${data.passengerId}`).emit("match:confirmed", {
          rideId,
          driver: driverInfo,
          pickup: { lat: data.pickupLat, lng: data.pickupLng, name: data.pickupName },
          dropoff: { lat: data.dropoffLat, lng: data.dropoffLng, name: data.dropoffName },
          fare: finalFare, matchingFee: finalMatchingFee,
          total: finalFare + finalMatchingFee,
          distanceKm: data.distanceKm,
        });

        socket.emit("match:accepted_confirmed", { rideId, passengerId: data.passengerId });

        console.log("[MATCH-STAGE-4a] match:confirmed emitted to passenger:", { rideId });

        logger.info({ rideId, driverId: userId, passengerId: data.passengerId }, "Match confirmed");
      } catch (err) {
        logger.error({ err, userId }, "match:accept error");
        socket.emit("driver:error", { message: "Failed to confirm match" });
      }
    });

    socket.on("match:decline", (data: { passengerId: string }) => {
      for (const [key, timeout] of matchTimeouts.entries()) {
        if (key.includes(data.passengerId)) {
          clearTimeout(timeout);
          matchTimeouts.delete(key);
        }
      }
      declinedPairs.set(`${userId}:${data.passengerId}`, Date.now());
      console.log("[MATCH-STAGE-4b] Driver declined:", { driverId: userId, passengerId: data.passengerId });
      io.to(`user:${data.passengerId}`).emit("match:declined", {
        message: "Driver declined. Searching for another driver...",
      });
    });

    socket.on("ride:complete", async (data: { rideId: string }) => {
      try {
        const [updated] = await db.update(ridesTable)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(ridesTable.id, data.rideId))
          .returning();

        const passengers = await db.select().from(ridePassengersTable)
          .where(eq(ridePassengersTable.rideId, data.rideId));

        await db.update(usersTable)
          .set({ totalRides: sql`${usersTable.totalRides} + 1` })
          .where(eq(usersTable.id, userId));

        for (const p of passengers) {
          await db.update(ridePassengersTable)
            .set({ status: "completed" })
            .where(eq(ridePassengersTable.id, p.id));

          await db.update(usersTable)
            .set({ totalRides: sql`${usersTable.totalRides} + 1` })
            .where(eq(usersTable.id, p.passengerId));

          io.to(`user:${p.passengerId}`).emit("ride:completed", {
            rideId: data.rideId,
            fare: p.fare, matchingFee: p.matchingFee, total: p.fare + p.matchingFee,
            distanceKm: p.distanceKm,
            message: "Ride completed! Please rate your driver.",
          });
        }
        socket.emit("ride:completed_confirmed", { rideId: data.rideId });
      } catch (err) {
        logger.error({ err }, "ride:complete error");
      }
    });

    socket.on("ride:cancel", async (data: { rideId: string; reason: string }) => {
      try {
        const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, data.rideId)).limit(1);
        if (!ride) return;

        const isDriver = ride.driverId === userId;
        const newStatus = isDriver ? "canceled_driver" : "canceled_passenger";

        await db.update(ridesTable)
          .set({ status: newStatus as any })
          .where(eq(ridesTable.id, data.rideId));

        const passengers = await db.select().from(ridePassengersTable)
          .where(eq(ridePassengersTable.rideId, data.rideId));

        const notifyId = isDriver ? passengers[0]?.passengerId : ride.driverId;
        if (notifyId) {
          io.to(`user:${notifyId}`).emit("ride:canceled", {
            rideId: data.rideId,
            canceledBy: isDriver ? "driver" : "passenger",
            reason: data.reason,
          });
        }
      } catch (err) {
        logger.error({ err }, "ride:cancel error");
      }
    });

    socket.on("ride:no_show", async (data: { rideId: string; passengerId: string }) => {
      try {
        const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, data.rideId)).limit(1);
        if (!ride || ride.driverId !== userId) return;

        const [rp] = await db.select().from(ridePassengersTable)
          .where(and(eq(ridePassengersTable.rideId, data.rideId), eq(ridePassengersTable.passengerId, data.passengerId)))
          .limit(1);
        if (!rp) return;

        await db.update(ridePassengersTable)
          .set({ status: "no_show" })
          .where(eq(ridePassengersTable.id, rp.id));

        const [route] = await db.select().from(activeRoutesTable)
          .where(eq(activeRoutesTable.id, ride.routeId));
        if (route) {
          const seats = parseInt(route.availableSeats, 10);
          await db.update(activeRoutesTable)
            .set({ availableSeats: String(seats + 1), updatedAt: new Date() })
            .where(eq(activeRoutesTable.id, ride.routeId));
        }

        io.to(`user:${data.passengerId}`).emit("ride:no_show", {
          rideId: data.rideId,
          message: "The driver has marked you as a no-show. Please request a new ride.",
        });
        socket.emit("ride:no_show_confirmed", { rideId: data.rideId, passengerId: data.passengerId });
        logger.info({ rideId: data.rideId, driverId: userId, passengerId: data.passengerId }, "Passenger marked no-show");
      } catch (err) {
        logger.error({ err }, "ride:no_show error");
      }
    });

    socket.on("disconnect", async () => {
      // Clear timeouts for this user
      for (const [key, timeout] of matchTimeouts.entries()) {
        if (key.includes(userId)) {
          clearTimeout(timeout);
          matchTimeouts.delete(key);
        }
      }
      const session = driverSessions.get(userId);
      if (session && session.socketId === socket.id) {
        await db.update(activeRoutesTable)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(activeRoutesTable.id, session.routeId));
        driverSessions.delete(userId);
      }
      logger.info({ socketId: socket.id, userId }, "Socket disconnected");
    });
  });
}

export { driverSessions };
