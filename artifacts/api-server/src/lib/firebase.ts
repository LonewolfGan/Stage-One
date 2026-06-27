import { logger } from "./logger";

let adminAuth: { verifyIdToken: (token: string) => Promise<{ phone_number?: string; email?: string }> } | null = null;

async function initFirebase() {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    logger.warn("Firebase credentials not set — phone OTP verification is mocked");
    return;
  }
  try {
    const admin = await import("firebase-admin");
    if (!admin.default.apps.length) {
      admin.default.initializeApp({
        credential: admin.default.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    adminAuth = admin.default.auth();
    logger.info("Firebase Admin initialized");
  } catch (err) {
    logger.error({ err }, "Firebase Admin initialization failed");
  }
}

initFirebase();

export { adminAuth };
