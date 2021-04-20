import { Client } from "discord.js";
import { Logger } from "./logger";
import { parseCommandInput } from "./utils";
import { handleCommand } from "./handler";
import { DATA } from './data';

require('dotenv').config();

const client = new Client();

DATA.setup();

client.login(process.env.BOT_TOKEN);

// Link to invite the bot: https://discord.com/api/oauth2/authorize?client_id=833819108524556410&permissions=18432&scope=bot

client.on('ready', () => {
	Logger.info('Bot logged in', { bot_tag: client!.user!.tag });
});

client.on('message', (message) => {
	if (message.author.id === client!.user!.id) {
		return;
	}

	Logger.verbose('Message received', {
		id: message.id,
		author: { id: message.author.id, username: message.author.username },
		guild: message.guild ? message.guild.toString() : 'DM',
		channel: message.channel.toString(),
		content: message.content,
	});

	if (message.author.bot) {
		return;
	}

	const prefix = process.env.PREFIX || "!";

	if (message.content.startsWith(prefix)) {
		let parsedInput = parseCommandInput(message.content.slice(prefix.length).trim());

		handleCommand(message, parsedInput[0].toLowerCase(), parsedInput.slice(1));
	}
});
