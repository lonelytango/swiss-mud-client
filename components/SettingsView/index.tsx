import React from 'react';
import './styles.css';

export interface Settings {
  highlightInputOnCommand: boolean;
  showCommandInOutput: boolean;
}

interface SettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleToggle = (key: keyof Settings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className='settings-content'>
      <div className='setting-item'>
        <label>
          Highlight input field when command is sent
          <div className='toggle-switch'>
            <input
              type='checkbox'
              checked={settings.highlightInputOnCommand}
              onChange={() => handleToggle('highlightInputOnCommand')}
            />
            <span className='toggle-slider'></span>
          </div>
        </label>
      </div>
      <div className='setting-item'>
        <label>
          Show command in output when sent
          <div className='toggle-switch'>
            <input
              type='checkbox'
              checked={settings.showCommandInOutput}
              onChange={() => handleToggle('showCommandInOutput')}
            />
            <span className='toggle-slider'></span>
          </div>
        </label>
      </div>
    </div>
  );
};
