# STATE

## Decisions

### AD-001
- **Decision**: Domain logic lives in DOM-free native ES modules under `public/scripts/core/`, loaded by the browser with `<script type="module">` and no bundler. A pure presenter (`public/scripts/presenter.js`) turns results into display strings. Only `calculator-dom.js` touches the DOM.
- **Reason**: Keeps the deploy free of a build step and testable today. The future TS/framework app imports the same core.
- **Trade-off**: Source stays under `public/` until the migration moves it to `src/`.
- **Scope**: All calculation and display rules
- **Date**: 2026-11-12
- **Status**: active

### AD-002
- **Decision**: Each IRPF exercício's values live in `public/scripts/core/rules/<fiscalYear>.js`. `ACTIVE_FISCAL_YEAR` in `rules/index.js` picks the one the site uses. Year-dependent HTML text is marked `data-rule="…"` and filled from config, with a test that keeps the static HTML equal to the config.
- **Reason**: Turns the yearly update into one new file plus one constant, and keeps history.
- **Trade-off**: The static HTML still carries the values (for SEO), duplicated but guarded by a test.
- **Scope**: Annual update, index.html
- **Date**: 2026-11-12
- **Status**: active

### AD-003
- **Decision**: Tests run on Vitest with jsdom. Types are JSDoc checked by `tsc --noEmit` (checkJs).
- **Reason**: ESM-native, and carries over to the planned Vite/TypeScript migration.
- **Trade-off**: Adds devDependencies, and `node_modules/` stops being tracked in git.
- **Scope**: Whole repo
- **Date**: 2026-11-12
- **Status**: active

### AD-004
- **Decision**: Code is written in English: JS identifiers, file names, comments, tests, `data-rule` keys, docs (CLAUDE.md, .specs) and commit messages. User-facing text stays pt-BR. Existing HTML ids/CSS classes stay pt-BR until the redesign replaces the markup. Tax terms use English names, mapped to Receita Federal terms in a glossary in CLAUDE.md.
- **Reason**: Prepares the codebase for the TS/framework migration and for any contributor. User request on 2026-11-13.
- **Trade-off**: Code names no longer match the official pt-BR forms one to one (the glossary bridges them). Old commits and HTML ids stay in pt-BR.
- **Scope**: Whole repo. Supersedes the pt-BR identifier convention in CLAUDE.md.
- **Date**: 2026-11-13
- **Status**: active

## Handoff
