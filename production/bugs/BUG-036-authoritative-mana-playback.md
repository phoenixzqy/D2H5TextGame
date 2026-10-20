# BUG-036 — Record authoritative mana changes during battle playback

- **Status:** Fixed in `dd236eb`; bounded absolute mana transport/cap handling only.
- **Severity:** High; displayed MP does not track casting or restoration before
  the final battle snap, hiding the resource behavior required by Warmth.
- **Owner / systems:** engine integrator; `combat.ts`, `combatPlayback.ts` and
  silent localized event conversion.
- **Build:** `727da6b`, accepted adapter runtime `1860bc6`; fire primitive
  integration and unchanged-RED rerun remain prerequisites before source edits.
- **Environment:** Linux / Node24.21.0 / Vitest UI project with real pure engine;
  no browser/viewport in this deterministic reproduction. Silent log controls
  exercise both zh-CN and en. Ordinary browser acceptance is a later stage.
- **Seed:**7; actual registry Fire Bolt, Amplify Damage and Raise Skeleton.
- **Contract:** `docs/plans/decisions/D05-warmth-recovery-v1.md`, stage e.

## Reproduction

1. Run real rank1 Fire Bolt with MP8 and AS100 against a held HP500 target;
   hold the caster after its1700ms action to isolate one cast. Separately use
   rank20 Amplify Damage with MP11/AS263 (400ms) and initial Raise Skeleton
   with MP15 (0ms). Fixtures supply no mana recovery rate.
2. Call `runBattleRecorded`, step its events through `applyEventToTeams` before
   `end`, and compare each unit's MP with the actual engine result. Repeat the
   recorded/unrecorded battle and verify input immutability.
3. Kill a preloaded owned skeleton periodically at500ms to refund living-owner
   MP0→15 or98→100; exercise simultaneous owner death and full-MP controls.
4. Kill a held boss at500ms for guaranteed HP/MP orbs on hero+merc recipients,
   MP90→95 or98→100, HP90→95. Preserve the existing HP(hero,merc), MP(hero,merc)
   cue order before publishing absolute mana results in recipient order.
5. Run `npx vitest run src/stores/combatPlayback.test.ts
   src/stores/eventToLogI18n.test.ts --reporter=json
   --outputFile=/tmp/d2h5-root-warmth-e-red-v2.json`.

## Expected and actual

Every actual MP change emits a silent absolute event with target, resulting
`mana`, and reason (`cast`, `regeneration`, `summon-refund`, `orb`). Cast events
follow the action cue and precede effects/spawn. Refunds follow death handling.
Orb results follow the complete original cue batch, preserving HP updates.
There is no timed regeneration in stage e. Unchanged/normalized zero-cost,
full-cap and zero-floor restoration produce no artificial MP-change event.

Playback must set exact trusted absolute MP, including zero and values above
stale playback maxima, idempotently for either side and immutably. Unknown IDs
remain no-ops. Both locales produce no log entry for mana events. Current engine
changes final MP without any event; playback ignores this resource, so its MP
remains stale until the final snap.

At resulting MP cap, clear existing nonzero fractional carry/compensation, even
when a zero-cost/refund/orb write changes no whole MP. Preserve legacy absent
optional fields. A real full100→92 cast retains carry.75/compensation.125;
checking the pre-spend cap would wrongly erase it. Existing runtime does not
clear these transient fields when restoration reaches cap.

## Evidence and diagnosed cause

Strengthened tests-only RED at09:06:32UTC: **13failed/19passed/32total**, zero
pending, exit1 (wall3.042s). Typecheck exit2 (wall8.708s), exactly three TS2322
missing `mana` event union diagnostics, no unrelated type errors. Initial RED
before the two independent QA improvements had11failed/19passed/30total.

Runtime `combat.ts` SHA256 remains
`8492230b7ecaf6bbe1fdf49295ee18772fa50af9cb1afb5321afc84dacee8ae4`.
Playback test SHA256
`466e8fc4ceada8d0e0996f0238411b619d4c2953f241ac25d9d829bd54ce53a0`;
log test SHA256
`8df0d46c5fe47ae647b70ac12e2485c11afd4a990da86dd953a98f577f848667`.
Raw root-owned evidence: `/tmp/d2h5-root-warmth-e-red-v2.json`, matching `.log`
and `-typecheck.log`; retained until reviews consume it, then cleaned.

The engine's three current MP write sites (cast, summon refund and batched orb
application) have no shared authoritative MP commit/event boundary, and the
playback event union lacks MP. Minimal root fix: one internal candidate-unit
commit helper preserving other fields, cap cleanup based on resulting MP, and
optional absolute event iff MP changed; callers publish at their established
cue positions. Playback applies exact absolute mana; log conversion explicitly
returns null. No HP-orb playback change, save schema/migration, RNG changes,
timing engine rewrite, or UI duration equivalence is claimed. Same-clock
recorded events currently receive a minimum50ms delay.

Independent QA final RED **APPROVE / ADEQUATE**, after confirming all hashes,
13 intended failures, three exact type diagnostics, stronger orb-kind ordering,
and full-spend/cap-clear controls. Producer final RED **APPROVE / ADEQUATE**, independently confirming the same
complete diff, literal oracles and raw evidence. Rerun the
unchanged tests after accepted fire-stage integration before source edits.

Security check: **PASS**. Local deterministic resource transport only; no
network, credentials, dependency, permission or validation-bypass changes.


Accepted fire runtime integrated as `5a53d37` (worker `f80b6a9`) on the
separate active-buff fixture prerequisite `727da6b`. Unchanged stage-e tests
rerun at09:12:41UTC: **13failed/19passed/32total**, zero pending, exit1
(wall2.993s including cherry-pick). Same two test hashes; current combat SHA256
`da2672fef8783c67a2dc9c4dd05e165665ba4d0a7f370919f45c4ac5ff9a1ccd`.
Post-integration typecheck again exits2 with exactly the same three missing
mana-union TS2322 diagnostics. Raw root evidence is
`/tmp/d2h5-root-warmth-e-postd-red.json`, matching `.log` and
`-typecheck.log`, retained for independent consumption. The accepted stage-d
engine780/full1640 evidence and root combined unchanged RED separate the
missing MP transport from fire/passive behavior before the bounded stage-e fix.


## Resolution and accepted validation

Runtime `dd236eb` adds the shared candidate-unit commit and absolute event at
all three current MP write sites, exact immutable playback, and explicit silent
log conversion. No timed regeneration, HP-orb playback fix or save migration.
The actual candidate is retained so orb-updated HP survives, and cap cleanup
uses resulting MP; ordinary full→below-cap casting preserves carry.

First focused GREEN31/32 exposed an over-broad negative test: the simultaneously
dead enemy owner legitimately drops ordinary seed7 HP+MP orbs to the living
hero. Both first main draws (.011704753/.061958258) are below trash chance.25;
hero90→95@500 is correct. Root, producer and QA independently approved replacing
all-MP-empty with that exact hero event plus explicit no-owner/no-refund checks,
retaining owner HP0/MP0 assertions. No runtime change was made for this oracle.
The original19/13 RED otherwise remains unchanged.

Final commands all exit0: focused32/2files1.93s;
`npm run test:engine -- --reporter=dot --silent`780/48files4.29s;
`npm run test:related -- src/engine/combat/combat.ts
src/stores/combatPlayback.ts src/stores/combatPlayback.test.ts
src/stores/eventToLogI18n.ts src/stores/eventToLogI18n.test.ts
--reporter=dot --silent`781/57files20.69s;
`npm run test -- --reporter=dot --silent`1661/125files27.48s; final
`npm run typecheck`, `npm run lint`, `npm run build`5.99s and diff-check pass.
Zero failed/pending/skipped. Engine3s/related5s/full15s budgets remain unmet.
Existing Browserslist/chunk/unprecached-manifest warnings remain.

`npm run test:cov -- --reporter=dot --silent
--coverage.reportsDirectory=/tmp/d2h5-root-warmth-e-coverage` passes the unchanged
80% engine gate;1661/125files35.48s, overlapping final typecheck/lint, so not an
isolated timing measurement. Global statements/lines94.09%, functions93.6%,
branches88.67%. Combat statements/lines1098/1129(97.25%), functions45/45(100%),
branches359/408(87.99%). All34 added instrumented statement locations and12
added branch locations exercised. Stores are excluded by configured coverage;
their absolute/zero/stale-max/idempotent/unknown/enemy/silent-locale behavioral
tests were independently judged adequate, not measured store coverage.
Raw coverage SHA256
`fd1fc2b604f9e6b23945c754f003987ef571c651276fd946f9e15c9345762d87`.

Final source SHA256:
- Combat: `439eb1a86e3c4c68fe69978c623af810d64ac4006d26f4db2ad3412be8e15698`.
- Playback: `d29e28ea3c70309e935a56815996cadbf10f07fb57e8a121e97d43080d6fc631`.
- Log: `fbba06f8d9dc55c49dfaa80ead3b623f68822bb932a89dc4dfa00961a510fce0`.
- Corrected playback test: `1c83bb2c198c59ebe14594f76847d3e59c793bcd52a32c27bb0ef6c0205012e1`.
- Log test remains the frozen RED hash above.

Independent producer and QA final **APPROVE / ADEQUATE**, complete source/raw
coverage consumed. Task-owned raw logs/coverage/build/test cache may now be
removed after evidence preservation. Stage f receives accepted `dd236eb` and
exclusive five-file recovery scope; stage g still needs ordinary browser proof.
No full Warmth, campaign, performance or G0–G7 acceptance.
