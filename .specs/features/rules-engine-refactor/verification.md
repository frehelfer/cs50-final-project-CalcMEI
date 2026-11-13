# Rules engine refactor verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 1ac6273
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `tests/core/calculate.test.js` `CALC-01 services 100,000 → gross 100000, net 100000, exempt 32000, taxable 68000 and must declare` | yes - asserts all five values with `toBe` |
| C2 | `tests/core/calculate.test.js` `CALC-02 10,000 in each category → exempt income 5600` | yes |
| C3 | `tests/core/calculate.test.js` `CALC-03 services 50,000 → taxable 34000 and must not declare`, `CALC-03 all-zero inputs ...` | yes |
| C4 | `tests/core/calculate.test.js` `CALC-04 taxable exactly at the limit (35584) → must not declare` (+ one-cent-above set in the UI-01 golden master) | yes - exact 35584 asserted, so `>=` would fail; the core has no limit+0.01 test but my probe gives true |
| C5 | `tests/core/calculate.test.js` `CALC-05 expenses above gross revenue → net -4000 ...`; `tests/presenter.test.js` `CALC-05 expenses above revenue → boxes "R$ 0,00" and conta "-4.000"` | yes - core at core layer, view at presenter layer |
| C6 | `tests/core/purity.test.js` `CALC-06 no file under core/ or presenter.js references the DOM`, `CALC-06 the DOM scan flags a planted document reference ...` | no - the scan only looks for `document\|window\|HTMLElement\|navigator\|localStorage\|sessionStorage`; `el.querySelector(...)`, `globalThis`, `location`, `fetch` pass (probed) |
| C7 | `tests/core/currency.test.js` `CALC-07 "R$ 1.234,56" reads as 1234.56`, `CALC-07 empty string reads as 0`, `CALC-07 letters and symbols are ignored` | yes |
| C8 | `tests/core/currency.test.js` `CALC-08 "12345" masks as "R$ 123,45"` (+ 3 more CALC-08 cases) | yes |
| C9 | `tests/core/rules.test.js` `RULES-01 holds every required field and passes validation` | yes - exact key list |
| C10 | `tests/core/rules.test.js` `RULES-02 activeRules is the config picked by ACTIVE_FISCAL_YEAR`, `RULES-02 each key of rulesByFiscalYear equals its config fiscalYear` | yes |
| C11 | `tests/core/calculate.test.js` three `RULES-03` tests (rate 0.5, limit 40000, outcome differs) | yes |
| C12 | `tests/core/validateRules.test.js` eight `RULES-04` tests | yes - names the field for missing, wrong type, rate 1.5 and -0.1, limit 0, nested `otherObligations.assets`. The `null` case asserts `/rules/`, which every message contains, so it proves little. My probe: negative, NaN, Infinity, string limit, missing transport rate, NaN rate, missing url all throw naming the field |
| C13 | `tests/core/rules.test.js` `RULES-05 every year config in the repo passes validation` | yes |
| C14 | `tests/core/rules.test.js` `RULES-06 2026 values: limit, rates, years, date and reference` | yes |
| C15 | `tests/core/rules.test.js` `RULES-07 2026 other obligations are 200000 / 40000 / 177920 / 800000` | yes |
| C16 | `tests/dom.test.js` `UI-01 typing gives the same text, classes, result HTML and masked inputs as the legacy script` (+ `UI-01 the legacy reference itself shows the spec values`, `UI-01 loading the module entry ...`) | yes - see notes below |
| C17 | `tests/presenter.test.js` `UI-02 above the limit → "OBRIGATÓRIA" ...`, `UI-02 a 40000-limit config quotes "R$ 40.000,00" ...` | yes - title, class, red flag and full HTML asserted |
| C18 | `tests/presenter.test.js` `UI-03 below the limit ...`, `UI-03 taxable exactly at the limit ...`, `UI-03 a 40000-limit config ...` | yes |
| C19 | `tests/dom.test.js` `UI-04 on load every placeholder shows the active config text`; `tests/presenter.test.js` `UI-04 renders every 2026 placeholder ...` | yes - placeholders blanked first, then filled by `init` |
| C20 | `tests/html-rules.test.js` five `UI-05` tests (data-rule text, data-rule-href, every key used, no bare yearly value, identical to legacy, markup equals legacy) | no - the "no bare yearly value" scan only lists `35.584 177.920 800.000 200.000 40.000 2025 2026`. A bare `32%`, `0,08`, `09/11/2026` or `2.312` outside a span would pass, because the legacy-equality tests also have those bare. Only text nodes in `body` are scanned, not attributes or `<head>` (index.html has none today) |
| C21 | `tests/dom.test.js` `UI-06 with a different year config every placeholder shows that config`, `UI-06 typing under a different year config uses its limit and rates` | yes - all `[data-rule]` compared, href/name asserted, and body has no 2025/35.584/IN RFB Nº 2.312 left |
| C22 | `tests/dom.test.js` `UI-07 the adapter writes exactly the presenter view`; `tests/presenter.test.js` `UI-07 returns every result box and conta text as plain data keyed by element id` | yes |
| C23 | `npm run typecheck` | yes, weak - strict mode forces param types, but return types are inferred, so an export with no JSDoc `@returns` still passes |
| C24 | `npm run typecheck` | yes |
| C25 | `tests/core/purity.test.js` `TS-03 importing every module adds no globals, throws nothing and uses named exports only` | yes - covers types.js, rules/, presenter; only checks globals and `default`, not other side effects such as `console` output |
| C26 | `grep -q "ACTIVE_FISCAL_YEAR" CLAUDE.md && ! grep -q 'grep -rn "35.584' CLAUDE.md` | yes - CLAUDE.md lines 87-89 describe the flow |
| C27 | `grep -q "npm test" CLAUDE.md && grep -q "npm run typecheck" CLAUDE.md` | yes - lines 58-59 |
| C28 | `tests/core/purity.test.js` `LANG-01 no non-ASCII characters outside strings and comments`, `LANG-01 no Portuguese domain words in identifiers`, `LANG-01 no Portuguese domain words or accents in file names`, `LANG-01 removes strings, template text, comments and regex literals but keeps code`, `LANG-01 the language scan flags a planted Portuguese identifier and accented character` | no - the tokenizer does strip strings, templates, comments and regexes correctly (planted-case test is real), and the accent check catches `serviços`. But the pt word list has 11 stems: `isento`, `limite`, `tributavel`, `declaracao`, `valor`, `anoCalendario`, `rendimento` all pass (probed). Comments and test titles are stripped, so the spec's "comments, test titles" are not scanned (`types.js` still says "exercicio") |
| C29 | `grep -q "## Glossary" CLAUDE.md && grep -q "taxableIncome" CLAUDE.md` | yes - Glossary at line 93, rule at line 11 |

### Notes on the points asked about

- UI-01 golden master: sound. `tests/fixtures/calculator.legacy.js` and `index.legacy.html` are byte-identical to `7b33eee`. The legacy script only writes `innerText`, never reads it, so the textContent-backed shim is sound (no newlines in the strings). The snapshot compares textContent and className of the four boxes, every `[id^="conta-"]` element on its own side's document, `#result-title` text and class, `#result-text` innerHTML and all four masked input values. A missing or extra conta element on the new side changes the key set and fails. Stale reads are ruled out because each of the 212 sets (12 fixed, 200 seeded) is typed into both pages and the test requires more than 100 distinct snapshots. Not compared: intermediate states and the pre-typing state (the latter is covered by the markup-equals-legacy test).
- RULES-04: messages are `invalid rules: <dotted.path> is missing / must be ...`, and tests match the dotted path.
- CALC-04: exact limit is asserted at core and presenter level. A `>=` bug would fail both.

## Own examples

Throwaway script: `/private/tmp/claude-501/-Users-frederichelfer-Documents-calcMEI-web/af454919-4d45-4f4b-b42a-6792ae55184a/scratchpad/verifier/probe.mjs`

- Limit boundary: taxable 35584.009999999995 gives `mustDeclare` true. 35583.990000000005 gives false. Correct.
- Only expenses (500): netProfit -500, boxes show "R$ 0,00", conta shows "-500", "Não Obrigatória". Matches legacy semantics.
- Rate exactly 0 and exactly 1 pass the validator. Exempt 0 and 3000, percent "0%" and "100%", decimal "0" and "1". Correct.
- Validator: a negative, NaN, Infinity or string limit and a missing transport rate all throw naming the field. `lastUpdated: '09/11/2026'` does NOT throw (see findings).
| C30 | `tests/core/validateRules.test.js` `RULES-08 lastUpdated "…" throws naming lastUpdated` (5 cases) and `RULES-08 an ISO lastUpdated such as 2026-11-09 passes` | yes - added by the fix for finding 5. Asserts the exact message on 5 bad forms, including impossible dates |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C28/LANG-01: the pt-word scan is too narrow, and comments and test titles are never scanned | `PT_WORDS` in `tests/core/purity.test.js` has 11 stems; probe shows `isento`, `limite`, `tributavel`, `declaracao`, `valor`, `anoCalendario`, `rendimento` pass. `stripLiteralsAndComments` removes comments and strings, so spec text "comments, test titles ... English" is unchecked. `core/types.js` comment says "exercicio" | add the missing stems (isento, tributav, limite, declara, valor, rendimento, ano, conta) to `PT_WORDS`, and scan comments and `it(`/`describe(` titles for accented characters or the same stems (or narrow the criterion) || dabbca4 - C28 (LANG-01 comment, title and stem scans with planted cases) |
| C6/CALC-06: the DOM scan names only six globals | `DOM_REFERENCE` in `tests/core/purity.test.js`; probe: `el.querySelector`, `globalThis`, `location`, `fetch` are not flagged. A core module taking `doc` as a parameter and calling `doc.getElementById` passes | extend the pattern with `globalThis`, `self`, `location`, `querySelector`, `getElementById`, `addEventListener`, `innerHTML`, `textContent`, `Element`, `Node`, `Event`, `fetch`, with a planted-case assertion for each || dabbca4 - C6 (CALC-06 extended pattern, planted getElementById/querySelector/globalThis/location/fetch/textContent) |
| C20/UI-05: the "no bare yearly value" list is incomplete | `YEARLY_VALUES` in `tests/html-rules.test.js` lacks rates (`32%`, `0,32`), `09/11/2026` and `2.312`; the legacy-equality tests cannot catch a bare one because legacy has them bare. Attributes and `<head>` not scanned | add the rate forms, the date and the reference to `YEARLY_VALUES`, derive the list from `yearTexts(activeRules)` values, and also scan attributes and `<head>` text || dabbca4 - C20 (UI-05 values from yearTexts + head/attribute scan) |
| C12/RULES-04: the `null` case asserts `/rules/` | `tests/core/validateRules.test.js` last test; every message starts with "invalid rules:", so the assertion cannot fail | assert `/rules must be an object/` || dabbca4 - C12 (RULES-04 exact message) |
| `lastUpdated` format is not validated | probe: `lastUpdated: '09/11/2026'` passes `validateRules`; `yearTexts` then splits on `-` and renders "undefined/undefined/09/11/2026". No check names this rule | validate `/^\d{4}-\d{2}-\d{2}$/` in `validateRules`, with a RULES-04 test || dabbca4 - C30 (new RULES-08: lastUpdated must be a real YYYY-MM-DD date) |
