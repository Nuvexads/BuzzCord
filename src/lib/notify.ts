import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";

export async function sendNotification(ch: TextChannel, type: string, title: string, url: string, thumb?: string, timestamp?: number) {
  const color = type === "youtube" ? 0xff0000 : 0x5865f2;
  const content = type === "youtube" ? "📺 Nuovo video!" : "📰 Nuovo contenuto!";
  const embed = new EmbedBuilder().setTitle(title).setURL(url).setColor(color).setTimestamp(timestamp ? new Date(timestamp) : new Date()).setFooter({ text: type === "youtube" ? "YouTube" : "RSS Feed" });
  if (thumb) embed.setThumbnail(thumb);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel("Apri").setStyle(ButtonStyle.Link).setURL(url));
  await ch.send({ content, embeds: [embed], components: [row] });
}
