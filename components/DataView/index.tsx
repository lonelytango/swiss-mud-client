import React, { useState } from 'react';
import './styles.css';

interface DataViewProps {
	onImport: (data: {
		mud_profiles: any[];
		mud_variables: any[];
		mud_aliases: any[];
	}) => void;
}

const DataView: React.FC<DataViewProps> = ({ onImport }) => {
	const [importText, setImportText] = useState('');

	const handleExportToFile = () => {
		const data = {
			mud_profiles: JSON.parse(localStorage.getItem('mud_profiles') || '[]'),
			mud_variables: JSON.parse(localStorage.getItem('mud_variables') || '[]'),
			mud_aliases: JSON.parse(localStorage.getItem('mud_aliases') || '[]'),
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: 'application/json',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mud-data.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleExportToClipboard = () => {
		const data = {
			mud_profiles: JSON.parse(localStorage.getItem('mud_profiles') || '[]'),
			mud_variables: JSON.parse(localStorage.getItem('mud_variables') || '[]'),
			mud_aliases: JSON.parse(localStorage.getItem('mud_aliases') || '[]'),
		};

		navigator.clipboard
			.writeText(JSON.stringify(data, null, 2))
			.then(() => alert('Data copied to clipboard!'))
			.catch((err) => console.error('Failed to copy data:', err));
	};

	const handleImportFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target?.result as string);
				if (data.mud_profiles && data.mud_variables && data.mud_aliases) {
					onImport(data);
					alert('Data imported successfully!');
				} else {
					alert('Invalid data format!');
				}
			} catch (err) {
				alert('Failed to parse JSON file!');
				console.error(err);
			}
		};
		reader.readAsText(file);
	};

	const handleImportFromText = () => {
		try {
			const data = JSON.parse(importText);
			if (data.mud_profiles && data.mud_variables && data.mud_aliases) {
				onImport(data);
				setImportText('');
				alert('Data imported successfully!');
			} else {
				alert('Invalid data format!');
			}
		} catch (err) {
			alert('Failed to parse JSON text!');
			console.error(err);
		}
	};

	return (
		<div className='data-view'>
			<div className='data-section'>
				<h3>Export Data</h3>
				<div className='button-group'>
					<button onClick={handleExportToFile}>Export to File</button>
					<button onClick={handleExportToClipboard}>Export to Clipboard</button>
				</div>
			</div>

			<div className='data-section'>
				<h3>Import Data</h3>
				<div className='import-options'>
					<div className='file-import'>
						<label className='file-input-label'>
							Import from File
							<input
								type='file'
								accept='.json'
								onChange={handleImportFromFile}
								style={{ display: 'none' }}
							/>
						</label>
					</div>

					<div className='text-import'>
						<textarea
							value={importText}
							onChange={(e) => setImportText(e.target.value)}
							placeholder='Paste JSON data here...'
							rows={10}
						/>
						<button onClick={handleImportFromText}>Import from Text</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DataView;
