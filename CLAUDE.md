# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

**calcMEI** (https://calcmei.com.br) is a static site that tells a MEI whether they must file the IRPF (Brazilian personal income tax return). All the math runs in the browser. There is no backend, database or login, on purpose: private financial data never leaves the client. It started as a CS50x final project. A sibling iOS app lives at https://github.com/frehelfer/calcMEI.

## Language

- **English code, pt-BR user-facing text.** JS identifiers, file names, comments, test titles, `data-rule` keys, docs and commit messages are in English. Everything the user reads stays in Brazilian Portuguese.
- The existing HTML ids and CSS classes (`#lucro-tributável`, `#conta-comércio`, `.resultados-value` …) stay in pt-BR until the redesign replaces the markup. Reference them only inside string literals.
- `tests/core/purity.test.js` enforces this (LANG-01): no accented characters or pt domain words in identifiers or file names outside strings and comments.
- Tax terms use the English names from the [Glossary](#glossary).

## Stack and structure

- Plain HTML + CSS + JavaScript (no framework). The calculator is native ES modules with JSDoc types, loaded with `<script type="module">`, no bundler.
- Firebase Hosting (project `calc-mei`, see `.firebaserc` / `firebase.json`). The published folder is `public/`.
- Webpack only bundles Firebase Analytics: `src/index.js` → `public/bundle.js`.
- Tests: Vitest + jsdom. Types: `tsc --noEmit` with `checkJs` over the core and the presenter.

```
public/
  index.html               # Calculator + result + tutorial (accordion); yearly values in data-rule spans
  contato.html             # Contact form via formsubmit.co
  privacidade.html, termos-de-uso.html, thanks.html
  scripts/
    calculator.js          # Module entry: init(document)
    calculator-dom.js      # DOM adapter, the only code that touches the DOM: init(doc, rules)
    presenter.js           # Pure: presentResult (texts, classes, result HTML), yearTexts (placeholders)
    core/                  # Pure, DOM-free
      types.js             # JSDoc typedefs: YearRules, Inputs, Result, ResultView, RuleKey
      currency.js          # parseBRL, maskBRL, formatBRL, formatNumber, formatLimit, formatRate
      calculate.js         # calculateIrpf(inputs, rules)
      validateRules.js     # validateRules(rules): throws naming the bad field
      rules/2026.js        # One file per fiscal year (exercício)
      rules/index.js       # rulesByFiscalYear, ACTIVE_FISCAL_YEAR, activeRules
    accordion.js           # Open/close for the tutorial accordion
  styles/base.css, styles/calculator.css
  ads.txt                  # Google AdSense
src/index.js               # Firebase App + Analytics init (becomes bundle.js)
tests/
  core/*.test.js           # Core unit tests, purity/language scan
  presenter.test.js        # Result view model and year texts
  html-rules.test.js       # Static data-rule text in index.html = active config
  dom.test.js              # Golden master vs the legacy script, placeholders, module entry
  fixtures/                # Frozen pre-refactor calculator.js and index.html (golden master)
tsconfig.json              # checkJs over core/ and presenter.js, no DOM lib
```

`public/bundle.js` is a generated file, but it **is committed** because Firebase publishes `public/` as is. Do not edit it by hand: change `src/index.js` and rebuild.

## Commands

```bash
npm install
npm test                    # Vitest, all tests (no browser needed)
npm run typecheck           # tsc --noEmit with checkJs over the core and presenter
npx webpack --watch=false   # one-off build of public/bundle.js
firebase deploy --only hosting   # needs firebase-tools and a login
```

**Warning:** `npm run build` runs webpack in development mode with `watch: true`. It never exits, and it rewrites the committed `public/bundle.js`. Only run it when you mean to change the Analytics bundle.

Local development: serve `public/` with any static server (e.g. VS Code Live Server, or `npx serve public`). ES modules do not load from `file://`. There is no linter.

## Business rules

The rules live in `public/scripts/core/calculate.js` (`calculateIrpf`), with each year's values in `public/scripts/core/rules/<fiscalYear>.js`. On every `input` the adapter masks the value as BRL, reads the four inputs, calls `calculateIrpf`, passes the result to `presentResult` and writes the view:

1. **grossRevenue** = services + commerce + transport
2. **netProfit** = grossRevenue − expenses (the box shows R$ 0,00 when negative; the "conta" shows the negative value)
3. **exemptIncome** = services × rate.services + commerce × rate.commerce + transport × rate.transport (2026: 0.32 / 0.08 / 0.16)
4. **taxableIncome** = netProfit − exemptIncome (the box shows R$ 0,00 when ≤ 0)
5. **mustDeclare** = taxableIncome > `taxableIncomeLimit` (2026: 35584) → "OBRIGATÓRIA", otherwise "Não Obrigatória".

The `#conta-*` elements show the step-by-step math next to each result. The pure refactor kept the legacy float math and quirks on purpose; `tests/dom.test.js` compares the page with the frozen legacy script.

## Yearly update (recurring task)

Each new IRPF fiscal year (exercício) is one new config file plus one constant:

1. Copy `public/scripts/core/rules/2026.js` to `public/scripts/core/rules/<year>.js` and rename the export (e.g. `rules2027`).
2. Edit its values: `fiscalYear`, `calendarYear`, `taxableIncomeLimit`, `presumedProfitRates`, `lastUpdated`, `legalReference`, `otherObligations`.
3. Register it in `rulesByFiscalYear` in `public/scripts/core/rules/index.js`.
4. Switch `ACTIVE_FISCAL_YEAR` to the new year.
5. Run `npm test`. It fails (`tests/html-rules.test.js`) until the static values in index.html's `data-rule` spans match the new config.
6. Update those spans in `public/index.html` with the values the failing test reports, then run `npm test` and `npm run typecheck` again.

The browser fills the `data-rule` placeholders from the active config on load. The static values stay in the HTML for SEO and for visitors without JavaScript, which is why the test keeps them in sync.

## Glossary

Code names ↔ Receita Federal terms.

| Code | pt-BR |
|------|-------|
| fiscalYear | exercício |
| calendarYear | ano-calendário |
| grossRevenue | receita bruta |
| expenses | despesas |
| netProfit | lucro apurado |
| exemptIncome | rendimento (lucro) isento |
| taxableIncome | rendimento (lucro) tributável |
| taxableIncomeLimit | limite de rendimento tributável |
| presumedProfitRates | percentuais de presunção |
| services / commerce / transport | serviços / comércio, indústria e transporte de cargas / transporte de passageiros |
| mustDeclare | declaração obrigatória |
| otherObligations | outras hipóteses de obrigatoriedade |

## Notes

- Every page loads `bundle.js` (Analytics) and the AdSense script (`ca-pub-9442959543814157`).
- The Firebase config in `src/index.js` is the web app's public config (normal on the client side), not a secret.
- `firebase.json` rewrites every route to `/index.html`.
- Ignore `.DS_Store` and `.idea/` in commits.
