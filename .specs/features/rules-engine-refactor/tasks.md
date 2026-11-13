# Rules Engine Refactor Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/rules-engine-refactor/design.md`
**Status**: Approved
**Approved**: 2026-11-13 - user: "approved, create the branch and commit, then wait"
**Build**: `npm run typecheck; npx vitest run`
**Run unit**: `npx vitest run --reporter=verbose`

---

## Test Coverage Matrix

> Generated from the spec and design. The repo has no tests or guidelines yet (no `AGENTS.md`, no test config), so strong defaults apply. The runner is Vitest + jsdom per AD-003. Test titles start with their requirement ID.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Core (`public/scripts/core/**`) | unit | All branches; 1:1 to CALC/RULES ACs; every listed edge case | `tests/core/*.test.js` | `npx vitest run tests/core` |
| Presenter (`public/scripts/presenter.js`) | unit | All branches (clamp, obrigatória/não, classes); UI-02/03/07, CALC-05 view | `tests/presenter.test.js` | `npx vitest run tests/presenter.test.js` |
| DOM adapter + index.html | integration (jsdom) | Golden master vs the legacy script over fixed + seeded random inputs; placeholders filled from config; static HTML = config | `tests/dom.test.js`, `tests/html-rules.test.js` | `npx vitest run tests/dom.test.js tests/html-rules.test.js` |
| Typedefs / config files / tooling | none | Build gate only (typecheck) | - | `npm run typecheck` |
| Docs (CLAUDE.md) | none | Build gate + grep proof | - | - |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Repo | Git-index-only task | `test -z "$(git ls-files node_modules)"` |
| Config | tsconfig-only task (no inputs yet) | `npx tsc -p tsconfig.json --showConfig` |
| Quick | After tasks with unit tests only | `npx vitest run` |
| Full | After tasks with jsdom integration tests | `npx vitest run` |
| Build | Tooling/typedef/doc tasks and phase ends | `npm run typecheck; npx vitest run` |

---

## Execution Plan

Phases run in sequence. Tasks within a phase run in order.

### Phase 1: Tooling

```
T1 → T2 → T3
```

### Phase 2: Core

```
T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Presentation and page

```
T11 → T12 → T13 → T14 → T15
```

### Phase 4: Docs

```
T16
```

---

## Task Breakdown

### T1: Stop tracking node_modules

**What**: Remove `node_modules/` from the git index with `git rm -r --cached node_modules`. It's already in `.gitignore`, and the files stay on disk.
**Where**: git index (`node_modules/`)
**Depends on**: None
**Reuses**: existing `.gitignore` entry
**Requirement**: spec assumption "node_modules tracked" (confirmed)

**Done when**:

- [ ] `git ls-files node_modules` prints nothing
- [ ] `public/` deploy content unchanged

**Tests**: none
**Gate**: repo
**Commit**: `chore: stop tracking node_modules`

---

### T2: Add test and typecheck tooling to package.json

**What**: Add devDependencies `vitest`, `jsdom`, `typescript` (pinned to exact versions), plus scripts `"test": "vitest run"` and `"typecheck": "tsc -p tsconfig.json"`. Commit `package-lock.json`.
**Where**: `package.json`
**Depends on**: T1
**Reuses**: existing package.json
**Requirement**: TS-02, DOC-02 (commands exist)

**Done when**:

- [ ] `npm install` succeeds and `npx vitest --version` runs
- [ ] The webpack `build` script is unchanged

**Tests**: none
**Gate**: repo
**Commit**: `chore: add vitest, jsdom and typescript`

---

### T3: Add tsconfig.json for JSDoc type checking

**What**: `allowJs`, `checkJs`, `noEmit`, `strict`, `target`/`lib` ES2022 (no DOM), `module` ESNext, `moduleResolution` bundler, `include` = `public/scripts/core/**/*.js` and `public/scripts/presenter.js`.
**Where**: `tsconfig.json`
**Depends on**: T2
**Reuses**: -
**Requirement**: TS-02

**Done when**:

- [ ] `npx tsc -p tsconfig.json --showConfig` prints the settings above (tsc errors with "No inputs" until T4 adds the first file, so the full typecheck gate starts at T4)

**Tests**: none
**Gate**: config
**Commit**: `chore: configure tsc --noEmit with checkJs`

---

### T4: Define JSDoc types for the core

**What**: Typedefs `YearRules`, `Inputs`, `Result`, `ResultView`, `RuleKey` as in design.md "Data Models", in an ES module with `export {}`.
**Where**: `public/scripts/core/types.js`
**Depends on**: None (runs after Phase 1)
**Reuses**: design.md Data Models
**Requirement**: TS-01

**Done when**:

- [ ] `npm run typecheck` exits 0

**Tests**: none
**Gate**: build
**Commit**: `feat(core): add JSDoc domain types`

---

### T5: Money parsing and formatting

**What**: `parseBRL`, `maskBRL`, `formatBRL`, `formatNumber`, `formatLimit`, `formatRate`, using the same expressions as today's `calculator.js`.
**Where**: `public/scripts/core/currency.js`
**Depends on**: T4
**Reuses**: `masks.money` and the `Intl.NumberFormat` calls from `public/scripts/calculator.js`
**Requirement**: CALC-07, CALC-08

**Done when**:

- [ ] `tests/core/currency.test.js` covers "R$ 1.234,56" → 1234.56, "" → 0, letters ignored, "12345" → "R$ 123,45", 999.999.999,99 formatted, `formatLimit(35584)` = "R$ 35.584,00" with a regular space, `formatRate(0.32)` = 32% / 0,32
- [ ] Quick gate passes and typecheck exits 0

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): add BRL parsing and formatting`

---

### T6: Year-config validator

**What**: `validateRules(rules)` throws `Error` naming the field when a field is missing or wrongly typed, when a rate is outside 0–1, or when a limit is ≤ 0.
**Where**: `public/scripts/core/validateRules.js`
**Depends on**: T5
**Reuses**: `YearRules` typedef
**Requirement**: RULES-04

**Done when**:

- [ ] `tests/core/validateRules.test.js` has one failing-config case per rule (missing field, rate 1.5, rate −0.1, limit 0, missing otherObligations.assets), each asserting that the field name appears in the message, plus one valid config that passes
- [ ] Quick gate passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): validate yearly rules config`

---

### T7: 2026 rules config

**What**: `rules2026` with limit 35584, rates 0.32/0.08/0.16, calendarYear 2025, fiscalYear 2026, `lastUpdated` "2026-11-09", reference "IN RFB Nº 2.312/2026" + the current URL, and otherObligations 200000/40000/177920/800000.
**Where**: `public/scripts/core/rules/2026.js`
**Depends on**: T6
**Reuses**: values from `public/index.html` and `calculator.js`
**Requirement**: RULES-01, RULES-06, RULES-07

**Done when**:

- [ ] `tests/core/rules.test.js` asserts every 2026 value and that `validateRules(rules2026)` passes
- [ ] Quick gate passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): add IRPF 2026 rules`

---

### T8: Active-year switch

**What**: `rulesByFiscalYear`, `ACTIVE_FISCAL_YEAR = 2026`, `activeRules`.
**Where**: `public/scripts/core/rules/index.js`
**Depends on**: T7
**Reuses**: `rules2026`
**Requirement**: RULES-02, RULES-05

**Done when**:

- [ ] `tests/core/rules.test.js` asserts `activeRules === rulesByFiscalYear[ACTIVE_FISCAL_YEAR]`, that each key equals its config's `fiscalYear`, and runs `validateRules` over every entry
- [ ] Quick gate passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): select active fiscal year`

---

### T9: Calculation

**What**: `calculateIrpf(inputs, rules)` with today's expressions in today's order (design.md "core/calculate.js").
**Where**: `public/scripts/core/calculate.js`
**Depends on**: T8
**Reuses**: `public/scripts/calculator.js` lines 47-115 (math only)
**Requirement**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, RULES-03

**Done when**:

- [ ] `tests/core/calculate.test.js` has one test per AC using the spec's numbers, plus a made-up config (limit 40000, serviços 0.5) that changes the result
- [ ] Quick gate passes and typecheck exits 0

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): calculate taxable income`

---

### T10: Purity test for core and presenter

**What**: A test that scans every file under `public/scripts/core/` and `presenter.js` for `document`/`window`/`HTMLElement`, and imports each module to assert it has no side effects (no globals added, nothing thrown, no DOM access).
**Where**: `tests/core/purity.test.js`
**Depends on**: T9
**Reuses**: -
**Requirement**: CALC-06, TS-03, LANG-01

**Done when**:

- [ ] The same test strips string literals and comments from every `public/scripts/**/*.js` and `tests/**/*.js` file (except `tests/fixtures/`), and asserts there are no non-ASCII characters and none of the pt words `receita|lucro|despesa|regra|exercicio|calcul|moeda|serviço|comercio|transporte|resultado|apresent` in identifiers

- [ ] Test fails when a `document.` reference is planted (checked once by hand, then reverted)
- [ ] Quick gate passes

**Tests**: unit
**Gate**: quick
**Commit**: `test(core): enforce DOM-free, side-effect-free core`

---

### T11: Presenter - result view model

**What**: `presentResult(result, rules)` returns the `ResultView`. It covers every `#conta-*` and result-box text, the clamp to "R$ 0,00", the red/green classes, and the result HTML text taken character for character from `calculator.js` with the limit from `formatLimit`.
**Where**: `public/scripts/presenter.js`
**Depends on**: None (runs after Phase 2)
**Reuses**: `calculator.js` lines 37-129 (display only); `core/currency.js`
**Requirement**: UI-02, UI-03, UI-07, CALC-05

**Done when**:

- [ ] `tests/presenter.test.js` covers obrigatória/não (title, class, HTML text containing "R$ 35.584,00"), the negative apurado clamp and its "-4.000" conta, tributável ≤ 0 → "R$ 0,00", and a 40000-limit config whose text shows "R$ 40.000,00"
- [ ] Quick gate passes and typecheck exits 0

**Tests**: unit
**Gate**: quick
**Commit**: `feat: add result presenter`

---

### T12: Presenter - year texts

**What**: `yearTexts(rules)` returns the string for every `RuleKey`: years, last-update date (dd/mm/aaaa), reference name and URL, limit, rate percentage and decimal forms, and the four otherObligations limits ("R$ 200.000,00" style).
**Where**: `public/scripts/presenter.js` (modify)
**Depends on**: T11
**Reuses**: `core/currency.js`
**Requirement**: UI-04

**Done when**:

- [ ] `tests/presenter.test.js` asserts every key for `rules2026` against the strings in today's index.html, plus one key changed under a made-up config
- [ ] Quick gate passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat: render year texts from config`

---

### T13: index.html placeholders and module script

**What**: Wrap every year-dependent value in `<span data-rule="<chave>">current value</span>`. Give the legal-reference `<a>` `data-rule="referência"` for both text and href. Change the calculator `<script>` to `type="module"`. Visible text stays byte-identical.
**Where**: `public/index.html`
**Depends on**: T12
**Reuses**: -
**Requirement**: UI-05

**Done when**:

- [ ] `tests/html-rules.test.js` asserts that every `[data-rule]` static text (and href) equals `yearTexts(activeRules)`, that every key appears at least once, and that no text node outside a placeholder contains "35.584", "177.920", "800.000", "200.000", "40.000", "2025" or "2026"
- [ ] The page's `textContent` is identical before and after, once spans are ignored (assertion in the same test, against the legacy HTML from `git show 7b33eee:public/index.html` saved to `tests/fixtures/index.legacy.html`)
- [ ] Full gate passes

**Tests**: integration
**Gate**: full
**Commit**: `feat: mark yearly values in index.html with data-rule`

---

### T14: DOM adapter

**What**: `init(doc, rules = activeRules)` fills `[data-rule]` and binds the `input` listeners (mask target → read inputs → calculateIrpf → presentResult → write).
**Where**: `public/scripts/calculator-dom.js`
**Depends on**: T13
**Reuses**: core, presenter; the legacy script frozen at `tests/fixtures/calculator.legacy.js` (from `git show 7b33eee:public/scripts/calculator.js`) as golden master
**Requirement**: UI-01, UI-04, UI-06

**Done when**:

- [ ] `tests/dom.test.js` UI-01: two JSDOM windows of index.html, legacy (with an `innerText`→`textContent` shim) vs new. For 12 fixed input sets (spec examples, boundary, negative, empty, huge) plus 200 seeded random ones, typing into each input yields identical text, classes and `#result-text` innerHTML for every result and `#conta-*` element
- [ ] UI-04: after `init`, every placeholder shows `yearTexts(activeRules)`. UI-06: with the made-up config, every placeholder shows that config's values
- [ ] Full gate passes and typecheck exits 0

**Tests**: integration
**Gate**: full
**Commit**: `feat: add calculator DOM adapter`

---

### T15: Replace calculator.js with the module entry

**What**: `public/scripts/calculator.js` becomes `import { init } from './calculator-dom.js'; init(document);`.
**Where**: `public/scripts/calculator.js`
**Depends on**: T14
**Reuses**: -
**Requirement**: UI-01

**Done when**:

- [ ] `tests/dom.test.js` adds one case that loads index.html with its real `<script type="module">` (jsdom + file resources, or a static import of the entry against a jsdom global) and types "100000" into serviços, which shows "OBRIGATÓRIA"
- [ ] Manual walk: `npx serve public`, type the spec values, compare against production calcmei.com.br
- [ ] Build gate passes

**Tests**: integration
**Gate**: build
**Commit**: `refactor: turn calculator.js into an ES module entry`

---

### T16: Update CLAUDE.md

**What**: Rewrite CLAUDE.md in English. The language rule becomes: English code, pt-BR user-facing text, existing HTML ids/CSS classes kept until the redesign. Add the pt-BR ↔ EN glossary from design.md. Rewrite the yearly update (copy `rules/2026.js` → `rules/<year>.js`, update the values, add it to `rulesByFiscalYear`, switch `ACTIVE_FISCAL_YEAR`, run `npm test`, which fails until the static HTML values match). Add `npm test` / `npm run typecheck` to the commands, and list the new files in the structure.
**Where**: `CLAUDE.md`
**Depends on**: None (runs after Phase 3)
**Reuses**: -
**Requirement**: DOC-01, DOC-02, LANG-02

**Done when**:

- [ ] CLAUDE.md is in English, describes the new flow and the language rule, and includes the glossary. No instruction to grep for the limit remains
- [ ] Build gate passes

**Tests**: none
**Gate**: build
**Commit**: `docs: document config-based yearly update in English`

---

## Checks

**C1** - serviços 100.000 → receita 100000, apurado 100000, isento 32000, tributável 68000, obrigatória (CALC-01, AC 1)
Proof: run unit | ✓ CALC-01

**C2** - 10.000 in each category → isento 5600 (CALC-02, AC 2)
Proof: run unit | ✓ CALC-02

**C3** - serviços 50.000 → tributável 34000, não obrigatória (CALC-03, AC 3)
Proof: run unit | ✓ CALC-03

**C4** - tributável exactly 35584 → não obrigatória (CALC-04, AC 4)
Proof: run unit | ✓ CALC-04

**C5** - despesas > receita → apurado −4000 in the core; "R$ 0,00" in the boxes; "-4.000" in the conta (CALC-05, AC 5)
Proof: run unit | ✓ CALC-05

**C6** - The core and presenter contain no DOM reference (CALC-06, AC 6)
Proof: run unit | ✓ CALC-06

**C7** - The parser drops non-digits and reads cents ("R$ 1.234,56" → 1234.56, "" → 0) (CALC-07, AC 7)
Proof: run unit | ✓ CALC-07

**C8** - The mask "12345" → "R$ 123,45" (CALC-08, AC 8)
Proof: run unit | ✓ CALC-08

**C9** - The 2026 config has every required field (RULES-01, AC 1)
Proof: run unit | ✓ RULES-01

**C10** - `activeRules` is picked by `ACTIVE_FISCAL_YEAR` (RULES-02, AC 2)
Proof: run unit | ✓ RULES-02

**C11** - A made-up config (limit 40000, serviços 0.5) changes the result (RULES-03, AC 3)
Proof: run unit | ✓ RULES-03

**C12** - The validator throws naming the field for each invalid case (RULES-04, AC 4)
Proof: run unit | ✓ RULES-04

**C13** - Every year config in the repo passes validation (RULES-05, AC 5)
Proof: run unit | ✓ RULES-05

**C14** - The 2026 values equal the spec's (RULES-06, AC 6)
Proof: run unit | ✓ RULES-06

**C15** - The 2026 outras obrigações are 200000/40000/177920/800000 (RULES-07, AC 7)
Proof: run unit | ✓ RULES-07

**C16** - Typing gives the same output as the legacy script over 212 input sets (UI-01, AC 1)
Proof: run unit | ✓ UI-01

**C17** - Above the limit: "OBRIGATÓRIA", red, text quoting the configured limit (UI-02, AC 2)
Proof: run unit | ✓ UI-02

**C18** - At or below the limit: "Não Obrigatória", green, text quoting the configured limit (UI-03, AC 3)
Proof: run unit | ✓ UI-03

**C19** - On load, every placeholder shows the active config's text (UI-04, AC 4)
Proof: run unit | ✓ UI-04

**C20** - The static HTML placeholders equal the active config, and no bare yearly value remains (UI-05, AC 5)
Proof: run unit | ✓ UI-05

**C21** - With a made-up config, every placeholder shows its values (UI-06, AC 6)
Proof: run unit | ✓ UI-06

**C22** - Display rules live in the DOM-free presenter, and the adapter only copies its output (UI-07, AC 7)
Proof: run unit | ✓ UI-07

**C23** - The core and presenter have JSDoc types on their exports (TS-01, AC 1)
Proof: `npm run typecheck`

**C24** - `tsc --noEmit` with checkJs exits 0 (TS-02, AC 2)
Proof: `npm run typecheck`

**C25** - Importing the core has no side effects (TS-03, AC 3)
Proof: run unit | ✓ TS-03

**C26** - CLAUDE.md describes the config-based yearly update (DOC-01, AC 1)
Proof: `grep -q "ACTIVE_FISCAL_YEAR" CLAUDE.md && ! grep -q 'grep -rn "35.584' CLAUDE.md`

**C27** - CLAUDE.md lists `npm test` and `npm run typecheck` (DOC-02, AC 2)
Proof: `grep -q "npm test" CLAUDE.md && grep -q "npm run typecheck" CLAUDE.md`

**C28** - JS identifiers, file names and test titles are English, with no accents and no pt domain words outside strings (LANG-01, AC 1)
Proof: run unit | ✓ LANG-01

**C29** - CLAUDE.md states the English-code rule and has the pt-BR ↔ EN glossary (LANG-02, AC 2)
Proof: `grep -q "## Glossary" CLAUDE.md && grep -q "taxableIncome" CLAUDE.md`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6 → T7 → T8 → T9 → T10
Phase 3:  T11 → T12 → T13 → T14 → T15
Phase 4:  T16
```

16 tasks → batches: [Phase 1], [Phase 2], [Phase 3 + Phase 4]. The sub-agent offer comes at Execute.
