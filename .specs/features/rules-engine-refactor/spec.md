# Rules Engine Refactor Specification

**Approved**: 2026-11-12 - user: "yes to both, approved — go to design"
**Amended**: 2026-11-12 - RULES-07 added and UI-04 extended at design - user: "Yes, add to config (Recommended)"
**Amended**: 2026-11-13 - code in English (LANG story) - user: "i want to migrate the code to english also"; scope "JS + files, keep HTML ids (Recommended)"; tax terms "English + glossary (Recommended)"; docs/commits "English (Recommended)"

## Problem Statement

All of the calculator's logic sits in one `input` handler in `public/scripts/calculator.js`. That handler mixes reading the DOM, the math and the formatting, and the 2026 limit is hard-coded in three places across JS and HTML. Nothing is tested. Every year, updating the rules means hunting for values by hand with `grep`, and one missed spot shows the wrong limit to users. The planned migration to TypeScript and a framework also needs a core it can reuse rather than rewrite.

## Goals

- [ ] The calculation rules live in a DOM-free core module with unit tests that run with `npm test`.
- [ ] The yearly update means adding one config file and changing one constant. No other file is edited.
- [ ] Users see the same page and the same numbers before and after the refactor.
- [ ] The core is ready for TypeScript: JSDoc types pass `tsc --noEmit`, and a framework can import the core as is.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Fixing float rounding / cents math | Pure refactor (user decision). Deferred. |
| Making the "conta" match the clamped lucro apurado | Pure refactor (user decision). Deferred. |
| Migrating to TypeScript (.ts files) or a framework | Future feature. This one only prepares the core. |
| UX redesign / visual changes | Future feature. |
| Renaming HTML ids / CSS classes to English | The redesign replaces that markup (user: "JS + files, keep HTML ids") |
| Year selector UI | One active year (user decision). |
| Sharing rules with the iOS app | Deferred idea. |
| Other IRPF obligation criteria not shown on the page | Only values the page displays move to config |
| contato/privacidade/termos/thanks pages, footer copyright | They don't depend on the yearly rules. |
| Changing Firebase Analytics, AdSense or deploy | Untouched. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| How far to go on behaviour | Pure refactor. Today's output is locked in by characterization tests. | User: "Pure refactor (Recommended)" | y |
| Year text in index.html | data-attribute placeholders filled from config, current values kept in the static HTML, a test checks that HTML = config | User: "JS fills from config (Recommended)" | y |
| TS readiness | ES modules + JSDoc, `tsc --noEmit` with checkJs | User: "JSDoc + type-check (Recommended)" | y |
| Years | One config per exercício, one active-year constant, no UI selector | User: "One active year (Recommended)" | y |
| `node_modules/` is tracked in git (7,611 files) | Stop tracking it (`git rm --cached`), keep it in `.gitignore`, and track `package-lock.json` | Adding test devDependencies would otherwise put thousands more files in git. The deploy publishes only `public/`. | y - user: "yes to both" |
| `.specs/` in git | Track it | `.gitignore` only ignores `.claude/` and `.agents/`. The specs record the project's decisions. | y - user: "yes to both" |
| How the browser loads the core | Native ES modules (`<script type="module">`) served from `public/`, no bundler | Keeps the deploy unchanged. All supported browsers run modules. | y - agent's discretion (Design) |
| Test runner | Vitest, with jsdom for the DOM adapter test | Fits the future Vite/framework migration. Runs ESM natively. | y - agent's discretion (Design) |
| `npm run build` never exits (webpack `watch: true`) | Leave as is | Not part of this feature | y - agent's discretion |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Tested calculation core ⭐ MVP

**User Story**: As the maintainer, I want the IRPF rules in a pure, tested module so that I can change them without breaking the result users see.

**Why P1**: Every other story depends on it.

**Acceptance Criteria**:

1. WHEN the core computes serviços 100.000,00, comércio 0, transporte 0, despesas 0 with the 2026 rules THEN the core SHALL return receita bruta 100000, lucro apurado 100000, lucro isento 32000, lucro tributável 68000 and obrigatória = true  <!-- CALC-01 -->
2. WHEN the core computes serviços 10.000, comércio 10.000, transporte 10.000, despesas 0 THEN the core SHALL return lucro isento 5600 (10000×0,32 + 10000×0,08 + 10000×0,16)  <!-- CALC-02 -->
3. WHEN the core computes serviços 50.000,00 with no other values THEN the core SHALL return lucro tributável 34000 and obrigatória = false  <!-- CALC-03 -->
4. WHEN lucro tributável equals the limit exactly (serviços 100.000,00, despesas 32.416,00 → 35584,00) THEN the core SHALL return obrigatória = false  <!-- CALC-04 -->
5. WHEN despesas exceed receita bruta (serviços 1.000,00, despesas 5.000,00) THEN the core SHALL return lucro apurado −4000 and lucro tributável 0 or less, and the view SHALL show "R$ 0,00" for lucro apurado and lucro tributável and "-4.000" in `#conta-lucro-apurado`  <!-- CALC-05 -->
6. The core modules SHALL NOT reference `document`, `window` or any DOM API  <!-- CALC-06 -->
7. WHEN the core parses an input string THEN it SHALL drop every non-digit character and read the rest as cents ("R$ 1.234,56" → 1234.56, "" → 0)  <!-- CALC-07 -->
8. WHEN the core formats the money mask for "12345" THEN it SHALL return "R$ 123,45" (pt-BR, BRL)  <!-- CALC-08 -->

**Independent Test**: `npm test` runs the core tests with no browser.

---

### P1: Rules per year in one config ⭐ MVP

**User Story**: As the maintainer, I want each exercício's rules in their own config file so that next year's update is one new file plus one constant.

**Why P1**: This is the recurring task the refactor exists to simplify.

**Acceptance Criteria**:

1. The system SHALL keep each exercício's rules in its own config holding: exercício, ano-calendário, limite de rendimento tributável, the rates for serviços, comércio and transporte, the last-update date, and the legal reference (name + URL)  <!-- RULES-01 -->
2. The system SHALL pick the rules the site uses from one active-year constant  <!-- RULES-02 -->
3. WHEN the core receives a different year's config (e.g. a test config with limit 40000 and rate 0,5 for serviços) THEN it SHALL compute with that config's limit and rates, not 2026's  <!-- RULES-03 -->
4. IF a year config lacks a required field, or a rate falls outside 0–1, or the limit is not a positive number THEN the config validator SHALL throw an error naming the field  <!-- RULES-04 -->
5. The test suite SHALL validate every year config in the repo  <!-- RULES-05 -->
6. The 2026 config SHALL hold limit 35584, rates 0,32 / 0,08 / 0,16, ano-calendário 2025, exercício 2026, last-update date 09/11/2026 and reference "IN RFB Nº 2.312/2026" with today's URL  <!-- RULES-06 -->
7. The year config SHALL hold the "outras obrigações" limits shown in index.html, with 2026 values: rendimentos isentos 200000, operações em bolsa 40000, receita bruta rural 177920, bens 800000  <!-- RULES-07 -->

**Independent Test**: Run the core tests against a made-up year config and watch the results change.

---

### P1: Page unchanged and driven by config ⭐ MVP

**User Story**: As a MEI user, I want the calculator to work exactly as before so that the refactor costs me nothing.

**Why P1**: A pure refactor must not regress the live site.

**Acceptance Criteria**:

1. WHEN the user types in any of the four inputs THEN the page SHALL mask that input as BRL and update `#receita-bruta-apurado`, `#lucro-apurado`, `#lucro-isento`, `#lucro-tributável` and every `#conta-*` element with the same text as today's `calculator.js`  <!-- UI-01 -->
2. WHEN lucro tributável exceeds the active limit THEN the page SHALL show `#result-title` "OBRIGATÓRIA" with class `red`, add class `red` to `#lucro-tributável`, and show today's "superior a R$ 35.584,00" text with the limit taken from config  <!-- UI-02 -->
3. WHEN lucro tributável does not exceed the active limit THEN the page SHALL show `#result-title` "Não Obrigatória" with class `green`, remove class `red` from `#lucro-tributável`, and show today's "maior que R$ 35.584,00" text with the limit taken from config  <!-- UI-03 -->
4. WHEN the page loads THEN the page SHALL fill every year-dependent placeholder in index.html (ano-calendário, exercício, last-update date, legal reference text and link, limit in R$, the 32% / 8% / 16% rates and their 0,32 / 0,08 / 0,16 form in the "conta", and the four "outras obrigações" limits) from the active config  <!-- UI-04 -->
5. The static text of every placeholder in index.html SHALL equal what the active config renders for it, and a unit test SHALL fail when they differ  <!-- UI-05 -->
6. WHEN the page loads with a different year config (test) THEN every placeholder SHALL show that config's values  <!-- UI-06 -->
7. The rules that pick result text, classes and formatted values SHALL run in a DOM-free presenter, and the DOM adapter SHALL only read inputs and write the presenter's output  <!-- UI-07 -->

**Independent Test**: Open index.html in jsdom, type values, compare against the expected strings. Then serve `public/` and use the calculator by hand.

---

### P2: Ready for TypeScript and a framework

**User Story**: As the maintainer, I want typed, framework-agnostic modules so that the later TS + framework migration reuses the core as is.

**Why P2**: The migration itself is future work. This story only lowers its cost.

**Acceptance Criteria**:

1. The core and presenter modules SHALL declare their inputs and outputs with JSDoc types  <!-- TS-01 -->
2. WHEN `npm run typecheck` runs THEN `tsc --noEmit` with `checkJs` SHALL exit 0 over the core and presenter  <!-- TS-02 -->
3. The core and presenter SHALL be ES modules with named exports and no side effects on import  <!-- TS-03 -->

**Independent Test**: `npm run typecheck` exits 0. Importing the core in Node runs nothing.

---

### P2: Documented annual update

**User Story**: As the maintainer, I want the yearly update steps written down so that I follow them without grepping.

**Why P2**: The process changes, so CLAUDE.md's "Atualização anual" section goes stale.

**Acceptance Criteria**:

1. The CLAUDE.md "Atualização anual" section SHALL describe the new steps: add the year config, switch the active-year constant, run `npm test`  <!-- DOC-01 -->
2. The CLAUDE.md "Comandos" section SHALL list `npm test` and `npm run typecheck`  <!-- DOC-02 -->

---

### P2: Code in English

**User Story**: As the maintainer, I want the code in English so that it reads naturally in the future TypeScript/framework codebase and to any contributor.

**Why P2**: It doesn't change behaviour, but it's cheapest while the code is being rewritten anyway.

**Acceptance Criteria**:

1. The JS modules, file names, comments, test titles and `data-rule` keys SHALL use English identifiers with no pt-BR words or accented characters outside string literals. User-facing text and the existing HTML ids/CSS classes stay pt-BR  <!-- LANG-01 -->
2. CLAUDE.md SHALL be written in English, state the rule "English code, pt-BR user-facing text", and hold a pt-BR ↔ EN glossary of the tax terms (exercício → fiscalYear, ano-calendário → calendarYear, receita bruta → grossRevenue, lucro apurado → netProfit, rendimento isento → exemptIncome, rendimento tributável → taxableIncome)  <!-- LANG-02 -->

**Independent Test**: A test scans the JS sources for pt identifiers. Read CLAUDE.md's glossary.

---

## Edge Cases

- WHEN every input is empty THEN the view SHALL show "R$ 0,00" in every result and "Não Obrigatória"  <!-- covered by CALC-07 + UI-03 -->
- IF the user types letters or symbols THEN the mask SHALL ignore them (CALC-07)
- WHEN an input holds 999.999.999,99 THEN the core SHALL compute without throwing, and the view SHALL format it in pt-BR

**Implicit-requirement sweep:** input validation → CALC-07/08. Failure states → RULES-04 (an invalid config fails the tests before deploy). State transitions (obrigatória ↔ não) → UI-02/03. Persistence, idempotency, auth, concurrency and data lifecycle are N/A because nothing is stored and there is no backend. Observability is N/A because Analytics stays untouched. External-dependency failure is N/A because the calculation calls no external service.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CALC-01 | P1: Tested core | Design | Pending |
| CALC-02 | P1: Tested core | Design | Pending |
| CALC-03 | P1: Tested core | Design | Pending |
| CALC-04 | P1: Tested core | Design | Pending |
| CALC-05 | P1: Tested core | Design | Implementing |
| CALC-06 | P1: Tested core | Design | Pending |
| CALC-07 | P1: Tested core | Design | Pending |
| CALC-08 | P1: Tested core | Design | Pending |
| RULES-01 | P1: Rules per year | Design | Pending |
| RULES-02 | P1: Rules per year | Design | Pending |
| RULES-03 | P1: Rules per year | Design | Pending |
| RULES-04 | P1: Rules per year | Design | Pending |
| RULES-05 | P1: Rules per year | Design | Pending |
| RULES-06 | P1: Rules per year | Design | Pending |
| RULES-07 | P1: Rules per year | Design | Pending |
| UI-01 | P1: Page unchanged | Design | Pending |
| UI-02 | P1: Page unchanged | Design | Implementing |
| UI-03 | P1: Page unchanged | Design | Implementing |
| UI-04 | P1: Page unchanged | Design | Implementing |
| UI-05 | P1: Page unchanged | Design | Implementing |
| UI-06 | P1: Page unchanged | Design | Pending |
| UI-07 | P1: Page unchanged | Design | Implementing |
| TS-01 | P2: TS ready | Design | Pending |
| TS-02 | P2: TS ready | Design | Pending |
| TS-03 | P2: TS ready | Design | Pending |
| DOC-01 | P2: Docs | Design | Pending |
| DOC-02 | P2: Docs | Design | Pending |
| LANG-01 | P2: Code in English | Design | Pending |
| LANG-02 | P2: Code in English | Design | Pending |

**Coverage:** 29 total, 0 mapped to tasks, 29 unmapped ⚠️ (mapped in Tasks)

---

## Sources

- `public/scripts/calculator.js` (commit 7b33eee): the current behaviour the characterization tests lock in
- `CLAUDE.md` "Regras de negócio" and "Atualização anual": the rules and the yearly process

---

## Success Criteria

- [ ] Next year's update edits exactly two things: a new year config and the active-year constant. `npm test` passes.
- [ ] The rendered output of the live page is identical for the same inputs (UI-01..03 green).
- [ ] `npm test` and `npm run typecheck` both exit 0.
