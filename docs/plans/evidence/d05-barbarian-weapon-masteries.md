# D05 — Sword, Axe and Mace Mastery / BUG168

2026-10-24. Implementation `8e71189`, base `2ba488a`; root sole writer in the existing claimed
`feat/playable-foundations` worktree. Implemented and locally verified;
independent review/QA, earned Barbarian builds and full acceptance remain open.
[Controlling contract](../decisions/D05-barbarian-weapon-masteries-v1.md).

## Delivered behavior

The three exact authored/canonical mastery pairs now compose at the fresh hero
boundary from canonical weapon-slot base metadata. Each matching allocated rank
adds3% direct physical damage and0.5pp critical chance; unlock1/cap20 and
coefficients remain authored. Both handednesses qualify; wrong weapons, offhand,
names/IDs, unknown bases, other classes and invalid levels grant nothing.
Multiple learned masteries/alias duplicates never stack. Strict row schemas
require the exact weapon metadata and both nonnegative finite coefficients.

Damage uses the existing per-type increased-damage path, preserving Attack,
elemental increases, recovery and reflection. Critical chance uses fresh stats
and existing direct-hit rules. Noncritical arcane damage is unchanged; critical
chance also affects eligible nonphysical direct hits. No passive casts, costs,
RNG changes, persisted derived bonuses, save shape or migration.

Both locales now describe automatic weapon-conditioned physical damage and
critical chance instead of attack rating, with authored parameters/cap/unlock.
Weapon requirement names are localized for all existing canonical types.
Native learning while unarmed is allowed; effect activation requires the weapon.

## Verification

- Frozen pre-implementation reproducer:10causal RED/6controls. Original attempts
  compared intentionally different allocation maps and generated fixture IDs;
  both fixture errors were corrected before the credited frozen run.
- Three strict-schema RED tests reject contradictory/extra/malformed metadata.
- Six bilingual description RED cases precede the UI repair; existing numeric
  current/next rows were controls, including0.5%/+0.5% precision.
- Final focused82PASS/6files,19.42s, after correcting the native import fixture's
  expectation: actual snapshot/import canonicalizes equipment from ownership,
  rather than retaining the mock player's empty equipment array. Includes38new
  tests and44existing Skills tests; equipped Dream compatibility is included.
- Engine5833PASS/182files,84.42s. Typecheck and explicit `VITE_E2E=false`
  production build pass; all4emitted asset JS chunks are bridge-free.
- Final lint/typecheck pass after two lint corrections; final production
  Chromium4/4 en/zh-CN×1280×800/360×640,79.90s, no retries/skips/flaky
  cases. Real Settings imports constructed L30 eligibility/three owned weapons;
  ordinary learning,44px controls, no horizontal overflow, three exact unique
  weapon swaps and four exact Save→close→Continue pairs pass. Zero captured
  page/console errors; both final desktop/mobile screenshots inspected.
- Full unit suite:11816PASS/465files plus2existing skips,678.72s, exit0.
  It started before the semantics-preserving
  optional-chain/test-callback lint fixes and English article correction; final
  focused/types/lint/build/browser were rerun after them. Engine source/data
  did not change after the5833PASS engine run. Initial strict Ajv compilation
  missed its local requiredLevel property reference; corrected without loosening
  strict mode. All failed attempts retained; no credit for their failed checks.
- Existing test-time budgets, large bundle and oversized PWA manifest warnings
  remain unresolved. Browser checks establish no full a11y/performance gate.

The native tests exercise real learning, sword→axe equip changes, next-wave
resource carry, preserved current recordings, native reset/replay/no reward
income and validated serialization/import for all three weapon types. Their
constructed levels/gear/synthetic finisher prove lifecycle functionality only.
Fixed seeds1–64 exercise actual direct physical damage and critical outcomes;
same-seed noncritical arcane controls and item-modifier preservation are included.

## Evidence and remaining work

[Fixture directory](fixtures/barbarian-weapon-masteries/) retains final
browser save/swap payloads, source/build hashes, summaries and screenshots.
Raw task evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-weapon-masteries-fsusc76b`.
Both temporary builds and completed browser staging directories are removed;
port4452is closed, remainingDisposable[]/failures[]. Root retains raw logs and
both complete browser reports through full-v1 consumers, then removes them.
Final full-suite log, terminal process ownership, verification summary and
attachment hash manifest are retained in the fixture directory. All task
processes are terminal; the raw root remains for full-v1 evidence consumers.

The genuine earned Rite resume remains unchanged, SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`,
L33/nextNormal402. No genuine campaign actions, repeated Baal screens, push,
PR, merge or deployment. Polearm/Throwing/Spear Mastery, remaining advertised
skills, two builds/class, economy/pacing/endgame, C2–C4 and fullG0–G7 remain open.
Code/evidence self-review covers rank/weapon authority, fresh composition,
consumer outcomes, recording/resource safety, item interactions and truthful UI.
Bounded functional evidence is adequate; acceptance remains incomplete without
independent reviewer/QA and earned builds/balance. Next work must reconcile both
spear and throwing availability (zero current matching bases), preserve existing
War Pike/polearm identities, and implement their remaining mastery consumers.
