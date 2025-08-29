import Parser from "rss-parser";
const parser = new Parser();
export async function fetchRssItems(url: string) {
  const feed = await parser.parseURL(url);
  const source = feed.title || "";
  return (feed.items || []).map(i => ({
    guid: i.guid || i.link || `${i.title}-${i.pubDate}`,
    title: i.title || "Nuovo contenuto",
    url: i.link || "",
    date: i.isoDate ? Date.parse(i.isoDate as string) : Date.now(),
    author: (i as any).creator || (i as any).author || source || ""
  }));
}
