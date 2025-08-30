# CONTRIBUE.md

Grazie per voler contribuire a **BuzzCord**!  
Questo documento spiega come impostare l’ambiente, lo stile del codice, il flusso PR e le regole per proporre feature/migrazioni.

---

## 🧰 Requisiti

- **Node.js 20+**
- **npm** 10+
- Discord **Bot Token** e **Client ID** (per test comandi)
- (opz.) **GUILD_ID** del tuo server di test

---

## 🚀 Setup progetto


`git clone https://github.com/Nuvexads/BuzzCord.git`

`cd BuzzCord`

`cp .env.example .env`

`npm ci`

`npm run migrate`


# Registra i comandi di gilda (istantanei):

## aggiungi GUILD_ID nel .env
`npm run deploy:commands`

# Avvio in sviluppo

`npm run dev`

# 📦 Script utili

`npm run lint    # ESLint v9, flat config`

`npm run build    # Compila TypeScript`

`npm test    # Node test runner`

`npm run migrate    # Migrazioni DB idempotenti`

`npm run deploy:clear    # (opz.) svuota i comandi registrati`

`npm run deploy:commands`
