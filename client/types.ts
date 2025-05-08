export interface Alias {
	name: string;
	pattern: string; // regex string
	command: string; // multi-line, can use $1, $2, ... for capture groups
}
