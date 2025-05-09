import type { Alias, Variable } from '../types';
import { parseSpeedwalk } from './commands';

export interface Command {
	type: 'command' | 'wait';
	content: string;
	waitTime?: number;
}

// This function expands an input string according to the defined aliases and variables
export function expandAlias(
	input: string,
	aliases: Alias[],
	variables: Variable[]
): Command[] | null {
	for (const alias of aliases) {
		const regex = new RegExp(alias.pattern);
		const match = input.match(regex);
		if (match) {
			// Collect commands that will be executed
			const capturedCommands: Command[] = [];

			// Create wrapper functions to capture the commands
			const send = (command: string) => {
				capturedCommands.push({ type: 'command', content: command });
				// We don't actually execute the command here, just capture it
			};

			const wait = (ms: number) => {
				capturedCommands.push({ type: 'wait', content: '', waitTime: ms });
				// We don't actually wait here, just capture the wait instruction
				return Promise.resolve(); // Return a resolved promise for compatibility
			};

			const speedwalk = (actions: string) => {
				const directionCommands = parseSpeedwalk(actions);
				capturedCommands.push(
					...directionCommands.map((command) => ({
						type: 'command' as const,
						content: command,
					}))
				);
			};

			// Process the expanded commands
			const lines = alias.command
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean);

			// Create a sandbox environment with necessary context
			const sandbox: any = {
				matches: match,
				send,
				wait,
				speedwalk,
			};

			// Add existing variables to the sandbox as READ-ONLY properties
			variables.forEach((variable) => {
				if (variable.name) {
					// Define the variable as a getter-only property to prevent modification
					Object.defineProperty(sandbox, variable.name, {
						get: () => variable.value,
						enumerable: true,
						configurable: false,
					});
				}
			});

			// Create a function that executes the alias command code
			const aliasFunction = new Function(
				...Object.keys(sandbox),
				`
					// Add protection to prevent variable creation/modification
					"use strict";
					${lines.join('\n')}
					`
			);

			// Execute the function with our sandbox context
			try {
				aliasFunction(...Object.values(sandbox));

				// We don't check for or update variables anymore
				// Variables are managed through the VariableView component
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error('Error executing alias:', error.message);
				} else {
					console.error('Error executing alias:', error);
				}
				return null; // Return null on error
			}

			return capturedCommands.length > 0 ? capturedCommands : null;
		}
	}
	return null; // No matching alias found
}
