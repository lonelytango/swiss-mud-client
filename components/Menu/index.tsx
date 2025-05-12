import React, { useState } from 'react';
import './styles.css';
import type { Alias, Trigger } from '../../types';
import ConnectView, { type MudProfile } from '../ConnectView';
import AliasView from '../AliasView';
import TriggerView from '../TriggerView';
import VariableView from '../VariableView';
import DataView from '../DataView';
import { DataManager, type MudData } from '../../managers/DataManager';
import { useVariables } from '../../contexts/VariablesContext';

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
  activePopup: string | null;
};

function Popup({
  isOpen,
  onClose,
  title,
  children,
  setActivePopup,
  activePopup,
}: PopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className='popup-overlay'
      role='dialog'
      aria-modal='true'
      aria-labelledby='popup-title'
    >
      <div className='popup'>
        <div className='popup-header'>
          <h3 id='popup-title'>{title}</h3>
          <button
            className='close-button'
            onClick={onClose}
            aria-label='Close dialog'
          >
            <span className='button-icon' aria-hidden='true'>
              ✕
            </span>
          </button>
        </div>
        <div className='popup-nav' role='tablist'>
          {menuButtons.map(button => (
            <button
              key={button.id}
              className='popup-nav-button'
              onClick={() => setActivePopup(button.id)}
              role='tab'
              aria-selected={activePopup === button.id}
              aria-controls={`${button.id}-panel`}
            >
              <span className='popup-nav-icon' aria-hidden='true'>
                {button.icon}
              </span>
              <span className='popup-nav-label'>{button.label}</span>
            </button>
          ))}
        </div>
        <div
          className='popup-content'
          role='tabpanel'
          id={`${activePopup}-panel`}
          aria-labelledby={`${activePopup}-tab`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function Menu({
  onProfileConnect,
  aliases,
  setAliases,
  triggers,
  setTriggers,
}: {
  onProfileConnect?: (profile: MudProfile) => void;
  aliases: Alias[];
  setAliases: React.Dispatch<React.SetStateAction<Alias[]>>;
  triggers: Trigger[];
  setTriggers: React.Dispatch<React.SetStateAction<Trigger[]>>;
}) {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const { setVariables } = useVariables();

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
    if (data.mud_triggers) {
      setTriggers(data.mud_triggers);
    }
  };

  return (
    <div className='menu' role='navigation' aria-label='Main menu'>
      {menuButtons.map(button => (
        <button
          key={button.id}
          className='menu-button'
          onClick={() => handleButtonClick(button.id)}
          aria-label={button.label}
          aria-haspopup='dialog'
        >
          <span className='button-icon' aria-hidden='true'>
            {button.icon}
          </span>
          <span className='button-label'>{button.label}</span>
        </button>
      ))}

      <Popup
        isOpen={activePopup === 'connect'}
        onClose={handleClose}
        title='Connect'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <ConnectView onConnect={handleProfileConnect} onCancel={handleClose} />
      </Popup>

      <Popup
        isOpen={activePopup === 'triggers'}
        onClose={handleClose}
        title='Triggers'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <TriggerView triggers={triggers} onChange={setTriggers} />
      </Popup>

      <Popup
        isOpen={activePopup === 'alias'}
        onClose={handleClose}
        title='Aliases'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <AliasView aliases={aliases} onChange={setAliases} />
      </Popup>

      <Popup
        isOpen={activePopup === 'scripts'}
        onClose={handleClose}
        title='Scripts'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <p>Script management coming soon</p>
      </Popup>

      <Popup
        isOpen={activePopup === 'variables'}
        onClose={handleClose}
        title='Variables'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <VariableView />
      </Popup>

      <Popup
        isOpen={activePopup === 'data'}
        onClose={handleClose}
        title='Data Management'
        setActivePopup={setActivePopup}
        activePopup={activePopup}
      >
        <DataView onImport={handleDataImport} />
      </Popup>
    </div>
  );
}
