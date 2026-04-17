import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql, relations } from "drizzle-orm";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vehiclesTable = pgTable("vehicles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  plate: text("plate").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  seats: integer("seats").notNull(),
  fuelEfficiency: real("fuel_efficiency").notNull().default(20),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const vehicleRelations = relations(vehiclesTable, ({ one }) => ({
  user: one(usersTable, { fields: [vehiclesTable.userId], references: [usersTable.id] }),
}));

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectVehicleSchema = createSelectSchema(vehiclesTable);
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
