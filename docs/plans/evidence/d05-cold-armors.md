# D05 — Shiver Armor and Chilling Armor

2026-10-25; root sole writer/reviewer. Engine `484f9433`; presentation/final source
`93e39b22`. Independent design/QA, earned balance and full-v1 acceptance remain open.
[Contract](../decisions/D05-cold-retaliatory-armors-v1.md); BUG233.

## Actual behavior

Both armors now require a legal paid cast and capture their source and rank in
combat-only state. Shiver adds the existing 3.5% Defense and 1% direct Cold
damage per rank. Chilling adds the existing 4% Defense and one percentage point
of magical dodge per rank. Learning, priority entries and bare markers grant no
power. Existing unlocks, prerequisites, costs and cooldown growth are preserved.

Shiver responds to landed direct Physical hits, the explicit no-range adaptation
of melee retaliation. Chilling responds to every direct hostile damage type.
New provisional JSON counter ranges are Shiver12–18/+3 and Chilling24–36/+4 per
additional rank. Counters independently roll ordinary Cold damage and apply
Freeze1s/boss0.5s only when they land. Cold resistance, MR, bonuses, combos,
shields and normal death settlement compose through the existing pipeline.

Positive fully absorbed hits and lethal hits on the wearer can trigger a counter
at the original surviving attacker. Periodic damage, allies, misses and other
armor reactions cannot trigger it. An explicit guard prevents reaction loops,
including Frozen Armor. The three armors coexist with additive Defense; neither
new armor recasts while paid. Paid rank carries across native waves and positive
allocation changes, but invalid class/unlock/prerequisite boundaries remove it.
Fresh runs and imported/reloaded saves start unpaid. No save version changes.

Separate bilingual counter/Freeze rows and rank-aware descriptions explain the
actual behavior. A buff cast does no direct damage. Only the two armor JSON
object spans changed; the other 28 Sorceress objects and existing armor tuning
are exact. Trigger adaptation and new numerical tuning remain provisional.

## Verification

125 new tests: 35 engine definition/schema/display,64 native-projected causal combat,
10 actual store/wave-boundary and16 bilingual React cases. Predeclared ranks1/2/20
and seeds7/19/41/97 verify independent damage/payment, mitigation, misses,
Freeze duration, absorption, lethal outcomes, boss orbs/corpse closure, marker
authority, resource refusal, nonrecast, coexistence, nonrecursion and magic dodge.
Every causal case checks immutable inputs, repeated recordings, unrecorded
results and terminal playback through the actual combat store.

Focused compatibility437/6 includes all292actual loader cases and existing
Frozen Armor native cases. Broad engine8053/301 and full repository lint pass.
The new browser files also pass explicit lint outside the repository's normal
tests-directory exclusion. Final frozen-source typecheck/build/precache and
bridge scan pass.1471source/config/test/contract and761build file hashes are
retained. Required application assets are present in the actual service worker;
existing bundle/art-manifest cache warnings and test-time budget breaches remain.

Final quiet full: **16,060 passed / 725 files / two existing skips**,633.23s.
Other task validation processes and the preview server were terminal first.
All frozen source and build hashes remained exact, and all1471source Git blobs
match delivered `93e39b22`. No broader C2–C4 or G0–G7 acceptance.

## Public browser and persistence

Final production: 8/8: en/zh-CN ×360×640/1280×800 ×both armors. Public creation,
export/import and equip use a declared synthetic L30 character and resource cap.
Each skill allocates1→2 and visibly casts, counters with Cold and applies Freeze.
A bounded DOM observer proves the actual MP debit before regeneration refills
the bar. No runtime store bridge is present. These resources establish public
mechanics and persistence, not earned build viability or pacing.

Each case closes its page, continues in a fresh page and exports again, then
repeats with networking disabled and a response served by the service worker.
All 16 save pairs are checked for exact equality across player, inventory, map,
mercenaries, formation and metadata. Geometry checks cover five sizes in each of eight cases (40 checks), asserting
no horizontal overflow and allocation controls at least 44px high.
Sixteen screenshots are retained. Inspected tree/combat viewport views show
the selected nodes and localized armor chip; the detail panel lies below those
tree captures, so these images do not independently prove detail typography.
Bilingual descriptions are separately asserted by browser and React tests.
Existing navigation/lock glyph boxes and full accessibility acceptance remain.

## Failures, review and limits

Original legal casts only charged MP and added a marker:100Physical versus
20Defense stayed80instead of79, and no Cold attempt occurred. Seed7's counter
roll actually misses. The early expectation of Freeze on that miss was wrong;
it is retained with the correction and the independent seeded oracle, rather
than changing RNG or searching for a favorable seed.

Retained failures include strict Ajv authoring mistakes, preview/UI REDs, an
incorrect playback-helper API, and a bare-marker control that accidentally let
the hero attack. Tests now use actual combat-store publication and distinguish
an expired cooldown's deleted key from numeric zero. Initial type/lint failures
were corrected without disabling checks or weakening assertions.

Browser setup first omitted mandatory socket metadata, then guessed an
allocation label and English rank wording. A full-MP-after-counter assertion
ignored native recovery and was replaced by the observed exact cast debit.
Viewport resizing also hovered Blizzard and changed its preview; moving the
pointer clear and asserting the selected armor heading fixes the harness.
Explicit browser lint found two void-expression shorthands, corrected before
the final frozen browser run. Failed reports/traces remain distinct.

Root author review finds no further source issue across correctness,
readability, architecture, security and performance. Security check: pass;
no new dependency, credential, permission, network or durable save behavior.
This is author review, not independent acceptance. Genuine earned Ancients401
remains byte-exact after decompression, L33/nextNormal402/Baal uncleared.
Two earned builds/class, complete skill acceptance,30–50active-hour pacing,
economy/endgame, C2–C4/fullG0–G7 and privatev1 remain open.

Exactly two skill rows receive bounded functional credit: **137bounded,
74unverified, one engine-only, one review-needed**; Sorceress21/30. The other211
CSV rows and28other Sorceress JSON object spans remain exact.

[Packet](fixtures/cold-armors/packet.json),
[final checks](fixtures/cold-armors/terminal-results.json),
[delivered source](fixtures/cold-armors/source-delivered.json),
[browser/save audit](fixtures/cold-armors/browser-audit.json),
[inventory audit](fixtures/cold-armors/inventory-audit.json), and
[author review](fixtures/cold-armors/author-review.json) retain bounded proof.
Raw failures, browser reports/traces and frozen hashes are retained in the packet.
Disposable build files are excluded from the archive; their hashes remain.
The archive contains223verified raw members;4210unpacked trace duplicates are
represented by byte-identical entries in the five retained original trace ZIPs.
[Deduplication proof](fixtures/cold-armors/trace-deduplication.json) records each
omission. The60,243,080-byte XZ archive preserves every retained member exactly.

[Cleanup](fixtures/cold-armors/cleanup.json) verifies5955exact task-owned files
removed, including1522disposable build files. The scratch directory is absent,
remaining[]/failures[];18recorded warning PIDs are absent and4514is closed.
All task validation/archive processes finished before deletion. Shared caches
and the active umbrella worktree/branch are preserved.
