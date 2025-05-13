import React, { useEffect, useRef, useState } from 'react';
import commonStyles from '../../styles/common.module.css';

export interface MudProfile {
  name: string;
  host: string;
  port: number;
}

interface ConnectViewProps {
  onConnect: (profile: MudProfile) => void;
  onCancel: () => void;
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
  host: '',
  port: 23,
};

export default function ConnectView({ onConnect, onCancel }: ConnectViewProps) {
  const [profiles, setProfiles] = useState<MudProfile[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<MudProfile | null>(null);
  const [status, setStatus] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);
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

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      !editBuffer.host.trim() ||
      !editBuffer.port.toString().trim()
    )
      return;

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
      !editBuffer.host.trim() ||
      !editBuffer.port.toString().trim()
    )
      return;
    onConnect(editBuffer);
  };

  // Check if there are unsaved changes
  const hasUnsaved =
    selectedIdx !== null &&
    editBuffer &&
    JSON.stringify(editBuffer) !== JSON.stringify(profiles[selectedIdx]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBuffer || !editBuffer.name || !editBuffer.host) {
      setStatus({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }
    onConnect(editBuffer);
  };

  return (
    <div className={commonStyles.viewContainer}>
      <div className={commonStyles.sidebar}>
        <button onClick={handleAdd}>Add Profile</button>
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
                  name='host'
                  value={editBuffer.host}
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
                  type='number'
                  name='port'
                  value={editBuffer.port}
                  onChange={handleFieldChange}
                  placeholder='23'
                  required
                />
              </label>
            </div>
            <div className={commonStyles.actions}>
              <button
                type='button'
                onClick={handleDelete}
                disabled={selectedIdx === null}
              >
                Delete
              </button>
              <button type='button' onClick={handleSave} disabled={!hasUnsaved}>
                Save
              </button>
              <button
                type='button'
                onClick={handleConnect}
                disabled={!editBuffer.name || !editBuffer.host}
              >
                Connect
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#aaa' }}>Select or create a profile</div>
        )}
        {status && (
          <div
            className={`${commonStyles.statusMessage} ${
              commonStyles[status.type]
            }`}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
