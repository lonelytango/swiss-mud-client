// components/ConnectView/index.tsx
// View for the connect.

import React, { useEffect, useRef, useState } from 'react';
import commonStyles from '../../styles/common.module.css';

export interface MudProfile {
  name: string;
  address: string;
  port: number;
  encoding: string;
}

interface ConnectViewProps {
  onConnect: (profile: MudProfile) => void;
  saveRef?: React.RefObject<{ save: () => void } | null>;
}

const STORAGE_KEY = 'mud_profiles';
const ENCODINGS = [
  { value: 'utf8', label: 'UTF-8 (default)' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'gbk', label: 'GBK' },
  { value: 'big5', label: 'Big5' },
];
const emptyProfile: MudProfile = {
  name: '',
  address: '',
  port: 23,
  encoding: 'utf8',
};

export default function ConnectView({ onConnect, saveRef }: ConnectViewProps) {
  const [profiles, setProfiles] = useState<MudProfile[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<MudProfile | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load profiles only once on mount
  useEffect(() => {
    const loadedProfiles = loadProfiles();
    setProfiles(loadedProfiles);
    if (loadedProfiles.length > 0) {
      setSelectedIdx(0);
    }
  }, []);

  // When selectedIdx changes, update editBuffer
  useEffect(() => {
    if (selectedIdx !== null && profiles[selectedIdx]) {
      setEditBuffer({ ...profiles[selectedIdx] });
    } else {
      setEditBuffer(null);
    }
  }, [selectedIdx, profiles]);

  // Action Handlers
  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editBuffer) return;
    const { name, value } = e.target;
    setEditBuffer({
      ...editBuffer,
      [name]: name === 'port' ? parseInt(value) || 23 : value,
    });
  };

  const handleAdd = () => {
    const newProfiles = [...profiles, { ...emptyProfile }];
    setProfiles(newProfiles);
    setEditBuffer({ ...emptyProfile });
    setSelectedIdx(newProfiles.length - 1);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleDelete = () => {
    if (selectedIdx === null) return;
    if (!window.confirm('Delete this profile?')) return;
    const newProfiles = profiles.filter((_, idx) => idx !== selectedIdx);
    setProfiles(newProfiles);
    saveProfiles(newProfiles);
    setSelectedIdx(newProfiles.length > 0 ? 0 : null);
  };

  const handleSave = () => {
    if (selectedIdx === null || !editBuffer) return;
    if (
      !editBuffer.name.trim() ||
      !editBuffer.address.trim() ||
      !editBuffer.port.toString().trim()
    )
      return;

    //Save profile
    const updated = profiles.map((profile, idx) =>
      idx === selectedIdx ? { ...editBuffer } : profile
    );
    setProfiles(updated);
    saveProfiles(updated);
  };

  const handleConnect = () => {
    if (!editBuffer) return;
    if (
      !editBuffer.name.trim() ||
      !editBuffer.address.trim() ||
      !editBuffer.port.toString().trim()
    )
      return;
    onConnect(editBuffer);

    //Save profile
    const updated = profiles.map((profile, idx) =>
      idx === selectedIdx ? { ...editBuffer } : profile
    );
    setProfiles(updated);
    saveProfiles(updated);
  };

  // Check if there are unsaved changes
  const hasUnsaved =
    selectedIdx !== null &&
    editBuffer &&
    JSON.stringify(editBuffer) !== JSON.stringify(profiles[selectedIdx]);

  // Expose save method to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = { save: handleSave };
    }
  }, [handleSave, saveRef]);

  function loadProfiles(): MudProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading profiles', error);
      return [];
    }
  }

  function saveProfiles(profiles: MudProfile[]) {
    const profilesJsonStr = JSON.stringify(profiles);
    localStorage.setItem(STORAGE_KEY, profilesJsonStr);
  }

  return (
    <div className={commonStyles.viewContainer}>
      <div className={commonStyles.sidebar}>
        <button onClick={handleAdd}>+</button>
        <ul>
          {profiles.length === 0 ? (
            <li style={{ color: '#aaa', padding: '8px 16px' }}>
              (No profiles)
            </li>
          ) : (
            profiles.map((profile, idx) => (
              <li
                key={idx}
                className={selectedIdx === idx ? commonStyles.selected : ''}
                onClick={() => handleSelect(idx)}
              >
                {profile.name || (
                  <span style={{ color: '#aaa' }}>(unnamed)</span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className={commonStyles.detailsPanel}>
        {editBuffer ? (
          <>
            <div className={commonStyles.formGroup}>
              <label>
                Profile Name
                <input
                  ref={nameInputRef}
                  type='text'
                  name='name'
                  value={editBuffer.name}
                  onChange={handleFieldChange}
                  placeholder='My MUD Profile'
                  required
                />
              </label>
            </div>
            <div className={commonStyles.formGroup}>
              <label>
                Host
                <input
                  type='text'
                  name='address'
                  value={editBuffer.address}
                  onChange={handleFieldChange}
                  placeholder='mud.example.com'
                  required
                />
              </label>
            </div>
            <div className={commonStyles.formGroup}>
              <label>
                Port
                <input
                  type='text'
                  name='port'
                  value={editBuffer.port}
                  onChange={handleFieldChange}
                  placeholder='23'
                  required
                />
              </label>
            </div>
            <div className={commonStyles.formGroup}>
              <label>
                Encoding
                <select
                  name='encoding'
                  value={editBuffer.encoding}
                  onChange={handleFieldChange}
                >
                  {ENCODINGS.map(encoding => (
                    <option key={encoding.value} value={encoding.value}>
                      {encoding.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={commonStyles.actions}>
              <button
                className={commonStyles.confirmAction}
                type='button'
                onClick={handleConnect}
                disabled={!editBuffer.name || !editBuffer.address}
              >
                Connect
              </button>
              <button
                className={commonStyles.deleteAction}
                type='button'
                onClick={handleDelete}
                disabled={selectedIdx === null}
              >
                Delete
              </button>
              <button type='button' onClick={handleSave} disabled={!hasUnsaved}>
                Save
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#aaa' }}>Select or create a profile</div>
        )}
      </div>
    </div>
  );
}
