// Authentication context — Firebase email/password accounts, with the server
// as the source of truth for admin rights (verified ID token + allowlist).
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
import { auth, initAnalytics } from "./firebase";
import {
  adminLogin as apiAdminLogin,
  setAuthTokenProvider,
  syncAuthMe,
  type AuthMe,
} from "./api";

/** Founder & management accounts (UI hint only — the SERVER enforces admin rights). */
export const ADMIN_EMAILS = [
  "seedwell@seedwel.com",
  "seedwell@seedwelinvestment.com",
  "zacheus@seedwelinvestment.com",
  "admin@seedwel.com",
];

const DEV_TOKEN_KEY = "seed_dev_admin_token";

export interface SessionInfo {
  kind: "firebase" | "dev";
  me: AuthMe;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Server-confirmed profile (from /api/auth/me) for the active session. */
  profile: AuthMe["user"] | null;
  isAdmin: boolean;
  sessionKind: "firebase" | "dev" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Development-preview admin login (rendered only in dev builds). */
  devAdminSignIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthMe["user"] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionKind, setSessionKind] = useState<"firebase" | "dev" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
    // The API client attaches this token automatically to authenticated calls.
    setAuthTokenProvider(async () => {
      if (auth.currentUser) {
        try {
          return await auth.currentUser.getIdToken();
        } catch {
          /* fall through to dev token */
        }
      }
      return localStorage.getItem(DEV_TOKEN_KEY);
    });
  }, []);

  const applyMe = useCallback((me: AuthMe | null, kind: "firebase" | "dev" | null) => {
    setProfile(me?.user ?? null);
    setIsAdmin(!!me?.isAdmin);
    setSessionKind(me ? kind : null);
  }, []);

  // Restore a dev-preview session when there is no Firebase user.
  const restoreDevSession = useCallback(async () => {
    const token = localStorage.getItem(DEV_TOKEN_KEY);
    if (!token) {
      applyMe(null, null);
      return;
    }
    try {
      const me = await syncAuthMe();
      applyMe(me.isAdmin ? me : null, me.isAdmin ? "dev" : null);
      if (!me.isAdmin) localStorage.removeItem(DEV_TOKEN_KEY);
    } catch {
      localStorage.removeItem(DEV_TOKEN_KEY);
      applyMe(null, null);
    }
  }, [applyMe]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const me = await syncAuthMe();
          applyMe(me, "firebase");
        } catch {
          // Offline API — still grant UI admin hint by email allowlist.
          applyMe(
            {
              user: {
                uid: u.uid,
                email: u.email || "",
                name: u.displayName || "",
                photoUrl: u.photoURL || "",
                role: ADMIN_EMAILS.includes((u.email || "").toLowerCase()) ? "admin" : "student",
              },
              isAdmin: ADMIN_EMAILS.includes((u.email || "").toLowerCase()),
              adminEmails: ADMIN_EMAILS,
            },
            "firebase"
          );
        }
      } else {
        await restoreDevSession();
      }
      setLoading(false);
    });
    return unsub;
  }, [applyMe, restoreDevSession]);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await syncAuthMe();
      applyMe(me, auth.currentUser ? "firebase" : "dev");
    } catch {
      /* keep existing profile */
    }
  }, [applyMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const devAdminSignIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiAdminLogin(email, password);
      localStorage.setItem(DEV_TOKEN_KEY, res.token);
      const me = await syncAuthMe();
      applyMe(me, "dev");
    },
    [applyMe]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem(DEV_TOKEN_KEY);
    applyMe(null, null);
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
    return localStorage.getItem(DEV_TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      profile,
      isAdmin,
      sessionKind,
      signIn,
      signUp,
      resetPassword,
      devAdminSignIn,
      logout,
      refreshProfile,
      getIdToken,
    }),
    [user, loading, profile, isAdmin, sessionKind, signIn, signUp, resetPassword, devAdminSignIn, logout, refreshProfile, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Friendly message for Firebase auth error codes. */
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
