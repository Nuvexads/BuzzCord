import "dotenv/config";
import { REST, Routes } from "discord.js";
import social from "./commands/social.js";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
const appId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.GUILD_ID;

const body = [social.data.toJSON()];

if (guildId) {
  await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
  console.log(`Registered ${body.length} guild command(s) to ${guildId}`);
} else {
  await rest.put(Routes.applicationCommands(appId), { body });
  console.log(`Registered ${body.length} global command(s)`);
}
