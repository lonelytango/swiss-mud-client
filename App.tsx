import React, { useEffect, useRef, useState } from 'react';
import { Menu } from './components/Menu';
import type { MudProfile } from './components/ConnectView';
import './App.css';
import classNames from 'classnames';
import { CommandEngine } from './utils/CommandEngine';
import { WebSocketManager } from './utils/WebSocketManager';
import { Alias } from './types';
import { handleCommandInput } from './utils/CommandInput';
import { setWebSocketManager, send } from './utils/commands';
import { useVariables } from './contexts/VariablesContext';

function App() {
	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('Disconnected');
	const [selectedProfile, setSelectedProfile] = useState<MudProfile | null>(
		null
	);
	const [canSend, setCanSend] = useState(false);
	const [aliases, setAliases] = useState<Alias[]>([]);
	const { variables } = useVariables();
	const [commandEngine, setCommandEngine] = useState<CommandEngine | null>(
		null
	);
	const [wsManager, setWsManager] = useState<WebSocketManager | null>(null);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [messages, setMessages] = useState<string[]>([]);
	const [isLockedToBottom, setIsLockedToBottom] = useState(true);

	useEffect(() => {
		const storedAliases = localStorage.getItem('mud_aliases');
		let parsedAliases: Alias[] = [];

		if (storedAliases) {
			try {
				parsedAliases = JSON.parse(storedAliases);
				setAliases(parsedAliases);
			} catch (e) {
				console.error('Failed to parse aliases:', e);
			}
		}

		setCommandEngine(
			new CommandEngine(parsedAliases, variables, {
				onCommandSend: (command: string) => {
					// Add command to output (visual feedback for user)
					setMessages((prev) => {
						const next = [
							...prev,
							`<div class="user-cmd">&gt; ${command}</div>`,
						];
						return next.length > 1000 ? next.slice(-1000) : next;
					});

					// Send the command to the MUD server through the commands.ts send function
					// instead of directly using the WebSocketManager here
					// This ensures consistent behavior whether commands come from aliases or direct input
					send(command);
				},
			})
		);
	}, [wsManager, variables]);

	// Update the CommandEngine when aliases change
	useEffect(() => {
		if (commandEngine) {
			commandEngine.setAliases(aliases);
		}
	}, [aliases, commandEngine]);

	// Update the CommandEngine when variables change
	useEffect(() => {
		if (commandEngine) {
			commandEngine.setVariables(variables);
		}
	}, [variables, commandEngine]);

	// Setup WebSocket connection when a profile is selected
	useEffect(() => {
		if (!selectedProfile) return;

		const manager = new WebSocketManager({
			onOpen: () => {
				setStatus('Connected');
				setCanSend(false);
				inputRef.current?.focus();
			},
			onClose: () => {
				setStatus('Disconnected');
				setCanSend(false);
			},
			onError: () => setStatus('Error occurred'),
			onMessage: (data: string) => {
				setMessages((prev) => {
					const next = [...prev, data];
					return next.length > 1000 ? next.slice(-1000) : next;
				});
			},
			onConnected: () => setCanSend(true),
		});

		manager.connect(selectedProfile);
		setWsManager(manager);

		// Set the WebSocketManager in commands.ts
		setWebSocketManager(manager);

		return () => {
			manager.disconnect();
		};
	}, [selectedProfile]);

	// Handle scrolling behavior
	const handleOutputScroll = () => {
		if (!outputRef.current) return;

		const { scrollTop, scrollHeight, clientHeight } = outputRef.current;

		// If the user is within 20px of the bottom, consider it locked
		if (scrollHeight - scrollTop - clientHeight < 20) {
			setIsLockedToBottom(true);
		} else {
			setIsLockedToBottom(false);
		}
	};

	// Auto-scroll to bottom when messages update (if locked)
	useEffect(() => {
		if (isLockedToBottom && outputRef.current) {
			outputRef.current.scrollTop = outputRef.current.scrollHeight;
		}
	}, [messages, isLockedToBottom]);

	// Handle keyboard input
	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!commandEngine || !wsManager) return;

		handleCommandInput(e, {
			commandEngine,
			wsManager,
			canSend,
			onCommandHistoryUpdate: (command) => {
				setCommandHistory((prev) => [command, ...prev]);
			},
			onHistoryIndexUpdate: setHistoryIndex,
			historyIndex,
			commandHistory,
		});

		// After handling the command, re-focus/select the input if Enter was pressed
		if (e.key === 'Enter') {
			setTimeout(() => {
				inputRef.current?.select();

				// Snap to bottom when Enter is pressed
				if (outputRef.current) {
					outputRef.current.scrollTop = outputRef.current.scrollHeight;
				}
			}, 0);
		}
	};

	return (
		<div className='main'>
			<Menu
				onProfileConnect={setSelectedProfile}
				aliases={aliases}
				setAliases={setAliases}
			/>
			<div
				className={classNames('status', {
					connected: status === 'Connected',
				})}
			>
				{selectedProfile
					? `${status} (${selectedProfile.name})`
					: 'No profile selected'}
			</div>
			<div className='container'>
				<div
					ref={outputRef}
					className='output'
					onClick={() => inputRef.current?.focus()}
					onScroll={handleOutputScroll}
				>
					{messages.map((msg, idx) => (
						<div key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
					))}
				</div>
				<input
					ref={inputRef}
					type='text'
					className='input'
					placeholder='Type your command here...'
					onKeyDown={handleKeyDown}
					disabled={!canSend}
				/>
			</div>
		</div>
	);
}

export default App;
