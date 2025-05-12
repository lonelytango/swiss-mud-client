export interface Alias {
  name: string;
  pattern: string; // regex string
  command: string; // multi-line, can use $1, $2, ... for capture groups
  enabled: boolean; // whether this alias is enabled
}

export interface Trigger {
  name: string;
  pattern: string; // regex string
  command: string; // multi-line, can use $1, $2, ... for capture groups
  enabled: boolean; // whether this trigger is enabled
}

export interface Variable {
  name: string;
  value: string;
}

export interface Command {
	type: 'command' | 'wait';
	content: string;
	waitTime?: number;
}

export interface Settings {
  highlightInputOnCommand: boolean;
  showCommandInOutput: boolean;
}
