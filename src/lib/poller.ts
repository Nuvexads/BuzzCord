import db from "./db.js";
import { fetchRss } from "../providers/rss.js";
import { fetchYT } from "../providers/youtube.js";
import { fetchTwitch } from "../providers/twitch.js";
import { Client, TextChannel } from "discord.js";
import { sendNotification } from "./notify.js";
import { inQuietRange, nowMinutesOfDay } from "./time.js";

type Item = { guid: string; title: string; url: string; date: number; thumb?: string; author?: string };

function loadFeeds() {
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
function updateLastPosted(subId:number){
  db.prepare("UPDATE subscriptions SET last_posted_at=? WHERE id=?").run(Date.now(), subId);
}
function providerChannelUrl(type: string, extId?: string) {
  if (type === "youtube" && extId) return `https://www.youtube.com/channel/${extId}`;
  if (type === "twitch" && extId) return `https://twitch.tv/${extId}`;
  return undefined;
}
function getGuildConfig(guild_id: string) {
  return db.prepare("SELECT quiet_start_min, quiet_end_min FROM guild_config WHERE guild_id=?").get(guild_id) as any || {};
}
function getGuildDefaults(guild_id: string) {
  return db.prepare("SELECT preset, template FROM guild_defaults WHERE guild_id=?").get(guild_id) as any || {};
}
function presetTemplate(preset?: string|null) {
  if (preset === "compact") return "{badge} {title} • <t:{unix}:R>";
  if (preset === "rich") return "{badge} **{title}** di _{author}_ • <t:{unix}:R>\n{url}";
  return undefined;
}
function applyFilters(title: string, url: string, author?: string, include?: string|null, exclude?: string|null): boolean {
  const t = (title || "").toLowerCase();
  const a = (author || "").toLowerCase();
  const u = (url || "").toLowerCase();
  const hay = `${t} ${a} ${u}`;
  if (include && include.trim().length) {
    const inc = include.toLowerCase().split(/[,\s]+/).filter(Boolean);
    if (!inc.some(k => hay.includes(k))) return false;
  }
  if (exclude && exclude.trim().length) {
    const exc = exclude.toLowerCase().split(/[,\s]+/).filter(Boolean);
    if (exc.some(k => hay.includes(k))) return false;
  }
  return true;
}

export async function tick(client: Client) {
  const feeds = loadFeeds();
  for (const f of feeds) {
    try {
      let items: Item[] = [];
      let newEtag: string|undefined;
      let newLastMod: string|undefined;

      if (f.type === "rss") {
        const r = await fetchRss(f.url, f.etag, f.last_modified);
        if (r.notModified) {
          db.prepare("UPDATE feeds SET last_checked=?, last_error=NULL WHERE id=?").run(Date.now(), f.id);
          continue;
        }
        items = r.items;
        newEtag = r.etag;
        newLastMod = r.lastModified;
      } else if (f.type === "youtube") {
        items = await fetchYT(f.ext_id);
      } else if (f.type === "twitch") {
        items = await fetchTwitch(f.ext_id);
      }

      items.sort((a,b)=>a.date-b.date);
      const subs = getSubs(f.id);
      for (const it of items) {
        if (wasPosted(f.id, it.guid)) continue;
        for (const s of subs) {
          const nowMin = nowMinutesOfDay();
          const guildCfg = getGuildConfig(s.guild_id);
          if (inQuietRange(guildCfg.quiet_start_min, guildCfg.quiet_end_min, nowMin)) continue;

          if (!applyFilters(it.title, it.url, it.author, s.include_filter, s.exclude_filter)) continue;

          const now = Date.now();
          const last = s.last_posted_at || 0;
          if (s.throttle_sec && now - last < s.throttle_sec * 1000) continue;

          const ch = await client.channels.fetch(s.channel_id).catch(()=>null);
          if (!ch || !("send" in ch)) continue;

          const gd = getGuildDefaults(s.guild_id);
          const effTemplate = s.template || gd.template || presetTemplate(gd.preset) || undefined;

          await sendNotification(ch as TextChannel, f.type, it.title, it.url, it.thumb, it.date, effTemplate, it.author, providerChannelUrl(f.type, f.ext_id));
          updateLastPosted(s.id);
        }
        markPosted(f.id, it.guid);
      }
      db.prepare("UPDATE feeds SET last_checked=?, etag=COALESCE(?,etag), last_modified=COALESCE(?,last_modified), last_error=NULL WHERE id=?").run(Date.now(), newEtag, newLastMod, f.id);
    } catch (err:any) {
      db.prepare("UPDATE feeds SET last_checked=?, last_error=? WHERE id=?").run(Date.now(), String(err?.message||err), f.id);
    }
  }
}
