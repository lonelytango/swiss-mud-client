import { Command, expandAlias } from '../AliasEngine/AliasEngine';
import type { Alias, Variable } from '../../types';

export interface CommandEngineOptions {
	onCommandDisplay?: (commands: Command[]) => void;
	onCommandSend: (command: string) => void;
}

export class CommandEngine {
	private aliases: Alias[];
	private variables: Variable[];
	private options: CommandEngineOptions;

	constructor(
		aliases: Alias[],
		variables: Variable[],
		options: CommandEngineOptions
	) {
		this.aliases = aliases;
		this.variables = variables;
		this.options = options;
	}

	public setAliases(aliases: Alias[]) {
		this.aliases = aliases;
	}

	public setVariables(variables: Variable[]) {
		this.variables = variables;
	}

	public async processCommand(input: string): Promise<void> {
		// Skip processing if input is empty or just whitespace
		if (!input.match(/^\s*$/)) {
			// Try alias expansion
			const expanded = expandAlias(input, this.aliases, this.variables);

			console.log('Expanded:', expanded);

			// Notify about expanded commands if callback is provided
			if (expanded && this.options.onCommandDisplay) {
				this.options.onCommandDisplay(expanded);
			}

			// Execute commands
			if (expanded) {
				// Process commands with waits
				for (const cmd of expanded) {
					if (cmd.type === 'wait' && cmd.waitTime) {
						await new Promise((resolve) => setTimeout(resolve, cmd.waitTime));
					} else if (cmd.type === 'command') {
						this.options.onCommandSend(cmd.content);
					}
				}
			} else {
				// No alias matched, send the raw input
				this.options.onCommandSend(input);
			}
		}
	}
}
