import type { Trigger, Command } from '../types';
import { processPatterns } from './PatternEngine';

export function processTriggers(
  line: string,
  triggers: Trigger[],
  setVariable?: (name: string, value: string) => void,
  variables?: { name: string; value: string }[]
) {
  return processPatterns(
    line,
    triggers,
    variables || [],
    setVariable,
    'trigger'
  );
}
