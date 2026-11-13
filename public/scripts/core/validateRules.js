/** @typedef {import('./types.js').YearRules} YearRules */

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
	return typeof value === 'object' && value !== null;
}

/**
 * @param {string} field
 * @param {string} problem
 * @returns {Error}
 */
function invalid(field, problem) {
	return new Error(`invalid rules: ${field} ${problem}`);
}

/**
 * @param {Record<string, unknown>} parent
 * @param {string} path Dotted path of the parent, '' for the root.
 * @param {string} key
 * @param {(value: unknown) => boolean} check
 * @param {string} expected
 */
function requireField(parent, path, key, check, expected) {
	const field = path ? `${path}.${key}` : key;
	if (!(key in parent) || parent[key] === undefined) throw invalid(field, 'is missing');
	if (!check(parent[key])) throw invalid(field, `must be ${expected}`);
}

/**
 * @param {Record<string, unknown>} parent
 * @param {string} path
 * @param {string} key
 * @returns {Record<string, unknown>}
 */
function requireObject(parent, path, key) {
	requireField(parent, path, key, isObject, 'an object');
	return /** @type {Record<string, unknown>} */ (parent[key]);
}

/**
 * Throws when a year config is malformed (missing or mistyped field, rate outside 0-1,
 * non-positive limit).
 * @param {unknown} rules
 * @returns {asserts rules is YearRules}
 */
export function validateRules(rules) {
	if (!isObject(rules)) throw invalid('rules', 'must be an object');

	const isNumber = (/** @type {unknown} */ v) => isFiniteNumber(v);
	const isString = (/** @type {unknown} */ v) => typeof v === 'string';
	const isPositive = (/** @type {unknown} */ v) => isFiniteNumber(v) && v > 0;
	const isRate = (/** @type {unknown} */ v) => isFiniteNumber(v) && v >= 0 && v <= 1;

	requireField(rules, '', 'fiscalYear', isNumber, 'a number');
	requireField(rules, '', 'calendarYear', isNumber, 'a number');
	requireField(rules, '', 'taxableIncomeLimit', isPositive, 'a positive number');
	requireField(rules, '', 'lastUpdated', isString, 'a string');

	const rates = requireObject(rules, '', 'presumedProfitRates');
	for (const key of ['services', 'commerce', 'transport']) {
		requireField(rates, 'presumedProfitRates', key, isRate, 'a number between 0 and 1');
	}

	const reference = requireObject(rules, '', 'legalReference');
	requireField(reference, 'legalReference', 'name', isString, 'a string');
	requireField(reference, 'legalReference', 'url', isString, 'a string');

	const other = requireObject(rules, '', 'otherObligations');
	for (const key of ['exemptIncome', 'stockTrading', 'ruralRevenue', 'assets']) {
		requireField(other, 'otherObligations', key, isPositive, 'a positive number');
	}
}
