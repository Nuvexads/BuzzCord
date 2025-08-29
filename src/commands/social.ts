import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import db from "../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("social")
    .setDescription("Gestisci le notifiche social")
    .addSubcommand(s=>s.setName("addrss").setDescription("Aggiungi un feed RSS al canale corrente").addStringOption(o=>o.setName("url").setDescription("URL del feed RSS").setRequired(true)))
    .addSubcommand(s=>s.setName("addyoutube").setDescription("Aggiungi notifiche YouTube").addStringOption(o=>o.setName("channel_id").setDescription("ID canale YouTube").setRequired(true)))
    .addSubcommand(s=>s.setName("addtwitch").setDescription("Aggiungi notifiche Twitch").addStringOption(o=>o.setName("user").setDescription("login o user_id").setRequired(true)))
    .addSubcommand(s=>s.setName("list").setDescription("Elenca le sottoscrizioni del server"))
    .addSubcommand(s=>s.setName("remove").setDescription("Rimuovi una sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)))
    .addSubcommand(s=>s.setName("throttle").setDescription("Imposta throttle per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)).addIntegerOption(o=>o.setName("seconds").setDescription("Secondi").setRequired(true)))
    .addSubcommand(s=>s.setName("template").setDescription("Imposta template messaggio per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)).addStringOption(o=>o.setName("text").setDescription("Template con {title} {url} {author} {type}").setRequired(true))),
  async execute(inter: ChatInputCommandInteraction) {
    const sub = inter.options.getSubcommand();
    if (sub === "addrss") {
      const url = inter.options.getString("url", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='rss' AND url=?").get(url);
      const feedId = existing?.id || db.prepare("INSERT INTO feeds(type,url) VALUES('rss',?)").run(url).lastInsertRowid;
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `RSS aggiunto (sub #${subr.lastInsertRowid}) → ${url}` });
    } else if (sub === "addyoutube") {
      const id = inter.options.getString("channel_id", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='youtube' AND ext_id=?").get(id);
      const feedId = existing?.id || db.prepare("INSERT INTO feeds(type,ext_id) VALUES('youtube',?)").run(id).lastInsertRowid;
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `YouTube aggiunto (sub #${subr.lastInsertRowid}) → channel_id=${id}` });
    } else if (sub === "addtwitch") {
      const u = inter.options.getString("user", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='twitch' AND ext_id=?").get(u);
      const feedId = existing?.id || db.prepare("INSERT INTO feeds(type,ext_id) VALUES('twitch',?)").run(u).lastInsertRowid;
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `Twitch aggiunto (sub #${subr.lastInsertRowid}) → ${u}` });
    } else if (sub === "list") {
      const rows = db.prepare("SELECT s.id as sid, f.type, IFNULL(f.url, f.ext_id) as ref, s.channel_id, s.throttle_sec, IFNULL(s.template,'') as template FROM subscriptions s JOIN feeds f ON s.feed_id=f.id WHERE s.guild_id=?").all(inter.guildId);
      if (!rows.length) {
        await inter.reply({ content: "Nessuna sottoscrizione.", ephemeral: true });
        return;
      }
      const out = rows.map(r=>`#${r.sid} • ${r.type} • ${r.ref} → <#${r.channel_id}> • throttle=${r.throttle_sec}s`).join("\n");
      await inter.reply("Sottoscrizioni:\n" + out);
    } else if (sub === "remove") {
      const sid = inter.options.getInteger("subscription_id", true);
      db.prepare("DELETE FROM subscriptions WHERE id=? AND guild_id=?").run(sid, inter.guildId);
      await inter.reply(`Rimossa sottoscrizione #${sid}`);
    } else if (sub === "throttle") {
      const sid = inter.options.getInteger("subscription_id", true);
      const secs = inter.options.getInteger("seconds", true);
      db.prepare("UPDATE subscriptions SET throttle_sec=? WHERE id=? AND guild_id=?").run(secs, sid, inter.guildId);
      await inter.reply(`Throttle impostato a ${secs}s per sub #${sid}`);
    } else if (sub === "template") {
      const sid = inter.options.getInteger("subscription_id", true);
      const text = inter.options.getString("text", true);
      db.prepare("UPDATE subscriptions SET template=? WHERE id=? AND guild_id=?").run(text, sid, inter.guildId);
      await inter.reply(`Template aggiornato per sub #${sid}`);
    }
  }
};
