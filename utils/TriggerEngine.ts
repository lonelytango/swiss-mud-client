import type { Trigger, Command } from '../types';

export function processTriggers(
	line: string,
	triggers: Trigger[],
	send: (command: string) => void
) {
	// Clean the line by removing carriage returns, newlines, and trailing prompts
	const cleanLine = line.replace(/\r\n> $/, '').trim();

	// Collect commands that will be executed
	const capturedCommands: Command[] = [];

	for (const trigger of triggers) {
		try {
			const regex = new RegExp(trigger.pattern, 'u');
			const matches = cleanLine.match(regex);

			if (matches) {
				// Check if this is a JavaScript command
				if (trigger.command.includes('matches[')) {
					try {
						// Create a function from the command string
						const commandFn = new Function('matches', 'send', trigger.command);
						// Execute the function with the matches and send function
						commandFn(matches, send);
					} catch (e) {
						console.error(`Error executing trigger "${trigger.name}":`, e);
					}
				} else {
					// Regular command with $1, $2, etc. replacement
					let command = trigger.command;
					for (let i = 1; i < matches.length; i++) {
						command = command.replace(
							new RegExp(`\\$${i}`, 'gu'),
							matches[i] || ''
						);
					}

					capturedCommands.push({
						type: 'command',
						content: command,
					});
				}
			}
		} catch (e) {
			console.error(`Error processing trigger "${trigger.name}":`, e);
		}
	}

	return capturedCommands.length > 0 ? capturedCommands : null;
}
