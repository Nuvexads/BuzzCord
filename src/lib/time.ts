export function parseHHMM(s: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h * 60 + min;
}
export function nowMinutesOfDay(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
export function inQuietRange(startMin?: number|null, endMin?: number|null, nowMin?: number): boolean {
  if (startMin == null || endMin == null) return false;
  const now = nowMin ?? nowMinutesOfDay();
  if (startMin === endMin) return false;
  if (startMin < endMin) return now >= startMin && now < endMin;
  return now >= startMin || now < endMin;
}
