import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import ridesRouter from "./rides.js";
import routeRouter from "./route.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/rides", ridesRouter);
router.use(routeRouter);

export default router;
