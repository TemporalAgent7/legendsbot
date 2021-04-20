import { Message, MessageEmbed } from 'discord.js';
import { Command } from './command';
import { colorFromRarity } from '../utils';

import { DATA } from '../data';

export default class Character extends Command {
	constructor() {
		super({
			name: 'character',
			alias: ['c'],
			description: `Get a character's stats.`,
			category: 'Information',
			usage: 'character [name] [level] [rank]',
			cooldown: 1000,
			requiredPermissions: ['SEND_MESSAGES']
		});
	}

	public async run(message: Message, args: string[]): Promise<void> {
		if (args.length == 0) {
			await super.respond(message.channel, 'Please specify a character name');
			return;
		}

		let level = 99;
		if (args.length > 1) {
			level = Number.parseInt(args[1]);
			if (Number.isNaN(level) || (level < 1) || (level > 99)) { 
				await super.respond(message.channel, `The level should be a number between 1 and 90 (you sent '${args[1]}')`);
				return;
				level = 99;
			}
		}

		let rank = 9;
		if (args.length > 2) {
			rank = Number.parseInt(args[2]);
			if (Number.isNaN(rank) || (rank < 1) || (rank > 9)) { 
				await super.respond(message.channel, `The rank should be a number between 1 and 9 (you sent '${args[2]}')`);
				return;
				rank = 9;
			}
		}

		let chars = DATA.searchCharacter(args[0]);
		if (chars && chars.length > 0) {
			if (chars.length > 1) {
				await super.respond(message.channel, `There are multiple characters matching '${args[0]}': ${chars.map(c => c.locName).join(', ')}. Which one did you mean?`);
				return;
			}
			
			let embed = new MessageEmbed()
				.setTitle(chars[0].locName)
				.setURL('https://legends.datacore.app/')
				.setThumbnail(`https://legends.datacore.app/assets/${chars[0].icon}.png`)
				.setColor(colorFromRarity(chars[0].computed_rarity))
				.setDescription(chars[0].locDescription + `\nThese stats are for **level ${level}** and **rank ${rank}** with no gear or particle bonuses`)
				.addField('Role', chars[0].role, true)
				.addField('Bridge Stations', chars[0].bridgeStations.join(', '), true)
				.addFields(DATA.charStats(chars[0], level, rank))
				.addField('Tags', chars[0].tags.join(', '), true)
				.setFooter('Have recommendations for the bot? Ping TemporalAgent7')

			await super.respond(message.channel, embed);
			return;
		} else {
			await super.respond(message.channel, `Sorry, I couldn't find any character named '${args[0]}'!`);
			return;
		}
	}
}