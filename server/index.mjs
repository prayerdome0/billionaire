/** Local runner: `npm run server` / `npm start` — Express + SQLite on PORT (default 3001). */
import app from "./app.mjs";

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] Billionaire Blueprint listening on http://0.0.0.0:${PORT}`);
});
