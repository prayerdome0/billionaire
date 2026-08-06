import type { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import Navbar from "./Navbar";
import Footer from "./Footer";

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-16 h-16 object-contain" />
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-sm">Loading your account…</span>
      </div>
    </div>
  );
}

/** Gate a route behind registration — "someone doing a course must be registered". */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, sessionKind, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!user && sessionKind !== "dev") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/** Gate a route behind admin rights (seeded management accounts). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, sessionKind } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!user && sessionKind !== "dev") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="rounded-3xl bg-gray-900/80 border border-gray-800 p-10">
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-black mb-2">Management Access Only</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              This area exposes the full database and every admin API of Seedwel Investment Limited.
              Sign in with an approved management account to continue.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-6 py-3 text-sm"
            >
              Go to Admin Portal
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  return <>{children}</>;
}
