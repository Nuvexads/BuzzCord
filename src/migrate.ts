import db from "./lib/db.js";

function hasColumn(table: string, col: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name: string}>;
  return rows.some(r => r.name === col);
}
function addColumn(table: string, colDef: string) {
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
}

try {
  if (!hasColumn("feeds", "etag")) addColumn("feeds", "etag TEXT");
  if (!hasColumn("feeds", "last_modified")) addColumn("feeds", "last_modified TEXT");

  if (!hasColumn("subscriptions", "include_filter")) addColumn("subscriptions", "include_filter TEXT");
  if (!hasColumn("subscriptions", "exclude_filter")) addColumn("subscriptions", "exclude_filter TEXT");

  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_subs_feed ON subscriptions(feed_id);
    CREATE INDEX IF NOT EXISTS idx_posted ON posted_items(feed_id, item_guid);
  `);

  console.log("Migrazione completata.");
} catch (e) {
  console.error("Migrazione fallita:", e);
  process.exitCode = 1;
} finally {
  try { (db as any).close?.(); } catch (e) { void e; }
}
