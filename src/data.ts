import { readFileSync } from 'fs';

interface GSLevel {
	"Rarity": string,
	"Level": number,
	"Experience": number,
	"HealthModifier": number,
	"DefenseModifier": number,
	"AttackModifier": number,
	"TechModifier": number,
	"SpeedModifier": number
}

interface GSRank {
	"Rarity": string,
	"Rank": number,
	"HealthModifier": number,
	"DefenseModifier": number,
	"AttackModifier": number,
	"TechModifier": number,
	"SpeedModifier": number
}

interface GSBaseStat {
	"MinValue": number,
	"MaxValue": number,
	"PowerWeight": number,
	"id": string
}

class StatsModifiers {
	rankModifiers: { [key: string]: GSRank } = {};
	levelModifiers: { [key: string]: GSLevel } = {};
	baseStats: { [key: string]: GSBaseStat } = {};

	public setup() {
		this.rankModifiers = JSON.parse(readFileSync('./data/GSRank.json', 'utf8'));
		this.levelModifiers = JSON.parse(readFileSync('./data/GSLevel.json', 'utf8'));
		this.baseStats = JSON.parse(readFileSync('./data/GSBaseStat.json', 'utf8'));
	}

	getRankModifiers(rarity: string, rank: number): GSRank {
		for (const entry of Object.values(this.rankModifiers)) {
			if (entry.Rarity == rarity && entry.Rank == rank) {
				return entry;
			}
		}

		console.warn(`RankModifier not found for '${rarity}'`);

		return {
			Rarity: rarity,
			Rank: rank,
			HealthModifier: 1,
			DefenseModifier: 1,
			AttackModifier: 1,
			TechModifier: 1,
			SpeedModifier: 1
		};
	}

	getLevelModifiers(rarity: string, level: number): GSLevel {
		for (const entry of Object.values(this.levelModifiers)) {
			if (entry.Rarity == rarity && entry.Level == level) {
				return entry;
			}
		}

		console.warn(`LevelModifier not found for '${rarity}'`);

		return {
			Rarity: rarity,
			Level: level,
			Experience: 0,
			HealthModifier: 1,
			DefenseModifier: 1,
			AttackModifier: 1,
			TechModifier: 1,
			SpeedModifier: 1
		};
	}

	clamp01(value: number) {
		return value < 0 ? 0 : value > 1 ? 1 : value;
	}

	lerpUnclamped(a: number, b: number, t: number) {
		if (t < 0 || t > 1) {
			return a + Math.abs(b - a) * t;
		}

		return (b - a) * this.clamp01(t) + a;
	}

	getStatValue(type: string, value: number, modifier: number, gearStatChange = 0, accessoryStatChange = 0) {
		let baseStatValue = this.baseStats[type];
		if (!baseStatValue) {
			return { baseValue: 1, finalValue: 1, finalPowerValue: 1 };
		}

		let baseValue = this.lerpUnclamped(baseStatValue.MinValue, baseStatValue.MaxValue, value) * modifier;

		// TODO: How are these actually calculated !?
		baseValue = value * modifier;

		let finalValue = baseValue + gearStatChange + accessoryStatChange;
		finalValue = Math.max(finalValue, type == 'MaxHealth' ? 1 : 0);

		let num = baseStatValue.MaxValue - baseStatValue.MinValue;
		if (Math.abs(num) < Number.EPSILON) {
			return { baseValue: 0, finalValue: 0, finalPowerValue: 0 };;
		}

		let finalPowerValue = ((finalValue - baseStatValue.MinValue) / num) * baseStatValue.PowerWeight;

		baseValue = Math.floor(baseValue * 100) / 100;

		//console.log(type, value, modifier, { baseValue, finalValue, finalPowerValue });

		return { baseValue, finalValue, finalPowerValue };
	}

	_modifierFromType(type: string) {
		switch (type) {
			case 'MaxHealth': return 'HealthModifier';
			case 'Defense': return 'DefenseModifier';
			case 'Attack': return 'AttackModifier';
			case 'Tech': return 'TechModifier';
			case 'Speed': return 'SpeedModifier';
			default: return 'SpeedModifier';
		}
	}

	public get(type: string, value: number, rarity: string, level: number, rank: number) {
		return this.getStatValue(type, value,
			this.getRankModifiers(rarity, rank)[this._modifierFromType(type)] * this.getLevelModifiers(rarity, level)[this._modifierFromType(type)])
	}
}

class DataClass {
	private _characters: any[] = [];
	private _lang: any[] = [];
	private _statsModifiers = new StatsModifiers();

	public setup(): void {
		this._statsModifiers.setup();

		// TODO: data reloading with bot alive
		this._characters = JSON.parse(readFileSync('./data/characters.json', 'utf8'));
		this._lang = JSON.parse(readFileSync('./data/lang_en_us.json', 'utf8'));

		// Localize
		this._characters.forEach(char => {
			char.locName = this._lang[char.name];
			char.locDescription = this._lang[char.description];
		})
	}

	public searchCharacter(searchString: string) {
		let found = this._characters.filter(
			c =>
				c.name.toLowerCase() === searchString.toLowerCase() ||
				c.name
					.replace(/"/g, '')
					.replace(/'/g, '')
					.replace(/“/g, '')
					.replace(/’/g, '')
					.toLowerCase() === searchString.toLowerCase()
		);
		if (found && found.length === 1) {
			return [found[0]];
		}

		found = this._characters.filter(c => c.name.toLowerCase().indexOf(searchString.toLowerCase()) >= 0);
		return found;
	}

	public charStats(character: any, level: number = 99, rank: number = 9) {
		let totalPower = Math.floor(this._statsModifiers.getStatValue('GlancingChance', character.GlancingChance, 1).finalPowerValue +
			this._statsModifiers.getStatValue('GlancingDamage', character.GlancingDamage, 1).finalPowerValue +
			this._statsModifiers.getStatValue('CritChance', character.CritChance, 1).finalPowerValue +
			this._statsModifiers.getStatValue('CritDamage', character.CritDamage, 1).finalPowerValue +
			this._statsModifiers.getStatValue('Resolve', character.Resolve, 1).finalPowerValue +
			this._statsModifiers.get('MaxHealth', character.Health, character.rarity, level, rank).finalPowerValue +
			this._statsModifiers.get('Defense', character.Defense, character.rarity, level, rank).finalPowerValue +
			this._statsModifiers.get('Attack', character.Attack, character.rarity, level, rank).finalPowerValue +
			this._statsModifiers.get('Tech', character.Tech, character.rarity, level, rank).finalPowerValue +
			this._statsModifiers.get('Speed', character.Speed, character.rarity, level, rank).finalPowerValue)

		return [{ name: "Total Power", value: totalPower, inline: false },
		{ name: "Health", value: Math.floor(this._statsModifiers.get('MaxHealth', character.Health, character.rarity, level, rank).baseValue), inline: true },
		{ name: "Defense", value: Math.floor(this._statsModifiers.get('Defense', character.Defense, character.rarity, level, rank).baseValue), inline: true },
		{ name: "Attack", value: Math.floor(this._statsModifiers.get('Attack', character.Attack, character.rarity, level, rank).baseValue), inline: true },
		{ name: "Tech", value: Math.floor(this._statsModifiers.get('Tech', character.Tech, character.rarity, level, rank).baseValue), inline: true },
		{ name: "Speed", value: Math.floor(this._statsModifiers.get('Speed', character.Speed, character.rarity, level, rank).baseValue), inline: true },
		{ name: "Glancing Chance", value: `${Math.floor(this._statsModifiers.getStatValue('GlancingChance', character.GlancingChance, 1).baseValue * 100)}%`, inline: true },
		{ name: "Glancing Damage", value: `${Math.floor(this._statsModifiers.getStatValue('GlancingDamage', character.GlancingDamage, 1).baseValue * 100)}%`, inline: true },
		{ name: "Crit Chance", value: `${Math.floor(this._statsModifiers.getStatValue('CritChance', character.CritChance, 1).baseValue * 100)}%`, inline: true },
		{ name: "Crit Damage", value: `${Math.floor(this._statsModifiers.getStatValue('CritDamage', character.CritDamage, 1).baseValue * 100)}%`, inline: true },
		{ name: "Resolve", value: `${Math.floor(this._statsModifiers.getStatValue('Resolve', character.Resolve, 1).baseValue * 100)}%`, inline: true }];
	}
}

export let DATA = new DataClass();