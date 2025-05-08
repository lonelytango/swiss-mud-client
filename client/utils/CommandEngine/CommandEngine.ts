import { Command, expandAlias } from '../AliasEngine/AliasEngine';
import type { Alias } from '../../types';

export interface CommandEngineOptions {
	onCommandDisplay: (commands: Command[]) => void;
	onCommandSend: (command: string) => void;
}

export class CommandEngine {
	private aliases: Alias[];
	private options: CommandEngineOptions;

	constructor(aliases: Alias[], options: CommandEngineOptions) {
		this.aliases = aliases;
		this.options = options;
	}

	public setAliases(aliases: Alias[]) {
		this.aliases = aliases;
	}

	public async processCommand(input: string): Promise<void> {
		// Try alias expansion
		const expanded = await expandAlias(input, this.aliases);
		const commands: Command[] = expanded
			? expanded
			: [{ type: 'command', content: input }];

		// Display commands
		this.options.onCommandDisplay(commands);

		// Execute commands
		if (expanded) {
			// Process commands with waits
			for (const cmd of expanded) {
				if (cmd.type === 'wait') {
					await new Promise((resolve) => setTimeout(resolve, cmd.waitTime));
				} else {
					this.options.onCommandSend(cmd.content);
				}
			}
		} else {
			this.options.onCommandSend(input);
		}
	}
}
