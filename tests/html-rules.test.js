import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { yearTexts } from '../public/scripts/presenter.js';
import { activeRules } from '../public/scripts/core/rules/index.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const legacyHtml = fs.readFileSync(path.join(ROOT, 'tests/fixtures/index.legacy.html'), 'utf8');

/** Yearly values that must only appear inside a placeholder. */
const YEARLY_VALUES = ['35.584', '177.920', '800.000', '200.000', '40.000', '2025', '2026'];

/** @param {string} source */
function parse(source) {
	return new JSDOM(source).window.document;
}

describe('index.html placeholders', () => {
	const doc = parse(html);
	const expected = yearTexts(activeRules);

	it('UI-05 every [data-rule] static text equals what the active config renders', () => {
		const placeholders = [...doc.querySelectorAll('[data-rule]')];
		expect(placeholders.length).toBeGreaterThan(0);
		for (const element of placeholders) {
			const key = /** @type {keyof typeof expected} */ (element.getAttribute('data-rule'));
			expect(Object.keys(expected), key).toContain(key);
			expect(element.textContent, key).toBe(expected[key]);
		}
	});

	it('UI-05 every [data-rule-href] static href equals what the active config renders', () => {
		const links = [...doc.querySelectorAll('[data-rule-href]')];
		expect(links.length).toBeGreaterThan(0);
		for (const element of links) {
			const key = /** @type {keyof typeof expected} */ (element.getAttribute('data-rule-href'));
			expect(Object.keys(expected), key).toContain(key);
			expect(element.getAttribute('href'), key).toBe(expected[key]);
		}
	});

	it('UI-05 every rule key appears in at least one placeholder', () => {
		const used = new Set([
			...[...doc.querySelectorAll('[data-rule]')].map((el) => el.getAttribute('data-rule')),
			...[...doc.querySelectorAll('[data-rule-href]')].map((el) => el.getAttribute('data-rule-href')),
		]);
		expect([...used].sort()).toEqual(Object.keys(expected).sort());
	});

	it('UI-05 no text outside a placeholder holds a yearly value', () => {
		const walker = doc.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */);
		/** @type {string[]} */
		const offenders = [];
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			if (node.parentElement?.closest('[data-rule]')) continue;
			const text = node.textContent ?? '';
			for (const value of YEARLY_VALUES) {
				if (text.includes(value)) offenders.push(`${value}: ${text.trim()}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it('UI-05 the visible text is identical to the legacy page', () => {
		expect(doc.body.textContent).toBe(parse(legacyHtml).body.textContent);
	});

	it('UI-05 the body markup is the legacy markup once the placeholder spans and attributes are removed', () => {
		const current = parse(html);
		for (const span of current.querySelectorAll('span[data-rule]')) span.replaceWith(...span.childNodes);
		for (const element of current.querySelectorAll('[data-rule]')) {
			element.removeAttribute('data-rule');
			element.removeAttribute('data-rule-href');
		}
		current.body.normalize();
		expect(current.body.innerHTML).toBe(parse(legacyHtml).body.innerHTML);
	});

	it('UI-05 the calculator is loaded as an ES module', () => {
		const script = doc.querySelector('script[src="/scripts/calculator.js"]');
		expect(script?.getAttribute('type')).toBe('module');
	});
});
