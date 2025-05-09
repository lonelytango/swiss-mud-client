// Jest test file for aliasEngine
import { expandAlias } from './AliasEngine';
import type { Alias, Variable } from '../../types';

describe('expandAlias', () => {
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
		const result = expandAlias('nomatch', aliases, variables);
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
		const result = expandAlias('t', aliases, variables);

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
		const result = expandAlias('w', aliases, variables);

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
		const result = expandAlias('c', aliases, variables);

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
		const result = expandAlias('wa sword', aliases, variables);

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
            send(\`wield \${_weapon}\`)
        `,
			},
		];

		const variables: Variable[] = [{ name: '_weapon', value: 'sword' }];
		const result = expandAlias('uw', aliases, variables);

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
            send(\`wield \${_weapon}\`)
            wait(500)
            send(\`cast 'armor' self\`)
            wait(1000)
            send(\`attack \${target}\`)
            wait(500)
            send(\`cast 'fireball' \${target}\`)
        `,
			},
		];

		const variables: Variable[] = [{ name: '_weapon', value: 'longsword' }];

		const result = expandAlias('attack goblin', aliases, variables);

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
		const result = expandAlias('w', aliases, variables);

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
            send(\`wield \${_nonexistent || 'default sword'}\`)
        `,
			},
		];

		const variables: Variable[] = [];
		const result = expandAlias('uv', aliases, variables);

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
		let result = expandAlias('cond dragon', aliases, variables);
		expect(result).not.toBeNull();
		expect(result).toHaveLength(1);
		expect(result![0]).toEqual({
			type: 'command',
			content: 'flee',
		});

		// Test the "else" branch
		result = expandAlias('cond goblin', aliases, variables);
		expect(result).not.toBeNull();
		expect(result).toHaveLength(1);
		expect(result![0]).toEqual({
			type: 'command',
			content: 'attack goblin',
		});
	});

	// ... existing code ...

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
			const result = expandAlias('sw', aliases, variables);

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
			const result = expandAlias('swr', aliases, variables);

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
			const result = expandAlias('swc', aliases, variables);

			expect(result).not.toBeNull();
			expect(result).toHaveLength(4);
			expect(result![0]).toEqual({ type: 'command', content: 'east' });
			expect(result![1]).toEqual({ type: 'command', content: 'east' });
			expect(result![2]).toEqual({ type: 'command', content: 'climb ladder' });
			expect(result![3]).toEqual({ type: 'command', content: 'jump down' });
		});
	});
});
