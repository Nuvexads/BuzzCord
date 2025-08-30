# BuzzCord

Bot **FOSS** di notifiche social per Discord.
Porta contenuti **RSS**, **YouTube** e **Twitch** dentro i tuoi canali con **embed curate**, badge, pulsanti e template personalizzabili.

---

[![GitHub commits since latest release](https://img.shields.io/github/commits-since/Nuvexads/BuzzCord/latest)](https://github.com/Nuvexads/BuzzCord/commits/)
[![GitHub last commit](https://img.shields.io/github/last-commit/Nuvexads/BuzzCord)](https://github.com/Nuvexads/BuzzCord/commits/)
[![Test Bot](https://github.com/Nuvexads/BuzzCord/actions/workflows/ci.yml/badge.svg)](https://github.com/Nuvexads/BuzzCord/actions/workflows/ci.yml)

---

## ✨ Caratteristiche

* **Provider**: RSS generico · YouTube (feed uploads, nessuna API key) · Twitch (Helix polling)
* **Estetica**: badge per provider (📺 🔴 📰), colori brand, author line, footer coerente, thumbnail
* **Pulsanti**: “Apri” + “Canale”
* **Template per-server**: testo personalizzabile con variabili
* **Throttle per sottoscrizione**: evita spam e burst
* **Dedupe**: zero doppioni grazie a GUID per item
* **SQLite** veloce con `better-sqlite3`

---

## 📦 Requisiti

* **Node.js 20+**
* Un **bot token** Discord e **Client ID**
* (per Twitch) `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`

---

## 🚀 Avvio rapido

```bash
git clone https://github.com/Nuvexads/BuzzCord.git
cd BuzzCord
cp .env.example .env
npm install
npm run deploy:commands
npm run dev
```

> Se usi il CI, mantieni nel repo il `package-lock.json` per permettere `npm ci`.

---

## ⚙️ Variabili d’ambiente

```env
DISCORD_TOKEN=             # Token bot
DISCORD_CLIENT_ID=         # App ID
DATABASE_URL=./data/buzzcord.db
DEFAULT_INTERVAL_MIN=3     # intervallo polling (minuti)
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

---

## 🕹️ Comandi

* `/social addrss url:<feed_url>`
* `/social addyoutube channel_id:<id>`
* `/social addtwitch user:<login_o_user_id>`
* `/social list`
* `/social remove subscription_id:<id>`
* `/social throttle subscription_id:<id> seconds:<s>`
* `/social template subscription_id:<id> text:"..."`

---

## 🖌️ Template messaggi

Puoi personalizzare il testo sopra l’embed. Variabili disponibili:
`{badge} {title} {url} {author} {type} {unix}`

**Esempi**

```
{badge} **{title}** — <t:{unix}:R> → {url}
```

```
{badge} **{title}** di _{author}_ • <t:{unix}:R>
{url}
```

```
{badge} {title} • <t:{unix}:R>
```

> `{unix}` è il timestamp (in secondi) per il rendering relativo di Discord. `{badge}` usa automaticamente l’emoji del provider.

---

## 🎨 Estetica

Palette e icone gestite da `src/lib/theme.ts`:

* **YouTube**: rosso · 📺 · icona ufficiale
* **Twitch**: viola · 🔴 · icona ufficiale
* **RSS**: blu · 📰

L’embed include: **titolo + link**, **thumbnail**, **author line**, **footer** “BuzzCord • Notifiche social”, **timestamp**.

---

## 🧠 Come funziona

* Un **poller** controlla i feed a intervallo regolare (con jitter per evitare overlap).
* Ogni **sottoscrizione** ha throttle e template.
* Gli **item** sono deduplicati tramite GUID.

**Struttura**

```
src/
  commands/social.ts
  lib/{db,notify,theme,poller}.ts
  providers/{rss,youtube,twitch}.ts
  index.ts
```

---

## 🧪 Sviluppo

```bash
npm run lint   # ESLint v9 (flat config: eslint.config.js)
npm run build  # compila TypeScript
npm test       # test runner di Node
```

> Se compare un errore ESLint sul file `.eslintrc.cjs`, assicurati che non sia versionato (BuzzCord usa la flat config `eslint.config.js`).

---

## 🐳 Docker (opzionale)

**Dockerfile**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY ./.env.example ./.env.example
COPY ./data ./data
CMD ["node","dist/index.js"]
```

**docker-compose.yml**

```yaml
version: "3.9"
services:
  buzzcord:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/app/data
```

---

## 🔐 Privacy

BuzzCord salva solo i dati necessari: ID server/canali, configurazioni feed e GUID item notificati.
Nessun contenuto dei messaggi degli utenti viene memorizzato.

---

## 🗺️ Roadmap

* EventSub Twitch (webhook)
* Provider extra: Reddit, Mastodon, GitHub Releases
* Dashboard web (OAuth2) per gestione via UI
* Preset estetici: `compact` / `rich`

---

## 📝 Changelog

Vedi `CHANGELOG.md` e i tag di rilascio.
**Full Changelog** di un tag: `https://github.com/Nuvexads/BuzzCord/commits/<tag>`

---

## 🤝 Contribuire

PR e issue benvenute!

**Linee guida**

* Lint pulito e build verde
* Test quando possibile
* Niente segreti nei commit
* Descrizioni chiare in PR

---

## 📄 Licenza

[MIT](./LICENSE)
