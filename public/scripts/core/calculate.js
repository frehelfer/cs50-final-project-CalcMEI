/** @typedef {import('./types.js').Inputs} Inputs */
/** @typedef {import('./types.js').YearRules} YearRules */
/** @typedef {import('./types.js').Result} Result */

/**
 * Computes the IRPF figures for one set of annual inputs under one year's rules.
 * The expressions and their order are kept from the legacy script, so floats match bit for bit.
 * @param {Inputs} inputs
 * @param {YearRules} rules
 * @returns {Result}
 */
export function calculateIrpf(inputs, rules) {
	const { services, commerce, transport, expenses } = inputs;
	const rates = rules.presumedProfitRates;

	const grossRevenue = services + commerce + transport;
	const netProfit = grossRevenue - expenses;

	const exemptServices = services * rates.services;
	const exemptCommerce = commerce * rates.commerce;
	const exemptTransport = transport * rates.transport;
	const exemptIncome = exemptServices + exemptCommerce + exemptTransport;

	const taxableIncome = netProfit - exemptIncome;
	const mustDeclare = taxableIncome > rules.taxableIncomeLimit;

	return { grossRevenue, netProfit, exemptIncome, taxableIncome, mustDeclare, inputs };
}
