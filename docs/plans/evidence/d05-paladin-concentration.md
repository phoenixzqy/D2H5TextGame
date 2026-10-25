# D05 — Selected Concentration physical damage and Stun protection

Runtime commit `f7aec04`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Concentration preserves unlock18, Blessed Aim prerequisite, cap20 and authored
physicalDamagePct0.035/rank. Explicit selection supplies ordinary physical
increased damage to the living hero/original living fielded merc. Fixed100
landed physical damage becomes103/170 at ranks1/20, through normal mitigation.
Normal85% hit chance, dodge, critical and damage RNG remain authoritative.

This immediate-action engine has no casting windup or damage-caused partial
cast. The [explicit family adaptation](../decisions/D05-paladin-aura-family-v1.md)
protects eligible scheduled basic attacks and ready skills against canonical
Stun interruption. The real Stun remains applied, observed and expires normally;
it is neither removed nor shortened, refreshed or replaced with an immunity.
Only the local blocking view at the shared action gate omits Stun. Freeze and
Paralyze still block, including when combined with Stun. Ordinary mana, cooldown,
level, weapon, target and effect readiness remain unchanged. No proc RNG, extra
or catch-up action, mana, tick, movement or cast-time system is added.

A frozen living source can still protect its original living merc against Stun.
The existing source/recipient side, kind, ownership and life guards remain;
bench/replaced mercs, summons, enemies and forged sources receive no effect.
Exact Concentration-only authored metadata requires literal true; missing, false,
extra, malformed and foreign author metadata is rejected. The copied primitive
projection flag is immutable; absent/false/malformed/foreign direct flags reject
the aura rather than supplying a physical-only fallback.

Normal selection/rank changes apply next wave. Explicit current-configuration
replay uses original teams/resources/seed and pays no duplicate income. Save stays
v22; neither protection, a filtered status view, potency nor timer is persisted.
Both locales describe actual scaling, Stun behavior, remaining controls, normal
costs, living recipients, source death and next-wave rules.

## Verification

| Check | Result |
| --- | --- |
| Final combat/definitions/shared aura/native/UI |121 tests/six files pass |
| Full-corpus schema/load/integrity |322 tests/two files pass |
| Standalone engine |6269 tests/222 files pass |
| Final standard full regression |12451 tests/533 files pass; two existing skips |
| Strict typecheck/global lint/engine purity |Pass |
| Production build, explicit VITE_E2E=false |Pass; existing bundle/PWA warnings remain |
| Production bridge scan |Four chunks/five forbidden patterns absent |
| Production browser/separate attachment audit |Four cases/eight exact five-domain Continue pairs pass |

The full process ran alone for513.228seconds and completed normally. All1248
source/test/config hashes,760 build hashes, HEAD/Git status and genuine save digest
are exactly equal before/after. All1248 committed source blobs separately match
validated hashes and working files atf7aec04. Existing test-time/bundle/PWA
budgets, intermittent BUG180 and independent acceptance remain open. BUG180 did
not recur in this full run; its earlier failures are not erased or closed.

The repository has no validate:data script. The actual corpus is validated by
its existing loader/integrity suites above, plus exact new metadata regressions;
no weaker alternate schema or validator is introduced.

## Native and browser scope

Native integration uses a synthetic L30/three-point character, slow synthetic
gear and a registered physical finisher. Public controls learn Might, Blessed Aim
and Concentration, then explicitly select it. A test-only registered replacement
of monster-weak-melee applies real timed4000ms Stun through the ordinary enemy
cast/status pipeline. No captured input/output or genuine campaign state is
changed. The hero performs its paid scheduled action while real Stun is active;
None leaves the recorded wave unchanged, then explicit replay loses that same
action to Stun and acts later. Reselect/replay reproduces original teams,
projection and events exactly, with no duplicated items/currency/XP. Save/import
preserve selection/derived stats without protection fields. The generic native
case separately verifies actual next-wave removal of the selected projection.

Engine cases cover ranks1/20 over all35 scheduled action slots, exact landed
physical amounts and ordinary misses, real Stun/expiry retained on early victory,
Freeze/Paralyze combinations, None recovery, paid versus insufficient-MP/on-CD
fallback, frozen source/original merc versus bench/summons, invalid authority,
unchanged inputs/stats and deterministic RNG/damage schedules against the same
selected aura without Stun. Shared aura cases verify death/ownership boundaries.

Production en/zh-CN at1280x800/360x640 uses an explicitly synthetic imported
L18/three-point fixture, then public learning/selection/None. Eight Save-close-
new-page-Continue pairs compare the complete player/inventory/map/mercs/formation
payloads. A separate attachment auditor checks exact expected allocation and
selection changes, unchanged other fields, save22 and no transient protection.
Twenty geometry samples at360x640,412x915,640x360,1280x800,1920x1080 show no horizontal
overflow and all21radio labels>=44x44; no page errors were captured. All four final
screenshots were actually inspected. Existing fixed header/navigation partly
occludes the mobile detail heading/continuing rows, and icon/font fallbacks
remain. Full-screen accessibility, safe-area acceptance, earned viability,
balance and pacing are not established by these bounded synthetic fixtures.

## Original failures retained

Initial core RED14failed/2passed included four fixture TypeErrors from spread
array table parameters. Corrected object cases precede production edits and yield
causal10failed/6controls. First GREEN13passed/3failed and engine6266passed/3failed
expose two further incorrect fixture assumptions: normal85% hit chance remains
when dodge is0; carried cooldowns use milliseconds, so30 expires before1700.
Assertions now distinguish seeded misses from exact landed103/170 damage while
retaining all35scheduled actions, and the on-CD fixture uses30000ms. No damage,
RNG, resource, readiness or timeout implementation changes accompany these repairs.

Native/UI first run96passed/4failed retains two stale20-versus21radio counts and
two old descriptions. Native real-Stun/core/definition cases already passed.
No new skips, suppressions, weakened gates, timeouts, worker/discovery changes,
historical fixture changes or genuine replay were introduced. Preview exit-15
is deliberate exact-owned-PID SIGTERM after all browser consumers finished,
recorded separately; it is not a failed validation.

## Retention and remaining scope

The [manifest](fixtures/paladin-concentration/manifest.json) retains114 original
raw files and19terminal process records, byte-verified in raw.tar.gz. Scripts,
original failures, successful outputs, source/build hashes, synthetic saves and
screenshots remain versioned. [Cleanup](fixtures/paladin-concentration/cleanup.json)
removed874 exact task-owned files, verified scratch absence and4470 closure,
and reports no failures or remaining paths. Shared caches and campaign evidence
remain untouched.

Only Concentration gains a bounded-functional disposition. All213 IDs/order
remain:156unverified,55bounded-functional, one bounded-engine-functional (Ice
Arrow), and one review-needed (Cold Mastery). The56bounded records have different
proof scopes. All20Paladin auras now have supported local effects; BUG181 remains
open for independent whole-family/earned class-build acceptance.

Genuine Ancients401/Rite save remains L33/XP149261/23682gear/nextNormal402,
decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action or remote publication. Baal/C2-C4/fullG0-G7, all213
skills, seven classes/two builds, economy/pacing/endgame/offline/PWA/accessibility/
performance and independent acceptance remain unfinished. The full private-v1
goal and existing branch/worktree claim remain active.
