import { SignJWT, jwtVerify } from "jose";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

const ALGORITHM = "HS256";

export interface JwtPayload {
  sub: string;
  role: "CLIENT" | "OWNER" | "ADMIN";
  providerId?: string;
}

export async function signToken(payload: JwtPayload, expiresIn = "24h"): Promise<string> {
  return new SignJWT({ ...payload } as any)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
  return payload as unknown as JwtPayload;
}

/** Signs a short-lived (15 min) phone pre-registration token. */
export async function signPhoneToken(phone: string): Promise<string> {
  return new SignJWT({ phone, type: "phone-pre-reg" } as any)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET);
}

/** Verifies a phone pre-registration token and returns the phone number. */
export async function verifyPhoneToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
  if ((payload as any).type !== "phone-pre-reg") throw new Error("Invalid token type");
  const phone = (payload as any).phone as string | undefined;
  if (!phone || typeof phone !== "string") throw new Error("Missing phone in token");
  return phone;
}

/** Signs a short-lived (15 min) email pre-registration token. */
export async function signEmailToken(email: string): Promise<string> {
  return new SignJWT({ email, type: "email-pre-reg" } as any)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET);
}

/** Verifies an email pre-registration token and returns the email address. */
export async function verifyEmailToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
  if ((payload as any).type !== "email-pre-reg") throw new Error("Invalid token type");
  const email = (payload as any).email as string | undefined;
  if (!email || typeof email !== "string") throw new Error("Missing email in token");
  return email;
}
