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
 * @param {Date} date
 * @param {string} isoDay YYYY-MM-DD
 * @returns {boolean} Whether date is a real day equal to isoDay (rejects 2026-02-30, 2026-13-01).
 */
function isSameDay(date, isoDay) {
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === isoDay;
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
 * non-positive limit, lastUpdated not an ISO date).
 * @param {unknown} rules
 * @returns {asserts rules is YearRules}
 */
export function validateRules(rules) {
	if (!isObject(rules)) throw invalid('rules', 'must be an object');

	const isNumber = (/** @type {unknown} */ v) => isFiniteNumber(v);
	const isString = (/** @type {unknown} */ v) => typeof v === 'string';
	const isPositive = (/** @type {unknown} */ v) => isFiniteNumber(v) && v > 0;
	const isRate = (/** @type {unknown} */ v) => isFiniteNumber(v) && v >= 0 && v <= 1;
	const isIsoDate = (/** @type {unknown} */ v) =>
		typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && isSameDay(new Date(`${v}T00:00:00Z`), v);

	requireField(rules, '', 'fiscalYear', isNumber, 'a number');
	requireField(rules, '', 'calendarYear', isNumber, 'a number');
	requireField(rules, '', 'taxableIncomeLimit', isPositive, 'a positive number');
	requireField(rules, '', 'lastUpdated', isIsoDate, 'an ISO date (YYYY-MM-DD)');

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
