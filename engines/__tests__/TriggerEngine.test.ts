import { processTriggers } from '../TriggerEngine';
import type { Trigger } from '../../types';

describe('processTriggers', () => {
	const mockSend = jest.fn();
	const mockTriggers: Trigger[] = [
    {
      name: 'Kick on Say',
      pattern: '^你说道：(.+)?$',
      command: 'kick $1',
      enabled: true,
    },
    {
      name: 'Multiple Groups',
      pattern: '^(.+) says: (.+)$',
      command: 'tell $1 $2',
      enabled: true,
    },
    {
      name: 'No Capture Groups',
      pattern: '^You are hungry$',
      command: 'eat bread',
      enabled: true,
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
      enabled: true,
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
      enabled: true,
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
      enabled: true,
    };

    processTriggers('test hello', [jsTrigger], mockSend);
    expect(mockSend).toHaveBeenCalledWith('echo hello');
  });

  describe('variable setting', () => {
    it('should set variables from trigger commands', () => {
      const jsTrigger: Trigger = {
        name: 'Set Variable',
        pattern: '^You see (.+)$',
        command:
          'setVariable("target", matches[1]); send(`echo Target set to ${matches[1]}`);',
        enabled: true,
      };

      const mockSetVariable = jest.fn();
      processTriggers(
        'You see a goblin',
        [jsTrigger],
        mockSend,
        mockSetVariable
      );

      expect(mockSetVariable).toHaveBeenCalledWith('target', 'a goblin');
      expect(mockSend).toHaveBeenCalledWith('echo Target set to a goblin');
    });

    it('should handle multiple variable sets in one trigger', () => {
      const jsTrigger: Trigger = {
        name: 'Set Multiple Variables',
        pattern: '^You are (.+) and (.+)$',
        command: `
					setVariable("status1", matches[1]);
					setVariable("status2", matches[2]);
					send(\`echo Status: \${matches[1]} and \${matches[2]}\`);
				`,
        enabled: true,
      };

      const mockSetVariable = jest.fn();
      processTriggers(
        'You are hungry and thirsty',
        [jsTrigger],
        mockSend,
        mockSetVariable
      );

      expect(mockSetVariable).toHaveBeenCalledWith('status1', 'hungry');
      expect(mockSetVariable).toHaveBeenCalledWith('status2', 'thirsty');
      expect(mockSend).toHaveBeenCalledWith('echo Status: hungry and thirsty');
    });

    it('should handle conditional variable setting in triggers', () => {
      const jsTrigger: Trigger = {
        name: 'Conditional Variable Set',
        pattern: '^(.+) appears!$',
        command: `
					const enemy = matches[1];
					if (enemy.includes('dragon')) {
						setVariable('weapon', 'dragonbane');
					} else {
						setVariable('weapon', 'sword');
					}
					send(\`echo Preparing for \${enemy}\`);
				`,
        enabled: true,
      };

      const mockSetVariable = jest.fn();

      // Test dragon case
      processTriggers(
        'A red dragon appears!',
        [jsTrigger],
        mockSend,
        mockSetVariable
      );
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'dragonbane');

      mockSetVariable.mockClear();
      mockSend.mockClear();

      // Test non-dragon case
      processTriggers(
        'A goblin appears!',
        [jsTrigger],
        mockSend,
        mockSetVariable
      );
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'sword');
    });
  });
});
