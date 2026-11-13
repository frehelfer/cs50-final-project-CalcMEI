import { maskBRL, parseBRL } from './core/currency.js';
import { calculateIrpf } from './core/calculate.js';
import { activeRules } from './core/rules/index.js';
import { presentResult, yearTexts } from './presenter.js';

/** @typedef {import('./core/types.js').YearRules} YearRules */
/** @typedef {import('./core/types.js').RuleKey} RuleKey */

/**
 * The only module that touches the DOM: fills the year placeholders, then recalculates on every input.
 * @param {Document} doc
 * @param {YearRules} [rules]
 */
export function init(doc, rules = activeRules) {
	const texts = yearTexts(rules);
	doc.querySelectorAll('[data-rule]').forEach((element) => {
		element.textContent = texts[/** @type {RuleKey} */ (element.getAttribute('data-rule'))];
	});
	doc.querySelectorAll('[data-rule-href]').forEach((element) => {
		element.setAttribute('href', texts[/** @type {RuleKey} */ (element.getAttribute('data-rule-href'))]);
	});

	/** @param {string} id */
	const byId = (id) => /** @type {HTMLElement} */ (doc.getElementById(id));
	/** @param {string} id */
	const inputValue = (id) => parseBRL(/** @type {HTMLInputElement} */ (byId(id)).value);

	doc.querySelectorAll('input').forEach((input) => {
		input.addEventListener('input', () => {
			input.value = maskBRL(input.value);

			const result = calculateIrpf(
				{
					services: inputValue('serviços'),
					commerce: inputValue('comércio'),
					transport: inputValue('transporte'),
					expenses: inputValue('despesas'),
				},
				rules
			);
			const view = presentResult(result, rules);

			for (const [id, text] of Object.entries(view.texts)) byId(id).textContent = text;
			byId('lucro-tributável').classList.toggle('red', view.taxableIncomeRed);

			const title = byId('result-title');
			title.textContent = view.title.text;
			title.classList.remove('red', 'green');
			title.classList.add(view.title.className);

			byId('result-text').innerHTML = view.resultHtml;
		});
	});
}
