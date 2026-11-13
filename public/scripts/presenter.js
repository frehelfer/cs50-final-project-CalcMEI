import { formatBRL, formatNumber, formatLimit, formatRate } from './core/currency.js';

/** @typedef {import('./core/types.js').Result} Result */
/** @typedef {import('./core/types.js').YearRules} YearRules */
/** @typedef {import('./core/types.js').ResultView} ResultView */
/** @typedef {import('./core/types.js').RuleKey} RuleKey */

/** Shown in a result box when its value is not positive (regular space, as the legacy script wrote it). */
const ZERO_BRL = 'R$ 0,00';

/**
 * Turns a calculation result into exactly what the page shows.
 * Keys of `texts` are the existing element ids of index.html.
 * @param {Result} result
 * @param {YearRules} rules
 * @returns {ResultView}
 */
export function presentResult(result, rules) {
	const { grossRevenue, netProfit, exemptIncome, taxableIncome, mustDeclare, inputs } = result;
	const limit = formatLimit(rules.taxableIncomeLimit);

	/** @type {Record<string, string>} */
	const texts = {
		'receita-bruta-apurado': formatBRL(grossRevenue),
		'conta-serviço': formatNumber(inputs.services),
		'conta-comércio': formatNumber(inputs.commerce),
		'conta-transporte': formatNumber(inputs.transport),
		'lucro-apurado': netProfit < 0 ? ZERO_BRL : formatBRL(netProfit),
		'conta-receita-bruta': formatNumber(grossRevenue),
		'conta-despesas': formatNumber(inputs.expenses),
		'lucro-isento': formatBRL(exemptIncome),
		'conta-serviço-p': formatNumber(inputs.services),
		'conta-comércio-p': formatNumber(inputs.commerce),
		'conta-transporte-p': formatNumber(inputs.transport),
		'conta-rendimento-isento': formatNumber(exemptIncome),
		'lucro-tributável': taxableIncome <= 0 ? ZERO_BRL : formatBRL(taxableIncome),
		// Unclamped on purpose: the legacy page shows a negative net profit here.
		'conta-lucro-apurado': formatNumber(netProfit),
	};

	if (mustDeclare) {
		return {
			texts,
			taxableIncomeRed: true,
			title: { text: 'OBRIGATÓRIA', className: 'red' },
			resultHtml: `O Rendimento Tributável ficou superior a <b>${limit}</b>. Você precisa fazer a declaração no programa disponível pela Receita Federal. Acompanhe abaixo para mais informações.`,
		};
	}

	return {
		texts,
		taxableIncomeRed: false,
		title: { text: 'Não Obrigatória', className: 'green' },
		// The newline + four tabs come from the indentation of the legacy template literal.
		resultHtml:
			'Se você recebeu outros valores como Pessoa Física e a soma desses valores com o\n\t\t\t\t' +
			`Rendimento Tributável ficou maior que ${limit}, será necessário realizar o IRPF.\n\t\t\t\t` +
			'Acompanhe abaixo mais informações.',
	};
}

/**
 * Renders every year-dependent placeholder of the page from a year config.
 * @param {YearRules} rules
 * @returns {Record<RuleKey, string>}
 */
export function yearTexts(rules) {
	const [year, month, day] = rules.lastUpdated.split('-');
	const rates = rules.presumedProfitRates;
	const services = formatRate(rates.services);
	const commerce = formatRate(rates.commerce);
	const transport = formatRate(rates.transport);
	const other = rules.otherObligations;

	return {
		calendarYear: String(rules.calendarYear),
		fiscalYear: String(rules.fiscalYear),
		lastUpdated: `${day}/${month}/${year}`,
		legalReferenceName: rules.legalReference.name,
		legalReferenceUrl: rules.legalReference.url,
		limit: formatLimit(rules.taxableIncomeLimit),
		servicesRatePercent: services.percent,
		servicesRateDecimal: services.decimal,
		commerceRatePercent: commerce.percent,
		commerceRateDecimal: commerce.decimal,
		transportRatePercent: transport.percent,
		transportRateDecimal: transport.decimal,
		exemptIncomeLimit: formatLimit(other.exemptIncome),
		stockTradingLimit: formatLimit(other.stockTrading),
		ruralRevenueLimit: formatLimit(other.ruralRevenue),
		assetsLimit: formatLimit(other.assets),
	};
}
