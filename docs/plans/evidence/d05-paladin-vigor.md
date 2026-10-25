# D05 — Selected Vigor temporary endurance and cadence

Runtime commit `4cc9c5b`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Selected Vigor now supplies the existing authored2% maximum life and0.5% attack
speed per rank, preserving unlock18, Defiance+Cleansing prerequisites and cap20.
The explicit endurance/cadence adaptation replaces nonexistent movement/stamina
promises in both locales. No coefficient or game-data tuning changed.
Only the living source hero and exact original living fielded merc qualify
while the source lives. Crowd control alone does not suppress the aura.

Temporary maximum is base maximum + floor(base maximum × lifePct × rank),
composed once over fresh equipment/passives. Preserve absolute HP up to the
current eligible maximum. Selection, admission and upgrades grant no HP, refill
or resurrection. Existing fresh-run base-full initialization remains base-full;
existing actual healing and HP orbs may fill the extra capacity. Cadence uses
the existing phase-preserving speed consumer without changing stored speed.

One transient CombatUnit base/applied maximum record prevents carried-wave
compounding. Restore only finite matching identity before fresh composition;
native fresh equipment replaces the baseline without prematurely discarding HP
above its unboosted maximum. Source/recipient death removes capacity and caps HP
before death-orb effects. Authoritative absolute `life-capacity` observations
align playback maximum, current HP and transient identity; they are silent in
the combat log and idempotent when replayed.

BUG182 exposed two actual integration defects: capacity observations before the
required initial status prefix, and the first visible frame retaining the base
maximum. Reconciliation now follows the complete initial status prefix and
precedes turn boundaries/summon-on-start. Initial publication stages only the
contiguous authoritative simulation0 capacity observations after validating
the prefix. Cursor0 and the unchanged recording remain intact. Existing prefix
validation was not broadened or disabled.

Ordinary configuration changes apply next wave. Explicit current-configuration
replay uses original teams/resources/seed and pays no duplicate income. Save
remainsv22: neither temporary capacity nor marker/potency enters persistent
player/merc stats or saves.

## Verification

| Check | Result |
| --- | --- |
| Focused combat/definitions/native/UI/logging | 90 tests / 6 files pass before final lint-only fixture corrections |
| Native/publication/playback after initial-frame fix | 80 tests / 3 files pass |
| Final corrected-source standalone engine | 6,222 tests / 217 files pass |
| Final full regression, including corrected fixtures | 12,396 tests / 528 files pass; two existing skips |
| Final typecheck and global lint/engine purity | Pass |
| Production build with explicit `VITE_E2E=false` | Pass; existing bundle/PWA warnings remain |
| Final production bridge scan | Four chunks, five forbidden patterns absent |
| Final production browser and separate attachment audit | Four language/viewport cases pass |

The final full process ran alone for426.170seconds (Vitest424.80s).
All1,243 source/test/config hashes,760 build hashes, HEAD/Git state and genuine
save digest stayed exactly equal before/after. All1,243 committed source blobs
separately match the validated hashes and working files at `4cc9c5b`.
Existing test-time, bundle/PWA budgets, intermittent BUG180 and independent
acceptance remain unresolved.

Original causal failures and unsuccessful fixture attempts are retained. The
first core RED imported a nonexistent turn-order module; its corrected causal
run had10failures/one control pass. An initial heal fixture omitted effect-level
self-targeting and correctly healed the merc too; its target was made explicit.
The UI/native RED had two genuine prefix failures, two stale-copy failures and
one playback fixture with the wrong result-team field. A fresh native fixture
incorrectly expected base-full HP despite its explicitly synthetic depleted
entry pool; the expectation now preserves that original pool without a refill.
A separate first-frame RED proved expected1020267 versus actual1000262 before
the publication fix. Type/lint fixture corrections use readonly numeric tuples,
actual optional-field absence, explicit matcher assertions and finite metadata
narrowed from unknown. No suppressions, test timeout/worker changes, added skips,
weakened prefix validation or gameplay-gate changes were introduced. Filtered
unselected tests in a causal run are not new source skips.

## Browser and native integration scope

Final corrected-build browser coverage is en/zh-CN ×1280×800/360×640 with an
explicitly synthetic imported L18/four-free-points fixture. Public allocation
learns Prayer, Cleansing, Defiance and Vigor without implicit selection, then
explicitly selects Vigor and None. Eight Save → close → new-page Continue pairs
compare all five complete player/inventory/map/mercs/formation domains. The
separate attachment audit verifies exact changes and unchanged other domains.

Twenty geometry samples across360×640,412×915,640×360,1280×800 and1920×1080 show
no horizontal overflow; all19radio labels measure at least44×44. No captured
page errors. All four final screenshots were actually inspected. Mobile captures
are scrolled detail views with existing fixed header/navigation partly occluding
the heading/continuing rows; no whole-screen accessibility or icon-font
acceptance is inferred. Earlier browser evidence is separately retained under
`browser-initial/`; final corrected-build artifacts are at the archive root.

Native integration uses real generated enemy teams and actual engine execution
with explicitly synthetic entry pools and a registered healing/kill skill. It
proves expanded actual healing, preserved carried HP, fresh bases, first-visible
capacity, original-resource replay/no duplicate income, save/import and no saved
bonus. Engine cases exercise rank1/2/cap20, fractional-base floor, source/recipient
eligibility and death, tied pre-orb capacity removal, real percentage/capped
healing, unchanged orb RNG, cadence, carry/rank reduction/None, invalid metadata
and unchanged input/repeatability. These fixtures do not prove earned campaign
viability, balance or pacing.

## Retention and remaining scope

The [manifest](fixtures/paladin-vigor/manifest.json) retains182original files and
29terminal process records, byte-verified in `raw.tar.gz`. Every entry names its
archive member. Scripts, original failures, successful output, source/build
hashes, synthetic saves and screenshots remain versioned.
[Cleanup](fixtures/paladin-vigor/cleanup.json) removed942exact task-owned files,
verified scratch-root absence and preview port4468closure, and reports no
remaining paths or failures. Shared caches and older campaign evidence remain.

Only Vigor gains a bounded-functional disposition. The213 IDs/order remain:
158unverified,53bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). The54bounded records have different proof
scopes. Eighteen of20 Paladin auras now have supported effects; Sanctuary and
Concentration remain under BUG181. Sanctuary needs authoritative undead
classification and a no-movement repulsion adaptation. Concentration needs an
explicit interruption-prevention rule; a physical-only substitute is insufficient.

The genuine claimed Ancients401/Rite save remains L33 / XP149261 /23,682 gear /
next Normal402, with decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, diagnostic-save promotion or remote publication.
Baal, C2–C4/full G0–G7, all skills, seven classes/two builds, economy/pacing,
endgame/offline/PWA/accessibility/performance and independent acceptance remain
open. The full private-v1 goal, branch and claimed worktree remain active.
