import React, { useState } from 'react';
import './styles.css';
import type { Alias, Variable } from '../../types';
import ConnectView, { type MudProfile } from '../ConnectView';
import AliasView from '../AliasView';
import VariableView from '../VariableView';
import DataView from '../DataView';
import { DataManager, type MudData } from '../../utils/DataManager';

type MenuButton = {
	id: string;
	label: string;
	icon: string;
};

const menuButtons: MenuButton[] = [
	{ id: 'connect', label: 'Connect', icon: '🔌' },
	{ id: 'triggers', label: 'Triggers', icon: '⚡' },
	{ id: 'alias', label: 'Alias', icon: '📝' },
	{ id: 'scripts', label: 'Scripts', icon: '📜' },
	{ id: 'variables', label: 'Variables', icon: '📊' },
	{ id: 'data', label: 'Data', icon: '💾' },
];

type PopupProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	setActivePopup: (id: string) => void;
};

function Popup({
	isOpen,
	onClose,
	title,
	children,
	setActivePopup,
}: PopupProps) {
	if (!isOpen) return null;

	return (
		<div className='popup-overlay'>
			<div className='popup'>
				<div className='popup-header'>
					<h3>{title}</h3>
					<button className='close-button' onClick={onClose}>
						<span className='button-icon'>✕</span>
					</button>
				</div>
				<div className='popup-nav'>
					{menuButtons.map((button) => (
						<button
							key={button.id}
							className='popup-nav-button'
							onClick={() => setActivePopup(button.id)}
						>
							<span className='popup-nav-icon'>{button.icon}</span>
							<span className='popup-nav-label'>{button.label}</span>
						</button>
					))}
				</div>
				<div className='popup-content'>{children}</div>
			</div>
		</div>
	);
}

export function Menu({
	onProfileConnect,
	aliases,
	setAliases,
	variables,
	setVariables,
}: {
	onProfileConnect?: (profile: MudProfile) => void;
	aliases: Alias[];
	setAliases: React.Dispatch<React.SetStateAction<Alias[]>>;
	variables: Variable[];
	setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
}) {
	const [activePopup, setActivePopup] = useState<string | null>(null);

	const handleButtonClick = (id: string) => {
		setActivePopup(id);
	};

	const handleClose = () => {
		setActivePopup(null);
	};

	const handleProfileConnect = (profile: MudProfile) => {
		onProfileConnect?.(profile);
		setActivePopup(null);
	};

	const handleDataImport = (data: MudData) => {
		// Save to localStorage using DataManager
		DataManager.saveDataToStorage(data);

		// Update state
		setVariables(data.mud_variables);
		setAliases(data.mud_aliases);
	};

	return (
		<div className='menu'>
			{menuButtons.map((button) => (
				<button
					key={button.id}
					className='menu-button'
					onClick={() => handleButtonClick(button.id)}
				>
					<span className='button-icon'>{button.icon}</span>
					<span className='button-label'>{button.label}</span>
				</button>
			))}

			<Popup
				isOpen={activePopup === 'connect'}
				onClose={handleClose}
				title='Connect'
				setActivePopup={setActivePopup}
			>
				<ConnectView onConnect={handleProfileConnect} onCancel={handleClose} />
			</Popup>

			<Popup
				isOpen={activePopup === 'triggers'}
				onClose={handleClose}
				title='Triggers'
				setActivePopup={setActivePopup}
			>
				<p>Trigger management coming soon</p>
			</Popup>

			<Popup
				isOpen={activePopup === 'alias'}
				onClose={handleClose}
				title='Aliases'
				setActivePopup={setActivePopup}
			>
				<AliasView aliases={aliases} onChange={setAliases} />
			</Popup>

			<Popup
				isOpen={activePopup === 'scripts'}
				onClose={handleClose}
				title='Scripts'
				setActivePopup={setActivePopup}
			>
				<p>Script management coming soon</p>
			</Popup>

			<Popup
				isOpen={activePopup === 'variables'}
				onClose={handleClose}
				title='Variables'
				setActivePopup={setActivePopup}
			>
				<VariableView variables={variables} onChange={setVariables} />
			</Popup>

			<Popup
				isOpen={activePopup === 'data'}
				onClose={handleClose}
				title='Data Management'
				setActivePopup={setActivePopup}
			>
				<DataView onImport={handleDataImport} />
			</Popup>
		</div>
	);
}
