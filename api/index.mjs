/**
 * Vercel serverless entry point.
 * The Express app is auto-detected by @vercel/node and served as a function.
 * Static assets + SPA fallback are handled by Vercel via vercel.json rewrites.
 */
import app from "../server/app.mjs";

export default app;
