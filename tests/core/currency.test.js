import { describe, it, expect } from 'vitest';
import {
	parseBRL,
	maskBRL,
	formatBRL,
	formatNumber,
	formatLimit,
	formatRate,
} from '../../public/scripts/core/currency.js';

describe('parseBRL', () => {
	it('CALC-07 "R$ 1.234,56" reads as 1234.56', () => {
		expect(parseBRL('R$ 1.234,56')).toBe(1234.56);
	});
	it('CALC-07 empty string reads as 0', () => {
		expect(parseBRL('')).toBe(0);
	});
	it('CALC-07 letters and symbols are ignored', () => {
		expect(parseBRL('abc')).toBe(0);
		expect(parseBRL('a1b2c3!')).toBe(1.23);
	});
});

describe('maskBRL', () => {
	it('CALC-08 "12345" masks as "R$ 123,45"', () => {
		expect(maskBRL('12345')).toBe('R$ 123,45');
	});
	it('CALC-08 masking an already masked value is stable', () => {
		expect(maskBRL('R$ 123,45')).toBe('R$ 123,45');
	});
	it('CALC-08 empty string masks as zero', () => {
		expect(maskBRL('')).toBe('R$ 0,00');
	});
	it('CALC-08 a large value is grouped', () => {
		expect(maskBRL('99999999999')).toBe('R$ 999.999.999,99');
	});
});

describe('formatters', () => {
	it('CALC-08 formatBRL formats 999999999.99 as currency', () => {
		expect(formatBRL(999999999.99)).toBe('R$ 999.999.999,99');
	});
	it('CALC-08 formatNumber formats a plain pt-BR number', () => {
		expect(formatNumber(1234.5)).toBe('1.234,5');
		expect(formatNumber(-4000)).toBe('-4.000');
	});
	it('CALC-08 formatLimit(35584) is "R$ 35.584,00" with a regular space', () => {
		expect(formatLimit(35584)).toBe('R$ 35.584,00');
	});
	it('CALC-08 formatRate(0.32) is 32% and "0,32"', () => {
		expect(formatRate(0.32)).toEqual({ percent: '32%', decimal: '0,32' });
		expect(formatRate(0.08)).toEqual({ percent: '8%', decimal: '0,08' });
		expect(formatRate(0.16)).toEqual({ percent: '16%', decimal: '0,16' });
	});
});
