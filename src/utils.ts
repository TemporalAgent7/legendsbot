export function parseCommandInput(input: string): readonly string[] {
	let command = input.replace(/“/g, '"').replace(/”/g, '"').replace(/’/g, "'").trim();

	let args = command.split(/("[^"]*"|'[^']*'|[\S]+)+/g);
	if (args === undefined || args.length === 0) {
		return [];
	}

	return args.map((arg) => arg.replace(/"/g, '').replace(/'/g, '').trim()).filter((arg) => arg);
}

export function colorFromRarity(rarity: number): 'LIGHT_GREY' | [number, number, number] {
	switch (rarity) {
		case 1: // Common
			return [0, 0.9764706 * 255, 1];

		case 2: // Rare
			return [0.223529413 * 255, 0.917647064 * 255, 0.403921574 * 255];

		case 3: // VeryRare
			return [0.9882353 * 255, 0.58431375 * 255, 0.219607845 * 255];

		case 4: // Epic
			return [0.772549033 * 255, 0.34117648 * 255, 255];

		case 5: // Legendary
			return [0.8980392 * 255, 0.78039217 * 255, 0.20784314 * 255];

		default:
			return 'LIGHT_GREY';
	}
}
