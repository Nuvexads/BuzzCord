import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import social from "./commands/social.js";
import { tick } from "./lib/poller.js";

const client = new Client({ intents:[GatewayIntentBits.Guilds], partials:[Partials.Channel] });

let running = false;
async function runTick() {
  if (running) return;
  running = true;
  try { await tick(client); } finally { running = false; }
  const base = Number(process.env.DEFAULT_INTERVAL_MIN || 3) * 60000;
  const jitter = Math.floor(Math.random() * 10000);
  setTimeout(runTick, base + jitter);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  runTick();
});

client.on("interactionCreate", async (inter: Interaction) => {
  if (!inter.isChatInputCommand()) return;
  if (inter.commandName === social.data.name) {
    try {
      await social.execute(inter);
    } catch (e) {
      console.error(e);
      if (inter.deferred || inter.replied) {
        await inter.editReply("Errore durante l'esecuzione del comando.");
      } else {
        await inter.reply({ content: "Errore durante l'esecuzione del comando.", ephemeral: true });
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
