import { describe, it, expect } from 'vitest';
import { validateRules } from '../../public/scripts/core/validateRules.js';

function validConfig() {
	return {
		fiscalYear: 2026,
		calendarYear: 2025,
		taxableIncomeLimit: 35584,
		presumedProfitRates: { services: 0.32, commerce: 0.08, transport: 0.16 },
		lastUpdated: '2026-11-09',
		legalReference: { name: 'IN RFB Nº 2.312/2026', url: 'https://example.com/in' },
		otherObligations: { exemptIncome: 200000, stockTrading: 40000, ruralRevenue: 177920, assets: 800000 },
	};
}

describe('validateRules', () => {
	it('RULES-04 a valid config passes', () => {
		expect(() => validateRules(validConfig())).not.toThrow();
	});

	it('RULES-04 a missing field throws naming it', () => {
		const config = /** @type {Record<string, unknown>} */ (validConfig());
		delete config.calendarYear;
		expect(() => validateRules(config)).toThrow(/calendarYear/);
	});

	it('RULES-04 a wrongly typed field throws naming it', () => {
		const config = { ...validConfig(), lastUpdated: 20261109 };
		expect(() => validateRules(config)).toThrow(/lastUpdated/);
	});

	it('RULES-04 a rate of 1.5 throws naming the rate', () => {
		const config = validConfig();
		config.presumedProfitRates.services = 1.5;
		expect(() => validateRules(config)).toThrow(/presumedProfitRates\.services/);
	});

	it('RULES-04 a rate of -0.1 throws naming the rate', () => {
		const config = validConfig();
		config.presumedProfitRates.commerce = -0.1;
		expect(() => validateRules(config)).toThrow(/presumedProfitRates\.commerce/);
	});

	it('RULES-04 a limit of 0 throws naming the limit', () => {
		const config = { ...validConfig(), taxableIncomeLimit: 0 };
		expect(() => validateRules(config)).toThrow(/taxableIncomeLimit/);
	});

	it('RULES-04 a missing otherObligations.assets throws naming it', () => {
		const config = validConfig();
		const other = /** @type {Record<string, unknown>} */ (config.otherObligations);
		delete other.assets;
		expect(() => validateRules(config)).toThrow(/otherObligations\.assets/);
	});

	it('RULES-04 a non-object config throws', () => {
		expect(() => validateRules(null)).toThrow(/^invalid rules: rules must be an object$/);
		expect(() => validateRules('2026')).toThrow(/^invalid rules: rules must be an object$/);
	});
});

describe('validateRules lastUpdated', () => {
	for (const bad of ['09/11/2026', '2026-11-9', '2026-13-01', '2026-02-30', '']) {
		it(`RULES-08 lastUpdated "${bad}" throws naming lastUpdated`, () => {
			const config = { ...validConfig(), lastUpdated: bad };
			expect(() => validateRules(config)).toThrow(/^invalid rules: lastUpdated must be an ISO date \(YYYY-MM-DD\)$/);
		});
	}

	it('RULES-08 an ISO lastUpdated such as 2026-11-09 passes', () => {
		expect(() => validateRules({ ...validConfig(), lastUpdated: '2026-11-09' })).not.toThrow();
	});
});
