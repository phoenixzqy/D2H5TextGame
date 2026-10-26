# BUG-282 — Implement the max-Poison Plague Epidemic

- Severity: Medium — the advertised max-stack combo uses ordinary half spread.
- Status: Runtime implemented locally in `13a6d098`; full engine, native/UI, bounded production browser and full lint checks pass. Original full unit/types interrupted without results; sequential retry active. Independent/earned acceptance pending. No skill credit.
- Owner: root, engine/design/QA; no delegation or independent approval.
- Baseline: BUG281 payload/helper correction `d18e689c`; exact source hashes
  are retained with the continuing task below. Linux, Node/Vitest, seed7.
- Browser/viewport/locale: not applicable to this synthetic engine reproduction.

## Reproduction

1. Prepare one held enemy with1HP and ten Poison stacks at8HP/s. Its Poison
   begins at1700ms, so no earlier periodic death can precede the actual hit.
2. At1700ms, allow one paid rank1 Plague Javelin cast. Keep a second living,
   held10000HP enemy outside the authored line-3 area.
3. Inspect the real death spread and final neighbor HP. Repeat with nine
   pre-cast Poison stacks; the paid hit itself then raises that target to ten.

Expected from `docs/design/combo-matrix.md`4.3: casting a Plague skill on an
already max-poisoned target makes its death spread100% instead of50%, once per
combat per cast. The max-stack neighbor should receive ten stacks and lose
400HP over5s, finishing9600. The nine-stack control retains ordinary50% spread:
five stacks,200HP lost,finishing9800. Captured potency is not mitigated twice.

Actual: both cases receive five stacks at1700ms,8HP/s per stack, expiry6700ms,
and finish9800. Inputs are unchanged. The first complete diagnostic run has
one failure/eleven passes, including all ten passing BUG281 controls. A narrowed
observation run has one failure/one pass/ten intentionally filtered cases; these
are diagnostic filtering, not skipped repository tests.

## Evidence and correction requirements

Root retains `epidemic-original-red.test.ts`, `epidemic-red.test.ts`,
`epidemic-red.log/json` and `epidemic-observe.log/json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s`.
Root owns retention and exact cleanup after the continuing consumers finish.
This evidence is unearned and does not establish native class/build viability.

The reproduced engine supplied the same0.5 fraction for every Poison/Plague
death. Capture eligibility from Poison before the paid hit, preserve ordinary
spread otherwise, and enforce the once-per-cast limit across multiple targets
and later deaths. Use authored tuning, transient battle-only authority and the
existing frozen-source/death-order/status-expiry integration. Cover expiry,
miss/refusal, multi-target cast identity, deterministic replay and immutability.
Do not grant Epidemic merely because a normal hit raises nine stacks to ten.

Workaround: ordinary Poison/Plague death spread still functions. Security check:
pass for first-party local engine/data/test work; no credentials, dependencies,
network, permissions, CI or persistent save fields are requested.

## Bounded runtime correction

[D04 contract](../../docs/plans/decisions/D04-plague-epidemic-v1.md) freezes
pre-cast eligibility, one allowance per paid cast and accepted-marker lifetime.
`72213405` adds closed Ajv-validated JSON tuning and19passing definition tests;
`13a6d098` captures selected active Poison before effects, binds only accepted
landed Plague, and consumes at ordinary frozen death settlement. Multi-target
and repeated hits share an allowance; independent casts retain separate ones.
Marker expiry/replacement and new battles cannot inherit authority. Both locales
have `combat:epidemic.triggered`; ordinary spread, RNG, saved fields and captured
Poison damage remain unchanged apart from the specified qualified full spread.

The repository's initial four-case RED has three failures/one control,3.829s.
The first runtime run passes33tests/threefiles,4.299s. The final focused run
passes204tests/sixfiles,6.734s,including16Epidemic lifecycle cases,19definition
cases and all BUG281/status/registry/Frost Nova controls. Cases cover pre-cast
ten versus nine, delayed death, one/multiple casts, repeated hits, payment/miss,
future/expired records, source death, marker replacement, lethal final interval,
fresh-battle observation reuse, deterministic replay and immutable input.

One added final-interval fixture initially expected death6700ms from431HP but
actually died6125ms: Poison10 multiplies seed7's31base hit by2.5 to77. Correct
477HP =77direct+400periodic fixes the fixture; the test also asserts literal77
and the exact6700death. The original failure is retained, no runtime arithmetic
or expected timing was weakened. Focused strict types initially caught missing
event narrowing; lint also caught numeric template interpolation. An explicit
mana-event predicate and `String(index)` fix those test-only errors. Final strict
types pass4.020s and explicit lint9.251s; engine purity passes359testfiles.

The original full engine session22396/`epidemic-engine` completed exit0:
9490tests/359files,163.189s,inputsUnchanged:true. Its1668input manifest includes
`src`, tests/sim, scripts and configuration, including all new files; all hashes
were read back exact before later UI/test edits. The older9455engine and18461full-unit results belong to
their earlier snapshots. Genuine save compressed/raw hashes remain exact; no
campaign action/replay occurred. Native/public log rendering, full skill/earned
build/balance acceptance and integrated full units/types/lint/build remain open.
The continuing task above retains every original failure, receipt and frozen
input manifest; root owns its eventual retention/read-back/exact cleanup. No
cleanup, independent approval or inventory credit is claimed here.

## Public preview reproduction before correction

At `c74de1e8`, rendering the actual Amazon skill panel in jsdom at ranks0,1,19,20
in both locales gives a generic direct-damage sentence only; the zh-CN status
list also displays the untranslated `Plague`. The description's source string
promises poison clouds, but the actual panel does not explain finite Poison,
rate-less Plague, death spread or the pre-cast maximum requirement. Selecting
the node and allocating19→20 reproduces the gap in all ten new UI cases.
Expected: actual line-3 targeting, current damage/payment and the implemented
Poison/Plague/Epidemic rules in both locales, including the once-per-cast limit.
`plague-preview-red.log/json` in the continuing task retains10failures/zero passes,
9.298s. This is component evidence, not a real browser viewport or earned build.

`176c6ad6` fixes the dynamic preview; `011c22e8` supplies the missing localized
status labels. Native and public verification now pass at the precise boundaries
in [current evidence](../../docs/plans/evidence/d04-plague-javelin.md). The fresh
full lint checkpoint12885 passed223.626s. Original full unit37999/types78777
returned tool exit143 without runner receipts; the audit found no surviving
worktree Vitest/tsc process, with termination cause unestablished. All1673frozen
inputs remain exact. Types retry97325 is active before a sequential unit retry.
Original logs/audits remain retained. No inventory, independent or earned
acceptance credit follows before that closeout.
