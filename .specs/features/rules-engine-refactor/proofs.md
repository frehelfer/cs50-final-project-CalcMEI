# rules-engine-refactor proofs

**HEAD**: e4b2d9c
**Tree**: clean
**Shell**: /bin/sh
**Result**: 32 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✓ CALC-01` | pass |
| C2 | `run unit / ✓ CALC-02` | pass |
| C3 | `run unit / ✓ CALC-03` | pass |
| C4 | `run unit / ✓ CALC-04` | pass |
| C5 | `run unit / ✓ CALC-05` | pass |
| C6 | `run unit / ✓ CALC-06` | pass |
| C7 | `run unit / ✓ CALC-07` | pass |
| C8 | `run unit / ✓ CALC-08` | pass |
| C9 | `run unit / ✓ RULES-01` | pass |
| C10 | `run unit / ✓ RULES-02` | pass |
| C11 | `run unit / ✓ RULES-03` | pass |
| C12 | `run unit / ✓ RULES-04` | pass |
| C13 | `run unit / ✓ RULES-05` | pass |
| C14 | `run unit / ✓ RULES-06` | pass |
| C15 | `run unit / ✓ RULES-07` | pass |
| C16 | `run unit / ✓ UI-01` | pass |
| C17 | `run unit / ✓ UI-02` | pass |
| C18 | `run unit / ✓ UI-03` | pass |
| C19 | `run unit / ✓ UI-04` | pass |
| C20 | `run unit / ✓ UI-05` | pass |
| C21 | `run unit / ✓ UI-06` | pass |
| C22 | `run unit / ✓ UI-07` | pass |
| C23 | `npm run typecheck` | pass |
| C24 | `npm run typecheck` | pass |
| C25 | `run unit / ✓ TS-03` | pass |
| C26 | `grep -q "ACTIVE_FISCAL_YEAR" CLAUDE.md && ! grep -q 'grep -rn "35.584' CLAUDE.md` | pass |
| C27 | `grep -q "npm test" CLAUDE.md && grep -q "npm run typecheck" CLAUDE.md` | pass |
| C28 | `run unit / ✓ LANG-01` | pass |
| C30 | `run unit / ✓ RULES-08` | pass |
| C29 | `grep -q "## Glossary" CLAUDE.md && grep -q "taxableIncome" CLAUDE.md` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npx vitest run` | pass |

## Output

`Run unit` - exit 0

```
 ✓ tests/html-rules.test.js > index.html placeholders > UI-05 the visible text is identical to the legacy page 10ms
 ✓ tests/html-rules.test.js > index.html placeholders > UI-05 the body markup is the legacy markup once the placeholder spans and attributes are removed 24ms
 ✓ tests/html-rules.test.js > index.html placeholders > UI-05 the calculator is loaded as an ES module 1ms
 ✓ tests/dom.test.js > DOM adapter golden master > UI-01 typing gives the same text, classes, result HTML and masked inputs as the legacy script 929ms
 ✓ tests/dom.test.js > DOM adapter golden master > UI-01 the legacy reference itself shows the spec values for services 100,000.00 13ms
 ✓ tests/dom.test.js > DOM adapter golden master > UI-07 the adapter writes exactly the presenter view 11ms
 ✓ tests/dom.test.js > DOM adapter placeholders > UI-04 on load every placeholder shows the active config text 11ms
 ✓ tests/dom.test.js > DOM adapter placeholders > UI-06 with a different year config every placeholder shows that config 12ms
 ✓ tests/dom.test.js > DOM adapter placeholders > UI-06 typing under a different year config uses its limit and rates 12ms
 ✓ tests/dom.test.js > calculator.js entry > UI-01 loading the module entry on index.html wires the page: services 100,000.00 shows "OBRIGATÓRIA" 20ms

 Test Files  8 passed (8)
      Tests  80 passed (80)
   Start at  16:20:02
   Duration  1.70s (tests 47%, import 27%, environment 23%, transform 2%, worker 1%)
```

`npm run typecheck` - exit 0

```
> calculadora-irpf-mei@1.0.0 typecheck
> tsc -p tsconfig.json
```

`grep -q "ACTIVE_FISCAL_YEAR" CLAUDE.md && ! grep -q 'grep -rn "35.584' CLAUDE.md` - exit 0

```
(no output)
```

`grep -q "npm test" CLAUDE.md && grep -q "npm run typecheck" CLAUDE.md` - exit 0

```
(no output)
```

`grep -q "## Glossary" CLAUDE.md && grep -q "taxableIncome" CLAUDE.md` - exit 0

```
(no output)
```
