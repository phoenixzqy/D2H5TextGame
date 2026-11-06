# BUG-412 — Native melee signatures are suppressed or misdescribed

Status: fixed and functionally verified; numerical balance remains unaccepted.
Severity: High. Owners: content-designer/engine-dev; game-designer/QA.
Environment: private claimed worktree, HEADb5a0898 plus retained local changes;
Node24.21.0, deterministic native engine, locale/viewport independent.

1. Build bundled Disfigured, Vile Hunter or Death Mauler at native base cadence.
2. Run default registry against a declared passive unmitigated tank, seed13.
3. Observe generic CD1/MP0 filler taking every action before the signature.
4. Separately expose actual Rend and inspect bleed status/past-time HP loss.

Expected: [adopted next-family contract](../../docs/plans/decisions/P15-melee-signature-family-v1.md),
including real signature selection, scoped ordinary gaps and actual finite bleed.
Actual:16of20selected rows are generic-first; four previously measured priority
rows use generic fillers.20numeric pairs remain absent. Rend creates a3second
bleed marker with no rate; shared periodic settlement therefore removes zero HP.
Leap/LeapAttack/WarCry JSON disagrees with existing native target/damage/CD/procs.

Cause: redundant generic-first lists, missing per-role pairs and engine-side
stub payloads diverging from authored data. Do not repair by rewriting the global
selector, hardcoding new stats in TS or inventing a global default Bleed rate.
Shared excluded Rend consumers, actual Shenk boss identities andL90contexts
must remain explicit. This is functional/numeric authoring, not earned balance.


Native RED: `p15-melee-family-red-v1{.log,-exit.json}` in retained packet
`d2-counted-source-z3jj3xa1`,41failed/41cases,8.190s, no timeout/live descendants.
Every row fails its intended list and missing curve; actual registry Rend fails
missing dotPctOfDamage/durationMs. Existing native priority controls remain
passing in the completed broader sweep. Baseline capture precedes production
mutation; no numbers or skill source have changed yet.


Final implementation:20provisional curves/lists plus five validated immutable JSON-backed
physical skills, real finite Rend Bleed and Leap-only locale alignment. Exact-source
18files/975PASS, strict types/scoped lint PASS; independent design/QA APPROVE.
Fixed5200fights/arm: baseline561wins/143defeats/4496draws→candidate39/4622/539.
All400excluded control recordings identical, zero native Rend; actual challenge
L60Shenk is separately pinned and not represented by L55component duels.
[Complete evidence](../../docs/plans/evidence/p15-melee-signature-family.md)
retains intermediate failures, source parity, all52cells, threat and scaling concerns.

Follow-up during BUG413 validation: the earlier18-file run omitted inventory
integrity. That check rejected Crusher's new `signature-covered` status.
Use the established `spell-covered` inventory category for this physical
signature coverage; the scope still explicitly identifies Crusher and its
lack of an ordinary gap. No combat behavior changed. Follow-up verification
is recorded with BUG413 rather than attributed to the earlier975 passing cases.
