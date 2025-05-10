// Jest test file for aliasEngine
import { processAliases } from '../AliasEngine';
import type { Alias, Variable } from '../../types';

describe('processAliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no alias matches', () => {
    const aliases: Alias[] = [
      {
        name: 'test',
        pattern: '^test$',
        command: 'test command',
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('nomatch', aliases, variables);
    expect(result).toBeNull();
  });

  it('should handle simple JavaScript send command', () => {
    const aliases: Alias[] = [
      {
        name: 'test',
        pattern: '^t$',
        command: 'send("test command")',
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('t', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'test command',
    });
  });

  it('should handle JavaScript wait command', () => {
    const aliases: Alias[] = [
      {
        name: 'wait',
        pattern: '^w$',
        command: 'wait(1000)',
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('w', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 1000,
    });
  });

  it('should handle multiple JavaScript commands', () => {
    const aliases: Alias[] = [
      {
        name: 'complex',
        pattern: '^c$',
        command: `
            send("first")
            wait(1000)
            send("second")
        `,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('c', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'first',
    });
    expect(result![1]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 1000,
    });
    expect(result![2]).toEqual({
      type: 'command',
      content: 'second',
    });
  });

  it('should use regex matches in commands', () => {
    const aliases: Alias[] = [
      {
        name: 'wield weapon',
        pattern: '^wa (.+)$',
        command: `
            const item = matches[1]
            send(\`wield \${item}\`)
        `,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('wa sword', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'wield sword',
    });
  });

  it('should handle read-only variables', () => {
    const aliases: Alias[] = [
      {
        name: 'use weapon',
        pattern: '^uw$',
        command: `
            send(\`wield \${weapon}\`)
        `,
      },
    ];

    const variables: Variable[] = [{ name: 'weapon', value: 'sword' }];
    const result = processAliases('uw', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'wield sword',
    });
  });

  it('should handle complex command sequences', () => {
    const aliases: Alias[] = [
      {
        name: 'combat sequence',
        pattern: '^attack (.+)$',
        command: `
            const target = matches[1]
            send(\`wield \${weapon}\`)
            wait(500)
            send(\`cast 'armor' self\`)
            wait(1000)
            send(\`attack \${target}\`)
            wait(500)
            send(\`cast 'fireball' \${target}\`)
        `,
      },
    ];

    const variables: Variable[] = [{ name: 'weapon', value: 'longsword' }];

    const result = processAliases('attack goblin', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(7);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'wield longsword',
    });
    expect(result![1]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 500,
    });
    expect(result![2]).toEqual({
      type: 'command',
      content: `cast 'armor' self`,
    });
    expect(result![3]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 1000,
    });
    expect(result![4]).toEqual({
      type: 'command',
      content: 'attack goblin',
    });
    expect(result![5]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 500,
    });
    expect(result![6]).toEqual({
      type: 'command',
      content: `cast 'fireball' goblin`,
    });
  });

  it('should handle empty lines and whitespace', () => {
    const aliases: Alias[] = [
      {
        name: 'whitespace',
        pattern: '^w$',
        command: `
            send("first")
            
            send("second")
            
            
            wait(1000)
        `,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('w', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'first',
    });
    expect(result![1]).toEqual({
      type: 'command',
      content: 'second',
    });
    expect(result![2]).toEqual({
      type: 'wait',
      content: '',
      waitTime: 1000,
    });
  });

  it('should not handle undefined variables', () => {
    const aliases: Alias[] = [
      {
        name: 'undefined var',
        pattern: '^uv$',
        command: `
            send(\`wield \${nonexistent}\`)
        `,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('uv', aliases, variables);

    expect(result).toBeNull();
  });

  it('should handle conditional logic in alias commands', () => {
    const aliases: Alias[] = [
      {
        name: 'conditional',
        pattern: '^cond (.+)$',
        command: `
            const target = matches[1]
            if (target === 'dragon') {
              send('flee')
            } else {
              send(\`attack \${target}\`)
            }
        `,
      },
    ];

    const variables: Variable[] = [];

    // Test the "if" branch
    let result = processAliases('cond dragon', aliases, variables);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'flee',
    });

    // Test the "else" branch
    result = processAliases('cond goblin', aliases, variables);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'attack goblin',
    });
  });

  it('should handle multiple commands on the same line', () => {
    const aliases: Alias[] = [
      {
        name: 'multi-command',
        pattern: '^mc$',
        command: `
					send("north, east, south, west")
				`,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('mc', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
    expect(result![0]).toEqual({ type: 'command', content: 'north' });
    expect(result![1]).toEqual({ type: 'command', content: 'east' });
    expect(result![2]).toEqual({ type: 'command', content: 'south' });
    expect(result![3]).toEqual({ type: 'command', content: 'west' });
  });

  it('should handle multiple commands with variables', () => {
    const aliases: Alias[] = [
      {
        name: 'multi-command with vars',
        pattern: '^mcv$',
        command: `
					send(\`wield \${weapon}, attack \${target}, cast 'fireball' \${target}\`)
				`,
      },
    ];

    const variables: Variable[] = [
      { name: 'weapon', value: 'sword' },
      { name: 'target', value: 'goblin' },
    ];
    const result = processAliases('mcv', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toEqual({ type: 'command', content: 'wield sword' });
    expect(result![1]).toEqual({ type: 'command', content: 'attack goblin' });
    expect(result![2]).toEqual({
      type: 'command',
      content: "cast 'fireball' goblin",
    });
  });

  it('should handle multiple commands with mixed types', () => {
    const aliases: Alias[] = [
      {
        name: 'mixed commands',
        pattern: '^mix$',
        command: `
					send("north, east")
					wait(500)
					send("south, west, climb up")
				`,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('mix', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(6);
    expect(result![0]).toEqual({ type: 'command', content: 'north' });
    expect(result![1]).toEqual({ type: 'command', content: 'east' });
    expect(result![2]).toEqual({ type: 'wait', content: '', waitTime: 500 });
    expect(result![3]).toEqual({ type: 'command', content: 'south' });
    expect(result![4]).toEqual({ type: 'command', content: 'west' });
    expect(result![5]).toEqual({ type: 'command', content: 'climb up' });
  });

  it('should handle empty commands in comma-separated list', () => {
    const aliases: Alias[] = [
      {
        name: 'empty commands',
        pattern: '^ec$',
        command: `
					send("north, , east, , south")
				`,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('ec', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toEqual({ type: 'command', content: 'north' });
    expect(result![1]).toEqual({ type: 'command', content: 'east' });
    expect(result![2]).toEqual({ type: 'command', content: 'south' });
  });

  it('should handle whitespace in comma-separated commands', () => {
    const aliases: Alias[] = [
      {
        name: 'whitespace commands',
        pattern: '^wc$',
        command: `
					send("north , east , south , west")
				`,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('wc', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
    expect(result![0]).toEqual({ type: 'command', content: 'north' });
    expect(result![1]).toEqual({ type: 'command', content: 'east' });
    expect(result![2]).toEqual({ type: 'command', content: 'south' });
    expect(result![3]).toEqual({ type: 'command', content: 'west' });
  });

  describe('speedwalk', () => {
    it('should handle basic directional commands', () => {
      const aliases: Alias[] = [
        {
          name: 'speedwalk test',
          pattern: '^sw$',
          command: `
                    speedwalk("e,w,eu,ne")
                `,
        },
      ];

      const variables: Variable[] = [];
      const result = processAliases('sw', aliases, variables);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(4);
      expect(result![0]).toEqual({ type: 'command', content: 'east' });
      expect(result![1]).toEqual({ type: 'command', content: 'west' });
      expect(result![2]).toEqual({ type: 'command', content: 'eastup' });
      expect(result![3]).toEqual({ type: 'command', content: 'northeast' });
    });

    it('should handle repeated directional commands', () => {
      const aliases: Alias[] = [
        {
          name: 'speedwalk repeat test',
          pattern: '^swr$',
          command: `
                    speedwalk("2e,w,eastup,2northeast,climb up")
                `,
        },
      ];

      const variables: Variable[] = [];
      const result = processAliases('swr', aliases, variables);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(7);
      expect(result![0]).toEqual({ type: 'command', content: 'east' });
      expect(result![1]).toEqual({ type: 'command', content: 'east' });
      expect(result![2]).toEqual({ type: 'command', content: 'west' });
      expect(result![3]).toEqual({ type: 'command', content: 'eastup' });
      expect(result![4]).toEqual({ type: 'command', content: 'northeast' });
      expect(result![5]).toEqual({ type: 'command', content: 'northeast' });
      expect(result![6]).toEqual({ type: 'command', content: 'climb up' });
    });

    it('should handle custom directional commands', () => {
      const aliases: Alias[] = [
        {
          name: 'speedwalk custom test',
          pattern: '^swc$',
          command: `
                    speedwalk("2e,climb ladder,jump down")
                `,
        },
      ];

      const variables: Variable[] = [];
      const result = processAliases('swc', aliases, variables);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(4);
      expect(result![0]).toEqual({ type: 'command', content: 'east' });
      expect(result![1]).toEqual({ type: 'command', content: 'east' });
      expect(result![2]).toEqual({ type: 'command', content: 'climb ladder' });
      expect(result![3]).toEqual({ type: 'command', content: 'jump down' });
    });
  });

  it('should track last line in _line variable', () => {
    const aliases: Alias[] = [
      {
        name: 'check last line',
        pattern: '^cl$',
        command: `
					send(\`echo Last line was: \${_line}\`)
				`,
      },
    ];

    const variables: Variable[] = [
      { name: '_line', value: 'A goblin appears!' },
    ];
    const result = processAliases('cl', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'echo Last line was: A goblin appears!',
    });
  });

  it('should handle undefined _line variable', () => {
    const aliases: Alias[] = [
      {
        name: 'check undefined line',
        pattern: '^cul$',
        command: `
					send(\`echo Last line was: \${_line}\`)
				`,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('cul', aliases, variables);

    expect(result).toBeNull(); // Should return null when _line is undefined
  });
});
