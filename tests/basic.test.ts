import assert from "node:assert";
import { test } from "node:test";

process.env.DATABASE_URL = "./data/test.db";

const { default: db } = await import("../src/lib/db.js");
const { default: cmd } = await import("../src/commands/social.js");
const { renderTemplate } = await import("../src/lib/notify.js");

test("db tables exist", () => {
  const t1 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feeds'").get();
  const t2 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'").get();
  const t3 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posted_items'").get();
  assert.ok(t1 && t2 && t3);
});

test("slash command name", () => {
  assert.equal(cmd.data.name, "social");
});

test("template rendering", () => {
  const s = renderTemplate("Nuovo: {title} da {author} {url} [{type}]", "youtube", "Video", "https://x", "Channel");
  assert.ok(s.includes("Video") && s.includes("Channel") && s.includes("https://x") && s.includes("youtube"));
});
