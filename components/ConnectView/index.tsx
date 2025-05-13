import React, { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

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
    <div
      className={styles.connectView}
      style={{ display: 'flex', height: '60vh' }}
    >
      <div
        style={{
          width: 200,
          background: '#222',
          color: '#fff',
          borderRadius: '8px 0 0 8px',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          onClick={handleAdd}
          style={{
            marginBottom: 8,
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 0',
            fontSize: '1.2em',
            cursor: 'pointer',
          }}
        >
          Add Profile
        </button>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {profiles.length === 0 ? (
            <li style={{ color: '#aaa', padding: '8px 16px' }}>
              (No profiles)
            </li>
          ) : (
            profiles.map((profile, idx) => (
              <li
                key={idx}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  background: selectedIdx === idx ? '#444' : undefined,
                  fontWeight: selectedIdx === idx ? 'bold' : undefined,
                }}
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
      <div
        style={{
          flex: 1,
          background: '#222',
          borderRadius: '0 8px 8px 0',
          padding: 24,
          boxSizing: 'border-box',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {editBuffer ? (
          <>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontWeight: 500,
              }}
            >
              Profile Name
              <input
                ref={nameInputRef}
                type='text'
                name='name'
                value={editBuffer.name}
                onChange={handleFieldChange}
                placeholder='My MUD Profile'
                required
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1em',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: '#222',
                  color: '#fff',
                }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontWeight: 500,
              }}
            >
              Host
              <input
                type='text'
                name='host'
                value={editBuffer.host}
                onChange={handleFieldChange}
                placeholder='mud.example.com'
                required
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1em',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: '#222',
                  color: '#fff',
                }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontWeight: 500,
              }}
            >
              Port
              <input
                type='number'
                name='port'
                value={editBuffer.port}
                onChange={handleFieldChange}
                min='1'
                max='65535'
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1em',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: '#222',
                  color: '#fff',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={!hasUnsaved}
                style={{
                  background: hasUnsaved ? '#1976d2' : '#aaa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                  cursor: hasUnsaved ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                }}
              >
                Delete
              </button>
              <button
                onClick={handleConnect}
                style={{
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                }}
              >
                Connect
              </button>
              <button
                onClick={onCancel}
                style={{
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#888' }}>Select a profile to edit</div>
        )}
      </div>
    </div>
  );
}
