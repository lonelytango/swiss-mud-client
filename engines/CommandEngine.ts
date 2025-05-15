// engines/CommandEngine.ts
// Engine for processing commands.

import { processPatterns } from './PatternEngine';
import type { Variable, Settings, Alias, Trigger, Script } from '../types';

export interface CommandEngineOptions {
  onCommandSend: (command: string, settings: Settings) => void;
  onVariableSet?: (name: string, value: string) => void;
}

export class CommandEngine {
  private aliases: Alias[];
  private variables: Variable[];
  private triggers: Trigger[];
  private scripts: Script[];
  private options: CommandEngineOptions;
  private settings: Settings;

  constructor(
    aliases: Alias[],
    variables: Variable[],
    triggers: Trigger[],
    settings: Settings,
    options: CommandEngineOptions,
    scripts: Script[] = []
  ) {
    this.aliases = aliases;
    this.variables = variables;
    this.triggers = triggers;
    this.scripts = scripts;
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

  public setScripts(scripts: Script[]) {
    this.scripts = scripts;
  }

  public setSettings(settings: Settings) {
    this.settings = settings;
  }

  public async processPattern(
    input: string,
    type: 'alias' | 'trigger'
  ): Promise<void> {
    const patterns = type === 'alias' ? this.aliases : this.triggers;
    const commands = processPatterns(
      input,
      patterns,
      this.variables,
      this.options.onVariableSet,
      this.scripts
    );

    if (commands) {
      commands.forEach(command => {
        this.options.onCommandSend(command.content, this.settings);
      });
    }
  }
}
