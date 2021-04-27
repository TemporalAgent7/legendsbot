import { Message } from 'discord.js';
import { Command } from './command';

import { DATA, Languages } from '../data';
import { COMMANDS } from '../handler';

export default class Help extends Command {
	constructor() {
		super({
			name: 'help',
			alias: ['h'],
			description: `List of supported commands.`,
			category: 'Information',
			usage: 'help [command]',
			cooldown: 1000,
			requiredPermissions: ['SEND_MESSAGES']
		});
	}

	public async run(message: Message, lang: Languages, args: string[]): Promise<void> {
		let cmd = "";
		if (args.length > 0) {
			cmd = args[0];
		}

		let helpMessage = `The Legendist bot is a work in progress. This is the list of commands it knows of so far:`;
		COMMANDS.forEach(c => {
			helpMessage += `\n- **${c.conf.name}** (aliases: ${c.conf.alias?.join(', ')}): ${c.conf.description} \`${c.conf.usage}\``
		});
		helpMessage += `\nIf you have suggestions or want to improve the bot, you can find the project at https://github.com/TemporalAgent7/legendsbot`;

		await super.respond(message.channel, helpMessage);
		return;
	}
}