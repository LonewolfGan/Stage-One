import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/auth";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ code: "ERR-002", message: "Non authentifié" });
    return;
  }
  try {
    const token = header.slice(7);
    req.user = await verifyToken(token);
    next();
  } catch {
    res.status(401).json({ code: "ERR-002", message: "Token invalide ou expiré" });
  }
}

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "OWNER" && req.user?.role !== "ADMIN") {
      res.status(403).json({ code: "ERR-003", message: "Accès réservé aux prestataires" });
      return;
    }
    next();
  });
}

const PLAN_HIERARCHY: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };

export function requirePlan(minPlan: "PRO" | "BUSINESS") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const providerId = req.user?.providerId;
    if (!providerId) {
      res.status(403).json({ code: "ERR-PLAN", message: `Cette fonctionnalité nécessite le plan ${minPlan}` });
      return;
    }
    const sub = await db.query.subscriptionsTable.findFirst({
      where: eq(subscriptionsTable.providerId, providerId),
    });
    const currentLevel = PLAN_HIERARCHY[sub?.plan ?? "FREE"] ?? 0;
    const requiredLevel = PLAN_HIERARCHY[minPlan];
    if (currentLevel < requiredLevel) {
      res.status(403).json({
        code: "ERR-PLAN",
        message: `Cette fonctionnalité nécessite le plan ${minPlan}`,
        currentPlan: sub?.plan ?? "FREE",
        requiredPlan: minPlan,
      });
      return;
    }
    next();
  };
}
