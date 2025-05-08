// Jest test file for aliasEngine
import { expandAlias, Command } from './AliasEngine';
import type { Alias } from '../../types';

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
});
