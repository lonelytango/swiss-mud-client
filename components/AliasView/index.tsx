// components/AliasView/index.tsx
// View for the aliases.

import React, { useState, useEffect, useRef } from 'react';
import type { Alias } from '../../types';
import commonStyles from '../../styles/common.module.css';
import classNames from 'classnames';
import Editor from '@monaco-editor/react';
import EditorOptions from '../../config/EditorOptions';

interface AliasViewProps {
  aliases: Alias[];
  onChange: (aliases: Alias[]) => void;
}

const emptyAlias: Alias = { name: '', pattern: '', command: '', enabled: true };
const STORAGE_KEY = 'mud_aliases';

const AliasView: React.FC<AliasViewProps> = ({ aliases, onChange }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    aliases.length > 0 ? 0 : null
  );
  const [editBuffer, setEditBuffer] = useState<Alias | null>(null);
  const [localAliases, setLocalAliases] = useState<Alias[]>(aliases);
  const initialLoad = useRef(true);

  // Helper function to save aliases
  const saveAliases = (updated: Alias[]) => {
    setLocalAliases(updated);
    onChange(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Ensure all aliases have enabled set to true by default
          const aliasesWithEnabled = parsed.map(alias => ({
            ...alias,
            enabled: alias.enabled ?? true,
          }));
          saveAliases(aliasesWithEnabled);
          setSelectedIdx(aliasesWithEnabled.length > 0 ? 0 : null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    // eslint-disable-next-line
  }, []);

  // Keep localAliases in sync with parent aliases (except on initial load)
  useEffect(() => {
    if (!initialLoad.current) {
      setLocalAliases(aliases);
    } else {
      initialLoad.current = false;
    }
  }, [aliases]);

  // When selectedIdx changes, update editBuffer
  useEffect(() => {
    if (selectedIdx !== null && localAliases[selectedIdx]) {
      setEditBuffer({ ...localAliases[selectedIdx] });
    } else {
      setEditBuffer(null);
    }
  }, [selectedIdx, localAliases]);

  // Add new alias and select it
  const handleAdd = () => {
    const newAliases = [...localAliases, { ...emptyAlias }];
    setLocalAliases(newAliases);
    setEditBuffer({ ...emptyAlias });
    setSelectedIdx(newAliases.length - 1);
  };

  // Update edit buffer inline
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editBuffer) return;
    const { name, value } = e.target;
    setEditBuffer({ ...editBuffer, [name]: value });
  };

  // Save changes to selected alias
  const handleSave = () => {
    if (selectedIdx === null || !editBuffer) return;
    const updated = localAliases.map((alias, idx) =>
      idx === selectedIdx ? { ...editBuffer } : alias
    );
    saveAliases(updated);
  };

  // Delete selected alias
  const handleDelete = () => {
    if (selectedIdx === null) return;
    if (!window.confirm('Delete this alias?')) return;
    const newAliases = localAliases.filter((_, idx) => idx !== selectedIdx);
    saveAliases(newAliases);
    setSelectedIdx(newAliases.length > 0 ? 0 : null);
  };

  // Select alias
  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  // Check if there are unsaved changes
  const hasUnsaved =
    selectedIdx !== null &&
    editBuffer &&
    JSON.stringify(editBuffer) !== JSON.stringify(localAliases[selectedIdx]);

  const selected = editBuffer;

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

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove(commonStyles.dragOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetIdx: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove(commonStyles.dragOver);

    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIdx === targetIdx) return;

    const updated = [...localAliases];
    const [movedItem] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    saveAliases(updated);
    setSelectedIdx(targetIdx);
  };

  return (
    <div className={commonStyles.viewContainer}>
      <div className={commonStyles.sidebar}>
        <button onClick={handleAdd}>+</button>
        <ul>
          {localAliases.map((alias, index) => (
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
              onDragOver={e => handleDragOver(e)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
            >
              <div className={commonStyles.itemContent}>
                <span className={commonStyles.dragHandle}>⋮</span>
                <input
                  type='checkbox'
                  checked={alias.enabled}
                  onChange={e => {
                    e.stopPropagation();
                    const updated = localAliases.map((a, i) =>
                      i === index ? { ...a, enabled: e.target.checked } : a
                    );
                    saveAliases(updated);
                  }}
                  onClick={e => e.stopPropagation()}
                />
                <span>{alias.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className={commonStyles.detailsPanel}>
          <label>
            Name
            <input
              type='text'
              value={selected.name}
              onChange={handleFieldChange}
            />
          </label>
          <label>
            Pattern
            <input
              type='text'
              value={selected.pattern}
              onChange={handleFieldChange}
            />
          </label>
          <label>
            Command
            <div className={commonStyles.editorContainer}>
              <Editor
                defaultLanguage='javascript'
                value={selected.command}
                onChange={value => {
                  if (editBuffer) {
                    setEditBuffer({ ...editBuffer, command: value || '' });
                  }
                }}
                theme={EditorOptions.theme}
                options={EditorOptions}
              />
            </div>
          </label>
          <div className={commonStyles.actions}>
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
        </div>
      )}
    </div>
  );
};

export default AliasView;
