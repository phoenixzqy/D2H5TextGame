# Work plan and execution ledger

## Owner execution update — 2026-11-05

Continue implementing the full private v1 scope. At the owner's direction,
**stop all gameplay testing from this point forward**: no combat/equipment/
crafting execution tests, balance simulations, campaign reruns, browser
playthroughs or soak runs. Use source review and static type, lint, schema and
data-reference checks only. Gameplay validation, population balance and the
30–50-hour pacing measurement are deferred to the owner's later playtest;
unknown results remain unknown and do not block remaining implementation.
This instruction supersedes earlier test/gate execution requirements for this
work. CI remains excluded. Do not spend further time building certification
harnesses or collecting gameplay evidence. Finish missing production behavior,
content and application integration, and report implementation separately from
deferred validation.

## 2026-11-05 — Source implementation handoff

The owner stopped agent-run gameplay testing. [Current implementation handoff](implementation-handoff.md)
maps all 21 feature groups to production source and separates implementation
from deferred owner gameplay acceptance. Latest repairs localize monster tier
suffixes, restore ordinary armor/two-handed tiers (178 appended rows), and
correct stale compiler fixtures. Full application/Node typecheck, scoped ESLint,
static schema/reference/level coverage and exact predecessor checks pass.
Source implementation is complete under the revised owner scope; earlier
active-goal entries below are historical. No gameplay execution or simulations
were run after the stop instruction. Owner gameplay acceptance, pacing and
balance remain deferred and unverified.

## 2026-11-05 — Ordinary shield tier implementation complete

[BUG791](evidence/p15-shield-progression.md): 29 appended ordinary picks across
14 tables restore usable shield tiers, including normal Dragon Shield sources.
Original data preserved; scoped strict types/lint pass. Prior 57 distinct checks
completed before the gameplay-testing stop. Gameplay validation is deferred;
continue remaining production implementation without further test runs.

## 2026-11-05 — Ordinary usable claw tiers restored

[BUG790 evidence](evidence/p15-claw-progression.md): 49 appended picks across
23 ordinary source tables fill missing existing claw tiers within frozen finite
envelopes. Act III trash gains Hand Scythe39–49; existing26–38 and all old rows
stay intact. Existing bases/stats/requirements/engine/UI/save remain unchanged.
Latest91distinct affected cases pass (availability/schema/native selection,
reward/equip/mastery/custody, MF and historical exact preservation), plus scoped
strict types/lint. Exact preimage text reconstructs after stripping only appended
suffixes. Provisional added weights change relative drop odds; earned acquisition,
Act III power and pacing are not accepted. Root self-review only; local/uncommitted.
Initial fixture/tool errors stay retained; exact disposables cleaned, packet retained.

Previous goal turn was status-only/no progress; this increment implements content
and completes verification. Full private v1 remains active and unfinished:
remaining gameplay/content, attained power/acquisition/crafting economy,
defeat/retry/population balance,30–50active-hour pacing, higher difficulties/
endgame and integrated acceptance remain. Historical14/14Normal/210contexts/
formal0/210 and latest retained Act III6/14paired clears are unchanged. No broad
suites, campaign reruns or renewed spent budgets. Browser works, CI excluded,
owner playtest later; no pending question or external blocker.

## 2026-11-05 — Selected elite affixes visible on cards and logs

[BUG789 evidence](evidence/p15-elite-affix-visibility.md): all six currently
rollable elite modifiers retain their selected native identity and show full
localized labels on enemy cards and combat-log names. Cards wrap labels outside
truncated names, expose a labelled list, and update on locale changes. Ordinary
and unmodified boss controls stay unlabelled. Six new cases plus seven existing
name/immunity cases have latest passes; filtered skips are excluded. Scoped
strict types/lint and four en/zh mobile/desktop Chromium fixtures pass with no
console errors/warnings, failed requests or horizontal overflow. Root self-review
only; locally verified/uncommitted. WSL lacks some decorative emoji glyphs; full
text remains readable. This closes selected-affix visibility, not all affix rules.

Full private v1 remains unfinished. Act III progression/equipment/acquisition
and crafting economy, defeat/retry and population balance, 30–50 active-hour
pacing, remaining gameplay/content, higher difficulties/endgame and integrated
acceptance remain. Historical 14/14 intended Normal completions, 210 retained
contexts and formal balance acceptance 0/210 are unchanged. No spent budgets
renewed, no broad suites or campaign reruns. Browser works; CI excluded; owner
playtest later. No pending question or external blocker. Exact owned processes,
port and disposable caches are cleaned; root retains the named evidence packet
through umbrella acceptance.

## 2026-11-05 — Standard Lightning Enchanted implemented and reviewed

[BUG788 evidence](evidence/p15-standard-lightning-affix.md): standard carriers
now gain50lightning resistance (cap75) and a25% receiving-direct-hit40–60base
bolt. Existing active Lightning and actual promoted ActI's active-only exception
remain. Self-review caught secondary impact bolts incorrectly earning extra
retaliation rolls; the sole dispatch site now preserves their auxiliary identity.
Causal RED and final34affected cases pass after correction; the latest distinct
GREEN union is118cases. Scoped strict types/lint and four en/zh mobile/desktop
Chromium CombatLog fixtures pass, plus a final zh mobile native impact check.
Root self-review only; locally verified/uncommitted. Visual affix tags remain
open; constructed fixtures grant no earned progression or pacing credit.

Full private-v1 remains unfinished; historical14/14Normal/210contexts/formal
balance0/210 stay unchanged. Continue gameplay/content, attained ActIII
power/acquisition/crafting economy, retry/population balance,30–50active-hour
pacing, higher difficulties/endgame and integrated acceptance. No spent budgets
renewed; browser works; CI excluded; owner playtest later. No external blocker
or pending question. Exact processes/port/cache cleaned; root retains the named
packet through umbrella acceptance.

## 2026-11-05 — Fire Enchanted implemented; stale Doll fixtures corrected

[BUG786/787 evidence](evidence/p15-fire-enchanted.md): separate rollable Fire
Enchanted adds50fire resistance (cap75) and one50-base-fire hostile death burst.
Extra Fire Damage/Fire Ball remains; an affixed Doll retains both death payloads.
Native identity, Conversion and deferred death-tail rules remain intact. Initial
88affected cases and final68selected cases pass; scoped strict types/lint and
four en/zh mobile/desktop Chromium CombatLog fixtures pass. Two stale Doll
fixtures reproduce against exact pre-Fire sources and now pass corrected.
Root self-review only; locally verified/uncommitted. Visual affix tags remain
open; constructed log fixtures grant no earned progression or pacing credit.

Historical14/14Normal/210contexts/formal balance0/210 unchanged; full private-v1
remains active and unfinished. Continue remaining gameplay/content, attained
ActIII power/acquisition/crafting economy, retry/population balance,30–50active-
hour pacing, higher difficulties/endgame and integrated acceptance. No spent
campaign/pilot/sample/retry budget renewed. Browser works; CI excluded; owner
playtest later. No pending question or external blocker. Root retains the named
packet through umbrella acceptance; exact process/port/cache cleanup is recorded.

## 2026-11-05 — Cold Enchanted passive Frost Aura implemented

[BUG785 evidence](evidence/p15-cold-elite-frost-aura.md): the existing passive
scheduler now receives authored Cold Enchanted metadata through the strict
schema/type/factory channel. Every five seconds from 5s, it deals 15 base cold
damage plus two-second Chill to living player units. Frost Nova and the recent
cold-resistance repair remain; missing metadata preserves archetype behavior.
All 98 affected cases, final scoped strict types/lint and four en/zh mobile/
desktop Chromium fixtures pass. Actual party pulses, no-aura/action controls
and localized CombatLog rendering are verified. Initial fixture/type/lint
failures remain preserved; root self-review only, locally verified/uncommitted.

This closes the Cold Enchanted aura gap, not full affix or full-v1 acceptance.
Historical 14/14 intended Normal completions/210 contexts/formal balance 0/210
remain unchanged. Continue remaining gameplay/content and attained Act III
power/acquisition/economy/retry/pacing plus difficulty/endgame and integrated
bilingual/mobile/a11y/save/PWA/performance/soak/independent acceptance. No spent
campaign/pilot/sample/retry budget is renewed. Exact processes/port/cache are
cleaned; root retains the named evidence packet through full-v1 acceptance.
Browser works; CI excluded; owner playtest later; no pending question or
external blocker. Full private v1 remains active and unfinished.

## 2026-11-05 — Cold Enchanted resistance fixed; Druid pilot closed out

[BUG784 evidence](evidence/p15-cold-elite-resistance.md): Cold Enchanted now
adds the specified 50 percentage points of cold resistance through authored
metadata and native construction, capped at 75 after rare-tier resistance.
Its existing Frost Nova remains; the separate Frost Aura requirement is open.
All 83 affected cases, scoped strict types and lint pass. Four bilingual
mobile/desktop Chromium runtime fixtures pass; these do not establish rendered
CombatScreen, earned progression, population balance or pacing acceptance.
Root self-review only; locally verified and uncommitted.

[Druid pilot closeout](evidence/p15-act3-druid-earned-power-pilot.md): 123 fully
retained winning training runs prove level 25 to 31 and 34.68 simulated combat
minutes. The time limit stopped execution; level 47 and the boss diagnostic
were not demonstrated. Missing final stopped-state evidence and partial
admission 124 remain explicit. No rerun or extension of spent budgets.

Full private v1 remains unfinished. Historical 14/14 intended Normal completions
and 210 retained contexts do not grant formal balance acceptance (0/210).
Remaining work covers gameplay/content, attained power and acquisition/crafting
economy, retry/population balance, 30–50 active-hour pacing, higher difficulties/
endgame and integrated bilingual/mobile/a11y/save/PWA/performance/soak and
independent acceptance. Browser works; CI is excluded; owner playtest follows
implementation. No pending question or external blocker. Exact task caches and
processes are cleaned; root retains both named evidence packets through full-v1
acceptance and removes them after all consumers finish.

## 2026-11-05 — Act III retained-input benchmark reconciled

[Benchmark evidence](evidence/p15-act3-retained-input-benchmark.md): one bounded
native launch completes28paired manual/idle attempts from14exact retained saves.
149/168planned waves settle,19remain unreached; individual results preserve all
losses and draws. Native13.160s/process21.526s/43.35MB stay within frozen limits.
A separate no-replay reader authenticates every result/journal join and source
manifest. Initial v32/v33 reader assumption fails and stays retained; corrected
exact-migration/preservation checks pass. No production behavior change or broad
checks. Native/supervisor/reader handles are terminal and packet cache is removed;
root retains the exact named packet through umbrella acceptance. Previous turn
was status-only/no progress; this increment supplies new current-source evidence.
Historical14/14Normal/210contexts/formal0/210 unchanged; full privatev1 stays
active and unfinished. Browser works; CI excluded; owner playtest later.

Six retained builds clear both modes. Different prefix survival and boss-timeout
failures remain. Next resolve attainable ActIII power/acquisition at current
progression references before further tuning: retained heroes25–47against
level42–47enemies are not recommended-power evidence. No spent allowance is
renewed. Gameplay/content, economy/pacing/difficulty/endgame and integrated
bilingual/mobile/a11y/save/PWA/performance/soak/independent acceptance remain.
No external blocker or pending question.

## 2026-11-05 — Native Summoner Teleport implemented

[BUG782 evidence](evidence/p15-summoner-teleport-cadence.md): existing local
Fire Ball/Frost Nova6s overrides make room for the authored1000ms Teleport.
Eighteen distinct affected cases, strict38-row ActII schema, scoped strict
718-file types and two-file lint pass. Four corrected bilingual mobile/desktop
Chromium projections pass with real paid/expiry events and no browser/network
issues. Initial filter/type/visual-fixture mistakes remain preserved. Root
self-review only; retained packet, exact caches/processes/port cleaned. Previous
turn was status-only/no progress; this increment completes the correction.
Historical14/14Normal/210contexts/formal0/210 unchanged; full privatev1 remains
active and unfinished. Continue gameplay/content and progression/economy/pacing
and integrated acceptance. Browser works; CI excluded; owner playtest later.

## 2026-11-05 — Crafting target inspection implemented

[BUG781 evidence](evidence/p16-crafting-target-inspection.md): localized lazy
Details controls show existing item stats and shared ordered socket contents
before selection/preview; preserved v18 contents stay inactive. Four causal REDs
become GREEN; all58affected crafting cases, four-file lint and scoped strict types
(991imported files) pass. Two actual-panel en/zh Chromium flows cover five viewport
sizes, keyboard/focus and unchanged game stores, with zero browser/network issues.
Initial discovery/fixture-type errors remain documented. Previous turn was
status-only/no progress; this increment closes a G4/G5 usability gap. Root
self-review only; packet retained, exact processes/port/caches cleaned. Historical
14/14Normal/210contexts/formal0/210 unchanged; full privatev1 stays active and
unfinished. Continue remaining gameplay/content, progression/acquisition/economy/
pacing and integrated acceptance. Browser works; CI excluded; owner playtest later;
no pending question.

## 2026-11-05 — Two Act V champion artwork gaps closed

[BUG780 evidence](evidence/p16-act5-champion-artwork.md): canonical Blood Lord
and Frozen Terror now resolve attributed local official bestiary stills through
existing overrides. Two256×256PNGs total54,263bytes; no generation/resolver/
gameplay change. Nine affected unit cases, one-file lint, strict override schema
and four actual-screen en/zh mobile/desktop cases pass with zero browser warnings/
errors. Original champion-immunity failed result stays preserved; no closed
combat diagnostic rerun. Root self-review only; packet retained, processes
terminal and task caches removed. Previous turn was status-only/no progress;
this increment closes a player-visible content gap. Historical14/14Normal/
210contexts/formal0/210 unchanged; full privatev1 remains unfinished. Next
continue outstanding gameplay/content and progression/economy/pacing acceptance.
Browser works; CI excluded; owner playtest later; no pending user question.

## 2026-11-05 — Native retry plans retained before playback

[BUG779 evidence](evidence/p15-retry-plan-capture.md): each retry returns and
journals the exact installed plan before playback; seed/area/length are checked.
Two causal REDs become GREEN, covering contiguous first-wave losses, unreached
suffixes, journal mutation and complete victory/native disposal/early stop.
Scoped strict types (957 imported files) and two-file lint pass. Only new
constructed controls run; older cases and spent campaign/sample/retry budgets
remain closed. Previous goal turn was status-only/no progress; this increment
implements the missing boundary. Root retains the named packet; processes are
terminal and task cache removed. Historical 14/14 Normal/210 contexts/formal
0/210 unchanged; population/power/acquisition, economy/pacing, gameplay and
integrated full-v1 acceptance remain open. Browser works; CI excluded; no user hold.

## 2026-11-05 — Actual retained-input retry adaptation selected

[P15 selection](evidence/p15-retained-retry-adaptation.md) materializes 210
build-specific native requests, including 70 boss contexts: unchanged first
entry, learned signature/support ranks and explicit owned stat bundles after
nonwin, preserved priorities/equipment, at most three contiguous attempts.
Separate static readback passes all 210; two initial historical/prepared-source
consumer mistakes are retained and corrected without gameplay. Initial
point/cap/alias checks pass. No production edit, campaigns, samples, holdout,
broad checks or spent-budget renewal. Root retains the named packet; no
disposables. Previous goal turn was status-only/no progress. Retained adaptation
selection is complete; statistical population/ordinal/pity/manual/idle,
recommended power/acquisition, economy/pacing and integrated acceptance remain
open. Historical 14/14 Normal/210 contexts/formal 0/210 unchanged; full v1 remains
active and incomplete. No user hold; browser works; CI excluded.

## 2026-11-05 — Retry policy preserved before evaluation

[BUG778 evidence](evidence/p15-retry-policy-snapshot.md): the existing retry
harness snapshots the complete request before use, journals its versioned
declaration before admission and detaches published outcomes/adaptation records.
Three causal REDs become GREEN; scoped strict types and two-file lint pass.
Only new constructed controls run; older controls and spent campaigns/retries/
samples remain closed. Previous turn was status-only/no progress; this increment
implements the missing boundary. Root retains the named packet with readback and
cleanup; no disposables. Actual population/adaptation policy selection, economy/
pacing and full-v1 acceptance remain open. Historical 14/14 Normal/210 contexts/
formal 0/210 unchanged; continue the full objective in the existing worktree.

## 2026-11-05 — Ordinary manual ordinal partition recorded

[Source proof and failed witness](evidence/p15-manual-ordinal-partition.md):
all 29 current areas have a sufficient manual plan period of 13 at fixed other
inputs; replay transforms preserve it. Idle, actual admission, quest/reward
state and population weights retain separate identities. The one native witness
launch fails at Vite startup before game loading, with zero plan calls; it stays
closed. Source-only inspection/readback, selected hashes and exact cleanup are
retained. Previous turn was status-only/no progress; this decision resolves a
population boundary without gameplay or renewed budgets. Next define population,
prefix/pity and contiguous retry policies. Historical 14/14 Normal/210 contexts/
formal 0/210 unchanged; full private v1 remains unfinished.

## 2026-11-05 — Native checkpoint role coverage fixed

[BUG777 evidence](evidence/p15-checkpoint-role-coverage.md): completed attempts
retain the exact installed plan. Population report v2 separates absent,
planned-but-unplayed and historical unknown roles, retaining partial repeated
roles and all started denominators. Six causal REDs become GREEN; 22 reporter
and two new native controls pass, scoped strict types/lint pass. No gameplay or
save change; no campaign, population sample or holdout read. All run budgets stay
closed. Root retains the exact named packet; source/readback/cleanup recorded,
no disposables. Previous goal turn was status-only/no progress; closeout is now
recorded. Next resolve remaining population/adaptation and production gaps.
Historical 14/14 Normal/210 contexts/formal 0/210 unchanged; full v1 unfinished.

## 2026-11-05 — Exact retained-power inputs pinned

[P15 baseline evidence](evidence/p15-retained-power-baseline.md): all 210
contexts resolve to 183 selected sources plus two existing CE order derivatives.
Complete container/raw-save/domain/snapshot and ancestry joins pass extraction
and a separate reader in 29.727 aggregate seconds, with zero combat/reward rolls.
All original boundaries, five failures, eleven noncanonical contexts and known
lineage costs remain. Exact-input status is separate from the still-open broader
power/acquisition/population/adaptation requirements. Root retains the named
4.44 MB packet; both handles exit 0, exact PIDs absent, no disposables/failures.
Previous goal turn was status-only/no progress; this turn produces the policy,
manifest and verified handoff. No runtime change or broad checks. Historical
14/14 Normal/210 contexts/formal 0/210 remain unchanged. Next define population,
ordinal/prefix/pity and retry boundaries; full v1 remains active and incomplete.

## 2026-11-05 — Selected Act V champion immunities implemented

[BUG775/776 evidence](evidence/p15-act5-champion-immunity.md): actual champion
Blood Lords reject fire and Frozen Terrors reject cold; other tiers retain
75% resistance and susceptibility. Focused engine/store/UI checks, scoped types,
lint and strict Act V schemas pass. All four bilingual mobile/desktop browser
iterations complete their mechanic/layout assertions; the final zero-warning
gate fails on two absent artwork mappings. Preserve `passed:false` and readable
fallbacks. Evidence and exact process/cache cleanup are complete; no planner,
skill, reward or save change. Historical acceptance counts remain unchanged.

## 2026-11-05 — Fast elite attack speed implemented

[BUG773/774 evidence](evidence/p15-fast-elite-speed.md): authored Fast now applies
1.5×base attack speed through native waves/factory; Charge, other stats/RNG and
planning remain intact. Two causal REDs become GREEN. Initial100/101affected
checks plus the corrected stale registry case establish101distinct passes;
scoped strict930files/zero diagnostics, seven-file lint and four bilingual
mobile/desktop native Chromium cases pass. Self-review only. Root retains the
named packet; driver terminal, PID/port/cache absence verified. Previous status
turn observed browser success and completed cleanup; no source change that turn.
Historical14/14Normal/210sources/formal0/210 unchanged; no spent budgets renewed.
Fullv1 progression/economy/pacing, difficulty/endgame and integrated acceptance
remain unfinished. Browser works; CI excluded; owner playtest later; no user hold.

## 2026-11-05 — Equipment picker candidate work is bounded

[BUG772 evidence](evidence/p16-equipment-picker-pages.md): picker now renders
at most50options; localized pages and cross-page keyboard focus retain every
candidate, native eligibility/equip and holdings.29affected UI cases, scoped
strict980files/zero diagnostics and two-file lint pass. Ten bilingual/five-size
Chromium cases pass; constructed2,001item opening falls684.9–952→79.9–174.1ms,
maximum render commit380.6→36.4ms. No whole-app INP, earned or pacing claim;
broader BUG147 remains separate. Self-review only. Root retains named packet;
driver handles terminal, PIDs/port/cache absence verified. Historical14/14Normal/
210sources/formal0/210 unchanged; no spent budgets renewed. Fullv1 progression/
economy/pacing, difficulty/endgame and integrated acceptance remain unfinished.
Browser works; CI excluded; owner playtest later; no pending user question.

## 2026-11-05 — Provisional Duriel pressure implemented

[Pressure evidence](evidence/p15-duriel-pressure.md) implements chapter Attack
220→350 paired with authored critical1.25×. Optional finite monster multiplier
preserves absent defaults/critical chance/RNG; ordinary Duriel and replays use
the authored override. Six retained entry projections justify the paired choice,
not population safety.52distinct affected cases, scoped strict935files/zero
diagnostics, changed-file lint, strict38monster/six-area validation and native
Chromium schema/construction/Charge checks pass. Existing chapter numeric test
now asserts passive cold/Chill windows separately; intermediate fixture/type/
import/script failures stay retained. Self-review only. Root retains exact
named packet; all handles terminal, PIDs/port/cache absence verified. Previous
status turn made no source changes; this increment completes implementation and
verification. BUG731 stays open: historical cohorts predate tuning; win rates,
duration/acquisition/pacing remain unaccepted. Historical14/14Normal/210sources/
formal0/210 unchanged; no spent budgets renewed. Fullv1 progression/economy,
difficulty/endgame and integrated acceptance remain unfinished. Browser works,
CI excluded, owner playtest later, no pending question.

## 2026-11-05 — Final-wave hero damage is visible after defeat

[Damage-breakdown evidence](evidence/p16-defeat-damage-breakdown.md): completed
loss/draw playback now shows recorded hero damage by direct type with pooled
periodic damage, localized scope and distinct unavailable/no-damage states.
No combat, tuning, economy, settlement or save changes. Two causal RED cases;
24 new focused cases and 16 existing reward-summary cases pass. Scoped strict
997 files/zero diagnostics, changed-file lint and locale preservation pass;
24 actual-screen constructed Chromium cases cover both locales and five target
sizes. Intermediate test-fixture failures are retained. Self-review only. Root
retains the named packet; driver/server/browser are terminal, port and exact cache
absence verified. Previous goal turn was status-only/no progress; this increment
implements the announced recovery addition. Historical 14/14 Normal/210 sources/
formal 0/210 unchanged; no spent budgets renewed. Full v1 remains unfinished:
continue progression/challenge/acquisition/economy/pacing and integrated acceptance.
Browser works, CI excluded, owner playtest later, no pending question.

## 2026-11-05 — Retained loot is visible after defeat

[BUG771 evidence](evidence/p16-retained-defeat-loot.md): terminal loss/draw now
shows the existing completed-wave reward bag with localized retained-loot
context. Native settlement already keeps those rewards; no granting, combat,
economy or save change. Two causal REDs become GREEN;16affected UI cases, strict
scoped994files/zero diagnostics and changed-file lint pass.20constructed actual
CombatScreen browser cases cover both locales/mobile/desktop and unchanged
holdings; no earned/balance credit. Self-review only. Root retains named packet;
handles terminal, port/cache absence verified. Previous goal turn was status-only/
no progress. Historical14/14Normal/210sources/formal0/210 unchanged; no spent
budget renewal. Fullv1 unfinished; progression/acquisition/economy/pacing and
integrated acceptance continue. Browser works, CI excluded, no user hold.

## 2026-11-05 — Generic monster summon uses authored tuning

[BUG770 evidence](evidence/p15-native-monster-summon.md): final generic monster
builder and inline minion body replaced by validated JSON/native adapter at
existing registry/factory boundaries. One startup birth/CD5/two-living cap,
death replacement/fixed40HP/Attack10/no refund remain. Two causal REDs become
GREEN;33distinct affected cases, scoped strict721files/zero diagnostics, final
lint and strict50-row/new-body schemas pass. Shared combat/status/all monster
loadouts and other schema/data rules unchanged. Intermediate schema/config/
test-API/selector failures remain explicit. Root retains packet; handles
terminal, no disposables. Previous goal turn was status-only/no progress;
this continuation implements the repair. Historical14/14Normal/210sources/
formal0/210 unchanged; no spent budgets renewed. Full privatev1 remains
unfinished; continue progression/acquisition/economy/pacing, difficulty/endgame
and integrated acceptance. Browser works, CI excluded, no user hold.

## 2026-11-05 — Real generic elemental actions use authored tuning

[BUG769 evidence](evidence/p15-native-monster-elemental-actions.md): Fire Breath,
Poison Spit and Frost Aura move from defaults to existing native JSON adapters.
Current damage/status/CD/target/delivery/flight behavior preserved. Three causal
RED cases; 24 new and 11 selected existing native/adapter cases pass, strict
scoped451files/zero diagnostics, final lint and strict50-row schema validation
pass. Shared combat/status/registry, all monster loadouts and other data/schema
rules unchanged. Root retains named packet and initial formatting lint failure;
handles terminal, no disposables. Constructed checks earn no campaign/balance
credit or renewed budgets. Historical14/14Normal/210sources/formal0/210 unchanged.
Full privatev1 remains unfinished; remaining native summon/progression/acquisition/
economy/pacing/integrated acceptance continue. Browser works; CI excluded.

## 2026-11-05 — Generic monster melee uses authored tuning

[BUG768 evidence](evidence/p15-native-monster-melee.md): two hardcoded melee
defaults replaced by the existing JSON-backed native adapter. Immediate physical
10–15/30–50, single target, CD1/free and aliases are preserved. Two causal RED
cases; 28 new cases and 12 selected existing controls pass, strict scoped715files/
zero diagnostics, four-file lint and strict50-row schema validation pass. Shared
combat/status/registry and other data/schema rules unchanged. Constructed consumers
only; no authored loadout or earned claim. Root retains the named packet; handles
terminal, no disposables. Previous goal turn was status-only/no progress; this
continuation completes implementation. Historical14/14Normal/210sources/formal0/210
unchanged. Full privatev1 remains unfinished; continue remaining native actions
and progression/acquisition/economy/pacing/integrated acceptance. Browser works;
CI excluded; no pending user question or renewed campaign/retry budget.

## 2026-11-05 — Boss family regressions follow adopted mechanics

[BUG767 evidence](evidence/p15-boss-family-current-contracts.md): four reproduced
stale Duriel/Izual expectations repaired in two existing tests. Exact passive
pulse/Chill clocks and physical174/182windows, Charge/basic cadence and ordinary
Izual escort Attack299 are asserted. Four selected cases, scoped strict715files/
zero diagnostics and two-file lint pass. Four retained production/data preimages
stay byte-identical; no runtime or balance change. Intermediate failures remain
explicit. Root retains the named packet; all handles terminal, no disposables.
No campaign or spent-budget replay. Historical14/14Normal/210sources/formal0/210
unchanged. Full privatev1 remains unfinished; progression/acquisition/economy,
difficulty/endgame, pacing and integrated acceptance remain open. Browser works;
CI excluded; no pending user question.

## 2026-11-05 — Authored Weak Ranged replaces final monster compatibility entry

[BUG766 evidence](evidence/p15-native-monster-weak-ranged.md): native JSON-backed
physical12–18/single-target/CD1/free/500ms flight replaces wrong8–14mercenary stub.
Empty monster compatibility catalog/registration removed; merc catalog preserved.
One causal RED;24distinct affected assertions, strict scoped715files/zero
diagnostics, five-file lint and strict50-row schema validation pass. Constructed
consumer only: no current authored monster loadout uses the action. Shared combat/
status and all other data/schema rules unchanged. Root retains the named packet;
all handles terminal, no disposables/processes. Prior goal turn was status-only;
this continuation completes implementation. Historical14/14Normal/210sources/
formal0/210 unchanged. Generic melee builders and broader fullv1 remain open;
continue known boss/progression and integrated acceptance gaps without replaying
spent campaign/sample/retry budgets. Browser works; CI excluded.

## 2026-11-05 — Wraith Mana Rift placeholder replaced

[BUG765 evidence](evidence/p15-native-monster-mana-rift.md): validated JSON-backed
native Rift retains adopted10–20/all-target/CD3/ManaBurn behavior; catalog/source
now agree. Two causal RED cases;19distinct affected assertions, strict scoped
451files/zero diagnostics, lint and strict50-row schema validation pass. Full
native Wraith before/after snapshot/result/165events match exactly. Shared combat/
status and all other data rows unchanged. Root retains the named packet; handles
terminal, no disposables/processes. Historical14/14Normal/210sources/formal0/210
unchanged; no campaign/retry renewal. Full privatev1 unfinished; remaining native
actions and progression/acquisition/pacing/integrated acceptance continue.

## 2026-11-05 — Three direct monster placeholders replaced

[BUG764 evidence](evidence/p15-native-direct-monster-actions.md): native JSON-backed
Frost Bolt/Bone Spirit/Whirlwind replace compatibility payloads. Runtime damage,
cadence, statuses, delivery and flight stay exact; two catalog rows now match
adopted tuning decisions. Five causal RED cases;91distinct affected assertions,
strict scoped451files/zero diagnostics, lint and strict50-row schema validation
pass. Three full native before/after recordings match exactly. Shared combat/
status and all other data rows unchanged. Root retains the named packet; all
handles terminal, no disposables/processes. Previous goal turn was status-only;
this turn completes implementation. Historical14/14Normal/210sources/formal0/210
unchanged; no campaign/retry renewal. Full privatev1 unfinished; continue remaining
native actions and progression/acquisition/pacing/integrated acceptance.

## 2026-11-05 — Authored single-target monster Curse implemented

[BUG763 evidence](evidence/p15-authored-monster-curse.md): native single-target
CD4 nondamaging Amplify replaces party-wide/CD3 hit-dependent compatibility
action. Existing3000ms/-50physical-resistance-point family remains; amplification
was already functional. Five causal RED cases;93distinct affected assertions,
strict scoped431files/zero diagnostics and final lint pass. Native targeting,
cadence, expiry/damage, real immunity, Mana Burn fallback and deterministic replay
are guarded. Shared combat/status/tuning/source JSON unchanged. Intermediate
errors and unrelated observed Duriel/Izual failures remain explicit. Root retains
the named packet; compiled diagnostic removed/absence verified, handles terminal.
Previous goal turn was status-only; this continuation completes the repair. No
campaign/retry renewal. Historical14/14Normal/210sources/formal0/210 unchanged;
full privatev1 unfinished. Continue remaining native monster actions and wider
progression/acquisition/pacing/integrated acceptance; browser works, CI excluded.

## 2026-11-05 — Inventory detail and mercenary artwork recover

[BUG762 evidence](evidence/p16-detail-roster-art-recovery.md): three raw artwork
sites now use the existing shared recovery component. Eight causal RED cases;
27 selected GREEN cases, scoped strict types (643 files, zero diagnostics) and
four-file lint pass. Eight bilingual Chromium mobile/desktop cases cover 12
surface observations: same-URL decoded recovery, changed-item recovery, healthy
neighbor retention, stable frames and stealth. Root retains the named packet;
task driver terminal and cache removal verified in its cleanup receipt. Previous
goal turn was status-only/no progress; this increment completes an implementation
gap. Historical 14/14 Normal, 210 sources/formal 0/210 unchanged; no spent allowance
renewed. Full v1 unfinished. Continue progression/challenge/acquisition/pacing and
integrated acceptance; browser works, CI excluded, no user hold.

## 2026-11-05 — Ordinary quest starts use the shared action boundary

[BUG761 evidence](evidence/p14-guarded-quest-starts.md): journal starts now refuse
loading/no-player/combat/wave/restore ownership, recheck live prerequisites and
preserve separate bounty admission. Row-scoped rollback preserves unrelated
writes; failures show localized feedback.62distinct selected cases/final22new
cases pass, strict scoped652files/zero diagnostics and final lint pass.12bilingual
Chromium mobile/desktop cases prove refusal then successful release/start; clean
pages and requests. Root retains the named packet; task handles terminal, PIDs/
cache/pointer absent. Prior status turn collected terminal causal RED evidence;
this turn implements and verifies the repair. Historical14/14Normal/210sources/
formal0/210 unchanged; no spent allowance renewed. Fullv1 unfinished; continue
progression/challenge/acquisition/pacing and integrated acceptance. No user hold.

## 2026-11-05 — Combat damage immunities are visible

[BUG760 evidence](evidence/p16-combat-damage-immunity-labels.md): real combat
cards now show localized explicit damage-immunity labels, including native
Andariel/Mephisto. Resistance/status-only controls remain unlabeled.13distinct
affected cases, final3new cases after native-list cleanup, scoped strict types
654files/zero diagnostics and final lint pass. Bilingual Chromium checks pass
all five target sizes; final-source mobile/desktop and all-type scroll/removal
checks pass. No combat/campaign replay or tuning; spent budgets unchanged.
Previous goal turn was status-only/no progress; this increment completes an
implementation gap. Root retains the named packet; browser/server closed and
task cache removed. Fullv1 unfinished; historical14/14Normal,210sources/formal
0/210 unchanged. Continue progression/challenge/acquisition/pacing and integrated
acceptance from retained evidence; no browser, CI or user-decision blocker.

## 2026-11-05 — Boss poison damage immunity implemented locally

[BUG759 evidence](evidence/p15-boss-poison-damage-immunity.md): separate authored
metadata makes Andariel/Mephisto poison damage zero, including periodic/lethal/
recovery accounting, while ordinary75cap/minimum1, other types and RNG remain.
All297selected cases, strict scoped602files/zero diagnostics, lint and strict
schema/source comparison pass. Native manual/idle real skills and actual playback
agree. Root retains the exact named packet; handles terminal, no disposables.
Previous turn collected terminal checks and reported status, without a code edit;
this turn finishes source/schema review and authoritative local closeout. No
browser/full-suite/campaign replay or spent-budget renewal. Historical14/14Normal,
210sources/formal0/210 unchanged; fullv1 unfinished. Next return to progression,
challenge and acquisition/pacing using retained evidence.

## 2026-11-05 — Diablo Stun resistance implemented locally

[BUG758 evidence](evidence/p15-diablo-stun-resistance.md): authored0.25Stun
duration replaces generic boss0.5 once; other status/boss defaults preserved.
Five failing cases now pass; all87selected cases include native manual/idle
chapter expiry/playback and retained Diablo/Baal mechanics. Strict scoped604files/
zero diagnostics, lint and strict schema/source comparison pass. No browser/full
suite/campaign rerun. Root retains exact named evidence; handles terminal, no
task process/disposable remains. Fullv1 unfinished; historical14/14Normal,
210sources/formal0/210 unchanged. Next return to Duriel/progression/challenge and
acquisition/pacing findings without renewing exhausted runs.

## 2026-11-05 — Baal status protection implemented locally

[BUG757 evidence](evidence/p15-baal-status-protection.md): authored all-except-Stun
policy now covers direct statuses/spread, ambient Chill view/cadence, private
missile slow, Mana Burn debit and truthful armor feedback. Detailed boss rule
takes precedence over conflicting summary; Stun remains half-duration.90selected
cases pass; final11new cases, strict scoped602files/zero diagnostics, lint and
strict schema/source comparison pass. No UI/browser rerun. Root retains exact
named packet; no processes/disposables. Previous goal turn was status-only/no
progress; this increment implements the missing protection. Historical14/14Normal,
210sources/formal0/210 unchanged; no spent run allowance renewed. Fullv1 unfinished.
Next address Diablo Stun resistance, then remaining progression/challenge work.

## 2026-11-05 — Baal’s five tentacles implemented locally

[BUG756 evidence](evidence/p15-baal-tentacle-summons.md): real ordinary bodies,
per-owner living cap5/replacement and owner-death cascade replace damage stub.
33focused cases, scoped strict types604files/zero diagnostics, lint and strict
schema/source comparison pass. Actual bilingual mobile/desktop component browser
diagnostic passes. Body tuning provisional; no balance/independent acceptance.
Root retains exact named packet through full-v1 acceptance; server156655/browser/
cache/pointer absent. Prior goal turn collected terminal checks and reported
status, no code delta; this turn fixes lint and completes browser/source closeout.
Next implement Baal status protection. Fullv1 unfinished; historical14/14Normal,
210sources/formal0/210 unchanged. No exhausted campaign or sample budget renewed.

## 2026-11-05 — Baal low-health enrage fixed locally

[BUG755 evidence](evidence/p15-baal-low-health-enrage.md): native manual/idle
20%Life enrage gives speed2.5/+100% direct damage. Exact-boundary rounding fixed
at shared policy source. Six new/two selected existing cases, scoped strict types
600files/zero diagnostics, lint and schema/source comparison pass. Base stats/
rewards/waves preserved. Self-review/diff/hashes retained by root in named packet;
no processes/disposables. Previous goal turn was status-only/no progress; this
increment completes verified enrage closeout. Next implement real Baal Tentacles.
Historical14/14Normal,210sources/formal0/210 unchanged; no spent budget renewed.
Fullv1 unfinished; browser works, CI excluded, no pending user decision.

## 2026-11-05 — Baal elemental attacks implemented

[BUG754 evidence](evidence/p15-baal-elemental-signatures.md): native manual/idle
Baal casts Frost Nova/Inferno/Mana Rift with Freeze, five Burn stacks/Armor Melt
and Mana Burn.30distinct selected cases, scoped strict types and changed-file
lint pass; actual bilingual mobile/desktop CombatLog diagnostic passes. Final
schema/source/locale comparison preserves shared spells, chapter stats/rewards
and waves. Exact server/cache absent; root retains named evidence through full-v1
acceptance. Previous turn was status-only/no progress; this increment completes
attack closeout. Next implement missing Baal enrage from existing authored rules.
Tentacles/immunity and wider gameplay/acceptance remain open; full v1 unfinished.
Historical14/14Normal,210sources/formal0/210 unchanged; no spent budget renewed.

## 2026-11-05 — Diablo low-health enrage fixed locally

[BUG753 evidence](evidence/p15-diablo-low-health-enrage.md): native manual/idle
15%HP enrage now gives speed2/+50% direct damage and bilingual log feedback.
25focused cases, scoped strict types and changed-file lint pass; actual CombatLog
browser diagnostic passes mobile en/zh-CN and desktop zh-CN. Base stats/source
preserved. Previous turn was status-only/no progress; this turn implements the
missing phase. No spent run allowance renewed. Full private v1 remains unfinished;
next address remaining boss/progression gaps. Browser works; CI excluded.

## 2026-11-05 — Diablo’s four-move signature fixed locally

[BUG752 evidence](evidence/p15-diablo-four-move-signature.md): native manual/idle
Fire Breath/Lightning/Prison/Charge execute with cone-five,Ignite3,Paralyze and
unchanged chapter stats/source.24distinct selected cases pass; strict scoped
602files/zero diagnostics and changed-file lint pass. Unsupported immunity
fixtures corrected to real unrelated native controls; original failures retained.
Seven-file production review verifies pre-existing rows unchanged. Exact named
packet retained by root through full-v1 acceptance; no active task process or
disposable cache/build remains. Previous goal turn was status-only/no progress.
Enrage/stun resistance and wider gameplay/acceptance remain open. No campaign or
spent allowance renewed. Historical14/14Normal,210sources,formal0/210 unchanged;
full private v1 remains active. Next return to outstanding gameplay/progression.

## 2026-11-05 — Mephisto’s three-stack cloud implemented

[BUG751 evidence](evidence/p15-mephisto-poison-cloud-stacks.md): authored boss
variant applies three Poison stacks; ordinary cloud remains one. Native cadence,
party DoT/expiry, misses/immunity, capped refresh, determinism and bilingual action
names pass57distinct selected cases; scoped strict types601files/zero diagnostics
and changed-file lint pass. Six-file source review and exact retained custody
recorded; independent/owner acceptance remains open. No campaign/retry renewal.
Previous goal turn was status-only/no progress; this closeout records the completed
implementation. Historical14/14Normal,210sources,formal0/210 unchanged; fullv1
remains active. Next address outstanding gameplay/progression requirements.

## 2026-11-05 — Boss poison-status protection implemented

[BUG750 evidence](evidence/p15-boss-poison-status-immunity.md): native Andariel/
Mephisto reject Poison/Plague, including Venom and death spread; Venom no longer
logs rejected applications as success. All19new/40existing affected cases,
strict scoped types and lint pass. Self-review/custody recorded; no campaign
replay. Direct poison damage/75% cap versus old100% remains unresolved.
Next address remaining boss/progression contracts without renewing spent runs.
Fullv1 remains incomplete: historical14/14Normal,210sources,formal0/210.
Browser works; CI excluded; owner playtest follows implementation; no user hold.

## 2026-11-05 — Mephisto signature and recorded pacing closeout

[BUG749](evidence/p15-mephisto-elemental-signature.md) is fixed locally: native
manual/idle Mephisto casts cold/lightning/poison;8focused and19related cases,
strict scoped types and lint pass. Exact source review/custody recorded.
[Offline accounting](evidence/p15-recorded-menu-accounting.md) now records all
five retained stages:12.69960 combat hours, with later-act history/classification
gaps explicit. No campaign replay or assumed human pace. Root retains the two
exact evidence packets; check processes terminal, no disposables remain.
Poison immunity/stack contracts, BUG731 and full-v1 acceptance remain open;
historical14/14Normal,210sources,formal0/210 unchanged.

## 2026-11-05 — Periodic damage tracing implemented

[BUG748 evidence](evidence/p15-periodic-damage-provenance.md): future dots retain
source/status/type integrals and pooled carry; P15 reports count historical
unknown coverage. No per-source integer HP claim or tuning. All 92 affected
cases pass; final focused engine/types/lint pass. Self-review complete; exact
root-owned packet retained through full-v1 acceptance, no disposable process or
cache remains. Previous goal turn collected terminal check evidence. Next return
to progression/acquisition/pacing without exhausted-run renewal. Historical
14/14 Normal, 210 sources, formal 0/210; full v1 remains incomplete.

## 2026-11-05 — Druid early Act III diagnostic closed

[Retained evidence](evidence/p15-druid-route-first-act3.md): first-entry Great
Marsh/Flayer wins, then three Kurast Bazaar losses at16/17/18. All92settlements
and HP reconcile; physical pressure dominates, Mana remains available. No tuning
conclusion or renewed attempts. Source2253/campaign136files stable; task PIDs/
cache absent; exact inventory and root-owned retention recorded. Previous goal
turn was status-only/no progress; this increment closes authoritative evidence.
Historical14/14Normal,210sources,formal0/210 unchanged; fullv1 remains unfinished.

## 2026-11-05 — Later-act progression measurement

[BUG747 evidence](evidence/p15-later-act-route-first.md): opt-in route-first
Acts II–V implemented and locally verified; three-attempt recovery, native
quests and technical-stop custody retained. Affected375/final focused41 cases,
scoped strict types and lint pass. Natural pacing is still unmeasured; historical
14/14Normal,210sources and formal0/210 unchanged. Return to Fire/Duriel gameplay
findings without renewing exhausted runs. Full private v1 remains unfinished.

## 2026-11-05 — Card resource names localized

[P16 evidence](evidence/p16-card-resource-names.md) closes BUG746 locally:
shared card Life/Mana/Stamina names use existing translations and respond to
mounted locale changes. Three new cases fail before the fix; all15affected
cases pass after it. Scoped strict types311files/zero diagnostics and two-file
lint pass. Four bilingual mobile/desktop browser cases verify real AX names,
unchanged values/geometry and clean pages. Browser/server closed; PID89166and
owned Vite cache absent. Root retains exact `d2-card-resource-names-maybm987`
under zai-temp through full-v1 acceptance, then owns cleanup. Previous goal turn
was status-only/no progress. Counts14/14historicalNormal,210/210sources,
formal0/210; fullv1 and wider acceptance remain incomplete. Next return to P15
progression/challenge and fixture-freeze work without renewing spent campaigns
or sample budgets. Browser works; CI excluded; no pending user question.

## 2026-11-05 — Shared resource bars have localized accessible names

[P16 evidence](evidence/p16-statbar-accessible-names.md) closes BUG745 locally:
required translated labels now name character XP/Life/Mana and combat Mana.
Three focused tests fail before/pass after; scoped strict types and two-file
lint pass. Four bilingual mobile/desktop Chromium cases verify actual accessible
names, values and locale changes. Producer source review approves. Three failed
browser observer revisions remain recorded; terminal task PIDs/caches are absent.
Root retains `d2-statbar-accessibility-kd9doft3` under zai-temp through full-v1
acceptance, then owns cleanup. Previous turn was status-only/no progress.
Counts remain 14/14 historical Normal, 210/210 sources, formal 0/210; full v1
and wider acceptance remain incomplete. Next address the remaining P16 resource
name localization gap exposed by the browser's `hp`/`mp` card labels, with only
affected checks. Browser works; CI excluded; no user hold.

## 2026-11-05 — Earned economy reconciled; early native craft completed

[P15 economy and craft evidence](evidence/p15-earned-economy-and-early-craft.md)
reconciles four retained branches with15rejected corruption controls and no
combat replay. Authored finite Normal wishes total815(main450/side220/clears145);
inherited wallets and all historical costs remain charged. Fire's copied earned
level16save completes21fixed native conversion/craft operations, ordinal68→89,
with literal full costs, independent unrelated-item custody, duplicate/stale
protection and exact export/rehydration. Temporary equip shows explicit Life/
Mana/dodge/resistance/critical tradeoffs; crafted successor remains unequipped.
Strict scoped types877files/zero diagnostics and native launch pass; producer's
custody finding is addressed/ready. Fire's exhausted Dry Hills nonwin remains.
Root retains exact `d2-p15-earned-economy-va_h_fxd` under zai-temp through full-v1
acceptance, then owns cleanup; PID83260and task Vite cache are absent. Previous
goal turn was status-only/no progress; this increment completes new evidence.
Counts14/14historicalNormal,210/210sources,formal0/210; fullv1 and wider acceptance
remain incomplete. Next select an outstanding implementation/acceptance defect,
without replaying completed campaigns or broad suites. Browser works, CI excluded,
owner playtest follows implementation and no user answer is pending.

## 2026-11-05 — Skeleton preview assertion corrected

[BUG744](../../production/bugs/BUG-744-skeleton-preview-owner-level-oracle.md)
is fixed locally: the old assertion expected owner-level1 bodies from a
level12 fixture. Literal current/next stats, caps and next-rank deltas now
cover both locales and a mounted12→13 update. Two selected cases pass/43
filtered/zero failures; scoped strict types and single-file lint exit0.
Producer review approves with no material findings. Production behavior and
tuning are unchanged. Final source/patch/hashes and original RED are retained
in root-owned `d2-skeleton-preview-oracle-sbkg62hm` under zai-temp through
full-v1 acceptance; no disposable cache/process remains from this slice.
Previous goal turn was status-only/no progress. Next advance P15 authored
acquisition/faucet/sink budgets from the controlling design and existing earned
evidence, without campaign replay. Counts14/14historicalNormal,210/210sources,
formal0/210; fullv1 and wider acceptance remain incomplete. Browser works,
CI is excluded and no user answer is pending.

## 2026-11-05 — HUD and skill artwork recovery verified locally

[P16 evidence](evidence/p16-avatar-skill-image-recovery.md) closes BUG743 locally:
shared-hook reuse/source keys, 11 passing selected assertions/43 filtered,
scoped strict types and four-file lint pass. Four bilingual mobile/desktop
Chromium cases verify eight recovered surfaces with stable healthy controls,
geometry and accessibility. Producer source review has no material findings.
Original observer failures and the unrelated Raise Skeleton preview assertion
remain recorded; diagnose that assertion next without speculative tuning.
Browser process is terminal; owned Vite cache is removed/absence verified.
Root retains exact `d2-avatar-skill-recovery-zjof2q7o` under zai-temp through
umbrella acceptance, then owns cleanup. Previous goal turn made progress by
collecting the terminal browser result and removing that cache. Counts remain
14/14 intended Normal,210/210 supplemental sources,formal0/210; full privatev1
and broader acquisition/economy/pacing/difficulty/app acceptance remain open.
No broad suite, campaign replay, build, CI, commit, push or user hold.

Current P15 update (2026-11-05): [Owned Fire adaptation](evidence/p15-act2-caster-summoner-route-first.md)
is complete without combat: six owned gear choices and four already-owned
points(Fire Ball8→12), no granted resources or reset. Life capacity446→487,
magical dodge10%→26% and cold8→27 improve with Defense/physical-dodge/Mana/fire
tradeoffs; attack/speed stay exact. Native capture/decoder/custody and outer
realm restoration pass; scoped strict types888files/zero diagnostics and lint
pass. Fire's failed three-attempt sequence and all costs remain; no improved
combat outcome or balance credit. The previous status turn made no progress.
Finalize the retained packet, then advance another concrete implementation or
acceptance gap without renewing completed campaigns. Fullv1 stays incomplete:
14/14Normal,210/210sources,formal0/210; no user/browser/CI hold.

Current P15 update (2026-11-05): [Caster/summoner route-first results](evidence/p15-act2-caster-summoner-route-first.md)
are terminal: Fire13→16stops after three Dry Hills attempts(56admissions,
221waves,217wins/4defeats); Druid13→15completes ActII(6admissions/32wins).
Separate reward/save readers and versioned analysis pass without combat replay.
BUG741selected-farm audit and BUG742capacity-event analysis are fixed locally;
173affected recovery cases, scoped strict types964files/zero diagnostics and
explicit lint pass. Fire owns resistance alternatives with real speed/defense/
other-resistance tradeoffs; its fixed starter targets differ from intended
growth. Next inspect native owned-gear/point adaptation without combat before
any further encounter tuning. Failed first-entry/three-attempt outcomes and
all ancestral costs stay charged. Required packet remains with root through
full-v1 acceptance. Counts14/14Normal,210/210sources,formal0/210; fullv1 and wider
acceptance remain incomplete. Browser works/CI excluded/no pending question.

Current P15 update (2026-11-05): [Earned representatives](evidence/p15-act2-earned-representatives.md)
qualifies three Act I sources without combat, including exact v32→v33 migration
and native capture. BUG739 is fixed locally with21negative controls. One frozen
Double Swing route-first branch completes Act II:13→16,11admissions,52wins/one
defeat, four recovery admissions,7.22combat minutes. Separate reward/save reader
and health accounting pass; BUG740 fixes the no-op-orb negative control only,
without combat replay. Duriel32.55s/minimum hero88.15%HP; combined Acts I–II
combat1.06146h, not active time. BUG731 remains open. Scoped strict types/lint/
preflight pass;2252production/135campaign inputs stable. Required6.18MBpacket
retained by root; owned PIDs/cache absent, no disposables. Next preserve Fire/
Druid manual policies and ancestral costs before bounded first-entry branches.
Counts14/14Normal,210/210sources,formal0/210; fullv1 and wider acceptance remain
incomplete. Browser works/CI excluded/no pending question. Previous goal turn was
status-only/no progress; this increment produces new qualified native evidence.

Current P15 update (2026-11-04): [Act II route-first evidence](evidence/p15-act2-route-first.md)
qualifies one earned Bow continuation from level 13 to 17, with 40 admissions,
177 wave wins and three defeats. First entry uses earned power; training follows
settled losses only. Controller/audit/dispatch checks, scoped types/lint, retained
reward/save readback and ordered health accounting pass. BUG736–738 are fixed
locally. Duriel takes 32.9 simulated seconds; recovery consumes 19.4 of the
branch's 26.1 combat minutes. Combined Act I–II combat is 1.49 hours, so active
pacing remains unresolved. Root retains the exact packet through full-v1
acceptance; processes/cache are absent and no disposable paths remain. Next
qualify limited melee/caster/summoner first-entry states before tuning BUG731.
Counts remain 14/14 intended Normal, 210/210 supplemental sources, formal 0/210.
Full v1 and wider acceptance remain incomplete. Browser works; CI excluded;
no pending question or user hold. Previous goal turn was status-only/no progress.

Current P15 update (2026-11-04): [Charge Attack component](evidence/p15-monster-charge-attack.md)
closes BUG735: JSON/schema/native adapter now add100%Attack before normal
mitigation.169affected tests,scoped strict types/lint and desktop/mobile native
Duriel/early ActI Charge probes pass; both zh-CN/en translation paths updated.
Synthetic probes are functional evidence,not earned balance. Exact packet is
retained by root; owned processes/cache absent,no disposables. BUG731 remains
open. Next qualify representative first-clear acquisition/mitigation before
further encounter tuning. Counts14/14Normal,210/210sources,formal0/210; fullv1
and wider acceptance incomplete. Browser works,CI excluded,no pending question.

Current P15 update (2026-11-04): [Corrected Duriel comparison](evidence/p15-duriel-corrected-paired-screen.md)
completes24attempts/144wave wins,zero deaths. Retained readback/separate analysis
pass;120prefix waves exactly match,manual/idle metrics agree. Boss samples
5.731–23.225s/hero incoming1–8;one seed per stratum,not population acceptance.
Packet retained by root;exact PIDs/cache absent,no disposables. BUG731open.
Next implement [Charge Attack component](decisions/P15-monster-charge-attack-v1.md)
under BUG735,then qualify first-clear acquisition/pressure. Prior goal turn was
status-only/no progress. Counts14/14Normal,210/210sources,formal0/210;fullv1/wider
acceptance incomplete. Browser works,CI excluded,no pending question/user hold.

Current P15 update (2026-11-04): [Duriel passive Aura](evidence/p15-duriel-passive-frost-aura.md)
finishes BUG734: native/engine28tests, scoped strict types/lint and desktop/mobile
Chromium pass. Independent15cold/5s/2sChill pulses preserve Charge/basic actions
and Freeze immunity; Frozen Terror's active wave is unchanged. Historical BUG732
active restoration is superseded. Seventeen source snapshots and RED/GREEN/
browser evidence remain with root in `d2-duriel-passive-aura-oow7i3w5`; exact
processes/caches absent, no disposables. BUG731 remains open: older populations
predate these fixes. Next use bounded paired diagnostic seeds across the actual
earned sources before choosing tuning; no broad population/campaign replay.
Counts14/14Normal,210/210supplemental sources,formal0/210. Wider economy/pacing,
higher difficulty/endgame, app/mobile/a11y/performance/PWA/soak and independent
acceptance remain. Fullv1 active/incomplete; browser works, CI excluded, no question.

Current P15 update (2026-11-04): [Act II cohort screening](evidence/p15-act2-earned-cohort-screen.md)
is terminal/readback passed: 2,400 attempts, 14,400 wave wins, no deaths or
unreached bosses; twelve additional earned32 builds × manual/idle × 100 seeds.
Boss medians 6.9–27.3s indicate BUG731's wider challenge concern. This baseline
predates [restored Duriel chapter Frost Aura](evidence/p15-duriel-chapter-frost-aura.md):
BUG732 is fixed/verified with nine focused tests, scoped strict types/lint and
four desktop/mobile × zh-CN/en browser checks. Both packets have verified cleanup
and remain with root through umbrella acceptance. [Duriel Freeze immunity](evidence/p15-duriel-freeze-immunity.md)
is now fixed/verified:116 affected tests, scoped types/lint, native desktop/mobile
playback and caller audit pass; exact caches/processes absent. Passive Aura
cadence is subsequently corrected by BUG734 above; encounter tuning remains.
Preserve Frozen Terror's active cold wave. Counts14/14Normal,
supplemental availability210/210,formal balance0/210; fullv1 remains incomplete.
No browser/user hold, CI, new agent, broad suite or completed-campaign replay.

Current P15 update (2026-11-04): [Actual earned Act II power](evidence/p15-act2-earned-power-cohort.md)
qualifies14sources/28descriptors without combat; exact hydration, canonical gear,
projection and separate readback pass. Thirteen actual completions are level32;
Bone is24 with a manual boss-boundary order change. Preserve that distinction.
The [prospective cohort screen](decisions/P15-act2-earned-cohort-screen-v1.md)
is frozen and launched once for all twelve other level32builds; reuse Throw's
completed200trials. Required packets `d2-act2-earned-power-phx87ot5` and
`d2-act2-boss-cohort-screen-dgv98tt0` remain under zai-temp with root through
unfinished umbrella acceptance. Power processes/cache absent; screen results
completed with passing readback as superseded above. No balance acceptance claimed.
Counts14/14Normal,210/210supplemental availability,formal balance0/210.

Current P15 update (2026-11-04): [Act II Double Throw screening](evidence/p15-throw-act2-checkpoint-screen.md)
finishes seeds1–100 in manual/idle:200terminal trials,1200wave wins,zero deaths
or unreached bosses. Duriel p50 is10.980s in both modes;100/100win intervals
[0.9630065,1] and short duration identify BUG731's challenge concern. Before
tuning, compare other builds' actual earned Act II power/acquisition and freeze
adaptation/ordinal/carry/pity populations. BUG730 corrects only a versioned
retained-output reader's floating-sum contract; original failure/plan/output
remain, no combat replay. Complete separate readback passes;2248source/eight
helper contracts stable, exact PIDs/cache absent. Root retains the named8.57MB
packet through unfinished umbrella acceptance; no disposables/failures remain.
Counts14/14Normal,210/210supplemental availability,formal balance0/210. Fullv1
and wider acceptance remain incomplete. No broad tests,new agents,CI or user hold.

Current P15 update (2026-11-04): [Double Throw repeat-source supplement](evidence/p15-throw-repeat-source-supplement.md)
qualifies two retained intended-lineage saves with exact counters452/677 under a
prospective explicit policy. Supplemental availability210/210; historical policy
stays208/210 and formal balance0/210. Both current decodes/four manual-idle
descriptors and separate retained-output readback pass with zero gameplay.
The complete210-key availability manifest retains historical sources/boundaries,
power differences and five diagnostic failures. All2248source inputs/eight helper
contracts stable; exact PIDs/cache absent, no remaining disposables/failures.
Root retains `d2-throw-repeat-lineage-xoa_b7f2` under zai-temp through unfinished
umbrella acceptance. Previous goal turn was status-only; this turn qualifies
evidence. Next freeze actual power/acquisition/adaptation and ordinal/carry/pity
populations before screening. Counts14/14Normal; fullv1 and wider acceptance
remain incomplete. No broad checks, new agents, CI or user/browser hold.

Current P15 update (2026-11-04): [Partial population reporting](evidence/p15-checkpoint-population-report.md)
is implemented and applied to sixteen retained attempts without new combat.
Fifteen reporter cases/23 fixture cases, scoped strict types/lint and separate
real-output readback pass. Exact contexts, missing seeds, unreached roles,
nonwins/prefix yields, victory-only durations and 95% Wilson intervals remain
explicit. Required packet `d2-checkpoint-population-aarumrvq` is retained under
zai-temp through umbrella acceptance; disposable bundles/config are removed.
Previous goal turn was status-only/no progress; this increment changes reporting
code and produces verified evidence. Counts14/14 Normal,208/210source availability,
formal0/210; fullv1 remains active/incomplete. Next resolve Double Throw II/III
repeat sources and freeze power/acquisition/adaptation/ordinal/carry/pity before
screening. Wider economy/pacing/difficulty/endgame/app acceptance remains open.
No new gameplay, holdout read, broad check, agent, CI, user hold, commit or push.

Current P15 update (2026-11-04): [Earned repeat-source evidence](evidence/p15-earned-repeat-source-pairing.md)
qualifies73retained cleared contexts, eleven bounded diagnostic postclear exports
and three supplemental contexts:208/210paired-source availability, not balance.
Sixteen seed1branches retain11clears/5failures and exact prefix rewards; BUG729
fixes only a retained-output reader, with no replay. Two supplemental decodes and
six descriptors pass without combat. Both Double Throw Act II/III boss repeat
sources remain unresolved. All three packets have verified cleanup records;
root retains their exact paths through umbrella acceptance. Counts14/14intended
Normal, formal0/210. Next freeze power/acquisition/adaptation and current
ordinal/carry/pity populations. Fullv1/wider acceptance remain open; no user,
browser or CI hold, new agent, broad suite, build or completed-campaign replay.


Owner objective: full v1, staged checkpoints, **30–50 active hours** for a
fresh first clear of Acts I–V. The task table below is the original planning
baseline; current state and evidence live in [execution-ledger.md](execution-ledger.md).
`ready` means dependencies permit work; it does not mean accepted or shipped.
Update each task with branch/commit, evidence and review link as it progresses.

Current owner override (2026-10-29): CI is excluded from this work and its GitHub
Action is removed. References to required CI below are historical defaults;
applicable local checks replace them. Headed Chromium works in WSL. Owner playtest
follows implementation and does not hold automated implementation/validation.

Current P15 preparation (2026-11-04): [Corpse Explosion pack benchmarks](evidence/p15-corpse-pack-order-benchmark.md)
close the two Act V native order-preparation gaps. Prepared saves differ only in
learned skill order; four paired manual/idle benchmarks win all 24 waves, with
90 CE casts and measured target-role damage. Retained-output/save/custody/RNG
checks pass; initial preflight and reader failures remain. These one-seed checks
add no formal acceptance: **14/14 intended Normal, formal balance 0/210**.
Next reuse earned cleared states for the 89 pairing contexts and freeze actual
power/acquisition/adaptation, ordinal/carry and pity policies before populations.
Exact packet retention and the external driver's contract-manifest limitation
are recorded in the evidence. Native PIDs/caches are absent; no broad tests or
campaign replays. Full private v1 remains incomplete; no user/browser/CI hold.

Previous P15 source reuse (2026-11-04): [retained checkpoint inventory](evidence/p15-checkpoint-source-reuse.md)
qualifies157exact embedded exports covering70build/act and210role candidates.
All157decode with current production code; all210pass descriptor/act-gate checks
and retain distinct signature investment. Separate source/journal/manifest
readback passes without gameplay or broad tests.121contexts already have an
idle clear;89need earned repeat-state pairing/first-clear treatment. Two Act V
corpse pack priorities needed learned CE preparation, completed above; seven boss whole-area starts
remain mandatory. Current source differs from v58; old screens are not current
population acceptance. Freeze power/acquisition/adaptation, current context/carry
and pity policies next, reusing this inventory instead of replaying campaigns.
Counts14/14intended Normal,formal0/210; fullv1/wider acceptance remain open.
Root retains the exact named packet through umbrella acceptance; native PID/cache
are absent. Browser works; CI excluded; no user hold.

Previous P15 measurement update (2026-11-04): [native checkpoint runner](evidence/p15-checkpoint-balance-runner.md)
adds strict v3 fixtures, an exact-save native attempt and an explicit single-run
CLI with source/contract manifests and partial journals. 28 focused tests,
scoped types/lint and one separately budgeted CLI control pass; six constructed
attempts retain all nonwins. BUG728 fixes only the retained-output cleanup
reader, preserving failed versions; no gameplay replay. Exact caches/PID/active
config are absent; root retains the named packet through umbrella acceptance.
Counts stay **14/14 intended Normal, formal balance 0/210**. Next freeze actual
70 build/act fixtures and 210 encounter populations before bounded screening.
Full private v1 and wider acceptance remain incomplete; no user/browser/CI hold.

Previous P15 update (2026-11-04): [Zeal earned Normal completion](evidence/p15-zeal-earned-normal-completion.md)
qualifies all five Act V routes and claims at level 82 / next ordinal 1168.
The single native continuation wins 1,644 waves; first-pass retained-output
accounting reconciles rewards, custody, XP, points, quest graph and exact save.
Counts are **14/14 Act I, 14/14 intended Normal, formal balance 0/210**.
Prior failures and costs remain; recorded processes and disposables are absent.
Root retains the exact evidence packet through umbrella acceptance. Wider
balance/economy/pacing/difficulty/endgame/app/soak and independent acceptance
remain open. Full private v1 stays active; no new code, broad tests or CI.

Previous P15 update (2026-11-04): [Zeal earned Act IV completion](evidence/p15-zeal-earned-act4-completion.md)
qualifies61/907: River/Chaos first route attempts,192admissions/1027wins, both
Claims. V3 exact retained-output readback passes; original BUG726/727 reader
failures remain, no gameplay replay. All prior costs/history carried; root
retains packet through umbrella acceptance, disposables/processes absent.
Counts14/14ActI,13/14Normal,formal0/210. Next bounded Act V from this export;
fullv1/wider acceptance remain open, no user/browser/CI hold.

Previous P15 update (2026-11-04): [earned post-Might Izual clear](evidence/p15-zeal-might-earned-izual.md)
qualifies one native ordinal714 admission: five victories and Fallen Angel Claim,
level49/next715. Separate frozen retained-output custody/economy/XP/quest/save/
clock/source/restoration reader passes. Earlier retained-input source comparison
changes60s draw to55.4s victory after explaining exactly30 added cadence events;
original failed control/plan remain. Three old draws and28training admissions
stay spent; the new admission is explicitly fourth, within unchanged aggregate.
Both exact evidence packets retained by root; task processes/caches/configs absent,
no cleanup failure. Counts **14/14 Act I,13/14 intended Normal,formal0/210** stay.
Next remaining Act IV from exact49/715; no old-controller reset, completed-route
replay, broad checks or user hold. Full privatev1/wider acceptance remain open.

Previous P15 update (2026-11-04): [Might Attack component](evidence/p15-might-attack-component.md)
locally resolves BUG725: existing explicitly Attack-scaled skills now consume
selected Might's distinct Attack bonus. All126affected tests, scoped strict
types/two-file lint and seven constructed native Chromium checks pass. No tuning,
profile, save or campaign change; exact disposables/processes are absent and
root retains the named evidence packet through umbrella acceptance. Previous
status-only turn was no progress; this turn changes production and evidence.
Counts remain **14/14 Act I,13/14 intended Normal,formal0/210**. Zeal's earned
level49/next714 checkpoint, three failed Izual attempts and rejected weapon
comparison stay historical; next freeze bounded post-fix evaluation without
silently renewing attempts. Full privatev1 and wider acceptance remain incomplete.

Previous P15 update (2026-11-04): [fresh observed Swing lineage](evidence/p15-swing-fresh-observed-lineage.md)
qualifies fresh Acts I–V (level 82 / next 1174), including the Act I defeat and
paid recovery. Act V adds 261 admissions / 1,644 wins, all five main Claims,
Baal's title and Nightmare unlock. Separate streaming reward/custody/cost/XP/
quest/save/source/clock readback passes; native processes and exact disposables
are absent. All previous costs and historical failures remain. Totals are now
**14/14 Act I, 13/14 intended Normal, formal 0/210**. Zeal and wider economy,
active-time pacing, higher-difficulty/endgame/app/soak/independent acceptance
remain unfinished. No production edit, completed-route replay or broad suite.

Previous P15 update (2026-11-04): [terminal campaign capture](evidence/p15-campaign-terminal-capture.md)
locally resolves BUG723 by recording the single raw native save before terminal
validation. All37affected dispatch/journal cases, scoped types and explicit lint
pass; BUG724 repairs exact continuation expectations proven stale against saved
pre-change sources. Production/gameplay/earned ancestry are unchanged. This
protects future captures and does not recover Double Swing's missing export;
counts remain14/14ActI,12/14Normal,formal0/210 and wider acceptance stays open.

Current P15/P12b update (2026-11-04): [complete direct gem-fusion cost](evidence/p15-gem-fusion-complete-cost.md)
covers all 28 recipes across eight native plans, including a distinct surplus
gem dismantled for the catalyst fee. Six affected cases, prior native report,
scoped types/lint and separate 57,344-point numeric readback pass. The earlier
recipe report is unchanged except provenance. This closes a bounded currency-cost
component; all-source affordability, active-hour pacing and wider acceptance
remain open. Counts stay 14/14 Act I, 12/14 Normal, formal 0/210.

Current P16/P17 update (2026-11-04): [background recovery](evidence/p16-background-image-recovery.md)
locally resolves BUG721 (19affected cases, scoped types/lint, eight qualified
bilingual mobile/desktop browser cases). [Startup language preference](evidence/p16-startup-language-preference.md)
also locally resolves BUG722: 21 affected tests, scoped types/lint and ten native
browser checks pass, including saved/imported locale precedence. Campaign counts
and broader acceptance remain unchanged.

Current P15 update (2026-11-04): [Javelin earned Normal completion](evidence/p15-javelin-direct-normal-completion.md)
brings totals to **14/14 Act I, 12/14 intended Normal, formal 0/210**. Three direct
unfinished Act V admissions win21waves; saved rewards, full quest graph, title
and Nightmare unlock reconcile. Zeal and earned Double Swing remain outstanding.
The historical training controller stays terminal; no completed-area replay.

Current crafting performance update (2026-11-04): [empty crafting search](evidence/p16-empty-crafting-search-performance.md)
locally resolves BUG720; bounded development median336→32ms,30affected cases,
final types/lint and bilingual layouts/save equality pass. Broader performance
acceptance stays open.

Current P16/F21 update (2026-11-04): [combat-log viewport virtualization](evidence/p16-combat-log-virtualization.md)
is implemented and locally verified (45 affected cases, final types/lint and
bounded bilingual browser/gesture checks). BUG718 also restores current save/
campaign fixture contracts. Broader runtime/device/soak and final acceptance
remain open; that slice left campaign counts at 14/14 Act I, 11/14 intended Normal, formal 0/210.

Current P18 update (2026-11-04): [earned production Glacial repeat](evidence/p18-production-glacial-repeat.md)
closes bounded production modifier/reward/persistence integration at native
attempt 6→7, preserving earlier costs and rewards. The current earned successor
is endgame7/Ashen4/Glacial3. Broader balance, active-time pacing, difficulty and
PWA/performance/independent acceptance remain open; campaign counts stay 12/14.

## Checkpoints and order

| Checkpoint                           | Exit condition                                                                                                            | Main work                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| C0 Trust the plan and measurements   | Decisions frozen for next slice; reproducible baseline and production-path harness; no invented pass claims               | P00–P02; independently reproduce integrity defects                                                                 |
| C1 Honest first-act loop             | One class from creation to Andariel through UI; real skills/upgrades, boss equipment, quests, save/reload and mobile work | P03–P09, relevant P10/P11/P12a/P14; choose Sorceress baseline, include one passive and one status/support mechanic |
| C2 One class through all five acts   | Fresh earned-state campaign, all act transitions/rewards, supported idle, no softlocks; provisional pacing measured       | C1 + remaining campaign content, P11–P14; C2 is an integration proof, not final scope                              |
| C3 Seven classes and builds          | Every current advertised skill accepted; two viable builds/class across every act; full item/economy loops                | Complete P10, P12–P15; revisit C2 pacing after mechanics stabilize                                                 |
| C4 Complete v1 and player acceptance | Endgame/achievements, offline/PWA, both locales and a11y/performance gates; final class/campaign matrix green             | P16–P19 and all outstanding feature rows                                                                           |

Do not delay all bug fixes until designs are perfect. Reproduction, save/item
integrity and image resolver fixes can proceed while design decisions are
written. Do not perform final balance calibration until actual combat,
reward/idle and loot eligibility behavior is stable.

## Task cards

Verification codes refer to exact commands in the runbook: **U** full unit,
**E** engine, **T** typecheck, **L** lint, **B** production build, **D/M** desktop/
mobile browser, **P** production/offline browser, **S** new simulation harness.
S and new acceptance specs are deliverables of P02/P00, not existing commands.
Owner verification override (2026-10-31): during development, run only the
cases affected by the change, with scoped type/lint checks where needed.
Select explicit test files or names for the current edit; this long-lived dirty
branch makes all changes versus HEAD an unnecessarily broad test scope. An
Act III content change checks Act III; shared engine changes check the affected
mechanic and its relevant callers. Resume earned checkpoints and retain earlier
act results; do not repeat completed preparation or seed studies. Documentation
updates require no combat replay. Reserve full U/T/L, coverage, production build
and the fresh five-act integration for the final combined source. Relevant
browser checks are required for changed user-facing behavior. File lists
establish ownership areas, not permission to edit every file there in one task.

| ID / state                                                         | Owner; dependencies                                                         | Deliverable and acceptance                                                                                                                                                                                                                                                                                                                                                                             | Likely files / verification                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P00 / ready                                                        | producer + QA; none                                                         | Expand all F01–F21 into traceability records with owner, status and exact proof. Preserve baseline and record current-head command/environment results. Identify success-on-defeat/zero-loot/conditional-skip assertions and specify strict replacement cases. Capture failing reproductions; land each new required regression assertion atomically with its associated fix, without weakening checks | `tests/e2e/full-loop.spec.ts`, relevant playthrough tests, `docs/plans/`; U/T/L, D/M; baseline reports may truthfully contain failed gameplay gates, but C0 harness self-tests and required CI stay passing; do not commit knowingly failing required tests ahead of their fixes |
| P01 / ready                                                        | game/level designers + technical/creative directors; owner pacing confirmed | Resolve D01–D14 to required depth for each dependent slice. Publish one controlling numeric/skill/reward/campaign contract; reconcile exact XP totals, chapter levels, daily-time/maturity assumptions, difficulty and endgame scope                                                                                                                                                                   | Relevant `docs/design/`, new decision records; design review + consistency calculation; no code tuning before affected choice                                                                                                                                                    |
| P02 / needs P00 + relevant P01                                     | QA + engine developer                                                       | Add documented production-path balance command/scenarios and report schema; include tests in actual discovery. Prove one snapshot yields same manual/idle/reward outcomes or a diagnosed discrepancy. Fixture schema includes SHA, data hash, build provenance, seconds and RNG streams; no fixed-DPS/guaranteed-win duplicate engine                                                                  | `tests/sim/`, adapter, config/scripts and `package.json`; E/U/T/L, tiny deterministic S; split schema, adapter and reporting into separate cards before coding                                                                                                                   |
| P03a / ready for repro                                             | store/engine developer; D12 for behavior changes                            | Latest-state save and immediate import round-trip exact; pending autosave cannot overwrite imported state. Corrupt/future saves and quota failure leave existing progress intact and show actionable feedback. Test version-7 compatibility                                                                                                                                                            | `stores/persistence.ts`, `save-adapter.ts`, `features/settings/SettingsScreen.tsx`, associated tests; U/T/L + D/M                                                                                                                                                                |
| P03b / ready for repro                                             | store + frontend developer; D09                                             | One capacity contract across store/UI/reward paths. At 99/100/101 backpack and 499/500/501 stash, no hidden/dropped items; existing over-cap saves remain accessible and can recover. Failed transfer/craft/award is atomic                                                                                                                                                                            | `stores/inventoryStore.ts`, `InventoryScreen.tsx`, `BackpackGrid.tsx`, shared capacity module/tests; U/T/L + D/M                                                                                                                                                                 |
| P04 / ready for repro                                              | content + store developer; D10/D11 for reward changes                       | One main quest advances from actual combat event to claim/unlock exactly once. One item and one merc reward really arrive or enter recoverable overflow. Gold/gambling contradictions recorded and corrected per approved economy                                                                                                                                                                      | `features/quests/claimReward.ts`, `stores/mapStore.ts`, event integration, quest data/tests; E/U/T/L + D/M; separate objective integration from reward-kind slices                                                                                                               |
| P05 / ready for repro                                              | frontend + art director; D13                                                | Same item identity yields agreed art in grid/detail/equip/stash/loot. Failed image A switched to valid B recovers without remount. Weapon category follows metadata; stable readable fallback for missing asset                                                                                                                                                                                        | `ui/cardAssets.ts`, `GameImage.tsx`, `GameCard.tsx`, inventory image call sites/tests; U/T/L + D/M; split resolver and component-state fix if independent                                                                                                                        |
| P06 / needs D04/D06                                                | engine developer + technical director                                       | Deterministic seconds/tie/death/status timing and battle-local summon identity; same snapshot repeated including summons yields identical state/events without external counter resets. Exact DoT expiry and simultaneous death/turn cases covered                                                                                                                                                     | `engine/combat/combat.ts`, `status.ts`, `summons.ts`, focused tests; E/U/T/L                                                                                                                                                                                                     |
| P07a / needs P06 + D05                                             | engine + store developer                                                    | Offensive, defensive and summon passive vertical slices: allocate/respec/equip/reload composes correct bonuses once; descriptions/derived stats and actual combat agree                                                                                                                                                                                                                                | `engine/progression/equipment-mods.ts` or reviewed stat composition module, `combatHelpers.ts`, player integration/tests; E/U/T/L + D/M; shared contract under one integrator                                                                                                    |
| P07b / needs P06 + D05                                             | engine + frontend developer                                                 | Timed buff and selected aura have actual scope, strength, duration, expiry and suppression; Might changes ally damage, Meditation restores bounded mana; replacing aura reverses old effect without drift                                                                                                                                                                                              | Skill effect contract + combat handler + representative class data/tests; E/U/T/L + D/M                                                                                                                                                                                          |
| P08 / needs P06 + D04/D05                                          | engine developer + content designer                                         | Normalize status IDs; preserve every declared effect; apply curses/control/heal/leech and weapon/spell scaling per contract. Demonstrate one damage+DoT skill, one curse and one recovery mechanic with rank/resource/negative cases                                                                                                                                                                   | `engine/skills/dataCatalog.ts`, `effects.ts`, `combat/status.ts`, damage handlers/class examples/tests; E/U/T/L; split effect families into ≤5 writable-file slices                                                                                                              |
| P09 / needs P06–P08 + D06                                          | engine developer                                                            | Summon-to-cap/resource/corpse/refresh policy works; merc and summons contribute and die correctly; threat/target constraints and recovery verified. Utility, transformations, charges and multihit use agreed shared primitives                                                                                                                                                                        | `src/engine/skills/summons.ts`, `src/engine/combat/combat.ts`, summon templates/handlers, skill effects/tests; E/U/T/L; separate summon and each new primitive                                                                                                                   |
| P10 / needs stable P06–P09 contracts                               | producer dispatches seven class owners + QA                                 | Expand 213 CSV rows to actual behavioral contracts and tests; zero enabled stub/partial skill dispositions at exit. Rank 1/cap/breakpoints, passives, prerequisites, equipment, resource failures and both-language descriptions agree; two viable builds/class                                                                                                                                        | Each worker owns its class JSON, class-specific tests/adapter and delegated locale keys; shared files edited by integrator only; E/U/T/L + class D/M; **one card per 3–5 related skills**, never all 213 in one assignment                                                       |
| P11a / needs P01 + P03/P04 + production mechanics for chosen class | engine + store developer                                                    | Shared exact-once victory XP/reward service for real spawn/tier/bonus/overlevel policy; point/respec/quest totals match controlling sheet; loss/draw/reload grant no invented rewards                                                                                                                                                                                                                  | `engine/progression/xp.ts`, `stores/combatHelpers.ts`, reward service, points/tests; E/U/T/L + D/M                                                                                                                                                                               |
| P11b / needs P11a + P06–P09                                        | engine + frontend developer                                                 | Idle map farming resolves combat or reviewed equivalent; weak builds fail honestly. Stop/restart, map changes and background cycles neither duplicate grants nor accrue guaranteed-kill income; offline produces bonus only                                                                                                                                                                            | `features/idle/useIdleTicker.ts`, `engine/idle/online-tick.ts`, shared reward path, tests; E/U/T/L + D/M                                                                                                                                                                         |
| P12a / needs D08 + P02; structural fixes can precede balance       | content + engine developer                                                  | Cover all distinct level/count/loot contexts in 29 areas, boundary ordinals and a proven equivalence partition of the challenge period; every intended equipment source has eligible entries at actual resolved levels, all five bosses included. Forced/random rarity and MF work; report actual materialized rarity/downgrades. Live-engine loot samples replace divergent script                    | `data/loot/treasure-classes.json`, `engine/loot/drop-roller.ts`, loaders/schema if needed, production-path scenarios/tests; E/U/T/L + S + boss D/M                                                                                                                               |
| P12b / needs P03b/P12a + D10                                       | engine + frontend + content designer                                        | One runeword and gem/crafting vertical path acquired from earned sources, assembled via UI, consumes exact inputs atomically, changes combat and persists. Then cover all advertised recipe/socket/set/item-granted-skill families                                                                                                                                                                     | `engine/loot/runeword.ts`, inventory actions, craft UI, recipe/locale data/tests; E/U/T/L + D/M; one recipe/effect family per card                                                                                                                                               |
| P13 / needs P03/P11/P12 + D10/D11                                  | engine + frontend + content designer                                        | Earn recruitment currency→pull/recruit→collect→field one merc→combat→save. Correct pity/duplicates/cost and XP progress beyond L1; restore quarantined assertion. Verify intended current merc flow instead of blindly restoring obsolete route                                                                                                                                                        | `stores/mercStore.ts`, merc/gacha engine and UI, banner data/tests; E/U/T/L + D/M + economy S; split XP fix, obtain/spend and fielding                                                                                                                                           |
| P14 / needs P04/P11/P12a + selected-class P10                      | narrative/content + frontend/engine                                         | All 29 areas and five bosses reachable from earned state; quest/NPC/reward/unlock objective kinds complete. Each act has correct town dialogue/services; no unsupported reward disappears. Export checkpoints after each boss                                                                                                                                                                          | `data/maps/sub-areas/act*.json`, `data/quests`, town/quest UI, map integration/tests; E/U/T/L + D/M; one act/objective family per card                                                                                                                                           |
| P15 / needs P02/P10–P14                                            | level designer + game designer + content                                    | Tune actual combat/XP/loot/currency/gear across all class/build/act cells and 30–50 h fresh campaign target. Publish acquisition/faucet/sink budgets, exact levels and uncertainty; final independent holdout results. First complete small screening runs before expensive certification                                                                                                              | JSON tuning, fixtures and versioned reports; E/U/T/L + S + fresh campaign browser checkpoints; change one coherent tuning group at a time                                                                                                                                        |
| P16 / can audit early; acceptance after relevant gameplay          | UX + frontend + writer + a11y + perf                                        | Critical tasks work at all target sizes and both locales; no inert essential controls/raw keys/art identity defects; stealth/support link as specified. Meet 44 px/contrast/focus/0.5 s feedback and existing reviewed runtime budgets                                                                                                                                                                 | Feature-specific UI/locales, shared UI integrator and E2E/tests; U/T/L/B + D/M + independent accessibility/performance report; one flow per card                                                                                                                                 |
| P17 / needs P03/P11/P16                                            | frontend + QA                                                               | True close/reopen bonus and import/autosave state survive; production warmed offline reload supports actual saved character/navigation/combat/save; update doesn't lose save; explain unavailable uncached optional art                                                                                                                                                                                | `metaStore.ts`, offline hook, persistence/PWA config and production E2E; E/U/T/L/B + P; split time persistence and PWA coverage                                                                                                                                                  |
| P18 / design can begin P01; implementation after P14               | game designer + engine/content/frontend                                     | Bounded canonical endgame dungeon and achievement/reward loop unlocked by actual campaign; two repeat clears, modifier interaction, reward utility, loss/retry and reload proven. No silent deferral of F17/F18                                                                                                                                                                                        | Approved endgame spec, data, engine/reward/UI/test slices; E/U/T/L/B + S + D/M; split unlock, one dungeon loop and achievement reward                                                                                                                                            |
| P19 / needs all prior acceptance                                   | independent QA + reviewer + producer                                        | All G0–G7 and F01–F21 accepted at integrated head; zero unresolved S0/S1. Current required CI and complete unit/coverage/browser gates; two-hour soak, holdout and owner/fresh-player playtest. Report any unknown explicitly, do not declare finished                                                                                                                                                 | Versioned acceptance report/evidence; U/T/L/B, coverage, complete D/M/P, S, playtest + soak + review                                                                                                                                                                             |

## Dispatch examples

First ready batch: QA P00, designers P01, store specialist P03a reproduction.
After a slot frees, P03b/P04/P05 reproductions can be independent with explicit
file ownership. P02 starts with stable fixture/output contracts from P01.
Only then dispatch shared combat foundations; class workers follow frozen
interfaces. Do not run seven class workers editing the same catalog/registry.

For C1, choose a Sorceress fire/cold starter as an implementation reference,
not a guaranteed strongest class. Pair it with a passive and another class's
support example so infrastructure cannot be optimized only for direct damage.
C2 exercises earned-state reachability before multiplying class work; C3
validates the full roster and corrects resulting shared balance regressions.

## Task expansion and updates

Any row spanning independent systems or more than roughly five writable files
must be expanded before assignment. A child card records three or fewer
outcome criteria, concrete files, dependencies, verifier and expected evidence.
Tasks are sessions/slices, not calendar promises. No fabricated time estimates.

```text
Child ID: P10-sorceress-fire-01
State: ready | in-progress | review-needed | accepted | blocked
Goal: first fire skill deals the specified hit plus timed burn
Depends on: D04-v1, P06 commit, P08 effect contract
Own: sorceress.json (named IDs), sorceress-fire.test.ts, delegated copy keys
Accept: burn changes HP on exact timing; rank/cost/CD scale; invalid cast costs nothing
Verify: engine + related tests, browser skill path, integrated U/T/L
Evidence/commit/reviewer/QA:
Remaining and next task:
```

At each checkpoint the producer records accepted and failed gates, command
exits, samples and next ready cards. Persist state after every accepted slice
so context compaction or a new session can resume without re-auditing history.
