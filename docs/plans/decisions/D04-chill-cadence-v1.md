# D04 — Chill action progress

Status: GD/TD and producer approved contract; implementation and QA pending.
This scoped child implements the advertised −50% attack-speed stat in combat
formulas §9.1. It does not attribute the P02b05c native draw to Chill or accept
campaign balance, ordinary-earned paths, full D04, C0–C4 or G0–G7.

## Controlling contract

`src/data/combat/chill.json` owns `{id:"combat/chill",attackSpeedMultiplier:0.5}`.
Its closed draft2020-12 schema requires those two fields, constant ID and finite
numeric `0 < multiplier <= 1`;1 is deliberately legal neutral tuning. Zero is
not Freeze. Follow the existing recovery-definition validated immutable-copy
loader. The existing status authority retains2000ms duration; no duplicate
duration, coefficient fallback, generic framework, unit field or save change.
This repository has no validate:data script/dataLoader.ts; use its established
Ajv2020 definition tests rather than inventing a parallel validation command.

For each living hero/merc/monster/summon, use the existing cadence:
`P = clamp(2500-floor(baseAS*(activeChill ? multiplier : 1))*8,400,2000)`.
Halving AS does not double period. Store battle-local previous period and due
time. At a period change at t, preserve completed progress with
`newDue=t+max(0,oldDue-t)*newP/oldP`. Retain fractional milliseconds, no rounding
or epsilon ties. Do not rescale unchanged periods. Base stats remain immutable.

Reconcile all surviving schedules after shared periodic/status/mana settlement
and after action effects, before selecting/reselecting. Never execute a stale
selection. Already-due actions stay due. Activity is half-open; refresh keeps
the original start/phase and maximum expiry, never stacks or restarts progress.
Future records act only at onset; expiry restores cadence immediately. Keep
seeded exact-timestamp priorities, no new RNG draws, inclusive60000ms deadline,
periodic deaths before mana/actions, and existing integer-ms DoT lethal search.

Freeze suppresses scheduled attempts; each suppression schedules the next full
effective period. It never pauses the clock or grants catch-up. At exact expiry
an action is eligible. Initial units, post-action and native summons use the
same scheduling rule; summons do not inherit owner statuses. Qualified crosswave
carry uses existing residual status rebasing and fresh action progress.

## Independent timing oracles and bounded cards

For AS100 Chill[1300,3300), attempts are30100/17,3700,5400ms. Refresh at3000
extends expiry5000: attempts30100/17,64100/17,5655. A stored future record has
the same timeline. AS50 remains2000ms; AS263 becomes1452ms; AS526 stays400ms.
Freeze[1300,2300) suppresses the first30100/17attempt; next action3700. Both
Chill[0,2000) and Freeze[1000,2000) expire before the due2000 action. Applying
Chill to an already-due AS100 actor at1700 leaves it due; next3700. Rebase at
2500 to Chill[-1200,800): fresh first action1820. An AS100 summon born1000,
Chill[1300,3300), first acts50100/17 then4700.

Root owns all writes and execution in the existing claimed worktree. CardA:
definition/schema/loader/tests plus this control; independent test review,
missing-capability RED honestly labeled, then focused/E/U/T/L/B and review.
CardB immediately follows: combat scheduler, causal timing tests, affected Frost
fixtures, structured BUG-053 only after genuine observed behavioral RED. Review
all post-freeze corrections independently. Assert actual production Ice Bolt/
Frost Nova, legacy/non-Sorceress status paths, onset/refresh/expiry/future starts,
clamps/odd speeds/fractions/exact ties/Freeze/summons/crosswave/deadline,
no-Chill controls/RNG and replay/normal parity/input immutability. No accepted
earned fixture changes to absorb a failure; report incidental regression first.

External task RAW is `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-chill-e47f2p8r`.
Bound each focused/engine/full/type/lint/build command at30/120/120/90/90/210s
plus2s exact-owned cleanup.32MiB per output/report,64MiB combined RAW/dist/.vite.
Do not build while fingerprint consumers run. Preserve failures; cleanup exact
task-owned paths only after readers release. Commit each verified card, then
separate cleanup/ledger close. No remote actions or new gameplay screen.
