import { useEffect, useRef, useState } from 'react';
import './App.css'; // or import styles from './App.module.css';

function App() {
	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState('Disconnected');
	const [ws, setWs] = useState<WebSocket | null>(null);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	useEffect(() => {
		const connect = () => {
			const websocket = new WebSocket('ws://localhost:4000');
			websocket.onopen = () => {
				setStatus('Connected');
				inputRef.current?.focus();
			};
			websocket.onclose = () => {
				setStatus('Disconnected');
				setTimeout(connect, 5000);
			};
			websocket.onerror = () => setStatus('Error occurred');
			websocket.onmessage = (event) => {
				if (outputRef.current) {
					outputRef.current.innerHTML += event.data;
					outputRef.current.scrollTop = outputRef.current.scrollHeight;
				}
			};
			setWs(websocket);
		};
		connect();
		return () => ws?.close();
		// eslint-disable-next-line
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const command = e.currentTarget.value;
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(command + '\n');
				if (command.trim()) {
					setCommandHistory((prev) => [command, ...prev]);
					setHistoryIndex(-1);
				}
				e.currentTarget.value = '';
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
			<div
				className='status'
				style={{ color: status === 'Connected' ? '#00ff00' : '#ff0000' }}
			>
				{status}
			</div>
			<div className='container'>
				<div ref={outputRef} className='output' />
				<input
					ref={inputRef}
					type='text'
					className='input'
					placeholder='Type your command here...'
					onKeyDown={handleKeyDown}
					disabled={status !== 'Connected'}
				/>
			</div>
		</div>
	);
}

export default App;
