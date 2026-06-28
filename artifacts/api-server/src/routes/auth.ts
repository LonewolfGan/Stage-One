import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, usersTable, providersTable, emailVerificationTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, verifyToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";
import { adminAuth } from "../lib/firebase";
import { logger } from "../lib/logger";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["CLIENT", "OWNER"]).default("CLIENT"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }
  const { email, phone, password, name, role } = parse.data;

  const existingEmail = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (existingEmail) {
    res.status(409).json({ code: "AUTH-001", message: "Cet email est déjà utilisé" });
    return;
  }

  const existingPhone = await db.query.usersTable.findFirst({ where: eq(usersTable.phone, phone) });
  if (existingPhone) {
    res.status(409).json({ code: "AUTH-002", message: "Ce numéro de téléphone est déjà utilisé" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();

  const [user] = await db
    .insert(usersTable)
    .values({ id: userId, email, phone, passwordHash, name, role, emailVerified: false, phoneVerified: false })
    .returning({ id: usersTable.id, email: usersTable.email, phone: usersTable.phone, name: usersTable.name, role: usersTable.role });

  const token = await signToken({ sub: user.id, role: user.role });
  const refreshToken = await signToken({ sub: user.id, role: user.role }, "7d");

  res.status(201).json({ user, token, refreshToken, requiresPhoneVerification: true });
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides" });
    return;
  }
  const { email, password } = parse.data;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (!user) {
    res.status(401).json({ code: "ERR-002", message: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ code: "ERR-002", message: "Email ou mot de passe incorrect" });
    return;
  }

  let providerId: string | undefined;
  if (user.role === "OWNER") {
    const provider = await db.query.providersTable.findFirst({ where: eq(providersTable.ownerId, user.id) });
    providerId = provider?.id;
  }

  const token = await signToken({ sub: user.id, role: user.role, providerId });
  const refreshToken = await signToken({ sub: user.id, role: user.role, providerId }, "7d");

  res.json({
    token,
    refreshToken,
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified },
  });
});

// Verify phone — uses Firebase idToken when available, mock otherwise
router.post("/verify-phone", requireAuth, async (req, res) => {
  const { idToken, code } = req.body as { idToken?: string; code?: string };

  const userId = req.user!.sub;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }

  if (adminAuth && idToken) {
    // Real Firebase verification
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (!decoded.phone_number || decoded.phone_number !== user.phone) {
        res.status(400).json({ code: "AUTH-003", message: "Le numéro Firebase ne correspond pas au compte" });
        return;
      }
    } catch (err) {
      res.status(400).json({ code: "AUTH-003", message: "idToken Firebase invalide" });
      return;
    }
  } else {
    // Mock path — only accepts any non-empty code (development only)
    if (!code) {
      res.status(400).json({ code: "ERR-001", message: "code requis (mode développement)" });
      return;
    }
  }

  await db.update(usersTable).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, userId));
  res.json({ message: "Téléphone vérifié avec succès" });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ code: "ERR-001", message: "refreshToken requis" });
    return;
  }
  try {
    const payload = await verifyToken(refreshToken);
    const newToken = await signToken({ sub: payload.sub, role: payload.role, providerId: payload.providerId });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ code: "ERR-002", message: "refreshToken invalide" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.user!.sub),
    columns: { passwordHash: false },
  });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  res.json(user);
});

// ── Profile update ────────────────────────────────────────────────────────────

const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
});

router.put("/profile", requireAuth, async (req, res) => {
  const parse = profileUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }

  const userId = req.user!.sub;
  const { name, email, phone } = parse.data;

  const current = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!current) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };

  if (name) updates.name = name;

  if (email && email !== current.email) {
    const exists = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (exists) {
      res.status(409).json({ code: "AUTH-001", message: "Cet email est déjà utilisé" });
      return;
    }
    updates.email = email;
    updates.emailVerified = false;
  }

  if (phone && phone !== current.phone) {
    const exists = await db.query.usersTable.findFirst({ where: eq(usersTable.phone, phone) });
    if (exists) {
      res.status(409).json({ code: "AUTH-002", message: "Ce numéro est déjà utilisé" });
      return;
    }
    updates.phone = phone;
    updates.phoneVerified = false;
  }

  await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));

  const updated = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: { passwordHash: false },
  });
  res.json(updated);
});

// ── Email verification ────────────────────────────────────────────────────────

router.post("/send-email-verification", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  if (user.emailVerified) {
    res.json({ message: "Email déjà vérifié" });
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

  await db
    .delete(emailVerificationTokensTable)
    .where(eq(emailVerificationTokensTable.userId, userId));

  await db.insert(emailVerificationTokensTable).values({ userId, token, expiresAt });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5000";
  const link = `${frontendUrl}/verify-email?token=${token}`;

  logger.info({ userId, link }, "[DEV] Lien de vérification email");

  res.json({ message: "Email envoyé", devLink: link });
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ code: "ERR-001", message: "Token manquant" });
    return;
  }

  const record = await db.query.emailVerificationTokensTable.findFirst({
    where: and(
      eq(emailVerificationTokensTable.token, token),
      gt(emailVerificationTokensTable.expiresAt, new Date()),
    ),
  });

  if (!record) {
    res.status(400).json({ code: "AUTH-004", message: "Lien invalide ou expiré" });
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(usersTable.id, record.userId));

  await db
    .delete(emailVerificationTokensTable)
    .where(eq(emailVerificationTokensTable.token, token));

  res.json({ success: true, message: "Email vérifié avec succès" });
});

export default router;
