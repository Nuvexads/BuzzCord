type TwitchToken = { access_token: string; expires_in: number; obtained_at: number };
let token: TwitchToken | null = null;

async function getToken() {
  if (token && Date.now() < token.obtained_at + (token.expires_in - 60) * 1000) return token.access_token;
  const params = new URLSearchParams();
  params.set("client_id", process.env.TWITCH_CLIENT_ID as string);
  params.set("client_secret", process.env.TWITCH_CLIENT_SECRET as string);
  params.set("grant_type", "client_credentials");
  const res = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", body: params });
  const data: any = await res.json();
  token = { access_token: data.access_token, expires_in: data.expires_in, obtained_at: Date.now() };
  return token.access_token;
}

export async function resolveUser(loginOrId: string) {
  const access = await getToken();
  const isId = /^[0-9]+$/.test(loginOrId);
  const qs = new URLSearchParams(isId ? { id: loginOrId } : { login: loginOrId });
  const res = await fetch("https://api.twitch.tv/helix/users?" + qs.toString(), {
    headers: { "Client-Id": process.env.TWITCH_CLIENT_ID as string, "Authorization": "Bearer " + access }
  });
  const j: any = await res.json();
  return j.data && j.data.length ? j.data[0] : null;
}

export async function fetchTwitch(userIdOrLogin: string) {
  const user = await resolveUser(userIdOrLogin);
  if (!user) return [];
  const user_id = user.id;
  const access = await getToken();
  const res = await fetch("https://api.twitch.tv/helix/streams?user_id=" + user_id, {
    headers: { "Client-Id": process.env.TWITCH_CLIENT_ID as string, "Authorization": "Bearer " + access }
  });
  const j: any = await res.json();
  if (!j.data || !j.data.length) return [];
  const s = j.data[0];
  const thumb = (s.thumbnail_url || "").replace("{width}", "1280").replace("{height}", "720");
  return [{
    guid: s.id,
    title: s.title || "Live su Twitch",
    url: "https://twitch.tv/" + user.login,
    date: Date.parse(s.started_at),
    thumb,
    author: user.display_name || user.login
  }];
}
