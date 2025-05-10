import { processTriggers } from '../TriggerEngine';
import type { Trigger } from '../../types';

describe('processTriggers', () => {
	const mockSend = jest.fn();
	const mockTriggers: Trigger[] = [
		{
			name: 'Kick on Say',
			pattern: '^你说道：(.+)?$',
			command: 'kick $1',
		},
		{
			name: 'Multiple Groups',
			pattern: '^(.+) says: (.+)$',
			command: 'tell $1 $2',
		},
		{
			name: 'No Capture Groups',
			pattern: '^You are hungry$',
			command: 'eat bread',
		},
	];

	beforeEach(() => {
		mockSend.mockClear();
	});

	it('should process a line matching a trigger with one capture group', () => {
		const result = processTriggers('你说道：hello', mockTriggers, mockSend);
		expect(result).toEqual([
			{
				type: 'command',
				content: 'kick hello',
			},
		]);
	});

	it('should process a line matching a trigger with multiple capture groups', () => {
		const result = processTriggers(
			'John says: How are you?',
			mockTriggers,
			mockSend
		);
		expect(result).toEqual([
			{
				type: 'command',
				content: 'tell John How are you?',
			},
		]);
	});

	it('should process a line matching a trigger with no capture groups', () => {
		const result = processTriggers('You are hungry', mockTriggers, mockSend);
		expect(result).toEqual([
			{
				type: 'command',
				content: 'eat bread',
			},
		]);
	});

	it('should not process a line that does not match any trigger', () => {
		const result = processTriggers('Some random text', mockTriggers, mockSend);
		expect(result).toBeNull();
	});

	it('should handle empty capture groups', () => {
		const result = processTriggers('你说道：', mockTriggers, mockSend);
		expect(result).toEqual([
			{
				type: 'command',
				content: 'kick ',
			},
		]);
	});

	it('should handle invalid regex patterns gracefully', () => {
		const invalidTrigger: Trigger = {
			name: 'Invalid Pattern',
			pattern: '[', // Invalid regex pattern
			command: 'command $1',
		};

		expect(() => {
			processTriggers('test', [invalidTrigger], mockSend);
		}).not.toThrow();
	});

	it('should handle special characters in patterns and commands', () => {
		const specialCharTrigger: Trigger = {
			name: 'Special Characters',
			pattern: '^\\$(.+)\\$$',
			command: 'echo $1',
		};

		const result = processTriggers('$test$', [specialCharTrigger], mockSend);
		expect(result).toEqual([
			{
				type: 'command',
				content: 'echo test',
			},
		]);
	});

	it('should execute JavaScript commands with send function', () => {
		const jsTrigger: Trigger = {
			name: 'JavaScript Command',
			pattern: '^test (.+)$',
			command: 'const words = matches[1]?.trim(); send(`echo ${words}`);',
		};

		processTriggers('test hello', [jsTrigger], mockSend);
		expect(mockSend).toHaveBeenCalledWith('echo hello');
	});
});
