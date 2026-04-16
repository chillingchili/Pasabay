import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken, signRefreshToken, hashRefreshToken, verifyAccessToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod/v4";

const router = Router();

const signupSchema = z.object({
  email: z.string().email().endsWith("@usc.edu.ph", "Only @usc.edu.ph emails allowed"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  googleId: z.string(),
  email: z.string().email().endsWith("@usc.edu.ph", "Only @usc.edu.ph emails allowed"),
  name: z.string(),
  avatar: z.string().optional(),
});

async function issueTokens(userId: string, email: string, role: string) {
  const accessToken = await signAccessToken({ sub: userId, email, role });
  const refreshToken = await signRefreshToken(userId);
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokensTable).values({ userId, tokenHash, expiresAt });
  return { accessToken, refreshToken };
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation failed" });
    return;
  }
  const { email, password, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name }).returning();
  const tokens = await issueTokens(user.id, user.email, user.role);

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, activeRole: user.activeRole, schoolIdStatus: user.schoolIdStatus, driverStatus: user.driverStatus, rating: user.rating, totalRides: user.totalRides, avatar: user.avatar },
    ...tokens,
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const tokens = await issueTokens(user.id, user.email, user.role);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, activeRole: user.activeRole, schoolIdStatus: user.schoolIdStatus, driverStatus: user.driverStatus, rating: user.rating, totalRides: user.totalRides, avatar: user.avatar },
    ...tokens,
  });
});

router.post("/google", async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation failed" });
    return;
  }
  const { googleId, email, name, avatar } = parsed.data;

  let [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email)).limit(1);

  const isNew = !user;

  if (!user) {
    [user] = await db.insert(usersTable)
      .values({ email, name, googleId, avatar: avatar ?? null })
      .returning();
  } else if (!user.googleId) {
    [user] = await db.update(usersTable)
      .set({ googleId, avatar: avatar ?? user.avatar })
      .where(eq(usersTable.id, user.id))
      .returning();
  }

  const tokens = await issueTokens(user.id, user.email, user.role);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, activeRole: user.activeRole, schoolIdStatus: user.schoolIdStatus, driverStatus: user.driverStatus, rating: user.rating, totalRides: user.totalRides, avatar: user.avatar },
    isNew,
    ...tokens,
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.sub)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    activeRole: user.activeRole, schoolIdStatus: user.schoolIdStatus,
    driverStatus: user.driverStatus, rating: user.rating, totalRides: user.totalRides,
    avatar: user.avatar, shadowBanned: user.shadowBanned,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) { res.status(400).json({ error: "Missing refresh token" }); return; }

  const tokenHash = hashRefreshToken(refreshToken);
  const [stored] = await db.select().from(refreshTokensTable)
    .where(and(
      eq(refreshTokensTable.tokenHash, tokenHash),
      eq(refreshTokensTable.revoked, false),
      gt(refreshTokensTable.expiresAt, new Date()),
    )).limit(1);

  if (!stored) { res.status(401).json({ error: "Invalid or expired refresh token" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, stored.userId)).limit(1);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  await db.update(refreshTokensTable).set({ revoked: true }).where(eq(refreshTokensTable.id, stored.id));

  const tokens = await issueTokens(user.id, user.email, user.role);
  res.json(tokens);
});

router.post("/logout", requireAuth, async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await db.update(refreshTokensTable).set({ revoked: true })
      .where(eq(refreshTokensTable.tokenHash, tokenHash));
  }
  res.json({ success: true });
});

export default router;
