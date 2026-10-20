# P08a07 — Starter Rogue Inner Sight

Status: scoped implementation validated; independent final durable review pending.
Full private-v1 gates remain open.

The actual free starter Rogue now casts its authored all-enemy Inner Sight.
JSON supplies 25% ordinary-defense reduction for 8000 ms, cooldown 5 seconds
and mana cost 0. Ranks 1–20 share those values. Amazon Inner Sight and the
obsolete self-buff marker remain separate. No campaign, pacing, final balance,
earned clear or cause for a prior native draw is established here.

## Contract and causal evidence

[D04](../decisions/D04-merc-inner-sight-v1.md) records the independent GD/TD
contract. An exact-row schema and copied immutable resolver own the authored
boundary. The runtime replaces only the exact mercenary stub and projects
active pre-hit ordinary defense without changing authoritative stats, RNG,
hit/dodge, resistances, combo multipliers or periodic damage rates. Fractions
survive until the ordinary final floor. Physical/fire/poison/thorns use ordinary
armor; cold/lightning/arcane retain magic resistance. Generic status timing
handles refresh, first active source, expiry and source death.

Producer and QA independently approved concrete tests before each stage froze.
Representation A initially fails 5 assertions with 217 controls. B schema RED
fails 12 assertions with 225 controls. Its missing-module RED reaches no tests
and is representation evidence only. The first B integration attempt reports
three strict-Ajv collection failures; an independently reviewed schema correction
adds local object types/references, preserving all tests. The corrected engine
and loader pass. All original sources, failures and approvals are retained.

The genuine native runtime RED reaches 12 assertion failures and 13 controls,
2.839 s/exit 1, before [BUG-055](../../../production/bugs/BUG-055-rogue-inner-sight.md)
and the registry/projection patch. Actual factory Rogue AS122 casts at 1524 ms;
the old self-buff prevents the expected recast at 7620 ms and never reduces
enemy defense. Fixed damage 100/defense 20 remains 80 rather than 85. The final
runtime casts/recasts natively, extends expiry 9524→15620, preserves effects
after source death, and gives 84 for fractional defense 21→15.75. Tests cover
all living tiers/dead exclusion, ranks, half-open/future/legacy boundaries,
refresh/source, no damage or RNG from the cast, ordinary miss/minimum/magic
controls, duplicate markers, on-hit poison potency, replay and input immutability.
The complete eight-event no-Inner-Sight recording and full result are unchanged
(canonical SHA256 `2f8cb94faa7a6207bbcaa5e58990f7773d76823954aab18bd13e002dfeeeebed`).

Localization RED reaches two failures/39 controls; all 41 then pass. Only the
exact mercenary status gets Inner Sight/心眼 naming; existing fallbacks remain.

## Reviewed corrections

Final typecheck exposed a union-narrowing issue in a periodic-damage test.
Independent review approved moving the same kind/target predicate inside its
reducer, preserving the sum-six assertion. Final TD audit then found that the
exact-row schema accepted cooldown zero. Producer/QA approved two rejection
cases before freeze; both fail with 275 controls before adding the exact-ID
positive-cooldown constraint. Generic cooldown validation and authored five
remain unchanged. This is representation evidence, not a second gameplay RED.
GD/TD approve the corrected source/contract.

Final lint reports two typing errors: an untyped asymmetric matcher return
and an unnecessary optional chain after schema validation. Producer/QA approve
an explicit unknown return annotation and direct validated cost access. All
original frozen tests, amended freezes, failed checks and corrected hashes are
preserved; no assertion, fixture or gate was weakened.

## Validation and limits

Corrected coverage run: 3452 tests/166 files, 64.732 s, no failures/skips.
Engine coverage is 94.61% statements/lines, 94.56% functions and 90.70% branches,
above unchanged 80% thresholds. The later lint-only source passes engine 1224/62 files in 8.455 s, full unit
3452/166 files in 55.008 s, typecheck in 10.926 s, and lint/purity in 27.338 s.
Production build/bridge guard passes in 8.581 s with four clean JS chunks.
Coverage above precedes only the independently reviewed lint-only correction;
the full unit/engine checks use its final bytes. Browser proof follows below.
Existing engine/full timing targets remain exceeded. Existing production
chunk-size, art-precache and Browserslist warnings remain.

The frozen browser test uses ordinary fresh Druid creation, free hire/fielding
of the actual level-three Rogue with its three native skills, a single Blood
Moor wave-one entry, localized cast/status feedback and a landed physical line
with a same-card visible HP-percent decrease. A bounded read-only DOM observer
records that witness; it does not infer numeric HP or 25% causality from rounded
widths. Engine differential tests provide the latter. Pause/Flee precede wave
two, then explicit Save, export/IndexedDB equality, page close/reopen and full
save/locale/fielded-roster equality. No Skip, injected state, debug bridge,
earned reward, farming or stronger-clear claim. Native timers remain active;
only wall-clock Date is fixed. One English desktop pilot precedes the four-case
locale/viewport matrix, with zero retries.

Commands use focused 30/engine 120/unit 120/types 90/lint 90/build 210 seconds,
browser pilot 150/matrix 210 seconds, plus two seconds of exact-owned process
cleanup. Caps: 32 MiB per log/report, 64 MiB total RAW/dist/.vite. Coverage,
types and lint run sequentially; builds wait for all source/fingerprint reader
releases. Complete command/process evidence and durable packet follow final
validation. Root owns disposable cleanup after independent reader release.
No push, PR, merge or deployment.

## Browser storage interruption

The initial pilot is interrupted at 15.321 s by the unchanged 64 MiB artifact
cap: total 67,436,627 bytes, including 15,912,762 bytes of temporary trace
resources. The trace ends during service-worker activation polling before hire
or combat; no gameplay result is inferred. All 22 observed process identities
are absent; twelve exact owned SIGTERM signals are retained. Producer/QA
approve a CLI trace-off retry with unchanged frozen tests, runner, deadlines,
caps and required DOM/save/error/PNG evidence.

[Interrupted inventory](fixtures/p08a07-rogue-inner-sight/interrupted-pilot.json)
accounts for all 303 original files. The adjacent 1,032,376-byte diagnostic
archive preserves 41 files; the remaining 262 duplicate images map to verified
byte-identical immutable public Git blobs at parent `6b99504`. Root verifies
each original and committed blob, retaining the full trace/network/error
context and screenshot diagnostics without duplicating existing game art.
Independent reconstruction verification precedes exact task-owned deletion.
Task-owned dist is inventoried/deleted after readers release before each clean
Playwright production build, avoiding the artifact monitor observing deletions.

## Completed production integration

Trace-off pilot passes: 15.350 s case / 27.485 s process. The unchanged frozen
spec then passes all four matrix cases, zero retries/skips, in 47.082 s process:

| Locale / viewport | Case duration | DOM frames | Native physical witness | Visible HP percent |
| --- | --- | --- | --- | --- |
| en / 1280×800 | 16.562 s | 46 | Rogue → Fallen A, 11 | 8.51→0 |
| zh-CN / 1280×800 | 16.723 s | 45 | 罗格 → 堕落者 A, 11 | 8.51→0 |
| en / 360×640 | 17.156 s | 46 | Rogue → Fallen A, 11 | 8.51→0 |
| zh-CN / 360×640 | 17.237 s | 45 | 罗格 → 堕落者 A, 11 | 8.51→0 |

Every case observes the prior localized cast and all-enemy debuff, native
physical event/HP-percent decrease, pause in wave one, ordinary Flee, unchanged
currencies, committed-save/export equality, and complete close/reopen equality
with the same locale and fielded level-three/three-skill Rogue. Browser error
arrays are empty, DOM observers stay below their 256-frame cap and disconnect,
and production bridge/overflow assertions pass. No reward/clear assertion is
made. Root inspects representative desktop and mobile screenshots. This host
renders Chinese glyphs as missing boxes, and the existing mobile battlefield
cards are narrow. DOM localization/interaction evidence does not establish
Chinese glyph rendering, full mobile readability or accessibility acceptance.
These observed limits remain for a separate UI/environment investigation.

Both completed browser commands finish without stop, signals or surviving
processes. The interrupted pilot remains a failed tool attempt, separately
indexed with independently verified full reconstruction; its exact disposable
attachment tree was removed only after producer/QA reader release. Final
source/command/process retention and independent whole-packet review follow.

## Durable evidence

[Packet](fixtures/p08a07-rogue-inner-sight/packet.json) indexes 248 safe regular
records / 15,350,985 raw bytes and the adjacent 3,950,983-byte raw archive.
It preserves all staged sources/frozen tests, genuine and representation REDs,
failed attempts, reviewed corrections, complete controls, 28 command records
and all 3019 observed process identities, verified absent/nonlive. The original
interrupted trace reconstructs separately through its indexed diagnostic
archive and immutable public blobs. Archive snapshots precede these final
review notes. Packet SHA256:
`d986c3245c4c19006b78d955fb4085621944caff41eadf565e6a5994d08f87a4`;
raw archive SHA256:
`717a274fe41e6d8bbc1cb7f93397f0ad2b33a389ae2f3431e05be2385a4a9acd`.
Independent final review and cleanup are recorded separately after completion.

## Final independent review

Producer and QA independently APPROVE the final source and full packet, including
all 248 raw/archive records and 3019 absent/nonlive process identities. GD/TD
approve the corrected contract/source. All readers are released.
[Final review record](fixtures/p08a07-rogue-inner-sight/final-review.json) is
explicitly post-archive. Functional browser/persistence approval retains every
mobile-readability/CJK/visual/a11y limitation above. No remote action.
