import { processAliases } from './AliasEngine';
import { processTriggers } from './TriggerEngine';
import type { Alias, Variable, Trigger, Settings } from '../types';

export interface CommandEngineOptions {
  onCommandSend: (command: string, settings: Settings) => void;
  onVariableSet?: (name: string, value: string) => void;
}

export class CommandEngine {
  private aliases: Alias[];
  private variables: Variable[];
  private triggers: Trigger[];
  private options: CommandEngineOptions;
  private settings: Settings;

  constructor(
    aliases: Alias[],
    variables: Variable[],
    triggers: Trigger[],
    settings: Settings,
    options: CommandEngineOptions
  ) {
    this.aliases = aliases;
    this.variables = variables;
    this.triggers = triggers;
    this.options = options;
    this.settings = settings;
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

  public setSettings(settings: Settings) {
    this.settings = settings;
  }

  public async processCommand(input: string): Promise<void> {
    // Try alias expansion
    const expanded = processAliases(
      input,
      this.aliases,
      this.variables,
      this.options.onVariableSet
    );

    // Execute commands
    if (expanded) {
      // Process commands with waits
      for (const cmd of expanded) {
        if (cmd.type === 'wait' && cmd.waitTime) {
          await new Promise(resolve => setTimeout(resolve, cmd.waitTime));
        } else if (cmd.type === 'command') {
          this.options.onCommandSend(cmd.content, this.settings);
        }
      }
    } else {
      // No alias matched, send the raw input
      this.options.onCommandSend(input, this.settings);
    }
  }

  // Handle trigger send
  private triggerSend = (command: string) => {
    return this.options.onCommandSend(command, this.settings);
  };

  public processLine(line: string): void {
    const commands = processTriggers(
      line,
      this.triggers,
      this.triggerSend,
      this.options.onVariableSet,
      this.variables
    );
    if (commands) {
      commands.forEach(command => {
        this.options.onCommandSend(command.content, this.settings);
      });
    }
  }
}
