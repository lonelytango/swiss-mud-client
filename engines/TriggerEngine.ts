import type { Trigger, Command } from '../types';
import { parseSpeedwalk } from '../utils/CommandUtils';
import { alert } from '../utils/CommandAction';

export function processTriggers(
  line: string,
  triggers: Trigger[],
  send: (command: string) => void,
  setVariable?: (name: string, value: string) => void,
  variables?: { name: string; value: string }[]
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
        try {
          // Always execute as JavaScript
          const variableNames = variables?.map(v => v.name) || [];
          const variableValues = variables?.map(v => v.value) || [];
          // Add speedwalk helper
          const speedwalk = (actions: string) => {
            const directionCommands = parseSpeedwalk(actions);
            directionCommands.forEach(cmd => send(cmd));
          };
          const commandFn = new Function(
            'matches',
            'send',
            'setVariable',
            'speedwalk',
            'alert',
            ...variableNames,
            trigger.command
          );
          commandFn(
            matches,
            send,
            setVariable || (() => {}),
            speedwalk,
            alert,
            ...variableValues
          );
        } catch (e) {
          console.error(`Error executing trigger "${trigger.name}":`, e);
        }
      }
    } catch (e) {
      console.error(`Error processing trigger "${trigger.name}":`, e);
    }
  }

  return capturedCommands.length > 0 ? capturedCommands : null;
}
