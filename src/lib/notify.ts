import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";
import { pickTheme } from "./theme.js";

export function renderTemplate(tpl: string | null | undefined, type: string, title: string, url: string, author?: string, unix?: number) {
  const t = tpl && tpl.trim().length ? tpl : "{badge} {title}\n<t:{unix}:R>";
  return t
    .replaceAll("{title}", title)
    .replaceAll("{url}", url)
    .replaceAll("{author}", author || "")
    .replaceAll("{type}", type)
    .replaceAll("{unix}", String(Math.floor((unix || Date.now())/1000)));
}

export async function sendNotification(ch: TextChannel, type: string, title: string, url: string, thumb?: string, timestamp?: number, template?: string, authorName?: string, channelUrl?: string) {
  const t = pickTheme(type);
  const content = renderTemplate((template || "").replaceAll("{badge}", t.emoji), type, title, url, authorName, timestamp);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setURL(url)
    .setColor(t.color)
    .setTimestamp(timestamp ? new Date(timestamp) : new Date())
    .setFooter({ text: "BuzzCord • Notifiche social" })
    .setAuthor({ name: authorName ? `${t.label} • ${authorName}` : t.label, iconURL: t.icon || undefined });
  if (thumb) embed.setThumbnail(thumb);

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel("Apri").setStyle(ButtonStyle.Link).setURL(url),
    new ButtonBuilder().setLabel("Canale").setStyle(ButtonStyle.Link).setURL(channelUrl || url)
  );

  await ch.send({ content, embeds: [embed], components: [buttons] });
}
