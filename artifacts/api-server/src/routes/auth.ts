import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, usersTable, providersTable, emailVerificationTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, verifyToken, signPhoneToken, verifyPhoneToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { redis } from "../lib/redis";
import { sendSms } from "../lib/sms";

const router = Router();

// ── Phone number normalization ─────────────────────────────────────────────
function normalizePhone(phone: string): string {
  if (phone.startsWith("0") && phone.length === 10) return "+212" + phone.slice(1);
  return phone;
}

// ── In-memory OTP store (fallback when Redis is absent) ───────────────────
interface OtpEntry {
  code: string;
  codeExpiresAt: number;
  sendCount: number;
  sendCountExpiresAt: number;
}
const memOtpStore = new Map<string, OtpEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memOtpStore) {
    if (entry.codeExpiresAt < now && entry.sendCountExpiresAt < now) memOtpStore.delete(key);
  }
}, 60_000);

async function otp_checkRateLimit(key: string): Promise<boolean> {
  if (redis) {
    const rKey = `otp_rate:${key}`;
    const count = await redis.incr(rKey);
    if (count === 1) await redis.expire(rKey, 3600);
    return count <= 3;
  }
  const now = Date.now();
  const entry = memOtpStore.get(key);
  if (!entry || entry.sendCountExpiresAt < now) {
    const cur = memOtpStore.get(key) ?? { code: "", codeExpiresAt: 0, sendCount: 0, sendCountExpiresAt: 0 };
    memOtpStore.set(key, { ...cur, sendCount: 1, sendCountExpiresAt: now + 3_600_000 });
    return true;
  }
  entry.sendCount++;
  return entry.sendCount <= 3;
}

async function otp_save(key: string, code: string): Promise<void> {
  if (redis) {
    await redis.set(`otp:${key}`, code, "EX", 600);
  } else {
    const cur = memOtpStore.get(key) ?? { code: "", codeExpiresAt: 0, sendCount: 0, sendCountExpiresAt: 0 };
    memOtpStore.set(key, { ...cur, code, codeExpiresAt: Date.now() + 600_000 });
  }
}

async function otp_get(key: string): Promise<string | null> {
  if (redis) return redis.get(`otp:${key}`);
  const entry = memOtpStore.get(key);
  if (!entry || entry.codeExpiresAt < Date.now()) return null;
  return entry.code;
}

async function otp_delete(key: string): Promise<void> {
  if (redis) {
    await redis.del(`otp:${key}`);
  } else {
    const entry = memOtpStore.get(key);
    if (entry) memOtpStore.set(key, { ...entry, code: "", codeExpiresAt: 0 });
  }
}

// ── Schemas ────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["CLIENT", "OWNER"]).default("CLIENT"),
  phoneToken: z.string({ required_error: "phoneToken requis" }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ── POST /auth/register ────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }
  const { email, phone, password, name, role, phoneToken } = parse.data;

  // Verify phone token
  let verifiedPhone: string;
  try {
    verifiedPhone = await verifyPhoneToken(phoneToken);
  } catch {
    res.status(400).json({ code: "ERR-PHONE", message: "Token de vérification du téléphone invalide ou expiré. Recommencez la vérification." });
    return;
  }

  if (verifiedPhone !== normalizePhone(phone)) {
    res.status(400).json({ code: "ERR-PHONE", message: "Le numéro de téléphone ne correspond pas au token de vérification." });
    return;
  }

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
    .values({ id: userId, email, phone, passwordHash, name, role, emailVerified: false, phoneVerified: true })
    .returning({ id: usersTable.id, email: usersTable.email, phone: usersTable.phone, name: usersTable.name, role: usersTable.role, photoUrl: usersTable.photoUrl });

  const token = await signToken({ sub: user.id, role: user.role });
  const refreshToken = await signToken({ sub: user.id, role: user.role }, "7d");

  // Auto-generate email verification token
  let devEmailLink: string | undefined;
  try {
    const evToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);
    await db.insert(emailVerificationTokensTable).values({ userId, token: evToken, expiresAt });

    const replitDomain = process.env.REPLIT_DEV_DOMAIN
      ?? (process.env.REPL_SLUG && process.env.REPL_OWNER
        ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : null);
    const frontendUrl = process.env.FRONTEND_URL ?? (replitDomain ? `https://${replitDomain}` : "http://localhost:5000");
    const link = `${frontendUrl}/verify-email?token=${evToken}`;

    if (process.env.NODE_ENV !== "production") {
      devEmailLink = link;
      logger.info({ userId, link }, "[DEV] Email verification link");
    }

    const { sendMail } = await import("../lib/email");
    await sendMail({
      to: email,
      subject: "Vérifiez votre adresse email — PSTAGEV1",
      html: `<p>Bonjour ${name},</p><p>Cliquez sur ce lien pour vérifier votre email :</p><p><a href="${link}">${link}</a></p><p>Valable 24 heures.</p>`,
    });
  } catch (err) {
    logger.warn({ err }, "Email verification send failed — continuing");
  }

  res.status(201).json({ user, token, refreshToken, devEmailLink });
});

// ── POST /auth/login ───────────────────────────────────────────────────────
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
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified, photoUrl: user.photoUrl },
  });
});

// ── POST /auth/pre-register/send-otp ──────────────────────────────────────
// No auth required. Sends OTP to phone before account creation.
router.post("/pre-register/send-otp", async (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ code: "ERR-001", message: "Numéro de téléphone requis" });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  // Accept: +212XXXXXXXXX (Maroc), +1XXXXXXXXXX (USA/Canada), or any E.164 (+[1-9]...)
  if (!normalized.match(/^\+?[1-9][0-9]{7,14}$/)) {
    res.status(400).json({ code: "ERR-001", message: "Format de numéro invalide" });
    return;
  }

  const allowed = await otp_checkRateLimit(`pre:${normalized}`);
  if (!allowed) {
    res.status(429).json({ code: "RATE_LIMIT", message: "Trop de tentatives. Réessayez dans une heure." });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await otp_save(`pre:${normalized}`, code);

  await sendSms(normalized, `Votre code de vérification PSTAGEV1 : ${code}`);

  const response: any = { message: "Code envoyé" };
  if (process.env.NODE_ENV !== "production") {
    response.devCode = code;
    logger.info({ phone: normalized, code }, "[DEV] Pre-register OTP code");
  }

  res.json(response);
});

// ── POST /auth/pre-register/verify-otp ────────────────────────────────────
router.post("/pre-register/verify-otp", async (req, res) => {
  const { phone, code } = req.body as { phone?: string; code?: string };
  if (!phone || !code) {
    res.status(400).json({ code: "ERR-001", message: "phone et code requis" });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  const stored = await otp_get(`pre:${normalized}`);

  if (!stored || stored !== code.trim()) {
    res.status(400).json({ code: "AUTH-004", message: "Code incorrect ou expiré" });
    return;
  }

  await otp_delete(`pre:${normalized}`);
  const phoneToken = await signPhoneToken(normalized);

  res.json({ phoneToken });
});

// ── POST /auth/send-phone-otp (legacy — post-registration) ────────────────
router.post("/send-phone-otp", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  if (user.phoneVerified) { res.json({ message: "Téléphone déjà vérifié" }); return; }

  const normalized = normalizePhone(user.phone);
  const allowed = await otp_checkRateLimit(`user:${userId}`);
  if (!allowed) {
    res.status(429).json({ code: "RATE_LIMIT", message: "Trop de demandes. Réessayez dans une heure." });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await otp_save(`user:${userId}`, code);
  await sendSms(normalized, `Votre code de vérification PSTAGEV1 : ${code}`);

  const response: any = { message: "Code envoyé" };
  if (process.env.NODE_ENV !== "production") {
    response.devCode = code;
  }
  res.json(response);
});

// ── POST /auth/verify-phone ────────────────────────────────────────────────
router.post("/verify-phone", requireAuth, async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ code: "ERR-001", message: "code requis" });
    return;
  }

  const userId = req.user!.sub;
  const stored = await otp_get(`user:${userId}`);
  if (!stored || stored !== code.trim()) {
    res.status(400).json({ code: "AUTH-004", message: "Code incorrect ou expiré" });
    return;
  }
  await otp_delete(`user:${userId}`);

  await db.update(usersTable).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, userId));
  res.json({ message: "Téléphone vérifié avec succès" });
});

// ── POST /auth/refresh ─────────────────────────────────────────────────────
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

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.user!.sub),
    columns: { passwordHash: false },
  });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  res.json(user);
});

// ── PUT /auth/profile ──────────────────────────────────────────────────────
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

// ── POST /auth/upload-photo ────────────────────────────────────────────────
router.post("/upload-photo", requireAuth, async (req, res) => {
  const { dataUri } = req.body as { dataUri?: string };
  if (!dataUri || typeof dataUri !== "string" || !dataUri.startsWith("data:image/")) {
    res.status(400).json({ code: "ERR-001", message: "Image invalide (dataUri requis)" });
    return;
  }
  if (dataUri.length > 3 * 1024 * 1024) {
    res.status(413).json({ code: "ERR-SIZE", message: "Image trop lourde (max 2 Mo)" });
    return;
  }

  await db.update(usersTable)
    .set({ photoUrl: dataUri, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.sub));

  res.json({ photoUrl: dataUri });
});

// ── POST /auth/send-email-verification ────────────────────────────────────
router.post("/send-email-verification", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  if (user.emailVerified) {
    res.json({ message: "Email déjà vérifié" });
    return;
  }

  const evToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

  await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, userId));
  await db.insert(emailVerificationTokensTable).values({ userId, token: evToken, expiresAt });

  const replitDomain = process.env.REPLIT_DEV_DOMAIN
    ?? (process.env.REPL_SLUG && process.env.REPL_OWNER
      ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : null);
  const frontendUrl = process.env.FRONTEND_URL ?? (replitDomain ? `https://${replitDomain}` : "http://localhost:5000");
  const link = `${frontendUrl}/verify-email?token=${evToken}`;

  logger.info({ userId, link }, "Email verification link generated");

  const { sendMail } = await import("../lib/email");
  await sendMail({
    to: user.email,
    subject: "Vérifiez votre adresse email — PSTAGEV1",
    html: `<p>Bonjour ${user.name},</p><p><a href="${link}">${link}</a></p><p>Valable 24 heures.</p>`,
  });

  const response: any = { message: "Email de vérification envoyé" };
  if (process.env.NODE_ENV !== "production") {
    response.devLink = link;
  }

  res.json(response);
});

// ── GET /auth/verify-email ─────────────────────────────────────────────────
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

  await db.update(usersTable).set({ emailVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, record.userId));
  await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.token, token));

  res.json({ success: true, message: "Email vérifié avec succès" });
});

// ── POST /auth/send-email-code ─────────────────────────────────────────────
router.post("/send-email-code", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }
  if (user.emailVerified) { res.json({ message: "Email déjà vérifié" }); return; }

  const allowed = await otp_checkRateLimit(`email:${userId}`);
  if (!allowed) {
    res.status(429).json({ code: "RATE_LIMIT", message: "Trop de tentatives. Réessayez dans une heure." });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await otp_save(`email:${userId}`, code);

  try {
    const { sendMail } = await import("../lib/email");
    await sendMail({
      to: user.email,
      subject: `${code} — Code de vérification PSTAGEV1`,
      html: `<p>Bonjour ${user.name},</p><p>Votre code de vérification email : <strong style="font-size:24px;letter-spacing:0.1em">${code}</strong></p><p>Valable 10 minutes.</p>`,
    });
  } catch (err) {
    logger.warn({ err }, "Email OTP send failed — continuing");
  }

  const response: any = { message: "Code envoyé" };
  if (process.env.NODE_ENV !== "production") {
    response.devCode = code;
    logger.info({ userId, code }, "[DEV] Email OTP code");
  }
  res.json(response);
});

// ── POST /auth/verify-email-code ───────────────────────────────────────────
router.post("/verify-email-code", requireAuth, async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ code: "ERR-001", message: "code requis" });
    return;
  }

  const userId = req.user!.sub;
  const stored = await otp_get(`email:${userId}`);
  if (!stored || stored !== code.trim()) {
    res.status(400).json({ code: "AUTH-004", message: "Code incorrect ou expiré" });
    return;
  }
  await otp_delete(`email:${userId}`);
  await db.update(usersTable).set({ emailVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, userId));
  res.json({ message: "Email vérifié avec succès" });
});

// ── POST /auth/change-password ─────────────────────────────────────────────
router.post("/change-password", requireAuth, async (req, res) => {
  const parse = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
  }).safeParse(req.body);

  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: parse.error.issues[0]?.message ?? "Données invalides" });
    return;
  }

  const { currentPassword, newPassword } = parse.data;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.sub) });
  if (!user) { res.status(404).json({ code: "ERR-004", message: "Utilisateur introuvable" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ code: "ERR-002", message: "Mot de passe actuel incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id }, "Password changed");
  res.json({ message: "Mot de passe modifié avec succès" });
});

export default router;
