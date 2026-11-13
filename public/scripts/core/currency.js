/**
 * Money parsing and formatting in pt-BR (BRL).
 */

/** @type {Intl.NumberFormatOptions} */
const CURRENCY_OPTIONS = { style: 'currency', currency: 'BRL' };

/**
 * Drops every non-digit character and reads the rest as cents.
 * @param {string} value
 * @returns {number}
 */
export function parseBRL(value) {
	return +value.replace(/\D+/g, '') / 100;
}

/**
 * Masks a typed string as BRL money, e.g. "12345" -> "R$ 123,45".
 * The output keeps the no-break space that Intl puts after "R$".
 * @param {string} value
 * @returns {string}
 */
export function maskBRL(value) {
	const cleanValue = +value.replace(/\D+/g, '');
	return new Intl.NumberFormat('pt-br', CURRENCY_OPTIONS).format(cleanValue / 100);
}

/**
 * Formats a number as BRL currency, as the result boxes do.
 * @param {number} n
 * @returns {string}
 */
export function formatBRL(n) {
	return Intl.NumberFormat('pt-br', CURRENCY_OPTIONS).format(n);
}

/**
 * Formats a plain pt-BR number, as the step-by-step spans do.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
	return Intl.NumberFormat('pt-br').format(n);
}

/**
 * Formats a limit as BRL with a regular space after "R$" (not the no-break space).
 * @param {number} n
 * @returns {string}
 */
export function formatLimit(n) {
	return formatBRL(n).replace(/ /g, ' ');
}

/**
 * Formats a rate in its two display forms, e.g. 0.32 -> "32%" and "0,32".
 * @param {number} rate
 * @returns {{percent: string, decimal: string}}
 */
export function formatRate(rate) {
	return { percent: `${Math.round(rate * 100)}%`, decimal: formatNumber(rate) };
}
