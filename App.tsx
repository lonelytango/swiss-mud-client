import React, { useEffect, useRef, useState } from 'react';
import { Menu } from './components/Menu';
import type { MudProfile } from './components/ConnectView';
import './App.css';
import classNames from 'classnames';
import { Command } from './utils/AliasEngine/AliasEngine';
import { CommandEngine } from './utils/CommandEngine/CommandEngine';
import { WebSocketManager } from './utils/WebSocketManager/WebSocketManager';
import { Alias, Variable } from './types';
import { handleCommandInput } from './utils/CommandInput/CommandInput';

function App() {
	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('Disconnected');
	const [selectedProfile, setSelectedProfile] = useState<MudProfile | null>(
		null
	);
	const [canSend, setCanSend] = useState(false);
	const [aliases, setAliases] = useState<Alias[]>([]);
	const [variables, setVariables] = useState<Variable[]>([]);
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
		const storedVariables = localStorage.getItem('mud_variables');
		let parsedAliases: Alias[] = [];
		let parsedVariables: Variable[] = [];

		if (storedAliases) {
			try {
				parsedAliases = JSON.parse(storedAliases);
				setAliases(parsedAliases);
			} catch (e) {
				console.error('Failed to parse aliases:', e);
			}
		}

		if (storedVariables) {
			try {
				parsedVariables = JSON.parse(storedVariables);
				setVariables(parsedVariables);
			} catch (e) {
				console.error('Failed to parse variables:', e);
			}
		}

		setCommandEngine(
			new CommandEngine(parsedAliases, parsedVariables, {
				onCommandDisplay: (commands: Command[]) => {
					setMessages((prev) => {
						const next = [
							...prev,
							...commands.map(
								(cmd) => `<div class="user-cmd">&gt; ${cmd.content}</div>`
							),
						];
						return next.length > 1000 ? next.slice(-1000) : next;
					});
				},
				onCommandSend: (command: string) => {
					if (wsManager?.isConnected()) {
						wsManager.send(command + '\n');
					}
				},
			})
		);
	}, [wsManager]);

	useEffect(() => {
		if (commandEngine) {
			commandEngine.setAliases(aliases);
		}
	}, [aliases, commandEngine]);

	useEffect(() => {
		if (commandEngine) {
			commandEngine.setVariables(variables);
		}
	}, [variables, commandEngine]);

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

		return () => {
			manager.disconnect();
		};
	}, [selectedProfile]);

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

	useEffect(() => {
		if (isLockedToBottom && outputRef.current) {
			outputRef.current.scrollTop = outputRef.current.scrollHeight;
		}
	}, [messages, isLockedToBottom]);

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!commandEngine || !wsManager) return;

		// Add command history data to the input element
		e.currentTarget.dataset.historyIndex = historyIndex.toString();
		e.currentTarget.dataset.commandHistory = JSON.stringify(commandHistory);

		handleCommandInput(e, {
			commandEngine,
			wsManager,
			canSend,
			onCommandHistoryUpdate: (command) => {
				setCommandHistory((prev) => [command, ...prev]);
			},
			onHistoryIndexUpdate: setHistoryIndex,
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
				variables={variables}
				setVariables={setVariables}
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
