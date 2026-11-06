# P15 — Stygian Doll death explosion: evidence

Implemented locally under [the bounded contract](../decisions/P15-stygian-doll-death-v1.md).
Inventory: **84 authored / 27 pending**; all 111 numerical acceptances remain
unaccepted. Chromium works; CI excluded/deleted. No publication or dependencies.

## Behavior

Ordinary melee 35.2/+5.5, native AS120/1540ms; remove WeakMelee, retain the native
on-death marker. One 35–60 total explosion per eligible original hostile death,
half physical/half fire, shared spell hit/base/crit with separate mitigation,
absorption and integer floors (35 becomes17+17). No cast, corpse cost or Ignite.
Frozen validated JSON payload and exact native identity prevent replacement
skills, summons, initially dead or duplicate-overwritten actors gaining authority.
Both selectors exclude on-death skills and both exact monster CE aliases.

Actual hostility is captured before lethal writes, including direct/reflected/
periodic deaths and authentic Conversion. Real source stays dead; a private
synchronous grant permits the real damage pipeline. Close the full death set
before bursts; queue ordinary recovery/corpse tails FIFO until every original
and nested burst has settled. Preserve last-enemy retaliation, sticky hero
defeat, outcome bodies/rewards/corpses exactly once and separate player CE.

35 native combat cases cover cadence, replacements/eligibility, shared roll/crit/
spell dodge, shields, direct/periodic/reflection, simultaneous/nested deaths,
Conversion equality/expiry, corpse ownership and immutable/plain/recorded replay.
Actual City Damned W6 seed7/ordinal0 is thirteen L53 Dolls: one rare leader plus
twelve rare minions, with source encounter act4-cd-w6-e1. Native Attack642/418.
11 resolver cases cover frozen copied payload and rejected authored semantics.
This verifies the selected native consumer; comprehensive planner coverage stays pending.

## Validation and corrections

Initial RED:9 intended failures/8 controls across17 cases. Green-v1:17PASS.
Green-v2:27PASS/1fixture failure; separate player CE hero needed its actual level6.
Green-v3:33PASS/1fixture failure; the after-expiry periodic fixture used1/9DPS,
which floors below lethal1HP. Use16000ms/dyadic0.0625 while preserving the expiry
boundary checks. Green-v4:35PASS,14.616s wrapper. Neither correction changes runtime.

Affected-v1:17files/996cases,994PASS/2stale fixtures,95.016s. Older player CE
test expected an active monster stub: now requires ordinary fallback, no active
monster CE, identical recordings with/without player projection and empty corpse
feedback. Older delivery mutation test tried mutating now-frozen native Rend:
use still-mutable StrongMelee, preserving mutation/reload rejection/finally
restoration/restored native authority. Repaired-tests-v1:2files/114PASS,14.946s.
These runs collectively cover the affected996cases; no clean one-shot996PASS claim.

Types-v1 failed on the optional wave-source discriminant and nonempty component
tuple. Fix with a discriminant guard and tuple assertion, with no runtime delta.
Types-final-v1 then exposed the resolver rejection table's array expansion by
Vitest it.each: its previous ten rejections could pass from TypeError before
semantic validation. Wrap each candidate array in an object and require the
specific validation error. Final ten cases now exercise the intended validation.
The optional nested-test tightening initially referenced a nonexistent source
field on a status event; assert actual paid action/MP debit and Conversion timing
instead. Preserve the seed. Also assert nested death strictly between original
bursts and a positive guaranteed-orb count before checking deferred ordering.

Final assertions-v2: **2files/46PASS**,11.606s; strict types-final-v2 **PASS**,
8.341s. Scoped lint-final-v1 PASS34.075s, repaired lint PASS14.300s, final-v2
three final touched files PASS11.668s. The second strict run covers both resolver
and combat test repairs. Independent read-only runtime/test review found no
material runtime findings and suggested the adopted ordering/orb tightenings;
the later root audit found and repaired the resolver table issue. No clean full
current-workspace suite, earned balance or complete-private-v1 acceptance claimed.

## Frozen matched stress diagnostic

Three specs ×100seeds0–99 =300fights/arm: L1trashDoll; actual W6 thirteenL53
native Dolls; unchanged L53Damned. Hero is explicitly synthetic5000HP/50000Attack/
AS250, not an earned build. Native60s limits; input immutability and plain/
recorded parity checked on seed0 for each spec. Arms were not rerun after capture.

| Spec/arm | Win/loss/draw | Ordinary/active | Enemy direct damage | Sum final hero HP |
| --- | --- | ---: | ---: | ---: |
| L1 baseline |100/0/0|0/0|0|500000|
| L1 candidate |100/0/0|0/0|4268|496556|
| Native W6 baseline |100/0/0|0/2907|31399|500000|
| Native W6 candidate |60/40/0|1038/1550|588621|112258|
| Damned, each arm |100/0/0|0/0|0|500000|

Forty native losses are an adverse result of the combined curve/cadence/death
mechanic and exposed elite Fireball, not isolated explosion damage. Baseline
2907actions are WeakMelee; candidate1550active actions are existing appended
Fireball. Supplementary derived native dead-source1058physical/1207fire events
include149 posthumous Fireball impacts: label these dead-source damage, not
explosion-only counts. Final hero HP includes recovery and is not cumulative
damage removed. No pacing, rewards or earned campaign conclusions follow.

All100unchanged Damned raw rows are identical, but this fast-kill control dies
before acting. Exact parity applies only to this bounded fixture. Independent
audit recomputed all600raw input/recording hashes, both compressed raw hashes,
summaries, seeds/specs/roster and exact100control rows.

Baseline wrapper3.746s/candidate5.224s, exit0/no timeout/no owned descendants.
Driver SHA256:a66022edb97f045c431133d5f8cafa285e3142013d7195b138a681359779d4fe.
Baseline gzip:1a40d5c79497397148dc64e37eee95de6405cd91a979838aafea1eee3b9d1c7b.
Candidate gzip:0269a1d2ce70219570a2c43f0335547c48bec6e2c78aa07f3865122f36d6d152.

Arm provenance pins nine existing source files but omitted the new resolver
module. All nine candidate hashes still matched the post-run review. The later
resolver tuple annotation changes only static typing; new test changes tighten
oracles. p15-doll-final-audit-v1.json captures those three current file hashes
as a **post-run audit**, not arm-time provenance. This omission is a limitation;
no retroactive capture or arm rerun is represented.

## Retained evidence and cleanup

Exact packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Root retains p15-doll-* driver/launcher/raw gzip/JSON/logs/receipts, stale oracle
hashes and final audit through umbrella acceptance and owns eventual cleanup.
All processes collected with no live owned descendants; exact baseline/candidate/
compare Vite caches verified absent. Existing umbrella type cache, evidence and
worktree claim stay retained for continuing implementation.


Follow-on broad check: the later full engine run during BUG419 found Vengeance's
exact composite catalog oracle still enumerated only five earlier participants.
BUG420adds the authorized sixth death-only monster CE and compares sorted exact
membership. No runtime change or battle diagnostic rerun; focused16PASS24.836s/scopedlint26.260s/latesttypes12.443s PASS
are recorded with BUG420. This gap was absent from the earlier affected996set.

## 2026-11-05 current-source fixture correction

The thirteen-Doll result above is historical. Current City Damned W6 is an
authored single L53 rare treasure Doll (Attack482); treasure encounters preserve
their authored roster. BUG787 also corrects the converted-victim fixture's
lowest-life setup while retaining every death-tail assertion. Both failures
reproduce against exact pre-Fire-Enchanted source; both corrected cases pass.
See [current evidence](p15-fire-enchanted.md) and BUG787. Historical results are not rewritten or
credited as current balance acceptance.
