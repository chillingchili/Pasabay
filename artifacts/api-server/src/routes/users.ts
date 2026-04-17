import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, vehiclesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { validateFuelEfficiency } from "../lib/fare.js";
import { z } from "zod/v4";

const router = Router();

const vehicleSchema = z.object({
  plate: z.string().min(4, "Invalid plate number"),
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(2),
  seats: z.number().int().min(1).max(7),
  fuelEfficiency: z.number().min(5).max(50).optional(),
});

router.get("/profile", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.sub)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [vehicle] = await db.select().from(vehiclesTable)
    .where(eq(vehiclesTable.userId, user.id)).limit(1);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ ...safeUser, vehicle: vehicle ?? null });
});

router.post("/school-id", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const [updated] = await db.update(usersTable)
    .set({ schoolIdStatus: "submitted", updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    message: "School ID submitted for review. You can proceed while we verify.",
    schoolIdStatus: updated.schoolIdStatus,
  });
});

router.post("/driver", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation failed" });
    return;
  }

  const { plate, make, model, year, color, seats, fuelEfficiency: rawEfficiency } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { valid, approved } = rawEfficiency
    ? validateFuelEfficiency(rawEfficiency, make, year)
    : { valid: true, approved: 20 };

  const existing = await db.select().from(vehiclesTable).where(eq(vehiclesTable.userId, userId));
  let vehicle;
  if (existing.length > 0) {
    [vehicle] = await db.update(vehiclesTable)
      .set({ plate, make, model, year, color, seats, fuelEfficiency: approved, updatedAt: new Date() })
      .where(eq(vehiclesTable.userId, userId))
      .returning();
  } else {
    [vehicle] = await db.insert(vehiclesTable)
      .values({ userId, plate, make, model, year, color, seats, fuelEfficiency: approved })
      .returning();
  }

  await db.update(usersTable)
    .set({ driverStatus: "submitted", role: "driver", activeRole: "driver", updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  res.json({
    vehicle,
    fuelEfficiencyApproved: valid,
    fuelEfficiency: approved,
    message: valid
      ? "Vehicle registered. Driver license under review."
      : `Fuel efficiency adjusted to estimated value: ${approved.toFixed(1)} km/L`,
  });
});

router.post("/switch-role", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const { role } = req.body as { role?: string };

  if (role !== "passenger" && role !== "driver") {
    res.status(400).json({ error: "Invalid role. Must be 'passenger' or 'driver'" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (role === "driver" && user.driverStatus !== "submitted" && user.driverStatus !== "verified") {
    res.status(403).json({
      error: "Complete driver verification first",
      driverStatus: user.driverStatus,
    });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ activeRole: role as any, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({ activeRole: updated.activeRole });
});

export default router;
