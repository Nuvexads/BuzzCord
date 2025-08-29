import Parser from "rss-parser";
const parser = new Parser({ customFields: { item: [["yt:videoId","videoId"]] } });
export function ytUploadsFeed(channelId: string) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}
export async function fetchYT(channelId: string) {
  const url = ytUploadsFeed(channelId);
  const feed = await parser.parseURL(url);
  const source = feed.title || "YouTube";
  return (feed.items || []).map((i: any) => {
    const id = i.videoId || (i.id ? String(i.id).split(":").pop() : undefined);
    const link = i.link || (id ? `https://youtu.be/${id}` : "");
    const thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
    return {
      guid: i.id || link || id,
      title: i.title || "Nuovo video",
      url: link,
      date: i.isoDate ? Date.parse(i.isoDate as string) : Date.now(),
      thumb,
      author: i.author || source
    };
  });
}
