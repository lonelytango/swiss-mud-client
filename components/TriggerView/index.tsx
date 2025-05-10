import React, { useState, useEffect, useRef } from 'react';
import type { Trigger } from '../../types';
import './styles.css';

interface TriggerViewProps {
	triggers: Trigger[];
	onChange: (triggers: Trigger[]) => void;
}

const emptyTrigger: Trigger = { name: '', pattern: '', command: '' };
const STORAGE_KEY = 'mud_triggers';

const TriggerView: React.FC<TriggerViewProps> = ({ triggers, onChange }) => {
	const [selectedIdx, setSelectedIdx] = useState<number | null>(
		triggers.length > 0 ? 0 : null
	);
	const [editBuffer, setEditBuffer] = useState<Trigger | null>(null);
	const [localTriggers, setLocalTriggers] = useState<Trigger[]>(triggers);
	const initialLoad = useRef(true);

	// Load from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					setLocalTriggers(parsed);
					onChange(parsed);
					setSelectedIdx(parsed.length > 0 ? 0 : null);
				}
			} catch (e) {
				console.error(e);
			}
		}
		// eslint-disable-next-line
	}, []);

	// Keep localTriggers in sync with parent triggers (except on initial load)
	useEffect(() => {
		if (!initialLoad.current) {
			setLocalTriggers(triggers);
		} else {
			initialLoad.current = false;
		}
	}, [triggers]);

	// When selectedIdx changes, update editBuffer
	useEffect(() => {
		if (selectedIdx !== null && localTriggers[selectedIdx]) {
			setEditBuffer({ ...localTriggers[selectedIdx] });
		} else {
			setEditBuffer(null);
		}
	}, [selectedIdx, localTriggers]);

	// Add new trigger and select it
	const handleAdd = () => {
		const newTriggers = [...localTriggers, { ...emptyTrigger }];
		setLocalTriggers(newTriggers);
		setEditBuffer({ ...emptyTrigger });
		setSelectedIdx(newTriggers.length - 1);
	};

	// Update edit buffer inline
	const handleFieldChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (!editBuffer) return;
		const { name, value } = e.target;
		setEditBuffer({ ...editBuffer, [name]: value });
	};

	// Save changes to selected trigger
	const handleSave = () => {
		if (selectedIdx === null || !editBuffer) return;
		const updated = localTriggers.map((trigger, idx) =>
			idx === selectedIdx ? { ...editBuffer } : trigger
		);
		setLocalTriggers(updated);
		onChange(updated);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	};

	// Delete selected trigger
	const handleDelete = () => {
		if (selectedIdx === null) return;
		if (!window.confirm('Delete this trigger?')) return;
		const newTriggers = localTriggers.filter((_, idx) => idx !== selectedIdx);
		setLocalTriggers(newTriggers);
		onChange(newTriggers);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newTriggers));
		setSelectedIdx(newTriggers.length > 0 ? 0 : null);
	};

	// Select trigger
	const handleSelect = (idx: number) => {
		setSelectedIdx(idx);
	};

	// Check if there are unsaved changes
	const hasUnsaved =
		selectedIdx !== null &&
		editBuffer &&
		JSON.stringify(editBuffer) !== JSON.stringify(localTriggers[selectedIdx]);

	const selected = editBuffer;

	return (
		<div className='trigger-view'>
			<div className='trigger-sidebar'>
				<button onClick={handleAdd} title='Add Trigger'>
					＋
				</button>
				<ul>
					{localTriggers.map((trigger, idx) => (
						<li
							key={idx}
							className={selectedIdx === idx ? 'selected' : ''}
							onClick={() => handleSelect(idx)}
						>
							{trigger.name || <span style={{ color: '#aaa' }}>(unnamed)</span>}
						</li>
					))}
				</ul>
			</div>
			<div className='trigger-details'>
				{selected ? (
					<>
						<label>
							Name
							<input
								name='name'
								value={selected.name}
								onChange={handleFieldChange}
								autoFocus
							/>
						</label>
						<label>
							Pattern
							<input
								name='pattern'
								value={selected.pattern}
								onChange={handleFieldChange}
							/>
						</label>
						<label>
							Command
							<textarea
								name='command'
								value={selected.command}
								onChange={handleFieldChange}
								rows={4}
							/>
						</label>
						<div className='actions'>
							<button
								onClick={handleSave}
								disabled={!hasUnsaved}
								style={{ background: hasUnsaved ? '#1976d2' : '#aaa' }}
							>
								Save
							</button>
							<button onClick={handleDelete} style={{ background: '#c62828' }}>
								Delete
							</button>
						</div>
					</>
				) : (
					<div style={{ color: '#888' }}>Select a trigger to edit</div>
				)}
			</div>
		</div>
	);
};

export default TriggerView;
