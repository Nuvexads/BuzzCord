import Parser from "rss-parser";

type Item = { guid: string; title: string; url: string; date: number; author?: string };

export async function fetchRss(url: string, etag?: string|null, lastModified?: string|null): Promise<{items: Item[]; etag?: string; lastModified?: string; notModified?: boolean}> {
  const headers: Record<string,string> = {};
  if (etag) headers["If-None-Match"] = etag;
  if (lastModified) headers["If-Modified-Since"] = lastModified;
  const res = await fetch(url, { headers });
  if (res.status === 304) return { items: [], notModified: true };
  const text = await res.text();
  const parser = new Parser();
  const feed = await parser.parseString(text);
  const source = feed.title || "";
  const items = (feed.items || []).map((i:any) => ({
    guid: i.guid || i.link || `${i.title}-${i.pubDate}`,
    title: i.title || "Nuovo contenuto",
    url: i.link || "",
    date: i.isoDate ? Date.parse(i.isoDate as string) : Date.now(),
    author: i.creator || i.author || source || ""
  }));
  return { items, etag: res.headers.get("etag") || undefined, lastModified: res.headers.get("last-modified") || undefined };
}
