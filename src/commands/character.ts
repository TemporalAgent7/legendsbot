import { Message, MessageEmbed } from 'discord.js';
import { Command } from './command';
import { colorFromRarity } from '../utils';

import { DATA, Languages } from '../data';

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

	public async run(message: Message, lang: Languages, args: string[]): Promise<void> {
		if (args.length == 0) {
			await super.respond(message.channel, 'Please specify a character name');
			return;
		}

		let level = 99;
		if (args.length > 1) {
			level = Number.parseInt(args[1]);
			if (Number.isNaN(level) || (level < 1) || (level > 99)) {
				await super.respond(message.channel, `The level should be a number between 1 and 99 (you sent '${args[1]}')`);
				return;
			}
		}

		let rank = 9;
		if (args.length > 2) {
			rank = Number.parseInt(args[2]);
			if (Number.isNaN(rank) || (rank < 1) || (rank > 9)) {
				await super.respond(message.channel, `The rank should be a number between 1 and 9 (you sent '${args[2]}')`);
				return;
			}
		}

		let chars = DATA.searchCharacter(args[0]);
		if (chars && chars.length > 0) {
			if (chars.length > 1) {
				await super.respond(message.channel, `There are multiple characters matching '${args[0]}': ${chars.map(c => DATA.L(c.Name, lang)).join(', ')}. Which one did you mean?`);
				return;
			}

			let embed = new MessageEmbed()
				.setTitle(DATA.L(chars[0].Name, lang))
				.setURL('https://legends.datacore.app/')
				.setThumbnail(`https://legends.datacore.app/assets/${chars[0].Icon}.png`)
				.setColor(colorFromRarity(chars[0].Rarity))
				.setDescription(DATA.L(chars[0].Description, lang) + '\n' + DATA.L('stats_note', lang, level, rank))
				.addField(DATA.L('Common_CharacterSortingType_Role', lang), DATA.L('Common_CharacterRole_' + chars[0].Role, lang), true)
				.addField(DATA.L('UI_BridgeCrew_Popup_Title', lang), chars[0].BridgeStations.map((s: string) => DATA.L('UI_BridgeStation_' + s, lang)).join(', '), true)
				.addFields(DATA.charStats(chars[0], level, rank, lang))
				.addField(DATA.L('Data_Tooltip_HeroInfo_Tags_headerText', lang), chars[0].Tags.map((s: string) => DATA.L('Common_Tag_' + s, lang)).join(', '), true);

			if (chars[0].bridgeSkill) {
				let bSkill: any = (Object.values(chars[0].bridgeSkill)[0] as any[])[0];
				embed = embed.addField(`${DATA.L(bSkill.name, lang)} (${DATA.L('bridge_skill', lang)})`, DATA.L(bSkill.description, lang));
			}

			Object.values(chars[0].skills).forEach((skill: any) => {
				let description = skill.map((s: any) => `${DATA.L('Common_Level_X', lang, s.level)} : ${DATA.L(s.description, lang)}`).join('\n');

				let name = DATA.L(skill[0].name, lang);
				if (skill[0].cooldown > 0) {
					name += ` (${DATA.L('Battle_Text_Cooldown', lang, `${skill[0].cooldown} / ${skill[0].startingCooldown}`)})`;
				}

				embed = embed.addField(name, description);
			})

			embed = embed.setFooter(DATA.L("footer", lang));

			await super.respond(message.channel, embed);
			return;
		} else {
			await super.respond(message.channel, `Sorry, I couldn't find any character named '${args[0]}'!`);
			return;
		}
	}
}