// engines/PatternEngine.ts
// Engine for processing patterns.

import type {
  Variable,
  Command,
  Alias,
  Trigger,
  Pattern,
  Script,
} from '../types';
import { parseSpeedwalk } from '../utils/CommandUtils';
import { alert } from '../utils/CommandAction';

function processPatterns(
  input: string,
  patterns: Pattern[],
  variables: Variable[],
  setVariable?: (name: string, value: string) => void,
  type: 'alias' | 'trigger' = 'alias',
  scripts?: Script[]
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

      const sendEvent = (eventName: string) => {
        if (!scripts) return;
        const script = scripts.find(s => s.enabled && s.event === eventName);
        if (!script) {
          console.warn(`No script found for event: ${eventName}`);
          return;
        }
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('send', script.command);
          fn(send);
        } catch (err) {
          console.error(
            `Failed to execute script for event '${eventName}':`,
            err
          );
        }
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
        sendEvent,
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

export function processTriggers(
  line: string,
  triggers: Trigger[],
  variables: Variable[] = [],
  setVariable?: (name: string, value: string) => void,
  scripts?: Script[]
): Command[] | null {
  return processPatterns(
    line,
    triggers,
    variables,
    setVariable,
    'trigger',
    scripts
  );
}

export function processAliases(
  input: string,
  aliases: Alias[],
  variables: Variable[],
  setVariable?: (name: string, value: string) => void,
  scripts?: Script[]
): Command[] | null {
  return processPatterns(
    input,
    aliases,
    variables,
    setVariable,
    'alias',
    scripts
  );
}
