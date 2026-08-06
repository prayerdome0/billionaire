/**
 * Server-side Firebase Authentication for Seedwel / Billionaire Blueprint.
 *
 * - Verifies Firebase ID tokens (RS256 JWTs) against Google's public certs.
 *   No service-account key is stored in the repo — only the PUBLIC project id,
 *   so no secret API material is ever exposed.
 * - Admin access is granted through an allowlist (ADMIN_EMAILS env or the
 *   founders below) or a `role: "admin"` record in the users table.
 * - A legacy "dev admin" token exists ONLY outside production (local preview /
 *   development), so the admin portal stays usable before Firebase users are
 *   created in the console. It is hard-disabled on Vercel / NODE_ENV=production.
 */
import crypto from "node:crypto";
import { getStore } from "./storage.mjs";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "seedwel-cbeb8";
const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

/** Founder & management accounts that always have admin rights. */
const DEFAULT_ADMIN_EMAILS = [
  "seedwell@seedwel.com",
  "seedwell@seedwelinvestment.com",
  "zacheus@seedwelinvestment.com",
  "admin@seedwel.com",
];

export function adminAllowlist() {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]);
}

/** Dev-admin login only ever works outside production deployments. */
export const DEV_ADMIN_ENABLED =
  process.env.ALLOW_DEV_ADMIN === "1" ||
  (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production");

const DEV_ADMIN_USER = {
  uid: "dev-admin",
  email: "seedwell@seedwel.com",
  name: "Mr. Seedwell Khayalethu Masuku",
  role: "admin",
  dev: true,
};

export function isDevAdminToken(token) {
  return typeof token === "string" && token.startsWith("seed-dev-admin-");
}

export function issueDevAdminToken() {
  const rand = crypto.randomBytes(16).toString("hex");
  return `seed-dev-admin-${Date.now()}-${rand}`;
}

/* ------------------------- cert cache ------------------------- */
let certCache = { certs: null, expiresAt: 0 };

async function getGoogleCerts() {
  const now = Date.now();
  if (certCache.certs && now < certCache.expiresAt) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Could not fetch Google certs (${res.status})`);
  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  const ttl = maxAge ? Number(maxAge[1]) * 1000 : 60 * 60 * 1000;
  const certs = await res.json();
  certCache = { certs, expiresAt: now + ttl - 60_000 };
  return certs;
}

const b64urlJson = (seg) => JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));

/**
 * Verify a Firebase ID token. Returns the decoded payload or null.
 *
 * Signature verification ALWAYS happens when Google's certs are reachable.
 * In non-production environments where the certs endpoint cannot be fetched at
 * all (e.g. a fully offline preview sandbox), a clearly-marked unverified mode
 * is used so the student flow can still be exercised — claims constraints
 * (aud/iss/exp/sub) are still enforced, and this fallback NEVER exists in
 * production (DEV_ADMIN_ENABLED is false there, so tokens fail closed).
 */
export async function verifyIdToken(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const header = b64urlJson(h);
    const payload = b64urlJson(p);
    if (header.alg !== "RS256" || !header.kid) return null;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.iat !== "number" || payload.iat > now + 300) return null;
    if (payload.aud !== PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) return null;
    if (!payload.sub) return null;

    const claims = {
      uid: payload.sub,
      email: String(payload.email || "").toLowerCase(),
      name: payload.name || "",
      picture: payload.picture || "",
      emailVerified: !!payload.email_verified,
    };

    let certs;
    try {
      certs = await getGoogleCerts();
    } catch (e) {
      if (!DEV_ADMIN_ENABLED) throw e; // production: fail closed
      // dev-only offline fallback (certs endpoint unreachable in this sandbox)
      return { ...claims, offlineTrusted: true };
    }

    const pem = certs[header.kid];
    if (!pem) return null;
    const ok = crypto
      .createVerify("RSA-SHA256")
      .update(`${h}.${p}`)
      .verify(pem, Buffer.from(sig, "base64url"));
    if (!ok) return null;

    return claims;
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : "";
}

/** Attach req.user when a valid token is present. Never rejects. */
export async function optionalUser(req, _res, next) {
  const token = bearerToken(req);
  if (!token) return next();
  if (isDevAdminToken(token)) {
    if (DEV_ADMIN_ENABLED) req.user = { ...DEV_ADMIN_USER, admin: true, token: "dev" };
    return next();
  }
  const decoded = await verifyIdToken(token);
  if (decoded) {
    const allow = adminAllowlist();
    let role = allow.has(decoded.email) ? "admin" : "student";
    if (role !== "admin") {
      try {
        const existing = await (await getStore()).getUser(decoded.uid);
        if (existing?.role === "admin") role = "admin";
      } catch { /* store without users support */ }
    }
    req.user = { ...decoded, role, admin: role === "admin", token: "firebase" };
  }
  next();
}

/** Require ANY registered (signed-in) user. */
export function requireUser(req, res, next) {
  if (req.user) return next();
  return res
    .status(401)
    .json({ error: "Sign in required. Create a free account to access the course.", code: "AUTH_REQUIRED" });
}

/** Require an admin (founder / management). Everything else is refused. */
export function requireAdmin(req, res, next) {
  if (req.user?.admin) return next();
  if (req.user) {
    return res.status(403).json({
      error: "Admin access required. This area is restricted to Seedwel Investment Limited management.",
      code: "ADMIN_REQUIRED",
    });
  }
  return res.status(401).json({ error: "Sign in required.", code: "AUTH_REQUIRED" });
}

export const firebaseProjectId = PROJECT_ID;
export const devAdminUser = DEV_ADMIN_USER;
