import React, { useState } from 'react';
import './styles.css';
import { DataManager, type MudData } from '../../managers/DataManager';

interface DataViewProps {
  onImport: (data: MudData) => void;
}

const DataView: React.FC<DataViewProps> = ({ onImport }) => {
  const [importText, setImportText] = useState('');

  const handleExportToFile = async () => {
    try {
      await DataManager.exportToFile();
    } catch (err) {
      console.error('Failed to export to file:', err);
      alert('Failed to export data to file');
    }
  };

  const handleExportToClipboard = async () => {
    try {
      await DataManager.exportToClipboard();
      alert('Data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy data to clipboard');
    }
  };

  const handleImportFromFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await DataManager.importFromFile(file);
      onImport(data);
      alert('Data imported successfully!');
    } catch (err) {
      console.error('Failed to import from file:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to import data from file'
      );
    }
  };

  const handleImportFromText = () => {
    try {
      const data = DataManager.importFromText(importText);
      onImport(data);
      setImportText('');
      alert('Data imported successfully!');
    } catch (err) {
      console.error('Failed to import from text:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to import data from text'
      );
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
              onChange={e => setImportText(e.target.value)}
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
