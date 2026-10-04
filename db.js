// db.js — one small interface, two backends:
//  • PostgreSQL when DATABASE_URL is set (use this on Render)
//  • SQLite file (data/app.db) when it isn't (zero-setup local testing)
const DATABASE_URL = process.env.DATABASE_URL;

let impl;

if (DATABASE_URL) {
  const { Pool } = require("pg");
  const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: local ? false : { rejectUnauthorized: false },
  });
  impl = {
    name: "PostgreSQL",
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW())`);
      await pool.query("CREATE INDEX IF NOT EXISTS chats_session_idx ON chats(session_id)");
    },
    async add(s, p, r) {
      const { rows } = await pool.query(
        "INSERT INTO chats(session_id,prompt,response) VALUES($1,$2,$3) RETURNING id", [s, p, r]);
      return rows[0].id;
    },
    async list(s, n) {
      return (await pool.query(
        "SELECT id,prompt,response,created_at FROM chats WHERE session_id=$1 ORDER BY id DESC LIMIT $2", [s, n])).rows;
    },
    async remove(id, s) { await pool.query("DELETE FROM chats WHERE id=$1 AND session_id=$2", [id, s]); },
    async clear(s) { await pool.query("DELETE FROM chats WHERE session_id=$1", [s]); },
    async all(n) {
      return (await pool.query(
        "SELECT id,session_id,prompt,response,created_at FROM chats ORDER BY id DESC LIMIT $1", [n])).rows;
    },
  };
} else {
  const fs = require("fs");
  const path = require("path");
  const { DatabaseSync } = require("node:sqlite"); // built into Node 22.5+, no install needed
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
  const db = new DatabaseSync(path.join(__dirname, "data", "app.db"));
  impl = {
    name: "SQLite (local file)",
    async init() {
      db.exec(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE INDEX IF NOT EXISTS chats_session_idx ON chats(session_id);`);
    },
    async add(s, p, r) {
      return db.prepare("INSERT INTO chats(session_id,prompt,response) VALUES(?,?,?)").run(s, p, r).lastInsertRowid;
    },
    async list(s, n) {
      return db.prepare("SELECT id,prompt,response,created_at FROM chats WHERE session_id=? ORDER BY id DESC LIMIT ?").all(s, n);
    },
    async remove(id, s) { db.prepare("DELETE FROM chats WHERE id=? AND session_id=?").run(id, s); },
    async clear(s) { db.prepare("DELETE FROM chats WHERE session_id=?").run(s); },
    async all(n) {
      return db.prepare("SELECT id,session_id,prompt,response,created_at FROM chats ORDER BY id DESC LIMIT ?").all(n);
    },
  };
}

module.exports = impl;
