import React, { useState, useEffect, useRef } from 'react';
import type { Trigger } from '../../types';
import './styles.css';

interface TriggerViewProps {
	triggers: Trigger[];
	onChange: (triggers: Trigger[]) => void;
}

const emptyTrigger: Trigger = {
  name: '',
  pattern: '',
  command: '',
  enabled: true,
};
const STORAGE_KEY = 'mud_triggers';

const TriggerView: React.FC<TriggerViewProps> = ({ triggers, onChange }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    triggers.length > 0 ? 0 : null
  );
  const [editBuffer, setEditBuffer] = useState<Trigger | null>(null);
  const [localTriggers, setLocalTriggers] = useState<Trigger[]>(triggers);
  const initialLoad = useRef(true);

  // Helper function to save triggers
  const saveTriggers = (updated: Trigger[]) => {
    setLocalTriggers(updated);
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
          // Ensure all triggers have enabled set to true by default
          const triggersWithEnabled = parsed.map(trigger => ({
            ...trigger,
            enabled: trigger.enabled ?? true,
          }));
          saveTriggers(triggersWithEnabled);
          setSelectedIdx(triggersWithEnabled.length > 0 ? 0 : null);
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
    saveTriggers(updated);
  };

  // Delete selected trigger
  const handleDelete = () => {
    if (selectedIdx === null) return;
    if (!window.confirm('Delete this trigger?')) return;
    const newTriggers = localTriggers.filter((_, idx) => idx !== selectedIdx);
    saveTriggers(newTriggers);
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

    const updated = [...localTriggers];
    const [movedItem] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    saveTriggers(updated);
    setSelectedIdx(targetIdx);
  };

  return (
    <div className='trigger-view' role='form' aria-label='Trigger management'>
      <div
        className='trigger-sidebar'
        role='navigation'
        aria-label='Trigger list'
      >
        <button
          onClick={handleAdd}
          title='Add Trigger'
          aria-label='Add new trigger'
        >
          ＋
        </button>
        <ul role='list'>
          {localTriggers.map((trigger, idx) => (
            <li
              key={idx}
              className={selectedIdx === idx ? 'selected' : ''}
              onClick={() => handleSelect(idx)}
              role='listitem'
              aria-selected={selectedIdx === idx}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, idx)}
            >
              <div className='trigger-item-content'>
                <div className='drag-handle' title='Drag to reorder'>
                  ⋮⋮
                </div>
                <input
                  type='checkbox'
                  checked={trigger.enabled}
                  onChange={e => {
                    e.stopPropagation();
                    const updated = localTriggers.map((t, i) =>
                      i === idx ? { ...t, enabled: e.target.checked } : t
                    );
                    saveTriggers(updated);
                  }}
                  aria-label={`${
                    trigger.enabled ? 'Disable' : 'Enable'
                  } trigger ${trigger.name || '(unnamed)'}`}
                />
                <span>
                  {trigger.name || (
                    <span style={{ color: '#aaa' }}>(unnamed)</span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className='trigger-details' role='form' aria-label='Trigger details'>
        {selected ? (
          <>
            <label>
              Name
              <input
                name='name'
                value={selected.name}
                onChange={handleFieldChange}
                autoFocus
                aria-label='Trigger name'
              />
            </label>
            <label>
              Pattern
              <input
                name='pattern'
                value={selected.pattern}
                onChange={handleFieldChange}
                aria-label='Trigger pattern'
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
                aria-label='Trigger command'
                aria-required='true'
              />
            </label>
            <div
              className='actions'
              role='toolbar'
              aria-label='Trigger actions'
            >
              <button
                onClick={handleSave}
                disabled={!hasUnsaved}
                style={{ background: hasUnsaved ? '#1976d2' : '#aaa' }}
                aria-label='Save trigger'
                aria-disabled={!hasUnsaved}
              >
                Save
              </button>
              <button
                onClick={handleDelete}
                style={{ background: '#c62828' }}
                aria-label='Delete trigger'
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#888' }} role='status'>
            Select a trigger to edit
          </div>
        )}
      </div>
    </div>
  );
};

export default TriggerView;
