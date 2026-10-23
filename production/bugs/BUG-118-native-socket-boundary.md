# BUG-118 — Validate native sockets before normalizing imported state

Status: Fixed in 6bbf505; native v19 rollout remains unregistered.
Severity: High.
Owner: engine-dev / qa-engineer.

## Reproduction

Baseline: c031320 plus uncommitted native v19 boundary, 2026-10-23.
Environment: Vitest pure engine, no browser/viewport/locale or RNG dependency.

1. Start with a validated native v19 target fixture.
2. Add socketContents (even own undefined) to a frozen-v16 quarantine item.
3. Alternatively put an accessor on inventory, item level, affix Map metadata,
   old quarantine origin, a symbol, or a nested Map key/value or Set value.
4. Alternatively validate18 then migrate legal empty item IDs, empty merc keys,
   open equipment keys, or unsupported gear at those original locations.
5. Invoke validateSocketSave and observe admission, getter execution or rejection.

Expected: reserved new fields cannot enter old16 payloads; no imported getter
executes; all valid historical payloads and their exact locations remain
convertible. Existing old16 provenance and internal duplicate-ID rules stay frozen.

Actual: frozen16 socketContents is admitted; inventory/origin getters execute;
other getters escape validation; native identity/key restrictions reject legal
history. New18 provenance reuses a more restrictive old16 origin contract.

Evidence: src/engine/save/native-v19.test.ts; causal failures recorded in
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-v19-materials-rh7euwd2/native-review-corrected-red.log
(20 failures/31 controls; two of these failures have the separate BUG-119 cause).
Initial draft reproduction copied two descriptors through spread; corrected
before this causal run. No production fix preceded reproduction.

Root cause: semantic checks follow normalizing reads, historical quarantine
has no v19 reservation check, and new18 provenance/ownership uses restrictions
that frozen18 never imposed. Independent read-only QA reproduced the concerns
by source tracing and supports a separate closed new18 origin type.

Workaround: do not register or activate v19 until this boundary is corrected.

Additional reproduction: inherited Map.entries and Array.map accessors execute
inside normalizeMaps after the descriptor pass. native-intrinsic-red.log records
both causal failures (the third failure was a test-only maxMana typo, corrected
to the actual manaMax field). Normalize through intrinsic data traversal instead
of dispatching imported container methods.

Follow-up independent review found inherited root inventory/questProgress and
sparse affix-index accessors bypass the own-only scan. native-inherited-red.log
records three causal getter paths plus two inherited-container admission
contract refusals. The guard must inspect imported prototype descriptors before
any semantic read; normalization must read only own array index values.

## Fix and validation

Local commit `6bbf505` corrects the reproduced boundary/migration paths.
Regression tests: `src/engine/save/native-v19.test.ts` and
`src/engine/save/migrate-v19.test.ts`. Latest focused run passes183 tests/3files;
full unit10764/383PASS with2 existing opt-in skips, source freeze unchanged.
Engine5236/145, typecheck, full lint and production build pass. This is source
validation only; no native-v19 runtime or browser acceptance is claimed.
