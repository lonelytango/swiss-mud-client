import React, { useEffect, useRef, useState } from 'react';
import { Menu } from './components/Menu';
import type { MudProfile } from './components/ConnectView';
import './App.css';
import classNames from 'classnames';
import { CommandEngine } from './engines/CommandEngine';
import { WebSocketManager } from './managers/WebSocketManager';
import { Alias, Trigger } from './types';
import { handleCommandInput } from './utils/CommandHandler';
import { setWebSocketManager, send } from './utils/CommandAction';
import { useVariables } from './contexts/VariablesContext';
import { stripHtmlTags } from './utils/TextUtils';

  let messageCounter = 0;

  function App() {
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState('Disconnected');
    const [selectedProfile, setSelectedProfile] = useState<MudProfile | null>(
      null
    );
    const [canSend, setCanSend] = useState(false);
    const [aliases, setAliases] = useState<Alias[]>([]);
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const { variables, setVariables } = useVariables();
    const [commandEngine, setCommandEngine] = useState<CommandEngine | null>(
      null
    );
    const [wsManager, setWsManager] = useState<WebSocketManager | null>(null);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [messages, setMessages] = useState<string[]>([]);
    const [isLockedToBottom, setIsLockedToBottom] = useState(true);

    // For Triggering Commands
    const [line, setLine] = useState<string>('');

    useEffect(() => {
      const storedAliases = localStorage.getItem('mud_aliases');
      const storedTriggers = localStorage.getItem('mud_triggers');
      let parsedAliases: Alias[] = [];
      let parsedTriggers: Trigger[] = [];

      if (storedAliases) {
        try {
          parsedAliases = JSON.parse(storedAliases);
          setAliases(parsedAliases);
        } catch (e) {
          console.error('Failed to parse aliases:', e);
        }
      }

      if (storedTriggers) {
        try {
          parsedTriggers = JSON.parse(storedTriggers);
          setTriggers(parsedTriggers);
        } catch (e) {
          console.error('Failed to parse triggers:', e);
        }
      }

      setCommandEngine(
        new CommandEngine(parsedAliases, variables, parsedTriggers, {
          onCommandSend: (command: string) => {
            // Add command to output (visual feedback for user)
            setMessages(prev => {
              const next = [
                ...prev,
                `<div class="user-cmd">&gt; ${command}</div>`,
              ];
              return next.length > 1000 ? next.slice(-1000) : next;
            });

            // Send the command to the MUD server through the commands.ts send function
            // instead of directly using the WebSocketManager here
            // This ensures consistent behavior whether commands come from aliases or direct input
            send(command);
          },
          onVariableSet: (name: string, value: string) => {
            setVariables(prev => {
              // Check if variable already exists
              const existingIndex = prev.findIndex(v => v.name === name);
              if (existingIndex >= 0) {
                // Update existing variable
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], value };
                return updated;
              } else {
                // Add new variable
                return [...prev, { name, value, description: '' }];
              }
            });
          },
        })
      );
    }, [wsManager, variables]);

    // Update the CommandEngine when aliases change
    useEffect(() => {
      if (commandEngine) {
        commandEngine.setAliases(aliases);
      }
    }, [aliases]);

    // Update the CommandEngine when variables change
    useEffect(() => {
      if (commandEngine) {
        commandEngine.setVariables(variables);
      }
    }, [variables]);

    // Update the CommandEngine when triggers change
    useEffect(() => {
      if (commandEngine) {
        commandEngine.setTriggers(triggers);
      }
    }, [triggers]);

    // Process incoming line with triggers
    useEffect(() => {
      console.debug(`${messageCounter} - Line: ${line}`);
      if (line && commandEngine) {
        commandEngine.processLine(line);
      }
    }, [line]);

    // Setup WebSocket connection when a profile is selected
    useEffect(() => {
      if (!selectedProfile) return;

      const manager = new WebSocketManager({
        onOpen: () => {
          setStatus('Connected');
          setCanSend(false);
          inputRef.current?.focus();
        },
        onClose: () => {
          setStatus('Disconnected');
          setCanSend(false);
        },
        onError: () => setStatus('Error occurred'),
        onMessage: (data: string) => {
          setMessages(prev => {
            const next = [...prev, data];
            return next.length > 1000 ? next.slice(-1000) : next;
          });

          const msgData = stripHtmlTags(data);
          messageCounter = messageCounter + 1;
          console.debug(`Counter: ${messageCounter}`);
          setLine(msgData);
        },
        onConnected: () => setCanSend(true),
      });

      manager.connect(selectedProfile);
      setWsManager(manager);

      // Set the WebSocketManager in commands.ts
      setWebSocketManager(manager);

      return () => {
        manager.disconnect();
      };
    }, [selectedProfile]);

    // Handle scrolling behavior
    const handleOutputScroll = () => {
      if (!outputRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = outputRef.current;

      // If the user is within 20px of the bottom, consider it locked
      if (scrollHeight - scrollTop - clientHeight < 300) {
        setIsLockedToBottom(true);
      } else {
        setIsLockedToBottom(false);
      }
    };

    // Auto-scroll to bottom when messages update (if locked)
    useEffect(() => {
      if (isLockedToBottom && outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, [messages, isLockedToBottom]);

    // Handle keyboard input
    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!commandEngine || !wsManager) return;

      handleCommandInput(e, {
        commandEngine,
        wsManager,
        canSend,
        onCommandHistoryUpdate: command => {
          setCommandHistory(prev => [command, ...prev]);
        },
        onHistoryIndexUpdate: setHistoryIndex,
        historyIndex,
        commandHistory,
      });

      // After handling the command, re-focus/select the input if Enter was pressed
      if (e.key === 'Enter') {
        setTimeout(() => {
          inputRef.current?.select();

          // Snap to bottom when Enter is pressed
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }, 0);
      }
    };

    return (
      <div className='main'>
        <Menu
          onProfileConnect={setSelectedProfile}
          aliases={aliases}
          setAliases={setAliases}
          triggers={triggers}
          setTriggers={setTriggers}
        />
        <div
          className={classNames('status', {
            connected: status === 'Connected',
          })}
        >
          {selectedProfile
            ? `${status} (${selectedProfile.name})`
            : 'No profile selected'}
        </div>
        <div className='container'>
          <div
            ref={outputRef}
            className='output'
            onClick={() => inputRef.current?.focus()}
            onScroll={handleOutputScroll}
          >
            {messages.map((msg, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
            ))}
          </div>
          <input
            ref={inputRef}
            type='text'
            className='input'
            placeholder='Type your command here...'
            onKeyDown={handleKeyDown}
            disabled={!canSend}
          />
        </div>
      </div>
    );
  }

export default App;
