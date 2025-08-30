import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import db from "../lib/db.js";
import { pickTheme } from "../lib/theme.js";
import { renderTemplate } from "../lib/notify.js";
import { parseHHMM } from "../lib/time.js";

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
    .addSubcommand(s=>s.setName("template").setDescription("Imposta template messaggio per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)).addStringOption(o=>o.setName("text").setDescription("Template con {title} {url} {author} {type} {unix}").setRequired(true)))
    .addSubcommand(s=>s.setName("filterset").setDescription("Imposta filtri include/exclude per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)).addStringOption(o=>o.setName("include").setDescription("parole chiave include (spazio o virgola separate)")).addStringOption(o=>o.setName("exclude").setDescription("parole chiave exclude (spazio o virgola separate)")))
    .addSubcommand(s=>s.setName("filtershow").setDescription("Mostra filtri per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)))
    .addSubcommand(s=>s.setName("filterclear").setDescription("Rimuove filtri per sottoscrizione").addIntegerOption(o=>o.setName("subscription_id").setDescription("ID").setRequired(true)))
    .addSubcommand(s=>s.setName("quietset").setDescription("Imposta quiet hours per il server").addStringOption(o=>o.setName("start").setDescription("Inizio HH:MM").setRequired(true)).addStringOption(o=>o.setName("end").setDescription("Fine HH:MM").setRequired(true)))
    .addSubcommand(s=>s.setName("quietshow").setDescription("Mostra quiet hours del server"))
    .addSubcommand(s=>s.setName("preset").setDescription("Imposta preset estetico").addStringOption(o=>o.setName("value").setDescription("compact | rich").setRequired(true).addChoices({name:"compact", value:"compact"}, {name:"rich", value:"rich"})))
    .addSubcommand(s=>s.setName("presetshow").setDescription("Mostra preset estetico"))
    .addSubcommand(s=>s.setName("preview").setDescription("Anteprima messaggio senza inviarlo").addStringOption(o=>o.setName("type").setDescription("rss | youtube | twitch").setRequired(true).addChoices({name:"rss", value:"rss"}, {name:"youtube", value:"youtube"}, {name:"twitch", value:"twitch"})).addStringOption(o=>o.setName("title").setDescription("Titolo").setRequired(true)).addStringOption(o=>o.setName("url").setDescription("URL").setRequired(true)).addStringOption(o=>o.setName("author").setDescription("Autore"))),
  async execute(inter: ChatInputCommandInteraction) {
    const sub = inter.options.getSubcommand();
    if (sub === "addrss") {
      const url = inter.options.getString("url", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='rss' AND url=?").get(url) as { id: number } | undefined;
      const feedId = existing?.id ?? (db.prepare("INSERT INTO feeds(type,url) VALUES('rss',?)").run(url).lastInsertRowid as number);
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `RSS aggiunto (sub #${subr.lastInsertRowid}) → ${url}` });
      return;
    }
    if (sub === "addyoutube") {
      const id = inter.options.getString("channel_id", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='youtube' AND ext_id=?").get(id) as { id: number } | undefined;
      const feedId = existing?.id ?? (db.prepare("INSERT INTO feeds(type,ext_id) VALUES('youtube',?)").run(id).lastInsertRowid as number);
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `YouTube aggiunto (sub #${subr.lastInsertRowid}) → channel_id=${id}` });
      return;
    }
    if (sub === "addtwitch") {
      const u = inter.options.getString("user", true);
      const existing = db.prepare("SELECT id FROM feeds WHERE type='twitch' AND ext_id=?").get(u) as { id: number } | undefined;
      const feedId = existing?.id ?? (db.prepare("INSERT INTO feeds(type,ext_id) VALUES('twitch',?)").run(u).lastInsertRowid as number);
      const subr = db.prepare("INSERT INTO subscriptions(guild_id,channel_id,feed_id) VALUES (?,?,?)").run(inter.guildId, inter.channelId, feedId);
      await inter.reply({ content: `Twitch aggiunto (sub #${subr.lastInsertRowid}) → ${u}` });
      return;
    }
    if (sub === "list") {
      type Row = { sid: number; type: string; ref: string; channel_id: string; throttle_sec: number | null; template: string | null; include_filter: string | null; exclude_filter: string | null };
      const rows = db.prepare("SELECT s.id as sid, f.type, IFNULL(f.url, f.ext_id) as ref, s.channel_id, s.throttle_sec, IFNULL(s.template,'') as template, s.include_filter, s.exclude_filter FROM subscriptions s JOIN feeds f ON s.feed_id=f.id WHERE s.guild_id=?").all(inter.guildId) as Row[];
      if (!rows.length) {
        await inter.reply({ content: "Nessuna sottoscrizione.", ephemeral: true });
        return;
      }
      const out = rows.map((r: Row) => `#${r.sid} • ${r.type} • ${r.ref} → <#${r.channel_id}> • throttle=${r.throttle_sec ?? 60}s • include="${r.include_filter||""}" • exclude="${r.exclude_filter||""}"`).join("\n");
      await inter.reply("Sottoscrizioni:\n" + out);
      return;
    }
    if (sub === "remove") {
      const sid = inter.options.getInteger("subscription_id", true);
      db.prepare("DELETE FROM subscriptions WHERE id=? AND guild_id=?").run(sid, inter.guildId);
      await inter.reply(`Rimossa sottoscrizione #${sid}`);
      return;
    }
    if (sub === "throttle") {
      const sid = inter.options.getInteger("subscription_id", true);
      const secs = inter.options.getInteger("seconds", true);
      db.prepare("UPDATE subscriptions SET throttle_sec=? WHERE id=? AND guild_id=?").run(secs, sid, inter.guildId);
      await inter.reply(`Throttle impostato a ${secs}s per sub #${sid}`);
      return;
    }
    if (sub === "template") {
      const sid = inter.options.getInteger("subscription_id", true);
      const text = inter.options.getString("text", true);
      db.prepare("UPDATE subscriptions SET template=? WHERE id=? AND guild_id=?").run(text, sid, inter.guildId);
      await inter.reply(`Template aggiornato per sub #${sid}`);
      return;
    }
    if (sub === "filterset") {
      const sid = inter.options.getInteger("subscription_id", true);
      const inc = inter.options.getString("include") || null;
      const exc = inter.options.getString("exclude") || null;
      db.prepare("UPDATE subscriptions SET include_filter=?, exclude_filter=? WHERE id=? AND guild_id=?").run(inc, exc, sid, inter.guildId);
      await inter.reply(`Filtri aggiornati per sub #${sid}`);
      return;
    }
    if (sub === "filtershow") {
      const sid = inter.options.getInteger("subscription_id", true);
      const row = db.prepare("SELECT include_filter, exclude_filter FROM subscriptions WHERE id=? AND guild_id=?").get(sid, inter.guildId) as any;
      await inter.reply({ content: `include="${row?.include_filter||""}" • exclude="${row?.exclude_filter||""}"`, ephemeral: true });
      return;
    }
    if (sub === "filterclear") {
      const sid = inter.options.getInteger("subscription_id", true);
      db.prepare("UPDATE subscriptions SET include_filter=NULL, exclude_filter=NULL WHERE id=? AND guild_id=?").run(sid, inter.guildId);
      await inter.reply(`Filtri rimossi per sub #${sid}`);
      return;
    }
    if (sub === "quietset") {
      const start = inter.options.getString("start", true);
      const end = inter.options.getString("end", true);
      const sMin = parseHHMM(start);
      const eMin = parseHHMM(end);
      if (sMin == null || eMin == null) { await inter.reply({ content: "Formato orario non valido. Usa HH:MM (24h).", ephemeral: true }); return; }
      db.prepare("INSERT INTO guild_config(guild_id,quiet_start_min,quiet_end_min) VALUES (?,?,?) ON CONFLICT(guild_id) DO UPDATE SET quiet_start_min=excluded.quiet_start_min, quiet_end_min=excluded.quiet_end_min").run(inter.guildId, sMin, eMin);
      await inter.reply(`Quiet hours impostate: ${start} → ${end}`);
      return;
    }
    if (sub === "quietshow") {
      const row = db.prepare("SELECT quiet_start_min, quiet_end_min FROM guild_config WHERE guild_id=?").get(inter.guildId) as any;
      if (!row) { await inter.reply({ content: "Nessuna quiet hours configurata.", ephemeral: true }); return; }
      const toHHMM = (m:number)=> `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
      await inter.reply({ content: `Quiet hours: ${toHHMM(row.quiet_start_min)} → ${toHHMM(row.quiet_end_min)}`, ephemeral: true });
      return;
    }
    if (sub === "preset") {
      const val = inter.options.getString("value", true);
      db.prepare("INSERT INTO guild_defaults(guild_id,preset) VALUES (?,?) ON CONFLICT(guild_id) DO UPDATE SET preset=excluded.preset").run(inter.guildId, val);
      await inter.reply(`Preset estetico impostato: ${val}`);
      return;
    }
    if (sub === "presetshow") {
      const row = db.prepare("SELECT preset, template FROM guild_defaults WHERE guild_id=?").get(inter.guildId) as any;
      await inter.reply({ content: `Preset: ${row?.preset||"default"} • Template custom: ${row?.template? "sì" : "no"}`, ephemeral: true });
      return;
    }
    if (sub === "preview") {
      const type = inter.options.getString("type", true);
      const title = inter.options.getString("title", true);
      const url = inter.options.getString("url", true);
      const author = inter.options.getString("author") || "";
      const gd = db.prepare("SELECT preset, template FROM guild_defaults WHERE guild_id=?").get(inter.guildId) as any || {};
      const sTpl = null;
      const effTpl = sTpl || gd?.template || (gd?.preset === "compact" ? "{badge} {title} • <t:{unix}:R>" : gd?.preset === "rich" ? "{badge} **{title}** di _{author}_ • <t:{unix}:R>\n{url}" : undefined);
      const theme = pickTheme(type);
      const content = renderTemplate((effTpl || "{badge} {title}\n<t:{unix}:R>").replaceAll("{badge}", theme.emoji), type, title, url, author, Date.now());
      const embed = new EmbedBuilder().setTitle(title).setURL(url).setColor(theme.color).setTimestamp(new Date()).setFooter({ text: "BuzzCord • Notifiche social" }).setAuthor({ name: author ? `${theme.label} • ${author}` : theme.label, iconURL: theme.icon || undefined });
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Apri").setStyle(ButtonStyle.Link).setURL(url));
      await inter.reply({ content, embeds: [embed], components: [buttons], ephemeral: true });
      return;
    }
  }
};
