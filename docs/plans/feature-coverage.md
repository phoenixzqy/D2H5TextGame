# Canonical v1 coverage map

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

## 2026-11-05 — Ordinary current-tier claw availability

[BUG790 evidence](evidence/p15-claw-progression.md): append49missing rows in23
tables using existing claws and frozen finite source bands. This includes Hand
Scythe39–49in Act III trash and missing tiers in other ordinary sources; all
original rows remain. Latest91affected cases, scoped strict types/lint pass.
Root self-review/local/uncommitted; provisional weights need economy acceptance.
No earned progression, Act III clear or pacing credit. Full private v1 unfinished;
historical14/14Normal/210contexts/formal0/210 unchanged. No spent budgets renewed.

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

Functional benchmark/reporting now has exact current-source results, resources,
reward deltas and emitted damage contributions for all28attempts. It grants no
first-clear, retry, acquisition, recommended-power, statistical balance or
30–50active-hour pacing credit. Next bound attainable ActIII power/acquisition;
remaining gameplay/content/economy/difficulty/endgame and integrated acceptance
remain open. No user hold or new sample/retry/campaign-budget authorization.

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

## 2026-11-05 — Blood Lord and Frozen Terror artwork available

[BUG780 evidence](evidence/p16-act5-champion-artwork.md): two attributed official
bestiary PNGs resolve through canonical overrides. Nine existing affected unit
cases, lint, strict JSON schema and four actual paused CombatScreen en/zh mobile/
desktop cases pass, including decoded images and zero warnings/errors. The prior
champion-immunity packet remains failed as originally recorded; new art-only
verification resolves that specific cause without combat or campaign reruns.
Root self-review only; retained packet, no task caches/processes. Historical
14/14Normal/210contexts/formal0/210 unchanged; broader art/content, gameplay,
economy/pacing and full-v1 acceptance remain open. No user hold or CI requirement.

## 2026-11-05 — Retry installed-plan capture available

[BUG779 evidence](evidence/p15-retry-plan-capture.md): each native retry retains
and journals its installed plan before playback, including unreached suffixes.
Two new causal RED/GREEN controls cover losses, victory disposal and adversarial
journal edits. Scoped types/lint pass; native gameplay/request-policy semantics
stay intact. Root self-review only; no campaign or balance credit. Historical
14/14 Normal/210 contexts/formal 0/210 unchanged; population/acquisition/pacing
and full-v1 acceptance remain incomplete. Named packet retained, task cache removed.

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

## 2026-11-05 — Native retry policy snapshot available

[BUG778 evidence](evidence/p15-retry-policy-snapshot.md): full request copied
before outcomes, versioned policy journaled before admission, all journal and
retained adaptation records detached. Three new adversarial native controls,
scoped strict types and changed-file lint pass. No production gameplay change
or population/balance credit. Actual population/build adaptation selection,
economy/pacing and full-v1 acceptance stay open; historical 14/14 Normal/
210 contexts/formal 0/210 unchanged. No exhausted budget renewed.

## 2026-11-05 — Manual ordinal plan partition defined

[Source proof](evidence/p15-manual-ordinal-partition.md): fixed-input ordinary
manual plan support reduces to 13 ordinal representatives across all 29 areas;
idle and stateful admission do not share that reduction. No live ordinal weights
are assumed. Native witness launch fails before game loading; zero plan calls,
no empirical equality credit or retry. Selected source/readback/cleanup evidence
retained. Population/adaptation, acquisition/pacing and full-v1 acceptance remain
open; historical 14/14 Normal/210 contexts/formal 0/210 unchanged.

## 2026-11-05 — Checkpoint planned-role coverage available

[BUG777 evidence](evidence/p15-checkpoint-role-coverage.md): native plan capture
and population report v2 distinguish absent, unplayed and unknown roles without
historical reconstruction. Known-plan occurrence totals retain later unplayed
waves; reach denominators retain all started trials. 24 distinct focused cases
and scoped types/lint pass. Self-review/retained-output closeout only; no new
balance or campaign credit. Historical 14/14 Normal/210 contexts/formal 0/210
unchanged. Population, adaptation and full-v1 acceptance remain incomplete.

## 2026-11-05 — Exact retained-input baseline available

[P15 evidence](evidence/p15-retained-power-baseline.md): 210 context inputs,
185 source records including two existing order derivatives, full source/state
and ancestry joins verified by extraction and a separate reader. Zero gameplay;
no broader acquisition, population, retry, pacing or balance acceptance claim.
Both processes terminal; named packet retained by root, no disposables. Next
define encounter/population and adaptation boundaries. Historical 14/14 Normal,
210 contexts and formal 0/210 unchanged; full private v1 remains incomplete.

## 2026-11-05 — Selected Act V champion immunity fixed

[BUG775 evidence](evidence/p15-act5-champion-immunity.md): native champion
fire/cold immunity implemented and affected checks pass. Four actual-screen
bilingual mobile/desktop iterations pass mechanics/layout; overall browser
result remains failed because two artwork mappings are absent. Evidence and
cleanup are complete. No new campaign or formal balance acceptance.

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

## 2026-11-05 — Equipment picker pages verified locally

[P16 evidence](evidence/p16-equipment-picker-pages.md) closes BUG772 locally:
50option pages retain full collection/keyboard/eligibility/native equip authority.
29affected UI cases, scoped types/lint and10bilingual/five-size Chromium cases
pass. Constructed2,001item opening improves685–952→80–174ms; no earned/pacing
or whole-app acceptance credit. Root retains named packet; handles terminal,
PIDs/port/cache absent. Broader BUG147 and fullv1 acceptance remain open;
historical14/14Normal/210sources/formal0/210 unchanged. No renewed budgets,
CI or user hold. Continue progression/economy/pacing and integrated acceptance.

## 2026-11-05 — Diablo enrage implemented locally

[BUG753 evidence](evidence/p15-diablo-low-health-enrage.md): 15%HP, speed2,
+50% direct damage; native manual/idle and actual localized CombatLog verified.
25focused checks/type/lint pass. Stun resistance and wider acceptance remain open;
historical14/14Normal,210sources/formal0/210 unchanged. Fullv1 unfinished.

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

## 2026-11-05 — Boss poison statuses rejected

[BUG750 evidence](evidence/p15-boss-poison-status-immunity.md): explicit native
Andariel/Mephisto Poison/Plague protection and truthful Venom feedback pass19new/
40existing affected cases, strict scoped types and lint. Direct poison damage
continues under the75% cap; the old100% damage contract remains unresolved.
Historical14/14Normal,210sources,formal0/210; fullv1 remains incomplete.

## 2026-11-05 — Mephisto three-element execution verified

[BUG749 evidence](evidence/p15-mephisto-elemental-signature.md): chapter order
and Mephisto-only Frost Nova4s cooldown enable all three elements. Eight focused,
19 existing related cases, scoped strict types and lint pass. Shared Frost Nova
stays3s; poison immunity/three-stack design contracts remain open. [Recorded
pacing accounting](evidence/p15-recorded-menu-accounting.md) reconciles five
retained stages (12.69960 combat hours) without replay or human-time claims.
Historical14/14Normal,210sources,formal0/210; full v1 remains incomplete.

## 2026-11-05 — Periodic damage provenance available

[P15 evidence](evidence/p15-periodic-damage-provenance.md) closes BUG748 locally:
new dot events preserve committed source/status/type integrals and pooled carry;
reports keep actual damage and unknown historical coverage explicit. All 92
affected cases, scoped types and lint pass. No tuning or campaign replay.
Historical 14/14 Normal, 210 sources, formal 0/210 unchanged; full v1 incomplete.

## 2026-11-05 — Earned Druid Act III nonwin retained

[P15 diagnostic](evidence/p15-druid-route-first-act3.md) closes evidence only:
two route wins, three Kurast Bazaar losses,19admissions/92waves/8.45893combat
minutes. Separate custody and HP readers pass; exhausted retries stay closed.
Physical pressure dominates; no monster defect or tuning acceptance established.
Historical14/14Normal,210sources,formal0/210 unchanged. Fullv1 remains incomplete.

## 2026-11-05 — Route-first coverage extends through Act V

[P15 evidence](evidence/p15-later-act-route-first.md) closes BUG747 locally.
Controller, native dispatch and CLI recovery checks now support first-entry
progression before advisory farming through Acts II–V. Affected375 and final
focused41 cases pass; types/lint pass. Constructed checks add no earned completion
or balance credit: historical14/14Normal,210sources,formal0/210 unchanged.
Active-hour pacing and broader full-v1 acceptance remain open.

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

## 2026-11-04 — Existing 210 role sources qualified for current decoding

[Retained source reuse](evidence/p15-checkpoint-source-reuse.md) maps all70build/
act and210role candidates to157exact embedded save hashes. All157current native
decodes and210descriptor/act-gate checks pass, as does separate source/journal/
manifest readback.121target areas are already cleared;89need paired earned
repeat states or first-clear coverage. Two corpse Act V pack priorities require
learned CE preparation; seven boss whole-area starts are preserved. No new
combat/reward/holdout access or broad tests. Native PID/cache absent; root retains
the required packet through umbrella acceptance. Power/acquisition/adaptation,
current context/carry/pity freeze and formal populations remain open; historical
screens do not certify current code. **14/14 intended Normal, formal0/210**.
Full privatev1/wider acceptance remain incomplete; no user/browser/CI hold.

## 2026-11-04 — Current: all intended Normal builds; checkpoint runner verified

[Zeal earned completion](evidence/p15-zeal-earned-normal-completion.md) brings
the current counts to **14/14 Act I, 14/14 intended Normal, formal balance 0/210**.
The [v3 checkpoint runner](evidence/p15-checkpoint-balance-runner.md) now supports
one exact saved-state native attempt with explicit context/seed, source identity,
actual metrics/nonwins and partial journals. 28 affected tests, scoped types/lint
and one separately budgeted CLI control pass. Six constructed attempts are
diagnostic plumbing only; all nonwins remain and no formal cell is approved.
BUG728 corrects retained-output cleanup verification without replay. Exact task
disposables/PID are absent; root retains the named packet through umbrella
acceptance. Freeze actual 70 build/act and 210 encounter populations next.
Wider balance/economy/pacing/difficulty/endgame/app/soak/independent acceptance
and full private v1 stay incomplete. Browser works; CI excluded; no user hold.
Older entries below retain their historical counts and outstanding work.

## 2026-11-04 — Fresh observed Double Swing completes Normal

[P15 evidence](evidence/p15-swing-fresh-observed-lineage.md) qualifies the
intended earned build through all five acts. Act V adds 261 admissions / 1,644
victories, all five main Claims, Baal's title and Nightmare unlock; level 82 /
next 1174. Separate streaming save/reward/custody/cost/XP/quest/source/clock
readback passes first attempt. All prior preparation, Act I defeat/retry,
historical failures and exhausted allowances remain. Processes/cache/config
are absent; exact config archive and required packet
`d2-swing-fresh-act5-k3r4370u` remain with root through umbrella acceptance,
then exact cleanup. No production edit or broad suite. Counts **14/14 Act I,
13/14 intended Normal, formal 0/210**; Zeal and broader all-area/population,
economy/pacing/difficulty/endgame/app/soak/independent acceptance remain open.
Full private v1 remains active/incomplete.

## 2026-11-04 — Direct gem-fusion catalyst cost measured

[P15/P12b evidence](evidence/p15-gem-fusion-complete-cost.md) covers 28 recipes
across eight fixed native plans: 224 material-only/complete-cost distributions.
A distinct surplus gem pays the one-shard fee; fusion inputs cannot pay twice.
Six affected cases, prior native case, scoped types/lint and separate sequential
readback of 57,344 CDF points pass. Current costs/yields and all source/protected
hashes reconcile; previous report values remain unchanged. This is a conditional
direct-cost budget, not earned crafting, all-source affordability or player hours.
Required packet `d2-gem-fusion-cost-jfkgq6dq` is retained by root through umbrella
acceptance, then exact cleanup/release; executed configs are archived and no
task-owned process/cache remains. Counts14/14ActI,12/14Normal,formal0/210 unchanged.
Full private v1 stays active/incomplete; wider economy/pacing and acceptance open.

## 2026-11-04 — Startup language preference verified locally

[P16 evidence](evidence/p16-startup-language-preference.md) locally resolves
BUG722. Explicit English survives a pre-character reload; Chinese defaults and
saved/imported precedence remain. 21 affected cases, scoped types/lint and ten
real browser checks pass; imports preserve exact player/inventory data. Task
process/cache cleanup verifies no failures; root retains required
`d2-locale-startup-ybab12cl` through umbrella acceptance, then exact cleanup.
Counts remain 14/14 Act I, 12/14 Normal, formal 0/210; full v1 incomplete.

## 2026-11-04 — Home/town artwork recovery verified locally

[P16/P17 evidence](evidence/p16-background-image-recovery.md) locally resolves
BUG721:19affected cases/scoped types/lint and eight qualified bilingual
mobile/desktop browser cases pass. Healthy nodes/controls, opacity/fitting and
layout are retained. BUG722 fresh-profile locale reset is reproduced and open.
Broader app/PWA/a11y/performance/soak acceptance remains open. Required packet
`d2-background-recovery-ud6mbopw` retained by root through umbrella review, then
exact cleanup; disposables removed/processes terminal. Counts14/14ActI,
12/14Normal,formal0/210 unchanged; full privatev1 active/incomplete.

## 2026-11-04 — Earned production Glacial integration verified locally

P18: [production Glacial repeat](evidence/p18-production-glacial-repeat.md)
wins all four native waves at ordinal 6; authoritative successor is attempt 7,
Ashen 4/Glacial 3. Exact public import, Frozen Terror cold/Chill/cadence,
UI rewards, 150,930 hero XP, 113,197 mercenary XP and acknowledged
Save/browser-close/reopen/Continue reconcile in a separate full-state reader.
All 27,653 ancestral items remain exact; ten append. One production build,
13 emitted-JS bridge scans, 2,886 source inputs and 766 build files pass.
Large chunks and the uncached artwork manifest remain broader performance/PWA
limitations. No replay, Claim/title/socket action, gameplay edit or broad suite.
Owned build/browser processes and port are terminal; exact disposable directories
are absent. The production artifact is archived and all members rehashed.
Root retains required `d2-p18-production-glacial-p244s4dp` through umbrella
acceptance, then owns exact cleanup/release. Previous goal turn was status-only;
this turn completes production integration. **14/14 Act I; 12/14 intended Normal;
formal 0/210.** Zeal, qualifying earned Double Swing, economy/active-time pacing,
higher difficulty, broader app/PWA/a11y/performance, soak and independent acceptance
remain open. Full private v1 active/incomplete; no user/browser/CI hold.

## 2026-11-04 — Javelin completes earned Normal

P15: [Javelin completion](evidence/p15-javelin-direct-normal-completion.md)
continues earned62/next911 directly through Crystalline911/Ancients912/Throne913:
21victories, zero losses/draws; actual63/next914. All19ActV actions, five Claims,
consumed sources, Baal title and Nightmare unlock pass native checks and separate
save/journal/economy/custody/party/clock readback. Historical200-entry training
controller stays terminal; no farming, reset, comparison or completed-area replay.
Scoped types/final lint/native preflight and six malformed schedule controls pass.
All2235production/135campaign inputs remain stable during execution; historical
source differences are explicit. Closure verifies eight PIDs/config/cache absent.
Root retains required `d2-javelin-direct-ygfx322d`/human2 through umbrella review,
then owns exact cleanup/release. **14/14ActI;12/14intended Normal;formal0/210.**
Only Zeal and earned Double Swing remain for Normal; wider economy/pacing,
difficulty/endgame/app/soak and independent acceptance stay open. Full privatev1
active/incomplete. Previous goal turn was status-only/no progress; this turn
records verified earned completion. No pending user/browser/CI hold.

## 2026-11-04 — Combat-log virtualization and test contracts verified locally

P16/F21: [Combat-log virtualization](evidence/p16-combat-log-virtualization.md)
locally resolves BUG719: measured visible/overscan rows, retained history,
reader anchoring, native keyboard/mouse/touch and new-only announcements.
All 45 affected component cases, final five-file lint and final scoped strict
hook types pass; full app compilation also passes. Eight final bilingual
layout cases and two final mobile mouse/touch cases pass; both 360×640 locales
previously passed before the shrinking-height refinement. Original browser and
fixture failures remain retained. BUG718's stale save/campaign contracts are
also repaired: 21 save cases and final 119 affected Act IV/V cases pass, with
other affected campaign files already green. No gameplay or broad suite/build.
Owned log server/port, cache and active scoped config are absent. Root retains
required `d2-combat-log-virtual-5i3imfx1` and `d2-type-contracts-7gpedk58` evidence
through umbrella acceptance, then owns exact cleanup. The preceding status turn
also observed terminal browser/compiler results; this turn completes final
verification and records the implementation. **14/14 Act I; 11/14 Normal;
formal 0/210.** Remaining builds and wider economy/pacing/difficulty/endgame/app/
soak/independent acceptance stay open. Full private v1 active; no user hold.

## 2026-11-04 — Earned eligible caster amulet utility

P12b: [Eligible caster utility](evidence/p12b-earned-caster-utility.md) traces a
Cold74 magic zircon to actual Throne1226/wave2, then native fusion1186/craft1187,
eligible equip and durable Continue. Exact costs/custody and complete production
projection reconcile: raw Energy259→264, mana890→884, recovery47.736→48.256/s.
Craft is a tradeoff. Supplemental settled native inspection preserves gameplay
and explicitly records ordinary offline metadata/bonus. Final separate audit
passes; four external reader corrections and fade-in capture remain retained.
All2,104src files exact; no combat/economic replay/broad tests/build. Owned server
terminal/profile and two caches absent; root retains required packet
`d2-earned-caster-utility-7l_o0d56` through umbrella review, then exact cleanup.
Previous goal turn was status-only/no progress; this turn completes earned utility
qualification. **14/14ActI;11/14Normal;formal0/210.** Wider economy/pacing/build/
difficulty/endgame/app/soak and independent acceptance remain. Full privatev1
active/incomplete; no pending user/browser hold.

## 2026-11-04 — Earned recipe source and spending qualification

P12b/P15: [Earned recipe affordability](evidence/p15-earned-recipe-affordability.md)
reconciles seven continuous journals from empty material/currency balances:
921admissions/4,595settled waves, six exact selected item origins and all13
already committed material actions896–908 plus100wishstones recruitment.
All stage/global balances and raw/settled rewards match; seven authored recipe
checks and eligibility readback pass. Farm phase supplies90.57%of rune-shards;
initial3gem-shards trace to Hellforge. Selected Armets drop920; caster base still
requires60at53, so no caster utility or earliest-affordability credit. Logical
combat9.593h is not active-player time. No gameplay, production edit or broad
check; all2,104src files exact. Required packet d2-earned-recipe-affordability-c00ucj4n
retained by root through umbrella review, then exact cleanup; no disposables.
**14/14ActI;11/14Normal;formal0/210.** Actual active-time distribution, eligible
caster utility, broader economy/pacing/build/difficulty/endgame/app/soak and
independent acceptance remain open. Previous goal turn was status-only; this
turn adds earned-source evidence. Full privatev1 active; no pending user hold.

## 2026-11-04 — Live endgame readiness verified locally

F17/F18/P16/P18: [BUG717 readiness](evidence/p18-live-readiness.md) uses shared native
eligibility and complete subscriptions; Enter and Claim have independent localized
restrictions, including ordinal exhaustion and async ownership recovery. All32
affected cases/scoped strict types/four-file lint pass. Real Chromium:12bilingual
layouts, keyboard/ARIA and unchanged native gameplay; six final scroll captures
verify reachable controls. Producer APPROVE; original failures retained. Task
processes terminal/disposable caches/config absent; root retains required packet
d2-endgame-readiness-3znqjoal/human2 through umbrella review, then cleanup/release.
No earned/balance credit. **14/14ActI;11/14Normal;formal0/210.** Remaining builds,
economy/pacing, difficulty/endgame, app/soak and independent acceptance stay open.
Full private v1 active/incomplete; no pending user or browser-launch blocker.

## 2026-11-04 — Live crafting readiness verified locally

F06/P12b: [Crafting readiness](evidence/p12b-crafting-readiness.md) reports precise
shortfalls and native progression/target/busy restrictions before Preview in
both languages, without requests, RNG or mutation. Async restore/receipt/guard
and complete map authority subscriptions recover automatically. Initial236cases
plus two new bilingual BUG716 regressions pass; final scoped strict types and
explicit changed-file lint pass. Producer bounded review APPROVE. Real WSL
Chromium passes10layouts and native unchanged-gameplay readback; browser pass
predates subscription-only follow-up, covered by component tests. Original
failed checks retained; full compiler failure is not claimed green. Owned server
and caches/config absent; root retains required d2-crafting-readiness-1k5oazhx/
human2 through umbrella review, then exact cleanup/release. **14/14ActI;11/14Normal;
formal0/210.** Zeal/Javelin/Double Swing and wider economy/pacing/difficulty/
endgame/app/soak/independent acceptance remain open. Full privatev1 active.

## 2026-11-04 — Holy Bolt completes earned Normal

F03/F08/P15: [Holy Bolt completion](evidence/p15-holy-bolt-merc-survival-normal-completion.md)
adds Ancients913/first Throne914,15/15victories, all Claims, Baal title and
Nightmare unlock. One owned mercenary helmet replacement uses lossless native
staging; no engine tuning, farming or completed-act replay. Separate complete
control, preparation and earned journal/save arithmetic readbacks pass. Actual
53/next915,801923heroXP/148items; Prayer survives all15waves. All2230production/
134campaign inputs remain exact; helper failures/costs are retained. Six PIDs/
six caches absent; root retains required d2-holy-merc-survival-4eiiudoo/human2
through umbrella review, then owns exact cleanup/release. BUG647 locally resolved
for earned Normal; BUG714 gains earned validation. **14/14ActI;11/14Normal;
formal0/210.** Zeal,Javelin,Double Swing and wider economy/pacing/difficulty/
endgame/app/independent acceptance remain open. Full privatev1 active/incomplete.

## 2026-11-04 — Double Swing verifier and forward diagnostic

F03/F08/P15: [verifier/forward evidence](evidence/p15-swing-verifier-forward-diagnostic.md)
locally resolves BUG669 future capture with three RED/GREEN controls, scoped
strict types/final lint. Original capture remains missing. Two bounded native
diagnostics win18 Act IV/33 Act V waves at711–718; actual50/next719 has all main
Claims, consumed sources, Baal title and Nightmare unlock. Reconstructed ancestry
precludes earned-completion credit. Raw party/event/economy/quest/point readers
and2,230 production/134 campaign hashes reconcile. BUG659 remains open for earned
intended-build acceptance. Sessions terminal/active configs and three caches
absent; root retains required d2-swing-verifier-iialnz8z/human2 through umbrella
review, then exact cleanup/release. **14/14ActI;10/14Normal;formal0/210.** Four
builds and wider full-v1 acceptance remain open. Previous turn was status-only;
this continuation adds diagnostic evidence. Full private v1 active/incomplete.

## 2026-11-04 — Bulk crafting protection verified locally

F06/P12b/P16: [BUG715](evidence/p16-bulk-crafting-protection.md) protects special
gear/runewords/socket investments using one selector/count/deletion policy.
Empty capacity remains eligible; deliberate single discard remains available.
42affected regressions plus two ownership cases, scoped types/eight-file lint,
and four real Chromium desktop/mobile en/zh-CN flows pass. Constructed fixtures
only; no earned crafting/campaign credit. Failed attempts retained; sessions
terminal/cache/configs removed/three ports closed. Root retains required
d2-bulk-crafting-vcjlegqj/human2 through umbrella review, then exact cleanup/release.
**14/14ActI;10/14Normal;formal0/210.** Four intended builds and wider economy,
pacing,difficulty/endgame,app/soak/independent acceptance remain open. Full
privatev1 active/incomplete; previous turn status-only, current production change.

## 2026-11-04 — Joint direct recipe acquisition verified locally

F06/P12b/P15: [joint recipe acquisition](evidence/p15-joint-recipe-acquisition.md)
adds seven authored demands across eight fixed plans, preserving exclusive
identities, repeated inputs, native bundle count mixtures and live TC quantities.
Five distinct affected cases/types/two-file lint pass; separate reader reconciles
all 56 distributions / 7,168 CDF points and source/catalog identity. Production's
2,100 files remain exact. Required packet d2-joint-recipe-budget-q_0bs97f/human2
retained by root through umbrella review, then exact cleanup/release; owned
sessions terminal and config archived/removed. No earned campaign, full recipe
affordability, pacing or formal acceptance. **14/14 Act I; 10/14 Normal; formal
0/210.** Four intended builds, actual channels/sinks and encounter/time policies,
wider difficulty/endgame/app, soak and independent acceptance remain open. Full
private v1 remains active/incomplete.

## 2026-11-04 — Encounter-weighted material supply verified locally

[Planned material supply](evidence/p15-planned-material-supply.md) combines native
independent, replacement-bundle and live-TC models with 377 Normal/manual plans
across 29 areas: 215 contexts / 25,974 planned spawn occurrences. Source means
and per-material at-least-one chances reconcile; no double-counted boss baseline
or suppressed TC picks. Three focused cases, scoped strict types and final lint
pass. Separate Decimal/source-component/hash readback passes; production stays
exact. No combat/campaign replay or earned/affordability/pacing acceptance.
Six check PIDs/config absent; required d2-planned-material-budget-q59pchcw/human2
retained by root through unfinished umbrella review, then exact cleanup/release.
Find Item evidence closure is complete. **14/14 Act I; 10/14 Normal; formal 0/210.**
Four intended builds, all-source/joint recipe economy, pacing, wider difficulty/
endgame/app and independent acceptance remain open. Full private v1 active.

## 2026-11-04 — Find Item material accounting verified locally

[Find Item accounting](evidence/p15-find-item-material-accounting.md) adds an
opt-in source split with native corpse validation and exact-once reconciliation.
All 34 distinct affected cases, scoped strict types and explicit two-file lint
pass. Constructed native fixture: seven paid searches, three successes/four
failures; eight ordinary plus three search reward calls, **zero native materials**.
Positive payout coverage is separate and constructed. Production stays exact;
no campaign credit, acquisition rates, affordability or pacing acceptance.
Corrected external per-kill arithmetic readback passes without gameplay replay.
Eight recorded PIDs/config absent; required d2-find-item-materials-9w23ex0o and
human2 retained by root through unfinished umbrella review, then exact cleanup/
release. Previous goal turn was status-only/no progress; ownership revalidated.
**14/14 Act I; 10/14 Normal; formal 0/210.** Four builds and broader economy,
pacing, difficulty/endgame, app and independent acceptance remain open. Full
private v1 active/incomplete. No broad suite/build or pending browser/user hold.

F03/F08/P15 update, 2026-11-04 — Holy Bolt offensive aura and earned frontier

[Holy Bolt Conviction/frontier](evidence/p15-holy-bolt-conviction-act5-frontier.md)
retains13selected passing regressions/types/lint and exact native control/sole
candidate comparison: prior wave wins52.935s. One genuine free skill reset63ranks/
allowance3→2 reallocates late Prayer to Conviction19, preserving gear/stats.
A zero-gameplay driver-boundary error is retained and corrected; native preflight
passes without reset repetition. Ancients912wins four waves then draws on wave4,
one15,585Life champion left; Prayer died in wave3. Hero1,059Life/549Mana.
Actual52/next913save,265,852heroXP/30items and unchanged quests/ranks reconcile
with raw journal/economy/source readback. Throne unattempted; no Claim/title/unlock.
BUG714 allocation locally fixed; BUG647 dense Act V viability stays open.
All2,223production/134campaign inputs stable. Original reader-field error and
all costs retained; no combat replay.26PIDs/seven caches/config absent; required
packet d2-holy-conviction-e81aux0m/human2 retained by root through unfinished
umbrella review, then exact cleanup/release. **14/14ActI;10/14Normal;formal0/210.**
Four intended builds and wider economy/pacing/difficulty/endgame/app/independent
acceptance remain open. Previous goal turn status-only/no progress; this turn
advances the actual frontier. Full privatev1 active/incomplete. No broad suite/
build, renewed closed trial, new agent/install/CI/commit/push/publication or
pending user answer/browser blocker.

F03/F08/P15 update, 2026-11-04: [Martial Assassin completes Normal](evidence/p15-martial-cobra-normal-completion.md).
One actual free skill reset conserves56earned ranks, raises Cobra6→12 and removes
inherited Web; fixed gear/Prayer retained. Corrective Plains709 and first River/
Chaos710–711 win18waves; first Act V712–716 wins33. All Claims,19 Act V actions,
consumed graph, earned points, Baal title and Nightmare unlock reconcile with
actual level50/next717/Cobra17. Separate raw readbacks and exact cleanup pass;
BUG652 locally resolved, BUG713 gains earned-route validation. All2,223 production
and134 campaign inputs stable. Root retains required d2-martial-cobra-growth-vywwn1j9/
human2 through umbrella review, then owns exact cleanup/release. **14/14 Act I;
10/14 intended Normal; formal balance0/210.** Holy Bolt,Zeal,Double Swing,Javelin
and wider economy/pacing/difficulty/endgame/app/independent acceptance remain open.
Full privatev1 active/incomplete. No broad suite/build or completed-act replay;
previous goal turn status-only/no progress. No pending question/browser blocker.

F21/G6/P16 update, 2026-11-04: [Socket validation optimization](evidence/p16-socket-validation-performance.md)
locally resolves BUG712 by indexing recipes by actual rune count and reusing
validated capacity. All63affected cases, corrected authored-word fixture case,
scoped strict types and final two-file lint pass; original lint finding retained.
The sole frozen seven-pair Node comparison cuts socket median49.6445% and full
current decode13.0604%, preserving complete serialized state and source inputs.
No browser/device/soak acceptance or campaign/balance credit. Tool sessions are
terminal, profile/benchmark PIDs and three caches/config absent. Root retains
required d2-save-decode-profile-ewrl28ga/human2 through umbrella review, then owns
exact cleanup/release. Previous turn was status-only/no progress; ownership was
revalidated.14ActI/9Normal/formal0of210 unchanged; five builds and wider economy/
pacing/difficulty/endgame/app/independent acceptance remain open. Full privatev1
active/incomplete. No broad suite/build, replay, timing rerun, new agent/install/
CI/commit/push/publication, pending question or browser blocker.

F03/F08/P15 update, 2026-11-04: [Summon Druid completes Normal](evidence/p15-druid-heart-normal-completion.md):
an actual free skill reset reallocates61 earned ranks to Heart20/Oak1. Ancients724
and first Throne725 win all15waves; both Claims, all five Act V main Claims,
Baal title and Nightmare unlock reconcile with the native level50/next726 save.
Two admissions earn852,382heroXP and151items. BUG708 is locally resolved for
intended Normal progression; BUG711 gains earned-route validation. All2,223
production-provenance inputs and134campaign inputs remain exact. Separate raw
readback passes; eight recorded PIDs and four exact caches are absent. Root
retains required packet d2-druid-earned-heart-6kb0j4ix and human2 through unfinished
umbrella review, then owns exact cleanup/release. **14/14 Act I; 9/14 intended
Normal; formal balance0/210.** Five builds and broader economy/pacing/difficulty/
endgame/app/independent acceptance remain open. No completed-act replay or broad
checks/build. Full privatev1 remains active/incomplete.

F03/F08/P15 update,2026-11-04: [late Druid Heart allocation](evidence/p15-druid-late-heart-investment.md)
fixes BUG711 locally with one delayed Heart20 target after the Grizzly/Dire
foundation. Three corrected behavioral REDs become green; six selected native
growth/reset/registry cases, scoped strict types and explicit lint pass. Initial
fixture errors retained. Separate structural/source readback proves all2100
production files and actual50/next724 export unchanged. Constructed reset spends
one free allowance; no earned reset/admission or campaign/balance credit. Five
PIDs/config absent; required packet retained by root through umbrella review.
14ActI/8Normal/formal0of210; BUG708 and full privatev1 remain incomplete.

F06/P12b/P15 update, 2026-11-04: [mixed TC reward budgets](evidence/p15-mixed-tc-budgets.md)
complete the 21 live mixed contexts/697 positive intervals and combine twelve
ordinary material profiles without duplicate income. Three focused cases/scoped
types/final two-file lint and separate raw arithmetic/source readback pass.
Fixture-only lint correction after report capture is authenticated explicitly.
All 2,100 production files unchanged; no earned affordability, pacing or campaign
credit. Six check PIDs/config/cache absent; root retains required packet/human2
through umbrella review. 14 Act I / 8 Normal / formal 0 of 210 unchanged.
Full private v1 remains incomplete.

F06/P12a/P15 update, 2026-11-04: [live equipment source census](evidence/p15-equipment-source-budget.md)
closes a fixed native planning/source diagnostic: 810 contexts, 987 TC calls,
1,606 sampled items and conditional native salvage of 11,169 scrap. 21 contexts
retain mixed material/currency picks; three empty champion pools follow D08.
Three distinct focused cases, scoped types/lint and separate raw arithmetic/
2,221 source hashes/2,100 unchanged production hashes pass. No expected income,
affordability, campaign or formal balance credit. Five recorded PIDs/two exact
disposables absent; required packet/human2 retained by root through umbrella
review. 14 Act I / 8 Normal / formal 0 of 210 unchanged; full private v1 incomplete.

F15/P16 update, 2026-11-04: [equipment keyboard actions](evidence/p16-equipment-keyboard.md)
fix BUG710 locally with independent native sibling controls. All 24 affected unit
cases, scoped strict types and explicit fourteen-file lint pass. Native bilingual
hero/mercenary keys, Tab order, full-backpack refusal, 44 layouts and unchanged
public exports at ordinal 908 pass; no campaign/PWA/formal balance credit.
Failures retained and corrected; all 23 PIDs/four disposables absent. Required
packet/human2 retained by root through umbrella review. Counts 14 Act I / 8 Normal /
formal 0 of 210 unchanged; full private v1 remains active/incomplete.

F06/P12b/P15 update,2026-11-04: [special material sources and recipe demand](evidence/p15-special-material-budgets.md)
closes the numeric component for30boss/goblin contexts, four conditional once-only
sources, all98recipes and35ordered runeword costs. Native interval/quantity/full
settlement checks, scoped strict types/two-file lint and separate arithmetic/source
readback pass. Bundles replace baseline materials; once-only rewards never become
repeatable income. No gameplay/tuning, affordability, pacing or campaign credit.
Five recorded check PIDs/three disposable paths absent; required packet/human2
retained by root through umbrella review.14ActI/8Normal/formal0of210unchanged;
fullv1 active/incomplete. Remaining source channels, earned affordability/pacing,
six build routes and wider difficulty/endgame/app/independent acceptance stay open.

F06/P12b/P15 update,2026-11-04: [independent material acquisition measurement](evidence/p15-independent-material-acquisition.md)
adds a repeatable native-reward analysis of105contexts/all68rune-gem identities:
7,140entries/3,923positive intervals. Exact32-bit uniform-grid support and explicitly
modeled IID waiting kills, not total-source rates or observed hours. Three focused
RED→GREEN cases verify all interval/native boundaries; separate arithmetic/source
readback, scoped strict types and explicit two-file lint pass. No gameplay/tuning,
campaign or formal balance credit. Six recorded PIDs/three disposable paths absent;
required packet retained by root through umbrella review.14ActI/8Normal/formal0of210;
fullv1 incomplete. All-source budgets, recipe demand/sinks, earned affordability,
pacing and remaining build/difficulty/app/independent acceptance stay open.

F06/F15/P12b/P16 update,2026-11-04: [runeword effects guide](evidence/p12b-runeword-effect-guide.md)
adds selected-word bonus stats and reviewed grants before spending, including
active payment/cooldown and conditional healing. Shared tooltip formatting keeps
ordinary rune effects separate and item ownership validation intact. Four new
legitimate RED cases become green;48distinct selected panel/tooltip cases, scoped
strict types/lint and24bilingual native effect observations pass.16new-effect
layouts and exact unchanged public gameplay exports at ordinal908 pass. Initial
test-label mistake retained/corrected; exact process/disposable cleanup passes.
Required packet retained by root through umbrella review. No new acquisition,
crafting/campaign or balance credit.14ActI/8Normal/formal0of210; fullv1 incomplete.

F06/F15/P12b/P16 update,2026-11-04: [runeword recipe guide](evidence/p12b-runeword-recipe-guide.md)
adds all35 localized recipes beside socket insertion, including ordered runes,
base alternatives and repeated-rune needed/owned totals. Six legitimate RED
cases become green;14 selected panel/target cases, scoped strict types and
three-file lint pass. Native public-import browsing checks70 recipe observations
and both languages/eight sizes; width-only visual refinement and exact unchanged
gameplay exports pass. Initial helper-CWD failure retained/corrected.15 recorded
PIDs and three exact disposables absent; required packet retained by root through
umbrella review. Recipe discoverability only, no campaign/economy/PWA acceptance
credit.14ActI/8Normal/formal0of210; full privatev1 incomplete.

F08/P13/P15 update,2026-11-04: [mercenary XP correction](evidence/p15-merc-xp-policy.md)
locally fixes BUG709: preserve costs1–18, match polynomial rewards afterward,
and consume saved legacy thresholds before new costs. Four legitimate RED cases,
43selected progression/schema cases, scoped strict types and five-file lint
pass. No earned save/admission or campaign/balance credit. Exact cleanup passes;
root retains required evidence.14ActI/8Normal/formal0of210unchanged; full
privatev1 incomplete, six builds and broader scope remain open.

F03/F08/P15 update,2026-11-04: [Druid Act V closure](evidence/p15-druid-fixed-act5.md)
records24wins/one Ancients draw across720–723,actual50/next724. Three Claims and
scroll Read reconcile; Throne not entered. Supplemental mercXP/direct damage and
exact cleanup pass; no further tuning or replay. BUG708 remains Open;14ActI/
8Normal/formal0of210unchanged. Six builds and wider privatev1 scope remain open.

F19/P05/P16 update,2026-11-04: [tooltip artwork recovery](evidence/p16-tooltip-art-recovery.md)
fixes BUG707 locally by reusing GameImage. One legitimate pre-edit RED,
12affected cases/scoped strict types/two-file lint and four bilingual mobile/
desktop source-browser cases pass. Same-URL recovery, failed retry, healthy-node
stability and unchanged earned Leaf/details reconcile. Initial harness/fixture
failures retained; exact cleanup passes. Root retains required evidence through
umbrella review.14ActI/8Normal/formal0of210unchanged; privatev1 incomplete.

Current F08/P15 update,2026-11-04: [Cold completes Normal](evidence/p15-cold-post-blizzard-act5.md)
after invested Blizzard growth: Ancients1225/Throne1226 win all15waves, actual
74/next1227. Exact saved rewards, all five main claims, Baal title and Nightmare
unlock reconcile. Route and corrected merc/accounting readers pass; cleanup is
verified. BUG643 locally resolved for intended progression. **8/14** intended
Normal completions; **14/14**ActI; formal balance **0/210**. Six builds and wider
acquisition/economy/pacing/difficulty/app/independent acceptance remain open.
Full privatev1 incomplete. Historical counts below describe their dated slices.

F17/P18 update,2026-11-04: [current-source Glacial repeat](evidence/p18-current-glacial-repeat.md)
closes one earned ordinal5/four-wave win with actual Frost Aura→allied Chill/
cadence and exact durable export. Separate all-domain/item/XP/growth/reward audit
passes. Authoritative successor endgame6/Ashen4/Glacial2; earlier admissions stay
closed.1582source hashes/194DOM geometries and exact task cleanup pass. Current
development-source evidence; production Glacial/fairness/pacing/broader acceptance
remain open.14ActI/7Normal/formal0of210; full privatev1 incomplete.

F08/P15 update,2026-11-04: [Holy Bolt cadence diagnostic](evidence/p15-holy-bolt-cadence-diagnostic.md)
closes one control/zero candidates without adoption or campaign credit.36new
cadence observations break exact trace equality; remaining1050events and full
final parties match. No retry/reopening. Frozen pins/terminal cleanup verified;
required packet retained.14ActI/7Normal/formal0of210; full privatev1 incomplete.

F05/F06/F15 update,2026-11-04: [shared runeword names](evidence/p12b-runeword-item-names.md)
fix BUG706 locally: all35canonical identities resolve in both languages and
lists/details share the helper.143affected cases/scoped types/three-file lint
and four native earned-Leaf component cases pass. Original save/data exact;
no crafting/combat/save lifecycle repeated. Cleanup passes; required packet
retained by root through umbrella review.14ActI/7Normal/formal0of210unchanged;
full privatev1 and broader acquisition/app/independent acceptance remain open.


F03/F08 update,2026-11-04: [Martial post-growth Act IV](evidence/p15-martial-post-growth-act4.md)
admits only corrective Plains708: four waves win, Izual draws60s at2,131of40,147
Life. Real invested Cobra/Fists leave the damage floor; residual throughput is
unresolved. Exact49/next709 successor/37items/28salvage removals/123,948XP reconcile;
no Claim, full clear, River/Chaos, training or extra retry. Scoped driver checks,
five-negative-control root reader and frozen source/cleanup closure pass; original
type-config error retained. BUG652 stays Open, no new policy or numeric tuning.
Required external packet/human2 retained by root through umbrella review. Counts
14ActI/7Normal/formal0of210; full privatev1 incomplete, broader implementation open.

F03/F08 update,2026-11-04: [Martial builder growth](../balance/2026-11-04-martial-builder-investment-growth.md)
implements D06: Cobra per-rank damage5→360/Fists5→120, preserving first ranks,
paid charge/recovery/priority mechanics and all other tuning. Corrected RED
reproduces one-damage invested hits;98affected cases/scoped strict types/explicit
lint pass. Original event-assertion/type-config failures retained separately.
BUG652 stays Open: no native admission, preparation, replay, income, campaign or
formal balance credit. Actual49/next708 and closed budgets preserved. Required
packet retained; exact task cache/config/process absence verified at closure.
Counts14ActI/7Normal/formal0of210; full privatev1 active/incomplete. Next qualify
legal progression from retained successor under a bounded prospective plan;
broader build/item/economy/difficulty/app/final acceptance remains open.

F03/F08 update,2026-11-04: [Martial retained attribution](evidence/p15-martial-retained-attribution.md)
reconciles original705–707without replay. Cobra/Fists/Web boss hits are at the
one-point mitigation floor while Cobra consumes23/22of53hero actions with
nearly full mana. The retained selected claw already ties for best scalar
cadence/critical score among ten eligible claws; no equipment-proxy correction
is justified by these candidates. Separate-method root accounting checks28unit
HP totals/three mana totals/source metrics; all inputs remain exact. No code,
combat, native preparation, tests/build or adoption. BUG652 stays Open; next
Martial work is an explicit throughput design decision, not more ordering or
equipment trials. Required packet closed/retained; no disposables. Counts
14ActI/7Normal/formal0of210; full privatev1 remains active/incomplete.

F19/F15 update,2026-11-04: [artwork recovery and document language](evidence/p16-image-reconnect-and-document-language.md)
fix BUG704–705 locally. Failed shared images retry on reconnection at unchanged
URLs; healthy images stay mounted.18 affected cases/scoped strict types/five-file
lint and eight native bilingual mobile/desktop component observations pass.
Resolved i18n language now updates html lang; three new/one selected existing
case, two-file lint/scoped types and ten native language observations pass.
Observer/config failures are retained; no campaign/balance/PWA-wide acceptance
credit. Required evidence retained; closure/cleanup is recorded in its packet.
Counts14ActI/7Normal/formal0of210; full privatev1 remains incomplete.

F06/F15 update,2026-11-04: [earned Leaf and modal recovery](evidence/p12b-earned-leaf-and-modal-focus.md)
closes native ordered crafting/hero+merc equip/granted-skill removal/return/reload.
Two closed diagnostics show7FireBolt casts equipped/0removed; no learned-rank
stacking. BUG703 fixed locally by registering Modal's Floating UI opener reference;
18affected cases/scoped strict types/lint and native desktop/mobile keyboard paths
pass. Final save accounting explicitly checks startup offline reconciliation and
online decay;530items/only intended Leaf payload and Tir−1/Ral−1 reconcile.
Owned process/profile/caches/config cleanup verified; required evidence retained.
No campaign or broad acceptance credit;14ActI/7Normal/formal0of210, privatev1 open.

F06/P12b update,2026-11-04: [current set activation](evidence/p12b-current-set-bonuses.md)
fixes BUG702 locally: unworn inspected pieces no longer activate current bonuses;
stash uses actual gear and explicit after-loadout previews persist.52 affected
cases/four-file lint,9 native functional observations/two settled visual cases
and exact save/Continue comparisons pass. Earned second-piece equip raises Fire
Resistance55→85 with all items/resources preserved. No combat/campaign or all-
family acceptance credit. Owned server/profile/cache cleanup verified; root
retains required packet/human2 through umbrella review.14ActI/7Normal/0of210;
full privatev1 incomplete.

F15/P16 update,2026-11-04: [map readability](evidence/p16-map-readability.md)
fixes BUG701 locally: full wrapping names/badges,14px details, readable cleared
rows and focus/target classes.12 affected existing tests/one-file lint,80 native
act-layout observations/two keyboard flows/three gameplay-save comparisons pass.
Only presentation classes changed; Stop Idle branch is statically verified
without starting farming. Source-browser/implementer evidence; production/PWA,
whole-app and independent acceptance remain open. Owned server/profile/cache
cleanup verified; root retains required evidence/human2 through umbrella review.
Counts14ActI/7Normal/0of210; full privatev1 incomplete.

F06 update,2026-11-04: [earned recipe families](evidence/p12b-earned-recipe-families.md)
verify nine native UI actions: rune/gem fusion/dismantling, armor socket preview/
cancel, insertion/clearing, cross-custody salvage and caster amulet. Exact costs,
receipts900–908, item preservation and Save/restart/Continue pass;14 production
sources unchanged. Observer failure resumes settled successor without replay.
Amulet60 exceeds hero53: no equip/combat credit. Required evidence retained;
task process/profile/cache cleanup verified. All-family acquisition, sets/granted
skills/economy and independent acceptance remain open;14ActI/7Normal/0of210.

F15 update,2026-11-04: [recruitment readability](evidence/p16-recruitment-readability.md)
fixes BUG700 locally with14px text, readable colors and wrapping. Ten affected
existing tests/one-file lint/24 bilingual native source-browser layouts pass.
Earned paid pulls and exact Save/restart/Continue reconcile; only JSX classes
change. Owned server/cache cleanup verified; root retains evidence/human2 through
umbrella review. Production/PWA/independent whole-app and broader economy remain
open. Counts14ActI/7Normal/formal0of210; full privatev1 incomplete.

F06 update,2026-11-04: [earned gem/Lore integration](evidence/p12b-earned-gem-and-lore.md)
verifies native UI fusion/cancel/socket/ordered runes/equip/durable Continue from
an unchanged earned Fire export. Exact costs/four once-only receipts and13
transitions reconcile. Same-base MR50→60, diagnostic Arcane damage220→210;
Lore mana680→694/recovery39.728→41.704sec. No production code change/campaign
admission; native source browser, not production-bundle/PWA acceptance. Broader
acquisition/crafting families/economy/independent acceptance remain open.
Counts14ActI/7Normal/formal0of210 unchanged; full privatev1 incomplete.

F15 update,2026-11-04: [character-sheet hero readability](evidence/p16-character-sheet-readability.md)
fixes BUG699 locally: translated14px attributes, wrapping full names and fluid
card sizing.14browser layout cases/two keyboard entries, nine affected existing
cases and scoped lint pass. Exact source/cleanup closure passes; required packet
and human2 retained by root. Previous creation closure also completed without
replay. Whole-app/production/independent acceptance remains open;14ActI/7Normal/
formal0of210 unchanged. No campaign, broad checks, new agents/install/CI/commit/
publication or renewed closed allowance.

Current F15/P16 update,2026-11-04: [character creation](evidence/p16-character-creation-readability.md)
fixes BUG698 locally: cards fit columns, full translated attributes use14px,
long names wrap.14unique layout cases/two keyboard creation+autosave+reload flows,
six selected native cases and explicit lint pass. Whole-app/production/independent
acceptance remains open. The [Druid allocation diagnostic](evidence/p15-summon-druid-allocation-diagnostic.md)
is closed without adoption or campaign credit; no exhausted allowance renewed.
Counts14ActI/7Normal/formal0of210; full privatev1 incomplete.

Current F08/P15 update,2026-11-04: [Double Throw completes Normal](evidence/p15-double-throw-priority-and-completion.md)
after BUG697 priority correction. Corrective Crystalline715 plus first
Ancients716/Throne717 win21waves, actual50/next718; all19ActV actions/five main
claims, saved rewards, Baal title and Nightmare unlock reconcile.12selected
regressions/scoped types/explicit lint and separate reader/closure pass.
Intended Normal completions now **7/14**, adding Double Throw to Corpse/Bone,
Summon Necromancer, Fire Druid, Fire Sorceress, Bow Amazon and Traps Assassin.
**14/14** cleared ActI; formal balance **0/210**. Full privatev1 incomplete;
no farming/training/extra retry, earlier-act replay or renewed closed allowance.
Earlier dated counts below are historical.

Current F08/P15 update,2026-11-04: [Double Throw Act V checkpoint](evidence/p15-double-throw-act5-checkpoint.md)
records12wins across Bloody Foothills712/Frigid Highlands713, then a60s draw at
Crystalline714W1. Exact49/next715 save, earned rewards and two main claims
reconcile; closure verifies frozen inputs/artifacts and absent task disposables.
BUG697 remains open; no engine cause proven or training/retry allowance renewed.
Counts14/14ActI,6/14five-act Normal,formal0/210; full privatev1 incomplete.

Current F15/P16 update,2026-11-04: [item details/comparisons](evidence/p16-item-readability.md)
fix BUG694–696 locally:14px text/wrapping, StrictMode opener retention and tall
sidebar action reachability.84unique layout cases/two keyboard flows/two native
save comparisons pass;41affected native cases/scoped strict types/lint pass.
Gameplay domains/410items unchanged; no layout or page/console issues. Production,
whole-app and independent acceptance remain open.14ActI/6Normal/formal0of210.

Current F08/P15 update,2026-11-04: [Traps completes five-act Normal](evidence/p15-traps-direct-act5.md).
All33ActV waves win on five first admissions720–724; exact successor50/next725,
all19ActV actions/five main claims, saved rewards, Baal title and Nightmare unlock
reconcile. Intended Normal completions now **6/14**: Corpse/Bone, Summon Necromancer,
Fire Druid, Fire Sorceress, Bow Amazon and Traps Assassin. **14/14** cleared ActI;
formal balance **0/210**. No farming/retry, earlier-act replay or renewed closed
allowance; full privatev1 remains incomplete. Earlier dated counts are historical.

Current F08/P15 update,2026-11-04: [Traps clears earned ActIV](evidence/p15-traps-post-allocation-act4.md).
All18waves across Plains717/River718/Chaos719 win; three claims, exact rewards
and49/next720 successor reconcile. ActV remains unattempted; no training/retry or
renewed closed allowance. Counts14ActI/5Normal/formal0of210 unchanged; fullv1 open.

Current F08/P15 update,2026-11-04: [Bow completes five-act Normal](evidence/p15-bow-post-priority-and-owned-weapon.md)
after BUG693 owned-weapon preparation correction. Corrective Ancients914 and
first Throne915 win all15waves, terminal53/next916; all19ActV actions, exact
saved rewards, Baal title and Nightmare unlock reconcile. Intended Normal
completions now **5/14**: Corpse/Bone, Summon Necromancer, Fire Druid,
Fire Sorceress and Bow Amazon. **14/14** cleared ActI; formal balance **0/210**.
Full privatev1 remains incomplete. Earlier dated counts below are historical.

Current F15/P16 update,2026-11-04: [skill-screen readability](evidence/p16-skill-readability.md)
resolves BUG692 locally. Eleven presentation class changes restore14px text,
16px selectors and opaque rank badges.26development-browser layout cases/two
keyboard flows, six selected native cases and scoped strict types/lint pass;
local screenshots/source reviewed. Whole-app/independent acceptance remains
open; no campaign/balance/pacing credit.14ActI/4Normal/formal0of210 unchanged.

Current F17/F18 update,2026-11-04: [production earned Ashen repeat](evidence/p18-current-earned-repeat.md)
wins all four native waves at ordinal4; exact version33 migration/two full
Save-browser-restart-Continue pairs/all27633 ancestral payloads and rewards pass
separate root readback. Authoritative successor attempt5/Ashen4/Glacial1 retains
Claim/title/ruby utility; no replay0–4. Current production Glacial interaction,
broader endgame/balance and fullv1 remain open. No new campaign count or pacing/
independent acceptance:14ActI/4Normal/formal0of210 unchanged.

Current F08/P15 update, 2026-11-04: [Fire Sorceress completes earned Acts IV–V](evidence/p15-fire-act4-and-act5-completion.md).
Seven admissions win46 waves without new training/retry, ending53/next921;
exact saved rewards, all five Act V main claims, Baal title and Nightmare unlock
reconcile. Intended Normal five-act completions now **4/14** (Corpse/Bone,
Summon Necromancer, Fire Druid, Fire Sorceress); **14/14** cleared Act I.
Formal balance remains **0/210**; full privatev1 and wider acceptance remain
incomplete. Earlier dated counts below are historical snapshots.

Cold follow-up, 2026-11-04: [the first direct Ancients attempt](evidence/p15-cold-direct-act5-suffix.md)
wins four waves then draws on wave five. Exact successor73/next1225, earned
rewards and16inherited quest actions reconcile; no new claim, retry, training
or Baal attempt. BUG643 remains open. Counts4/14Normal,14/14ActI and0/210formal
remain unchanged; the exhausted200-training allowance stays closed.

F13/F15 update,2026-11-04: [attack interval](evidence/p17-attack-cadence.md)
closes BUG676/idle §5.3 and BUG677 locally. Scheduler timing and canonical gear
contribution display at consumed playback position;219affected and4production
browser cases pass. Scoped types/lint/build and source/capture review pass.
Exact disposables removed; root retains required packet/human2 through umbrella
review. Broader idle/MF/PWA and fullv1 remain open;14ActI/3Normal/formal0of210.

F13/F15 update,2026-11-04: [returning-player message](evidence/p17-offline-return-toast.md)
closes BUG675/idle spec §5.2 locally.117affected unit and4production browser cases
pass; source/types/lint/build/bridge scan and five-size/keyboard/full-save checks
pass. Original failures retained. Exact disposables removed; root retains required
packet/human2 through umbrella review. Attack-speed display and broader idle/MF/PWA
acceptance remain;14ActI/3Normal/formal0of210 unchanged.


F13/F15 update,2026-11-04: [offline bonus UI](evidence/p17-offline-bonus-ui.md)
implements XP/MF labels/current-strength meters and bilingual Settings help.
BUG674 fixed locally:12affected lifecycle cases and4production locale/viewport
cases pass, plus one mobile-Chinese visible-help check; strict types/lint/build
pass. Whole-save no-income, decay/expiry, keyboard disclosure and five-size
reflow pass. Returning toast/attack-speed display and wider idle/MF/P17 acceptance
remain open;14ActI/3Normal/formal0/210 unchanged. Required packet/human2 retained
by root; exact disposables removed/verified, consumers terminal.

F05/F08 update,2026-11-04: [combined Swing sword preparation](evidence/p15-swing-sword-combination.md)
wins three retained Izual diagnostics after12exact preceding controls. No
production formula change or earned clear. Native equip succeeds, then an
external mirror assertion loses whole terminal capture (BUG669); separately
verified reconstruction is explicitly labelled and is not original terminal
evidence. All418items/resources persist; no repeated actions/admissions/rewards
or renewed limits. BUG659 remains Open;14ActI/3Normal/formal0/210 unchanged.

F05/F08 update,2026-11-04: [Javelin earned successor and weapon preparation](evidence/p15-javelin-act4-and-owned-weapon.md)
records Plains/River clears, Diablo705draw and49/next706. Signature-only order
is rejected. BUG666 locally fixes the missing offensive weapon policy;43affected
cases, scoped strict types/lint and exact53-action whole-save accounting pass.
The native launch remains failed on an incorrect prospective War Fork prediction:
actual selected polearm ranks highest, all437items/resources persist, no repeat
or combat occurs. BUG642/Diablo viability remains Open. Counts14ActI/3Normal/
formal0/210; full v1 incomplete. Original failures/costs/limits remain retained.

F08 follow-up, 2026-11-03: the single
[Martial equipment-only comparison](evidence/p15-martial-equipment-impact.md)
still draws in all three retained failed waves. BUG664 preparation is fixed;
BUG652 combat viability remains open. Zero native admissions/rewards or renewed
attempts; counts remain14ActI/3Normal/formal0/210. Required evidence is retained
by root through umbrella review; processes/cache are absent.

Scope source: `Diablo2TextGame.md` §§2–11. Status describes this preparation
audit, not a shipped-feature checklist. **Partial** means some source exists
and an important gap is known; **unverified** means end-to-end evidence is
missing, not necessarily that implementation is absent. The producer expands
each row into data→engine→store→UI→tests records in P00.

| ID / GDD        | Feature                                                         | Baseline and source entry points                                                                             | Required completion evidence                                                                                                                       | Owner / tasks                                   |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| F01 / §§2,6     | Seven classes, creation, growth                                 | Partial: `features/character`, `data/classes`, `stores/playerStore.ts`; 213-skill inventory                  | Every class can start, learn, equip, level, respec legally and persist; two viable builds/class                                                    | engine/frontend/game designer; P06–P10          |
| F02 / §5        | Attack-speed combat, deterministic RNG, no movement/range       | Partial: `engine/combat/combat.ts`, `damage.ts`, `turn-order`; scaling/tie/replay risks                      | Exact seed replay including summons; timings, targeting, defeat/draw, damage types, recovery and invalid-action behavior                           | engine/technical director; P06–P09              |
| F03 / §§5.2,6.2 | Skill trees, ranks, prerequisites, ordered combo                | Partial: `data/skills`, `engine/skills`, `features/skills`; registration exceeds behavior                    | All 213 current IDs have intended effect/rank/eligibility/negative tests; combo synergy changes outcome; learned passives automatic                | game designer/engine/QA; P01, P06–P10           |
| F04 / §§5.2,6.4 | Summons and one fielded merc                                    | Partial: summon engine, `mercStore`, formation; caps/start/XP risks                                          | Legal capacity and start policy; actual damage/support/threat; XP/equip/selection/save; cannot field two mercs                                     | engine/frontend; P07–P10, P13                   |
| F05 / §§6.3,8   | Loot, gear, affixes, uniques, sets                              | Partial: `engine/loot`, `data/items`, `inventoryStore`; forced rarity/eligibility/cap issues                 | Legal materialized drops for every context; correct stats and art; equip changes build; set effects, granted skills and two-hand restrictions work | content/engine/frontend; P03–P05, P08, P11–P12  |
| F06 / §§6.3,8   | Runes, gems, crafting, runewords, stash                         | Partial: live crafting/socket interface exists; [earned gem fusion and Lore](evidence/p12b-earned-gem-and-lore.md) verify exact costs/cancel/once-only confirmations/equipment utility and durable reload. [Early earned Fire conversion](evidence/p15-earned-economy-and-early-craft.md) adds21native operations with exact source-based custody, costs and save rehydration; all-family acquisition/stash/crafting integration, economy and independent acceptance remain open | Acquire→stash→socket/craft→consume→equip→persist through UI; invalid recipes atomic; every shipped rune/gem has use                                | content/engine/frontend; P12                    |
| F07 / §6.4      | Merc recruitment/gacha, rarity/pity                             | Mechanics locally verified: paid dual pity, duplicate shards, stars/signatures, history and reveal/Skip; [evidence](evidence/2026-11-02-recruitment-stars.md). [One conditional funding pilot](../balance/2026-11-02-recruitment-funding.md) and [14-route finite-source budget](../balance/2026-11-02-fourteen-route-finite-funding.md) and [deduplicated chronology](../balance/2026-11-02-fourteen-route-chronology.md) complete; [historical net expenses reconciled](../balance/2026-11-02-fourteen-route-wish-sinks.md); [current earned funding/party continuation](../balance/2026-11-02-earned-recruitment-party.md) verifies21paid draws/288waves while exposing trainee deaths; [paid-recruit hero-level correction](evidence/2026-11-02-paid-recruit-levels.md) passes200affected cases; [genuine level71 recruit trial](../balance/2026-11-02-earned-levelled-party.md) and desktop/mobile field/save/reload pass; population/fairness and independent acceptance open | Current intended recruitment control accessible; earn/spend correct currency, pity/duplicates/pool/collection/fielding persist                     | game designer/engine/frontend; P01, P13         |
| F08 / §7.1      | Acts I–V, 29 subareas, five bosses                              | Partial: 14 historical five-act routes and the all29-area supplement are complete. Current intended [Corpse/Bone](../balance/2026-11-03-intended-corpse-act5-completion.md), [Summon Necromancer](../balance/2026-11-03-summon-necro-act5-completion.md), [Fire Druid](../balance/2026-11-03-fire-druid-act5-completion.md), [Fire Sorceress](evidence/p15-fire-act4-and-act5-completion.md) [Bow Amazon](evidence/p15-bow-post-priority-and-owned-weapon.md) [Traps Assassin](evidence/p15-traps-direct-act5.md) [Double Throw](evidence/p15-double-throw-priority-and-completion.md) [Cold Sorceress](evidence/p15-cold-post-blizzard-act5.md) [Summon Druid](evidence/p15-druid-heart-normal-completion.md) [Martial Assassin](evidence/p15-martial-cobra-normal-completion.md) [Holy Bolt](evidence/p15-holy-bolt-merc-survival-normal-completion.md) [Javelin](evidence/p15-javelin-direct-normal-completion.md) and [fresh observed Double Swing](evidence/p15-swing-fresh-observed-lineage.md) complete Normal Act V with exact native save/quest/title/Nightmare-unlock reconciliation and [Zeal](evidence/p15-zeal-earned-normal-completion.md) complete the14/14historical intended Normal routes. Qualifying all-area coverage, populations/holdouts, acquisition/economy, fairness and pacing remain unaccepted; formal balance0/210. Failed stages and closed budgets remain in the execution ledger. | All authored waves and unlocks reachable; boss victory not mere encounter entry; retry/idle/save don't bypass or duplicate                         | content/engine/frontend/QA; P04, P11, P14       |
| F09 / §§7.1,7.3 | Town identity, NPCs, dialogue                                   | Partial: `TownScreen` has Act I-only inert list; dialogue data exists                                        | Every act's hub identifies correct NPCs; required dialogue/quest/recruit/respec tasks work; no misleading dead controls                            | narrative/writer/frontend; P04, P14             |
| F10 / §7.3      | Main/side/bounty quests, rewards                                | Partial: quest data/UI and handler; progress and reward gaps                                                 | Event→objective→completion→claim→unlock exactly once; all objective/reward kinds supported and referenced IDs valid                                | content/engine/frontend; P04, P14               |
| F11 / §§6.1,8   | XP, stat/skill points, currencies                               | Partial: progression modules; [selected shared XP curve](../design/kill-xp-policy.md) implemented and [one intended Act IV completion](../balance/2026-11-03-intended-act4-kill-xp-completion.md) independently verified; economy/no-gold risks remain; [current finite-source/reset budget across14retained routes](../balance/2026-11-02-fourteen-route-finite-funding.md), [historical chronology](../balance/2026-11-02-fourteen-route-chronology.md) complete, [recorded historical expenses reconciled](../balance/2026-11-02-fourteen-route-wish-sinks.md), [current-source earned continuation](../balance/2026-11-02-earned-recruitment-party.md) conserves224new/190spent wishes and actual party XP; [Four-branch current economy reconciliation](evidence/p15-earned-economy-and-early-craft.md) passes with15corruption controls and publishes finite Normal faucet/sink budgets; population/active-hour acceptance open                                          | One exact curve/reward/point contract; lawful allocation/respec; faucets/sinks and time-to-afford by act                                           | game/level designer/engine; P01, P11, P15       |
| F12 / §9        | Online idle farming                                             | Partial: map farming uses native combat through `stores/idlePlaybackClock.ts`; the legacy `useIdleTicker()` has no production caller. [Short browser fixture](evidence/p02-native-clock-equivalence.md) verifies ordinary/accelerated playback and exact saved rewards; broader idle acceptance remains open | Same combat-qualified rewards and survival constraints as manual play; stop/map switch/background neither duplicates nor invents rewards           | engine/frontend; P11                            |
| F13 / §9        | Offline next-online XP/MF window                                | Partial: [ordinary close/reopen](evidence/p17a07-close-reopen.md) verifies persisted capped bonus, quiet online decay and no repeat grant in four locale/viewport cases; [production offline return → decayed native XP → durable rewards](evidence/p17-integrated-rewards.md) passes all four locale/viewport cases; broader idle/MF and full P17 acceptance remain open | No direct offline loot/XP; persisted capped bonus, controlled clocks, no repeated grant on reload, lawful consumption                              | engine/store/QA; P03, P11, P17                  |
| F14 / §§2,11    | Local IndexedDB, save/import/export/migrations                  | Current logical save33; [immutable JSON physical storage](../balance/2026-11-02-json-save-storage.md), legacy/native-map reads,344affected cases,14targeted browser cases and four complete7413-item production roundtrips verified locally; umbrella acceptance open                                     | New and old saves; import/export identity; atomic failure; clear feedback; corrupt/future versions rejected safely; autosave races                 | technical director/engine/frontend; P03         |
| F15 / §§2,4     | Mobile, desktop, zh-CN/en, stealth mode                         | Partial: [Localized resource names](evidence/p16-statbar-accessible-names.md) fixes BUG745 with three focused tests and four actual browser cases; [Card resource names](evidence/p16-card-resource-names.md) fixes BUG746 locally for all three supported kinds, including mounted locale changes;15affected tests and four actual browser cases pass. [Character-sheet hero](evidence/p16-character-sheet-readability.md) has localized14px attributes/full names and14 browser layouts; BUG699 locally fixed. [Character creation](evidence/p16-character-creation-readability.md) fixes overlapping cards/localized14px attributes, with14 layout cases and two keyboard creation/autosave/reload flows; BUG698 locally fixed. [quest readability/localization](evidence/p16-quest-readability.md) verifies46 main/side cards in both languages at five target sizes; BUG689 passes20 development-browser cases and six native cases. [Hire-roster readability](evidence/p16-merc-hire-readability.md), BUG690, passes10 development-browser cases and five native cases, including keyboard hire. [Owned-card readability](evidence/p16-owned-merc-readability.md), BUG691, passes10 development-browser layout cases plus two keyboard flows;14px labels, contrast≥4.955760:1 and full names verified on two Rogues. Final production checks, whole-app accessibility/performance and remaining UI acceptance stay open | All critical tasks at required sizes/locales; no raw keys or inert essential controls; stealth hides imagery as intended; a11y                     | frontend/writer/UX/a11y; P05, P16               |
| F16 / §§2,11    | Installable offline PWA                                         | Partial: [production offline gameplay/save](evidence/p17b01-production-offline.md) passes four locale/viewport cases; [real A→B worker replacement](evidence/p17b03a-worker-update.md) preserves saved/pending state and [PNG install icons](evidence/p16-support-pwa-install-icons.md) are verified; [current offline-return/reward/save integration](evidence/p17-integrated-rewards.md) passes four cases and fixes passive notification input interception; physical-device installation and full P17 acceptance remain open | Production warm-cache offline reload with current character, navigation/combat/save; update preserves save; install prerequisites verified         | frontend/QA; P17                                |
| F17 / §10       | Repeatable high-difficulty post-campaign dungeon                | Partial: [historical earned Ashen×3/Glacial×1](evidence/p18-earned-endgame4.md), [current production earned Ashen repeat](evidence/p18-current-earned-repeat.md), and separate [development-browser defeat/retry](evidence/p18-current-browser-defeat-retry.md) establish bounded unlock/repeat/reward/save paths. [Current-source Glacial repeat](evidence/p18-current-glacial-repeat.md) adds actual allied Chill/cadence and durable reward integration. [Current production Glacial repeat](evidence/p18-production-glacial-repeat.md) closes bounded production modifier/reward/persistence integration; authoritative successor attempt7/Ashen4/Glacial3. Fairness/balance, performance/PWA and broader P18 acceptance remain open | Earned unlock, selected modifier rules, fair repeat play, useful rewards, persisted progress; no developer injection                               | game designer/engine/content/frontend; P01, P18 |
| F18 / §10       | Achievements, special rewards/titles                            | Partial: [earned once-only Claim/title/socket utility](evidence/p18-earned-endgame4.md) grants one perfect ruby/sapphire, Riftwalker ownership/selection and actual +50Life ruby use. [Current production Ashen repeat](evidence/p18-current-earned-repeat.md) and [production Glacial repeat](evidence/p18-production-glacial-repeat.md) preserve claimed/title/socket state exactly across durable restart without repeating Claim. Broader/independent acceptance remains open | Real qualifying events grant intended achievement/reward exactly once; UI and reload show ownership                                                | game designer/content/frontend; P18             |
| F19 / §§4,11.1  | Item/class/monster art, provenance and lightweight presentation | Partial: 690 generated mapped files exist; [shared-image reconnection](evidence/p16-image-reconnect-and-document-language.md) locally fixes BUG704 with18 affected cases/eight native component observations. [HUD/skill recovery](evidence/p16-avatar-skill-image-recovery.md) fixes BUG743 locally with11 selected cases and eight bilingual mobile/desktop surface observations. [Detail/roster recovery](evidence/p16-detail-roster-art-recovery.md) fixes BUG762 locally: 27 selected cases and 12 bilingual mobile/desktop surface observations. Wider identity/provenance/budget and production/PWA acceptance remain open | Asset IDs resolve consistently across all surfaces; failure→recovery; offline policy; source metadata and private asset budget | art director/frontend/QA; P05, P16–P17 |
| F20 / §2        | Low-key optional support link in settings                       | Unverified in this audit                                                                                     | Agreed low-key control works, default treatment meets GDD; no purchase/power flow                                                                  | frontend/QA; P16                                |
| F21 / §§4,11    | Runtime performance and bounded combat logs                     | Partial measured fixes: [empty crafting search](evidence/p16-empty-crafting-search-performance.md) removes off-page formatting for blank queries (bounded development median336→32ms;30affected cases, bilingual layouts and full-save equality pass); [combat-log virtualization](evidence/p16-combat-log-virtualization.md) now renders measured visible/overscan rows with retained history, keyboard/mouse/touch and new-only announcements; 45 affected cases and bounded browser checks pass. [canonical socket lookup](evidence/p16-socket-validation-performance.md) passes63affected cases and a frozen seven-pair Node comparison (49.6445% lower socket median;13.0604% lower complete decode median); browser/runtime acceptance remains open. large-save input/validation/inventory and [key-only existence / single-load startup](../balance/2026-11-02-save-existence-performance.md). [Browser skill precompilation](../balance/2026-11-02-skill-validator-precompilation.md) and [static catalog precompilation](../balance/2026-11-02-authored-catalog-precompilation.md) reduce profiled production startup; [selected save-schema precompilation](../balance/2026-11-02-save-validator-precompilation.md) improves import 25.8% (mobile CPU emulation); [remaining startup data precompilation](../balance/2026-11-02-startup-leaf-precompilation.md) brings mobile reload to 5.378s/longest task 1.967s, with slower import in that sample; [static policy precompilation](../balance/2026-11-02-startup-policy-precompilation.md) passes472affected cases, with same-session mobile reload 6,354.931 → 5,821.779ms; [current-save single scan](../balance/2026-11-02-current-save-validation.md) passes164affected cases with exact full-save roundtrips; mixed mobile timing. [Current JSON semantic deduplication](../balance/2026-11-03-json-semantic-validation.md) passes183affected cases, cuts direct full-decode median13.680% and preserves full8540-item production import/reload state; startup/storage/runtime and soak acceptance remain open                                            | Real device/browser budgets, log/queue bounds, long session and full inventory; perf gates retained                                                | performance analyst/QA; P16, P19                |

F05 update, 2026-11-03: [ordinary spear progression](evidence/p15-spear-progression.md)
adds four two-handed tiers/61 appended picks across28 tables; BUG661 fixed locally.
151 affected unit cases, scoped strict types/lint and exact predecessor preservation
pass. Four distinct desktop/mobile×en/zh-CN browser cases pass across two reports;
original mobile-English setup reload timeout retained, cause unproven, isolated
rerun passes. Eight captures inspected. Owned disposables absent/processes stopped;
campaign sources/saves unchanged. Availability/native equip/save verified; earned
acquisition/economy, ActIV viability and umbrella acceptance remain open. Counts
14ActI/3Normal/formal0/210 unchanged; root retains human2/required evidence.

F08 update,2026-11-03: [retained Act IV damage attribution](evidence/p15-act4-damage-attribution.md)
reconciles six Izual draws without combat or save mutation. Authored scaling and
mitigation explain the observed floor hits; offensive equipment/rotation
preparation is the next diagnostic target. No encounter correction or acceptance;
original budgets remain exhausted. Counts14ActI/3Normal/formal0/210 unchanged.

F05/F08 update, 2026-11-03: [Barbarian owned weapon preparation](evidence/p15-barbarian-owned-weapon.md)
enables the physical selector at intended Swing6/Throw12, preserving first
required-weapon acquisition and later affinity.35 focused cases, strict types
and lint pass. The exact Swing check selects a stronger owned weapon but stops
under its staging-action limit before equip; the exact Throw check has no better
eligible owned throwing weapon and changes nothing. Both actual failures and
whole-save readbacks are retained. No combat, acquisition, encounter correction,
replayed route or renewed gameplay limit. BUG659/BUG656 and full v1 remain open;
counts14ActI/3Normal/formal0/210. Exact disposable config/caches removed/verified;
required evidence/human2 remain root-owned through umbrella review.

F08 update, 2026-11-03: [Double Swing earned progression](../balance/2026-11-03-swing-earned-progression.md)
clears intended Acts II/III first attempt, then ends Act IV49/next711 after30
training admissions and three Izual draws. No Act IV Claim/clear or Act V. Native
custody/quests/party/clocks/seeds/ordinals and nine negative controls pass. BUG659
retains the failure and all exhausted budgets; all67 mainhand decisions reject
higher-Attack owned gear under all-stat nondecrease. No native equip/scaling defect
or verified Izual fix. Earlier costs/failures remain. Counts14ActI/3Normal/formal0/210.

F05/F08 update, 2026-11-03: [ordinary sword tiers](evidence/p15-sword-progression.md)
locally fixes BUG660 with34 additive picks across24 ordinary tables, using existing
War32/Legend60 swords.52 affected unit cases, strict types/lint and four Chromium
desktop/mobile×en/zh-CN cases pass; eight captures inspected. Exact full-JSON
preservation and unchanged Swing terminal save pass; owned configs/cache removed
and processes absent. Availability/native equip/save is verified; acquisition,
economy/pacing and BUG659 late-act viability remain open. No campaign replay,
renewed attempts or earned gift. Root retains evidence/human2 through umbrella review.

F05/F08 update, 2026-11-03: [ordinary throwing progression](evidence/p15-throwing-progression.md)
adds five one-handed zero-socket weapon tiers and70 append-only picks across28
ordinary campaign tables. BUG658 locally fixed;176 distinct affected unit
assertions, four Chromium desktop/mobile×en/zh-CN cases, scoped types/lint and
exact additive preservation pass. New content is available and equips/persists;
earned acquisition, economy/pacing and Double Throw Act IV viability are separate
and still open (BUG656). No campaign/seed replay or renewed attempt limits.
Counts remain14 intended Act I clears,3 five-act Normal completions, formal0/210;
BUG592 and full private v1 remain open. Required packet/human2 remain root-owned
through umbrella review; disposable configs/cache removed and absence verified.

F15 update, 2026-11-03: [stealth badge localization](evidence/p16-stealth-label.md)
fixes the visible hardcoded Chinese label. Two ordinary-control Chromium cases
(desktop/mobile, both locales live) plus scoped strict types/lint pass. Save/
reload, imagery/color rules and toggle off pass; four captures inspected. Original
RED and final source hashes retained; exact owned config/cache removed and
recorded processes absent. F15/full G5/a11y/private-v1 acceptance remain open.


F05/F08 preparation update, 2026-11-03: [Martial owned claw selection](evidence/p15-martial-owned-weapon.md)
fixes BUG664 locally using existing physical-offense-v1 from JSON level1.39cases,
scoped strict types/lint and exact zero-combat retained-save readback pass.
28native actions equip the diagnosed Greater Claws; all394items and current
resources/progression persist; repeat is byte-exact unchanged. No earned clear
or balance acceptance:14ActI/3Normal/formal0/210. BUG652 remains Open; the paired-
finisher trial stays rejected and original705–707budgets exhausted. Full private
v1 and wider acceptance remain incomplete. Exact disposable config removed,
recorded processes terminal and caches absent; root retains required packet/
human2 through umbrella review and owns eventual cleanup/release.

F08 progression update, 2026-11-03: intended Double Throw Barbarian
[Act IV checkpoint](../balance/2026-11-03-double-throw-act4-checkpoint.md) retains
47/677 → 49/709. All three Plains attempts draw against Izual with hero/Prayer
alive; no Act IV clear/claim or Act V. 29 training/three route admissions settle
186 victories/three draws. Frozen readback/nine controls, scoped checks and
closure pass exact native state; source unchanged, costs/failures retained,
exact config/cache removed and recorded processes absent. BUG656 records the
failure without a proved engine defect; attempts 706–708 remain exhausted.
Intended completions remain three; formal 0/210 and wider acceptance open.

F08 progression update, 2026-11-03: intended Double Throw Barbarian
[completes Act III](../balance/2026-11-03-double-throw-act3-completion.md),
32/452 → 47/677. Five first-attempt routes/11 actions/two
claims and 1,303 victories across 225
admissions reconcile. Frozen readback/nine controls, scoped checks and closure
pass exact native state and ordered custody/economy/points/quests/Prayer/clocks/
seeds/ordinals. Source unchanged, previous costs/losses retained, exact owned
config/cache removed and recorded processes absent. Acts IV–V and wider
acceptance remain open; intended five-act completions remain three, formal 0/210.

F08 progression update, 2026-11-03: intended Double Throw Barbarian
[completes Act II](../balance/2026-11-03-double-throw-act2-completion.md),
13/118 → 32/452. Six first-attempt areas/21 actions/five claims and1,675
victories across334admissions reconcile. First frozen readback/nine controls,
scoped types/lint/preflight and closure pass native save/custody/economy/points/
quests/Prayer/clocks/seeds/ordinals. Source and accepted profile unchanged;
all previous costs/two defeats retained; exact owned config/cache removed and
processes absent. Acts III–V and wider acceptance remain open; intended
five-act completions remain three, formal balance0/210.

F14/F15 update, 2026-11-03: [import-dialog error recovery](evidence/p03-import-dialog-errors.md)
fixes inaccessible feedback, focus/Escape loss and background-toast overlap.
31 affected unit cases and10 ordinary Chromium locale/required-size cases pass
across all five sizes, with exact native save/export conservation, scoped types/
lint and inspected final screenshots. Landscape uses the bounded modal scroll
area with ordinary retries reachable. All three reports close in retained
uncommitted human2 source; original failures and exact manifest remain. Full
touch/contrast/zoom, umbrella G1/G5 and full-v1 acceptance remain open.

F08 progression update, 2026-11-03: intended Martial Assassin
[Act IV checkpoint](../balance/2026-11-03-martial-act4-checkpoint.md) retains
47/675 → 49/708 after the Act III clear. Thirty training/three route attempts
settle 191 victories/three draws: two Izual draws and one earlier-wave draw.
No Act IV clear/claim or Act V; attempts 705–707 exhausted. Frozen readback/
scoped checks/closure pass exact native state; source unchanged, costs retained,
exact config/cache removed and processes absent. BUG652 records throughput
failure without claiming an engine fix or renewed attempts. Intended five-act
completions remain three; formal 0/210 and wider acceptance remain open.

F08 progression update, 2026-11-03: intended Martial Assassin
[completes Act III](../balance/2026-11-03-martial-act3-completion.md),
32/450 → 47/675. All five first-attempt routes/11 actions/two claims and
1,303 victories across 225 admissions reconcile. Frozen V1/nine controls,
scoped checks and exact native custody/economy/points/quests/Prayer/clocks/
seeds/ordinals pass; source unchanged, all previous costs retained. Exact
config/cache removed and recorded processes absent. Act IV onward and wider
acceptance remain open; intended five-act completions stay three, formal 0/210.

F08 progression update, 2026-11-03: intended Martial Assassin
[completes Act II](../balance/2026-11-03-martial-act2-completion.md) at level 32 /
next ordinal 450. All six routes clear first attempt; 21 actions/five claims,
333 admissions and 1,670 victories reconcile. First frozen V1 readback and
scoped types/lint/preflight/closure pass exact native save, ordered custody,
economy/points/quests/Prayer/clocks/seeds. Source and accepted profile stay
unchanged; all original defeat/costs and manifest-omission disclosure are
retained. Acts III–V and broader population/economy/fairness/pacing remain open;
intended five-act completions stay three and formal balance acceptance 0/210.

F08 progression update, 2026-11-03: intended Traps is
[Act IV partial](../balance/2026-11-03-traps-act4-checkpoint.md) at49/717;
all three Izual attempts draw and remain exhausted. The
[late Blade allocation correction](../balance/2026-11-03-traps-late-blade-allocation.md)
passes seven affected cases/scoped checks. One retained control matches exactly;
one candidate with five native paid points wins at46.478s. This is diagnostic,
with zero campaign admissions/rewards; no Act IV clear/claim is earned.
All production inputs stay unchanged. Intended completions remain three;
full-v1/population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Traps Assassin
[completes Act III](../balance/2026-11-03-traps-act3-completion.md) at 47/685.
5 routes/11 actions/2 claims, 1,298 settled waves; first frozen
V1 readback and scoped checks/closure pass. Source/policy and prior costs remain
retained; all broader population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Traps Assassin
[completes Act II](../balance/2026-11-03-traps-act2-completion.md) at 32/461.
6 routes/21 actions/5 claims, 1,759 settled waves; first frozen
V1 readback and scoped checks/closure pass. Source/policy and prior costs remain
retained; all broader population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Summon Druid is now
[Act IV partial](../balance/2026-11-03-summon-druid-act4-checkpoint.md) at49/717.
All three Izual route attempts draw with the hero alive; no Act IV clear/claim.
32admissions/186victories/three draws; first frozen V1 readback, scoped checks
and cleanup pass. All source and prior costs remain retained; the three
attempts stay spent and Act V is unattempted. No implementation defect or
numeric fix established. Intended five-act completions remain three; broader
population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Summon Druid
[completes Act III](../balance/2026-11-03-summon-druid-act3-completion.md) at 47/685.
5 routes/11 actions/2 claims, 1,298 settled waves; first frozen
V1 readback and scoped checks/closure pass. Source/policy and prior costs remain
retained; all broader population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Summon Druid
[completes Act II](../balance/2026-11-03-summon-druid-act2-completion.md) at 32/461.
6 routes/21 actions/5 claims, 1,759 settled waves; first frozen
V1 readback and scoped checks/closure pass. Source/policy and prior costs remain
retained; all broader population/economy/fairness/pacing gates stay open.

F08 progression update, 2026-11-03: intended Fire Druid now
[completes Act V](../balance/2026-11-03-fire-druid-act5-completion.md) at
82/1171. All five routes clear first attempt, all eight Throne/Baal waves,
19 actions/five claims, Slayer of Baal title and native Nightmare unlock
reconcile. 261 admissions settle 1,645 victories; three mercenary deaths/nine
waves without the merc are retained. First frozen V1/nine-negative-control
readback, scoped checks and exact cleanup pass. All source and prior costs
remain retained. Current intended five-act completions now three: Corpse/Bone,
Summon Necromancer and Fire Druid. Intended all-area coverage, populations/
holdouts, economy/fairness/pacing and earned later difficulties/endgame remain
open; formal balance0/210.

Earlier F08 checkpoint, 2026-11-03: intended Fire Druid
[completes Act IV](../balance/2026-11-03-fire-druid-act4-completion.md) at
61/910. All three routes clear first attempt; all 13 actions/three claims
reconcile. 225 admissions settle 1,224 victories with no nonwin, interruption
or unplayed suffix. First frozen V1 readback, scoped checks and exact cleanup
pass; production/campaign source remains unchanged. Prior costs retained;
Act V, intended populations, economy/fairness/pacing and formal acceptance open.

Earlier F08 checkpoint, 2026-11-03: intended Fire Druid
[completes Act III](../balance/2026-11-03-fire-druid-act3-completion.md) at
47/685, following its verified Act II completion. All five routes clear first
attempt and all 11 actions/two claims reconcile; 224 admissions settle 1,298
victories with no nonwin, interruption or unplayed suffix. Frozen V1 readback,
scoped checks and exact cleanup pass. All prior costs remain retained. Later
acts, intended populations, economy/fairness/pacing and formal acceptance stay
open; this continuation changes no gameplay source.

F08 progression update, 2026-11-03: intended Summon Necromancer now
[completes Act V](../balance/2026-11-03-summon-necro-act5-completion.md) at
82/1163, following the verified Act II–IV completions. All five Act V
routes clear first attempt; all 19 actions, five claims, Slayer of Baal title
and native Nightmare unlock reconcile. 261 admissions settle 1,644 victories,
including all eight Throne/Baal waves, with no nonwin or interruption. Frozen
V1/nine-negative-control readback, scoped types/lint/preflight and exact cleanup
pass; production/campaign source remains unchanged. Prior costs and the original
Act I defeat/recovery remain retained. Intended populations, fairness, economy,
pacing and earned later difficulties/endgame remain open; formal balance
acceptance stays 0/210.

Intended Bow now [completes five-act Normal](evidence/p15-bow-post-priority-and-owned-weapon.md)
at53/next916. River/Chaos and early ActV clear, then the original Ancients draw
exposes BUG693's omitted physical weapon policy. Five focused regressions and
scoped types/lint verify the correction. The single corrective Ancients retry
and first Throne attempt win all15waves; all19ActV actions, exact saved rewards,
Baal title and Nightmare unlock reconcile. Retained readback/closure pass;
all20recorded PIDs and exact disposables are absent. Original costs and exhausted
allowances remain spent. Counts14ActI/5Normal/formal0of210; wider acceptance open.

Earlier intended Bow was [Act IV partial](../balance/2026-11-03-bow-act4-checkpoint.md)
at51/next908: Izual third-attempt clear/Fallen Angel Claim, River preparation200
exhausted, Hellforge/Diablo unattempted. First frozen V1 readback verifies exact
native save/custody/accounting without replay; all prior costs remain spent.
The [target-rank volley policy](decisions/P15-intended-bow-target-volley-priority-v1.md)
is now locally corrected: exact retained control plus one order candidate turn
a training draw into a 57.794-second living-hero win; 30 selected regressions,
strict types and explicit lint pass. This does not renew River preparation,
earn a route clear or establish population/pacing acceptance.
It previously [completed Act III](../balance/2026-11-03-bow-act3-completion.md)
at47/next675: five first-attempt routes/11quest actions,225admissions/1,303victories,
220training entries, no nonwin/unplayed suffix. Scoped checks pass; frozen V1
reader's absent-aura indexing defect is retained as BUG-648, with amended V2
passing exact save/custody/economy/points/quests/party/clocks/seeds/ordinals without
combat replay. It previously [completed Act II](../balance/2026-11-03-bow-act2-completion.md)
at32/450, all six first-attempt routes/21quest actions. Bow profile and all
2,151production/131campaign inputs remain unchanged during Act III. Later acts/
populations/fairness/pacing remain open; formal0/210.

Intended Holy Bolt now [completes Act IV and reaches partial Act V](evidence/p15-holy-bolt-act4-and-act5-checkpoint.md):
River906/Chaos907 clear with both Claims and all13 Act IV actions complete.
Act V's first three areas clear/claim, Anya's scroll is read, and Ancient's
Way911 draws in wave4; Throne remains unattempted. The exact successor is52/next912.
Both retained-output readbacks/closures pass; no training/retry occurred in
these continuations. Original [Act IV partial history](../balance/2026-11-03-holy-bolt-act4-checkpoint.md)
and spent limits remain closed. The [target-rank signature priority correction](decisions/P15-intended-holy-bolt-signature-priority-v1.md)
is locally resolved for Act IV; dense Act V throughput and broader acceptance
remain open. Conservative preparation projections exceed existing bounds but
do not prove actual runs cannot fit; no farming was started. It previously [completes Act III](../balance/2026-11-03-holy-bolt-act3-completion.md)
at level47/next675: five first-attempt routes and11quest actions,225admissions/
1,303victories,220training entries, no nonwin/unplayed suffix. First frozen V1
readback and scoped checks verify exact native save/custody/economy/points/
quests/Prayer/party/clocks/seeds/ordinals without replay or gameplay-source edit.
It previously [completes Act II](../balance/2026-11-03-holy-bolt-act2-completion.md)
at level32/next450: all six first-attempt areas and21quest actions. Its final
109admissions/606victories preserve the prior205training counters; cumulative
311 counters represent310 actual admissions. The preceding zero-admission
budget interruption remains spent; V2 amendment and prospective finish V1
readback verify exact native saves/custody/economy/points/quests/party without
combat replay. No gameplay/profile source changed. Remaining acts and full intended
populations/fairness/pacing remain open; formal balance0/210.

Explicitly deferred: cloud save, accounts, PvP/multiplayer/leaderboards,
Capacitor/Tauri packages, advertising and payment/shop systems. Optional sound
or additional generated art cannot displace core repairs. Public distribution
is outside this goal; existing private asset policy remains in force.

An implementation task may split a row into small stories. A row becomes
accepted only with linked implementation, meaningful tests, current evidence
and reviewer/QA verdict. Replacing a failed row with "not needed" requires an
explicit scope decision; do not silently drop systems to make the table green.

F21 update, 2026-11-03: [restore-write worker rejected](../balance/2026-11-03-restore-write-worker-rejected.md)
regresses desktop reload59.36%. Exact preimages restored/new files removed;
214unit passes belong only to the rejected candidate; scoped types/lint failed
and no completed mobile round exists. Closure records early-stop harness failure
and exact cleanup. No retained optimization or release acceptance; BUG592 open.


F08 update, 2026-11-04: Double Throw now [clears earned Act IV](evidence/p15-double-throw-act4-completion.md): three admissions/18 victories, no farming/retry, all Claims, level49/next712 and Act V unlocked. Exact save/accounting readback and closure pass. BUG656 locally resolved; original failed history and wider acceptance remain. Intended five-act count stays3/14 pending Act V; formal0/210.


F08/P15 update, 2026-11-04: [BUG665 preparation adoption](evidence/p15-unprepared-route-continuation.md) is verified locally (30+1 affected cases/five shared guards/scoped types/lint), without native gameplay advancement. Actual Double Throw Act V remains two claimed clears then Crystalline draw, level49/next715; conditional conservative training exceeds original bounds and no farming ran. Full five-act count3/14 and broader acceptance remain unchanged.

F08/P15 update, 2026-11-04: [paid Javelin Impale investment and Chaos706](evidence/p15-javelin-act4-and-owned-weapon.md)
are accounted. BUG667 fixed locally; retained original Diablo comparison wins,
but actual706 draws on sixth pack before Diablo. Exact49/next707; five waves
won/231943XP/45drops/61salvage preserved. V2 full-save/accounting readback passes;
BUG642 pack/mana viability remains Open. Counts14ActI/3Normal/formal0of210 unchanged.


F08/P15 update, 2026-11-04: [fully invested Javelin pair](decisions/P15-intended-javelin-invested-pair-v1.md)
passes35focused cases/scoped strict types/lint. Actual Chaos707 wins seven waves,
claims Terror's End, completes13 Act IV actions and unlocks Act V. Frozen retained-
output accounting/closure pass; exact49/next708/345753XP/64drops/46salvage retained.
BUG642 locally resolved for Act IV only; wider viability remains unverified.
Counts14ActI/3Normal/formal0of210 unchanged. Original failures/costs remain spent.

F08/P15 update,2026-11-04: Javelin clears/claims two Act V areas, then loses
Crystalline710/index2. The adopted partial-route preparation settles200earned
training admissions/1,072victories, reaches62/next911 and stops at the unchanged
per-area limit before the71target. No route retry/new Claim/five-act completion.
First frozen exact accounting/six negative controls pass; original failure and
V1 external-driver setup costs remain. BUG668 locally fixed; fullv1 and wider
pacing/balance remain open. Counts14ActI/3Normal/formal0of210. Required packet
`p15-javelin-prepared-act5-v2` remains root-owned through umbrella review.

F05/F13 update,2026-11-04: [production MF](evidence/p17-real-magic-find.md)
restores ordinary MF and offline amplification with exact491-field data delta,
native settlement and four production locale/device cases. Economy/boss reward
guarantees and wider acceptance remain open; BUG680/681 tracked.14ActI/3Normal/
formal0of210 unchanged.


F05/P17 update,2026-11-04: [equipment guarantees](evidence/p17-equipment-guarantees.md)
verifies additional boss/goblin/mini rarity groups, actual planned levels, real
inventory publication and atomic refusal. Full boss bundles/first-kill rewards
and economy remain open under BUG680; BUG681 remains open. Counts unchanged.


F13/P17 update,2026-11-04: [hourglass SVG](evidence/p17-bonus-hourglass.md)
fixes BUG681 locally on home/HUD. Four actual offline production cases cover
en/zh-CN desktop/mobile, eight captures inspected;12offline units/scoped
types/lint/build checks pass. Disposable outputs cleaned; required failure/final
evidence retained. Full P17/integration and BUG680 boss bundles remain open.
Counts14ActI/3Normal/formal0of210 unchanged.


F05/P17 update,2026-11-04: [exact chapter-boss materials](evidence/p17-boss-material-bundles.md)
verify complete rune/gem quantities, bands, caps, quest isolation and real Diablo
inventory publication.199affected loot/19settlement tests, scoped types/lint and
production/precache pass. BUG680 remains partial for ordinary/jewelry equipment,
optional uniques and first kills; BUG682 stale fixture locally fixed. Counts
14ActI/3Normal/formal0of210 unchanged; no earned/pacing acceptance inferred.


F05/P17 update,2026-11-04: [chapter-boss ordinary groups](evidence/p17-boss-equipment-groups.md)
verify exact4+2/5+3/6+3/7+3/8+4 equipment/jewelry picks with finite terminal-band
eligibility, ordinary MF and native atomic inventory publication. BUG683 fixes
stale historical/current-level test setup without weakening exact assertions.
Scoped checks and isolated production/precache pass; required evidence retained,
exact disposable output removed. BUG680 optional uniques/first kills, economy
and wider acceptance remain open.14ActI/3Normal/formal0of210 unchanged.


F05/P17 update,2026-11-04: [optional boss uniques](evidence/p17-boss-optional-uniques.md)
verify the five chance gates, Andariel's5×MF-aware rarity attempt, weighted
materialized uniques, unchanged preceding rewards, cache/tier isolation and
native atomic inventory publication/refusal.341affected loot/22settlement cases,
scoped types/lint and isolated production/precache/bridge checks pass. Required
failure/final evidence retained; disposable build/config removed and verified.
BUG680 first-kill rewards and wider economy/integration/acceptance remain open.
14ActI/3five-act Normal/formal0of210 unchanged; full privatev1 incomplete.


F05/F08 update,2026-11-04: [chapter-boss first kills](evidence/p17-boss-first-kills.md)
implements all five bonuses once per difficulty/save, exact named branches,
restricted random uniques and Hell Baal rune. Native settlement, save/reload,
repeat/defeat/rollback and direct-helper isolation pass.247affected loot and
89final selected cases pass (overlapping counts); scoped types/explicit lint,
production/precache/ten-chunk bridge checks pass.12source/766build hashes match;
exact disposable output/config removed and verified absent. BUG680 is resolved
locally across guarantees, full boss bundles, optional uniques and first kills.
Full loot/P17/privatev1 acceptance remains open;14ActI/3Normal/formal0of210
unchanged. Root retains required packet/human2 through umbrella review.


F05/F08/P17 update,2026-11-04: [treasure goblin bundle](evidence/p17-treasure-goblin.md)
implements five boss-weight equipment picks plus rare+, independent1–4next-act
runes/5–10actual-act gems and finite122eligibility. Native treasure encounters
retain one authored goblin instead of11–13clones. Whole-bag refusal, concrete
inventory publication and rollback pass.164affected loot/237final selected cases
(overlapping), scoped types/lint, production/precache/13-JS bridge checks pass.
Ten source/766build hashes verified and disposable build/config removed with
absence confirmed. BUG684 resolved locally; full loot/economy/P17/privatev1
acceptance remains open.14ActI/3Normal/formal0of210 unchanged. Root retains
required packet/human2 through umbrella review and owns cleanup/release.


F05 update,2026-11-04: [champion/rare-leader live loot](evidence/p17-nonboss-equipment.md)
closes BUG685 locally. Actual-tier equipment attempts, shifted minima,
independent jewelry, difficulty noDrop and corrected rarity weights apply to
configured sources; MF, actual ilvl, cache/special interpretation and legacy
unconfigured pick/noDrop defaults persist.25focused/30native cases pass;
reviewed award file10passes resolve the sole expected snapshot mismatch from
152other affected passes. Scoped types/explicit lint and isolated production/
precache/13-JS bridge checks pass.12source/766build hashes and exact disposable
cleanup verified. Root retains required packet/human2 through umbrella review;
all processes terminal/no server. Wider miniboss/trash rewards, loot/economy/
pacing and privatev1 remain incomplete;14ActI/3Normal/formal0of210 unchanged.


F05/P17 update,2026-11-04: [live miniboss rewards](evidence/p17-miniboss-equipment.md)
closes BUG686 locally:3ordinary minimum+3equipment draws,1independent jewelry,
existing50%rare+ with finite unshifted source, and distinct3/4/8rarity context.
D10 independent materials/currency, actual ilvl/MF and chapter/goblin/cache
contexts persist.19focused/33native and124affected loot cases pass (overlapping),
as do scoped types/explicit lint and production/precache/13-JS bridge checks.
11source/766build hashes match; exact disposable build/config cleanup verified;
all consumers terminal/no server. Root retains packet/human2 through umbrella
review. Trash rewards, economy/pacing and full privatev1 acceptance remain open;
14ActI/3Normal/formal0of210 unchanged.


F05/P17 update, 2026-11-04: [ordinary-monster equipment](evidence/p17-trash-equipment.md)
closes BUG687 locally. Actual trash uses one unshifted attempt, .6/.5/.4 noDrop
and authored 1/1/1 rarity across configured ordinary aliases with finite
terminal-only eligibility. D10 materials/currency, MF, caches and special
contexts persist. 18 focused/36 native cases pass within 153 affected cases;
scoped types/lint and production/precache/all-13-JS bridge checks pass. Seven
source/766 build hashes and exact disposable cleanup verified. Required packet
and human2 remain root-owned through umbrella review. Full loot/economy/pacing
and private-v1 acceptance remain open; 14 Act I / 3 Normal / formal 0 of 210 unchanged.


F05/P17 update, 2026-11-04: [goblin conditional wishstones](evidence/p17-goblin-wishstones.md)
corrects the boss-context leak to authored 1–3 wishes behind the existing 2.5%
gate. Separate RNG preserves all non-wish rewards/following loot state; caches,
ordinary kills and settlement authority persist. Twelve focused/36 native cases
pass within 160 affected cases; scoped types/four-file lint and isolated
production/precache/all-13-JS checks pass. Six source/766 build hashes verified;
exact disposable build/config removed and confirmed absent. BUG688 resolved
locally, uncommitted; full loot/economy/P17/private-v1 and 14 Act I / 3 Normal /
formal 0 of 210 acceptance remain unchanged.


## 2026-11-04 — Invested Blizzard growth implemented locally

Previous goal turn was status-only/no progress. [Blizzard verification](../balance/2026-11-04-blizzard-investment-growth.md)
implements the new provisional80-per-rank budget from Meteor; only Blizzard8→80
changes in production JSON. Corrected paid-hit RED precedes the final84unique
affected passes, scoped strict types and explicit lint. Original discovery and
ActV penetration-estimate errors are retained; actual enemy inputs have no
resistPenalty. No accepted check repeated after success. All watched inputs
except the exact three expected existing-source edits remain unchanged; one new
combat test added. Required external d2-blizzard-growth-hcw0sxn5 packet retained
by root through umbrella review; check PIDs absent, exact task cache/configs
removed/verified and no remaining disposables/cleanup failures.

BUG643 stays Open at Cold73/next1225; no encounter replay, native admission,
preparation renewal or reward here.14intendedActI/7Normal/formal0of210; privatev1
active/incomplete. No broad checks/build, new agents/install/commit/push/CI or
publication. Browser works/no pending answer or external blocker; extended human
playtest remains after implementation. Next legal native progression needs a
new bounded prospective plan from the genuine successor, preserving closed
training/ordering/equipment budgets; other build/economy/difficulty/app/final
acceptance work remains.


## 2026-11-04 — Druid beast investment growth implemented locally

Previous goal turn was status-only/no progress. Existing human2 ownership was
reverified. [Focused verification](evidence/p15-druid-beast-investment.md) records
BUG708 and the frozen provisional numerical decision before production edits.
Spirit/Dire/Grizzly Attack per skill rank changes2→14/2→18/3→25, matching each
existing owner-level increment. All other production source/data stay exact.
New paid-native regression first fails on all three invested stats; six rank1/
armor controls pass. Final36selected checks pass, including58/178/522ordinary
hits against retained363Defense/50Physical resistance with Heart1. Actual Ajv,
scoped strict types and explicit lint pass. No accepted check/earlier act repeats.
Initial deprecated-cache launcher rejection is retained separately from validRED.

Recursive JSON/source audits prove exactly three production fields, three stale
beast-oracle tables and one new regression. Exact active type config removed;
no task cache/server/browser; check handles terminal. Required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-beast-ranks-uq48qqum`
and human2 remain root-owned through unfinished umbrella review, then root owns
exact evidence cleanup/worktree release. No remaining disposables/cleanup failures.

No campaign admission, new successor, retry/training/farming or renewed closed
order/gear/diagnostic budget. BUG708 stays open for native progression; Summon
Druid49/next717. Latest Cold completion evidence establishes14/14ActI and8/14Normal;
formal balance0/210 and full privatev1 incomplete. Six routes, acquisition/
crafting/economy/pacing, higher difficulties/endgame, PWA/a11y/performance and
independent final acceptance remain. Browser works/no pending answer or external
blocker. Extended human playtest follows implementation. No broad checks/build,
new agents/install/commit/push/CI/publication. Next legal native Druid continuation
requires a prospective bounded plan from this genuine successor, retaining all
prior failures/costs and closed preparation limits.


## 2026-11-04 — Earned Summon Druid Act IV after beast correction

Previous goal turn was status-only/no progress. [Bounded earned continuation](evidence/p15-druid-post-beast-act4.md)
now clears Plains717/first River718/first Chaos719:18/18waves, three Claims,
actual consumed Soulstone/hammer, complete Act IV and Act V unlock. Original
Oak8/Heart1/Prayer and ordinary earned growth/equipment persist. No training,
retry, respec, gear trial, original714–716replay or Act V preparation. All earlier
losses/costs plus measured rejected allocation runtime remain spent.

Helper-only types/lint/no-gameplay preflight pass; no accepted product checks
repeat. Initial external Vite type resolution and readerV1 wrong-domain optional
field errors are retained. Separately pinned readerV2 reconciles frozen outputs
without combat replay, preserving exact map boundary and inventory service state:
ordered item custody, currency/material/634922heroXP/points, party, quests,
clock/seeds/ordinals pass.164new items/93salvaged; Prayer476186XP reconciles.
All2209production/134campaign inputs remain exact. Required external packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-post-beast-30t57dif`
and human2 remain root-owned through unfinished umbrella review, then root owns
exact cleanup/release. All recorded PIDs and exact active config/cache absent;
no remaining disposables/cleanup failures.

Actual successor49/next720; BUG708 stays open for remaining Normal progression.
14/14ActI,8/14Normal/formal0of210unchanged; full privatev1 active/incomplete.
Next Act V needs a prospective bounded plan from this genuine successor; earlier
acts and exhausted experiments stay closed. Six builds, acquisition/crafting/
economy/pacing, higher difficulties/endgame, PWA/a11y/performance and independent
final acceptance remain. Browser works/CI excluded/no pending answer or external
blocker; extended human playtest follows implementation. No broad checks/build,
new agents/install/commit/push/publication.


## 2026-11-04 — Holy Bolt dense-wave order rejected

[Retained comparison](evidence/p15-holy-bolt-dense-order-rejection.md) closes one
control and one candidate at Ancients912wave4 without campaign replay. Complete
control matches946timed events/full result; original expected-result shape error
is preserved and resolved by raw readback. Hammer-first draws with two champions
remaining; no order/profile override is adopted and this allowance stays closed.

Separate readback verifies input invariance, source/campaign manifests, complete
control and both outcomes. All three PIDs/exact caches absent; packet within16MiB,
no remaining disposables/cleanup failures. Root retains required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-holy-dense-order-jx8413u7`
through umbrella review and owns eventual exact cleanup. BUG647 stays open for
dense ActV viability. Actual52/next913;14/14ActI,10/14Normal,formal0/210 unchanged.
Prayer's preceding-wave death is the next investigation; no new gameplay,
production fix or saved equipment mutation yet. Previous status-only turn was
no progress; this closure verifies retained evidence and rejects an unjustified
change. Full privatev1 active/incomplete; wider economy/pacing/difficulty/endgame/
app/final acceptance remain open. No broad checks/build or completed-act replay.
