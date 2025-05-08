import React, { useState, useEffect, useRef } from 'react';
import type { Variable } from '../../types';
import './styles.css';

interface VariableViewProps {
	variables: Variable[];
	onChange: (variables: Variable[]) => void;
}

const emptyVariable: Variable = { name: '', value: '', description: '' };
const STORAGE_KEY = 'mud_variables';

const VariableView: React.FC<VariableViewProps> = ({ variables, onChange }) => {
	const [selectedIdx, setSelectedIdx] = useState<number | null>(
		variables.length > 0 ? 0 : null
	);
	const [editBuffer, setEditBuffer] = useState<Variable | null>(null);
	const [localVariables, setLocalVariables] = useState<Variable[]>(variables);
	const initialLoad = useRef(true);

	// Load from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					setLocalVariables(parsed);
					onChange(parsed);
					setSelectedIdx(parsed.length > 0 ? 0 : null);
				}
			} catch (e) {
				console.error(e);
			}
		}
		// eslint-disable-next-line
	}, []);

	// Keep localVariables in sync with parent variables (except on initial load)
	useEffect(() => {
		if (!initialLoad.current) {
			setLocalVariables(variables);
		} else {
			initialLoad.current = false;
		}
	}, [variables]);

	// When selectedIdx changes, update editBuffer
	useEffect(() => {
		if (selectedIdx !== null && localVariables[selectedIdx]) {
			setEditBuffer({ ...localVariables[selectedIdx] });
		} else {
			setEditBuffer(null);
		}
	}, [selectedIdx, localVariables]);

	// Add new variable and select it
	const handleAdd = () => {
		const newVariables = [...localVariables, { ...emptyVariable }];
		setLocalVariables(newVariables);
		setEditBuffer({ ...emptyVariable });
		setSelectedIdx(newVariables.length - 1);
	};

	// Update edit buffer inline
	const handleFieldChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (!editBuffer) return;
		const { name, value } = e.target;
		setEditBuffer({ ...editBuffer, [name]: value });
	};

	// Save changes to selected variable
	const handleSave = () => {
		if (selectedIdx === null || !editBuffer) return;
		const updated = localVariables.map((variable, idx) =>
			idx === selectedIdx ? { ...editBuffer } : variable
		);
		setLocalVariables(updated);
		onChange(updated);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	};

	// Delete selected variable
	const handleDelete = () => {
		if (selectedIdx === null) return;
		if (!window.confirm('Delete this variable?')) return;
		const newVariables = localVariables.filter((_, idx) => idx !== selectedIdx);
		setLocalVariables(newVariables);
		onChange(newVariables);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newVariables));
		setSelectedIdx(newVariables.length > 0 ? 0 : null);
	};

	// Select variable
	const handleSelect = (idx: number) => {
		setSelectedIdx(idx);
	};

	// Check if there are unsaved changes
	const hasUnsaved =
		selectedIdx !== null &&
		editBuffer &&
		JSON.stringify(editBuffer) !== JSON.stringify(localVariables[selectedIdx]);

	const selected = editBuffer;

	return (
		<div className='variable-view'>
			<div className='variable-sidebar'>
				<button onClick={handleAdd} title='Add Variable'>
					＋
				</button>
				<ul>
					{localVariables.map((variable, idx) => (
						<li
							key={idx}
							className={selectedIdx === idx ? 'selected' : ''}
							onClick={() => handleSelect(idx)}
						>
							{variable.name || (
								<span style={{ color: '#aaa' }}>(unnamed)</span>
							)}
						</li>
					))}
				</ul>
			</div>
			<div className='variable-details'>
				{selected ? (
					<>
						<label>
							Name:
							<input
								name='name'
								value={selected.name}
								onChange={handleFieldChange}
								autoFocus
							/>
						</label>
						<label>
							Value:
							<input
								name='value'
								value={selected.value}
								onChange={handleFieldChange}
							/>
						</label>
						<label>
							Description:
							<textarea
								name='description'
								value={selected.description || ''}
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
					<div style={{ color: '#888', marginTop: '40px' }}>
						Select a variable to edit
					</div>
				)}
			</div>
		</div>
	);
};

export default VariableView;
