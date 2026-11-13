# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Language scans must cover every place the rule names (identifiers, comments, test titles) and list the domain stems from the glossary, with a planted case per stem
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: rules-engine-refactor
- evidence: C28 tests/core/purity.test.js PT_WORDS (tests)
- last seen: 2026-11-13T19:20:32Z

### L-002 - A DOM-freedom scan must flag DOM methods called on passed-in objects, not only DOM globals
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: rules-engine-refactor
- evidence: C6 tests/core/purity.test.js DOM_REFERENCE (tests)
- last seen: 2026-11-13T19:20:32Z

### L-003 - Derive the forbidden-values list of a no-hard-coding check from the config itself, and scan attributes and head as well as body text
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: rules-engine-refactor
- evidence: C20 tests/html-rules.test.js YEARLY_VALUES (tests)
- last seen: 2026-11-13T19:20:32Z

### L-004 - Assert the full error message, not a word every error message contains
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: rules-engine-refactor
- evidence: C12 tests/core/validateRules.test.js null case (tests)
- last seen: 2026-11-13T19:20:32Z

### L-005 - Validate the format of every config string the presenter parses, not only its type
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `core` · harmful: 0
- features: rules-engine-refactor
- evidence: verification finding 5 core/validateRules.js lastUpdated (core)
- last seen: 2026-11-13T19:20:32Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
