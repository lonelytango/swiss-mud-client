import type { Alias } from '../../types';

export function expandAlias(input: string, aliases: Alias[]): string[] | null {
	for (const alias of aliases) {
		const regex = new RegExp(alias.pattern);
		const match = input.match(regex);
		if (match) {
			// Replace $1, $2, ... in command with capture groups
			let expanded = alias.command;
			for (let i = 1; i < match.length; i++) {
				const re = new RegExp(`\\$${i}`, 'g');
				expanded = expanded.replace(re, match[i]);
			}
			// Split by newlines, trim each line, filter out empty lines
			return expanded
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean);
		}
	}
	return null;
}
