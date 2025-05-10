/**
 * Sends a command to the MUD server
 * @param command The command to send
 */
import { WebSocketManager } from './WebSocketManager';

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
