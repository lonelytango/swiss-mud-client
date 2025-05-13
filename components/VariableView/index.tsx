import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { useAppContext } from '../../contexts/AppContext';
import type { Variable } from '../../types';

const emptyVariable: Variable = { name: '', value: '', description: '' };
const STORAGE_KEY = 'mud_variables';

export default function VariableView() {
  const { variables, setVariables } = useAppContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    variables.length > 0 ? 0 : null
  );
  const [editBuffer, setEditBuffer] = useState<Variable | null>(null);
  const [localVariables, setLocalVariables] = useState<Variable[]>(variables);
  const initialLoad = useRef(true);

  // Helper function to save variables
  const saveVariables = (updated: Variable[]) => {
    setLocalVariables(updated);
    setVariables(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          saveVariables(parsed);
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
    saveVariables(updated);
  };

  // Delete selected variable
  const handleDelete = () => {
    if (selectedIdx === null) return;
    if (!window.confirm('Delete this variable?')) return;
    const newVariables = localVariables.filter((_, idx) => idx !== selectedIdx);
    saveVariables(newVariables);
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
    <div className={styles.variableView}>
      <div className={styles.variableSidebar}>
        <button onClick={handleAdd}>Add Variable</button>
        <ul>
          {localVariables.map((variable, index) => (
            <li
              key={index}
              className={selectedIdx === index ? styles.selected : ''}
              onClick={() => handleSelect(index)}
            >
              <div className={styles.variableItemContent}>
                <span>{variable.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className={styles.variableDetails}>
          <label>
            Name
            <input
              type='text'
              name='name'
              value={selected.name}
              onChange={handleFieldChange}
            />
          </label>
          <label>
            Value
            <input
              type='text'
              name='value'
              value={selected.value}
              onChange={handleFieldChange}
            />
          </label>
          <label>
            Description
            <textarea
              name='description'
              value={selected.description}
              onChange={handleFieldChange}
            />
          </label>
          <div className={styles.actions}>
            <button
              onClick={handleSave}
              disabled={!hasUnsaved}
              style={{ background: hasUnsaved ? '#1976d2' : '#aaa' }}
            >
              Save
            </button>
            <button onClick={handleDelete} className={styles.delete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
