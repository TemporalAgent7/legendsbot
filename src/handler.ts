import { Message, TextChannel } from "discord.js";

import { Languages } from './data';
import { Command } from './commands/command';
import Character from './commands/character';
import Mission from './commands/mission';
import Help from './commands/help';

export const COMMANDS: Command[] = [
	new Character(),
	new Mission(),
	new Help()
];

export async function handleCommand(message: Message, command: string, args: string[]) {
	const cmd = COMMANDS.find(c => c.conf.name === command || (c.conf.alias && c.conf.alias.includes(command)));

	if (!cmd || !cmd.canRun(message.author, message)) {
		return;
	}

	// Extract the language (if given)
	let lang = Languages.EN;

	if (message.channel.isText()) {
		let channelName = (message.channel as TextChannel).name;
		if (channelName == "french") {
			lang = Languages.FR;
		} else if (channelName == "german") {
			lang = Languages.DE;
		} else if (channelName == "spanish") {
			lang = Languages.ES;
		}
	}

	let filteredArgs: string[] = [];
	args.forEach(arg => {
		if (arg.startsWith('-l')) {
			switch (arg.substr(2)) {
				case 'en': lang = Languages.EN; break;
				case 'de': lang = Languages.DE; break;
				case 'es': lang = Languages.ES; break;
				case 'fr': lang = Languages.FR; break;
				default: lang = Languages.EN;
			}
		} else {
			filteredArgs.push(arg);
		}
	})

	await cmd.run(message, lang, filteredArgs);

	if (message.guild) {
		cmd.setCooldown(message.author, message.guild);
	}
}