import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import router from "./routes";
import { stripeWebhookHandler } from "./routes/webhook";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust Replit's reverse proxy so rate-limit & IP detection work correctly
app.set("trust proxy", 1);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Gzip/Brotli compression for all responses (skips already-compressed types)
app.use(compression());

// CORS — in dev and when no FRONTEND_URL is set, reflect any origin so that
// ngrok tunnels, Replit preview proxy, and local browsers all work without
// adding their URL to a list. In production, restrict to FRONTEND_URL.
const rawAllowed = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests (server-to-server, curl) have no Origin header
      if (!origin) return callback(null, true);

      // In dev with no FRONTEND_URL: reflect any origin — ngrok, Replit preview, etc.
      if (!rawAllowed || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // Production: validate against the comma-separated FRONTEND_URL list
      const allowed = rawAllowed.split(",").map((s) => s.trim());
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Stripe webhook — MUST be before express.json() to preserve raw body
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

// Body parsers (after webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth rate limiting (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Trop de tentatives, réessayez dans 15 minutes." },
  skip: () => false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify-phone", authLimiter);

app.use("/api", router);

// ── Production: serve compiled frontend ─────────────────────────────────────
// In production the Vite dev proxy is gone. Express takes over:
// static assets from artifacts/pstagev1/dist/public, SPA fallback for
// any non-/api route (client-side routing via Wouter).
if (process.env.NODE_ENV === "production") {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.resolve(thisDir, "../../pstagev1/dist/public");
  app.use(express.static(staticDir, { maxAge: "1y", immutable: true }));
  // SPA fallback — everything that is not /api gets index.html
  app.get("*splat", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
