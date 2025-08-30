import Database from "better-sqlite3";
import { mkdirSync } from "fs";

mkdirSync("data", { recursive: true });
const db = new Database(process.env.DATABASE_URL || "./data/buzzcord.db");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  url TEXT,
  ext_id TEXT,
  title TEXT,
  etag TEXT,
  last_modified TEXT,
  last_checked INTEGER DEFAULT 0,
  last_error TEXT
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  feed_id INTEGER NOT NULL,
  throttle_sec INTEGER DEFAULT 60,
  template TEXT,
  last_posted_at INTEGER,
  include_filter TEXT,
  exclude_filter TEXT,
  FOREIGN KEY(feed_id) REFERENCES feeds(id)
);
CREATE TABLE IF NOT EXISTS posted_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL,
  item_guid TEXT NOT NULL,
  posted_at INTEGER NOT NULL,
  UNIQUE(feed_id, item_guid)
);
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  quiet_start_min INTEGER,
  quiet_end_min INTEGER
);
CREATE TABLE IF NOT EXISTS guild_defaults (
  guild_id TEXT PRIMARY KEY,
  preset TEXT,
  template TEXT
);
`);
export default db;
