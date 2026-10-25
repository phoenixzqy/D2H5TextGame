# D04 — Blaze, Fire Wall and Thunder Storm

2026-10-25; root sole writer and author reviewer. Engine `b1cfe5e8`; presentation
and final source `f683dfad`. Independent design/QA, earned balance and full-v1
acceptance remain open. [Contract](../decisions/D04-sorceress-periodic-spells-v1.md);
BUG234/235.

## Behavior

The three spells now require a legal paid cast and capture source/rank in a
finite combat-only status. Existing damage, rank growth, targets, prerequisites,
MP and cooldowns remain. Provisional JSON timing is three seconds with one-second
intervals: an immediate pulse and two later pulses, with no expiry-endpoint pulse.
Every pulse selects current living hostiles and uses ordinary seeded hit/base/
crit, mitigation, mastery, combos, shields, Burn/Paralyze, deaths, corpses and orbs.
It uses no ambient-aura guaranteed-hit shortcut.

Stun/Freeze does not interrupt a paid spell; source death stops it. Different
spells coexist; the same active spell cannot recast. Later pulses require no
action, payment or cooldown reset. Periodic spells do not trigger Frozen/Shiver/
Chilling Armor or explicit direct-hit recovery/self-cost. Existing continuous
damage/death/expiry and ambient auras precede spells; spells precede ordinary
actions at a common timestamp, with winner checks between phases.

Standard status clocks preserve paid phase/rank across native waves without
replaying the preceding wave's endpoint at zero. Fresh native source projections
remove invalid carry; positive reallocation and priority removal preserve paid
rank. Blaze retains governed equipment grants for other-class heroes and mercs.
Native Fire Wall/Thunder Storm remain Sorceress hero-only. Fresh runs and reopened
saves start unpaid; no durable timer/rank field or save-version change.

BUG235 fixes a shared terminal cooldown cache: every unit's remaining cooldowns
are published from the expiry map before the terminal result. A wave-ending cast
therefore retains its paid cooldown. Five historical compatibility files now
assert the correct terminal values; original recording goldens still compare
every other field. No blanket golden regeneration or disabled assertions.

Both locales expose per-pulse damage, duration, interval/count, payment and real
status rules, plus localized positive spell chips. Exactly three Sorceress JSON
objects gain timing; the other 27 object spans and all original fields are exact.
No-movement field adaptations and increased total damage require earned tuning.

## Verification

176 new tests: 35 definition/schema, 96 native-projected causal combat, 15 actual
native wave/store, 24 bilingual Skills and 6 combat presentation cases. Ranks
1/2/20 and seeds 7/19/41/97 use an independent ordinary RNG oracle. Coverage includes one
payment, multitarget pulses, control persistence, mitigation/crit, death ties,
finite expiry/nonrecast/coexistence, malformed paid payloads, native carry/phase/
source invalidation and governed hero/merc Blaze. Causal cases compare immutable
input, repeated recordings, unrecorded results and actual combat-store playback.

Final focused **730 tests / 14 files** pass, including loader and native Mage/
runeword compatibility. Final engine **8088/302**, repository types/lint, explicit browser lint,
production build, actual offline-precache check and five-chunk bridge scan pass.
Final quiet full: **16,236 passed / 730 files / two existing skips**, 766.16s.
All other task validation processes and the preview server were terminal first.
All 1,479 frozen source/configuration/contract blobs match delivered Git content,
and all 761 build hashes remain exact. Existing test-time budgets and bundle/art-manifest
cache warnings remain; no broad performance acceptance.

## Production browser and saves

Final 12/12: three spells × en/zh-CN × desktop 1280×800/mobile 360×640. Public creation,
export/import/equip and allocation 1→2 use a declared synthetic L30 resource cap.
Native Catacombs combat visibly casts, deals Fire/Lightning damage and applies
Burn/Paralyze. Bounded public DOM observations verify exact MP debits before
recovery. No runtime store bridge is exposed. These are mechanics fixtures,
not earned progression, affordability or build/pacing evidence.

Every case closes its page, continues online in a fresh page and exports again,
then repeats with networking disabled and a response served by the service
worker. All 24 pairs match exactly across player, inventory, map, mercs, formation
and meta, and contain no transient paid spell state. Five geometry sizes per
case give 60 checks for horizontal overflow and allocation control heights ≥44px.

24 screenshots are retained; four were inspected. Desktop Blaze title and paid
combat chip/MP are visible; mobile Thunder Storm chip/MP is near the viewport
edge. Tree captures do not show the complete detail prose: browser text/geometry
assertions and component tests cover it separately. Existing navigation/lock
glyph boxes and full accessibility acceptance remain.

## Failures and limits

Original corrected REDs show all three spells only attempting damage at900ms,
instead of900/1900/2900while the caster cannot act. The first Thunder Storm RED
omitted Static Field, a transitive prerequisite; both the invalid fixture failure
and corrected three-skill RED remain. Separate BUG235 REDs prove missing terminal
cooldowns. Strict schema, typing/lint and historical compatibility failures are
retained with their corrections.

An added coexistence fixture initially omitted the other two learned spell
ranks; the fixture was corrected without changing the engine. The first full
run found stale native Mage cooldown and runeword Blaze carry expectations.
It was interrupted through its exact verified task runner after those failures.
The Mage test now asserts cast 2000/end 5820 and 180 ms remaining; the runeword
test removes only invalidated paid Blaze while preserving unrelated carry and
the original recording. The subsequent complete quiet full run passes.

The first browser fixture killed early Blood Moor enemies, and legitimate
same-timestamp kill-orb refunds concealed the debit from DOM observation.
Catacombs enemies survive the first pulse and expose exact payment. A second
browser attempt expected the Chinese synonym灼烧instead of the existing combat
label燃烧; only the assertion changed. Failed reports and original traces remain.

Root five-axis author review and security check pass for this local change.
There is no independent review or earned balance sign-off. Genuine earned
Ancients401 remains byte-exact after decompression: L33/nextNormal402/Baal
uncleared. No genuine campaign actions, push, PR, merge or deployment occurred.

Exactly three skill rows receive bounded functional credit: **140 bounded,
71 unverified, one engine-only, one review-needed**; Sorceress 24/30. The other
210 CSV rows and ID order remain byte-exact; only verification/evidence columns
change on the three selected rows.

[Packet](fixtures/periodic-spells/packet.json),
[final checks](fixtures/periodic-spells/terminal-results.json),
[delivered source](fixtures/periodic-spells/source-delivered.json),
[browser/save audit](fixtures/periodic-spells/browser-audit.json),
[inventory audit](fixtures/periodic-spells/inventory-audit.json) and
[author review](fixtures/periodic-spells/author-review.json) retain bounded proof.
The 77,087,236-byte XZ archive contains 95 verified raw members, including both
original failed trace ZIPs. Another 704 unpacked trace duplicates are represented
byte for byte by members of those ZIPs, with
[deduplication proof](fixtures/periodic-spells/trace-deduplication.json). Every
non-build raw file is retained directly or through this exact correspondence;
disposable build bytes are excluded and their hashes remain.

[Cleanup](fixtures/periodic-spells/cleanup.json) verifies 1,560 exact task-owned
files removed, including 761 build files. The scratch directory, 26 recorded
PIDs and two observed browser profiles are absent; port4515 is closed,
remaining[]/failures[]. Shared caches and the active umbrella worktree remain.

Full C2–C4/G0–G7, seven classes/two earned builds each,30–50active-hour pacing,
economy/endgame and privatev1 remain open.
