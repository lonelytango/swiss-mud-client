import React, { useEffect, useRef, useState } from 'react';
import './styles.css';
import classNames from 'classnames';

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

export default function ConnectView({ onConnect, onCancel }: ConnectViewProps) {
	const [profiles, setProfiles] = useState<MudProfile[]>([]);
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	const [inputs, setInputs] = useState<MudProfile>({
		name: '',
		address: '',
		port: '',
	});
	const nameInputRef = useRef<HTMLInputElement>(null);

	// Load profiles only once on mount
	useEffect(() => {
		const loadedProfiles = loadProfiles();
		setProfiles(loadedProfiles);
	}, []);

	useEffect(() => {
		if (selectedIdx !== null && profiles[selectedIdx]) {
			setInputs(profiles[selectedIdx]);
		}
	}, [selectedIdx]);

	// Action Handlers
	const handleSelect = (idx: number) => {
		setSelectedIdx(idx);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setInputs((prev) => ({ ...prev, [name]: value }));
	};

	const handleNew = () => {
		setSelectedIdx(null);
		setInputs({ name: '', address: '', port: '' });
		setTimeout(() => nameInputRef.current?.focus(), 0);
	};

	const handleRemove = () => {
		if (selectedIdx !== null) {
			const newProfiles = profiles.filter((_, i) => i !== selectedIdx);
			console.trace('setProfiles called from handleRemove');
			setProfiles(newProfiles);
			saveProfiles(newProfiles);
			setSelectedIdx(null);
			setInputs({ name: '', address: '', port: '' });
		}
	};

	const handleConnect = () => {
		if (!inputs.name.trim() || !inputs.address.trim() || !inputs.port.trim())
			return;
		let newProfiles = [...profiles];
		let idx = selectedIdx;
		if (idx === null) {
			// Add new
			newProfiles.push(inputs);
			idx = newProfiles.length - 1;
		} else {
			// Update existing
			newProfiles[idx] = inputs;
		}
		console.trace(
			`setProfiles called from handleConnect: ${JSON.stringify(newProfiles)}`
		);
		setProfiles(newProfiles);
		saveProfiles(newProfiles);
		setSelectedIdx(idx);
		onConnect(inputs);
	};

	function loadProfiles(): MudProfile[] {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			console.log(`Loading profiles: ${data}`);
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
		<div className='connect-modal'>
			<div className='connect-modal-left'>
				<div className='profile-list'>
					{profiles.length === 0 ? (
						<div className={'profile-list-empty'}>No saved profiles</div>
					) : (
						profiles.map((profile, idx) => (
							<div
								key={profile.name + idx}
								className={classNames('profile-item', {
									selected: idx === selectedIdx,
								})}
								onClick={() => handleSelect(idx)}
							>
								{profile.name}
							</div>
						))
					)}
				</div>
				<div className={'button-row'}>
					<button onClick={handleNew}>New</button>
					<button onClick={handleRemove} disabled={selectedIdx === null}>
						Remove
					</button>
				</div>
			</div>
			<div className='connect-modal-right'>
				<h2 className='connect-title'>Connect to</h2>
				<div className='input-row'>
					<label>Profile Name</label>
					<input
						ref={nameInputRef}
						name='name'
						value={inputs.name}
						onChange={handleInputChange}
						autoFocus
					/>
				</div>
				<div className='input-row'>
					<label>Server Address</label>
					<input
						name='address'
						value={inputs.address}
						onChange={handleInputChange}
					/>
				</div>
				<div className={'input-row'}>
					<label>Port</label>
					<input name='port' value={inputs.port} onChange={handleInputChange} />
				</div>
				<div className={'button-row'}>
					<button onClick={onCancel}>Cancel</button>
					<button
						onClick={handleConnect}
						disabled={
							!inputs.name.trim() ||
							!inputs.address.trim() ||
							!inputs.port.trim()
						}
					>
						Connect
					</button>
				</div>
			</div>
		</div>
	);
}
