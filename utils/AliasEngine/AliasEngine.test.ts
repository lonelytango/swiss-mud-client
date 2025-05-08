// Jest test file for aliasEngine
import { expandAlias } from './AliasEngine';
import type { Alias, Variable } from '../../types';

describe('expandAlias', () => {
	const aliases: Alias[] = [
		{
			name: '给物品任务',
			pattern: '^g (.+)$',
			command: 'enter\ngive tianji $1',
		},
		{
			name: '吃饭',
			pattern: '^eat$',
			command: 'get food\neat food',
		},
		{
			name: '多参数',
			pattern: '^foo (\\w+) (\\d+)$',
			command: 'bar $1\nbaz $2',
		},
		{
			name: '等待测试',
			pattern: '^wait$',
			command: 'w\n#wa 2000\ne',
		},
		{
			name: '重复命令',
			pattern: '^repeat$',
			command: '#3 east',
		},
		{
			name: '混合命令',
			pattern: '^mixed$',
			command: 'north\n#wa 1000\n#2 south',
		},
		{
			name: '变量测试',
			pattern: '^use (.+)$',
			command: 'get @item\neat @item',
		},
		{
			name: '多变量测试',
			pattern: '^move$',
			command: 'go @direction\ntake @item\ndrop @item',
		},
		{
			name: '变量和参数混合',
			pattern: '^give (.+)$',
			command: 'get @item\ngive $1 @item',
		},
	];

	const variables: Variable[] = [
		{
			name: 'item',
			value: 'apple',
			description: 'Current item to use',
		},
		{
			name: 'direction',
			value: 'north',
			description: 'Current direction to move',
		},
		{
			name: 'target',
			value: 'tianji',
			description: 'Target NPC',
		},
	];

	it('expands single-argument alias', async () => {
		expect(await expandAlias('g wineskin', aliases)).toEqual([
			{ type: 'command', content: 'enter' },
			{ type: 'command', content: 'give tianji wineskin' },
		]);
	});

	it('expands no-argument alias', async () => {
		expect(await expandAlias('eat', aliases)).toEqual([
			{ type: 'command', content: 'get food' },
			{ type: 'command', content: 'eat food' },
		]);
	});

	it('expands multi-argument alias', async () => {
		expect(await expandAlias('foo apple 42', aliases)).toEqual([
			{ type: 'command', content: 'bar apple' },
			{ type: 'command', content: 'baz 42' },
		]);
	});

	it('handles wait commands', async () => {
		expect(await expandAlias('wait', aliases)).toEqual([
			{ type: 'command', content: 'w' },
			{ type: 'wait', content: '#wa 2000', waitTime: 2000 },
			{ type: 'command', content: 'e' },
		]);
	});

	it('handles multiple command repetitions', async () => {
		expect(await expandAlias('repeat', aliases)).toEqual([
			{ type: 'command', content: 'east' },
			{ type: 'command', content: 'east' },
			{ type: 'command', content: 'east' },
		]);
	});

	it('handles mixed commands with waits and repetitions', async () => {
		expect(await expandAlias('mixed', aliases)).toEqual([
			{ type: 'command', content: 'north' },
			{ type: 'wait', content: '#wa 1000', waitTime: 1000 },
			{ type: 'command', content: 'south' },
			{ type: 'command', content: 'south' },
		]);
	});

	it('returns null for no match', async () => {
		expect(await expandAlias('hello', aliases)).toBeNull();
		expect(await expandAlias('g', aliases)).toBeNull();
		expect(await expandAlias('foo apple', aliases)).toBeNull();
	});

	// Variable substitution tests
	it('substitutes single variable in alias command', async () => {
		expect(await expandAlias('use apple', aliases, variables)).toEqual([
			{ type: 'command', content: 'get apple' },
			{ type: 'command', content: 'eat apple' },
		]);
	});

	it('substitutes multiple variables in alias command', async () => {
		expect(await expandAlias('move', aliases, variables)).toEqual([
			{ type: 'command', content: 'go north' },
			{ type: 'command', content: 'take apple' },
			{ type: 'command', content: 'drop apple' },
		]);
	});

	it('substitutes variables and capture groups together', async () => {
		expect(await expandAlias('give tianji', aliases, variables)).toEqual([
			{ type: 'command', content: 'get apple' },
			{ type: 'command', content: 'give tianji apple' },
		]);
	});

	it('handles variable substitution with no variables provided', async () => {
		expect(await expandAlias('use apple', aliases)).toEqual([
			{ type: 'command', content: 'get @item' },
			{ type: 'command', content: 'eat @item' },
		]);
	});

	it('handles variable substitution with empty variables array', async () => {
		expect(await expandAlias('use apple', aliases, [])).toEqual([
			{ type: 'command', content: 'get @item' },
			{ type: 'command', content: 'eat @item' },
		]);
	});

	it('preserves @ symbol when not followed by a variable name', async () => {
		const aliasesWithAt: Alias[] = [
			{
				name: 'at test',
				pattern: '^at (.+)$',
				command: 'say @$1',
			},
		];
		expect(await expandAlias('at hello', aliasesWithAt, variables)).toEqual([
			{ type: 'command', content: 'say @hello' },
		]);
	});
});
