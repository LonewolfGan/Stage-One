import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBJgqnrsWC8Ws4c6WqCCVbPZ4xO2QTS3zc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "anubis-v.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "anubis-v",
  storageBucket: "anubis-v.firebasestorage.app",
  messagingSenderId: "601571415997",
  appId: "1:601571415997:web:a187ca4525205333f5e4d4",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return recaptchaVerifier;
}

export async function sendFirebaseOtp(phone: string, containerId: string): Promise<ConfirmationResult> {
  const verifier = setupRecaptcha(containerId);
  return signInWithPhoneNumber(auth, phone, verifier);
}

export async function verifyFirebaseOtp(confirmation: ConfirmationResult, code: string): Promise<string> {
  const result = await confirmation.confirm(code);
  return result.user.getIdToken();
}
