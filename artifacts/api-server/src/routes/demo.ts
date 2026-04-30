import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  vehiclesTable,
  activeRoutesTable,
  ridesTable,
  ridePassengersTable,
} from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { hashPassword } from "../lib/password.js";
import { signAccessToken } from "../lib/jwt.js";
import { getRoute, type RoutePoint } from "../lib/osrm.js";

const router = Router();

const DEMO_DRIVER_EMAIL = "demo-driver@usc.edu.ph";
const DEMO_PASSENGER_EMAIL = "demo-passenger@usc.edu.ph";
const DEMO_DRIVER_PASSWORD = "demodrive123";
const DEMO_PASSENGER_PASSWORD = "demopass123";

const DRIVER_ORIGIN: RoutePoint = { lat: 10.2992, lng: 123.8938 };
const DRIVER_DEST: RoutePoint = { lat: 10.3105, lng: 123.9179 };

// POST /api/demo/seed — create or find demo accounts, return tokens
router.post("/demo/seed", async (_req, res) => {
  try {
    // 1. Check if driver exists
    let [driver] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, DEMO_DRIVER_EMAIL))
      .limit(1);

    // 2. Create driver if not exists
    if (!driver) {
      const driverHash = await hashPassword(DEMO_DRIVER_PASSWORD);
      [driver] = await db
        .insert(usersTable)
        .values({
          email: DEMO_DRIVER_EMAIL,
          passwordHash: driverHash,
          name: "Juan Driver",
          role: "driver",
          activeRole: "driver",
          schoolIdStatus: "verified",
          driverStatus: "verified",
        })
        .returning();
    }

    // 3. Ensure vehicle exists for driver
    const [existingVehicle] = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.userId, driver.id))
      .limit(1);

    if (!existingVehicle) {
      await db.insert(vehiclesTable).values({
        userId: driver.id,
        plate: "ABC 1234",
        make: "Toyota",
        model: "Vios",
        year: 2022,
        color: "White",
        seats: 4,
        fuelEfficiency: 18,
      });
    }

    // 4. Check if passenger exists
    let [passenger] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, DEMO_PASSENGER_EMAIL))
      .limit(1);

    // 5. Create passenger if not exists
    if (!passenger) {
      const passengerHash = await hashPassword(DEMO_PASSENGER_PASSWORD);
      [passenger] = await db
        .insert(usersTable)
        .values({
          email: DEMO_PASSENGER_EMAIL,
          passwordHash: passengerHash,
          name: "Maria Passenger",
          role: "passenger",
          activeRole: "passenger",
          schoolIdStatus: "verified",
        })
        .returning();
    }

    // 6. Create or update active route for driver
    const existingRoute = await db
      .select()
      .from(activeRoutesTable)
      .where(
        and(
          eq(activeRoutesTable.driverId, driver.id),
          eq(activeRoutesTable.status, "active")
        )
      )
      .limit(1);

    // 7. Fetch OSRM polyline
    const osrmRoute = await getRoute(DRIVER_ORIGIN, DRIVER_DEST);
    const polyline = osrmRoute?.polyline ?? [DRIVER_ORIGIN, DRIVER_DEST];
    const distanceKm = osrmRoute?.distanceKm ?? 5.0;

    let routeId: string;

    if (existingRoute.length > 0) {
      // Update existing active route
      const [updated] = await db
        .update(activeRoutesTable)
        .set({
          originName: "USC Main Campus",
          originLat: DRIVER_ORIGIN.lat,
          originLng: DRIVER_ORIGIN.lng,
          destName: "SM City Cebu",
          destLat: DRIVER_DEST.lat,
          destLng: DRIVER_DEST.lng,
          polyline: polyline as any,
          distanceKm,
          currentLat: DRIVER_ORIGIN.lat,
          currentLng: DRIVER_ORIGIN.lng,
        })
        .where(eq(activeRoutesTable.id, existingRoute[0].id))
        .returning();
      routeId = updated.id;
    } else {
      // Insert new active route
      const [created] = await db
        .insert(activeRoutesTable)
        .values({
          driverId: driver.id,
          originName: "USC Main Campus",
          originLat: DRIVER_ORIGIN.lat,
          originLng: DRIVER_ORIGIN.lng,
          destName: "SM City Cebu",
          destLat: DRIVER_DEST.lat,
          destLng: DRIVER_DEST.lng,
          polyline: polyline as any,
          distanceKm,
          currentLat: DRIVER_ORIGIN.lat,
          currentLng: DRIVER_ORIGIN.lng,
        })
        .returning();
      routeId = created.id;
    }

    // 8. Generate JWT tokens
    const driverToken = await signAccessToken({
      sub: driver.id,
      email: driver.email,
      role: driver.role,
    });
    const passengerToken = await signAccessToken({
      sub: passenger.id,
      email: passenger.email,
      role: passenger.role,
    });

    // 9. Return
    res.json({
      driverToken,
      passengerToken,
      driverId: driver.id,
      passengerId: passenger.id,
      routeId,
    });
  } catch (err) {
    console.error("[demo/seed]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/demo/reset — clean up demo state
router.post("/demo/reset", async (_req, res) => {
  try {
    // 1. Find demo driver and passenger
    const [driver] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, DEMO_DRIVER_EMAIL))
      .limit(1);

    const [passenger] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, DEMO_PASSENGER_EMAIL))
      .limit(1);

    // 2. Set active routes for driver to "completed"
    if (driver) {
      await db
        .update(activeRoutesTable)
        .set({ status: "completed" })
        .where(
          and(
            eq(activeRoutesTable.driverId, driver.id),
            eq(activeRoutesTable.status, "active")
          )
        );
    }

    // 3. Cancel active rides where demo driver is driver
    if (driver) {
      const driverRides = await db
        .select({ id: ridesTable.id })
        .from(ridesTable)
        .where(
          and(
            eq(ridesTable.driverId, driver.id),
            inArray(ridesTable.status, ["matched", "driver_en_route", "passenger_picked_up"])
          )
        );

      if (driverRides.length > 0) {
        await db
          .update(ridesTable)
          .set({ status: "canceled_driver" })
          .where(
            inArray(
              ridesTable.id,
              driverRides.map((r) => r.id)
            )
          );
      }
    }

    // 4. Cancel active ride passengers for demo passenger
    if (passenger) {
      const passengerRides = await db
        .select({ id: ridePassengersTable.id })
        .from(ridePassengersTable)
        .where(
          and(
            eq(ridePassengersTable.passengerId, passenger.id),
            eq(ridePassengersTable.status, "matched")
          )
        );

      if (passengerRides.length > 0) {
        await db
          .update(ridePassengersTable)
          .set({ status: "canceled_passenger" })
          .where(
            inArray(
              ridePassengersTable.id,
              passengerRides.map((r) => r.id)
            )
          );
      }
    }

    res.json({ reset: true });
  } catch (err) {
    console.error("[demo/reset]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
