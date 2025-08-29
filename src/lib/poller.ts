import db from "./db.js";
import { fetchRssItems } from "../providers/rss.js";
import { fetchYT } from "../providers/youtube.js";
import { Client, TextChannel } from "discord.js";
import { sendNotification } from "./notify.js";

type Item = { guid: string; title: string; url: string; date: number; thumb?: string };

async function loadFeeds() {
  return db.prepare("SELECT * FROM feeds").all();
}
function getSubs(feedId:number){
  return db.prepare("SELECT * FROM subscriptions WHERE feed_id=?").all(feedId);
}
function markPosted(feedId:number, guid:string){
  db.prepare("INSERT OR IGNORE INTO posted_items (feed_id,item_guid,posted_at) VALUES (?,?,?)").run(feedId, guid, Date.now());
}
function wasPosted(feedId:number, guid:string){
  return !!db.prepare("SELECT 1 FROM posted_items WHERE feed_id=? AND item_guid=?").get(feedId,guid);
}

export async function tick(client: Client) {
  const feeds = await loadFeeds();
  for (const f of feeds) {
    try {
      let items: Item[] = [];
      if (f.type === "rss") items = await fetchRssItems(f.url);
      else if (f.type === "youtube") items = await fetchYT(f.ext_id);
      items.sort((a,b)=>a.date-b.date);
      const subs = getSubs(f.id);
      for (const it of items) {
        if (wasPosted(f.id, it.guid)) continue;
        for (const s of subs) {
          const ch = await client.channels.fetch(s.channel_id).catch(()=>null);
          if (!ch || !("send" in ch)) continue;
          await sendNotification(ch as TextChannel, f.type, it.title, it.url, it.thumb, it.date);
        }
        markPosted(f.id, it.guid);
      }
      db.prepare("UPDATE feeds SET last_checked=?, last_error=NULL WHERE id=?").run(Date.now(), f.id);
    } catch (err:any) {
      db.prepare("UPDATE feeds SET last_checked=?, last_error=? WHERE id=?").run(Date.now(), String(err?.message||err), f.id);
    }
  }
}
