/**
 * Sends a command to the MUD server
 * @param command The command to send
 */
import { WebSocketManager } from './WebSocketManager/WebSocketManager';

// Store WebSocketManager instance
let wsManager: WebSocketManager | null = null;

/**
 * Set the WebSocketManager instance to use for sending commands
 * @param manager The WebSocketManager instance
 */
export function setWebSocketManager(manager: WebSocketManager): void {
	wsManager = manager;
}

/**
 * Sends a command to the MUD server
 * @param command The command to send
 */
export function send(command: string): void {
	// Send the command if WebSocketManager is available
	if (wsManager && wsManager.isConnected()) {
		wsManager.send(command + '\n');
	} else {
		console.warn('WebSocketManager not available or not connected');
	}
}

/**
 * Waits for a specified number of milliseconds
 * @param ms Number of milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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
 * Executes a series of directional commands
 * @param actions Array of directional actions (e.g. ["2e", "w", "eu", "ne", "climb up"])
 */
export function parseSpeedwalk(actions: string[]): string[] {
	const directionCommands: string[] = [];
	for (const action of actions) {
		const { count, direction } = parseDirection(action);
		const fullDirection = DIRECTION_MAP[direction.toLowerCase()] || direction;

		// Send the command the specified number of times
		for (let i = 0; i < count; i++) {
			directionCommands.push(fullDirection);
		}
	}
	return directionCommands;
}
