// utils/CommandUtils.ts
// Utility functions for parsing commands.

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

// Opposite direction mapping
const OPPOSITE_DIRECTION_MAP: { [key: string]: string } = {
  n: 'south',
  s: 'north',
  e: 'west',
  w: 'east',
  ne: 'southwest',
  nw: 'southeast',
  se: 'northwest',
  sw: 'northeast',
  u: 'down',
  d: 'up',
  nu: 'southdown',
  su: 'northdown',
  eu: 'westdown',
  wu: 'eastdown',
  nd: 'southup',
  sd: 'northup',
  ed: 'westup',
  wd: 'eastup',
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
 * Returns the opposite direction string if available, otherwise returns the original.
 * @param direction The direction string (e.g. "n", "north")
 */
function getOppositeDirection(direction: string): string {
  // Try short form first
  const lower = direction.toLowerCase();
  if (OPPOSITE_DIRECTION_MAP[lower]) return OPPOSITE_DIRECTION_MAP[lower];
  // Try long form (e.g. "north" -> "south")
  const entries = Object.entries(DIRECTION_MAP);
  for (const [short, long] of entries) {
    if (long === lower && OPPOSITE_DIRECTION_MAP[short]) {
      return DIRECTION_MAP[OPPOSITE_DIRECTION_MAP[short]] || OPPOSITE_DIRECTION_MAP[short];
    }
  }
  return direction;
}

/**
 * Executes a series of directional commands from a comma-delimited string
 * @param actions Comma-delimited string of directional actions (e.g. "2e,w,eu,ne,climb up")
 * @param backwards If true, reverse the order and use opposite directions
 */
export function parseSpeedwalk(
  actions: string,
  backwards: boolean = false
): string[] {
  const directionCommands: string[] = [];
  const actionArray = actions.split(',').map(action => action.trim());

  for (const action of actionArray) {
    const { count, direction } = parseDirection(action);
    const fullDirection = DIRECTION_MAP[direction.toLowerCase()] || direction;
    for (let i = 0; i < count; i++) {
      directionCommands.push(fullDirection);
    }
  }

  if (backwards) {
    // Reverse order and convert each to its opposite
    return directionCommands.reverse().map(dir => getOppositeDirection(dir));
  }

  return directionCommands;
}
