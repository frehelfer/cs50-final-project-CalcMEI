import { rules2026 } from './2026.js';

/** @typedef {import('../types.js').YearRules} YearRules */

/** @type {Record<number, YearRules>} */
export const rulesByFiscalYear = {
	2026: rules2026,
};

/** Fiscal year the site uses. Change this one constant when a new year's config is added. */
export const ACTIVE_FISCAL_YEAR = 2026;

/** @type {YearRules} */
export const activeRules = rulesByFiscalYear[ACTIVE_FISCAL_YEAR];
