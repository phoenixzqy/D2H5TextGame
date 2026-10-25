# D05 — Selected Redemption corpse-backed recovery

Runtime commit `af8b8d7`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Selected Redemption consumes one oldest useful corpse from the same authoritative
wave-local FIFO as Corpse Explosion and Poison Explosion. That one corpse restores
both the living source hero and exact original living fielded merc. Preserve
unlock30, Meditation prerequisite, cap20 and authored2% lifeRegenPct/manaRegenPct
per rank. Redemption-only JSON owns20 base HP,10 base MP and5000ms interval.
These new recovery amounts and interval are provisional local defaults.
Each resource independently floors base × (1 +0.02 × rank), then caps to missing
resources: ranks1/2/20 restore20/20/28HP and10/10/14MP per eligible recipient.
Full resources, invalid maxima and zero-rounded recovery supply nothing. If
nobody can recover a positive amount, preserve the body. Empty opportunities do
not bank recovery. There is no baseline regeneration or Prayer/Meditation synergy.
Existing `item.redemption` remains a separate governed active self-heal.

The existing complete death closure is the sole corpse supplier: primary enemy
monsters only, once. Initial dead inputs, summons, ownership-forged victims,
orphan-only deaths and carried bodies never qualify. First recovery waits one
full interval after each wave entry. Periodic deaths and ordinary MP settlement
precede a pulse; the pulse precedes surviving tied active actions. Earlier CE/PE
casts win their body; a due pulse wins the timestamp tie. Source death stops the
aura, crowd control alone does not suppress it, and dead recipients never revive.
Existing deadline/action-cap/battle-end rules prevent fabricated later recovery.
Normal HP settlement and MP commit/cap-carry reset are reused. Positive resource
events and localized corpse consumption are truthful; no extra RNG, cast, action,
cooldown or mana payment. Save remainsv22 without corpses, timers or potency.
Ordinary edits apply next wave. Explicit current-configuration replay uses the
original teams/resources/seed and pays no duplicate income.

## Verification

| Check | Result |
| --- | --- |
| Focused combat/definitions/native/UI/localized logging | 210 tests / 6 files pass |
| Standalone engine regression | 6,208 tests / 215 files pass |
| Final full regression | 12,377 tests / 525 files pass; two existing skips |
| Final typecheck and global lint/engine purity | Pass |
| Production build with explicit `VITE_E2E=false` | Pass; existing bundle/PWA warnings remain |
| Production bridge scan | Four chunks, five forbidden patterns absent |
| Final production browser and separate attachment audit | Four language/viewport cases pass |

The final full process ran alone and took464.333 seconds (Vitest463.05s).
All1,239 source/test/config hashes,760 build hashes, HEAD/Git state and genuine
save digest stayed exact throughout. All1,239 committed source blobs separately
match validated hashes. Existing test-time, bundle/PWA budgets, intermittent
BUG180 and independent acceptance remain unresolved.

Original causal combat/definition/UI failures remain retained. An initial seed7
resource-cap fixture could drop orbs; the corrected seed42 fixture explicitly
isolates no-orb recovery, while separate real seed7 before/after-pulse deaths
verify unchanged orb RNG. Empty-pool comparison initially included legacy
turn-marker/UI-delay timing affected by additional pulse boundaries. It now
compares every non-turn event with actual timestamps, exact teams and winner;
live enemy attacks exercise RNG. A reciprocal DoT fixture missed its intended
exact6000ms death; integer rate1 with life=deathAtMs/1000 makes the timing causal.
The Meditation fixture is L24 with unlearned Redemption: its new radio correctly
stays disabled, with count18 and existing resource/exclusivity checks intact.
Two strict event-union narrowing errors were corrected without suppressions.
No timeout, worker count, skip, gameplay rule or gate was weakened.

## Browser and native integration scope

Browser coverage is en/zh-CN ×1280×800/360×640 using an explicitly synthetic
imported L30/four-free-points fixture. Public allocation learns Prayer, Cleansing,
Meditation and Redemption without implicit selection, then explicitly selects
Redemption and None. Eight Save → close → new-page Continue pairs compare all
five complete player/inventory/map/mercs/formation domains. The separate
attachment audit verifies the exact changes and unchanged other domains.

Twenty geometry samples across360×640,412×915,640×360,1280×800 and1920×1080 show
no horizontal overflow; all18 radio labels measure at least44×44. No captured
page errors. All four final screenshots were inspected. Mobile captures are
scrolled detail views with existing fixed navigation; this is bounded geometry
evidence, not whole-screen accessibility acceptance.

Native tests use real generated enemy teams and real engine execution with
explicitly synthetic large gear/depleted entry pools and a registered single-
target kill skill. They prove actual corpse-backed20HP/10MP recovery, public
allocation, original-resource replay, no duplicate income and exact save/import.
Engine cases exercise ranks/caps/eligibility, useful-only debit, FIFO and CE/PE
competition, exact periodic ties/deadline, source/recipient death, orphan closure,
invalid metadata/ownership, wave reset, alternate rounding and MP cap carry.
These fixtures do not prove earned campaign viability, balance or pacing.

## Retention and remaining scope

The [manifest](fixtures/paladin-redemption/manifest.json) retains121 original files
and21 terminal process records, byte-verified in `raw.tar.gz`. Every manifest entry
names its archive member. Scripts, original failures, successful outputs,
source/build hashes, synthetic saves and screenshots remain versioned.
[Cleanup](fixtures/paladin-redemption/cleanup.json) removed881 exact task-owned
files, verifies scratch-root absence and preview port4467 closure, and reports
no remaining paths or failures. Shared caches and older campaign evidence remain.

Only Redemption gains a bounded-functional disposition. The213 IDs/order remain:
159 unverified,52 bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). The53 bounded records have different proof
scopes. Seventeen of20 Paladin auras now have supported effects; Sanctuary,
Vigor and Concentration remain under BUG181.

The genuine claimed Ancients401/Rite save remains L33 / XP149261 /23,682 gear /
next Normal402, with decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, diagnostic-save promotion or remote publication.
Baal, C2–C4/full G0–G7, all skills, seven classes/two builds, economy/pacing,
endgame/offline/PWA/accessibility/performance and independent acceptance remain
open. The full private-v1 goal, branch and claimed worktree remain active.
