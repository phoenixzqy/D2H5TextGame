# BUG-182 — Preserve the initial status prefix before Vigor capacity observations

Severity: High
Status: Fixed locally in the Vigor batch; full regression passed; independent acceptance open
Affected systems: engine-dev (initial observations), frontend-dev (native recording publication)
Owner: root sole writer for the active local goal

## Reproduction

Build: c46a1b2 plus local Vigor implementation; deterministic Vitest native
production-path reproduction, no browser/viewport dependency; both locales.
Seed: native run7 / challengeOrdinal0; direct engine42.

1. Publicly allocate Prayer, Cleansing, Defiance and Vigor on an eligible Paladin.
2. Explicitly select Vigor and start the real native first wave.
3. Publish the engine recording through the unchanged native staging path.

Expected: complete initial status observations remain the first contiguous
recording prefix, then capacity observations at simulation0ms, followed by actions.
Actual: initial capacity observations precede the prefix and stageStatusPlayback
throws `Malformed recorded status initial prefix`, preventing native combat.

## Evidence and root cause

Retained task output: red-ui-native.log in the task-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-paladin-vigor-z2ud_jiv`.
Regression: src/stores/combatHelpers.might.test.ts public Vigor test and generated
Vigor family case. Engine reconciliation currently runs immediately after unit
registration; its capacity observations therefore precede observeStatuses.

Correct the observation order at the engine source: reconcile capacity after the
complete initial status prefix and before turn boundaries or summon-on-start.
Cadence scheduling reads projection coefficients independently of life capacity.
Do not broaden or disable the existing publisher prefix validation.

Workaround: None selection; does not provide Vigor's missing effects.


A second causal publication assertion (red-initial-capacity.log) confirms that
before the first playback step, the visible native hero still has base maximum
1000262 instead of the recorded temporary1020267. On carried waves this can also
show actual HP above the visible base cap. Apply only the contiguous authoritative
simulation0 capacity observations after the validated initial status prefix when
staging initial teams. Leave event cursor0 and retain absolute idempotent events;
never infer capacity from a later effect or weaken prefix validation.


## Verified local fix

Engine capacity reconciliation now follows the complete initial status prefix
and precedes turn boundaries/summon-on-start. Initial publication stages only
contiguous authoritative simulation0 capacity observations after prefix
validation. Event cursor0 and absolute idempotent observations are preserved;
the existing status-prefix validation is unchanged.

Native/publication/playback80/3 and final full12396/528 plus two existing skips
pass, including the public Vigor allocation/first-frame/carry/replay regression.
Corrected-source engine6222/217, typecheck, lint/engine purity, explicit-false
production build and bridge scan pass. Final production browser en/zh-CN ×
1280×800/360×640 passes4/4, with eight exact five-domain Continue pairs,
20 geometry samples and19radio labels>=44×44. All1243source/760build hashes,
HEAD/Git state and genuine save digest stayed exact through the426.170s full
process. The original causal failures are retained for the final evidence.
This is local verification; earned balance and independent acceptance remain open.
