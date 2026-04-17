import { pgTable, text, real, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vehiclesTable } from "./vehicles";
import { activeRoutesTable } from "./active_routes";

export const rideStatusEnum = pgEnum("ride_status", [
  "matched",
  "driver_en_route",
  "passenger_picked_up",
  "completed",
  "canceled_driver",
  "canceled_passenger",
  "no_show",
]);

export const ridesTable = pgTable("rides", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: text("route_id").references(() => activeRoutesTable.id),
  driverId: text("driver_id").notNull().references(() => usersTable.id),
  vehicleId: text("vehicle_id").references(() => vehiclesTable.id),
  fromName: text("from_name").notNull(),
  fromLat: real("from_lat").notNull(),
  fromLng: real("from_lng").notNull(),
  toName: text("to_name").notNull(),
  toLat: real("to_lat").notNull(),
  toLng: real("to_lng").notNull(),
  totalDistanceKm: real("total_distance_km").notNull(),
  fuelPricePhp: real("fuel_price_php").notNull().default(65),
  status: rideStatusEnum("status").notNull().default("matched"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const ridePassengersTable = pgTable("ride_passengers", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: text("ride_id").notNull().references(() => ridesTable.id, { onDelete: "cascade" }),
  passengerId: text("passenger_id").notNull().references(() => usersTable.id),
  pickupName: text("pickup_name").notNull(),
  pickupLat: real("pickup_lat").notNull(),
  pickupLng: real("pickup_lng").notNull(),
  dropoffName: text("dropoff_name").notNull(),
  dropoffLat: real("dropoff_lat").notNull(),
  dropoffLng: real("dropoff_lng").notNull(),
  distanceKm: real("distance_km").notNull(),
  fare: real("fare").notNull(),
  matchingFee: real("matching_fee").notNull().default(8),
  status: text("status").notNull().default("matched"),
  passengerRating: integer("passenger_rating"),
  driverRatingGiven: integer("driver_rating_given"),
  ratedAt: timestamp("rated_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const rideRelations = relations(ridesTable, ({ one, many }) => ({
  driver: one(usersTable, { fields: [ridesTable.driverId], references: [usersTable.id] }),
  vehicle: one(vehiclesTable, { fields: [ridesTable.vehicleId], references: [vehiclesTable.id] }),
  passengers: many(ridePassengersTable),
}));

export const ridePassengerRelations = relations(ridePassengersTable, ({ one }) => ({
  ride: one(ridesTable, { fields: [ridePassengersTable.rideId], references: [ridesTable.id] }),
  passenger: one(usersTable, { fields: [ridePassengersTable.passengerId], references: [usersTable.id] }),
}));

export type Ride = typeof ridesTable.$inferSelect;
export type RidePassenger = typeof ridePassengersTable.$inferSelect;
