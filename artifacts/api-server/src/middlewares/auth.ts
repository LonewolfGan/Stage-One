import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/auth";

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
