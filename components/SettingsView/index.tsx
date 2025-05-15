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
              <option value='Fira Mono, Consolas, Courier New, monospace'>
                Fira Mono / Consolas / Courier New (Latin, general monospace)
              </option>
              <option value='monospace'>
                Monospace (system default, general)
              </option>
              <option value='Consolas, monospace'>
                Consolas (Latin, monospace)
              </option>
              <option value='Courier New, monospace'>
                Courier New (Latin, monospace)
              </option>
              <option value='Menlo, Monaco, monospace'>
                Menlo / Monaco (Latin, macOS monospace)
              </option>
              <option value='Source Code Pro, monospace'>
                Source Code Pro (Latin, Adobe)
              </option>
              <option value="'Noto Sans Mono CJK SC', 'Noto Sans Mono', 'Noto Sans CJK SC', 'Microsoft YaHei Mono', 'monospace'">
                Noto Sans Mono CJK SC (Chinese Simplified)
              </option>
              <option value="'Noto Sans Mono CJK TC', 'Noto Sans Mono', 'Noto Sans CJK TC', 'PingFang TC', 'monospace'">
                Noto Sans Mono CJK TC (Chinese Traditional)
              </option>
              <option value="'Noto Sans Mono CJK JP', 'Noto Sans Mono', 'Noto Sans CJK JP', 'Meiryo', 'monospace'">
                Noto Sans Mono CJK JP (Japanese)
              </option>
              <option value="'Noto Sans Mono CJK KR', 'Noto Sans Mono', 'Noto Sans CJK KR', 'Malgun Gothic', 'monospace'">
                Noto Sans Mono CJK KR (Korean)
              </option>
              <option value="'SimSun', 'NSimSun', 'monospace'">
                SimSun (Chinese Simplified, serif-style)
              </option>
              <option value="'MS Mincho', 'monospace'">
                MS Mincho (Japanese, serif-style)
              </option>
              <option value="'Batang', 'monospace'">
                Batang (Korean, serif-style)
              </option>
              <option value="'MingLiU', 'PMingLiU', 'monospace'">
                MingLiU (Traditional Chinese, serif-style)
              </option>
              <option value='Georgia, serif'>
                Georgia (Serif, book style, Latin)
              </option>
              <option value='Times New Roman, Times, serif'>
                Times New Roman (Serif, book style, Latin)
              </option>
              <option value='Palatino Linotype, Book Antiqua, Palatino, serif'>
                Palatino (Serif, book style, Latin)
              </option>
              <option value='Garamond, serif'>
                Garamond (Serif, book style, Latin)
              </option>
              <option value="'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'monospace'">
                PingFang SC (Simplified Chinese, Apple/macOS/iOS)
              </option>
              <option value="'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', 'monospace'">
                PingFang TC (Traditional Chinese, Apple/macOS/iOS)
              </option>
              <option value="'PingFang HK', 'Noto Sans CJK HK', 'Microsoft JhengHei', 'monospace'">
                PingFang HK (Hong Kong Traditional Chinese, Apple/macOS/iOS)
              </option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
