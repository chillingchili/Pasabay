import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { usersTable } from "./users";

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const refreshTokenRelations = relations(refreshTokensTable, ({ one }) => ({
  user: one(usersTable, { fields: [refreshTokensTable.userId], references: [usersTable.id] }),
}));

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
