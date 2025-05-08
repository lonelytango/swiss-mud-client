import React, { useEffect, useRef, useState } from 'react';
import { Menu } from './components/Menu';
import type { MudProfile } from './components/ConnectView';
import './App.css';
import { isMockEnabled } from './utils/FeatureFlag';
import classNames from 'classnames';
import { expandAlias, Command } from './utils/AliasEngine/AliasEngine';
import { Alias } from './types';

function App() {
	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('Disconnected');
	const [ws, setWs] = useState<WebSocket | null>(null);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [selectedProfile, setSelectedProfile] = useState<MudProfile | null>(
		null
	);
	const [canSend, setCanSend] = useState(false);
	const [aliases, setAliases] = useState<Alias[]>([]);

	useEffect(() => {
		const stored = localStorage.getItem('mud_aliases');
		if (stored) setAliases(JSON.parse(stored));
	}, []);

	useEffect(() => {
		if (!selectedProfile) return;

		let url = `ws://${window.location.host}/ws`;
		if (isMockEnabled()) {
			// Use /server/mock-proxy.js to proxy requests to localhost:4000
			url = `ws://localhost:4000`;
		}

		let closedByUser = false;
		let websocket: WebSocket;

		const connect = () => {
			websocket = new WebSocket(url);

			websocket.onopen = () => {
				setStatus('Connected');
				setCanSend(false);
				// Send profile as first message
				websocket.send(
					JSON.stringify({
						address: selectedProfile.address,
						port: selectedProfile.port,
					})
				);
				inputRef.current?.focus();
			};

			websocket.onclose = () => {
				setStatus('Disconnected');
				setCanSend(false);
				if (!closedByUser) setTimeout(connect, 5000);
			};

			websocket.onerror = () => setStatus('Error occurred');

			websocket.onmessage = (event) => {
				if (outputRef.current) {
					outputRef.current.innerHTML += event.data;
					outputRef.current.scrollTop = outputRef.current.scrollHeight;
				}
				// Enable input after receiving confirmation from server
				if (
					typeof event.data === 'string' &&
					event.data.includes('[INFO] Connected to MUD server')
				) {
					setCanSend(true);
				}
			};

			setWs(websocket);
		};

		connect();
		return () => {
			closedByUser = true;
			websocket?.close();
		};
		// eslint-disable-next-line
	}, [selectedProfile]);

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const command = e.currentTarget.value;
			if (ws && ws.readyState === WebSocket.OPEN && canSend) {
				// Try alias expansion
				const expanded = await expandAlias(command, aliases);
				const toShow: Command[] = expanded
					? expanded
					: [{ type: 'command', content: command }];

				if (outputRef.current) {
					outputRef.current.innerHTML += toShow.map(
						(cmd) => `<div class="user-cmd">&gt; ${cmd.content}</div>`
					);
					outputRef.current.scrollTop = outputRef.current.scrollHeight;
				}

				if (expanded) {
					// Process commands with waits
					for (const cmd of expanded) {
						if (cmd.type === 'wait') {
							await new Promise((resolve) => setTimeout(resolve, cmd.waitTime));
						} else {
							ws.send(cmd.content + '\n');
						}
					}
				} else {
					ws.send(command + '\n');
				}

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
