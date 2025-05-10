export interface Alias {
	name: string;
	pattern: string; // regex string
	command: string; // multi-line, can use $1, $2, ... for capture groups
}

export interface Trigger {
	name: string;
	pattern: string; // regex string
	command: string; // multi-line, can use $1, $2, ... for capture groups
}

export interface Variable {
	name: string;
	value: string;
	description?: string;
}

export interface Command {
	type: 'command' | 'wait';
	content: string;
	waitTime?: number;
}