import "dotenv/config";
import { REST, Routes } from "discord.js";
import social from "./commands/social.js";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body: [social.data.toJSON()] });
console.log("Slash commands registrati");
