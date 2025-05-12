import React, { useState, useEffect } from 'react';
import type { Variable } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import './styles.css';

const emptyVariable: Variable = { name: '', value: '' };

const VariableView: React.FC = () => {
  const { variables, setVariables } = useAppContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    variables.length > 0 ? 0 : null
  );
  const [editBuffer, setEditBuffer] = useState<Omit<
    Variable,
    'description'
  > | null>(null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    e.dataTransfer.setData('text/plain', idx.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetIdx: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIdx === targetIdx) return;

    const updated = [...variables];
    const [movedItem] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    setVariables(updated);
    setSelectedIdx(targetIdx);
  };

  // When selectedIdx changes, update editBuffer
  useEffect(() => {
    if (selectedIdx !== null && variables[selectedIdx]) {
      const { name, value } = variables[selectedIdx];
      setEditBuffer({ name, value });
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
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    JSON.stringify(editBuffer) !==
      JSON.stringify({
        name: variables[selectedIdx].name,
        value: variables[selectedIdx].value,
      });

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
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, idx)}
            >
              <div className='variable-item-content'>
                <div className='drag-handle' title='Drag to reorder'>
                  ⋮⋮
                </div>
                <span>
                  {variable.name || (
                    <span style={{ color: '#aaa' }}>(unnamed)</span>
                  )}
                </span>
              </div>
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
