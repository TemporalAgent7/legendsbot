import { Message, MessageEmbed } from 'discord.js';
import { Command } from './command';
import { colorFromRarity } from '../utils';

import { DATA, Languages } from '../data';

function titleCase(v: string) {
	return v[0].toUpperCase() + v.slice(1).toLowerCase();
}

function difficultyLoc(diff: string) {
	if (diff == "Easy") return "UI_Common_Difficulty_Normal"; else
		if (diff == "Hard") return "UI_Common_Difficulty_Advanced"; else
			if (diff == "Doom") return "UI_Common_Difficulty_Expert"; else
				return "UI_Common_Difficulty_Normal";
}

function formatDifficultyFields(data: any, lang: Languages, joiner: string = ', ', lmb?: (a: any) => string) {
	let fmt: string[] = [];
	Object.keys(data).forEach(k => {
		fmt.push(`*${titleCase(DATA.L(difficultyLoc(k), lang))}*: ${lmb ? lmb(data[k]) : data[k]}`);
	});

	return fmt.join(joiner);
}

export default class Mission extends Command {
	constructor() {
		super({
			name: 'mission',
			alias: ['m'],
			description: `Get details about a mission.`,
			category: 'Information',
			usage: 'mission [episode_number] [mission_number]',
			cooldown: 1000,
			requiredPermissions: ['SEND_MESSAGES']
		});
	}

	public async run(message: Message, lang: Languages, args: string[]): Promise<void> {
		if (args.length == 0) {
			await super.respond(message.channel, 'Please specify an episode and mission');
			return;
		}

		let episode = Number.parseInt(args[0].replace(/\D/g, ''));
		if (Number.isNaN(episode) || (episode < 1) || (episode > 7)) {
			await super.respond(message.channel, `The episode should be a number between 1 and 7 (you sent '${args[0]}')`);
			return;
		}

		let mission = 1;
		if (args.length > 1) {
			mission = Number.parseInt(args[1].replace(/\D/g, ''));
			if (Number.isNaN(mission) || (mission < 1) || (mission > 6)) {
				await super.respond(message.channel, `The mission should be a number between 1 and 6 (you sent '${args[1]}')`);
				return;
			}
		}

		let missionData = DATA.getMission(episode, mission);
		if (!missionData) {
			await super.respond(message.channel, `Sorry, I wasn't able to load the mission data for episode ${episode}, mission ${mission}. Please notify the bot maintainer!`);
			return;
		}

		let embed = new MessageEmbed()
			.setTitle(`${DATA.L(missionData.name, lang)} (E${episode}M${mission})`)
			.setURL(`https://legends.datacore.app/mission/${missionData.nodesAsset}`)
			.setThumbnail(`https://legends.datacore.app/assets/${missionData.backgroundImage}.png`)
			.setColor(colorFromRarity("Legendary"))
			.setDescription(DATA.L(missionData.description, lang))
			.addField(DATA.L('suggested_power', lang), formatDifficultyFields(missionData.suggestedPower, lang));

		let firsttime = missionData.rewards.find((r: any) => r.id.endsWith("firsttime"));
		if (firsttime) {
			embed = embed.addField(titleCase(DATA.L('UI_EncounterPreview_RewardTitle_Completion', lang)), formatDifficultyFields(firsttime.rewards, lang, '\n'))
				.addField(titleCase(DATA.L('UI_EncounterPreview_RewardTitle_Completion', lang)) + " (XP)", formatDifficultyFields(firsttime.xp, lang));
		}

		let replay = missionData.rewards.find((r: any) => r.id.endsWith("replay"));
		if (replay) {
			embed = embed.addField(titleCase(DATA.L('UI_EncounterPreview_RewardTitle_Replay', lang)), formatDifficultyFields(replay.rewards, lang))
				.addField(titleCase(DATA.L('UI_EncounterPreview_RewardTitle_Replay', lang)) + " (XP)", formatDifficultyFields(replay.xp, lang));
		}

		if (missionData.reqSummary) {
			embed = embed.addField(DATA.L('prof_100', lang), formatDifficultyFields(missionData.reqSummary, lang, '\n', (d: any) => `**${d.value}** (${d.skills.map((s: string) => DATA.L(`Common_CharacterRole_${s}`, lang)).join(', ')})`))
		}

		embed = embed.setFooter(DATA.L("footer", lang));

		await super.respond(message.channel, embed);
		return;
	}
}