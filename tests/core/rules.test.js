import { describe, it, expect } from 'vitest';
import { rules2026 } from '../../public/scripts/core/rules/2026.js';
import { rulesByFiscalYear, ACTIVE_FISCAL_YEAR, activeRules } from '../../public/scripts/core/rules/index.js';
import { validateRules } from '../../public/scripts/core/validateRules.js';

describe('rules2026', () => {
	it('RULES-01 holds every required field and passes validation', () => {
		expect(() => validateRules(rules2026)).not.toThrow();
		expect(Object.keys(rules2026).sort()).toEqual(
			[
				'calendarYear',
				'fiscalYear',
				'lastUpdated',
				'legalReference',
				'otherObligations',
				'presumedProfitRates',
				'taxableIncomeLimit',
			].sort()
		);
	});

	it('RULES-06 2026 values: limit, rates, years, date and reference', () => {
		expect(rules2026.taxableIncomeLimit).toBe(35584);
		expect(rules2026.presumedProfitRates).toEqual({ services: 0.32, commerce: 0.08, transport: 0.16 });
		expect(rules2026.calendarYear).toBe(2025);
		expect(rules2026.fiscalYear).toBe(2026);
		expect(rules2026.lastUpdated).toBe('2026-11-09');
		expect(rules2026.legalReference.name).toBe('IN RFB Nº 2.312/2026');
		expect(rules2026.legalReference.url).toBe(
			'https://www.in.gov.br/web/dou/-/instrucao-normativa-rfb-n-2.312-de-13-de-marco-de-2026-692748727'
		);
	});

	it('RULES-07 2026 other obligations are 200000 / 40000 / 177920 / 800000', () => {
		expect(rules2026.otherObligations).toEqual({
			exemptIncome: 200000,
			stockTrading: 40000,
			ruralRevenue: 177920,
			assets: 800000,
		});
	});
});

describe('rules index', () => {
	it('RULES-02 activeRules is the config picked by ACTIVE_FISCAL_YEAR', () => {
		expect(activeRules).toBe(rulesByFiscalYear[ACTIVE_FISCAL_YEAR]);
		expect(activeRules.fiscalYear).toBe(ACTIVE_FISCAL_YEAR);
	});

	it('RULES-02 each key of rulesByFiscalYear equals its config fiscalYear', () => {
		for (const [key, rules] of Object.entries(rulesByFiscalYear)) {
			expect(rules.fiscalYear).toBe(Number(key));
		}
	});

	it('RULES-05 every year config in the repo passes validation', () => {
		const entries = Object.values(rulesByFiscalYear);
		expect(entries.length).toBeGreaterThan(0);
		for (const rules of entries) {
			expect(() => validateRules(rules)).not.toThrow();
		}
	});
});
