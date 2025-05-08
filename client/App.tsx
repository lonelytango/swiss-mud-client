import React, { useEffect, useRef, useState } from 'react';
import { Menu } from './components/Menu';
import type { MudProfile } from './components/ConnectView';
import './App.css';
import classNames from 'classnames';
import { Command } from './utils/AliasEngine/AliasEngine';
import { CommandEngine } from './utils/CommandEngine/CommandEngine';
import { WebSocketManager } from './utils/WebSocketManager/WebSocketManager';
import { Alias } from './types';

function App() {
	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('Disconnected');
	const [selectedProfile, setSelectedProfile] = useState<MudProfile | null>(
		null
	);
	const [canSend, setCanSend] = useState(false);
	const [aliases, setAliases] = useState<Alias[]>([]);
	const [commandEngine, setCommandEngine] = useState<CommandEngine | null>(
		null
	);
	const [wsManager, setWsManager] = useState<WebSocketManager | null>(null);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	useEffect(() => {
		const stored = localStorage.getItem('mud_aliases');
		if (stored) {
			const parsedAliases = JSON.parse(stored);
			setAliases(parsedAliases);
			setCommandEngine(
				new CommandEngine(parsedAliases, {
					onCommandDisplay: (commands: Command[]) => {
						if (outputRef.current) {
							outputRef.current.innerHTML += commands
								.map((cmd) => `<div class="user-cmd">&gt; ${cmd.content}</div>`)
								.join('');
							outputRef.current.scrollTop = outputRef.current.scrollHeight;
						}
					},
					onCommandSend: (command: string) => {
						if (wsManager?.isConnected()) {
							wsManager.send(command + '\n');
						}
					},
				})
			);
		}
	}, [wsManager]);

	useEffect(() => {
		if (commandEngine) {
			commandEngine.setAliases(aliases);
		}
	}, [aliases, commandEngine]);

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
				if (outputRef.current) {
					outputRef.current.innerHTML += data;
					outputRef.current.scrollTop = outputRef.current.scrollHeight;
				}
			},
			onConnected: () => setCanSend(true),
		});

		manager.connect(selectedProfile);
		setWsManager(manager);

		return () => {
			manager.disconnect();
		};
	}, [selectedProfile]);

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const command = e.currentTarget.value;
			if (wsManager?.isConnected() && canSend && commandEngine) {
				await commandEngine.processCommand(command);

				if (command.trim()) {
					setCommandHistory((prev) => [command, ...prev]);
					setHistoryIndex(-1);
				}
				// Keep the input value and select it for quick re-entry
				setTimeout(() => {
					if (inputRef.current) {
						inputRef.current.select();
					}
				}, 0);
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (historyIndex < commandHistory.length - 1) {
				const newIndex = historyIndex + 1;
				setHistoryIndex(newIndex);
				e.currentTarget.value = commandHistory[newIndex];
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex > 0) {
				const newIndex = historyIndex - 1;
				setHistoryIndex(newIndex);
				e.currentTarget.value = commandHistory[newIndex];
			} else if (historyIndex === 0) {
				setHistoryIndex(-1);
				e.currentTarget.value = '';
			}
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
				/>
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
