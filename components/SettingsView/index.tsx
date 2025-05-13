import React from 'react';
import styles from './styles.module.css';

export interface Settings {
  highlightInputOnCommand: boolean;
  showCommandInOutput: boolean;
}

interface SettingsViewProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  const handleToggle = (key: keyof Settings) => {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className={styles.settingsView}>
      <div className={styles.settingsContent}>
        <div className={styles.settingItem}>
          <label>
            Highlight input on command
            <div className={styles.toggleSwitch}>
              <input
                type='checkbox'
                checked={settings.highlightInputOnCommand}
                onChange={() => handleToggle('highlightInputOnCommand')}
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>
        </div>
        <div className={styles.settingItem}>
          <label>
            Show command in output
            <div className={styles.toggleSwitch}>
              <input
                type='checkbox'
                checked={settings.showCommandInOutput}
                onChange={() => handleToggle('showCommandInOutput')}
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
