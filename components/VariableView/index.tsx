// components/VariableView/index.tsx
// View for the variables.

import React, { useState, useEffect, useRef } from 'react';
import commonStyles from '../../styles/common.module.css';
import { useAppContext } from '../../contexts/AppContext';
import type { Variable } from '../../types';
import classNames from 'classnames';

const emptyVariable: Variable = { name: '', value: '' };
const STORAGE_KEY = 'mud_variables';

export default function VariableView({
  saveRef,
}: {
  saveRef?: React.RefObject<{ save: () => void } | null>;
}) {
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
    const newVariables = [{ ...emptyVariable }, ...localVariables];
    setLocalVariables(newVariables);
    setEditBuffer({ ...emptyVariable });
    setSelectedIdx(0);
  };

  // Sort variables alphabetically by name
  const handleSort = () => {
    const sorted = [...localVariables].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    saveVariables(sorted);
    // Maintain selection if possible
    if (selectedIdx !== null) {
      const selectedVar = localVariables[selectedIdx];
      const newIndex = sorted.findIndex(v => v.name === selectedVar.name);
      setSelectedIdx(newIndex);
    }
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

  // Expose save method to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = { save: handleSave };
    }
  }, [handleSave, saveRef]);

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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    e.dataTransfer.setData('text/plain', idx.toString());
    e.currentTarget.classList.add(commonStyles.dragging);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove(commonStyles.dragging);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(commonStyles.dragOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetIdx: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove(commonStyles.dragOver);

    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIdx === targetIdx) return;

    const updated = [...localVariables];
    const [movedItem] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    saveVariables(updated);
    setSelectedIdx(targetIdx);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove(commonStyles.dragOver);
  };

  // Check if there are unsaved changes
  const hasUnsaved =
    selectedIdx !== null &&
    editBuffer &&
    JSON.stringify(editBuffer) !== JSON.stringify(localVariables[selectedIdx]);

  const selected = editBuffer;

  return (
    <div className={commonStyles.viewContainer}>
      <div className={commonStyles.sidebar}>
        <div className={commonStyles.buttonGroup}>
          <button onClick={handleAdd}>+</button>
          <button onClick={handleSort} title='Sort alphabetically'>
            ⇅
          </button>
        </div>
        <ul>
          {localVariables.map((variable, index) => (
            <li
              key={index}
              className={classNames({
                [commonStyles.selected]: selectedIdx === index,
                [commonStyles.dragging]: false,
                [commonStyles.dragOver]: false,
              })}
              onClick={() => handleSelect(index)}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
            >
              <div className={commonStyles.itemContent}>
                <span className={commonStyles.dragHandle}>⋮</span>
                <span>{variable.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className={commonStyles.detailsPanel}>
          <div className={commonStyles.formGroup}>
            <label>
              Name
              <input
                type='text'
                name='name'
                value={selected.name}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className={commonStyles.formGroup}>
            <label>
              Value
              <input
                type='text'
                name='value'
                value={selected.value}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className={commonStyles.actions}>
            <button onClick={handleSave} disabled={!hasUnsaved}>
              Save
            </button>
            <button
              onClick={handleDelete}
              className={commonStyles.deleteButton}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
