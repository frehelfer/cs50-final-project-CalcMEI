import { describe, it, expect } from 'vitest';
import { presentResult } from '../public/scripts/presenter.js';
import { calculateIrpf } from '../public/scripts/core/calculate.js';
import { rules2026 } from '../public/scripts/core/rules/2026.js';

/** Intl puts a no-break space between "R$" and the amount. */
const NBSP = ' ';

/**
 * @param {Partial<import('../public/scripts/core/types.js').Inputs>} values
 * @param {import('../public/scripts/core/types.js').YearRules} [rules]
 */
function view(values, rules = rules2026) {
	const inputs = { services: 0, commerce: 0, transport: 0, expenses: 0, ...values };
	return presentResult(calculateIrpf(inputs, rules), rules);
}

const MUST_DECLARE_HTML =
	'O Rendimento Tributável ficou superior a <b>R$ 35.584,00</b>. Você precisa fazer a declaração no programa disponível pela Receita Federal. Acompanhe abaixo para mais informações.';

const NO_DECLARE_HTML =
	'Se você recebeu outros valores como Pessoa Física e a soma desses valores com o\n\t\t\t\t' +
	'Rendimento Tributável ficou maior que R$ 35.584,00, será necessário realizar o IRPF.\n\t\t\t\t' +
	'Acompanhe abaixo mais informações.';

describe('presentResult', () => {
	it('UI-02 above the limit → "OBRIGATÓRIA", red title, red taxable box and the "superior a" text', () => {
		const result = view({ services: 100000 });
		expect(result.title).toEqual({ text: 'OBRIGATÓRIA', className: 'red' });
		expect(result.taxableIncomeRed).toBe(true);
		expect(result.resultHtml).toBe(MUST_DECLARE_HTML);
	});

	it('UI-03 below the limit → "Não Obrigatória", green title, no red and the "maior que" text', () => {
		const result = view({ services: 50000 });
		expect(result.title).toEqual({ text: 'Não Obrigatória', className: 'green' });
		expect(result.taxableIncomeRed).toBe(false);
		expect(result.resultHtml).toBe(NO_DECLARE_HTML);
	});

	it('UI-03 taxable exactly at the limit → "Não Obrigatória"', () => {
		const result = view({ services: 100000, expenses: 32416 });
		expect(result.title).toEqual({ text: 'Não Obrigatória', className: 'green' });
		expect(result.taxableIncomeRed).toBe(false);
		expect(result.texts['lucro-tributável']).toBe(`R$${NBSP}35.584,00`);
	});

	it('UI-02 a 40000-limit config quotes "R$ 40.000,00" in the must-declare text', () => {
		const result = view({ services: 100000 }, { ...rules2026, taxableIncomeLimit: 40000 });
		expect(result.title.text).toBe('OBRIGATÓRIA');
		expect(result.resultHtml).toBe(MUST_DECLARE_HTML.replace('R$ 35.584,00', 'R$ 40.000,00'));
	});

	it('UI-03 a 40000-limit config quotes "R$ 40.000,00" in the no-declare text', () => {
		const result = view({ services: 50000 }, { ...rules2026, taxableIncomeLimit: 40000 });
		expect(result.title.text).toBe('Não Obrigatória');
		expect(result.resultHtml).toBe(NO_DECLARE_HTML.replace('R$ 35.584,00', 'R$ 40.000,00'));
	});

	it('CALC-05 expenses above revenue → boxes "R$ 0,00" and conta "-4.000"', () => {
		const result = view({ services: 1000, expenses: 5000 });
		expect(result.texts['lucro-apurado']).toBe('R$ 0,00');
		expect(result.texts['lucro-tributável']).toBe('R$ 0,00');
		expect(result.texts['conta-lucro-apurado']).toBe('-4.000');
	});

	it('UI-01 positive net profit with taxable below zero → net shown, taxable "R$ 0,00"', () => {
		// 1000 - 900 = 100 net; 1000 * 0.32 = 320 exempt; taxable -220
		const result = view({ services: 1000, expenses: 900 });
		expect(result.texts['lucro-apurado']).toBe(`R$${NBSP}100,00`);
		expect(result.texts['lucro-tributável']).toBe('R$ 0,00');
		expect(result.texts['conta-lucro-apurado']).toBe('100');
	});

	it('UI-01 all-zero inputs → every box "R$ 0,00"-style zero and "Não Obrigatória"', () => {
		const result = view({});
		expect(result.texts['receita-bruta-apurado']).toBe(`R$${NBSP}0,00`);
		expect(result.texts['lucro-apurado']).toBe(`R$${NBSP}0,00`);
		expect(result.texts['lucro-isento']).toBe(`R$${NBSP}0,00`);
		expect(result.texts['lucro-tributável']).toBe('R$ 0,00');
		expect(result.title.text).toBe('Não Obrigatória');
	});

	it('UI-07 returns every result box and conta text as plain data keyed by element id', () => {
		const result = view({ services: 100000, commerce: 20000, transport: 10000, expenses: 5000 });
		expect(result.texts).toEqual({
			'receita-bruta-apurado': `R$${NBSP}130.000,00`,
			'conta-serviço': '100.000',
			'conta-comércio': '20.000',
			'conta-transporte': '10.000',
			'lucro-apurado': `R$${NBSP}125.000,00`,
			'conta-receita-bruta': '130.000',
			'conta-despesas': '5.000',
			'lucro-isento': `R$${NBSP}35.200,00`,
			'conta-serviço-p': '100.000',
			'conta-comércio-p': '20.000',
			'conta-transporte-p': '10.000',
			'conta-rendimento-isento': '35.200',
			'lucro-tributável': `R$${NBSP}89.800,00`,
			'conta-lucro-apurado': '125.000',
		});
	});
});
