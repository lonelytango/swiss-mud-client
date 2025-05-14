import type { Alias, Variable, Command } from '../types';
import { processPatterns } from './PatternEngine';

// This function expands an input string according to the defined aliases and variables
export function processAliases(
  input: string,
  aliases: Alias[],
  variables: Variable[],
  setVariable?: (name: string, value: string) => void
): Command[] | null {
  return processPatterns(input, aliases, variables, setVariable, 'alias');
}
