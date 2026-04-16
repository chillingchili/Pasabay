import { pgTable, text, integer, boolean, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["passenger", "driver"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "submitted", "verified", "rejected"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  googleId: text("google_id").unique(),
  avatar: text("avatar"),
  role: userRoleEnum("role").notNull().default("passenger"),
  schoolIdStatus: verificationStatusEnum("school_id_status").notNull().default("pending"),
  schoolIdImageUrl: text("school_id_image_url"),
  driverStatus: verificationStatusEnum("driver_status").notNull().default("pending"),
  driverLicenseImageUrl: text("driver_license_image_url"),
  rating: real("rating").notNull().default(5.0),
  ratingCount: integer("rating_count").notNull().default(0),
  totalRides: integer("total_rides").notNull().default(0),
  shadowBanned: boolean("shadow_banned").notNull().default(false),
  activeRole: userRoleEnum("active_role").notNull().default("passenger"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
