import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import providersRouter from "./providers";
import staffRouter from "./staff";
import servicesRouter from "./services";
import slotsRouter from "./slots";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/providers", providersRouter);
router.use("/providers/:slug/staff", staffRouter);
router.use("/providers/:slug/services", servicesRouter);
router.use("/providers/:slug/slots", slotsRouter);
router.use("/bookings", bookingsRouter);
router.use("/dashboard", dashboardRouter);

export default router;

// Note: /api/webhooks/stripe is registered directly in app.ts (before express.json)
// to preserve the raw request body required by stripe.webhooks.constructEvent()
