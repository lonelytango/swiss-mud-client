import { expandAlias } from './AliasEngine';
import { processTriggers } from './TriggerEngine';
import type { Alias, Variable, Trigger } from '../types';

export interface CommandEngineOptions {
	onCommandSend: (command: string) => void;
}

export class CommandEngine {
	private aliases: Alias[];
	private variables: Variable[];
	private triggers: Trigger[];
	private options: CommandEngineOptions;

	constructor(
		aliases: Alias[],
		variables: Variable[],
		triggers: Trigger[],
		options: CommandEngineOptions
	) {
		this.aliases = aliases;
		this.variables = variables;
		this.triggers = triggers;
		this.options = options;
	}

	public setAliases(aliases: Alias[]) {
		this.aliases = aliases;
	}

	public setVariables(variables: Variable[]) {
		this.variables = variables;
	}

	public setTriggers(triggers: Trigger[]) {
		this.triggers = triggers;
	}

	public async processCommand(input: string): Promise<void> {
		// Skip processing if input is empty or just whitespace
		if (!input.match(/^\s*$/)) {
			// Try alias expansion
			const expanded = expandAlias(input, this.aliases, this.variables);

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

	public processLine(line: string): void {
		const commands = processTriggers(
			line,
			this.triggers,
			this.options.onCommandSend
		);
		if (commands) {
			commands.forEach((command) => {
				this.options.onCommandSend(command.content);
			});
		}
	}
}
