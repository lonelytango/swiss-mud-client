// utils/ClientCommands.ts
// Handles client-side commands that don't get sent to the server.

export interface ClientCommand {
  name: string;
  aliases?: string[];
  description: string;
  execute: () => void;
}

export class ClientCommandManager {
  private commands: Map<string, ClientCommand> = new Map();

  constructor() {
    // Register default commands
    this.registerCommand({
      name: 'cls',
      aliases: ['clear', 'clear screen'],
      description: 'Clear the screen',
      execute: () => {
        // This will be set by the App component
        this.onClearScreen?.();
      },
    });
  }

  private onClearScreen?: () => void;

  public setClearScreenHandler(handler: () => void) {
    this.onClearScreen = handler;
  }

  public registerCommand(command: ClientCommand) {
    this.commands.set(command.name.toLowerCase(), command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias.toLowerCase(), command);
      });
    }
  }

  public executeCommand(input: string): boolean {
    const command = this.commands.get(input.toLowerCase());
    if (command) {
      command.execute();
      return true;
    }
    return false;
  }

  public getCommandHelp(): string[] {
    const help: string[] = [];
    const processed = new Set<string>();

    this.commands.forEach(command => {
      if (!processed.has(command.name)) {
        processed.add(command.name);
        const aliases = command.aliases
          ? ` (aliases: ${command.aliases.join(', ')})`
          : '';
        help.push(`${command.name}${aliases}: ${command.description}`);
      }
    });

    return help;
  }
}
