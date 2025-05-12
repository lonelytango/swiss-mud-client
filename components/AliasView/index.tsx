import React, { useState, useEffect, useRef } from 'react';
import type { Alias } from '../../types';
import './styles.css';

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
          setLocalAliases(aliasesWithEnabled);
          onChange(aliasesWithEnabled);
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
    setLocalAliases(updated);
    onChange(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Delete selected alias
  const handleDelete = () => {
    if (selectedIdx === null) return;
    if (!window.confirm('Delete this alias?')) return;
    const newAliases = localAliases.filter((_, idx) => idx !== selectedIdx);
    setLocalAliases(newAliases);
    onChange(newAliases);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAliases));
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

  return (
    <div className='alias-view' role='form' aria-label='Alias management'>
      <div className='alias-sidebar' role='navigation' aria-label='Alias list'>
        <button
          onClick={handleAdd}
          title='Add Alias'
          aria-label='Add new alias'
        >
          ＋
        </button>
        <ul role='list'>
          {localAliases.map((alias, idx) => (
            <li
              key={idx}
              className={selectedIdx === idx ? 'selected' : ''}
              onClick={() => handleSelect(idx)}
              role='listitem'
              aria-selected={selectedIdx === idx}
            >
              <div className='alias-item-content'>
                <input
                  type='checkbox'
                  checked={alias.enabled}
                  onChange={e => {
                    e.stopPropagation();
                    const updated = localAliases.map((a, i) =>
                      i === idx ? { ...a, enabled: e.target.checked } : a
                    );
                    setLocalAliases(updated);
                    onChange(updated);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                  }}
                  aria-label={`${alias.enabled ? 'Disable' : 'Enable'} alias ${
                    alias.name || '(unnamed)'
                  }`}
                />
                <span>
                  {alias.name || (
                    <span style={{ color: '#aaa' }}>(unnamed)</span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className='alias-details' role='form' aria-label='Alias details'>
        {selected ? (
          <>
            <label>
              Name
              <input
                name='name'
                value={selected.name}
                onChange={handleFieldChange}
                autoFocus
                aria-label='Alias name'
              />
            </label>
            <label>
              Pattern
              <input
                name='pattern'
                value={selected.pattern}
                onChange={handleFieldChange}
                aria-label='Alias pattern'
                aria-required='true'
              />
            </label>
            <label>
              Command
              <textarea
                name='command'
                value={selected.command}
                onChange={handleFieldChange}
                rows={4}
                aria-label='Alias command'
                aria-required='true'
              />
            </label>
            <div className='actions' role='toolbar' aria-label='Alias actions'>
              <button
                onClick={handleSave}
                disabled={!hasUnsaved}
                style={{ background: hasUnsaved ? '#1976d2' : '#aaa' }}
                aria-label='Save alias'
                aria-disabled={!hasUnsaved}
              >
                Save
              </button>
              <button
                onClick={handleDelete}
                style={{ background: '#c62828' }}
                aria-label='Delete alias'
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#888' }} role='status'>
            Select an alias to edit
          </div>
        )}
      </div>
    </div>
  );
};

export default AliasView;
