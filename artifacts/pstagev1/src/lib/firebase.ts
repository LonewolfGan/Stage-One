import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
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
