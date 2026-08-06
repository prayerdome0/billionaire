// Firebase client SDK — Seedwel Investment Limited (project: seedwel-cbeb8).
//
// NOTE: This web configuration is SAFE to ship in the browser — it only
// identifies the project. All sensitive data sits behind server-verified
// Firebase ID tokens + the admin allowlist on the API, so no privileged
// credentials are ever exposed to clients.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCRliF-XdpgdNRyLvIrLEeCIBf_CF3E0nU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "seedwel-cbeb8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seedwel-cbeb8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "seedwel-cbeb8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1027325152362",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1027325152362:web:fb813e933ab8aa3b8d0e13",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5GXW526PFT",
};

export const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

/** Analytics is optional and browser-only; never crash the app if it fails. */
let analyticsStarted = false;
export function initAnalytics(): void {
  if (analyticsStarted || typeof window === "undefined") return;
  analyticsStarted = true;
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((ok) => {
        if (ok) getAnalytics(app);
      })
    )
    .catch(() => {
      /* offline preview / unsupported env — ignore */
    });
}
