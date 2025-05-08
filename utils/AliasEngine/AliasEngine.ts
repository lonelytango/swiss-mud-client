import type { Alias, Variable } from '../../types';

export interface Command {
	type: 'command' | 'wait';
	content: string;
	waitTime?: number;
}

export async function expandAlias(
	input: string,
	aliases: Alias[],
	variables: Variable[] = []
): Promise<Command[] | null> {
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

			// Replace @variable with their values
			for (const variable of variables) {
				const re = new RegExp(`@${variable.name}\\b`, 'g');
				expanded = expanded.replace(re, variable.value);
			}

			// Process the expanded commands
			const commands: Command[] = [];
			const lines = expanded
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean);

			for (const line of lines) {
				// Handle wait command
				const waitMatch = line.match(/^#wa\s+(\d+)$/);
				if (waitMatch) {
					commands.push({
						type: 'wait',
						content: line,
						waitTime: parseInt(waitMatch[1], 10),
					});
					continue;
				}

				// Handle multiple commands
				const repeatMatch = line.match(/^#(\d+)\s+(.+)$/);
				if (repeatMatch) {
					const count = parseInt(repeatMatch[1], 10);
					const cmd = repeatMatch[2];
					for (let i = 0; i < count; i++) {
						commands.push({
							type: 'command',
							content: cmd,
						});
					}
					continue;
				}

				// Regular command
				commands.push({
					type: 'command',
					content: line,
				});
			}

			return commands;
		}
	}
	return null;
}
