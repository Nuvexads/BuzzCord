import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import social from "./commands/social.js";
import { tick } from "./lib/poller.js";

const client = new Client({ intents:[GatewayIntentBits.Guilds], partials:[Partials.Channel] });

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  const intervalMin = Number(process.env.DEFAULT_INTERVAL_MIN || 3);
  setInterval(() => tick(client), intervalMin * 60 * 1000);
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
