import { logger } from "./logger";

type AdminAuth = { verifyIdToken: (token: string) => Promise<{ phone_number?: string; email?: string }> };

let adminAuth: AdminAuth | null = null;

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
    // firebase-admin v14 CJS — flat exports: initializeApp, cert, getApps, getAuth
    const {
      initializeApp,
      cert,
      getApps,
      getAuth,
    } = require("firebase-admin/app") as {
      initializeApp: Function;
      cert: Function;
      getApps: () => unknown[];
      getAuth?: never;
    };
    const { getAuth: authGetter } = require("firebase-admin/auth") as {
      getAuth: () => AdminAuth;
    };

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    adminAuth = authGetter();
    logger.info("Firebase Admin initialized");
  } catch (err) {
    logger.error({ err }, "Firebase Admin initialization failed");
  }
}

initFirebase();

export { adminAuth };
