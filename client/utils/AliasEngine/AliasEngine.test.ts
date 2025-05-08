// Jest test file for aliasEngine
import { expandAlias } from './AliasEngine';
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
	];

	it('expands single-argument alias', () => {
		expect(expandAlias('g wineskin', aliases)).toEqual([
			'enter',
			'give tianji wineskin',
		]);
	});

	it('expands no-argument alias', () => {
		expect(expandAlias('eat', aliases)).toEqual(['get food', 'eat food']);
	});

	it('expands multi-argument alias', () => {
		expect(expandAlias('foo apple 42', aliases)).toEqual([
			'bar apple',
			'baz 42',
		]);
	});

	it('returns null for no match', () => {
		expect(expandAlias('hello', aliases)).toBeNull();
		expect(expandAlias('g', aliases)).toBeNull();
		expect(expandAlias('foo apple', aliases)).toBeNull();
	});
});
