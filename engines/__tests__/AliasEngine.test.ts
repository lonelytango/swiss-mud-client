// Jest test file for aliasEngine
import { processAliases } from '../PatternEngine';
import type { Alias, Variable } from '../../types';

describe('processAliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if no alias matches', () => {
    const aliases: Alias[] = [
      { name: 'foo', pattern: '^foo$', command: 'send("bar")', enabled: true },
    ];
    expect(processAliases('baz', aliases, [])).toBeNull();
  });

  it('captures a simple send command', () => {
    const aliases: Alias[] = [
      { name: 'foo', pattern: '^foo$', command: 'send("bar")', enabled: true },
    ];
    expect(processAliases('foo', aliases, [])).toEqual([
      { type: 'command', content: 'bar' },
    ]);
  });

  it('captures multiple commands with sendAll', () => {
    const aliases: Alias[] = [
      {
        name: 'multi',
        pattern: '^multi$',
        command: 'sendAll("a", "b", "c")',
        enabled: true,
      },
    ];
    expect(processAliases('multi', aliases, [])).toEqual([
      { type: 'command', content: 'a' },
      { type: 'command', content: 'b' },
      { type: 'command', content: 'c' },
    ]);
  });

  it('captures wait commands', () => {
    const aliases: Alias[] = [
      { name: 'wait', pattern: '^wait$', command: 'wait(500)', enabled: true },
    ];
    expect(processAliases('wait', aliases, [])).toEqual([
      { type: 'wait', content: '', waitTime: 500 },
    ]);
  });

  it('captures speedwalk commands', () => {
    const aliases: Alias[] = [
      {
        name: 'sw',
        pattern: '^sw$',
        command: 'speedwalk("n,e,s,w")',
        enabled: true,
      },
    ];
    expect(processAliases('sw', aliases, [])).toEqual([
      { type: 'command', content: 'north' },
      { type: 'command', content: 'east' },
      { type: 'command', content: 'south' },
      { type: 'command', content: 'west' },
    ]);
  });

  it('uses regex matches in commands', () => {
    const aliases: Alias[] = [
      {
        name: 'say',
        pattern: '^say (.+)$',
        command: 'send(`say ${matches[1]}`)',
        enabled: true,
      },
    ];
    expect(processAliases('say hello', aliases, [])).toEqual([
      { type: 'command', content: 'say hello' },
    ]);
  });

  it('uses variables in commands', () => {
    const aliases: Alias[] = [
      {
        name: 'use',
        pattern: '^use$',
        command: 'send(`use ${item}`)',
        enabled: true,
      },
    ];
    const variables: Variable[] = [{ name: 'item', value: 'sword' }];
    expect(processAliases('use', aliases, variables)).toEqual([
      { type: 'command', content: 'use sword' },
    ]);
  });

  it('sets variables', () => {
    const aliases: Alias[] = [
      {
        name: 'set',
        pattern: '^set (.+)$',
        command: 'setVariable("foo", matches[1])',
        enabled: true,
      },
    ];
    const mockSetVariable = jest.fn();
    processAliases('set bar', aliases, [], mockSetVariable);
    expect(mockSetVariable).toHaveBeenCalledWith('foo', 'bar');
  });

  it('returns null on error', () => {
    const aliases: Alias[] = [
      {
        name: 'err',
        pattern: '^err$',
        command: 'throw new Error("fail")',
        enabled: true,
      },
    ];
    expect(processAliases('err', aliases, [])).toBeNull();
  });

  it('should handle simple JavaScript send command', () => {
    const aliases: Alias[] = [
      {
        name: 'test',
        pattern: '^t$',
        command: 'send("test command")',
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
					sendAll("north", "east", "south", "west")
				`,
        enabled: true,
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
					sendAll(\`wield \${weapon}\`, \`attack \${target}\`, \`cast 'fireball' \${target}\`)
				`,
        enabled: true,
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
					sendAll("north", "east")
					wait(500)
					sendAll("south", "west", "climb up")
				`,
        enabled: true,
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
					sendAll("north", "", "east", "", "south")
				`,
        enabled: true,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('ec', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(5);
    expect(result![0]).toEqual({ type: 'command', content: 'north' });
    expect(result![1]).toEqual({ type: 'command', content: '' });
    expect(result![2]).toEqual({ type: 'command', content: 'east' });
    expect(result![3]).toEqual({ type: 'command', content: '' });
    expect(result![4]).toEqual({ type: 'command', content: 'south' });
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
          enabled: true,
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
          enabled: true,
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
          enabled: true,
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

  it('should track last line in line variable', () => {
    const aliases: Alias[] = [
      {
        name: 'check last line',
        pattern: '^cl$',
        command: `
					send(\`echo Last line was: \${line}\`)
				`,
        enabled: true,
      },
    ];

    const variables: Variable[] = [
      { name: 'line', value: 'A goblin appears!' },
    ];
    const result = processAliases('cl', aliases, variables);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      type: 'command',
      content: 'echo Last line was: A goblin appears!',
    });
  });

  it('should handle undefined line variable', () => {
    const aliases: Alias[] = [
      {
        name: 'check undefined line',
        pattern: '^cul$',
        command: `
					send(\`echo Last line was: \${line}\`)
				`,
        enabled: true,
      },
    ];

    const variables: Variable[] = [];
    const result = processAliases('cul', aliases, variables);

    expect(result).toBeNull(); // Should return null when line is undefined
  });

  describe('variable setting', () => {
    it('should set variables from alias commands', () => {
      const aliases: Alias[] = [
        {
          name: 'set variable',
          pattern: '^sv (.+) (.+)$',
          command: `
            setVariable(matches[1], matches[2])
            send(\`echo Set \${matches[1]} to \${matches[2]}\`)
          `,
          enabled: true,
        },
      ];

      const variables: Variable[] = [];
      const mockSetVariable = jest.fn();
      const result = processAliases(
        'sv weapon sword',
        aliases,
        variables,
        mockSetVariable
      );

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        type: 'command',
        content: 'echo Set weapon to sword',
      });
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'sword');
    });

    it('should handle setting multiple variables with fixed values', () => {
      const aliases: Alias[] = [
        {
          name: 'set fixed variables',
          pattern: '^tjcx$',
          command: `
            setVariable('treeDirection', "北")
            setVariable('destination', 'hello')
          `,
          enabled: true,
        },
      ];

      const variables: Variable[] = [];
      const mockSetVariable = jest.fn();
      const result = processAliases(
        'tjcx',
        aliases,
        variables,
        mockSetVariable
      );

      expect(result).toBeNull();
      expect(mockSetVariable).toHaveBeenCalledWith('treeDirection', '北');
      expect(mockSetVariable).toHaveBeenCalledWith('destination', 'hello');
    });

    it('should handle multiple variable sets in one alias', () => {
      const aliases: Alias[] = [
        {
          name: 'set multiple variables',
          pattern: '^smv$',
          command: `
            setVariable('weapon', 'sword')
            setVariable('armor', 'plate')
            send('echo Variables set')
          `,
          enabled: true,
        },
      ];

      const variables: Variable[] = [];
      const mockSetVariable = jest.fn();
      const result = processAliases('smv', aliases, variables, mockSetVariable);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        type: 'command',
        content: 'echo Variables set',
      });
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'sword');
      expect(mockSetVariable).toHaveBeenCalledWith('armor', 'plate');
    });

    it('should handle variable setting with conditional logic', () => {
      const aliases: Alias[] = [
        {
          name: 'conditional variable set',
          pattern: '^cvs (.+)$',
          command: `
            const target = matches[1]
            if (target === 'dragon') {
              setVariable('weapon', 'dragonbane')
            } else {
              setVariable('weapon', 'sword')
            }
            send(\`echo Set weapon for \${target}\`)
          `,
          enabled: true,
        },
      ];

      const variables: Variable[] = [];
      const mockSetVariable = jest.fn();

      // Test dragon case
      let result = processAliases(
        'cvs dragon',
        aliases,
        variables,
        mockSetVariable
      );
      expect(result).not.toBeNull();
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'dragonbane');

      mockSetVariable.mockClear();

      // Test non-dragon case
      result = processAliases(
        'cvs goblin',
        aliases,
        variables,
        mockSetVariable
      );
      expect(result).not.toBeNull();
      expect(mockSetVariable).toHaveBeenCalledWith('weapon', 'sword');
    });
  });
});
