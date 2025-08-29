export const THEME = {
  youtube: { color: 0xff0000, icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg", emoji: "📺", label: "YouTube" },
  twitch: { color: 0x9146ff, icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg", emoji: "🔴", label: "Twitch" },
  rss: { color: 0x5865f2, icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/rss.svg", emoji: "📰", label: "RSS" }
} as const;

export function pickTheme(type: string) {
  return (THEME as any)[type] || { color: 0x5865f2, icon: "", emoji: "✨", label: "Update" };
}
