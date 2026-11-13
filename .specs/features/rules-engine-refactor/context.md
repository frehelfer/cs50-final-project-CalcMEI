# Rules Engine Refactor Context

**Gathered:** 2026-11-12
**Spec:** `.specs/features/rules-engine-refactor/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Move the IRPF/MEI calculation out of the DOM handler in `public/scripts/calculator.js` into a framework-agnostic core with unit tests. Put every year-dependent value (limit, rates, years, update date, legal reference) in one config per exercício, so next year's update means adding a config file and switching one constant. The site looks and behaves the same as it does today.

---

## Implementation Decisions

### Behaviour

- Pure refactor. Characterization tests lock in today's output, including the quirks: floating-point math, and the negative lucro apurado shown in the "conta" when despesas > receita.
- User: "Pure refactor (Recommended)"

### Year-dependent text in index.html

- The HTML marks placeholders with data-attributes, and JS fills them from the active year's config. The static HTML keeps the current values for SEO and no-JS visitors, and a unit test fails if the HTML and the config disagree.
- User: "JS fills from config (Recommended)"

### TypeScript readiness

- The core is plain ES modules with JSDoc types, checked by `tsc --noEmit` (checkJs). The site's build doesn't change. The core never touches the DOM, so a future framework app imports it unchanged.
- User: "JSDoc + type-check (Recommended)"

### Years

- There is one active year. Each exercício gets its own config file, kept as history and covered by tests, and one constant picks the active one. There is no year selector in the UI.
- User: "One active year (Recommended)"

### Language (2026-11-13)

- JS identifiers, file names, comments, tests and `data-rule` keys are in English. User-facing text stays pt-BR. The existing HTML ids/CSS classes stay until the redesign.
- Tax terms are translated to English, with a pt-BR ↔ EN glossary in CLAUDE.md.
- CLAUDE.md, .specs and commit messages are in English.
- User: "i want to migrate the code to english also" → "JS + files, keep HTML ids (Recommended)", "English + glossary (Recommended)", "English (Recommended)"

### Agent's Discretion

- Module layout, test runner and DOM test environment are decided in Design.

### Declined / Undiscussed Gray Areas → Assumptions

- See spec `Assumptions & Open Questions`.

---

## Specific References

- The sibling iOS app (github.com/frehelfer/calcMEI) has the same rules. Sharing the config with it is a deferred idea.

---

## Deferred Ideas

- Fix the quirks: integer-cents math, and a "conta" that matches the clamped lucro apurado.
- Migrate to TypeScript and a framework, and redesign the UX.
- Year selector.
- Share the rules config (JSON) with the iOS app.
- Update the footer copyright year ("© Copyright 2022").
