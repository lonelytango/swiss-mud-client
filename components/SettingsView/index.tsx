// components/SettingsView/index.tsx
// View for the settings.

import React from 'react';
import styles from './styles.module.css';
import commonStyles from '../../styles/common.module.css';

export interface Settings {
  highlightInputOnCommand: boolean;
  showCommandInOutput: boolean;
  fontFamily: string;
}

interface SettingsViewProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

const FONT_FAMILIES = [
  { value: 'monospace', label: 'Monospace' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Menlo, Monaco, monospace', label: 'Menlo / Monaco' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro' },
  {
    value:
      "'Noto Sans Mono CJK SC', 'Noto Sans Mono', 'Noto Sans CJK SC', 'Microsoft YaHei Mono', 'monospace'",
    label: 'Noto Sans Mono CJK SC',
  },
  {
    value:
      "'Noto Sans Mono CJK TC', 'Noto Sans Mono', 'Noto Sans CJK TC', 'PingFang TC', 'monospace'",
    label: 'Noto Sans Mono CJK TC',
  },
  {
    value:
      "'Noto Sans Mono CJK JP', 'Noto Sans Mono', 'Noto Sans CJK JP', 'Meiryo', 'monospace'",
    label: 'Noto Sans Mono CJK JP',
  },
  {
    value:
      "'Noto Sans Mono CJK KR', 'Noto Sans Mono', 'Noto Sans CJK KR', 'Malgun Gothic', 'monospace'",
    label: 'Noto Sans Mono CJK KR',
  },
  { value: "'SimSun', 'NSimSun', 'monospace'", label: 'SimSun' },
  { value: "'MS Mincho', 'monospace'", label: 'MS Mincho' },
  { value: "'Batang', 'monospace'", label: 'Batang' },
  { value: "'MingLiU', 'PMingLiU', 'monospace'", label: 'MingLiU' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  {
    value: 'Palatino Linotype, Book Antiqua, Palatino, serif',
    label: 'Palatino',
  },
  { value: 'Garamond, serif', label: 'Garamond' },
  {
    value: "'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'monospace'",
    label: 'PingFang SC',
  },
  {
    value:
      "'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', 'monospace'",
    label: 'PingFang TC',
  },
  {
    value:
      "'PingFang HK', 'Noto Sans CJK HK', 'Microsoft JhengHei', 'monospace'",
    label: 'PingFang HK',
  },
];

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  const handleToggle = (key: keyof Settings) => {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className={commonStyles.viewContainer}>
      <div className={commonStyles.detailsPanel}>
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
        <div className={styles.settingItem}>
          <label>
            Output font family
            <select
              value={settings.fontFamily}
              onChange={e =>
                onChange({ ...settings, fontFamily: e.target.value })
              }
              style={{ marginLeft: 8 }}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
