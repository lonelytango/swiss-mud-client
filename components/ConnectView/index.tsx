import React, { useEffect, useRef, useState } from 'react';
import './styles.css';

export type MudProfile = {
	name: string;
	address: string;
	port: string;
};

type ConnectViewProps = {
	onConnect: (profile: MudProfile) => void;
	onCancel: () => void;
};

const STORAGE_KEY = 'mud_profiles';
const emptyProfile: MudProfile = { name: '', address: '', port: '' };

export default function ConnectView({ onConnect }: ConnectViewProps) {
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

	const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!editBuffer) return;
		const { name, value } = e.target;
		setEditBuffer({ ...editBuffer, [name]: value });
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
			!editBuffer.port.trim()
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
			!editBuffer.address.trim() ||
			!editBuffer.port.trim()
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

	return (
    <div className='connect-view' role='form' aria-label='Connection settings'>
      <div
        className='connect-sidebar'
        role='navigation'
        aria-label='Profile list'
      >
        <button
          onClick={handleAdd}
          title='Add Profile'
          aria-label='Add new profile'
        >
          ＋
        </button>
        <ul role='list'>
          {profiles.length === 0 ? (
            <li className='empty-message' role='listitem'>
              No saved profiles
            </li>
          ) : (
            profiles.map((profile, idx) => (
              <li
                key={profile.name + idx}
                className={selectedIdx === idx ? 'selected' : ''}
                onClick={() => handleSelect(idx)}
                role='listitem'
                aria-selected={selectedIdx === idx}
              >
                {profile.name || (
                  <span style={{ color: '#aaa' }}>(unnamed)</span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className='connect-details' role='form' aria-label='Profile details'>
        {editBuffer ? (
          <>
            <label>
              Profile Name
              <input
                ref={nameInputRef}
                name='name'
                value={editBuffer.name}
                onChange={handleFieldChange}
                autoFocus
                aria-label='Profile name'
                aria-required='true'
              />
            </label>
            <label>
              Server Address
              <input
                name='address'
                value={editBuffer.address}
                onChange={handleFieldChange}
                aria-label='Server address'
                aria-required='true'
              />
            </label>
            <label>
              Port
              <input
                name='port'
                value={editBuffer.port}
                onChange={handleFieldChange}
                aria-label='Server port'
                aria-required='true'
              />
            </label>
            <div
              className='actions'
              role='toolbar'
              aria-label='Profile actions'
            >
              <button
                onClick={handleSave}
                disabled={!hasUnsaved}
                style={{ background: hasUnsaved ? '#1976d2' : '#aaa' }}
                aria-label='Save profile'
                aria-disabled={!hasUnsaved}
              >
                Save
              </button>
              <button
                onClick={handleDelete}
                style={{ background: '#c62828' }}
                aria-label='Delete profile'
              >
                Delete
              </button>
              <button
                onClick={handleConnect}
                disabled={
                  !editBuffer.name.trim() ||
                  !editBuffer.address.trim() ||
                  !editBuffer.port.trim()
                }
                style={{ background: '#2e7d32' }}
                aria-label='Connect to server'
                aria-disabled={
                  !editBuffer.name.trim() ||
                  !editBuffer.address.trim() ||
                  !editBuffer.port.trim()
                }
              >
                Connect
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#888' }} role='status'>
            Select a profile to edit
          </div>
        )}
      </div>
    </div>
  );
}
