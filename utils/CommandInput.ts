import { CommandEngine } from './CommandEngine';
import { WebSocketManager } from './WebSocketManager';

export interface CommandInputOptions {
	commandEngine: CommandEngine;
	wsManager: WebSocketManager;
	canSend: boolean;
	onCommandHistoryUpdate: (command: string) => void;
	onHistoryIndexUpdate: (index: number) => void;
}

export function handleCommandInput(
	e: React.KeyboardEvent<HTMLInputElement>,
	options: CommandInputOptions & {
		historyIndex: number;
		commandHistory: string[];
	}
): void {
	const {
		commandEngine,
		wsManager,
		canSend,
		onCommandHistoryUpdate,
		onHistoryIndexUpdate,
		historyIndex,
		commandHistory,
	} = options;

	if (e.key === 'Enter') {
		const command = e.currentTarget.value;
		if (wsManager.isConnected() && canSend && commandEngine) {
			commandEngine.processCommand(command);

			if (command.trim()) {
				onCommandHistoryUpdate(command);
				onHistoryIndexUpdate(-1);
			}
		}
	} else if (e.key === 'ArrowUp') {
		e.preventDefault();
		if (historyIndex < commandHistory.length - 1) {
			const newIndex = historyIndex + 1;
			onHistoryIndexUpdate(newIndex);
			e.currentTarget.value = commandHistory[newIndex];
		}
	} else if (e.key === 'ArrowDown') {
		e.preventDefault();
		if (historyIndex > 0) {
			const newIndex = historyIndex - 1;
			onHistoryIndexUpdate(newIndex);
			e.currentTarget.value = commandHistory[newIndex];
		} else if (historyIndex === 0) {
			onHistoryIndexUpdate(-1);
			e.currentTarget.value = '';
		}
	}
}
