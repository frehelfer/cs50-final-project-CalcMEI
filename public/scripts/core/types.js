/**
 * Domain types for the IRPF core. JSDoc only: this module has no runtime content.
 */

/**
 * Rules of one fiscal year, kept as data.
 * @typedef {object} YearRules
 * @property {number} fiscalYear Fiscal year (e.g. 2026).
 * @property {number} calendarYear Calendar year the income refers to (e.g. 2025).
 * @property {number} taxableIncomeLimit Taxable income limit above which filing is mandatory.
 * @property {{services: number, commerce: number, transport: number}} presumedProfitRates Rates between 0 and 1.
 * @property {string} lastUpdated ISO date (YYYY-MM-DD).
 * @property {{name: string, url: string}} legalReference Legal text backing the rules.
 * @property {{exemptIncome: number, stockTrading: number, ruralRevenue: number, assets: number}} otherObligations Other filing triggers.
 */

/**
 * Annual amounts typed by the user.
 * @typedef {object} Inputs
 * @property {number} services
 * @property {number} commerce
 * @property {number} transport
 * @property {number} expenses
 */

/**
 * Output of the calculation.
 * @typedef {object} Result
 * @property {number} grossRevenue
 * @property {number} netProfit Unclamped: can be negative.
 * @property {number} exemptIncome
 * @property {number} taxableIncome
 * @property {boolean} mustDeclare
 * @property {Inputs} inputs
 */

/**
 * Exactly what the page shows for a Result.
 * @typedef {object} ResultView
 * @property {Record<string, string>} texts Element id to textContent.
 * @property {boolean} taxableIncomeRed
 * @property {{text: string, className: 'red' | 'green'}} title
 * @property {string} resultHtml
 */

/**
 * One key per year-dependent placeholder in the page.
 * @typedef {'calendarYear' | 'fiscalYear' | 'lastUpdated' | 'legalReferenceName'
 *   | 'legalReferenceUrl' | 'limit'
 *   | 'servicesRatePercent' | 'servicesRateDecimal'
 *   | 'commerceRatePercent' | 'commerceRateDecimal'
 *   | 'transportRatePercent' | 'transportRateDecimal'
 *   | 'exemptIncomeLimit' | 'stockTradingLimit' | 'ruralRevenueLimit' | 'assetsLimit'} RuleKey
 */

export {};
