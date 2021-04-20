import { Message } from "discord.js";

import { Command } from './commands/command';
import Character from './commands/character';

const COMMANDS: Command[] = [
	new Character()
];

export async function handleCommand(message: Message, command: string, args: string[]) {
	const cmd = COMMANDS.find(c => c.conf.name === command || (c.conf.alias && c.conf.alias.includes(command)));

	if (!cmd || !cmd.canRun(message.author, message)) {
		return;
	}

	await cmd.run(message, args);

	if (message.guild) {
		cmd.setCooldown(message.author, message.guild);
	}
}