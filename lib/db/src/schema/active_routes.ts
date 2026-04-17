import { pgTable, text, real, jsonb, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { usersTable } from "./users";

export const routeStatusEnum = pgEnum("route_status", ["active", "completed", "canceled"]);

export interface RoutePoint {
  lat: number;
  lng: number;
}

export const activeRoutesTable = pgTable("active_routes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: text("driver_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  originName: text("origin_name").notNull(),
  originLat: real("origin_lat").notNull(),
  originLng: real("origin_lng").notNull(),
  destName: text("dest_name").notNull(),
  destLat: real("dest_lat").notNull(),
  destLng: real("dest_lng").notNull(),
  polyline: jsonb("polyline").notNull().$type<RoutePoint[]>(),
  distanceKm: real("distance_km").notNull(),
  currentLat: real("current_lat").notNull(),
  currentLng: real("current_lng").notNull(),
  status: routeStatusEnum("status").notNull().default("active"),
  availableSeats: text("available_seats").notNull().default("3"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const activeRouteRelations = relations(activeRoutesTable, ({ one }) => ({
  driver: one(usersTable, { fields: [activeRoutesTable.driverId], references: [usersTable.id] }),
}));

export type ActiveRoute = typeof activeRoutesTable.$inferSelect;
