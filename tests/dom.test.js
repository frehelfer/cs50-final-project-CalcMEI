// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { init } from '../public/scripts/calculator-dom.js';
import { presentResult, yearTexts } from '../public/scripts/presenter.js';
import { calculateIrpf } from '../public/scripts/core/calculate.js';
import { activeRules } from '../public/scripts/core/rules/index.js';
import { rules2026 } from '../public/scripts/core/rules/2026.js';
import { validateRules } from '../public/scripts/core/validateRules.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const legacyHtml = fs.readFileSync(path.join(ROOT, 'tests/fixtures/index.legacy.html'), 'utf8');
const legacySource = fs.readFileSync(path.join(ROOT, 'tests/fixtures/calculator.legacy.js'), 'utf8');

const INPUT_IDS = ['serviços', 'comércio', 'transporte', 'despesas'];
const RESULT_IDS = ['receita-bruta-apurado', 'lucro-apurado', 'lucro-isento', 'lucro-tributável'];

/** Intl puts a no-break space between "R$" and the amount. */
const NBSP = ' ';

/** @typedef {[string, string, string, string]} InputSet Raw digits for services, commerce, transport, expenses. */

/** The legacy page running the frozen pre-refactor script. jsdom lacks innerText, so it is backed by textContent. */
function legacyWindow() {
	const { window } = new JSDOM(legacyHtml, { runScripts: 'outside-only' });
	Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
		configurable: true,
		get() {
			return this.textContent;
		},
		set(value) {
			this.textContent = value;
		},
	});
	window.eval(legacySource);
	return window;
}

/** @param {import('../public/scripts/core/types.js').YearRules} [rules] */
function newWindow(rules) {
	const { window } = new JSDOM(html, { runScripts: 'outside-only' });
	init(window.document, rules);
	return window;
}

/**
 * Types each raw digit string into its input, in order, as a user would.
 * @param {import('jsdom').DOMWindow} window
 * @param {InputSet} set
 */
function type(window, set) {
	INPUT_IDS.forEach((id, index) => {
		const input = /** @type {HTMLInputElement} */ (window.document.getElementById(id));
		input.value = set[index];
		input.dispatchEvent(new window.Event('input'));
	});
}

/**
 * Everything the calculator writes to the page.
 * @param {import('jsdom').DOMWindow} window
 */
function snapshot(window) {
	const doc = window.document;
	const ids = [...RESULT_IDS, ...[...doc.querySelectorAll('[id^="conta-"]')].map((el) => el.id)];
	const title = /** @type {HTMLElement} */ (doc.getElementById('result-title'));
	return {
		boxes: Object.fromEntries(
			ids.map((id) => {
				const el = /** @type {HTMLElement} */ (doc.getElementById(id));
				return [id, { text: el.textContent, className: el.className }];
			})
		),
		title: { text: title.textContent, className: title.className },
		resultHtml: /** @type {HTMLElement} */ (doc.getElementById('result-text')).innerHTML,
		inputs: INPUT_IDS.map((id) => /** @type {HTMLInputElement} */ (doc.getElementById(id)).value),
	};
}

/**
 * Seeded PRNG so the random input sets are the same on every run.
 * @param {number} seed
 */
function mulberry32(seed) {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** @type {InputSet[]} */
const FIXED_SETS = [
	['10000000', '', '', ''], // CALC-01: services 100,000.00
	['1000000', '1000000', '1000000', ''], // CALC-02: 10,000.00 each
	['5000000', '', '', ''], // CALC-03: services 50,000.00
	['10000000', '', '', '3241600'], // CALC-04: taxable exactly 35,584.00
	['10000000', '', '', '3241599'], // one cent above the limit
	['100000', '', '', '500000'], // CALC-05: expenses above revenue
	['100000', '', '', '90000'], // net positive, taxable negative
	['', '', '', ''], // empty
	['99999999999', '99999999999', '99999999999', '99999999999'], // huge
	['99999999999', '', '', ''], // huge services only
	['', '50000000', '4500000', ''], // commerce and transport only
	['1234567', '7654321', '111111', '222222'], // mixed cents
];

/** @returns {InputSet[]} */
function randomSets() {
	const random = mulberry32(20261113);
	const digits = () => {
		const length = Math.floor(random() * 12); // 0 to 11 digits
		let out = '';
		for (let i = 0; i < length; i++) out += String(Math.floor(random() * 10));
		return out;
	};
	return Array.from({ length: 200 }, () => /** @type {InputSet} */ ([digits(), digits(), digits(), digits()]));
}

describe('DOM adapter golden master', () => {
	it('UI-01 typing gives the same text, classes, result HTML and masked inputs as the legacy script', () => {
		const legacy = legacyWindow();
		const current = newWindow();
		const sets = [...FIXED_SETS, ...randomSets()];
		expect(sets).toHaveLength(212);

		const distinct = new Set();
		sets.forEach((set, index) => {
			type(legacy, set);
			type(current, set);
			const expected = snapshot(legacy);
			expect(snapshot(current), `set ${index}: ${JSON.stringify(set)}`).toEqual(expected);
			distinct.add(JSON.stringify(expected));
		});
		// The comparison only means something if the page changed between sets.
		expect(distinct.size).toBeGreaterThan(100);
	});

	it('UI-01 the legacy reference itself shows the spec values for services 100,000.00', () => {
		const legacy = legacyWindow();
		type(legacy, FIXED_SETS[0]);
		const shown = snapshot(legacy);
		expect(shown.boxes['lucro-tributável']).toEqual({
			text: `R$${NBSP}68.000,00`,
			className: 'resultados-value moneyInput green red',
		});
		expect(shown.title).toEqual({ text: 'OBRIGATÓRIA', className: 'red' });
		expect(shown.inputs[0]).toBe(`R$${NBSP}100.000,00`);
	});

	it('UI-07 the adapter writes exactly the presenter view', () => {
		const current = newWindow();
		type(current, ['1234567', '7654321', '111111', '222222']);
		const view = presentResult(
			calculateIrpf({ services: 12345.67, commerce: 76543.21, transport: 1111.11, expenses: 2222.22 }, activeRules),
			activeRules
		);
		const doc = current.document;
		for (const [id, text] of Object.entries(view.texts)) {
			expect(doc.getElementById(id)?.textContent, id).toBe(text);
		}
		expect(doc.getElementById('result-title')?.textContent).toBe(view.title.text);
		expect(doc.getElementById('result-title')?.className).toBe(view.title.className);
		expect(doc.getElementById('lucro-tributável')?.classList.contains('red')).toBe(view.taxableIncomeRed);
		expect(doc.getElementById('result-text')?.innerHTML).toBe(view.resultHtml);
	});
});

describe('DOM adapter placeholders', () => {
	it('UI-04 on load every placeholder shows the active config text', () => {
		const { window } = new JSDOM(html, { runScripts: 'outside-only' });
		const doc = window.document;
		for (const el of doc.querySelectorAll('[data-rule]')) el.textContent = '';
		for (const el of doc.querySelectorAll('[data-rule-href]')) el.setAttribute('href', '');

		init(doc);

		const expected = yearTexts(activeRules);
		const placeholders = [...doc.querySelectorAll('[data-rule]')];
		expect(placeholders.length).toBeGreaterThanOrEqual(16);
		for (const el of placeholders) {
			const key = /** @type {keyof typeof expected} */ (el.getAttribute('data-rule'));
			expect(el.textContent, key).toBe(expected[key]);
		}
		const link = doc.querySelector('[data-rule-href="legalReferenceUrl"]');
		expect(link?.getAttribute('href')).toBe(expected.legalReferenceUrl);
		expect(link?.textContent).toBe('IN RFB Nº 2.312/2026');
		expect(doc.querySelector('main p')?.textContent).toBe('Ano-Calendário de 2025 - Exercício de 2026');
	});

	it('UI-06 with a different year config every placeholder shows that config', () => {
		/** @type {import('../public/scripts/core/types.js').YearRules} */
		const madeUp = {
			fiscalYear: 2099,
			calendarYear: 2098,
			taxableIncomeLimit: 40000,
			presumedProfitRates: { services: 0.5, commerce: 0.1, transport: 0.2 },
			lastUpdated: '2099-01-31',
			legalReference: { name: 'IN RFB Nº 9.999/2099', url: 'https://example.com/in-2099' },
			otherObligations: { exemptIncome: 300000, stockTrading: 50000, ruralRevenue: 200000, assets: 900000 },
		};
		expect(() => validateRules(madeUp)).not.toThrow();

		const doc = newWindow(madeUp).document;
		const expected = yearTexts(madeUp);
		const placeholders = [...doc.querySelectorAll('[data-rule]')];
		expect(placeholders.length).toBeGreaterThanOrEqual(16);
		for (const el of placeholders) {
			const key = /** @type {keyof typeof expected} */ (el.getAttribute('data-rule'));
			expect(el.textContent, key).toBe(expected[key]);
		}
		expect(doc.querySelector('main p')?.textContent).toBe('Ano-Calendário de 2098 - Exercício de 2099');
		expect(doc.querySelector('[data-rule-href]')?.getAttribute('href')).toBe('https://example.com/in-2099');
		expect(doc.querySelector('[data-rule-href]')?.textContent).toBe('IN RFB Nº 9.999/2099');
		expect(doc.querySelector('.checkbox .list')?.textContent).toContain('R$ 900.000,00');
		expect(doc.querySelector('.conta [data-rule="servicesRateDecimal"]')?.textContent).toBe('0,5');
		expect(doc.body.textContent).not.toMatch(/2025|35\.584|IN RFB Nº 2\.312/);
	});

	it('UI-06 typing under a different year config uses its limit and rates', () => {
		const madeUp = {
			...rules2026,
			taxableIncomeLimit: 40000,
			presumedProfitRates: { services: 0.5, commerce: 0.08, transport: 0.16 },
		};
		const window = newWindow(madeUp);
		type(window, ['10000000', '', '', '']); // services 100,000.00: exempt 50,000, taxable 50,000
		const doc = window.document;
		expect(doc.getElementById('lucro-isento')?.textContent).toBe(`R$${NBSP}50.000,00`);
		expect(doc.getElementById('result-title')?.textContent).toBe('OBRIGATÓRIA');
		expect(doc.getElementById('result-text')?.innerHTML).toContain('<b>R$ 40.000,00</b>');
	});
});

describe('calculator.js entry', () => {
	it('UI-01 loading the module entry on index.html wires the page: services 100,000.00 shows "OBRIGATÓRIA"', async () => {
		// jsdom does not run <script type="module">, so the entry is imported against the global jsdom document.
		document.body.innerHTML = new JSDOM(html).window.document.body.innerHTML;

		await import('../public/scripts/calculator.js');

		const services = /** @type {HTMLInputElement} */ (document.getElementById('serviços'));
		services.value = '10000000';
		services.dispatchEvent(new Event('input'));

		expect(services.value).toBe(`R$${NBSP}100.000,00`);
		expect(document.getElementById('result-title')?.textContent).toBe('OBRIGATÓRIA');
		expect(document.getElementById('result-title')?.className).toBe('red');
		expect(document.getElementById('lucro-tributável')?.textContent).toBe(`R$${NBSP}68.000,00`);
	});
});
