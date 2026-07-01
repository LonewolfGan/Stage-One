import type { Response } from "express";

// ── Typed error codes ────────────────────────────────────────────────────────
export type AppErrorCode =
  | "ERR-001" // Validation — invalid input
  | "ERR-003" // Forbidden — not allowed
  | "ERR-004" // Not found
  | "ERR-005" // Conflict — slot taken, etc.
  | "ERR-006" // Conflict — cancellation window
  | "ERR-007"; // Conflict — already exists

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  "ERR-001": "Données invalides",
  "ERR-003": "Accès refusé",
  "ERR-004": "Ressource introuvable",
  "ERR-005": "Conflit",
  "ERR-006": "Annulation impossible",
  "ERR-007": "Déjà existant",
};

// ── Core factory ────────────────────────────────────────────────────────────
export function sendError(
  res: Response,
  status: number,
  code: AppErrorCode,
  message?: string,
  extra?: Record<string, unknown>,
): void {
  res.status(status).json({ code, message: message ?? DEFAULT_MESSAGES[code], ...extra });
}

// ── Convenience helpers ─────────────────────────────────────────────────────
export function badRequest(res: Response, errors: unknown): void {
  res.status(400).json({ code: "ERR-001", message: DEFAULT_MESSAGES["ERR-001"], errors });
}

export function notFound(res: Response, message?: string): void {
  sendError(res, 404, "ERR-004", message);
}

export function forbidden(res: Response, message?: string): void {
  sendError(res, 403, "ERR-003", message);
}

export function conflict(
  res: Response,
  code: "ERR-005" | "ERR-006" | "ERR-007",
  message: string,
): void {
  sendError(res, 409, code, message);
}
