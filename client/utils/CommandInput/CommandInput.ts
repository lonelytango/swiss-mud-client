import { CommandEngine } from '../../../utils/CommandEngine';
import { WebSocketManager } from '../../../utils/WebSocketManager';

export interface CommandInputOptions {
	commandEngine: CommandEngine;
	wsManager: WebSocketManager;
	canSend: boolean;
	onCommandHistoryUpdate: (command: string) => void;
	onHistoryIndexUpdate: (index: number) => void;
}

export function handleCommandInput(
	e: React.KeyboardEvent<HTMLInputElement>,
	options: CommandInputOptions
): void {
	const {
		commandEngine,
		wsManager,
		canSend,
		onCommandHistoryUpdate,
		onHistoryIndexUpdate,
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
		const currentIndex = parseInt(
			e.currentTarget.dataset.historyIndex || '-1',
			10
		);
		const commandHistory = JSON.parse(
			e.currentTarget.dataset.commandHistory || '[]'
		);
		if (currentIndex < commandHistory.length - 1) {
			const newIndex = currentIndex + 1;
			onHistoryIndexUpdate(newIndex);
			e.currentTarget.value = commandHistory[newIndex];
		}
	} else if (e.key === 'ArrowDown') {
		e.preventDefault();
		const currentIndex = parseInt(
			e.currentTarget.dataset.historyIndex || '-1',
			10
		);
		const commandHistory = JSON.parse(
			e.currentTarget.dataset.commandHistory || '[]'
		);
		if (currentIndex > 0) {
			const newIndex = currentIndex - 1;
			onHistoryIndexUpdate(newIndex);
			e.currentTarget.value = commandHistory[newIndex];
		} else if (currentIndex === 0) {
			onHistoryIndexUpdate(-1);
			e.currentTarget.value = '';
		}
	}
}
