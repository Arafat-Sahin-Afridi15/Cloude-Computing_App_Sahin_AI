// server.js — Express server + chat-history API backed by a database (see db.js).
// The AI call itself still runs in the browser via Puter.js.

const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY; // optional: lets you view ALL users' history

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const sid = (v) => (typeof v === "string" && /^[\w-]{8,64}$/.test(v) ? v : null);
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: "Database error" });
});

// Health check (useful for Render)
app.get("/healthz", (req, res) => res.status(200).send("ok"));

// Save one Q&A
app.post("/api/history", wrap(async (req, res) => {
  const s = sid(req.body.sessionId);
  const prompt = String(req.body.prompt || "").slice(0, 3000);
  const response = String(req.body.response || "").slice(0, 20000);
  if (!s || !prompt || !response) return res.status(400).json({ error: "Invalid data" });
  res.json({ id: await db.add(s, prompt, response) });
}));

// List this visitor's history
app.get("/api/history", wrap(async (req, res) => {
  const s = sid(req.query.sessionId);
  if (!s) return res.status(400).json({ error: "Missing sessionId" });
  res.json(await db.list(s, 50));
}));

// Delete one / clear all (own records only)
app.delete("/api/history/:id", wrap(async (req, res) => {
  const s = sid(req.query.sessionId);
  if (!s) return res.status(400).json({ error: "Missing sessionId" });
  await db.remove(Number(req.params.id), s);
  res.json({ ok: true });
}));
app.delete("/api/history", wrap(async (req, res) => {
  const s = sid(req.query.sessionId);
  if (!s) return res.status(400).json({ error: "Missing sessionId" });
  await db.clear(s);
  res.json({ ok: true });
}));

// Admin: see everything in the database  →  /api/admin/history?key=YOUR_ADMIN_KEY
app.get("/api/admin/history", wrap(async (req, res) => {
  if (!ADMIN_KEY || req.query.key !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
  res.json(await db.all(500));
}));

db.init()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT} — DB: ${db.name}`)))
  .catch((e) => { console.error("DB init failed:", e); process.exit(1); });
