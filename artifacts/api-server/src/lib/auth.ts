import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "pstagev1-dev-secret-change-in-production",
);

const ALGORITHM = "HS256";

export interface JwtPayload {
  sub: string;
  role: "CLIENT" | "OWNER" | "ADMIN";
  providerId?: string;
}

export async function signToken(payload: JwtPayload, expiresIn = "24h"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
  return payload as unknown as JwtPayload;
}
