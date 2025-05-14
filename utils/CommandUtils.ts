// CommandUtils.ts

// Direction mapping for speedwalk
const DIRECTION_MAP: { [key: string]: string } = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
  u: 'up',
  d: 'down',
  nu: 'northup',
  su: 'southup',
  eu: 'eastup',
  wu: 'westup',
  nd: 'northdown',
  sd: 'southdown',
  ed: 'eastdown',
  wd: 'westdown',
};

/**
 * Parses a direction string to extract number of times and the direction
 * @param input The input string (e.g. "2e", "north", "climb up")
 * @returns An object containing the count and the direction
 */
function parseDirection(input: string): { count: number; direction: string } {
  const match = input.match(/^(\d+)?(.+)$/);
  if (!match) return { count: 1, direction: input };

  const [, countStr, direction] = match;
  const count = countStr ? parseInt(countStr, 10) : 1;
  return { count, direction: direction.trim() };
}

/**
 * Executes a series of directional commands from a comma-delimited string
 * @param actions Comma-delimited string of directional actions (e.g. "2e,w,eu,ne,climb up")
 */
export function parseSpeedwalk(actions: string): string[] {
  const directionCommands: string[] = [];
  const actionArray = actions.split(',').map(action => action.trim());

  for (const action of actionArray) {
    const { count, direction } = parseDirection(action);
    const fullDirection = DIRECTION_MAP[direction.toLowerCase()] || direction;

    // Send the command the specified number of times
    for (let i = 0; i < count; i++) {
      directionCommands.push(fullDirection);
    }
  }
  return directionCommands;
}
