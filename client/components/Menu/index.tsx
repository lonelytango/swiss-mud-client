import { useState } from 'react';
import ConnectView, { type MudProfile } from '../ConnectView';
import './styles.css';

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
];

type PopupProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
};

function Popup({ isOpen, onClose, title, children }: PopupProps) {
	if (!isOpen) return null;

	return (
		<div className='popup-overlay'>
			<div className='popup'>
				<div className='popup-header'>
					<h3>{title}</h3>
					<button className='close-button' onClick={onClose}>
						×
					</button>
				</div>
				<div className='popup-content'>{children}</div>
			</div>
		</div>
	);
}

export function Menu({
	onProfileConnect,
}: {
	onProfileConnect?: (profile: MudProfile) => void;
}) {
	const [activePopup, setActivePopup] = useState<string | null>(null);
	const [showConnectView, setShowConnectView] = useState(false);

	const handleButtonClick = (id: string) => {
		if (id === 'connect') {
			setShowConnectView(true);
		} else {
			setActivePopup(id);
		}
	};

	const handleClose = () => {
		setActivePopup(null);
	};

	const handleConnectViewCancel = () => {
		setShowConnectView(false);
	};

	const handleProfileConnect = (profile: MudProfile) => {
		setShowConnectView(false);
		onProfileConnect?.(profile);
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

			{showConnectView && (
				<ConnectView
					onConnect={handleProfileConnect}
					onCancel={handleConnectViewCancel}
				/>
			)}

			<Popup
				isOpen={activePopup === 'triggers'}
				onClose={handleClose}
				title='Triggers'
			>
				<p>Trigger management will go here</p>
			</Popup>

			<Popup
				isOpen={activePopup === 'alias'}
				onClose={handleClose}
				title='Aliases'
			>
				<p>Alias management will go here</p>
			</Popup>

			<Popup
				isOpen={activePopup === 'scripts'}
				onClose={handleClose}
				title='Scripts'
			>
				<p>Script management will go here</p>
			</Popup>

			<Popup
				isOpen={activePopup === 'variables'}
				onClose={handleClose}
				title='Variables'
			>
				<p>Variable management will go here</p>
			</Popup>
		</div>
	);
}
