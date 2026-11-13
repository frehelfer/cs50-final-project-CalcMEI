import { describe, it, expect } from 'vitest';
import { calculateIrpf } from '../../public/scripts/core/calculate.js';
import { rules2026 } from '../../public/scripts/core/rules/2026.js';

/** @param {Partial<import('../../public/scripts/core/types.js').Inputs>} values */
function inputs(values) {
	return { services: 0, commerce: 0, transport: 0, expenses: 0, ...values };
}

describe('calculateIrpf with the 2026 rules', () => {
	it('CALC-01 services 100,000 → gross 100000, net 100000, exempt 32000, taxable 68000 and must declare', () => {
		const result = calculateIrpf(inputs({ services: 100000 }), rules2026);
		expect(result.grossRevenue).toBe(100000);
		expect(result.netProfit).toBe(100000);
		expect(result.exemptIncome).toBe(32000);
		expect(result.taxableIncome).toBe(68000);
		expect(result.mustDeclare).toBe(true);
	});

	it('CALC-02 10,000 in each category → exempt income 5600', () => {
		const result = calculateIrpf(inputs({ services: 10000, commerce: 10000, transport: 10000 }), rules2026);
		expect(result.exemptIncome).toBe(5600);
	});

	it('CALC-03 services 50,000 → taxable 34000 and must not declare', () => {
		const result = calculateIrpf(inputs({ services: 50000 }), rules2026);
		expect(result.taxableIncome).toBe(34000);
		expect(result.mustDeclare).toBe(false);
	});

	it('CALC-04 taxable exactly at the limit (35584) → must not declare', () => {
		const result = calculateIrpf(inputs({ services: 100000, expenses: 32416 }), rules2026);
		expect(result.taxableIncome).toBe(35584);
		expect(result.mustDeclare).toBe(false);
	});

	it('CALC-05 expenses above gross revenue → net -4000 and taxable at most 0', () => {
		const result = calculateIrpf(inputs({ services: 1000, expenses: 5000 }), rules2026);
		expect(result.netProfit).toBe(-4000);
		expect(result.taxableIncome).toBeLessThanOrEqual(0);
		expect(result.mustDeclare).toBe(false);
	});

	it('CALC-01 the result carries the inputs it was computed from', () => {
		const given = inputs({ services: 100000 });
		expect(calculateIrpf(given, rules2026).inputs).toBe(given);
	});

	it('CALC-03 all-zero inputs → everything 0 and must not declare', () => {
		const result = calculateIrpf(inputs({}), rules2026);
		expect(result).toMatchObject({
			grossRevenue: 0,
			netProfit: 0,
			exemptIncome: 0,
			taxableIncome: 0,
			mustDeclare: false,
		});
	});
});

describe('calculateIrpf with another year config', () => {
	/** @type {import('../../public/scripts/core/types.js').YearRules} */
	const madeUp = {
		...rules2026,
		taxableIncomeLimit: 40000,
		presumedProfitRates: { services: 0.5, commerce: 0.08, transport: 0.16 },
	};

	it('RULES-03 uses the config rate: services 100,000 → exempt 50000, taxable 50000', () => {
		const result = calculateIrpf(inputs({ services: 100000 }), madeUp);
		expect(result.exemptIncome).toBe(50000);
		expect(result.taxableIncome).toBe(50000);
	});

	it('RULES-03 uses the config limit: taxable 38000 declares under 2026 but not under limit 40000', () => {
		// services 100000 with 2026 rate 0.32 and expenses 30000: 70000 - 32000 = 38000
		const given = inputs({ services: 100000, expenses: 30000 });
		expect(calculateIrpf(given, rules2026).mustDeclare).toBe(true);
		const result = calculateIrpf(given, { ...rules2026, taxableIncomeLimit: 40000 });
		expect(result.taxableIncome).toBe(38000);
		expect(result.mustDeclare).toBe(false);
	});

	it('RULES-03 the made-up config changes the outcome versus 2026', () => {
		const given = inputs({ services: 100000 });
		expect(calculateIrpf(given, rules2026).mustDeclare).toBe(true);
		expect(calculateIrpf(given, madeUp).taxableIncome).not.toBe(calculateIrpf(given, rules2026).taxableIncome);
	});
});
