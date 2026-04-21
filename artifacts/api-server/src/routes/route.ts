import { Router } from "express";
import { getRoute } from "../lib/osrm.js";
import type { RoutePoint } from "../lib/osrm.js";
import { z } from "zod/v4";

const router = Router();

const routeSchema = z.object({
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: z.number() }),
});

router.post("/route", async (req, res) => {
  const parsed = routeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation failed" });
    return;
  }

  const { origin, destination } = parsed.data;

  const route = await getRoute(origin as RoutePoint, destination as RoutePoint);
  if (!route) {
    res.status(502).json({ error: "Failed to calculate route" });
    return;
  }

  res.json(route);
});

export default router;