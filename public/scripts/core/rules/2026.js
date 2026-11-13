/** @typedef {import('../types.js').YearRules} YearRules */

/** @type {YearRules} */
export const rules2026 = {
	fiscalYear: 2026,
	calendarYear: 2025,
	taxableIncomeLimit: 35584,
	presumedProfitRates: { services: 0.32, commerce: 0.08, transport: 0.16 },
	lastUpdated: '2026-11-09',
	legalReference: {
		name: 'IN RFB Nº 2.312/2026',
		url: 'https://www.in.gov.br/web/dou/-/instrucao-normativa-rfb-n-2.312-de-13-de-marco-de-2026-692748727',
	},
	otherObligations: {
		exemptIncome: 200000,
		stockTrading: 40000,
		ruralRevenue: 177920,
		assets: 800000,
	},
};
