import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";

export function renderTemplate(tpl: string | null | undefined, type: string, title: string, url: string, author?: string) {
  const base = type === "youtube" ? "📺 Nuovo video!" : type === "twitch" ? "🔴 Live su Twitch!" : "📰 Nuovo contenuto!";
  const t = tpl && tpl.trim().length ? tpl : base;
  return t.replaceAll("{title}", title).replaceAll("{url}", url).replaceAll("{author}", author || "").replaceAll("{type}", type);
}

export async function sendNotification(ch: TextChannel, type: string, title: string, url: string, thumb?: string, timestamp?: number, content?: string) {
  const color = type === "youtube" ? 0xff0000 : type === "twitch" ? 0x9146ff : 0x5865f2;
  const embed = new EmbedBuilder().setTitle(title).setURL(url).setColor(color).setTimestamp(timestamp ? new Date(timestamp) : new Date()).setFooter({ text: type === "youtube" ? "YouTube" : type === "twitch" ? "Twitch" : "RSS Feed" });
  if (thumb) embed.setThumbnail(thumb);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Apri").setStyle(ButtonStyle.Link).setURL(url));
  await ch.send({ content: content || undefined, embeds: [embed], components: [row] });
}
