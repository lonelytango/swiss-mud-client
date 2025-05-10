import React, { useState, useEffect } from 'react';
import type { Variable } from '../../types';
import { useVariables } from '../../contexts/VariablesContext';
import './styles.css';

const emptyVariable: Variable = { name: '', value: '', description: '' };

const VariableView: React.FC = () => {
	const { variables, setVariables } = useVariables();
	const [selectedIdx, setSelectedIdx] = useState<number | null>(
		variables.length > 0 ? 0 : null
	);
	const [editBuffer, setEditBuffer] = useState<Variable | null>(null);

	// When selectedIdx changes, update editBuffer
	useEffect(() => {
		if (selectedIdx !== null && variables[selectedIdx]) {
			setEditBuffer({ ...variables[selectedIdx] });
		} else {
			setEditBuffer(null);
		}
	}, [selectedIdx, variables]);

	// Add new variable and select it
	const handleAdd = () => {
		const newVariables = [...variables, { ...emptyVariable }];
		setVariables(newVariables);
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
		const updated = variables.map((variable, idx) =>
			idx === selectedIdx ? { ...editBuffer } : variable
		);
		setVariables(updated);
	};

	// Delete selected variable
	const handleDelete = () => {
		if (selectedIdx === null) return;
		if (!window.confirm('Delete this variable?')) return;
		const newVariables = variables.filter((_, idx) => idx !== selectedIdx);
		setVariables(newVariables);
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
		JSON.stringify(editBuffer) !== JSON.stringify(variables[selectedIdx]);

	const selected = editBuffer;

	return (
		<div className='variable-view'>
			<div className='variable-sidebar'>
				<button onClick={handleAdd} title='Add Variable'>
					＋
				</button>
				<ul>
					{variables.map((variable, idx) => (
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
							Name
							<input
								name='name'
								value={selected.name}
								onChange={handleFieldChange}
								autoFocus
							/>
						</label>
						<label>
							Value
							<input
								name='value'
								value={selected.value}
								onChange={handleFieldChange}
							/>
						</label>
						<label>
							Description
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
					<div style={{ color: '#888' }}>Select a variable to edit</div>
				)}
			</div>
		</div>
	);
};

export default VariableView;
