// Authentication context — Firebase email/password + Firestore TRUE DATABASE for roles
// - Users collection: users/{uid} has role field "admin" | "student" (source of truth for admin tabs)
// - Admin tab detection: AccountPage (student dashboard) shows admin portal link when role=admin OR email allowlisted
// - Tuition FREE, certificate $5 paid: reflected in certificate flow, not auth, but user sync happens here

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, initAnalytics, db } from "./firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  setAuthTokenProvider,
  syncAuthMe,
  type AuthMe,
} from "./api";
import { ensureUserDoc, getUserRole, type FirestoreUser } from "./firestoreDb";

/** Founder & management accounts (UI hint + server allowlist fallback). */
export const ADMIN_EMAILS = [
  "seedwell@seedwel.com",
  "seedwell@seedwelinvestment.com",
  "zacheus@seedwelinvestment.com",
  "admin@seedwel.com",
];

export interface SessionInfo {
  kind: "firebase" | "dev";
  me: AuthMe;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Server-confirmed profile (from /api/auth/me) for the active session. */
  profile: AuthMe["user"] | null;
  /** Firestore user doc with role field */
  firestoreUser: FirestoreUser | null;
  isAdmin: boolean;
  sessionKind: "firebase" | "dev" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncFirestoreUser(u: User) {
  try {
    // check email allowlist to auto-assign admin role in Firestore on first login
    const isAllowlisted = ADMIN_EMAILS.includes((u.email || "").toLowerCase());
    const existing = await getUserRole(u.uid);

    // ensure doc exists with correct role
    const fsUser = await ensureUserDoc({
      uid: u.uid,
      email: u.email || "",
      name: u.displayName || (u.email || "Student").split("@")[0],
      photoUrl: u.photoURL || "",
      role: existing?.role || (isAllowlisted ? "admin" : "student"),
    });

    // if allowlisted but stored as student, promote to admin automatically once
    if (isAllowlisted && fsUser.role !== "admin") {
      await setDoc(doc(db, "users", u.uid), { role: "admin", isAdmin: true, lastSeen: serverTimestamp() } as any, { merge: true });
      return { ...fsUser, role: "admin" as const, isAdmin: true };
    }

    return fsUser;
  } catch (e) {
    console.warn("[auth] firestore sync failed", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthMe["user"] | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionKind, setSessionKind] = useState<"firebase" | "dev" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
    setAuthTokenProvider(async () => {
      if (auth.currentUser) {
        try {
          return await auth.currentUser.getIdToken();
        } catch {}
      }
      return null;
    });
  }, []);

  const applyMe = useCallback(async (me: AuthMe | null, kind: "firebase" | "dev" | null, fsUser: FirestoreUser | null = null) => {
    setProfile(me?.user ?? null);
    // admin = firestore role admin OR server said isAdmin OR email allowlist
    const adminFromFs = fsUser?.role === "admin" || fsUser?.isAdmin;
    const adminFromServer = !!me?.isAdmin;
    const adminFromEmail = me?.user?.email ? ADMIN_EMAILS.includes(me.user.email.toLowerCase()) : false;
    const admin = !!(adminFromFs || adminFromServer || adminFromEmail);
    setIsAdmin(admin);
    setSessionKind(me ? kind : null);
    if (fsUser) setFirestoreUser(fsUser);
  }, []);

  const restoreDevSession = useCallback(async () => {
    await applyMe(null, null, null);
  }, [applyMe]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Parallel: sync to Firestore TRUE DB + server
        let fsUser: FirestoreUser | null = null;
        let me: AuthMe | null = null;

        try {
          fsUser = await syncFirestoreUser(u);
        } catch {}

        try {
          me = await syncAuthMe();
        } catch {
          me = {
            user: {
              uid: u.uid,
              email: u.email || "",
              name: u.displayName || "",
              photoUrl: u.photoURL || "",
              role: (fsUser?.role as any) || (ADMIN_EMAILS.includes((u.email || "").toLowerCase()) ? "admin" : "student"),
            },
            isAdmin: fsUser?.role === "admin" || ADMIN_EMAILS.includes((u.email || "").toLowerCase()),
            adminEmails: ADMIN_EMAILS,
          };
        }

        // if firestore says admin, make sure profile reflects it even if server disagrees (offline)
        if (fsUser?.role === "admin" && me) {
          me = { ...me, isAdmin: true, user: { ...me.user, role: "admin" } };
        }

        setFirestoreUser(fsUser);
        await applyMe(me, "firebase", fsUser);
      } else {
        setFirestoreUser(null);
        await restoreDevSession();
      }
      setLoading(false);
    });
    return unsub;
  }, [applyMe, restoreDevSession]);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await syncAuthMe();
      let fsUser: FirestoreUser | null = firestoreUser;
      if (auth.currentUser) {
        fsUser = await getUserRole(auth.currentUser.uid);
        if (fsUser) setFirestoreUser(fsUser);
      }
      await applyMe(me, auth.currentUser ? "firebase" : "dev", fsUser);
    } catch {
      /* keep existing */
    }
  }, [applyMe, firestoreUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
    }
    // create firestore doc immediately with student role (unless allowlisted)
    const isAllowlisted = ADMIN_EMAILS.includes(email.trim().toLowerCase());
    await ensureUserDoc({
      uid: cred.user.uid,
      email: email.trim(),
      name: name.trim() || email.split("@")[0],
      role: isAllowlisted ? "admin" : "student",
    }).catch(() => {});
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logout = useCallback(async () => {
    setFirestoreUser(null);
    await applyMe(null, null, null);
    if (auth.currentUser) await signOut(auth);
  }, [applyMe]);

  const getIdToken = useCallback(async () => {
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      profile,
      firestoreUser,
      isAdmin,
      sessionKind,
      signIn,
      signUp,
      resetPassword,
      logout,
      refreshProfile,
      getIdToken,
    }),
    [user, loading, profile, firestoreUser, isAdmin, sessionKind, signIn, signUp, resetPassword, logout, refreshProfile, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered — sign in instead.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/weak-password":
      return "Password is too weak — use at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled yet. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return (err as Error)?.message?.replace(/^Firebase:\s*/, "") || "Authentication failed. Please try again.";
  }
}
