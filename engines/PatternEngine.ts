import type { Variable, Command } from '../types';
import { parseSpeedwalk } from '../utils/CommandUtils';
import { alert } from '../utils/CommandAction';

export function processPatterns(
  input: string,
  patterns: Array<{
    pattern: string;
    command: string;
    enabled: boolean;
    name?: string;
  }>,
  variables: Variable[],
  setVariable?: (name: string, value: string) => void,
  type: 'alias' | 'trigger' = 'alias'
): Command[] | null {
  for (const patternObj of patterns) {
    if (!patternObj.enabled) continue;
    const regex = new RegExp(patternObj.pattern);
    const match = input.match(regex);
    if (match) {
      const capturedCommands: Command[] = [];

      // Helper functions
      const send = (command: string) => {
        capturedCommands.push({ type: 'command' as const, content: command });
      };
      const sendAll = (...commands: string[]) => {
        commands.forEach(command => {
          capturedCommands.push({ type: 'command' as const, content: command });
        });
      };
      const wait = (ms: number) => {
        capturedCommands.push({ type: 'wait', content: '', waitTime: ms });
        return Promise.resolve();
      };
      const speedwalk = (actions: string) => {
        const directionCommands = parseSpeedwalk(actions);
        capturedCommands.push(
          ...directionCommands.map(command => ({
            type: 'command' as const,
            content: command,
          }))
        );
      };

      // Prepare sandbox
      const sandbox: any = {
        matches: match,
        send,
        sendAll,
        wait,
        speedwalk,
        alert,
        setVariable: setVariable || (() => {}),
      };
      variables.forEach(variable => {
        if (variable.name) {
          Object.defineProperty(sandbox, variable.name, {
            get: () => variable.value,
            enumerable: true,
            configurable: false,
          });
        }
      });

      // Prepare code
      const lines = patternObj.command
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      const patternFunction = new Function(
        ...Object.keys(sandbox),
        `"use strict";\n${lines.join('\n')}`
      );
      try {
        patternFunction(...Object.values(sandbox));
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error executing ${type}:`, error.message);
        } else {
          console.error(`Error executing ${type}:`, error);
        }
        return null;
      }
      return capturedCommands.length > 0 ? capturedCommands : null;
    }
  }
  return null;
}
