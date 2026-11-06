# Codex goal execution runbook

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

## 2026-11-05 — Claw acquisition gap implemented

[BUG790](evidence/p15-claw-progression.md) adds49missing ordinary claw rows in23
tables while preserving every original row. Latest91distinct affected cases,
scoped strict types/lint pass; root self-review/local/uncommitted. Evidence packet
retained by root; disposable config removed, no task process/cache remains.
Previous turn was status-only/no progress; this turn changes authoritative content.
Full private-v1 goal stays active: continue attained Act III power/acquisition/
crafting economy and other open gameplay/content, retry/balance/pacing, higher
difficulties/endgame and integrated acceptance. Historical14/14Normal/210contexts/
formal0/210 unchanged; no spent budgets renewed, broad suites or campaign reruns.
Browser works, CI excluded, owner playtest later; no pending question/blocker.

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

Existing human2session claim is revalidated and inherited changes preserved.
Next resolve a finite attainable ActIII power/acquisition policy using current
progression/equipment/currency rules, retaining prefix survival and boss
throughput separately. The one benchmark launch is closed; do not extend it or
renew any older budget. Root retains
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act3-retained-benchmark-v4noerxt`
until full-v1acceptance and all review consumers finish, then exact cleanup.
Continue full scope: gameplay/content, acquisition/economy/30–50active-hour
pacing, higher difficulties/endgame and integrated device/save/PWA/a11y/perf/
soak/independent acceptance. No pending question or external blocker.

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

## 2026-11-05 — Act V champion art closeout

Previous goal turn was status-only/no progress. [BUG780](evidence/p16-act5-champion-artwork.md)
now supplies two attributed local official stills through existing canonical
overrides. Nine affected unit cases, changed-test lint, strict JSON schema and
four actual-screen bilingual mobile/desktop browser cases pass with zero
warnings/errors. No battle, reward, campaign or spent diagnostic renewal.
Original champion-immunity failure stays preserved; this is a new artwork-only
control. Root retains the named packet through full-v1 acceptance; exact
process/port/cache cleanup is recorded. Self-review only. Historical14/14Normal/
210contexts/formal0/210 unchanged; full privatev1 remains active and unfinished.
Continue real gameplay/content gaps and outstanding progression/acquisition/
economy/pacing/difficulty/endgame/integrated acceptance. Browser works; CI
excluded; owner playtest later; no pending question. Keep the existing claimed
worktree and inherited source changes.

## 2026-11-05 — Native retry plans retained before playback

Previous goal turn was a status report/no implementation progress. The existing
human2 worktree/session claim is revalidated and preserved. [BUG779 evidence](evidence/p15-retry-plan-capture.md)
closes missing native retry plan capture: each attempt returns and journals the
installed plan before playback, validates seed/area/count and preserves unreached
waves after loss or native disposal after victory. Two new causal REDs become
GREEN; scoped strict types957files/zero diagnostics and two-file lint pass.
Only constructed controls run, six older cases filtered; all historical budgets
stay closed. Root retains exact `d2-retry-plan-8q3eyxos` under zai-temp through
full-v1 acceptance, then owns cleanup. All commands terminal, task cache removed;
no server/browser/build/CI/new agent/commit/push or pending answer. Review is
root self-review only. Historical14/14Normal/210contexts/formal0/210 unchanged;
full privatev1 remains active/incomplete. Continue population/power/acquisition,
remaining gameplay/economy/pacing/difficulty/endgame and integrated acceptance.

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

## 2026-11-05 — Retry policy snapshot boundary implemented

[BUG778 evidence](evidence/p15-retry-policy-snapshot.md): previous turn was
status-only/no progress. Existing human2 registry/session ownership revalidated;
three new causal controls expose mutable caller/journal references and missing
pre-admission declaration. Complete private request snapshot and detached
publications/action records now pass all three, scoped types and lint. Root
retains the exact named packet with separate readback/source hashes/cleanup;
handles terminal, no disposables or cleanup failures. Spent historical budgets
stay closed; no broad checks/campaigns/samples. Full objective remains active:
choose population and actual build adaptation, then continue remaining gameplay/
economy/pacing and integrated acceptance. Historical 14/14 Normal/210 contexts/
formal 0/210 unchanged; browser works, CI excluded, owner playtest later.

## 2026-11-05 — Manual ordinal source proof; witness allowance closed

[P15 evidence](evidence/p15-manual-ordinal-partition.md): previous turn was
status-only/no progress. Existing human2 ownership revalidated; source inspection
resolves the ordinary manual plan partition without changing native admission.
The one witness launch fails at Vite import/startup before game modules or plans;
retain failure, zero native calls and spent launch budget. No retry or empirical
equality claim. Root retains the named packet, selected source manifest, separate
readback and exact cleanup; no disposables or cleanup failures. Next define
actual population/prefix/pity and legal contiguous adaptation using existing
machinery. Full objective remains active/incomplete; historical 14/14 Normal/
210 contexts/formal 0/210 unchanged. Browser works; CI excluded; owner playtest
later; no user hold. No campaign/sample/retry budget is renewed.

## 2026-11-05 — Checkpoint role-plan coverage closeout

[BUG777 evidence](evidence/p15-checkpoint-role-coverage.md): previous turn was
status-only/no progress. Existing human2 ownership revalidated; this continuation
documents the verified native plan capture and v2 coverage semantics and checks
retained outputs without replay. 22 reporter/two new native cases, scoped strict
types/lint pass; finite budgets remain spent. Root retains the exact packet and
records source/artifact hashes, separate readback and exact PID/path cleanup.
No disposables or cleanup failures; no campaign/sample/retry allowance renewed.
Full objective remains active: historical 14/14 Normal/210 contexts/formal 0/210;
broader power/acquisition/population/adaptation/pacing and integrated acceptance
remain open. Browser works; CI excluded; owner playtest later; no pending answer.

## 2026-11-05 — Retained-power input freeze completed

[P15 evidence](evidence/p15-retained-power-baseline.md): the previous status turn
was no progress. Existing human2 ownership/session revalidated; this increment
writes a prospective policy and generates/verifies all 210 exact context inputs.
183 selected sources and two existing CE preparations preserve original
boundaries, five failures, eleven noncanonical contexts and ancestry/costs.
Generator/separate reader exit 0; 29.727 aggregate seconds, zero gameplay/rolls/
holdout reads. Root retains exact named packet; both PIDs absent, no disposables
or cleanup failures. No production source change, broad checks or renewed budget.
The Act V immunity evidence is also linked from work-plan/feature-coverage,
including its failed artwork-warning browser gate. Next define encounter/
population, ordinal/prefix/pity and three-attempt adaptation boundaries. Broader
power/acquisition/pacing and integrated acceptance remain open. Historical
14/14 Normal/210 contexts/formal 0/210 unchanged; full private v1 stays active.
Browser works; CI excluded; owner playtest later; no pending answer or hold.

## 2026-11-05 — Diablo enrage fixed locally; full-v1 work continues

[BUG753 evidence](evidence/p15-diablo-low-health-enrage.md): native15%HP phase,
speed2/+50% direct damage and localized log feedback implemented.25focused cases,
strict scoped types603files/zero diagnostics and changed-file lint pass. Actual
CombatLog browser diagnostic passes mobile en/zh-CN and desktop zh-CN. Source
review and exact retained evidence/cleanup packet linked. Previous turn was
status-only/no progress; this turn made production progress. No campaign/retry
renewal; historical14/14Normal/210sources/formal0/210 unchanged. Next resume
outstanding boss/progression implementation; no pending user question or CI hold.

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

## 2026-11-05 — Boss poison-status protection closed locally

[BUG750 evidence](evidence/p15-boss-poison-status-immunity.md): native chapter
Poison/Plague/Venom/spread refusal and truthful Venom events pass19new/40existing
affected cases. Final native/types/lint handles44102/96168/37862exit0; original
REDs/type failure retained. Self-review only; root retains exact named packet
through full-v1 acceptance. No task process/browser/cache/disposable remains.
Previous goal turn was status-only/no progress. Next address remaining boss and
progression contracts; elemental100% versus75% remains explicit. No exhausted
run renewal. Fullv1 active: historical14/14Normal,210sources,formal0/210.

## 2026-11-05 — Mephisto correction and accounting closeout

[BUG749 evidence](evidence/p15-mephisto-elemental-signature.md) closes the native
cold/lightning/poison omission and priority starvation. Final8focused/19related
cases, strict scoped types and lint pass; all handles terminal. [Offline pacing
accounting](evidence/p15-recorded-menu-accounting.md) retains the full five-stage
readback with unknown later-act history/kinds and human time explicit. Exact
packet inventories/source snapshots retained by root through full-v1 acceptance;
no disposable processes/cache remain. Previous goal turn collected terminal
failures that determined the typing fixes. Next address remaining boss contracts
and progression gaps without renewing exhausted runs. Full objective remains
active: historical14/14Normal,210sources,formal0/210; browser works, CI excluded,
owner playtest follows implementation, no question pending.

## 2026-11-05 — Periodic provenance closeout

[Evidence](evidence/p15-periodic-damage-provenance.md) closes BUG748 locally.
Final handles 92231/23107/93262 exited 0; distinct affected coverage totals 92
passing cases, scoped strict types and explicit lint pass. Capture is committed
only; fractional carry stays pooled and legacy absence remains unknown. Review
is self-review only. Exact packet remains root-owned through full-v1 acceptance;
no server/browser/cache or disposable artifact remains. Previous goal turn
collected terminal check evidence. Advance progression/acquisition/pacing from
retained results, without renewing spent campaign/sample/retry budgets. Full v1
remains active: historical 14/14 Normal, 210 sources, formal 0/210.

## 2026-11-05 — Druid route-first Act III closeout

[Evidence](evidence/p15-druid-route-first-act3.md) records19admissions/92waves,
level15→18, Great Marsh/Flayer wins and exhausted Kurast Bazaar nonwin. Custody/
HP readbacks and source2253/campaign136file invariance pass; task PIDs/cache
absent. Root retains the exact named packet/inventory through umbrella acceptance
and owns eventual cleanup. No replay or new balance credit. Previous status
turn was no progress; evidence closeout is complete. Fullv1 remains active:
historical14/14Normal,210sources,formal0/210. Next resolve identified reporting/
progression gaps from retained results without renewing spent allowances.

## 2026-11-05 — Later-act route-first measurement implemented

[P15 evidence](evidence/p15-later-act-route-first.md) closes BUG747 locally:
earned first entries precede recovery farming through Acts II–V, with bounded
retries, retained audits and native quest/reward/save accounting. Affected375
cases pass; final focused41/45filtered, strict scoped types990files and lint
pass. No earned campaign or exhausted allowance is replayed. Root retains the
exact named packet through full-v1 acceptance and owns eventual cleanup.
Next address early Fire progression and BUG731 while preserving spent budgets.
Full v1 remains active; historical14/14Normal,210sources,formal0/210 unchanged.

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

## 2026-11-05 — Owned adaptation inspection completed

Previous goal turn was status-only/no progress. Existing human2 registry still
belongs to session01a1577a-5af4-70e3-8699-50a906877d8f. The completed
[no-combat inspection](evidence/p15-act2-caster-summoner-route-first.md) proves
six native owned gear choices and four legal Fire Ball allocations, with exact
save/custody/outer realm restoration and explicit stat tradeoffs. Types888files/
zero diagnostics, lint and one native launch pass. Preserve the failed wrapper,
all native campaign failures/costs and exhausted attempts. No gameplay victory
or balance acceptance follows. Root retains the named caster/summoner packet
through umbrella acceptance, then removes it after consumers finish. Advance
another concrete remaining gap; the uncached artwork provenance manifest has
no runtime caller and does not justify expanding PWA caching. No completed
campaign replay or broad suite. Counts14/14Normal,210/210supplemental sources,
formal0/210; fullv1 and wider acceptance remain incomplete, without user hold.

## 2026-11-05 — Caster/summoner continuations and audit correction

Previous goal turn was status-only/no progress. Existing human2 registry stays
in_use for session01a1577a-5af4-70e3-8699-50a906877d8f; source checkout read-only.
[Completed branches](evidence/p15-act2-caster-summoner-route-first.md) retain
Fire's Dry Hills nonwin and Druid's ActII completion, source ancestry, policies
and actual costs. No completed native run is replayed. BUG741now preserves the
validated selected recovery source in continuation metadata; two RED cases,
173GREEN cases, scoped strict types964files/zero diagnostics and explicit lint
are retained. BUG742's external capacity-aware reader passes corruption controls;
native saves/outcomes unchanged. Original failures stay. This root verification
is not independent final approval. Fire has owned resistance alternatives with
speed/defense/other-resistance costs; current intended growth differs from its
fixed starter plan. Next inspect terminal native gear/points without combat,
preserving exhausted attempts, before deciding any further balance diagnostic.
Retain exact `d2-act2-caster-summoner-p59d92kj` under zai-temp through umbrella
acceptance; root removes after consumers finish. No broad suite, build, new
agent, CI, commit/push or user hold. Counts14/14Normal,210/210supplemental sources,
formal0/210. Fullv1/acquisition/economy/30–50active-hour pacing/difficulty/endgame/
browser/mobile/a11y/performance/PWA/soak/independent acceptance remain incomplete.

## 2026-11-05 — Earned representatives and Double Swing first-entry Act II

Previous goal turn was status-only/no progress. Existing human2 registry/session
01a1577a-5af4-70e3-8699-50a906877d8f remains in_use; preserve inherited changes
and CI removal. [Evidence](evidence/p15-act2-earned-representatives.md) qualifies
three historical Act I sources with no gameplay, then one bounded Swing branch:
11admissions/53waves/52wins/one defeat,13→16,7.22combat minutes. The full parent
120000ms reservation remains; no replay or renewed ancestral allowance. Native
reward/save/recovery and separate pressure readback pass. Duriel32.55s but hero
minimum88.15%HP; BUG731 and active-hour pacing remain open. BUG739/740 fix
external qualification/analysis, original failures retained. Scoped strict types
914files/zero diagnostics and lint/preflight pass;2252production/135campaign
inputs stable. All20receipt-owned PIDs/cache absent, no disposables. Root retains
required `d2-act2-earned-representatives-p_pqjbjf` packet6177566bytes under
zai-temp through full-v1 acceptance, then exact cleanup after consumers finish.
Next map Fire/Druid historical manual preparation/profile and ancestral costs
before bounded first-entry continuations; do not silently replace their builds.
No runtime code edit,broad suite,build,new agent,CI,commit,push or user hold.
Counts14/14Normal,210/210supplemental sources,formal0/210. Full privatev1 remains
active/incomplete, including wider acquisition/economy/30–50active-hour pacing,
difficulty/endgame/app/mobile/a11y/performance/PWA/soak and independent acceptance.
Browser works; owner playtest follows implementation; no pending question.

## 2026-11-04 — Earned Act II attempts precede training

The preceding goal turn was a status report and made no implementation progress.
This continuation completes [route-first evidence](evidence/p15-act2-route-first.md),
corrects a retained analysis that omitted health orbs, closes BUG736–738 locally,
and records self-review of the exact eight-file controller/dispatch/audit change.
The completed native branch is not replayed: 40 admissions, 180 waves, three
defeats, Bow 13 → 17, all five Claims and exact successor ordinal 157 reconcile.
Retained reader v2 and analysis v2 pass with corrupt-evidence controls. Existing
26-case affected recovery results, scoped strict types/lint and CLI syntax are
reused after verifying their code hashes. Duriel takes 32.9 simulated seconds
in one sample; mercenary contribution and 1.49 cumulative combat hours through
Act II warrant further first-entry/pacing work, not population acceptance.

Root retains `d2-act2-route-first-02brsjk1` under zai-temp through umbrella
acceptance, then removes it after consumers finish. The final cleanup receipt
checks exact task processes/cache and retained manifests; no disposables remain.
The existing human2 claim stays with this session. Next qualify a limited earned
melee/caster/summoner set before further BUG731 tuning. Full private v1 remains
active/incomplete: 14/14 Normal completions, 210/210 supplemental source
candidates, formal 0/210. Acquisition/economy/30–50 active-hour pacing, higher
difficulty/endgame, broader app/mobile/a11y/performance/PWA/soak and independent
acceptance remain. Browser works; CI excluded; no user hold, new agent, broad
suite, campaign replay, commit, push or worktree release.

## 2026-11-04 — Charge Attack component verified

The preceding status turn retrieved a terminal passing169-case affected result;
it yielded verification evidence. This continuation fixes test-only type
narrowing and the canonical translation description, then closes BUG735 with
[Charge evidence](evidence/p15-monster-charge-attack.md). Scoped strict types/
four-file lint and desktop/mobile native Chapter Duriel plus early Dark Stalker
probes pass. No broad suite,campaign replay or spent diagnostic screen rerun.
Root reviews exact increment against before-sources; not independent final QA.
The named packet is retained through full-v1 acceptance; browser/server closed,
exact cache/PID absent,no disposable paths remain. Existing human2 claim stays
owned by this session. Next qualify representative first-clear acquisition/
mitigation before further BUG731 tuning. Counts14/14Normal,210/210supplemental
sources,formal0/210; fullv1/wider acceptance remain incomplete. Browser works,
CI excluded,no user hold,new agent,commit,push or worktree release.

## 2026-11-04 — Duriel Freeze verification closed

Previous goal turn was status-only/no progress. This continuation reverified
human2/session ownership and completed [BUG733 evidence](evidence/p15-duriel-freeze-immunity.md):
116 affected tests/scoped strict types/lint and desktop/mobile native playback
pass. Caller audit finds no additional Freeze-reporting defect. One focused
mobile followup captures the actual Chill-only enemy; original screenshot stays.
Exact processes/caches absent, eleven relevant source snapshots pinned; root
retains `d2-duriel-freeze-6ylefvnr` through umbrella acceptance, then exact cleanup.
Full-v1 remains active/incomplete:14/14Normal,210/210supplemental sources,
formal0/210. Next reconcile native Duriel passive Aura cadence, preserving
Frozen Terror's active cold wave, then BUG731 tuning. Wider balance/acquisition/
economy/30–50active-hour pacing/difficulty/endgame/app/PWA/a11y/performance/soak
and independent acceptance remain. No broad suite, campaign replay, new agent,
CI, commit/push or user hold. Worktree claim remains active.

## 2026-11-04 — Completed Act II baseline and Duriel Aura correction

[Cohort screening](evidence/p15-act2-earned-cohort-screen.md) has terminal exit0,
2,400attempts/14,400wave wins, zero deaths or unreached bosses and passing
separate retained-output readback. Twelve earned32builds × manual/idle ×100seeds;
earlier Throw reused separately and actual Bone24/manual adaptation not pooled.
Short medians/cross-build contribution warrant continued BUG731 work. Baseline
predates [BUG732 Aura correction](evidence/p15-duriel-chapter-frost-aura.md), which
restores native chapter Charge+Frost Aura and passes nine focused cases, scoped
strict types/lint and four native-playback desktop/mobile × zh-CN/en browser
checks. Failed diagnostic versions remain. Exact packets named in the evidence
have verified PIDs/caches absent, servers closed and zero cleanup failures; root
retains required evidence through unfinished umbrella acceptance. No process
remains live from these packets. Previous progress-report turn was no progress;
this continuation makes durable records and proceeds to specified missing
Duriel Freeze immunity before encounter tuning. Counts14/14Normal,
supplemental availability210/210, formal balance0/210; fullv1 active/incomplete.
Wider economy/pacing/difficulty/endgame/app/soak/independent acceptance remains.
No new agents, broad checks, CI, user/browser hold, commit, push or release.

## 2026-11-04 — Double Throw repeat-source supplement qualified

[Supplement evidence](evidence/p15-throw-repeat-source-supplement.md) closes two
candidate-availability gaps under the prospective intended-lineage policy,
without changing historical208/210selection or old sources/failures/costs.
Two current decodes/four descriptors and separate output readback pass;210-key
availability manifest reconciles121+73+11+3+2contexts. Exact counters452/677,
different actual power/provenance and original641/709remain explicit. No combat,
reward roll, holdout read, source mutation, replay or broad check occurs.
All2248production inputs/eight helper contracts stable. Counts14/14Normal,
supplemental availability210/210, formal balance0/210; fullv1active/incomplete.
Required `d2-throw-repeat-lineage-xoa_b7f2` packet (about2MB,8MiBcap) stays under
zai-temp with root through umbrella acceptance, then exact cleanup; human2
remains claimed. Native/wrapper PIDs/cache absent, server closed, no remaining
disposables/failures. Previous goal turn was status-only/no progress; this turn
qualifies evidence. Next freeze actual power/acquisition/adaptation and encounter/
ordinal/carry/pity populations before screening. Wider economy/pacing/difficulty/
endgame/app/PWA/device/a11y/performance/soak/independent acceptance remains open.
No new agents, CI, user/browser hold, commit or push; owner playtest follows
implementation.

## 2026-11-04 — Partial population reporter implemented and exercised

[Population report evidence](evidence/p15-checkpoint-population-report.md) records
a pure exact-cell summary with partial/missing seeds, nonwins, unreached roles,
separate victory/failure times, Wilson intervals and actual prefix yields.
Fifteen reporter cases/23 fixture cases, scoped strict types/lint and separate
retained-output readback pass. One 1.299s report reconciles sixteen old attempts,
11clears/5failures,81waves and1,071,337XP without new gameplay or holdout reads.
Four failed boss contexts stay unreached; cells are never pooled for a rate.
The expected red test and initial external config type-resolution failure are
retained. All2,248source inputs stable/current; runtime game bytes unchanged.

Previous goal turn was a status report/no progress; this increment implements
and verifies reporting code. Exact packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-population-aarumrvq`
remains with root through unfinished umbrella acceptance; root then removes it
after consumers finish. Both bundles removed/config archived and deleted, no
server/cache or remaining disposable, cleanup passes. Human2 stays claimed.
Counts14/14Normal,208/210source availability,formal0/210. Next resolve Double Throw
II/III repeat sources and freeze power/acquisition/adaptation/ordinal/carry/pity
before screening; broader economy/pacing/difficulty/endgame/app/PWA/device/a11y/
performance/soak/independent acceptance remain. Full privatev1 active/incomplete.
Browser works/CI excluded/no pending question or user hold. No new agent,
campaign replay, broad suite, build, install, commit or push.

## 2026-11-04 — Repeat-state sources qualified without campaign replay

[Earned repeat-source evidence](evidence/p15-earned-repeat-source-pairing.md)
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

Previous goal turn was status-only/no progress. This continuation ran the pending
two-source native preflight and qualified its retained output before advancing.


## 2026-11-04 — Two corpse pack preparations and paired benchmarks qualified

[P15 pack-order evidence](evidence/p15-corpse-pack-order-benchmark.md) records two
native learned-order-only exports and four seed-1 manual/idle benchmarks: 24
wave victories, zero nonwins and 90 CE casts with actual target-role damage.
Retained-output verification reconciles exact preparation, complete final saves,
XP/reward/item custody, finite corpses, RNG and combat equality. Exact idle pity
presentation differs as recorded. Initial zero-gameplay preflight spend and two
failed readers remain; no allowance reset or gameplay replay. Eight helper
contracts match earlier before/after manifests and current closure, while this
external driver's missing contemporaneous contract manifests remain a limitation
for future population work. Native PIDs/caches are absent; root retains both
exact packets named in the evidence through umbrella acceptance, then cleans
them. No broad suite, build, completed-campaign replay or new agent.

The subsequent status-only goal turn was no progress. This continuation checks
the retained results and records the completed increment before advancing the
89 earned-repeat pairing contexts. Seven whole-area boss starts, actual
power/acquisition/adaptation, current ordinal/carry and pity population freeze
remain. Counts **14/14 intended Normal, formal balance 0/210**; full private v1
and wider acceptance remain incomplete. No pending question or external hold.

## 2026-11-04 — Reuse inventory complete; exact remaining freeze tasks identified

[P15 source reuse](evidence/p15-checkpoint-source-reuse.md) verifies157full-file/
embedded-save hashes across210role candidates and70build/act combinations.
All157current production decodes and210descriptor/act-gate checks pass; separate
retained-output/source/journal/manifest review passes. Native15.753seconds,
inventory18.966seconds; no gameplay, campaign replay, build or broad tests.
121contexts have target clears;89require actual earned repeat-state pairing or
first-clear treatment. Two Necromancer corpse Act V pack orders still omit
learned CE; preserve them and prepare explicit native pack orders. Seven boss
whole-area starts remain. Freeze actual power/acquisition/adaptation, current
ordinal/target/prefix carry and idle pity populations before bounded sampling.
Current source deltas prevent reusing old outcome screens as current acceptance.
Do not rebuild the inventory or replay campaigns. Native PID4186483/cache absent;
root retains exact `d2-checkpoint-reuse-_wosx5mr` through umbrella acceptance,
then exact cleanup. Previous goal turn was status-only/no progress; this turn
qualifies reusable current inputs and narrows required work. Counts14/14Normal,
formal0/210; fullv1/wider acceptance incomplete, no user/browser/CI hold.

## 2026-11-04 — Native checkpoint measurement ready for fixture freeze

[P15 runner evidence](evidence/p15-checkpoint-balance-runner.md) records v3
fixture validation, exact saved-domain hydration and one explicit native area
attempt with source/contract identity, RNG streams, actual rewards/nonwins and
fsynced partial journals. 28 focused tests, scoped strict types/lint and one
separately budgeted CLI control pass. All six constructed starts/nonwins remain.
BUG728 reader correction passes over retained outputs; flawed V1 and failed V2
draft remain. No gameplay rerun, completed-campaign replay or production edit.
Active compiler config is archived; exact native PID/caches are absent, no
cleanup failure. Root retains `d2-checkpoint-balance-l9jm0h4c` through umbrella
acceptance and owns eventual exact cleanup. Previous goal turn was status-only/
no progress; this turn repairs verification and records the implemented runner.
Counts **14/14 intended Normal, formal0/210** unchanged; next inventory earned
saves/freeze 70 build/act and 210 encounter populations with prospective budgets.
Full privatev1/wider acceptance remain open. No user/browser/CI hold or new agent.

## 2026-11-04 — All intended builds complete Normal

[Zeal completion evidence](evidence/p15-zeal-earned-normal-completion.md)
qualifies the remaining intended Normal route: level 82 / next ordinal 1168,
five first-attempt route victories, all 19 actions/five claims, Baal title and
Nightmare unlock. The bounded native continuation wins 1,644 waves in 261
admissions. First-pass retained-output accounting passes without gameplay replay.
All earlier failures and costs remain. Eight recorded PIDs and exact task
disposables are absent; the required packet is retained by root through umbrella
acceptance, then exact cleanup. No production edit or broad suite was needed.

Counts are **14/14 Act I, 14/14 intended Normal, formal balance 0/210**.
The preceding status-only goal turn was no progress; this turn advances and
qualifies earned state. Wider balance/economy/pacing/difficulty/endgame/app/soak
and independent acceptance remain open. Full private v1 remains active and
incomplete; no browser, CI or user-answer hold.

## 2026-11-04 — Zeal remaining Act IV qualified

[P15 native evidence](evidence/p15-zeal-earned-act4-completion.md): River and
Chaos first-attempt victories,192admissions/1027wins, both Claims, exact61/907
successor. V3 local readback passes complete ordered custody/economy/XP/points/
quest/save/clock/source/restoration without replay; BUG726 report-shape and
BUG727 legacy-XP-coordinate reader errors and failed frozen versions remain.
Prayer consumes its saved threshold before current curve;19860576XP credited.
Cumulative907admissions/47030040.0459625combatms/880988.58088driverms/
948511.624029139executionms; original controller/history/aggregate unchanged.
Root retains exact `d2-zeal-act4-remaining-g9z4__7p` through umbrella acceptance,
then cleanup. Recorded PIDs/cache/active config absent, config archived, no
cleanup failures. Counts14/14ActI,13/14Normal,formal0/210. Next bounded Act V
from qualified61/907; fullv1 and wider acceptance remain incomplete. Previous
goal turn polled the prior reader to terminal failure and diagnosed its contract;
this turn repairs local verification and qualifies authoritative earned state.
No production edit, new agents, broad suite, CI or user/browser hold.


## 2026-11-04 — Zeal earns its post-Might Izual clear

[Qualified native evidence](evidence/p15-zeal-might-earned-izual.md): one paid
ordinal714 admission wins all five waves, claims Fallen Angel and exports49/715.
Frozen first-pass readback reconciles rewards/custody/XP/points/quest/native save/
clock/source/restoration. Source comparison reuses the failed original control
after a separate reader proves652exact non-cadence events/full parties and
validates30known added cadence observations. One fixed-code candidate wins55.4s;
original failed plan remains. Real successor uses normal native seed, no training
or gear/point/order/aura change. It is the fourth counted Izual attempt; original
three draws/28training admissions, closed gear study and all cumulative costs
remain. Original aggregate unchanged, no controller reset or prior-route replay.

Root retains required `d2-zeal-might-postfix-hno4ca2a` and
`d2-zeal-might-earned-6c6vwozq` through unfinished umbrella acceptance, then exact
cleanup/release. All four recorded runtime PIDs/caches/active compiler configs
are absent; configs archived and cleanup failures[]. Previous goal turn was
status-only/no progress; this turn qualifies evidence and actual progression.
Counts14/14ActI,13/14Normal,formal0/210 unchanged. Remaining Act IV/V, wider
economy/pacing/difficulty/endgame/app/soak and independent acceptance remain.
Next freeze remaining Act IV from exact49/715 carrying all spent history.
Full privatev1 active/incomplete; no broad suite/build/agents/CI/user hold.

## 2026-11-04 — Might Attack omission fixed and verified locally

[BUG725 evidence](evidence/p15-might-attack-component.md): the shared explicit
Attack-component boundary now consumes eligible Might Attack as well as its
existing physical increase. Genuine final RED19/26fails; unchanged regression
then passes with all126affected cases. Scoped strict types/lint and seven native
constructed Chromium checks pass, without tuning/profile/save changes. Browser
PID4164144/port5173/cache/config are absent; config archived and no cleanup failure.
Root retains required `d2-might-attack-component-_vrzk0bi` through umbrella
acceptance, then exact cleanup/release. Previous goal turn was status-only/no
progress; this turn changes production/evidence. No campaign admission/replay,
budget renewal or earned victory: counts14/14ActI,13/14Normal,formal0/210 remain.
Zeal49/next714, all three Izual draws and rejected weapon study remain historical.
Next freeze a bounded post-fix evaluation with explicit original/spent costs.
Full privatev1 active/incomplete; wider acceptance remains, no user/browser/CI hold.

## 2026-11-04 — Fresh observed Double Swing completes Normal

[Fresh-lineage evidence](evidence/p15-swing-fresh-observed-lineage.md) now
qualifies all five acts at level 82 / next 1174. Act V adds 261 admissions /
1,644 victories / zero nonwins, all 19 quest actions/five Claims, consumed
potion/scroll, Baal title and Nightmare unlock. A separate streaming retained-
output reader passes on its first attempt: native save/export equality, awards,
custody, paid salvage, balances, hero/mercenary XP, allocations, source hashes and
realm/clock restoration reconcile. Root's reader is not independent final QA.
All 2,240 production / 135 campaign / 15 launch inputs authenticate unchanged.
Four recorded process IDs, exact cache and archived compiler config are absent;
stderr/types log empty, packet 65,903,342 bytes within cap, no cleanup failures.
Root retains required `d2-swing-fresh-act5-k3r4370u` and its four predecessor
packets through umbrella acceptance, then owns exact cleanup/release.

All prior failures and spent allowances remain; cumulative costs are 1,174
admissions / 45,718,552.299307644 combat ms / 799,881.044172 driver ms, with
1,260,000 reserved execution ms. This is not human active-time measurement or
all-area/population certification. Counts **14/14 Act I, 13/14 intended Normal,
formal 0/210**. Zeal and wider economy/pacing/difficulty/endgame/app/soak and
independent acceptance remain; full private v1 stays active/incomplete. The
previous goal turn is a verified wait: exact native PIDs were observed live.
This turn qualifies their terminal result. No production edit, campaign replay,
broad suite, pending user answer or browser/CI hold.

## 2026-11-04 — Fresh observed Double Swing reaches earned Act II successor

[Fresh-lineage evidence](evidence/p15-swing-fresh-observed-lineage.md) now
qualifies Act II: one exact native continuation, 346 admissions / 1,740 wins /
zero nonwins, level32/next464, five once-only Claims. Separate streaming reward,
custody, paid salvage/socket, XP, save, clock and source readback passes. The
first reader's freeze/launch Git-status mismatch is retained and resolved to
this evidence document only; production/campaign hashes remain exact. Native
processes/cache are absent; the disposable config is archived and removed.
Root retains required `d2-swing-fresh-act2-v6mdv7fz` through umbrella acceptance,
then exact cleanup. The preceding goal turn was a verified wait on live handle
73183; this turn qualifies its terminal successor and prepares Act III only.
All spent costs/allowances and historical failures remain. No production edit,
completed-act route replay or broad suite. Counts14/14ActI,12/14Normal,formal0/210;
full privatev1 active/incomplete. No browser/CI/user hold.

## 2026-11-04 — Fresh observed Double Swing Act I prefix

[Fresh-lineage evidence](evidence/p15-swing-fresh-observed-lineage.md) records
one native fresh Act I run: 118 admissions, 354 victorious waves/one defeat,
level13/next118. The paid recovery at107–116 and retry117 are retained. Separate
save/journal/reward/custody/salvage/XP/clock/source readback passes; two reader
corrections remain disclosed. Required `d2-swing-fresh-mnmdutu3` is retained by
root through umbrella acceptance, then exact cleanup; parent/child and cache
are absent. A bounded Act II continuation is being prepared from that exact
export; no historical allowance is renewed. Counts14/14ActI,12/14Normal,
formal0/210 remain. Full privatev1 active/incomplete; wider acceptance remains.
The preceding status turn was no progress; this turn qualifies a fresh checkpoint.
No browser/CI/user hold; no campaign replay, production edit or broad suite.

## 2026-11-04 — Terminal campaign capture precedes validation

[P15 capture evidence](evidence/p15-campaign-terminal-capture.md) locally
resolves BUG723: one exact native checkpoint reaches the recorder before
decode/equality checks can fail. Technical failure, independent recorder-error
audits and complete realm/clock restoration remain. Two original-logic REDs,
all37affected dispatch/journal cases, scoped strict types and explicit lint pass.
BUG724 corrects four strict continuation expectations after saved pre-change
sources independently reproduce their failures. Original test/config/lint and
cleanup failures are retained; final checks and exact cleanup pass. All2110src
files remain exact; only two diagnostic TS files change. Root retains required
`d2-campaign-capture-4gwv8cir` through umbrella acceptance, then exact cleanup.
Previous goal turn was status-only/no progress; this turn changes authoritative
code/evidence. No campaign admission or original budget renewal; Double Swing's
missing export remains historical. Counts14/14ActI,12/14Normal,formal0/210.
Full privatev1 active/incomplete; Zeal/earned Double Swing, wider economy/time,
difficulty/endgame/app/soak and independent acceptance remain. A prospective
fresh sample still needs a frozen plan before launch. Browser works/CI excluded;
no pending user answer or external hold.

## 2026-11-04 — Background recovery verified; fresh-profile locale defect found

[P16/P17 evidence](evidence/p16-background-image-recovery.md) locally resolves
BUG721 in Home/Town through existing GameImage. 19 affected cases, scoped
types/lint and eight qualified bilingual mobile/desktop browser cases pass.
Initial selector/locale-label errors remain disclosed; independent BUG722
reproduction identifies the next concrete settings fix. All handles terminal,
four exact caches removed, port closed; root retains the required
`d2-background-recovery-ud6mbopw` packet through umbrella acceptance, then exact
cleanup. Previous turn was status-only/no progress; this turn implements and
verifies source changes. Counts14/14ActI,12/14Normal,formal0/210 unchanged.
Full private v1 stays active; wider build/economy/pacing/difficulty/app/soak and
independent acceptance remain open. No campaign replay or browser/CI/user hold.

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

## 2026-11-04 — Double Swing verifier and forward diagnostic

[Verifier/forward evidence](evidence/p15-swing-verifier-forward-diagnostic.md)
locally resolves BUG669's future capture helper: three original-logic REDs,
three corrected passes, scoped strict types and final two-file lint. Original
missing export remains historical; no original preparation actions are repeated.
Separately capped native diagnostics win18 Act IV and33 Act V waves at711–718.
Actual successor50/next719 has all main Claims, consumed sources, Baal title and
Nightmare unlock, retaining reconstructed ancestry and no earned-completion
credit. Raw journal/economy/quest/point readers and2,230 production/134 campaign
source checks pass. BUG659 stays open for earned acceptance; no damage tuning
is justified by this diagnostic. Owned sessions terminal, three caches and active
configs absent; root retains required d2-swing-verifier-iialnz8z/human2 through
umbrella review, then exact cleanup/release. Previous turn status-only/no progress;
this turn adds diagnostic evidence. **14/14 Act I;10/14 Normal;formal0/210.**
Four builds and wider economy/pacing/difficulty/endgame/app/soak/independent
acceptance remain. Full private v1 stays active; no pending user/browser hold.

## 2026-11-04 — Bulk discard protects crafting investments

[BUG715 protection](evidence/p16-bulk-crafting-protection.md) now preserves
runewords and inserted rune/gem investments through one engine policy shared by
selectors/counts/current-state deletion.42affected cases plus two selected
ownership guards, scoped types/eight-file lint and four real Chromium en/zh-CN
desktop/mobile flows pass. Constructed inventory only; no earned crafting or
campaign credit. Failed tooling/fixture attempts retained; owned sessions
terminal, cache/configs removed and three ports closed. Root retains required
d2-bulk-crafting-vcjlegqj/human2 through umbrella review, then exact cleanup/release.
Previous turn was status-only/no progress. **14/14ActI;10/14Normal;formal0/210.**
Four builds and wider economy/pacing/difficulty/endgame/app/soak/independent
acceptance remain. Full privatev1 active/incomplete; no pending user/browser hold.

## 2026-11-04 — Joint direct recipe acquisition verified locally

[Joint recipe acquisition](evidence/p15-joint-recipe-acquisition.md) adds capped
joint inventories for seven authored demands across eight fixed Normal/manual
plans: 65 contexts / 380 planned spawns / 56 distributions through 128 clears.
Exclusive identities, repeated runes, native boss/goblin quantity mixtures and
live TC quantities are retained. Five distinct affected cases, scoped strict
types and explicit two-file lint pass. Separate tuple-state readback reproduces
all 7,168 CDF points/quantiles/restricted means and checks source/catalog identity;
all 2,100 production files remain exact. Failed attempts are retained. No earned
campaign, full affordability, pacing or formal acceptance credit. Owned tool
sessions terminal; scoped config archived/removed. Root retains required packet
d2-joint-recipe-budget-q_0bs97f/human2 through unfinished umbrella review, then
owns exact cleanup/release. Previous turn made progress; ownership revalidated.
**14/14 Act I; 10/14 Normal; formal 0/210.** Four intended builds, actual
all-source channels/sinks and encounter/time policies, wider difficulty/endgame,
app/performance/soak and independent acceptance remain. Full private v1 active.

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

## 2026-11-04 — Holy Bolt offensive aura and earned Act V frontier

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

## 2026-11-04 — Martial Assassin earned Normal completion

Previous goal turn was status-only/no progress. Human2 ownership revalidated;
[the earned Martial route](evidence/p15-martial-cobra-normal-completion.md) now
has complete raw journal/economy/quest/point readback and custody closure.
One actual free skill reset56ranks/allowance3→2 raises Cobra6→12 and removes
inherited Web, retaining gear/Prayer. Corrective Plains709 and first River710/
Chaos711 win18waves; first Act V712–716 wins33. All Claims,19 Act V actions,
consumed quest graph, earned points, Baal title and Nightmare unlock reconcile
with actual level50/next717/Cobra17. BUG652 locally resolved for intended Normal;
BUG713 gains earned-route validation. Original floating-sum reader failure and
correction retained; no combat replay. All2,223 production/134 campaign inputs
stable. All14PIDs/four caches/config absent; required packet and human2 retained
by root through unfinished umbrella review, then exact cleanup/release.

**14/14ActI;10/14Normal;formal0/210.** Continue Holy Bolt,Zeal,Double Swing,Javelin
and wider economy/pacing/difficulty/endgame/app/independent acceptance. Full
privatev1 active/incomplete. No broad checks/build, renewed closed diagnostic,
new agent/install/CI/commit/push/publication or pending question/browser blocker.

## 2026-11-04 — Canonical socket validation optimization

[Socket validation optimization](evidence/p16-socket-validation-performance.md)
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

## 2026-11-04 — Summon Druid earned Normal completion

[Summon Druid completes Normal](evidence/p15-druid-heart-normal-completion.md):
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

## 2026-11-04 — Late Summon Druid Heart allocation corrected locally

Previous goal turn was status-only/no progress. Owned human2 revalidated;
[BUG711 allocation correction](evidence/p15-druid-late-heart-investment.md) adds
one Heart20 target from40 after Grizzly20/Dire10. All earlier targets and native
spending semantics stay exact. Three corrected pre-edit REDs, six selected
growth/reset/registry GREENs, scoped types/explicit lint and separate structural/
production/source readback pass. Initial fixture oracle errors retained. Native
reset in a supplied-XP fixture spends one free allowance, zero currency; the
actual50/next724 save remains exact. No earned reset/admission or viability claim.

Five recorded PIDs/config absent; no server or task cache. Root retains required
d2-druid-heart-growth-k00gaj2z/human2 through unfinished umbrella review, then
owns exact cleanup/release. Self-review is not independent acceptance.14ActI/
8Normal/formal0of210 unchanged; BUG708 and full privatev1 active/incomplete.
Next qualify explicit native earned preparation using the actual available
reset allowance before any separately bounded progression trial. Closed gear/
order/training budgets stay closed. Wider economy/pacing/difficulty/endgame/app/
final acceptance remains open. No broad checks/build, agents/install/CI/commit/
push/publication or pending question/browser blocker.

## 2026-11-04 — Mixed TC reward budgets complete locally

Previous goal turn was status-only/no progress. Owned human2 revalidated;
[the pending mixed-source component](evidence/p15-mixed-tc-budgets.md) now closes
21 live contexts/697 positive intervals with twelve cached ordinary material
profiles, preserving native residual coupling and distinct source channels.
Three focused cases/scoped strict types/final explicit two-file lint pass;
separate raw arithmetic and source readback pass. Initial lint warning corrected
with an explicit fixture guard; pre-correction report bytes preserved and linked.
All 2,100 production files unchanged. No total affordability/pacing/campaign credit.

Six check PIDs/config/cache absent; required d2-mixed-tc-budgets-m65ayep9/human2
retained by root through unfinished umbrella review, then exact cleanup/release.
Root self-review is not independent QA. 14 Act I / 8 Normal / formal 0 of 210
unchanged. Full private v1 remains active/incomplete. Continue unresolved build
mechanics and broader source/economy/difficulty/endgame/app acceptance. Closed
trials stay closed; no broad checks/build, new agents/install/CI/commit/push/
publication, pending answer or browser blocker.

## 2026-11-04 — Equipment source census and conditional salvage complete locally

Previous goal turn was status-only/no progress. Owned human2 revalidated;
[the unfinished diagnostic](evidence/p15-equipment-source-budget.md) now closes
810 native reward contexts/987 TC calls across 29 areas. 21 live mixed sources
remain; three empty low-level champion sources agree with accepted D08.
All 1,606 sampled items reconcile with 11,169 native salvage scrap in constructed
inventories, without earned-income credit. Three distinct focused cases,
scoped strict types/two-file lint and separate raw-data arithmetic/2,221 manifest
hashes/all 2,100 unchanged production hashes pass. Initial default-count and
readback-field errors corrected; already-passing cases not repeated.

Five recorded PIDs/two disposables absent, config archived, no server or cleanup
failure. Root retains d2-equipment-source-budget-udv4g3ke/human2 through umbrella
review, then owns exact cleanup/release. Root self-review is not independent QA.
14 Act I / 8 Normal / formal 0 of 210 unchanged; full private v1 active/incomplete.
Next measure the 21 mixed material/currency contexts before combining sources
and demand. Six build routes and wider economy/pacing/difficulty/endgame/app/
independent acceptance remain open. No agents/install/CI/commit/push/publication,
campaign replay, broad tests/build, pending question or browser blocker.

## 2026-11-04 — Equipment keyboard fix complete locally

Previous goal turn was status-only/no progress. Owned human2 revalidated;
[BUG710 correction](evidence/p16-equipment-keyboard.md) now passes all 24 distinct
affected unit cases, scoped strict types and explicit fourteen-file lint.
Native public browser controls in both languages verify independent actions,
Tab order and full-backpack refusal; 44 layouts and exact unchanged gameplay
exports pass at ordinal 908. Initial selector/config/fixture failures are retained
and corrected. No completed-act replay or broad suite/build. Root self-review
is not independent acceptance; source browser is not production PWA evidence.

All 23 recorded PIDs and four exact disposable paths are absent. Required packet
`d2-equipment-keyboard-8bv07la4` and human2 remain owned by root through unfinished
umbrella review, then root owns exact cleanup/release. Counts remain 14 Act I /
8 Normal / formal 0 of 210. Full private v1 remains active/incomplete: six builds,
source/equipment availability and earned economy/pacing, higher difficulties/
endgame, app and independent acceptance remain open. No new agents, install,
CI, commit, push, publication, pending answer or browser blocker.

## 2026-11-04 — Special material budgets and recipe demand complete locally

Previous goal turn was status-only/no progress. Owned human2 revalidated; resumed
and completed [the unfinished source/demand diagnostic](evidence/p15-special-material-budgets.md).
30boss/goblin contexts/746positive intervals, four once-only sources/35positive
intervals,98recipes and35runewords preserve native rewards and direct costs.
The catalog's existing GREEN is retained; only three remaining cases run and pass
(~2.4s), alongside scoped strict types/two-file lint and separate Python arithmetic,
raw-definition,2,218source-hash/nine-unchanged-authority readback. No gameplay edit,
native crafting action, farming/replay, broad test/build or campaign/balance credit.
Bundle replacement and once-only eligibility remain explicit; no total acquisition,
affordability or pacing claim. Root self-review is not independent acceptance.

Five recorded check PIDs/three exact disposables absent; required
`d2-special-material-budgets-2v7rek4h` and human2 retained by root through unfinished
umbrella review, then root owns exact cleanup/release.14ActI/8Normal/formal0of210
unchanged; full privatev1 active/incomplete. Remaining source channels, earned
affordability/pacing, six build routes and broader difficulty/endgame/app/final
acceptance remain open. Closed trials stay closed. No agents/install/CI/commit/
push/publication or pending question/browser blocker; human playtest follows
implementation. Continue the remaining source/equipment availability budgets
before drawing affordability conclusions, and resolve outstanding build mechanics
through explicit design contracts rather than reopening exhausted trials.

## 2026-11-04 — Independent material acquisition numeric component complete

Previous goal turn was status-only/no progress. Owned human2 revalidated; completed
[the production-backed measurement](evidence/p15-independent-material-acquisition.md)
without a sampler refactor or gameplay edit.105contexts/7,140entries,3,923positive
intervals have exact uniform32-bit grid mass; waiting kills explicitly assume IID.
Native interval/neighbour checks and independent ActI arithmetic pass in three
focused cases (~1.9s); source/partition/all-waiting-quantile readback, scoped strict
types and explicit two-file lint pass. Original unsupported-cache flag/ignored-lint
attempt retained and corrected. Special bundles/TC/quest/crafting/endgame/FindItem
sources are excluded; no total acquisition, hours, affordability or tuning claim.

Six recorded check PIDs/three disposable paths absent; required
`d2-material-acquisition-bxx01sf0`/human2 retained by root through umbrella review,
then exact cleanup/release owned by root. No gameplay, farming, completed-act
replay, broad tests/build, new agents/install/CI/commit/push/publication.14ActI/
8Normal/formal0of210 unchanged; full privatev1 active/incomplete. Next acquisition
work must combine the other native material sources and recipe sinks with this
component and existing observed-source accounting before pacing conclusions.
Six build routes and wider difficulty/endgame/app/independent acceptance remain;
closed trials stay closed. Browser works/no pending question.

## 2026-11-04 — Runeword effect guide closed locally

Previous goal turn was status-only/no implementation progress. Completed
[the effects guide](evidence/p12b-runeword-effect-guide.md): authored word bonus
stats and reviewed equipped grants now appear before insertion, with exact units,
active payments and healing conditions. Shared formatter extraction preserves
the tooltip's validated-item path. Four pre-edit RED cases become green;
48distinct affected cases/scoped strict types/explicit lint pass. Initial
test-label error retained/corrected, only two failed cases rerun. Native public
import verifies24bilingual effect observations/all10grant families plus Steel/
Spirit,16new-effect layouts and unchanged gameplay exports at ordinal908.

Server closes; three recorded PIDs/three exact disposables absent, no cleanup
failures. Root retains d2-runeword-effects-a2r6r4cv and human2 through unfinished
umbrella review, then owns exact cleanup/release. No economic action/combat,
campaign credit, earlier-act replay, broad checks/build, new agents/install/CI/
commit/push/publication.14ActI/8Normal/formal0of210 unchanged; full privatev1
active/incomplete. Six build routes, acquisition/crafting/economy/pacing, higher
difficulties/endgame, app and independent acceptance remain open. No pending
question/browser blocker; human extended playtest follows implementation.

## 2026-11-04 — Runeword recipe guide closed locally

Previous goal turn retrieved terminal12-case GREEN evidence and reported status;
this continuation completes [the recipe guide](evidence/p12b-runeword-recipe-guide.md)
verification and mobile refinement.14 selected panel/target cases, scoped strict
types/three-file lint, native public-import browsing of all35 recipes in both
languages and eight viewport sizes pass. Repeated totals/base alternatives,
keyboard operation and exact unchanged gameplay exports reconcile at ordinal908.
Initial external-helper CWD/CSS failure is corrected and retained. Screenshot
review motivates only a column-width change; layout-only follow-up passes.

All15 recorded PIDs/three disposables absent, no cleanup failures. Root retains
`d2-runeword-guide-ot154aur` and human2 through unfinished umbrella review, then
owns exact cleanup/release. No campaign, training, crafting actions, earlier-act
replay, broad checks/build, new agents/install/CI/commit/push/publication. Counts
14ActI/8Normal/formal0of210 unchanged. Full privatev1 active/incomplete: six build
routes, acquisition/crafting/economy/pacing, higher difficulties/endgame, app and
independent acceptance remain open. No pending question/external browser blocker;
extended human playtesting follows implementation.

## 2026-11-04 — Tooltip artwork recovery closed locally

Previous goal turn was status-only/no progress. [BUG707](evidence/p16-tooltip-art-recovery.md)
now has legitimate RED→12affected GREEN cases, scoped types/two-file lint and
four native source-component browser observations. GameImage reuse fixes the
tooltip bypass; same URL/fitting/details/earned fixture remain exact. Initial
harness/fixture failures retained;20PIDs/seven disposables absent. Root retains
`d2-tooltip-recovery-ah2ykrm1` and human2 through umbrella review, then owns exact
cleanup/release. No repeated shared-image/completed-act checks or new campaign
credit;14ActI/8Normal/formal0of210. Full privatev1 stays active/incomplete; six
build routes and broader item/economy/pacing/difficulty/app/final acceptance open.
No pending answer/browser blocker; only affected checks, no agents/install/CI/
commit/push/publication. Human extended playtesting follows implementation.

## 2026-11-04 — Cold completion closed; six intended builds remain

Previous goal turn was status-only/no progress. [Cold continuation](evidence/p15-cold-post-blizzard-act5.md)
now closes actual Ancients1225/Throne1226:15victories,74/next1227, all19ActV
actions/five main claims, saved rewards, Baal title and Nightmare unlock exact.
Route/merc readers and scoped driver checks pass; prior84Blizzard cases were not
repeated. Failed merc-XP supplement is preserved and corrected for quest sharing.
Five historical launcher costs omitted from the frozen predecessor carry are
added once separately; cumulative execution1,052,000.356695149ms stays bounded.
No farming/training/extra retry, earlier-act replay or renewed closed budgets.

All14recorded PID checks, cache/config/draft absence and cleanup pass. Root
retains d2-cold-post-blizzard-jjevk1ng and human2 through umbrella review, then
owns exact cleanup/release. BUG643 locally resolved for intended progression;
population/holdout/fairness/pacing and independent acceptance remain open.
Counts14ActI/**8Normal**/formal0of210; full privatev1 active/incomplete. Continue
Holy Bolt, Zeal, Double Swing, Summon Druid, Martial Assassin, Javelin Amazon
and broader item/economy/difficulty/app requirements. No pending answer/browser
blocker. Only affected checks; no new agents/install/commit/push/CI/publication.

## 2026-11-04 — Shared runeword item names corrected locally

Previous goal turn was status-only/no progress. [BUG706 naming fix](evidence/p12b-runeword-item-names.md)
uses canonical names for all35words and shares one list/detail naming helper.
72pre-edit failures reproduce the defect;143affected cases/scoped strict types/
three-file lint pass. Four bilingual mobile/desktop native component cases use
an unchanged earned Leaf and pass names/accessibility labels/overflow/error checks.
No crafting/combat/save replay, campaign credit or broad checks. Fixture-selector
mirror assumption is corrected and retained. Exact process/cache/profile/config
cleanup passes; root retains required `d2-runeword-names-p7jnenwr` through umbrella
review and owns eventual cleanup/release.14ActI/7Normal/formal0of210unchanged;
full privatev1 remains active/incomplete. No pending question/external blocker.


## 2026-11-04 — Martial post-growth native checkpoint reconciled

Previous goal turn was status-only/no progress. Revalidated owned human2 and
executed the prospective [D06 continuation](evidence/p15-martial-post-growth-act4.md)
from actual49/next708. Only Plains708 runs: four wins, then Izual draws60s with
2,131/40,147Life. Hero ends1,019Life/527MP, minimum507MP. Invested Cobra/Fists
deal useful native damage; overall throughput remains insufficient. Stop first
nonwin; retain49/next709,37earned items/28native salvage removals/123,948XP.
No Claim/full clear/ActV, River/Chaos, farming/training/extra retry or renewed
closed ordering/equipment controller. No outcome-driven numeric search.

Scoped new-driver types/lint/preflight and five-negative-control retained-output
root reader pass; original archive-wrapper type-config mistake retained. The98
previous combat tests are not repeated.2,207production/134campaign inputs exact;
16recorded wrapper/child PID checks absent, exact task cache/config/accidental
externalJS removed/absence verified, no disposables/cleanup failures. Required
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-post-growth-nu3sbxgt`
and human2 retained by root through umbrella review; root owns eventual cleanup/
release. Earlier closures remain historical snapshots.

BUG652 remains Open; native cumulative709admissions/46,784,524.707528435combatms/
469,221.71178699995driverwallms/504,181.89034890383reservedexecutionms. No new
policy/cause is established by the remaining damage gap; use retained evidence
and preserve closed trials rather than another blind retry. Other remaining
build/item/economy/difficulty/app implementation remains available.14ActI/7Normal/
formal0of210unchanged; full privatev1 active/incomplete. No broad checks/build,
agents/install/CI/commit/push/publication. Browser works/no pending answer or
external blocker; extended human playtesting stays with user after implementation.

## 2026-11-04 — Martial invested builder damage corrected locally

Previous goal turn was status-only/no progress. Revalidated current human2
ownership and all12recorded baseline inputs; implemented the explicit
[D06](decisions/D06-martial-builder-investment-growth.md) two-value data change.
[Before/after report](../balance/2026-11-04-martial-builder-investment-growth.md)
records native mitigation-floor RED and98affected GREEN cases across five files,
scoped strict types and explicit lint. Original bad timing-field assertion and
omitted Vite ambient types are corrected with original artifacts preserved.
No numbers searched after outcomes; rank-one, costs/CDs/priority, charges,
recovery and other tuning remain unchanged. Root self-review is not independent
design/QA or formal balance acceptance.

No native admissions, preparation, resources, browser, training, old-act replay,
renewed closed budgets, broad suite/build/typecheck, agents/install/commit/push/
publication. BUG652 remains Open; actual Martial49/next708,705–707spent. Next
qualify legal progression from the retained successor with an explicit bounded
plan; do not renew closed ordering/equipment comparisons. Other remaining builds,
item/acquisition/crafting, economy/30–50active-hour pacing, higher difficulties/
endgame, broader UI/accessibility/performance/PWA and final review remain open.

Exact check processes terminal; task cache/config removed and absence verified,
no remaining disposables/cleanup failures. Root retains required
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-builder-growth-_ttuy38p`
and human2 through umbrella review, then owns exact cleanup/release. Counts
14intendedActI/7intendedNormal/formal0of210unchanged; full privatev1 active/
incomplete. Browser works/CI excluded/no pending answer or external blocker;
extended human playtesting stays with user after implementation.

## 2026-11-04 — Martial retained throughput attribution closed

Previous goal turn was status-only/no progress. Revalidated owned human2 and
closed [retained attribution](evidence/p15-martial-retained-attribution.md):
all705–707final resources and metrics reconcile, with a second root reader
checking28unit HP totals/three mana totals and boss conservation. Cobra takes
23/22of53hero actions at nearly full mana; Cobra/Fists/Web landed boss hits
are at1. Tail and releases provide16,044/11,140direct boss damage. Scalar
skill bases ignore Attack, but actual124weapon candidates show the selected
claw already ties for best scalar cadence/critical score among ten eligible
claws. Do not patch preparation on this unsupported lead.

Original failed HP-orb observer and corrected reads retained, all hashes exact.
Required12-file packet closed/verified; no task processes/caches/disposables or
cleanup failures. Root retains exact
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-attribution-iwnwxnxl`
and human2 through umbrella review/owns eventual cleanup. No code, tests/build,
simulation, native preparation/browser, agents/install/commit/push/publication
or renewed closed allowance. This root readback is not independent QA.

BUG652 remains Open. Next Martial work requires an explicit scalar-throughput
decision grounded in this evidence and D05; preserve numbers/priority until
that decision exists, and do not replay closed ordering/equipment attempts.
Other unfinished build/item/economy/difficulty/app work remains available.
14ActI/7Normal/formal0of210unchanged; full privatev1 remains active/incomplete.
Browser works/CI excluded/no pending user answer or external blocker; extended
human playtesting remains with user after implementation.

## 2026-11-04 — Artwork recovery and document language slice closed

Previous goal turn was status-only/no progress. Revalidated owned human2 and
completed [BUG704–705](evidence/p16-image-reconnect-and-document-language.md):
failed shared images retry on online without changing URLs or healthy elements;
resolved i18n language updates the document declaration.18 artwork cases and
four executed locale cases pass, plus scoped strict types/explicit lint. Native
source-browser evidence covers eight component/ten language observations across
English/Chinese and mobile/desktop. Red regressions, original observer/config
failures and corrected scope are retained; no completed gameplay repeated.

Owned server3697792/session99274 terminal0; exact port/process/profile/cache/
config cleanup verified, no remaining disposables/failures. Root retains required
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-art-reconnect-zsjpf5q0`
and human2 through umbrella review, then owns cleanup/release.14ActI/7Normal/
formal0of210 unchanged; full privatev1 remains active/incomplete. These local
source-browser fixes do not close production/PWA-wide, whole-app or independent
acceptance. Continue remaining seven builds, acquisition/crafting families,
economy/pacing, higher difficulties/endgame, broader app acceptance/final review.
Closed training/diagnostic allowances stay closed; no broad checks/build/new
agent/install/CI/commit/push/publication. Browser works/no pending answer or
external blocker; human extended playtesting remains with user.

## 2026-11-04 — Earned Leaf and shared-modal recovery closed

Previous goal turn was status-only/no progress. Completed the retained
[Leaf/focus slice](evidence/p12b-earned-leaf-and-modal-focus.md) without repeating
crafting, swaps or closed diagnostics. Native Tir→Ral Leaf creation, hero/merc
transfer, configured/dormant Fire Bolt priority and durable reload reconcile.
Two closed diagnostic battles show7casts equipped/0removed; hero rank5 does not
stack and merc rank3→0→3. BUG703's missing Floating UI reference is fixed locally;
18 affected cases, scoped strict types/lint and desktop/mobile keyboard paths pass.

Final suffix corrects observer assumptions about persisted checkpoints and App
reconciliation before Continue. Explicit bonus accrual/decay and full-state
comparisons pass; no persistence patch. Conservation verifies530items, only the
staff payload changed, Tir−1/Ral−1, ordinal908→910, original player/map/formation/
endgame and16 production input hashes unchanged. Failed observers are retained.
Exact server3685481/session65573 exits0; port/profile/caches/config absence verified.
Disposables[]/cleanup failures[]; root retains required packet/human2 through
umbrella review and owns eventual cleanup/release.14ActI/7Normal/formal0of210;
full privatev1 active/incomplete. No broad suite/build/typecheck, campaign replay,
renewed closed allowance, agent/install/CI/commit/push/publication. No pending
answer/browser blocker. Continue unresolved build viability and remaining plan.

## 2026-11-04 — Earned set activation slice closed

Previous goal turn was status-only/no progress. This continuation resolves
[BUG702/P12b](evidence/p12b-current-set-bonuses.md): only supplied equipped pieces
activate current bonuses; stash receives actual gear and comparisons retain
explicit prospective behavior.52 affected cases/explicit lint and9 native
functional/two settled visual observations pass. Earned second-piece equip,
Fire Resistance55→85, all item/resource preservation and exact Save/Continue
reconcile. No combat/campaign/economic action or all-family acceptance credit.
Language preference/substring and supplemental offline-accrual observer errors
are corrected and retained; bonus window/multiplier remain checked.

Owned server3681205/session11508 terminal0; exact port/profile/cache absent,
disposables[]/cleanup failures[]. Root retains required set evidence/human2 until
umbrella review, then owns cleanup/release.14ActI/7Normal/formal0of210 unchanged;
full privatev1 active/incomplete. Continue remaining builds, acquisition/set/
granted-skill families, economy/pacing, higher difficulties/endgame, broader
UI/accessibility/performance/PWA and final review. Closed allowances stay closed.
No new agents/install/CI/commit/push/publication or broad checks. Browser works;
no external blocker/pending question; extended human playtest stays with user.

## 2026-11-04 — Map readability slice closed

Previous goal turn was status-only/no implementation progress. This continuation
resolves [BUG701/P16](evidence/p16-map-readability.md) locally: full wrapping names,
14px details/badges, readable completed rows and target/focus classes.12 existing
affected tests/explicit lint and80 native act-layout observations/two keyboard
flows/three gameplay-save comparisons pass. All29 areas/both locales/required
sizes plus200% text sizing covered; only presentation classes change. Stop Idle
is statically verified without entering farming. No combat/admission/economic
action or broad suite/build/typecheck. Observer errors/corrections retained.

Owned server3674364/session31034 exits0; exact port/profile/cache absent,
disposables[]/cleanup failures[]. Root retains required map evidence/human2
through umbrella review, then owns deletion/release.14ActI/7Normal/formal0of210;
full privatev1 active/incomplete. Continue unaccepted acquisition/crafting,
remaining seven builds, economy/pacing, higher difficulties/endgame, broader
UI/accessibility/performance/PWA and final review. Closed diagnostic/training
allowances stay closed. Browser works/no pending question/external blocker;
human extended playtest stays with user. No new agents/install/CI/commit/push/publication.

## 2026-11-04 — Earned recipe-family slice closed

Previous goal turn was status-only/no progress. The completed
[earned recipe-family integration](evidence/p12b-earned-recipe-families.md)
now has documented exact costs/receipts900–908, eight no-mutation pairs,14 source
hashes and durable Continue. Nine once-only actions; no production defect/change,
combat/admission/replay or repeated suites/build. Original receipt-observer
failure preserved; continuation resumes its saved successor. Amulet60/hero53
precludes equip/combat credit. Bounded settled bilingual visuals pass; full
P12b/economy/independent acceptance remains open. Server/browser terminal and
exact profile/cache/PID/port absence verified; disposables[]/cleanup failures[].
Root retains required packet/human2 through umbrella review, then owns deletion/
release. Counts14ActI/7Normal/formal0of210; full privatev1 active/incomplete.
Browser works/no pending answer; closed campaign allowances stay closed.

## 2026-11-04 — Character-sheet hero attributes readable and localized

Previous goal turn was status-only/no progress. This continuation fixes
[BUG699 / P16](evidence/p16-character-sheet-readability.md): existing translated
14px labels in four readable rows, complete wrapping hero/class names and
parent-owned fluid card dimensions.14unique locale/viewport cases, two keyboard
HUD entries, nine selected existing stat/Vitality cases and explicit two-file
lint pass. Numeric composition, resources, caps and allocation remain unchanged.
No broad suite/build/typecheck/engine test/campaign replay or new allowance.
Local implementer review only; production/independent acceptance stays open.

Owned PID3656993/session81153 exit0, port/cache absence and both terminal browser
sessions reconcile; disposables[]/cleanup failures[]. Eight input hashes and23
artifacts verify. Root retains `d2-character-sheet-c5oehy_d` and human2 through
umbrella review, then owns cleanup/release. Previous creation packet's missing
closure is now written and verifies five inputs/37artifacts without replay.
No new agent/install/CI/commit/push/publication. Human extended playtest reserved
for user; browser works/no pending answer. Counts14ActI/7Normal/formal0of210;
full privatev1 active/incomplete. Remaining seven builds, economy/acquisition/
pacing, higher difficulties/endgame, broader UI/accessibility/performance/PWA
and final review remain. Closed diagnostics/training budgets remain exhausted.

## 2026-11-04 — Character creation layout and readability fixed

Previous goal turn was status-only/no progress. Revalidated the existing claimed
human2 worktree, live owned server and exact reproduced source, then fixed
[BUG698 / P16](evidence/p16-character-creation-readability.md): fluid class cards,
parent-owned rows, localized14px attributes and complete wrapping names.14unique
browser layouts (both locales/seven sizes), two keyboard creation/actual autosave/
reload flows, six selected native cases and explicit two-file lint pass. No broad
suite/build, engine test, campaign replay, new agent/install/CI/commit/publication.
Failed observer assumptions are preserved; final durable reads assert exact
stored name/class before reload. Local review only; whole-app acceptance open.
Exact owned PID3650257/session54057 exit0 and port/cache absence verified;
remaining disposables[]/cleanup failures[]. Root retains required evidence at
`d2-character-create-2ksokkfc` and human2 through umbrella review, then owns cleanup/release.

The retained [Summon Druid allocation diagnostic](evidence/p15-summon-druid-allocation-diagnostic.md)
is also closed: native preparation succeeded, first control failed exact event
reproduction, zero candidates ran and no allocation/fix/completion was adopted.
Original earned checkpoint and all exhausted allowances remain unchanged; no replay.
Counts14ActI/7Normal/formal0of210; full privatev1 active/incomplete. Remaining
builds, economy/pacing, higher difficulties/endgame, broader accessibility/
performance/PWA and final review remain. Browser works; no pending answer.

## 2026-11-04 — Double Throw Normal completion verified

Previous goal turn completed the pending12-case regression check; classify it as
progress. This continuation closes [BUG697 and the earned suffix](evidence/p15-double-throw-priority-and-completion.md).
Retained evidence established recovery preempting an available Double Throw.
Upstream priority corrected;12selected cases/scoped strict types/explicit lint
pass. One corrective Crystalline715 plus first Ancients716/Throne717 win21waves;
terminal50/next718, all19ActV actions/five claims, exact rewards, Baal title and
Nightmare unlock reconcile. Original draws/preparation costs remain spent;
no training/farming/extra retry/earlier-act replay or renewed closed allowance.

No-gameplay preflight metadata mismatch is corrected in retained v2; native
launch occurs once. Separate reader and lifecycle closure pass;2204production/
134campaign inputs unchanged,34task PIDs/configs/caches absent, disposables[]/
cleanup failures[]. Root retains required packet/human2 through umbrella review
and owns eventual cleanup/release. No broad suite/build/new agent/install/CI/
commit/push/publication. Human extended playtest reserved for user; browser works.

Counts now14ActI/**7five-act Normal**/formal0of210; full privatev1 active/incomplete.
Remaining Cold/SummonDruid/HolyBolt/Zeal/Swing/Javelin/Martial routes, acquisition/
economy/pacing, higher difficulties/endgame, broader accessibility/performance/PWA
and final review remain. Closed diagnostics/training budgets must not be renewed.


## 2026-11-04 — Double Throw Act V checkpoint closed

Previous goal turn was status-only/no progress. This continuation closes the
[pending earned checkpoint](evidence/p15-double-throw-act5-checkpoint.md):
Bloody Foothills712/Frigid Highlands713 win12waves; Crystalline714W1 draws60s.
Exact rewards, two claims/prison actions and actual49/next715 save reconcile.
BUG697 tracks the unresolved cause; no engine defect or remedy yet established.
All14recorded PIDs/config/cache absent; remaining disposables[]/cleanup failures[].
Root retains required external packet/human2 through umbrella review, then owns
cleanup/release. No combat/check replay or renewed training/retry budget.
Counts14ActI/6Normal/formal0of210; full privatev1 remains active/incomplete.
Next distinguish rotation/equipment/progression using retained events/source,
then verify an established cause with affected checks only.

## 2026-11-04 — Item detail, comparison and focus fixes verified

Previous goal turn was status-only/no progress. This continuation closes the
pending [P16 item checks](evidence/p16-item-readability.md) for BUG694–696.
Readable 14px text/wrapping, StrictMode opener retention and scrollable tall
sidebars pass 84 unique layout cases, two keyboard flows and two native save
comparisons. Final minimum contrast4.955760:1/controls44×44px; no layout or
page/console issues. All gameplay domains/410items remain identical; only export
timestamp and online heartbeat change.41affected native cases pass, including
final eight focus cases under StrictMode; scoped strict types/lint pass.

Original failures/observer corrections remain retained; 68 completed records
were reused before running only the final unfinished groups. Local source and
capture review completed; production/whole-app/independent acceptance stays open.
Owned server3623169/child3623177 absent, port40219closed; exact task cache/config
removed and verified. Disposables[]/cleanup failures[]. Root retains required
`d2-item-readability-vl3d6whv` packet and human2 through umbrella review, then owns
cleanup/release. F08 table corrected to six Normal completions, including Traps.

Counts14ActI/6Normal/formal0of210 unchanged; full privatev1 active/incomplete.
Remaining eight builds, economy/acquisition/pacing, higher difficulties/endgame,
wider UI/accessibility/performance/PWA and final review remain. No campaign
replay, broad suite/build, agents/install/commit/push/CI or publication. Human
extended playtest reserved for user; browser works/no pending question.

## 2026-11-04 — Traps Normal completion reconciled

[Direct earned ActV](evidence/p15-traps-direct-act5.md) wins all33waves across
five first admissions720–724, following the18ActIV victories closed this turn.
Terminal50/next725, all19ActV actions/five main claims, exact rewards, Baal title
and Nightmare unlock reconcile. No farming/retry/controller renewal or earlier-act
replay. Counts now14intended ActI/6five-act Normal/formal0of210; fullv1 incomplete.

Scoped driver types/lint, five negative accounting controls, no-gameplay preflight
and separate retained-output reader pass. All14recorded PIDs and exact compiler
config/cache absent; remaining disposables[]/cleanup failures[]. Root retains
required packet/human2 through umbrella review and owns eventual cleanup/release.
No production code change, broad suite/build, agents/install/commit/push/CI or
publication. Continue remaining eight builds, economy/acquisition/pacing, higher
difficulties/endgame integration, app accessibility/performance and final review.
Human extended playtest reserved for user. Browser works/no pending question.


## 2026-11-04 — Traps Act IV continuation reconciled

[Post-allocation Traps continuation](evidence/p15-traps-post-allocation-act4.md)
wins all18waves across Plains717/River718/Chaos719. All three claims and exact
saved rewards/custody/resources/party/seeds/ordinals reconcile; terminal49/next720.
Original29training and714–716draws remain spent. Scoped checks only, no broad
suite/build/replay. All14recorded PIDs and exact compiler config/cache absent;
remaining disposables[]/cleanup failures[]. Root retains packet/human2 through
umbrella review and owns eventual cleanup/release. Next direct unattempted ActV,
one admission per main-quest area at most, stop first nonwin, no training/retry.
Counts14ActI/5Normal/formal0of210; full privatev1 remains active/incomplete.


## 2026-11-04 — Cold owned-weapon diagnostic reconciled

Previous goal turn was status-only/no progress. This continuation versions the
completed [Cold audit/diagnostic](evidence/p15-cold-owned-weapon-diagnostic.md).
Read-only140-weapon audit passes after a retained closure-shape preflight failure.
One gear-only retained battle still draws60s; three enemies remain292/213/424HP.
Candidate rejected; no source behavior/policy change, native successor/admission,
renewed retry/training or balance credit. Both packets are closed. All wrapper/
child PIDs and exact caches absent; disposables[]/cleanup failures[]. Root retains
required packets/human2 through umbrella review and owns eventual cleanup/release.
No diagnostic or check is rerun for documentation. Counts14ActI/5Normal/formal0of210;
full privatev1 active/incomplete. Browser works/CI excluded/no pending question.

## 2026-11-04 — Bow Normal completion reconciled

Previous goal turn was status-only/no progress. This continuation closes the
pending [Bow earned suffix](evidence/p15-bow-post-priority-and-owned-weapon.md)
and updates authoritative progress. BUG693's preparation fix is followed by
one corrective Ancients admission914 and first Throne915: all15waves win,
terminal53/next916, all19ActV actions/claims, exact rewards, Baal title and
Nightmare unlock reconcile. Original draw and all earlier costs remain spent;
no farming, additional retry, earlier-act replay or renewed closed allowance.
Production combat/loot/item formulas unchanged.

Five selected preparation regressions and scoped types/lint passed before the
suffix. Frozen reader passes five negative accounting controls, exact exports,
ordered custody/economy/points/party/quests/clocks/seeds/ordinals. Separate
closure verifies2204production/134campaign inputs unchanged, all20recorded
wrapper/child PIDs absent and exact cache/type config absent. No check or combat
was replayed for closure. Cumulative native costs916admissions,
37768475.346160434combatms,561386.192116driverwallms and
606922.1459755208executionwallms;34391.816690564156preparation/checkms separate.
Closure SHA256 `43e775db9d443d25eb9e45582432b8c75f795a91eec1c1e9fd84fffdb39e4c1c`.
Root retains required external packet and human2 through umbrella review, then
owns cleanup/release; remaining disposables[] and cleanup failures[].

Counts now14intended ActI/5five-act Normal/formal0of210. Full privatev1 remains
active/incomplete. Next trace Cold's owned caster preparation from retained
artifacts, then implement an established cause with focused checks; no repeated
closed diagnostic or training. Acquisition/economy/pacing, higher difficulties/
endgame integration, app accessibility/performance and final review remain.
Human extended playtest reserved for user. Browser works/CI excluded/no pending
answer or external blocker; no agents/install/commit/push/publication.

## 2026-11-04 — Skill-screen readability implemented

Previous goal turn was status-only/no progress. This continuation implements
[BUG692/P16 skill readability](evidence/p16-skill-readability.md): eleven
presentation class changes restore 14px text, 16px selectors and opaque rank
badges. Final 26 browser layout cases/two keyboard flows, six selected existing
tests and scoped strict types/lint pass. Original reproduction and two observer
corrections retained. Local screenshot/source review only; whole-app and
independent acceptance remain open. No campaign replay, broad suite or build.

Task PID3600884 absent/port42629 closed; exact Vite cache/type config removed
and absence verified. Root retains required d2-skill-readability-5357g9g2 packet
and human2 through umbrella review, then owns cleanup/release. Counts remain
14ActI/4Normal/formal0of210; full privatev1 active/incomplete. Continue remaining
build viability, acquisition/economy/pacing, difficulty/endgame integration,
app accessibility/performance and final review; human soak reserved for user.
Browser works/CI excluded/no pending question/external blocker. No renewed
closed budgets, new agents, install, commit, push or publication.

## 2026-11-04 — Cold Ancients priority diagnostic closed

Previous goal turn was status-only/no progress. This continuation records the
[retained two-battle diagnostic](evidence/p15-cold-ancients-order-diagnostic.md)
and separately verifies process/cache cleanup. Exact control passes all3174
events/full final parties. Blizzard-before-Static reduces survivors12→3 but
still draws60s; candidate rejected. No order/production change or native
admission. Original preflight failure/correction retained; both battles and
all earlier diagnostic/preparation limits remain consumed/closed. Root retains
required d2-cold-ancients-order-7r3bp652packet and human2 through umbrella review.
14ActI/4Normal/formal0of210 unchanged; full privatev1 active/incomplete. Next
trace owned caster preparation before choosing a justified implementation fix.
Browser works/CI excluded/no pending answer or external blocker. No broad suite,
earlier-act replay, new agent, install, commit/push/publication or budget renewal.

## 2026-11-04 — Current production earned Ashen successor audited

Previous goal turn was status-only/no progress. This continuation finishes the
separate retained-artifact audit of [current production Ashen repeat](evidence/p18-current-earned-repeat.md),
versions actual successor5/Ashen4/Glacial1 and updates stale F17/F18 coverage.
All four original waves win; both acknowledged Save/browser-restart/Continue
pairs match full state. Reader verifies six authored22→33 migration changes,
exact ten-path successor diff,27633 ancestral payloads, ten appended items,
150930heroXP/113197mercXP/34879shards/four materials and original Blood Lord
Fire Breath→fire→ally Ignite source witnesses. Native cache attribution is
explicitly derived. Original stale-XP preflight fails before any admission;
failure/correction retained. One admission consumed, never replay0–4 or Claim/
title/ruby utility. No new production changes or broad/repeated tests.

All2859 source inputs/766assets/tenJS chunks verified before exact disposable
build cleanup. PIDs3591381/3592563/3592953 absent, ports39885/44237closed,
both browser/profile/tmp/download sets absent;766files/ten directories removed,
cache absent, no cleanup failures. Root retains required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-p18-current-earned-fd45btdw`
and human2 through umbrella review and owns eventual cleanup/release. Historical
predecessor archive absent/not inspected; versioned input hashes match.

Counts14ActI/4Normal/formal0of210 unchanged. Full privatev1 active/incomplete;
next unfinished gameplay/build viability, acquisition/economy/pacing, current
production Glacial/broader difficulty/endgame, whole-app accessibility/performance
and final integration/review; human soak reserved for user. Browser works, CI
excluded, no pending answer/external blocker. No agents/install/commit/push/
publication, diagnostic replay or renewed closed budgets.

## 2026-11-04 — Owned mercenary card readability implemented

Previous goal turn was status-only/no progress. This continuation fixes
[BUG691/P16](evidence/p16-owned-merc-readability.md):17 undersized labels,
12 contrast failures and visually confirmed English name truncation. Nine
presentation-only class changes restore14px text, readable contrast and full
names. Final10 development-browser layout cases/two keyboard flows, five
existing native tests and scoped strict types/lint pass. Initial observer's
wrong first-hire-fielded assumption/failure retained and corrected. No broad
suite, build or campaign replay; local implementer review only.

Task server PID3585985 absent/port4494 closed; exact Vite cache removed and
absence verified. Root retains required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-owned-readability-7hohedcq`
and claimed human2 through umbrella review, and owns eventual cleanup/release.
Counts14ActI/4Normal/formal0of210 unchanged; full privatev1 remains active.
Next unfinished gameplay/build viability, acquisition/economy/pacing,
difficulty/endgame integration, whole-app accessibility/performance and final
review/soak. No renewed closed budget, agents, installs, commits, pushes or
publication. Browser works; CI excluded; no pending answer/external blocker.

## 2026-11-04 — Cold direct suffix stopped and reconciled

[First direct Ancients evidence](evidence/p15-cold-direct-act5-suffix.md)
continues the earned73/1224save without reopening its exhausted preparation.
One admission wins four waves then draws on wave5; terminal73/next1225, no
new quest action/claim, Throne unattempted. BUG643 remains open. Scoped strict
types/lint/no-gameplay preflight pass; readerV2 reconciles exact native save,
ordered custody/economy/points/party/quests/clocks/seeds/ordinals. OriginalV1
optional-field failure retained; no combat replay.2204production/134campaign
inputs stable. All8recorded child processes absent; exact transient config/cache
absent; root retains required p15-cold-direct-act5-suffix-v1packet and human2.

Previous status-only turn was no progress; this turn establishes a real route
failure and its authoritative successor. Counts14ActI/4Normal/formal0of210
unchanged. Full privatev1 active; next unfinished implementation/build viability,
acquisition/economy/pacing, difficulty/endgame integration, app accessibility/
performance and final review/soak. No repeated failed admission, renewed closed
budget, earlier-act replay, broad suite, agent, install, commit/push/publication.
Browser works; CI excluded; no pending answer/external blocker. Older entries
below retain their original dated counts and stopping conditions.

## 2026-11-04 — Additional equipment guarantees verified

[Focused production evidence](evidence/p17-equipment-guarantees.md) implements
D09: five boss rarity groups, goblin rare+ and each mini's50% rare+. Original
15failing cases,95affected loot passes,52level/edge passes,36native regression
passes and final19settlement passes are retained; counts overlap and are not
summed. Final scoped strict types/explicit lint and isolated766-file production
build/ten-chunk bridge scan/actual precache pass. Real Diablo grants reach
inventory; impossible special rewards leave inventory untouched. No campaign
replay, broad suite or earned/balance/pacing credit. BUG680 remains partially
open for complete boss bundles and first-kill rewards. Source/build hashes
match; exact disposable build/type config removed/verified; consumers terminal.

Previous goal turn was status-only/no progress; this continuation finishes
actual implementation verification. Counts14ActI/3Normal/formal0of210 unchanged;
full privatev1 active. Next fix BUG681 and continue unfinished gameplay. Browser
works; CI excluded; no pending answer/external blocker. Root retains human2 and
required p17-loot-guarantees-v1 packet through umbrella review and owns eventual
cleanup/release. No agents/install/commit/push/publication or budget renewal.


## 2026-11-04 — Real equipment Magic Find restored

[Production MF evidence](evidence/p17-real-magic-find.md) closes BUG678 and the
stale Act IV cache test BUG679 locally. Exactly491 ordinary fixed-rarity fields
are removed across31tables; all other authored data, fixed rewards and caches
are preserved. Native27tests pass; original broader304passes/stale-cache failure
and corrected35selected/cache cases retained. Final scoped types/explicit lint
and production build/13-chunk bridge scan pass. Four production browser cases
pass in47.9s using actual canonical enemy-ID wishstone forks, exact reward/save
comparison and offline worker reload; eight Settings/export captures inspected.
Constructed samples grant no earned campaign/pacing credit. Economy shifts remain
unaccepted. BUG680 missing boss rarity guarantees and BUG681 chip glyph remain
open. Exact temporary configs/build/success-result directories removed/verified;
failure traces and required source/build manifests retained in p17-real-mf-v1.
Counts14ActI/3Normal/formal0of210 unchanged; full privatev1 active. Previous
status-only turn was no progress; this continuation corrects the actual oracle
and closes the MF implementation/evidence slice. Next implement boss guarantees
and continue unfinished requirements; no full suite/campaign replay or budget
renewal. Root retains human2 and required evidence through umbrella review and
owns eventual cleanup/release. Browser works/CI excluded/no pending question.


## 2026-11-04 — Attack-interval feedback implemented and verified

[Attack-cadence evidence](evidence/p17-attack-cadence.md) closes BUG676/idle §5.3
and BUG677 locally. Actual scheduler observations drive bilingual interval and
canonical equipment-speed contribution beside the log, without future playback
leakage or changes from2x/4x presentation. Final219affected cases/12files and
4production desktop/mobile×en/zh-CN cases pass; scoped strict types, explicit lint,
build and ten-chunk bridge scan pass. Pre-change refund fixture3failures remain
recorded; corrected friendly positives and hostile negatives pass. Local five-axis
review and all four capture inspections found no material issue within scope.

Previous goal turn was status-only/no progress. This continuation closes the
pending implementation review/documentation/cleanup. Source and766build hashes
matched, consumers terminal/port4399closed; exact configs/build/results removed
and verified absent. Root retains packet `p17-attack-cadence-v1` and human2 through
umbrella review and owns eventual cleanup/release.14ActI/3Normal/formal0of210
unchanged; full privatev1 incomplete. Continue actual unfinished gameplay and
idle/MF/PWA/endgame integration, economy/pacing and final review/soak. No campaign
replay, broad suite, install, new agent, commit/push/publication or renewed closed
budgets. Browser works; CI excluded; no pending question/external blocker.

## 2026-11-04 — Returning-player message implemented and verified

[Offline return message evidence](evidence/p17-offline-return-toast.md) closes
BUG675/idle spec §5.2 locally. Durable startup publishes transient actual-absence
and chosen-bonus/window metadata outside save/autosave state. Bilingual polite
feedback supports44px keyboard dismissal, safe-area wrapping and unobstructed
navigation.117affected unit cases, scoped strict types/explicit lint/build and
four production desktop/mobile×en/zh-CN browser cases pass (29.1s). Exact full-save
no-income/reopen/dismissal and five-size reflow pass; local source/capture review
finds no material issue. Original RED12/58 retained; umbrella acceptance open.

Previous goal turn was status-only/no progress. This continuation closes a real
implementation slice; no campaign replay, broad suite, install, new agent,
commit/push/publication or renewed closed budgets.14ActI/3Normal/formal0of210
unchanged; full privatev1 incomplete. Next actual attack-speed display and broader
idle/MF/PWA/build/economy/pacing/review/soak. Browser works; CI excluded; no pending
question/external blocker. Handle53391terminal, preview4398closed; exact configs,
hashed766-file build/results removed/verified. Root retains required packet prefix
`p17-return-toast-v1` and human2 worktree through umbrella review and owns cleanup/release.


## 2026-11-04 — Offline XP/MF labels, meters and Settings help implemented

[Production UI evidence](evidence/p17-offline-bonus-ui.md) closes BUG674 and
idle spec §5.1/5.4. Home/HUD show XP and Magic Find with an accessible current
0–50% meter; bilingual native Settings help explains accrual, caps, decay and
no direct offline income. Existing authoritative read-only projection/timers,
reward formulas and save contract are preserved. Expected RED2/10 then12/12
lifecycle tests pass. Production desktop/mobile×en/zh-CN passes4/4 in27.8s;
one additional mobile-Chinese visible-help check passes14.2s. Whole-save
comparisons permit only clock/bonus projection changes; five-size reflow,
keyboard help, exact expiry and no page errors/bridge pass. Final scoped strict
types/explicit lint and production build/ten-chunk scan pass. Initial numeric
interpolation lint and incomplete type harness failures remain recorded.

Previous goal turn was status-only/no progress. This continuation implements
missing production surfaces; no campaign replay, full suite, install, new agent,
commit/push/publication or renewed training/diagnostic budget. Counts remain
14intended ActI/3Normal/formal0of210; full privatev1 incomplete. Returning-player
toast, actual attack-speed display, broader idle/MF/PWA, build viability,
economy/pacing and final review/soak remain open. Next implement an unfinished
requirement using current source, preserving all prior failures and closed limits.
Browser works; CI excluded; no pending question or external blocker.

All relevant process handles are terminal and preview4397closed. Exact runner,
types config and hashed766-file production output removed/verified; no cleanup
failures. Root retains required packet prefix `p17-bonus-ui-v1` and active human2
worktree through umbrella review and owns eventual evidence cleanup/release.

## 2026-11-04 — Current production offline suite repaired and verified

[Current P17b01 proof](evidence/p17b01-production-offline.md) now passes the four
original locale/viewport cases on logical-save33 source in28.2s, without a new
build. BUG673's original observer fails before combat on physical JSON string
versus logical object; the minimal reader correction preserves all complete-save,
SW document/JS, offline navigation/combat/save and reconnect assertions. Scoped
strict types and explicit lint pass. Other old observers are not silently
accepted. [New reward integration](evidence/p17-integrated-rewards.md) separately
passes four cases in34.3s with exact216hero/162merc XP and no repeated awards.

All relevant process handles are terminal and ports4326/4396closed. Original and
updated isolated builds, both temporary runner configs, types config and the
unexpected task-created dist were removed/verified absent; its766-file manifest
was unchanged before removal. Both packet cleanup closures have no failures.
Root retains only required logs/reports/source hashes/failure traces under exact
packet prefixes `p17-integrated-rewards-v1` and `p17-native-reader-v1`, plus the
active human2 worktree, through umbrella review and owns eventual cleanup/release.

This continuation adds source/UI and integration progress; it does not complete
privatev1.14intended ActI/3Normal/formal0of210 remain. Next address unfinished
native idle/bonus integration or gameplay requirements, retaining closed route
budgets and all original evidence. No campaign replay, full suite, install,
new agent, commit/push/publication or pending question/external blocker. Browser
works; CI remains excluded by owner instruction.


## 2026-11-04 — Production offline return and native XP integration verified

Previous goal turn was status-only/no progress. New [integrated P17 evidence](evidence/p17-integrated-rewards.md)
passes desktop/mobile × en/zh-CN: four cases in34.3s, no retries/skips. Actual
page closure/eight-hour absence, warmed SW offline startup, whole-save no-income
oracle,30-minute decay, one native won wave and exact offline reopen pass.
Each case earns216hero/162merc XP at the decayed award-time multiplier.

BUG670 canonical fixture selection and BUG671 startup clock race are fixed;
BUG672's passive Settings notification now ignores pointer input. Original
failures remain. V4 reproduces the mobile hit-test failure on original source;
V5 passes ordinary navigation while the toast remains visible. Production build,
scoped strict types/explicit lint and no-bridge scan pass. Only Settings' one
pointer class changes production source. No full/campaign replay or gameplay
tuning. Broader idle/MF/P17 and v1 gates stay open;14ActI/3Normal/formal0of210.

Root retains human2/required evidence through umbrella review. Isolated builds
remain only for the next affected check: older P17 production observers still
assume object storage despite the current JSON physical envelope. Reproduce
that mismatch before correction; no new build is needed for test-only edits.
Browser works/CI excluded/no pending question or external blocker.


## 2026-11-04 — Combined Swing preparation wins retained diagnostics

[Evidence](evidence/p15-swing-sword-combination.md): prepared ranks/order and an
already-owned eligible sword yield391Attack and three Izual defeats24.985–32.238s.
Exactly12preceding controls/3candidate fights; no boss control replay, campaign
admissions, rewards or formula tuning. Separate v2 readback passes conservation.
One native reset/56allocations/combo/equip succeeds, then the external mirror
assertion fails before whole terminal capture (BUG669). Pure composition and
restore/export/accounting recover an explicitly reconstructed successor, with
all418items/current150Life/65Mana conserved. No original actions repeat.
BUG659 stays Open; no earned clear or renewed route/staging allowance. Original
failures and reconstructed provenance remain. Packet closures retain terminal
receipts and absent local caches; root owns retention/cleanup through umbrella
review. Previous goal turn was status-only/no progress. Next continue an
unfinished gameplay/integration slice. Counts14ActI/3Normal/formal0of210; full
privatev1 incomplete. Browser works/CI excluded/no pending question or external
blocker. No new agents/install/commit/push/publication or broad/campaign replay.

## 2026-11-04 — Javelin partial Act V and terminal preparation verified

Direct Act V ordinals708/709 clear and claim Bloody Foothills/Frigid Highlands.
Crystalline710 wins two waves, then loses the third; thirteen quest actions end
at Anya thaw. Source50/next711 is retained. The loss is not evidence of mana
starvation: entry272/1093Life and432Mana, no surviving merc; terminal411Mana.

Separately frozen prepared V2 adopts all three original admissions and their
spent retry costs. Two hundred earned training admissions produce1,072victories,
29,402,756XP and level62/next911, then the original200-per-area limit stops it
before the level71 target. No route retry or new Claim occurs. Cleared sources
progress Durance11/Plains128/River53/Bloody8; all training wins, with11merc deaths
and22waves without a merc. This is a closed failed preparation policy, not proof
of a production combat/reward defect or permission to renew training allowances.

The sole frozen readback passes six negative accounting controls and exact whole
native-save, custody/economy/points/party/quests/clocks/seeds/ordinals. Preflight,
scoped strict types and explicit lint pass. V1's fresh-boundary assertion failed
before any gameplay; BUG668 is locally fixed by inherited action authentication
in V2, retaining native partial-route validation and V1 costs. No combat replay.
Required packet prefix `p15-javelin-prepared-act5-v2`; closure verifies terminal
processes and absent disposable config/cache. Cumulative911admissions /
45,538,468.320859015combat ms /677,810.956475driver ms /
733,165.4280702898reserved execution ms remain spent. Exact terminal export
SHA256 `b9bff03ee6f3be0a0bfb260e8e30ac969b0988324d2abba0b79db2e3aa6705ac`.

The inherited direct route entered Act V at49 and cleared two areas without
preparation, leaving the full50→71 gap for one area's200-entry allowance.
The result establishes that this particular adoption policy fails its bound;
it does not establish that the game's30–50active-hour target is impossible.
Preserve it and use an eligible unfinished implementation/investigation slice
instead of further farming from this closed checkpoint. Counts14ActI/3Normal/
formal0of210; full privatev1 and wider acceptance remain incomplete. Root retains
human2 and required evidence through umbrella review and owns eventual cleanup.

## 2026-11-04 — Fully invested Javelin clears earned Act IV

The adopted `javelin-pair-at-target-v1` campaign policy removes weak fillers
only after both declared signatures reach their positive target ranks. Thirty-five
selected cases, scoped strict types and explicit four-path lint pass. The sole
retained pack comparison wins in31.212s; its V3 accounting passes without replay.
The earlier rejected Impale8 trial and every failure/cost remain retained.

The actual Chaos707 admission then wins all seven waves, including Diablo,
claims Terror's End and completes all13 Act IV actions. Exact successor49/next708
has earned Act V access. One admission/137246.735218509combatms/345753XP/64drops/
46salvage are conserved. Frozen V1 accounting passes exact native save, ordered
custody/economy/points/party/quests/clocks/seeds/ordinals and five negative controls;
no combat replay. Required packet prefix `p15-javelin-post-pair-act4-v1` is closed
with original cumulative costs and exact owned process/cache/config checks.
[Combined evidence](evidence/p15-javelin-act4-and-owned-weapon.md).

Counts remain14intended ActI/3five-act Normal/formal0of210; full privatev1
incomplete. Next continue the five canonical Act V main-quest areas from this
exact successor, one admission per uncleared area and first nonwin stop, no
training/retry or allowance reset. No pending question/external blocker. Browser
works/CI excluded. Root retains human2 and required packet through umbrella review
and owns eventual cleanup/release; no agents/install/commit/push/publication.

## 2026-11-04 — Javelin investment verified; actual Chaos pack still draws

[Combined evidence](evidence/p15-javelin-act4-and-owned-weapon.md) records the
paid Impale8→20/Critical15→3 reset, sole retained Diablo victory29.756s, twelve
selected passing cases/scoped strict types/explicit lint and separate accounting.
BUG667 fixed locally; BUG642 remains Open. The actual Chaos706 continuation
wins five waves then draws on the sixth Mega Demon pack; Diablo never staged.
Exact native successor49/next707,231943XP/45drops/61salvage retained. V2 readback
passes whole save, ordered custody/economy/points/party/quests/clock/seeds/ordinals
without combat replay. Initial setup/reader failures remain; no allowance reset.

Counts remain14ActI/3Normal/formal0of210; fullprivatev1 incomplete. Next examine
weak filler spending with the now fully invested pair, retaining all original
failures/costs. No external blocker/pending question; browser works/CI excluded.
Exact owned processes are terminal and disposable paths absent. Required packet
and human2 stay root-owned through umbrella review and eventual cleanup/release.

## 2026-11-04 — Javelin owned-weapon policy implemented; native prediction failure retained

[Combined evidence](evidence/p15-javelin-act4-and-owned-weapon.md) records the
earned Plains703/River704 clears and Diablo705draw, then the rejected single
signature-only candidate. No order adopted or failure budget renewed. The
previous goal turn was status-only/no progress; this continuation implements
BUG666 by opting Javelin into existing physical-offense-v1 from JSON level12.
All43equipment cases, final scoped strict types and explicit lint pass.

One native check performs52staging transfers/one equip, then fails the incorrect
War Fork prediction. Actual owned Razor Stitch ranks highest; separate accounting
reconstructs every transition/all437items and unrelated state. Attack265→395,
current140Life/72Mana and49/next706conserved. Failure remains failed; no restart,
second call, combat, income, clock advance or campaign admission. Unit idempotence
passes; native repeat unverified. BUG666 fixed locally, BUG642 remains Open.

Next use the retained canonical equipment difference to investigate the remaining
boss shortfall under a separately frozen bounded diagnostic, or implement another
unfinished gameplay requirement. Do not replay completed acts, sweep orders,
renew spent allowances or promote the failed preparation as earned progression.
Counts14ActI/3Normal/formal0/210. Full privatev1/BUG592/wider balance and final
integration/review/soak/later owner playtest remain incomplete. Browser works,
CI excluded, no pending question/external blocker. No agents/install/commit/push/
publication. Exact config/cache cleanup and terminal receipts are recorded in
the required packet closure; root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Martial equipment-only comparison closed without viability

[Result](evidence/p15-martial-equipment-impact.md): exactly three candidates,
zero new controls, all60-second draws. Izual retains15,366/17,414Life; the
preceding Pit Lord retains5,820. Six canonical native stat differences alone
are applied; all other snapshot inputs and absolute resources are conserved.
BUG664 preparation stays fixed; BUG652 stays Open, attempts705–707 exhausted.
No earned continuation, rewards, order adoption or renewed budgets. Separate
accounting readback passes; not independent final QA. Recorded owners terminal,
cache absent, no compiler config created. Root retains exact required packet
and human2 through umbrella review and owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation records the
completed diagnostic; next select a substantive unfinished implementation from
current evidence without repeating rejected ordering/equipment comparisons.
Counts14ActI/3Normal/formal0/210, full privatev1 and BUG592/wider acceptance
remain incomplete. Browser works; CI excluded; no pending answer/external
blocker. No new agents/install/commit/push/publication or broad/campaign replay.

## 2026-11-03 — Martial owned claw preparation implemented and verified

[Evidence](evidence/p15-martial-owned-weapon.md): BUG664 fixed locally by opting
Martial into existing physical-offense-v1 from JSON level1, retaining claw
eligibility. All39equipment cases, scoped strict types and two-path lint pass.
One retained-save check equips the expected owned Greater Claws in28native
actions; a second call is byte-exact unchanged. Whole-save readback preserves
all394items, current Life140/Mana87, costs, quests and49/next708. Attack268→291;
MagicResist50→46 is an explicit tradeoff. No combat, income, time or healing.
Initial import/RED/GREEN/lint failures remain retained; production formulas are
unchanged. Root accounting readback is not independent final QA.

Earlier paired-finisher trial is rejected: three exact controls/three candidates,
two Izual draws and one pack win. No order adopted, renewed routes or earned
clear; BUG652 remains Open and705–707 stay exhausted. Counts remain14ActI/
3Normal/formal0/210. Full privatev1, BUG592, remaining build viability and wider
population/economy/pacing/recruitment/fairness/adaptation/manual-idle/defeat-retry,
offline/PWA/endgame and integration/review/soak/later owner playtest remain.
Previous goal turn was status-only/no progress; this continuation closes the
verified preparation slice. Browser works/CI excluded/no pending answer or
external blocker. No agents/install/commit/push/publication or broad replay.
Exact disposable type config removed and absence verified, recorded processes
terminal and packet caches absent. Root retains human2/required packet through
umbrella review and owns eventual cleanup/release. Next measure equipment-only
impact using prospectively bounded retained combat inputs before proposing
further correction; preparation success alone does not establish victory.

## 2026-11-03 — Double Swing sword preparation implemented

[Evidence](evidence/p15-swing-offense-preparation.md): preserve Iron Skin1,
allocate late points to Sword Mastery, attack with Swing before Howl, and keep
a sword through the existing owned selector. Eleven selected cases, one final
assertion-typing recheck, final scoped strict types and four-path lint pass.
Initial fixture, ambient-type, missing sword-interface and matcher-lint failures
remain retained. Independent v2 readback authenticates all2157production inputs,
exactly five campaign changes, complete native save/reset conservation and every
control/candidate boss health identity. No production combat formula changes.

All15control waves match the originals; three sole candidate boss waves reduce
Izual remaining Life73.46%/53.20%/51.88%, yet all remain60-second draws. This
accepts preparation only: BUG659 remains Open, no ActIV clear or earned replay.
Original/partial saves and all costs/failures/seeds/ordinals/spent route and
32-action staging limits remain. No income, training or renewed budgets.
Counts remain14ActI/3Normal/formal0/210; fullprivatev1/BUG592/wider acceptance
are incomplete. Previous goal turn inspected terminal results (evidence
progress); this continuation completes the integration and records its limits.
Exact disposable type config/cache are removed and checked in packet closure;
all owned consumers terminal. Root retains human2/required packet through
umbrella review and owns eventual cleanup/release. Browser works/CI excluded/
no pending answer or external blocker. No agents/install/commit/push/publication.
Next investigate the remaining intended-build damage shortfall or another
unfinished gameplay requirement without reopening exhausted attempts.

## 2026-11-03 — Act IV damage shortfall attributed from retained failures

[Six-wave evidence](evidence/p15-act4-damage-attribution.md) reconciles all direct
source totals and exact Izual Life deltas across both Barbarians' three draws.
Throw's rank-one Swing filler consumes24–36% of hero actions for79total boss
damage; Swing uses199Attack and spends24–26% of hero actions on Howl. Existing
rank scaling and363Defense/50% physical resistance explain the observed damage;
no engine defect or accepted numeric correction. Next evaluate attainable
owned offensive equipment/rotation preparation before global tuning. No combat,
income, native actions, broad tests or renewed route/preparation budgets. All
declared original journals/saves/relevant sources authenticate unchanged.
Previous turn was status-only/no progress; this retained-data investigation
changes the next action. Counts14ActI/3Normal/formal0/210 and full privatev1
incomplete; BUG592 and wider acceptance remain. Browser works/CI excluded/no
pending answer or external blocker. No agents/install/commit/push/publication.
No owned process/config/cache created; root retains human2 and exact required
attribution packet through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Ordinary spear upgrades implemented and verified locally

[Evidence](evidence/p15-spear-progression.md): BUG661 locally fixed with four
spear bases and61 appended picks across28 ordinary tables.151 distinct affected
unit cases, final scoped strict types/lint and exact complete JSON preservation
pass. Four distinct en/zh-CN×desktop/mobile browser cases pass across original
three and isolated mobile-English rerun; original setup reload timeout is retained,
cause unproven. Eight passing captures inspected. Campaign source/profile and
Double Throw export hashes unchanged; availability/equip/save proves neither
earned acquisition nor ActIV viability. Exact owned configs/cache removed and
absence verified; recorded browser processes absent, Vite closed. Root retains
required packet/human2 through umbrella review and owns eventual cleanup/release.

Previous status turn verified a live browser wait; this continuation completes
the content slice. Counts remain14ActI/3Normal/formal0/210. Full privatev1,
BUG592, remaining build viability/economy/pacing, offline/PWA/endgame and final
integration/review/soak/later owner playtest remain open. Next unfinished gameplay
implementation from retained evidence; preserve failed/exhausted routes and all
costs/seeds/ordinals. Browser works; CI excluded; no pending answer/external blocker.
No new agents/install/commit/push/publication or broad/campaign replay.

## 2026-11-03 — Barbarian weapon selector verified; retained checks qualify next work

[Evidence](evidence/p15-barbarian-owned-weapon.md): intended Swing6/Throw12 reuse
the physical selector, with first required-weapon acquisition taking precedence.
All35 focused cases, scoped strict types and explicit lint pass. This is campaign
preparation, not a game formula change. Single zero-combat checks retain two
failures: Swing stops after33 staging transfers under its32-action limit before
equip; Throw owns no better eligible throwing weapon and changes nothing.
Whole-save readbacks verify the partial Swing successor and byte-exact Throw
export; original saves, costs, failures, seeds/ordinals and spent limits remain.
Swing is not restarted. Throw's unused plan was corrected before first execution
after overflow preflight; both versions remain. Recorded processes/caches are
absent and exact disposable types config is removed/verified; required packet
and human2 remain root-owned through umbrella review and eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation resolves the
retained-preparation assumptions; BUG659/BUG656 remain Open with no combat fix.
Next address earned weapon acquisition or another unfinished implementation
slice, without replaying failures or renewing exhausted routes. Counts stay
14ActI/3Normal/formal0/210. Full privatev1, BUG592, remaining build viability,
economy/pacing, offline/PWA/endgame and integration/review/soak/later owner
playtest remain open. Browser works; CI excluded; no pending answer/external
blocker. No new agents, install, commit, push or publication.

## 2026-11-03 — Swing Act IV failure diagnosed; ordinary sword tiers verified

[Double Swing evidence](../balance/2026-11-03-swing-earned-progression.md) now
records the terminal Act IV checkpoint49/next711, rather than unattempted47/678.
30 earned training admissions plus three Plains attempts708–710 retain195waves:
192victories/three60-second Izual draws. No Act IV Claim/clear or Act V. Frozen
readback/nine negative controls, scoped checks and exact closure pass; all earned
items, costs, failures, seeds/ordinals and exhausted budgets remain preserved.
Retained-only diagnosis files BUG659: all67 weapon decisions select nothing,
rejecting187 higher-Attack owned candidates under all-stat nondecrease. Existing
native equip and Double Swing Attack scaling work. No verified combat fix.

[Ordinary sword evidence](evidence/p15-sword-progression.md): BUG660 locally fixed;
34 additive picks in24 tables expose existing War32/Legend60 tiers.52 focused unit
cases, strict scoped types, explicit lint and four Chromium en/zh-CN×desktop/mobile
cases pass. Eight captures inspected; full38-table JSON equals exact preimage plus
declared additions. Terminal Swing export hash unchanged. Browser processes absent,
Vite closed, exact owned configs/cache removed and absence verified. No campaign
replay, seed search, training, free gifts or renewed attempts. The content fix
establishes availability/native use, not BUG659 viability or acquisition odds.

Previous goal turn was status-only/no progress; this continuation finishes the
content slice and records the late-act failure. Next address the diagnosed owned
weapon-selection limitation without reopening exhausted routes. Counts remain
14intendedActI/3Normal/formal0/210; full privatev1 incomplete. BUG592, remaining
build viability, populations/economy/pacing, offline/PWA/endgame and final
integration/review/soak/later owner playtest remain. Root retains evidence/human2
through umbrella review and owns eventual cleanup/release. Browser works; CI
excluded; no pending answer/external blocker. No agents/install/commit/push.

## 2026-11-03 — Restore-write worker rejected; gameplay work resumes

[Result](../balance/2026-11-03-restore-write-worker-rejected.md): desktop reload
median563.400→897.817ms (+59.36%) rejects the serializer-only worker. Exact
four-path preimages restored; five new paths archived/removed. Candidate214unit
cases pass; initial scoped types/lint fail and final browser report is absent
after the documented early-stop download rejection. No complete mobile
comparison, timing retry or retained improvement. Closure authenticates exact
source restoration, both recorded processes absent and owned disposables absent.
BUG592 remains Open; do not retry this candidate. Required packet/human2 remain
root-owned through umbrella review. Return to concrete gameplay gaps from
retained failures. Counts14ActI/3Normal/formal0/210 stay unchanged. Previous
status-only goal turn made no progress. Browser works, CI excluded, no answer
or external blocker. No agents/install/commit/push/publication.


## 2026-11-03 — Ordinary throwing weapon upgrades implemented and verified

[Evidence](evidence/p15-throwing-progression.md): BUG658 locally fixed in retained
uncommitted source. Five one-handed zero-socket tiers and70 additive picks across
28 ordinary tables repair the absent throwing upgrade path. All91 prior bases,
38 tables' old content and both locales' old values are preserved independently.
Latest176 distinct affected unit assertions, four final Chromium desktop/mobile
and en/zh-CN cases, scoped strict types and explicit lint pass. Eight final
captures inspected; source/failure/capture corrections retained. Exact owned
configs/cache removed and absence verified; recorded browser processes absent.
No broad suite, campaign replay, seed search, renewed limits or earned gift.

This continuation completes a production content slice; campaign counts remain
14 individual intended Act I clears /3 five-act Normal completions / formal0/210.
Double Throw49/next709 terminal export remains unchanged, SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`.
BUG656 Act IV throughput, BUG592 large-save performance and full private v1 remain
open. Next use retained late-act failure evidence to identify remaining mechanics/
progression gaps; do not renew exhausted preparation or attempts. Later-build
viability, populations/holdouts, pacing/economy/recruitment/fairness/adaptation,
manual-idle/retry, remaining Hell/endgame and integrated gates/review/soak/later
owner playtest remain. Browser works; CI excluded; no pending answer/external
blocker. Root retains human2/required packet through umbrella review and owns
eventual cleanup/release; no agents/install/commit/push/publication.

## 2026-11-03 — Stealth badge localization fixed and verified

[P16 evidence](evidence/p16-stealth-label.md): BUG657 locally fixed in retained
uncommitted human2 source. The visible badge uses the selected settings locale
without duplicate CSS text. Both desktop/mobile Chromium cases pass live
en→zh-CN→en, save/reload, imagery/color rules and toggle off; scoped strict
types/lint pass. Four final captures inspected; no browser warnings/errors or
overflow. Original RED/final hashes retained. Recorded processes absent; exact
owned config/cache removed and absence verified. No campaign, broad suite or
seed search rerun. Previous goal turn was status-only/no progress; this closes
the verified implementation slice. F15/G5/private v1 remain open; intended
five-act completions stay three and formal balance 0/210. Next retained-output
Act IV throughput analysis or unfinished implementation, without renewed attempts.
Root retains human2/required evidence through umbrella review and owns eventual
cleanup/release. Browser works; CI excluded; no pending answer.

## 2026-11-03 — Intended Double Throw Act IV failed checkpoint verified

[Double Throw Act IV](../balance/2026-11-03-double-throw-act4-checkpoint.md)
retains 47/677 → 49/709 after 29 training admissions and three Plains attempts.
189 waves settle 186 victories/three Izual draws; 8,556/9,657/4,863 boss Life
remain at 60 seconds. Hero/Prayer survive and hero mana never falls below 450
of 462. No Act IV clear/claim or Act V. Attempts 706–708 stay exhausted.
First frozen readback/nine controls, scoped strict types/lint/preflight and
closure pass complete native custody/economy/points/quests/party/clocks/seeds/
ordinals. All source/profile and previous costs/failures retained. Cumulative
709 admissions / 39755773.739506066 combat ms / 418008.614374
driver ms / 446020.7703576889 measured execution ms. BUG656 records
the progression failure without an established engine defect or accepted fix.
Prefix `p15-throw-earned-act4-v1` in retained root packet. Recorded processes absent;
exact owned config/cache removed and config archived. This turn completes Act
III and retains the Act IV failure. Next retained-evidence throughput analysis
or other unfinished implementation, without route replay or renewed limits.
Intended five-act completions stay three; formal 0/210 and private v1 open.
Browser works; CI excluded; no pending answer/external blocker. Root retains
human2/evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Double Throw Act III completion verified

[Double Throw Act III](../balance/2026-11-03-double-throw-act3-completion.md)
continues 32/452 → 47/677. Five first-attempt routes,
11 quest actions/two claims and 1,303 victories across
225 admissions reconcile. No nonwin, interruption or unplayed suffix.
First frozen readback/nine negative controls, scoped strict types/explicit lint/
preflight and closure pass exact native save/custody/economy/points/quests/Prayer/
clocks/seeds/ordinals and direct authored level projection. All production and
campaign inputs/profile unchanged; all prior costs/two defeats retained.
Cumulative 677 admissions / 37199630.93268039 combat ms /
389643.899585 driver ms / 412048.7811497878 measured execution ms.
Prefix `p15-throw-earned-act3-v1` in retained root packet. Recorded processes absent;
exact owned config/cache removed and config archived. Previous goal turn was
status-only/no progress; this turn completes unfinished Act III. Next Act IV
from this exact save; no completed-route replay or renewed limits. Intended
five-act completions remain three; formal balance 0/210/full private v1 open.
Browser works; CI excluded; no pending question. Root retains human2 and required
evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Double Throw Act II completion verified

[Double Throw Act II](../balance/2026-11-03-double-throw-act2-completion.md)
continues the accepted 13/118 save to 32/452. Six first-attempt area clears,
21 quest actions/five claims, 334 admissions and 1,675 victories reconcile;
no new nonwin, interruption or unplayed suffix. Initial Den preparation uses17
admissions and area preparation311. First frozen readback/nine negative controls,
scoped strict types/explicit lint/preflight and closure pass exact native save,
ordered custody/economy/points/quests/Prayer/clocks/seeds/ordinals. Current
2,151production/131campaign inputs and accepted profile stay unchanged; source
drift since parent and all previous costs/two defeats remain retained.
Cumulative452admissions/22,406,714.358076118combat ms/222,027.030922driver ms/
239,302.97046690248measured execution ms. Prefix `p15-throw-earned-act2-v1`
in root packet; recorded processes absent and exact owned cache/config removed.
Previous turn was status-only/no progress; this turn completes unfinished Act II.
Next Throw Act III from this save; no completed-route replay or renewed limits.
Intended five-act completions remain three; formal0/210/full privatev1 open.
Browser works/CI excluded/no pending question. Root retains human2 and required
evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Changed import-error flow verified at all five required sizes

[Save-import evidence](evidence/p03-import-dialog-errors.md) now records six
additional Chromium passes, en/zh-CN ×412×915/640×360/1920×1080,59.883s. Together
with the four prior360×640/1280×800 cases:10/10 at one unchanged source manifest.
Native failed/retry/valid import, complete export/stored-save identity, reload,
AX feedback/focus/Escape and no console/page errors or horizontal overflow pass.
All six new screenshots inspected; landscape uses the modal's existing scroll
area and ordinary retries remain reachable. No broad suite or campaign replay.
Exact new processes absent; server closed; isolated cache/generated config
removed, config archive/reports/captures retained by root. Save-import bug and
evidence closeout is complete. Full G1/G5 and private v1 remain open; intended
five-act completions remain three. Next return to eligible unfinished campaign
or feature work without renewing spent preparation/diagnostic budgets.

## 2026-11-03 — Save-import error, focus and mobile overlap fixes verified

[Evidence](evidence/p03-import-dialog-errors.md): BUG653/654/655 fixed in
retained uncommitted human2 source. Rejected imports show localized in-dialog
feedback, retain exact retry input, restore keyboard focus/Escape and suppress
background notices over modal controls. 31/31 affected unit tests and 4/4 real
Chromium cases pass (en/zh-CN ×1280×800/360×640), plus scoped strict types and
explicit lint. Final screenshots inspected; exact source manifest/failures
retained. Exact owned processes absent; generated configs/cache removed, archives
retained under root custody. Previous goal turn was status-only/no progress;
this closes the verified implementation slice without rerunning tests.
Martial diagnostic is closed with zero candidate battles; timestamp mismatch
establishes no gameplay fix and grants no new attempts. Intended five-act
completions stay three; full private v1/formal balance acceptance remain open.
Next check the changed dialog at the other required sizes, then continue open
implementation/acceptance without replaying completed campaign preparation.
Browser works; CI excluded; no pending user question.

## 2026-11-03 — Intended Martial Act III clear and Act IV failed checkpoint verified

[Act III](../balance/2026-11-03-martial-act3-completion.md) completes 32/450 →
47/675. [Act IV](../balance/2026-11-03-martial-act4-checkpoint.md) then retains
49/708: 30 cleared-Travincal training admissions and three Plains attempts,
191 victories/three draws. First two reach Izual (16,277/22,029 Life remain);
third draws before Izual (one Pit Lord, 3,595 Life). No Act IV clear/claim or
Act V. Attempts 705–707 stay exhausted. Both frozen V1/nine-control readbacks,
scoped strict types/explicit lint/preflight and closure pass native save/
custody/economy/points/quests/Prayer/clocks/seeds/ordinals. All 2,151 production/
131 campaign inputs unchanged. Cumulative 708 admissions / 46,637,513.68641636
combat ms / 467,142.31882999995 driver ms / 496,822.3220668733 measured execution
ms; all prior costs/failures retained. Prefixes `p15-martial-earned-act3-v1`
and `p15-martial-earned-act4-v1` in retained root packet. Recorded processes
absent and exact configs/caches removed. [BUG652](../../production/bugs/BUG-652-martial-act4-throughput.md)
records throughput failure; retained outputs do not establish an engine defect
or accepted priority correction. Previous turn was status-only/no progress;
this turn clears unfinished Act III and establishes the Act IV failure.
Next investigate BUG652 or another eligible unfinished slice without replay,
renewed attempts or rejected ordering experiments. Intended five-act
completions stay three; full private v1 incomplete/formal 0/210. Browser works/
CI excluded/no pending question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Martial Assassin Act III completion verified

[Completion](../balance/2026-11-03-martial-act3-completion.md): exact level 32 /
next 450 → level 47 / next 675. All five first-attempt routes, 11 quest actions
and two claims reconcile; 225 admissions settle 1,303 victories, including
220 area-training admissions. No new hero nonwin, interruption or unplayed
suffix. First frozen V1/nine-negative-control readback, scoped strict types,
explicit lint/preflight and closure pass native save/custody/economy/points/
quests/Prayer/party/clocks/seeds/ordinals. All 2,151 production/131 campaign
inputs remain unchanged; all prior costs/defeat and historical parent manifest
supplement remain retained. Cumulative 675 admissions / 43,575,481.840487204
combat ms / 436,505.97375699994 driver ms / 461,071.15981401876 measured
execution ms. Prefix `p15-martial-earned-act3-v1` in retained root packet.
Recorded processes absent; exact owned config/cache removed. Previous turn
was status-only/no progress; this turn completes unfinished Act III without
replay or renewed limits. Intended five-act completions stay three; full
private v1 incomplete/formal 0/210. Next Martial Act IV from this checkpoint.
Browser works/CI excluded/no pending question. Root retains human2/required
evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Martial Assassin Act II completion verified

[Completion](../balance/2026-11-03-martial-act2-completion.md): exact level 13 /
next 117 → level 32 / next 450. All six first-attempt routes, 21 quest actions
and five claims reconcile; 333 admissions settle 1,670 victories with no new
hero nonwin, interruption or unplayed suffix. Existing preparation earns 14
in 17 cleared-Den admissions; area training uses 310 admissions. First frozen
V1/nine-negative-control readback, scoped strict types/explicit lint/preflight
and closure pass exact native save/ordered custody/economy/points/quests/Prayer/
party/clocks/seeds/ordinals. Current 2,151 production/131 campaign inputs remain
unchanged; parent manifest omission/supplement and all prior costs/defeat remain
retained. Cumulative 450 admissions / 25,671,253.404201154 combat ms /
250,006.92555199997 driver ms / 269,242.6641259808 measured execution ms.
Prefix `p15-martial-earned-act2-v1` in root packet. All recorded processes absent;
exact owned config/cache removed. Previous goal turn was status-only/no progress;
this turn completes one unfinished intended act without replay or renewed limits.
Intended five-act completions remain three; full private v1 incomplete/formal
0/210. Next Martial Act III from this accepted checkpoint or another eligible
unfinished slice. Browser works/CI excluded/no pending question. Root retains
human2/required evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Traps Act IV failure retained; late allocation fixed

[Checkpoint](../balance/2026-11-03-traps-act4-checkpoint.md):47/685→49/717,
29training admissions/three Plains attempts,186victories/three Izual draws.
No Act IV clear/claim or Act V. All attempts714–716 remain exhausted; source,
exact save/custody/economy/clocks/seeds and all prior costs are retained.
Cumulative717admissions/15,749,076.250241295combatms/
345,847.25561399997driverms/375,821.64241885766reserved executionms.

[BUG651 result](../balance/2026-11-03-traps-late-blade-allocation.md): append
Blade20 after existing campaign targets. Seven affected cases and scoped
strict types/explicit lint pass; original external diagnostic type failures
retained and fixed before battle. One retained first Izual control matches
all events/final fields; candidate spends five native points, Blade8→13,
and wins in46.478logical seconds versus the60second draw. Zero campaign
admissions/rewards, seed searches or retry renewals. All2,151production
inputs unchanged; exactly two of131campaign inputs change. Single diagnostic
launch5,170.862ms. Closure verifies all recorded processes absent and exact
owned config/cache removed; required packet/human2 retained by root through
umbrella review with root owning eventual cleanup/release.

Previous goal turn was a status report/no implementation progress; this turn
completes the bounded correction/evidence. Intended five-act completions stay
three; formal0/210 and full privatev1 remain incomplete. Next unfinished
implementation or eligible retained checkpoint; no exhausted budget renewal.
Browser works; CI excluded; no pending answer/external blocker.

## 2026-11-03 — Intended Traps Assassin Act III completion verified

[Completion](../balance/2026-11-03-traps-act3-completion.md): exact 32/461 → 47/685;
5 routes/11 quest actions/2 claims reconcile. 224 admissions,
1,298 settled waves, 219 area-training entries/0 initial preparation.
Outcomes `{"victory": 1298}`; 0 unplayed staged waves.
First frozen V1/nine-negative-control readback, scoped types/driver lint/
preflight and closure pass exact native save/custody/economy/points/quests/
Prayer/party/clocks/seeds/ordinals. All production/campaign source unchanged;
all previous costs and original Act I staged suffixes retained. Cumulative
costs `{"admissions": 685, "combatMs": 14612692.278754532, "driverWallMs": 322918.08175199997, "executionWallMsReserved": 347895.1564079616}`.
Prefix `p15-traps-earned-act3-v1` in retained root packet. All recorded processes absent;
exact config/cache removed. Previous goal turn was status-only/no progress;
this turn continues an unfinished intended build without replay or renewed
spent limits. Full private v1 incomplete; formal balance0/210. Browser works/
CI excluded/no pending question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Traps Assassin Act II completion verified

[Completion](../balance/2026-11-03-traps-act2-completion.md): exact 12/107 → 32/461;
6 routes/21 quest actions/5 claims reconcile. 354 admissions,
1,759 settled waves, 312 area-training entries/36 initial preparation.
Outcomes `{"victory": 1759}`; 0 unplayed staged waves.
First frozen V1/nine-negative-control readback, scoped types/driver lint/
preflight and closure pass exact native save/custody/economy/points/quests/
Prayer/party/clocks/seeds/ordinals. All production/campaign source unchanged;
all previous costs and original Act I staged suffixes retained. Cumulative
costs `{"admissions": 461, "combatMs": 8766496.088098293, "driverWallMs": 190462.096252, "executionWallMsReserved": 210190.8013438806}`.
Prefix `p15-traps-earned-act2-v1` in retained root packet. All recorded processes absent;
exact config/cache removed. Previous goal turn was status-only/no progress;
this turn continues an unfinished intended build without replay or renewed
spent limits. Full private v1 incomplete; formal balance0/210. Browser works/
CI excluded/no pending question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Summon Druid Act IV checkpoint verified

[Checkpoint](../balance/2026-11-03-summon-druid-act4-checkpoint.md): exact
47/685 → 49/717; 29 cleared-Travincal training entries and three Plains route
attempts settle 186 victories/three Izual draws. Hero survives; Izual retains
7,771/2,726/2,094 Life. No Act IV clear/claim and no Act V. All three attempts
remain exhausted. First frozen V1/nine-negative-control readback reconciles
exact native save/custody/economy/points/quests/Prayer/party/clocks/seeds/ordinals;
scoped checks/closure pass, all production/campaign source unchanged, all
recorded processes absent and exact config/cache removed. Prefix
`p15-summon-druid-earned-act4-v1` in retained root packet. Cumulative717admissions/
15,823,158.857719941combatms/479,174.35286driverms/589,786.7728180718reserved
executionms retains original costs and staged suffixes. No implementation
bug established or gameplay fix applied. Previous goal turn was status-only/
no progress; next advance an unfinished intended build from its accepted save
while preserving this failed checkpoint. Intended five-act completions remain
three; full private v1 incomplete/formal0/210. Browser works/CI excluded/no
question. Root retains human2/required evidence through umbrella review and
owns eventual cleanup/release.

## 2026-11-03 — Intended Summon Druid Act III completion verified

[Completion](../balance/2026-11-03-summon-druid-act3-completion.md): exact 32/461 → 47/685;
5 routes/11 quest actions/2 claims reconcile. 224 admissions,
1,298 settled waves, 219 area-training entries/0 initial preparation.
Outcomes `{"victory": 1298}`; 0 unplayed staged waves.
First frozen V1/nine-negative-control readback, scoped types/driver lint/
preflight and closure pass exact native save/custody/economy/points/quests/
Prayer/party/clocks/seeds/ordinals. All production/campaign source unchanged;
all previous costs and original Act I staged suffixes retained. Cumulative
costs `{"admissions": 685, "combatMs": 14733385.60553675, "driverWallMs": 445912.48099199997, "executionWallMsReserved": 551143.5449689161}`.
Prefix `p15-summon-druid-earned-act3-v1` in retained root packet. All recorded processes absent;
exact config/cache removed. Previous goal turn was status-only/no progress;
this turn continues an unfinished intended build without replay or renewed
spent limits. Full private v1 incomplete; formal balance0/210. Browser works/
CI excluded/no pending question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Summon Druid Act II completion verified

[Completion](../balance/2026-11-03-summon-druid-act2-completion.md): exact 12/107 → 32/461;
6 routes/21 quest actions/5 claims reconcile. 354 admissions,
1,759 settled waves, 312 area-training entries/36 initial preparation.
Outcomes `{"victory": 1759}`; 0 unplayed staged waves.
First frozen V1/nine-negative-control readback, scoped types/driver lint/
preflight and closure pass exact native save/custody/economy/points/quests/
Prayer/party/clocks/seeds/ordinals. All production/campaign source unchanged;
all previous costs and original Act I staged suffixes retained. Cumulative
costs `{"admissions": 461, "combatMs": 9127816.652512385, "driverWallMs": 250860.45287899996, "executionWallMsReserved": 350993.93158289604}`.
Prefix `p15-summon-druid-earned-act2-v1` in retained root packet. All recorded processes absent;
exact config/cache removed. Previous goal turn was status-only/no progress;
this turn continues an unfinished intended build without replay or renewed
spent limits. Full private v1 incomplete; formal balance0/210. Browser works/
CI excluded/no pending question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Fire Druid five-act completion verified

[Act V completion](../balance/2026-11-03-fire-druid-act5-completion.md): exact
61/910 → 82/1171; all five routes clear first attempt, all eight Throne/Baal
waves, 19 actions/five claims, Slayer of Baal title and native Nightmare unlock
reconcile. 261 admissions / 1,645 victories / 256 training entries; no hero
nonwin, interruption or unplayed suffix. Three mercenary deaths/nine waves
without the merc remain recorded. Scoped types/driver lint/preflight and first
frozen V1/nine-negative-control readback pass exact native save/custody/economy/
points/quests/Prayer/party/clocks/seeds/ordinals. All2,151production/131campaign
inputs unchanged. Closure/prefix `p15-fire-druid-earned-act5-v1` in root packet
verifies all recorded processes absent and exact config/cache removed. All
earlier costs and original defeat/recovery retained. Previous goal turn was
status-only/no progress; this continuation closes Act III and completes earned
Acts IV–V. Current intended five-act completions now three: Corpse/Bone, Summon
Necromancer and Fire Druid. Next another unfinished intended build from its
retained checkpoint; exhausted limits stay closed. Intended all-area coverage,
populations/holdouts, economy/fairness/pacing, idle/retry, performance, earned
endgame and final review remain open; full v1 incomplete/formal0/210. Browser
works/CI excluded/no question. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Fire Druid Act IV completion verified

[Completion](../balance/2026-11-03-fire-druid-act4-completion.md): exact
47/685 → 61/910; all three first-attempt routes/13 quest actions/three claims,
225 admissions, 1,224 victories and 222 training entries. No nonwin,
interruption or unplayed suffix. Scoped types/driver lint/preflight and first
frozen V1/nine-negative-control readback pass exact native save/custody/economy/
points/quests/Prayer/clocks/seeds/ordinals. All2,151production/131campaign inputs
unchanged. Closure/prefix `p15-fire-druid-earned-act4-v1` in root packet verifies
every recorded process absent and exact config/cache removed. All earlier
costs and original defeat/recovery retained. This continuation closes Act III
and completes unfinished Act IV. Next Fire Druid Act V61/910. Full private v1
incomplete; formal0/210. Browser works/CI excluded/no question. Root retains
human2/required evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Fire Druid Act III completion verified

[Completion](../balance/2026-11-03-fire-druid-act3-completion.md): exact
32/461 → 47/685; all five routes clear first attempt, all 11 quest actions and
two claims complete. 224 admissions / 1,298 victories / 219 training entries;
no nonwin, interruption, mercenary death or unplayed suffix. Scoped types,
explicit driver lint, preflight and first frozen V1/nine-negative-control
readback reconcile exact save/custody/economy/points/quests/Prayer/clocks/seeds/
ordinals. All 2,151 production/131 campaign inputs unchanged. Closure verifies
recorded processes absent and exact temporary config/cache removed. Prefix
`p15-fire-druid-earned-act3-v1` in retained root packet; all prior costs and
original defeat/recovery retained. Previous goal turn was status-only/no
progress; this continuation closes the completed Act III evidence. Next earned
Fire Druid Act IV47/685. Full private v1 incomplete; formal0/210. Browser works,
CI excluded, no question pending. Root retains human2/required evidence through
umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Fire Druid Act II completion verified

[Completion](../balance/2026-11-03-fire-druid-act2-completion.md): exact
12/109 → 32/461; all six first-attempt routes/21 quest actions, 352 admissions,
1,751 victories, 34 initial and 312 area-training entries. No nonwin,
interruption or unplayed suffix. Scoped types/lint/preflight and first frozen
V1/nine-negative-control readback pass exact native save/custody/economy/
points/quests/Prayer/clocks/seeds/ordinals. Current 2,151 production/131 campaign
inputs remain unchanged; current tree hash incorporates the tooling repair.
Initial no-gameplay freeze pathname mistake and correction are preserved.
All recorded processes terminal; exact temporary config/cache absent. Closure
and evidence prefix `p15-fire-druid-earned-act2-v1` in retained root packet.
Original defeat/recovery, all costs and administrative Act I wrapper120s remain
carried. Previous goal turn was status-only/no progress; this continuation
completes unfinished earned Act II. Next Fire Druid Act III32/461. Full private
v1 incomplete; formal0/210. Browser works; CI excluded; no question pending.
Root retains human2/required evidence through umbrella review and owns eventual
cleanup/release.

## 2026-11-03 — Tooling typecheck coverage repaired

[BUG-650](../../production/bugs/BUG-650-tooling-typecheck-project-coverage.md):
current tooling check reproduced four ES5/composite-membership errors; ES2022
and three explicit imported-script entries resolve them. Strict/composite
checks remain; standard `typecheck` now checks app and tooling. Scoped tooling
RED exit2/1.950s → GREEN exit0/1.906s; temporary compiler metadata removed.
BUG-089's already-fixed worker-setting report is reconciled. No gameplay edit,
campaign replay or broad suite. RED/GREEN receipts use prefix
`p19-tooling-types-v1` in the retained root packet. Previous turn was status-only
(no progress); this continuation fixes a current validation defect. Combined
source gates and the full private v1 remain open. Root retains worktree/evidence
through umbrella review and owns eventual cleanup/release; no question pending.

## 2026-11-03 — Intended Summon Necromancer Act V completion verified

[Completion](../balance/2026-11-03-summon-necro-act5-completion.md): exact
61/902 → 82/1163; all five routes clear first attempt, including eight
Throne/Baal waves. All 19 actions/five claims, Slayer of Baal title and native
Nightmare unlock reconcile. 261 admissions / 1,644 victories / 256 training
entries; no nonwin, interruption or unplayed suffix. Scoped types, explicit
driver lint, preflight and first frozen V1/nine-negative-control readback pass
exact save/custody/economy/points/quests/Prayer/party/clocks/seeds/ordinals.
All 2,151 production / 131 campaign inputs remain unchanged; no completed-route
verification replay or unrelated suite. All recorded processes terminal; exact
config/cache absent. Closure/evidence prefix `p15-summon-necro-earned-act5-v1`
in the retained root packet. Cumulative 1,163 admissions / 50,824,013.21973416
combat ms / 847,807.1093840001 driver ms / 963,595.2252938878 execution ms
reserved retains every earlier cost and the original Act I administrative120s
reservation. Previous turn was a verified live wait; this continuation completes
the retained Act V run. F12's stale guaranteed-kill baseline is also corrected:
current map farming uses native combat playback; broader idle acceptance stays
open. Root retains human2/required evidence through umbrella review and owns
eventual cleanup/release. Remaining intended populations, economy/fairness/
pacing, idle/retry, performance, earned endgame and final review stay open.
Full private v1 incomplete; formal 0/210. Browser works; CI excluded; no question.

## 2026-11-03 — Intended Summon Necromancer Act IV completion verified

[Completion](../balance/2026-11-03-summon-necro-act4-completion.md): exact
47/677 → 61/902; all three first-attempt routes and 13 quest actions complete,
225 admissions / 1,224 victories / 222 training entries. No nonwin,
interruption or unplayed suffix. Scoped types, explicit driver lint, preflight
and first frozen V1 readback with nine negative admission controls pass.
Exact native save, ordered custody, economy/points/quests/Prayer/living-party,
clocks/seeds/ordinals and authored level projection reconcile. All 2,151
production / 131 campaign inputs remain unchanged. No earlier route replay or
unrelated suite. All recorded processes terminal; exact config/cache absent.
Evidence/closure prefix `p15-summon-necro-earned-act4-v1` in the retained root
packet. Cumulative 902 admissions / 34,190,790.51263562 combat ms /
574,821.614406 driver ms / 685,398.2875118963 execution ms reserved includes
the unknown historical Act I wrapper's administrative 120-second reservation.
Previous goal turn was status-only/no progress; this continuation completes
and verifies unfinished Act IV. Next earned Summon Act V from exact 61/902.
Root retains human2 and required evidence through umbrella review and owns
eventual cleanup/release. Full private v1 incomplete; formal 0/210. Browser
works, CI excluded, no question.

## 2026-11-03 — Intended Summon Necromancer Act III completion verified

[Completion](../balance/2026-11-03-summon-necro-act3-completion.md): exact
32/452→47/677; all five first-attempt routes/11quest actions,225admissions,
1,303victories and220training entries, no nonwin/interruption/unplayed suffix.
Scoped types/lint/preflight and first frozen V1/nine-negative-control readback
pass exact save/custody/economy/points/quests/Prayer/party/clocks/seeds/ordinals.
All2,151production/131campaign inputs unchanged; no earlier route replay or
unrelated suite. Processes terminal, exact config/cache absent; evidence/closure
prefix `p15-summon-necro-earned-act3-v1` in retained root packet. All costs,
including the unknown historical Act I wrapper's administrative120s reservation,
remain carried. Previous goal turn verified a live wait; this turn reconciles
Act II and Act III completion. Next earned Summon Necromancer Act IV47/677.
Root retains human2/required evidence through umbrella review and owns eventual
cleanup/release. Full privatev1 incomplete; formal0/210; browser works,
CI excluded, no question.

## 2026-11-03 — Intended Summon Necromancer Act II completion verified

[Completion](../balance/2026-11-03-summon-necro-act2-completion.md): exact
13/115→32/452; all six first-attempt routes/21 quest actions, 337 admissions,
1,687 victories, 20 initial and 311 area-training entries. No nonwin,
interruption or unplayed suffix. Scoped types/lint/preflight and first frozen
V1/nine-negative-control readback pass exact native save/custody/economy/
points/quests/Prayer/party/clocks/seeds/ordinals. All 2,151 production/131
campaign inputs unchanged. Original Catacombs defeat/recovery and prior
costs remain retained; the unknown historical wrapper uses the explicit
120s administrative reservation, not measured pacing evidence. Processes
terminal, exact config/cache absent; evidence/closure prefix
`p15-summon-necro-earned-act2-v1` in the retained root packet. Previous goal
turn was a verified wait on session 21672/live native child; this turn captures
and reconciles completion. Next earned Summon Necromancer Act III32/452.
Root retains human2/required evidence through umbrella review and owns eventual
cleanup/release. Full private v1 incomplete; formal0/210; browser works,
CI excluded, no pending question.

## 2026-11-03 — Intended Bow target-rank volley priority corrected locally

[Decision and evidence](decisions/P15-intended-bow-target-volley-priority-v1.md):
BUG-649's exact retained control reproduces the Plains training draw. The sole
frozen order candidate wins in 57.794 seconds, hero 1,109 life / 322 mana.
Only intended Bow opts into volley promotion after its maximum declared rank
investment completes; the early Magic Arrow bridge and support order remain.
Two genuine RED cases then pass; all 30 selected regressions, scoped strict
TypeScript and explicit four-file lint with zero warnings pass. No completed
route replay or broad suite ran.

Final closure `p15-bow-target-volley-policy-v1-closure.json` in the retained
root packet verifies all 2,151 production inputs unchanged, exactly four
campaign paths changed, native successor 51 / next 908 unchanged, 22 recorded
process observations absent and exact temporary configs/cache removed. River's
200-entry allowance and every prior cost remain spent. One conditional training
wave win earns no route clear or formal balance acceptance (0/210). Initial
filter/fixture/ignored-lint setup mistakes and corrected checks are retained;
none of those inadequate results counts as a pass.

Previous goal turn was status-only/no progress; this continuation diagnoses and
corrects a campaign setup defect. Full private v1 remains incomplete. Root
retains human2/required evidence through umbrella review and owns eventual
cleanup/release. Next: continue another unfinished intended build from its
retained Act I successor, without replay or renewal of exhausted routes.
Browser works; CI excluded; no pending user question.

## 2026-11-03 — Intended Bow Act IV bounded failure verified

[Checkpoint](../balance/2026-11-03-bow-act4-checkpoint.md): 47/675→51/908;
Izual third-attempt clear/Fallen Angel Claim, River preparation 200 exhausted,
Hellforge/Diablo unattempted. 233 admissions settle 1,218 victories/three draws;
230 training entries include 172 legacy Dark Wood fallback admissions. First
frozen V1/nine-negative-control readback passes exact native save/custody/
economy/points/quests/party/clocks/seeds/ordinals. All 2,151 production/131
campaign inputs unchanged; processes terminal, exact config/cache absent.
All spent costs and attempts stay closed. Evidence/closure prefix
`p15-bow-earned-act4-v1` in retained root packet. Previous goal turn captured the
terminal result and reported status; this continuation reconciles and documents
it. Next: retained-input diagnosis, no native retry. Full private v1 incomplete;
formal 0/210; browser works/CI excluded/no pending question. Root retains human2/
required evidence through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Bow Act III completion verified

[Completion](../balance/2026-11-03-bow-act3-completion.md): exact32/450→47/675;
all five first-attempt routes/11quest actions,225admissions/1,303victories and
220training entries, no nonwin/interruption/unplayed suffix. Scoped types/lint/
preflight pass. Original frozen V1 reader exposes optional-aura indexing defect
BUG-648 before journal processing; preserved failure and V2 amendment then pass
exact save/ordered custody/economy/points/quests/Prayer/party/clocks/seeds/ordinals
and nine negative controls without combat replay. All2,151production/131campaign
inputs unchanged. Processes terminal, exact temporary config/cache absent;
closure/evidence prefix `p15-bow-earned-act3-v1` in retained root packet. Previous
goal turn was status-only/no progress; this continuation completes Act III and
fixes the verifier. Next earned Bow Act IV47/675, exact measured prior costs
retained. Root retains human2/required evidence through umbrella review and owns
cleanup/release. Full privatev1 incomplete; formal0/210. Browser works; CI excluded;
no pending question.

## 2026-11-03 — Intended Bow Act II completion verified

[Completion](../balance/2026-11-03-bow-act2-completion.md): exact level13/next117
continues to32/next450. All six first-attempt routes and21quest actions complete;
333admissions settle1,670victories, with17initial/310area-training entries and
no nonwin/interruption/unplayed suffix. Scoped types/lint/preflight and first
frozen V1 readback pass exact native save/ordered custody/economy/points/quests/
party/clocks/seeds/ordinals and nine negative admission controls. All2,151
production/131campaign inputs unchanged; canonical Bow profile identical to
parent. No gameplay edit, earlier route replay or unrelated tests. Exact config/
cache absent, all recorded processes terminal; evidence/closure prefix
`p15-bow-earned-act2-v1` in retained root packet. Prior goal turn was status-only;
this turn completes and verifies the unfinished Act II route. Next earned Bow
Act III32/450, preserving exact measured prior wrapper costs. Root retains human2/
required evidence through umbrella review and owns eventual cleanup/release.
Full private v1 incomplete; formal0/210. Browser works; CI excluded; no question.

## 2026-11-03 — Intended Holy Bolt target-rank priority corrected locally

[Decision and evidence](decisions/P15-intended-holy-bolt-signature-priority-v1.md):
BUG-647's exact retained control reproduces the Plains training draw. The sole
frozen order candidate wins in 36.054 seconds, hero 1,049 life / 540 mana.
Only intended Holy Bolt opts into signature promotion after its declared rank
investment completes; the early Hammer bridge remains. Two genuine RED cases
then pass; all 23 selected regressions, scoped strict types and four-file lint
pass. No completed-route replay or broad test suite ran.

Final closure `p15-holy-bolt-signature-policy-v1-closure.json` in the retained
root packet verifies all 2,151 recorded production inputs unchanged, exactly
four campaign paths changed, native successor 52 / next 906 unchanged, all
recorded child processes absent and exact temporary configs/cache removed.
River's 200-entry allowance and every prior cost remain spent. One conditional
training-wave win earns no route clear or formal balance acceptance (0/210).
Root retains human2/required evidence through umbrella review and owns eventual
cleanup/release. Previous goal turn was status-only; this turn completes a
bounded diagnosis and profile correction. Full private v1 remains incomplete.
Next: locate the intended Bow Act I successor and prepare only its unfinished
Act II continuation, preserving its original history and costs. Browser works;
CI excluded; no pending user question.

## 2026-11-03 — Intended Holy Bolt Act IV bounded failure verified

[Checkpoint](../balance/2026-11-03-holy-bolt-act4-checkpoint.md):47/675→52/906;
Izual first-attempt clear/Fallen Angel Claim, River preparation200exhausted,
Hellforge/Diablo unattempted.231admissions settle1,212victories/one Plains draw
at736/wave4; legacy fallback then169Dark Wood entries. Scoped checks and first
frozenV1/nine-negative-control readback pass exact native save/custody/economy/
points/quest/party/clocks/seeds/ordinals; all2,151production/131campaign inputs
unchanged. All costs/failed allowances stay spent. Processes terminal, exact
config/cache absent; closure in retained root packet, prefix
`p15-holy-bolt-earned-act4-v1`. Next retained-input diagnosis, no native retry.
Previous goal turn completed a live-process observation and captured the terminal
failure; this continuation reconciles and documents it. Fullv1 incomplete,
formal0/210; browser works/CI excluded/no pending question. Root retains human2/
evidence through umbrella review and owns cleanup/release.

## 2026-11-03 — Intended Holy Bolt Act III completion verified

[Completion](../balance/2026-11-03-holy-bolt-act3-completion.md): exact32/450
to47/next675; all five first-attempt routes/11quest actions,225admissions,
1,303victories and220training entries, no nonwin/unplayed suffix. Scoped
types/lint/preflight and first frozen V1 readback pass exact native-save,
ordered custody/economy/points/quests/Prayer/party/clocks/seeds/ordinals plus nine
negative admission controls. All2,151production/131campaign inputs unchanged;
no gameplay/profile edit, earlier route replay or unrelated tests. Exact config/
cache absent, recorded processes terminal; evidence/closure prefix
`p15-holy-bolt-earned-act3-v1` in root packet. Prior goal turn verified a live
process wait; this continuation captures terminal result and independently
reconciles completion. Next earned Holy Bolt Act IV47/675, original costs and
unknown-wrapper bookkeeping reservation retained. Root retains human2/packet
through umbrella review and owns cleanup/release. Full privatev1 incomplete;
formal0/210; browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Holy Bolt Act II completion verified

[Completion](../balance/2026-11-03-holy-bolt-act2-completion.md): prior13/next115
to25/next341 checkpoint is reconciled by retained V2 reader amendment; one final
unadmitted preparation attempt keeps205 counters for204 actual area-training
admissions. Exact25/341 continuation reaches32/next450: Lost City/Arcane/Duriel
first-attempt clears finish all6areas/21quest actions. The109 new admissions
settle606 victories, no nonwin or unplayed suffix. Prior205training counters
stay spent;311 cumulative counters/310 actual admissions. Scoped types/lint/
preflight and prospectively frozen finish V1 readback pass native-save/custody/
economy/points/quest/aura/party/clock/seed/ordinal reconciliation, including nine
negative accounting controls. All2,151production/131campaign inputs unchanged;
no gameplay/profile edit, earlier route replay or unrelated tests. Exact cache/
config absent and processes terminal. Evidence/closures use
`p15-holy-bolt-earned-act2-v1` and `p15-holy-bolt-earned-act2-finish-v1` in root
packet. Next earned Holy Bolt Act III from32/450, all original costs retained,
including explicitly unmeasured historical wrapper reservation. Previous goal
turn was status-only/no progress; this continuation completes and verifies the
remaining Act II route. Root retains human2/packet through umbrella review and
owns cleanup/release. Full privatev1 incomplete; formal0/210. Browser works/CI
excluded/no pending question.

## 2026-11-03 — Intended Zeal owned-weapon remedy rejected

[Comparison](../balance/2026-11-03-zeal-owned-weapon-comparison.md): exact retained
control plus one native owned polearm candidate; IzualHP10,118→2,415, still60s
draw. Candidate rejected; no profile/gameplay fix, earned clear or renewed
attempts. V1 setup failed before battle; V2 prospectively permits both native
regen fields. Scoped types/lint/preflight pass, all2,151production/131campaign
inputs authenticate unchanged. Processes terminal, exact config/cache absent.
Root retains `p15-zeal-physical-weapon-v2` packet/closure through umbrella review.
Static Zeal damage/timing inspection establishes no engine defect; no additional
gear/order candidate on this snapshot. Next: another required intended-build
progression/implementation task. Previous goal turn consumed terminal checks and
removed exact disposable config; this continuation closes the rejected diagnostic.
Full privatev1 incomplete; formal0/210. Browser works/CI excluded/no question.

## 2026-11-03 — Intended Zeal Act IV failure verified

[Checkpoint](../balance/2026-11-03-zeal-act4-checkpoint.md):47/683 to49/714;
31 admissions,180 victories/three Izual draws,28 training entries, no Act IV
route clears or Claims. All three route attempts remain spent. Scoped checks
and original frozen V1 readback pass; all2,151production/131campaign inputs
unchanged. Processes terminal, exact cache/config absent; required packet prefix
`p15-zeal-earned-act4-v1` includes closure and cumulative original-envelope costs.
Follow-up comparison is now rejected (see current entry); original attempts
and allowances remain spent. Previous turn was status-only/no
progress; this continuation closes the verified evidence and investigates cause.
Root retains human2/packet through umbrella review and owns cleanup/release.
Full private v1 incomplete; formal0/210. Browser works/CI excluded/no question.

## 2026-11-03 — Intended Zeal Act III completion verified

[Completion](../balance/2026-11-03-zeal-act3-completion.md):45/next655 to47/next683;
Mephisto first-attempt clear and Guardian claim finish all5routes/11quest actions.
28new admissions settle168victories, no nonwin or unplayed suffix. Original196
training entries retained;223cumulative. Scoped types/lint/preflight and first
frozenV1 readback pass full native-save/custody/economy/points/quest/aura/party/
clock/seed/ordinal reconciliation. All2,151production/131campaign inputs unchanged.
Processes terminal; exact cache/config absent. Required evidence/closure uses
`p15-zeal-earned-act3-finish-v1` in root packet. Next earned Zeal Act IV from
exact47/next683, all costs carried. Full privatev1 incomplete; formal0/210.
Root retains human2/packet through umbrella review and owns cleanup/release.

## 2026-11-03 — Intended Zeal Act III checkpoint verified

[Checkpoint](../balance/2026-11-03-zeal-act3-checkpoint.md):32/next455 to45/next655;
four first-attempt clears,10/11quest actions,200admissions/1,147victories and no
nonwins. Frozen driver wall bound stops Durance preparation. Original V1 reader,
scoped types/lint/preflight pass; all2,151production/131campaign inputs unchanged.
Resume remaining Mephisto/Guardian from exact45/655;196training entries including
29Durance remain spent. One staged unplayed suffix earns nothing; original
limits/cumulative costs retained. All owned processes terminal; exact cache/config
absent. Required evidence/closure: `p15-zeal-earned-act3-v1` in root packet.
Previous goal turn was status-only/no progress; continuation resumes the next
safe native stage. Root retains human2/packet through umbrella review and owns
cleanup/release. Full privatev1 incomplete; formal0/210. Browser works/CI excluded.

## 2026-11-03 — Intended Zeal Act II completion verified

[Completion](../balance/2026-11-03-zeal-act2-completion.md): exact 27/next386
continues to 32/next455. Arcane/Duriel first-attempt clears finish all six areas
and 21 quest actions. The 69 new admissions produce 404 victories; no nonwin or
unplayed wave. Original 245 training entries remain spent; cumulative 312.
Scoped types/lint/preflight and first frozen V1 readback pass, including native
save, ordered custody, economy/points/quests, Might aura and living-party
continuity. All 2,151 production/131 campaign inputs unchanged. Processes
terminal; exact cache/config absent. Required evidence/closure uses
`p15-zeal-earned-act2-finish-v1` in the root packet. Next earned Zeal Act III
from exact 32/next455, carrying all costs; no completed-route replay. Full
private v1 incomplete; formal 0/210. Root retains human2/packet through umbrella
review and owns eventual cleanup/release. Browser works; CI excluded.

## 2026-11-03 — Intended Zeal Act II partial checkpoint verified

[Checkpoint](../balance/2026-11-03-zeal-act2-checkpoint.md): Zeal 13/next126
continues to 27/next386. Four first-attempt route clears, 16 quest actions and
1,248 victories complete before the frozen driver wall limit stops Arcane
preparation. Original V1 readback passes full native-save/custody/economy/
points/quests/clock/seed/ordinal reconciliation without correction or replay.
Scoped types/lint/preflight pass; 2,151 production/131 campaign inputs unchanged.
Processes terminal; exact cache/config absent. Resume the remaining Arcane/Tomb
routes with prefix16 and priorTraining245, including 37 Arcane entries already
spent. Original costs and limits remain; no reset or earlier route replay.
Required evidence/closure uses `p15-zeal-earned-act2-v1` in the root packet.
Previous goal turn was progress: consumed the terminal run and verified readback.
Full private v1 incomplete; formal 0/210. Root retains human2/packet through
umbrella review and owns eventual cleanup/release. Browser works, CI excluded,
no pending question.

## 2026-11-03 — Current-save serializer rejected and restored

[Trial](../balance/2026-11-03-current-save-serialization-trial.md): direct
serialization median47.828→30.708ms improves35.796%;175affected cases/types/lint
pass. Matched production browser operations preserve full native/public saves,
but mobile reload3232.380→3825.671ms regresses18.355%, failing the frozen gate.
No timing retry. Restore only two exact preimages/remove two new candidate
files; all2151restored production inputs and24archived emitted assets
authenticate. Generic serialization/earlier verified fixes remain unchanged.
All consumers terminal; ten disposable paths absent. Required evidence/closure
retained under`bug592-current-save-stringify-v1`; root owns human2/packet through
umbrella review and eventual cleanup/release. BUG592Open, no delivered gain from
this candidate. All14ActI/main CorpseNormalV/ColdActVpartial/FireActIVpartial/
JavelinActIVpartial/formal0/210 unchanged. Full privatev1 incomplete: later
intended-build progression, economy/fairness/pacing, performance, Hell/endgame
and integrated review remain. Browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Fire learned signature rotation corrected

[Decision](decisions/P15-intended-fire-late-signature-order-v1.md): exact retained
control reproduces the60s draw; the sole frozen candidate wins in19.087s with
hero1115HP/663MP. Exactly two battles, no seed search. Intended Fire now promotes
Meteor > Fire Ball once both are learned, preserving early/opt-out rotation.
Two native-growth RED cases precede the correction; all13selected Fire cases,
scoped strict types and four-file lint pass. Initial overlong fixture-name
failure retained/corrected before genuine RED. Only four campaign files change;
production inputs and genuine Fire52/next914 save remain unchanged. No earned
route clear, replay or renewed River preparation allowance; formal0/210.
Previous goal turn was status-only/no progress; this continuation executes the
comparison and verifies the profile correction. Required evidence uses
`p15-fire-late-signature-order-v1` / `p15-fire-signature-policy-v1` in the retained
root packet. Full privatev1 incomplete; later intended progression, economy/
fairness/pacing, runtime performance, Hell/endgame and integrated review remain.
Root retains human2/packet through umbrella review and owns cleanup/release.

## 2026-11-03 — Intended Fire Act IV partial checkpoint verified

[Checkpoint](../balance/2026-11-03-fire-act4-checkpoint.md): Fire47/685 to52/914;
229 admissions, 1,200 victories and one draw. First-attempt Izual clear and
Fallen Angel claim complete; Hellforge/Diablo never attempted. River's
200-admission preparation allowance is exhausted and stays closed. Original
frozen V1 readback passes full native-save/custody/economy/points/quests/clock/
seed/ordinal reconciliation; 2,151 production/131 campaign inputs unchanged.
Scoped types/lint/preflight pass; all processes terminal and exact cache/config
absent. BUG645 records the retained Izual draw: Fire Ball20 never casts behind
recurring Meteor/Wall/Blaze; one frozen comparison precedes any profile fix.
No source change, replay, policy substitution or renewed training. Previous
status turn was a verified wait on live70446; this turn consumes the terminal
run and reader. Root retains human2/packet through umbrella review and owns
cleanup/release. Full private v1 incomplete; formal0/210 unchanged.

## 2026-11-03 — Intended Fire Act III completion verified

[Completion](../balance/2026-11-03-fire-act3-completion.md): Fire32/next460
continues to47/next685; all five first-attempt routes/11quest actions complete.
225admissions,1,304victories, no nonwin or unplayed wave. Scoped types/lint/
preflight pass. V1 reader stops on the sole advisory date-corrected report
filename; BUG644/newV2 preserves the failure, authenticates every original
artifact and passes full independent custody/economy/points/quests/clock/seed/
ordinal reconciliation without gameplay replay. Eight negative drift guards
pass. All2151production/131campaign inputs unchanged. Original cumulative
costs retained; all owned processes terminal and exact cache/config absent.
Evidence retained under`p15-fire-earned-act3-v1`; root retains human2/packet
through umbrella review. Previous turn was a verified wait on live78069;
this turn consumes terminal result and completes verification. Next earned
FireActIV from47/685. Full privatev1 incomplete; formal0/210 unchanged.

## 2026-11-03 — Intended Fire Act II completion verified

[Completion](../balance/2026-11-03-fire-act2-completion.md): exact31/next443
continues to32/next460;16 training admissions then first-attempt Tomb/Duriel
clear and final Seven Tombs Claim. All six areas/21 actions complete.102 new
victories, no nonwin. Prior297 training admissions remain spent;313 cumulative,
59 Tomb. Scoped types/lint/preflight and first frozenV1 readback pass; all2151
production/131campaign inputs unchanged. Native save/custody/economy/points/
quests/clock/seed/ordinal and retained training reconcile without replay.
All processes terminal, exact cache/config absent; required evidence retained
under`p15-fire-earned-act2-finish-v1`. Previous goal turn was status-only/no
progress; this continuation earns and verifies completion. Next earned Fire
Act III from exact32/next460 with all costs carried. Full privatev1 incomplete;
formal0/210 unchanged. Root retains human2/packet through umbrella review.

## 2026-11-03 — Intended Fire Act II partial checkpoint verified

[Checkpoint](../balance/2026-11-03-fire-act2-checkpoint.md): Fire13→31,
next124→443;319admissions/1,583victories, five first-attempt area clears and
20quest actions. The240-second driver bound stops Tomb preparation; Duriel
never attempted. FrozenV1 reader passes exact export/ordered custody/economy/
points/quests/preparation/clock/seed/ordinal reconciliation without correction
or combat replay. All2,151production/131campaign inputs unchanged. Pre-run
external setup omission corrected: existing native training earns14 before
the Act II controller; no gameplay/profile edit. Scoped types/targeted lint/
preflight pass; original lint resolution failure retained. All processes terminal,
exact cache/config absent; closure and required evidence retained under
`p15-fire-earned-act2-v1`. Next resume exact31/next443 with20-action prefix and
audited training carry:297shared/43Tomb admissions stay spent; no cleared-route
replay or renewed bounds. Previous status-only turn was no progress; this turn
records verified progression. Root retains packet/claimed human2 through
umbrella review/cleanup. All14ActI/main CorpseNormalV/ColdActVpartial/
JavelinActIVpartial/formal0/210 unchanged; full privatev1 incomplete.
Browser works/CI excluded/no pending question.

## 2026-11-03 — Current JSON semantic validation retained

[Measured implementation](../balance/2026-11-03-json-semantic-validation.md):
parser-owned current JSON avoids identical repeat semantic checks; quarantine,
native/historical safety and persistence remain exact. All183affected cases,
scoped strict types and explicit lint pass. Complete8540-item decode median
89.785→77.503ms (13.680%); matched production desktop/mobile imports/reloads
preserve every native/public save. Mobile import951.953→859.390ms and
reload2551.062→2365.717ms; long tasks keep BUG592open. No campaign/timing replay.
The preceding status turn was a verified wait on live75588; this continuation
observes exit0 and accepts the code change. Exact disposable caches/builds/
type-info absent; required evidence/closure retained under
`bug592-json-semantic-once-v1`. Root retains packet/claimed human2 through
umbrella review and owns eventual cleanup/release. All14ActI/main CorpseNormalV/
ColdActVpartial/JavelinActIVpartial/formal0/210 unchanged. Full privatev1 remains
incomplete; next later intended-build progression, without renewing exhausted
Cold/Javelin bounds. Browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Cold Act V partial verified; priority trials rejected

[Checkpoint](../balance/2026-11-03-cold-act5-checkpoint.md): Cold61→73,
next896→1224;328admissions/1825settled waves (1824wins, one draw). Three
route areas and16/19main actions complete; Ancients/Baal never attempted.
The200-admission Ancients preparation bound is exhausted and stays closed.
ReaderV3 verifies complete export, ordered custody, economy/points/quests/
clocks/seeds/ordinals and living-party continuity; original reader failures and
corrections retained. All2151production/131campaign inputs authenticate.
Two priority candidates both draw at60s (12and2survivors), so neither is adopted.
Three diagnostic battles total; no further order tuning on this retained input.
No production or campaign implementation change, earned retry or formal balance
acceptance. Required evidence/closure retained under`p15-cold-earned-act5-v1`
and the two diagnostic prefixes; processes terminal, exact caches absent.
Root retains human2/packet through umbrella review and owns eventual cleanup.
All14ActI/main CorpseNormalV/JavelinActIII/formal0/210 unchanged; full privatev1
remains incomplete. Previous status-only turn was no progress; this continuation
records verified outcomes and moves to remaining implementation work.

## 2026-11-03 — Intended Cold Sorceress Act IV completion verified

[Recorded completion](../balance/2026-11-03-cold-act4-completion.md):
Cold47→61 / next672→896;224admissions/1,218victories, all three first-attempt
route clears and13quest actions complete. Actual Soulstone/Hammer consumed.
Frozen V1 full-save/ordered custody/economy/points/quest/clock/seed/ordinal/
training/authored-level readback passes without correction or gameplay replay.
All2,151production/131campaign inputs unchanged. Genuine successor SHA256
`1494beda11f5b0f33cbb64c3a6c95cf00d24df5002274f7bf88c7ec98563bf3e`.
Scoped types/lint/preflight pass; all processes terminal, exact config/cache
absent. Closure/cumulative costs retained under `p15-cold-earned-act4-v1`.
Previous status turn consumed the pending reader to terminal pass: evidence
changed the next action. Next earned Cold Act V main quests, with all prior
limits/costs preserved. Root retains packet/claimed human2 through umbrella
review and owns eventual cleanup/release. All14ActI/main Corpse75NormalVcomplete/
JavelinActIII/formal0/210 unchanged. Full privatev1 incomplete; browser works/
CI excluded/no pending question.

## 2026-11-03 — Intended Cold Sorceress Act III completion verified

[Recorded completion](../balance/2026-11-03-cold-act3-completion.md):
Cold32→47 / next447→672;225admissions/1,304victories; all five routes and
11quest actions complete on first attempts. Actual Soulstone retained. Frozen
V1 full-save/ordered custody/economy/points/quest/clock/seed/ordinal/training/
authored-level readback passes without correction or gameplay replay. All2,151
production/131campaign inputs unchanged. Genuine successor SHA256
`a2211c0f5606b15b7b364ed052a6ab1303bb8c1f0466319980ea12cf2d77e1a1`.
Scoped types/lint/preflight pass; all processes terminal, exact config/cache
absent. Closure/cumulative costs retained under `p15-cold-earned-act3-v1`.
Root retains packet/claimed human2 through umbrella review and owns eventual
cleanup/release. Next earned Cold Act IV, with prior limits/costs preserved.
All14ActI/main Corpse75NormalVcomplete/JavelinActIII/formal0/210 unchanged.
Full privatev1 incomplete; browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Cold Sorceress Act II completion verified

[Recorded completion](../balance/2026-11-03-cold-act2-completion.md):
Cold14→32 / next133→447;314admissions/1,599settled waves/1,598wins/one
defeat. All six Act II areas and21quest actions complete; first Arcane loss
retained, retry succeeds, Duriel first attempt. Full native-save/ordered item/
economy/points/quest/clock/seed/ordinal V1 readback passes without correction
or combat replay. All2,151production/131campaign inputs unchanged. Genuine
successor SHA256 `ca040c7d2426967acf1f9a3b8f30bf7a818e79f08225a12e7f59cc1ec6c4b439`.
Scoped types/lint/preflight pass; all processes terminal, exact temporary
config/cache absent. Closure and costs retained under packet prefix
`p15-cold-earned-act2-v1`; root retains packet/claimed human2 through umbrella
review and owns eventual cleanup/release. Next earned Cold Act III with all
prior costs carried. Previous goal turn was status-only/no progress; this
continuation records verified completion and advances the next earned act.
All14ActI/main Corpse75NormalVcomplete/JavelinActIII/formal0/210 unchanged.
Full privatev1 incomplete; browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Javelin late signature order corrected locally

BUG642 now selects learned Lightning Strike then Impale before weak fillers;
the early pack bridge is preserved. One frozen six-battle diagnostic exactly
reproduces all three original failed boss inputs, then wins all three with
order alone in53.4–59.4s. Ten focused Javelin regressions, scoped strict types
and explicit lint pass. The new fixture's missing required field was corrected
with the initial failure retained and the two cases rechecked. Exactly four
campaign files change; no production edit or route replay. See the
[decision](decisions/P15-intended-javelin-late-signature-order-v1.md) and packet
prefix `p15-javelin-late-signature-order-v1`, including closure/cleanup receipt.
This status turn also completes that local correction. Act IV remains partial
at49/next703; all three attempts stay spent. All14ActI clears/main Corpse75
NormalVcomplete/formal0/210 unchanged. Full privatev1 incomplete; browser
works/CI excluded/no pending question. Root retains the claimed human2 and
required packet through umbrella review and owns eventual cleanup/release.

## 2026-11-03 — Intended Javelin Act IV partial checkpoint verified

[Recorded checkpoint](../balance/2026-11-03-javelin-act4-checkpoint.md):
Javelin47→49/next672→703;31admissions/183settled waves/180wins/three Izual
60sdraws. No Act IV route area/Claim complete. Exact save/custody/economy/
points/quest/clocks/seeds/ordinals V1 readback passes, no combat replay.
All2151production/131campaign inputs unchanged. Genuine successor SHA256
`2a4ab7eb0449dc5be069d590cfd00a4a135150b516995c4d999b13d67fe50a07`.
All prior costs/three failed route attempts stay spent. BUG642 investigates
weak low-rank elemental fillers ahead of learned Impale; no production defect
established. Native/launcher/reader terminal; temporary config/cache absent.
Root retains packet/claimed human2 through umbrella review/cleanup. All14ActI
clears/main Corpse75NormalVcomplete/formal0/210 unchanged; full privatev1
incomplete. Browser works/CI excluded/no pending question.


## 2026-11-03 — Intended Javelin Act III completion verified

[Recorded completion](../balance/2026-11-03-javelin-act3-completion.md):
Javelin 32→47 / next 447→672; 225 admissions, 1,304 settled victories, 220
training and five first-attempt route clears. All 11 quest actions succeed;
Khalim/Orb graph complete and actual Soulstone retained. Exact native export,
ordered item/economy/points/clock/seed/ordinal custody and authored level
projection pass V2 readback. V1's mandatory zero-valued socket counter was a
reader error; failure and exact amendment retained, no gameplay replay.
All 2,151 production/131 campaign inputs and intended profile unchanged.
Successor SHA256 `256a07676597adcc516efa85557fd7fc9e5f1a6e29ce6e8f5686502bcadc5fe2`.
Native/launcher/readers terminal; temporary config/cache absent. Root retains
required packet and claimed human2 through umbrella review/cleanup. Previous
goal turn was a verified wait on live session 82406; this turn reconciles and
records completion. Next earned Act IV, with cumulative original costs retained.
All 14 Act I clears/main Corpse75 NormalV completion/formal 0/210 unchanged.
Full private v1 incomplete; browser works/CI excluded/no pending question.

## 2026-11-03 — Intended Javelin Act II completion verified

[Recorded completion](../balance/2026-11-03-javelin-act2-completion.md):
Javelin23→32 / next291→447;156new admissions/842victories,153new training
(309cumulative Act II), three remaining route clears and11remaining quest
actions. Exact native export, item/economy/points/clock/seed/ordinal custody
passes V2 independent retained-output readback. V1 omitted the authored Arcane
Claim point; failure and exact reader amendment retained, no gameplay replay.
BUG641 earned continuation verified after65affected checks/types/lint.
All2151production/131campaign inputs frozen; no production/profile change.
Continuation export SHA256
`bd79c84d99c76789b0fd91b94432028aadd8aa5acdcb74fc13e58862fa7f0799`.
Native/launcher/reader terminal; exact disposable configs/cache absent. Required
evidence packet and human2 retained by root through umbrella review/cleanup.
All14ActI clears, main Corpse75/NormalVcomplete/next1658 and formal0/210
unchanged. Full privatev1 incomplete; next earned Javelin Act III, no completed
route replay or renewed prior limits. Browser works/CI excluded/no pending question.
The preceding status turn polled the reader to terminal pass; this continuation
records the authoritative result and advances the next earned act.

## 2026-11-03 — Act II Book checkpoint resume repaired locally

BUG641 now accepts the ten-action Book checkpoint without repeating Oasis,
Radament or Book rewards. Audited training carry preserves total/per-area/
nonwin/fallback limits and rejects discontinuous retained evidence before
native mutation. All65affected checks, scoped strict types and explicit lint
pass;63unrelated cases excluded. Evidence: packet prefix
`p15-act2-book-resume-v1`, including RED failures and final closure with exact
source hashes and archived disposable configs. Exact config/cache cleanup
verified. Root self-review only; no agents/CI/install/commit/publication.
No native suffix yet. Next use exact level23/next291 export, ten retained quest
actions and156training admissions, with all prior costs inside the remaining
canonical global envelope; do not renew the closed prior process slice.
All14ActI clears/Main Corpse75 NormalV completion/formal0-of-210 unchanged.
Previous goal turn was status-only/no progress; this continuation completes
local lint/review and controller validation, then prepares earned resumption.

## 2026-11-03 — Intended Javelin earned Act II checkpoint verified

[Recorded result](../balance/2026-11-03-javelin-earned-act2-checkpoint.md):
all 14 intended builds now have individual Act I clears. Javelin continues
14→23 / next132→291: 159 admissions, 760 settled victories, three Act II
route clears, Cube/shaft recovered, Radament claimed and Book consumed.
156 training admissions include 26 toward Lost City26; between-wave execution
limit leaves one staged unplayed wave. Native save preserves settled rewards,
not an active combat session. V2 full-save/custody/economy/clock/seed/ordinal
readback passes; V1's backpack-only salvage assumption and exact versioned
correction are retained. No gameplay replay or production/campaign edits.

Javelin continuation authority: `p15-javelin-earned-act2-v1.native-export.json`,
SHA256 `0414f8efafbba5c25ecdb80661c4a8c3b4116a4a69eefadc5e30d5eb2e57e721`.
Native/launcher terminal, disposable config/cache absent. Root retains required
packet/claimed human2 through umbrella review and owns eventual cleanup/release.
Next support ten-action quest resumption with previously spent training limits;
do not restart completed stages. Main Corpse/Bone75/NormalV19-of-19/next1658
and formal0/210 unchanged. Later intended progression/populations/holdouts,
economy/recruitment/fairness/adaptation/manual-idle/defeat-retry/pacing,
remaining Hell/endgame and integrated G0–G7/review/soak/later owner playtest remain.
Browser works/CI excluded/no pending question or external blocker.

## 2026-11-03 — Intended Zeal learned-aura bridge accepted; Act I complete

[Recorded diagnosis/result](../balance/2026-11-03-zeal-learned-aura-bridge.md):
BUG639 fixed/verified for one earned route. Select already-owned Holy Fire1
at6, restore Might at12; preserve every rank/stat/priority/equipment/training
rule. Generic optional staged selection uses native eligibility/refusal.
Nine affected checks/scoped strict types/explicit lint pass;174unrelated cases
excluded. One fresh route completes13:126admissions/368waves/364wins/four
defeats; first Catacombs125 wins6/6. Full independent journal/native-save/
custody/economy/clock/payment/training readback passes without combat replay.

Reader corrections are disclosed: historical original-profile report predates
pre-existing acquisition opt-in; before-outcome amendment retains original
reader/plan. Post-run V1 hero-only survival-owner assertion fails; V2 verifies
both documented owners with original accounting retained. Initial invalid
fixture-name failures also preserved. Root self-review only. All2151production/
131canonical campaign inputs frozen; exactly four campaign files changed.
Native successor next126, SHA256
`6d3861191e7025bb77d19a3589d3dbba12fad9218ba6dde987751f207c124612`.
Closure `p15-zeal-staged-aura-v1-closure.json` verifies source/process/disposable
cleanup. Root retains required packet/claimed human2 through umbrella review
and owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation implements
and verifies Zeal's diagnosed learned-aura correction. Thirteen of14intended
builds now have individual Act I clears; Javelin remains. Next inspect its
retained progression/resources; do not retry/tune the closed defense candidate.
Main Corpse/Bone75/NormalV19-of-19/next1658 and formal0/210 unchanged.
BUG611/592, later intended progression/populations/holdouts, pacing/economy/
recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining Hell/endgame
and integratedG0–G7/review/soak/later owner playtest remain. Browser works/CI
excluded/no pending question or external blocker. No agents/install/commit/
push/publication or unrelated checks/campaign replay.

## 2026-11-03 — Intended Javelin owned defense rejected and restored

[Recorded result](../balance/2026-11-03-javelin-owned-defense-rejected.md):
BUG638's existing early-survival opt-in passes six affected checks/scoped types/
explicit lint, but one native route ends12:112admissions/310waves/306wins/four
nonwins. Den55 clears and acquisition earns12; Cold Plains109 then recovery
Den111 lose. No first boss entry. Independent full journal/native-save/custody/
economy/training/clock/payment readback passes, observing seven native survival
equips. Before trial, resource assertions were corrected to native maximum
clamping; original reader and initial discovery/ignored-file lint failures remain.

The full-clear adoption rule fails. Both candidate files are archived and exact
baselines restored; all2151production/131campaign inputs match. Closure
`p15-javelin-owned-defense-v1-closure.json` verifies terminal processes and exact
disposable config/cache absence. Root retains required packet/claimed human2
through umbrella review and owns eventual cleanup/release. No combat replay,
seed search, limit extension or further tuning of this closed candidate.

Previous goal turn was status-only/no progress. This continuation tests and
rejects a diagnosed owned-equipment hypothesis, reconciles the complete result
and restores it. Next inspect retained Zeal failure/paid allocation. Twelve of14
intended builds have individual Act I clears; Javelin/Zeal remain. Main Corpse/
Bone75/NormalV19-of-19/next1658 and formal0/210 unchanged. BUG611/592, later
intended progression/populations/holdouts, pacing/economy/recruitment/fairness/
adaptation/manual-idle/defeat-retry, remaining Hell/endgame and integratedG0–G7/
review/soak/later owner playtest remain. Browser works/CI excluded/no pending
question or external blocker. No agents/install/commit/push/publication.

## 2026-11-03 — Intended Traps Blade investment accepted; Act I complete

[Recorded diagnosis/result](../balance/2026-11-03-traps-blade-investment.md):
BUG636 fixed/verified for one earned route. Move Blade8 ahead of CBS12 below
LightningSentry20; preserve both early unlocks, all final targets/stats/rotation/
gear/native limits. Three RED cases reproduce delayed Blade investment; seven
related checks/scoped strict types/explicit lint pass,126unrelated cases excluded.
One fresh campaign clears12:107admissions/310waves/310wins/zero defeats. First
Catacombs106 wins6/6. Full independent journal/save/custody/economy/clock/payment
readback passes without replay. V1 reader failure (level12 before idle native
allocation) and type-config resolution failure remain preserved; corrected reader
checks learned authority, with no change to other accounting assertions.

Canonical131campaign inputs frozen from the start;2151production inputs unchanged,
exactly two campaign files changed. Separate native successor next107, SHA256
`8d2d2c1f41d79f0cc5649fb037793e52e8cdc502a4fb52a96dfdb6e6094729c9`.
Closure `p15-traps-blade-investment-v1-closure.json` verifies source/process/
disposable cleanup. Root retains required packet/claimed human2 through umbrella
review and owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation implements
and verifies the diagnosed Traps investment correction. Twelve of14intended
builds now have individual Act I clears; Javelin/Zeal remain. Next inspect their
retained failures; the separate diagnostic Javelin progression helper changes
final targets/resets, so cannot be adopted unchanged as the intended identity.
Main Corpse/Bone75/NormalV19-of-19/next1658 unchanged. BUG611/592, later intended
progression/populations/holdouts, pacing/economy/recruitment/fairness/adaptation/
manual-idle/defeat-retry, remaining Hell/endgame, integratedG0–G7/review/soak/later
owner playtest remain. Formal0/210 (14builds×5acts×3encounter roles) unchanged.
Browser works/CI excluded/no pending question or external blocker.
No agents/install/commit/push/publication or unrelated checks/campaign replay.

## 2026-11-03 — Intended Martial finisher investment accepted; Act I complete

[Recorded diagnosis/result](../balance/2026-11-03-martial-finisher-investment.md):
BUG635 and integrated BUG631/633 fixed/verified for one earned route. BUG634's
two ordering hypotheses are rejected: removing Cobra or reducing Web causes a
survival regression. Preserve recovery/control; move later Talon12 before Fists8,
with paid Fire Blast1/Web selection and native unlock reservation. Eight affected
checks/scoped types/explicit lint pass;122unrelated cases excluded. Exactly one
fresh campaign completes13:117admissions/351waves/350wins/one defeat. Existing
recovery earns13; Dark Wood retry115 and first Catacombs116 win. Full independent
journal/native-save/custody/economy/clock/payment readback passes without replay.

Original125-input diagnostic freeze omitted six contract files; explicit
supplement authenticates them against an earlier canonical131source and native
before/after/current disk. Original records and initial failure are preserved;
all2151production inputs remain unchanged, exactly two campaign files differ.
Native successor next117, SHA256
`786c8538b4c2b485475740e739f8e7437ebde6564e42651bba74f9b2d72109b1`.
Closure `p15-martial-finisher-investment-v1-closure.json` verifies source,
process and disposable cleanup. Root retains required packet/claimed human2
through umbrella review and owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation repairs the
evidence coverage, reconciles the retained campaign and adopts its verified
policy without combat replay or repeated tests. Eleven of14intended builds now
have individual Act I clears; Javelin/Zeal/Traps remain. Next inspect their retained
failures before another bounded correction. Main Corpse/Bone75/NormalV19-of-19/
next1658 unchanged. BUG611/592, later intended progression/populations/holdouts,
pacing/economy/recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining
Hell/endgame, integratedG0–G7/review/soak/later owner playtest remain. Formal0/210
(14builds×5acts×3encounter roles) unchanged. Browser works/CI excluded/no pending
question or external blocker. No agents/install/commit/push/publication.

## 2026-11-03 — Martial prerequisite/Web trial rejected and restored

[Recorded diagnosis/result](../balance/2026-11-03-martial-web-investment.md):
BUG633 remains Open. All18original level-six controls reproduce. Order-only Web
v1 lacks native projection; corrected v2 exposes missing Fire Blast1 before any
candidate combat. One prospective paid-prerequisite/unlock/selected-Web policy
passes seven affected checks/scoped types/explicit lint, then reaches14 with
131admissions/405waves/402wins/three nonwins. Catacombs118 losesW5; existing
recovery earns14; retry130 drawsW5, one elite226Life. No Andariel victory.
Independent full journal/native-save/custody/economy/clock/allocation readback
passes without combat replay. It records877paid Web casts. Both candidate files
are archived and exact baselines restored; all2151production/131campaign inputs
match. Disposable scoped type config absent; recorded native processes terminal.

Previous goal turn was status-only/no progress. This turn tests the legal
candidate, reconciles its negative adoption result and changes the next action:
inspect Martial charge/finisher priority against retained native events/authored
combo rules. Retry has Cobra18/Fists4 with minimum198Mana; sparse fire delivery
suggests priority competition. Read-only D05/source inspection confirms first-
eligible ordering and any-full-pool builder saturation are the authored rules;
no engine defect established. No further
tuning, replay, seed search or limit extension follows this closed trial.

Corpse/Bone75/NormalV19-of-19/next1658 and ten intended Act I clears unchanged.
BUG611/592/631/633, remaining Javelin/Zeal/Martial/Traps progression/populations/
holdouts, pacing/economy/recruitment/fairness/adaptation/manual-idle/defeat-retry,
remaining Hell/endgame and integratedG0–G7/review/soak/later owner playtest remain.
Formal0/210 (14builds×5acts×3encounter roles) unchanged. Root retains required
packet/claimed human2 through umbrella review and owns eventual cleanup/release;
closure `p15-martial-web-investment-v1-closure.json` verifies restoration/processes/
disposable checks. Browser works/CI excluded/no pending question or external
blocker. No agents/install/commit/push/publication.

## 2026-11-03 — Hell constructed browser functionality recorded

[Dedicated evidence](evidence/hell-browser-functionality.md): composite v2/v3
passes zh-CN/en at360×640 and1280×800. Public controls verify Hell authority/
selection/admission, refused invalid import, exact Mal→Ist fusion, socket/equip
actual +30MagicFind and full save equality after actual browser restart/Continue.
V4 settled-dialog follow-up passes; mobile socket top/bottom captures do not
prove scrolling to the top. Earlier v1/v2 harness failures remain preserved.
No game runtime edit, earned acquisition, balance or independent H3 acceptance.

The preceding goal turn was status-only/no progress. This continuation closes
the documentation gap using retained results without rerunning browser/tests.
H2 was independently accepted at a21c396e; BUG355 remains Open for earned
quantities/affordability and required review. Root self-review only; all799
recorded production inputs and766build hashes match across v2/v3/v4, with the
omitted actual Tailwind config disclosed. Exact disposable paths absent;
recorded drivers terminal. Required packet remains root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`;
closure `hell-browser-functionality-closure.json`. Root retains claimed human2
through umbrella review and owns eventual packet cleanup/worktree release.

Next inspect unresolved intended-build progression using existing failures,
then make a bounded causal correction. Corpse/Bone75/NormalV19-of-19/next1658
and accepted ActI successors unchanged. BUG611/592/631, formal0/210
(14builds×5acts×3encounter roles), pacing/economy/recruitment/fairness/adaptation/
manual-idle/defeat-retry, remaining Hell/endgame and integratedG0–G7/review/soak/
later owner playtest remain. Browser works/CI excluded/no pending question or
external blocker. No agents/install/commit/push/publication.

## 2026-11-03 — Martial unlock allocation trial rejected and restored

[Recorded result](../balance/2026-11-03-martial-unlock-investment.md): BUG631
remains open. Seven affected checks/scoped types/explicit lint verify held
points and paid Burst casting, but one native route stops6:44admissions/
52waves/50wins/two defeats, no boss entry. Independent full journal/native-save/
economy/training/clock/point readback passes after correcting an empty-audit
reader assumption. Candidate fails its frozen Act I adoption rule; both files
are restored to exact baseline. All2151production/131campaign inputs match.
Exact disposable type config absent; recorded native processes terminal.
No replay/extension/seed search/production tuning or population acceptance.

Previous goal turn was status-only/no progress. This turn tests a diagnosed
allocation correction, verifies its negative earned result and restores it.
Retained final loss casts Fists10/Burst2/Talon3, has minimum104Mana and leaves
four enemies alive. Next inspect charge/finisher eligibility in those events
before choosing a further correction; this closed candidate is not a new
continuation authority. Main Corpse/Bone75/NormalV19-of-19/next1658 unchanged.
BUG611/592/631, remaining intended progression/populations/holdouts, pacing/
economy/recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining Hell/
endgame and integratedG0–G7/review/soak/later owner playtest remain. Formal0/210
means14builds×5acts×3encounter roles, not difficulties. Root retains required
packet/claimed human2 through umbrella review and owns eventual cleanup/release.
Browser works/CI excluded/no pending question or external blocker.
No agents/install/commit/push/publication.

## 2026-11-03 — Intended Bow unlock investment accepted; Act I complete

[Recorded result](../balance/2026-11-03-bow-unlock-investment.md): BUG630
fixed/verified for one earned route. Defer only Critical Strike20 from1 to20;
retain early rank1, bank three points at5, pay Multiple Shot3/Dodge1 at6.
No production/stats/rotation/equipment/training/reset or other-build change.
Six affected checks/scoped types/explicit lint pass;120unrelated cases excluded.
One prospective native run completes13:117admissions/351waves/350wins/one defeat.
Dark Wood105 losesW5; nine ordinary recovery admissions earn13, retry115 wins,
and first Catacombs116 clears all six waves. Independent full journal/native
save/custody/economy/training/clock/point readback passes without replay.
All2151production inputs unchanged;131campaign inputs/exactly two changed paths.

Previous goal turn was status-only/no progress; this turn implements and verifies
the declared Bow allocation slice. Full privatev1 incomplete: BUG611/592, formal
0/210, remaining intended-build progression/populations/holdouts, pacing/economy/
recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining Hell/endgame,
integratedG0–G7/review/soak/later owner playtest remain. Next inspect remaining
Javelin/Martial/Zeal/Traps failures; Zeal's retained level6 projection correctly
omits Zeal until12, so that alone is not an engine defect. No unrelated checks
or completed-build replay. Separate Bow successor next117, SHA256
`c55f62c61e47ef8edd4e634051b346583f7a308177ee42a6c092a13ca6e356e2`;
main Corpse/Bone75/NormalV19-of-19/next1658 unchanged. Root retains required
packet/claimed human2 through umbrella review and owns eventual cleanup/release.
Closure `p15-bow-unlock-v1-closure.json` verifies source/process/disposable checks.
Browser works/CI excluded/no pending question or external blocker.
No agents/install/commit/push/publication.

## 2026-11-03 — Intended Fire spare investment accepted; Act I complete

[Recorded result](../balance/2026-11-03-fire-spare-points.md): BUG629 fixed for
one earned route. Retained Fire8 had two idle points and Inferno1; append
Inferno5 after existing targets, preserving later identity/unlocks. No production
tuning, reset or altered equipment/training limits. One prospective acquisition
clears Act I13:124admissions/359waves/351wins/eight defeats. Catacombs115 losesW4;
existing recovery earns13 and retry123 wins all six. Independent complete native
save/journal/economy/training/clock/allocation reconciliation passes without replay.
Seven affected checks/scoped types/explicit lint pass;117unrelated cases excluded.
All2151production inputs unchanged;131campaign inputs/two changed paths.

Previous goal turn was status-only/no progress; this turn completes the declared
Fire allocation slice and its frozen Act I adoption criterion. BUG611/592,
formal0/210, remaining intended-build acquisition/populations/holdouts, pacing/
economy/recruitment/fairness/adaptation/manual-idle/defeat-retry, remaining Hell/
endgame and integratedG0–G7/review/soak/later owner playtest remain. Next inspect
remaining Bow/Javelin/Zeal/Martial/Traps retained failures before selecting a
bounded correction. No unrelated checks or completed-act replay.

Main Corpse/Bone continuation remains75/NormalV19-of-19/next1658; separate
Fire export next124, SHA256
`4f5b978352ca0ac66e2353fd462e8a4dae58ca0a24e45bd398f526ba122fd240`.
Root retains required packet/claimed human2 through umbrella review and owns
eventual cleanup/release; closure `p15-fire-spare-v1-closure.json` records final
source/process/disposable checks. Browser works/CI excluded/no pending question
or external blocker. No agents/install/commit/push/publication.

## 2026-11-03 — Intended Double Throw native reset accepted; Act I complete

[Recorded result](../balance/2026-11-03-double-throw-native-reset.md): BUG626
fixed/verified for one earned route. The intended policy pays for Swing5 before
unlock and uses the existing free Akara skill reset at12, refunding13actual
ranks without healing/payment/other-domain changes. Exactly one prospective
trial clears Act I at13:118admissions/354waves/352victories; two losses retained.
All six Catacombs waves win on first boss admission117. Independent full native
save/journal/economy/clock/training/reset accounting passes without replay.
Ten affected checks (112unrelated skipped), scoped types and explicit five-file
zero-warning lint pass. Final targets preserved through80; no production tuning.
All2151production inputs unchanged;131campaign inputs/five changed paths.

Previous turn was a status report/no implementation progress. This turn completes
the declared native reset slice and meets its frozen Act I adoption criterion.
No population acceptance: formal0/210; BUG611/592, representative intended-build
acquisition/holdouts, pacing/economy/recruitment/fairness/adaptation/manual-idle/
defeat-retry, remaining Hell/endgame and integrated G0–G7/review/human soak/later
owner playtest remain. Next inspect retained early Fire/other intended-build
failures before another bounded change; no unrelated acts or closed-trial replay.

Main Corpse/Bone final-Eve-Claim successor remains75/NormalV19-of-19/next1658,
SHA256 `74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Separate earned Throw successor next118:
`p15-throw-reset-native-v1/barbarian-double-throw-intended-v1.native-export.json`,
SHA256 `55821eb6ad481c8eff49f44c27f9f084d23b732a9e94bd3d1b9c6bca40367e12`.
All consumers terminal; disposable type config absent. Required packet including
`p15-throw-reset-v1-closure.json` and claimed human2 remain root-owned through
umbrella review; root owns eventual cleanup/release. Browser works/CI excluded;
no pending question/external blocker; no agents/install/commit/push/publication.

## 2026-11-03 — Attack-before-Howl trial closed; no Act I completion

[BUG626 result](../../production/bugs/BUG-626-double-throw-early-growth.md):
9affected checks/scoped types/explicit lint pass; one native trial stops12,
110admissions/316waves/313wins. Complete journal/save/economy/source/costs and
868paid recoveries independently reconcile. The frozen adoption criterion
fails; restore exact policy/test baselines and verify2151production/130campaign
inputs. Temporary type config absent; recorded processes terminal. Preserve
rejected candidate/readers and one corrected reader assumption in root packet
`p15-throw-control-*`; no replay/extension/population acceptance.

Previous turn was a status report/no implementation progress. This turn makes
a bounded prospective change, verifies its negative result and restores it.
Retained draw exposes low-rank Throw against ordinary Defense while bridge
investments remain. Inspect native unlock-time skill reset before proposing
further coefficient tuning; no next trial has been authorized by this record.
Genuine continuation remains final Eve Claim/level75/NormalV19-of-19/next1658.
BUG611/626/592, formal0/210, remaining Hell/endgame, pacing/economy/recruitment/
fairness/adaptation/manual-idle/defeat-retry and integratedG0–G7/soak/review/later
owner playtest remain. Browser works/CI excluded/no pending question/external
blocker. Root retains claimed human2/required packet through umbrella review
and owns cleanup/release; no agents/install/commit/push/publication.

## 2026-11-03 — Offscreen rendering candidate rejected and restored

[Result](../balance/2026-11-03-inventory-offscreen-rendering-trial.md):
34 affected cases/scoped types/lint and desktop browser checks pass; mobile
offscreen accessibility-tree verification fails. Reject under the frozen rule,
restore only BackpackGrid, and independently authenticate all 2,151 production
inputs against the retained baseline. Original desktop timing is reused; one
mobile measurement exists, two are not run after the correctness failure.
No timing retry, median acceptance, or BUG592 closure. Exact owned configs and
all four build/cache pairs are absent; all consumers terminal. Required traces,
maps, failed/corrected readers, rollback and closure remain in root's packet.

Previous goal turn was a status report/no implementation progress; this turn
executes the corrected verifier, rejects the candidate, restores and verifies
the source, and records the result. Next inspect retained Double Throw action
eligibility/recovery evidence before a new gameplay correction; no replay or
extension of the closed bridge/recovery trials and no speculative performance
micro-optimization sequence. Genuine continuation stays level75/NormalActV19/19/
next1658; formal balance0/210, BUG611/626/592, remaining Hell/endgame,
pacing/economy/recruitment/fairness/adaptation/manual-idle/defeat-retry and
integrated G0–G7/soak/review/later user playtest remain. Browser works; CI excluded;
no pending question/external blocker. Root retains claimed human2/required packet
through umbrella review and owns eventual cleanup/release. No agents, install,
commit, push or publication.

## 2026-11-03 — Recovery-first Double Throw trial rejected and restored

[BUG626 result](../../production/bugs/BUG-626-double-throw-early-growth.md):
one bounded native trial ends at level 12 without a boss entry. Its 111
admissions / 305 waves / 301 victories and complete terminal save independently
reconcile. Paid recovery restores Life/Mana, but the final draw spends 12
recovery actions for minor deficits and leaves one enemy alive. Act I completion
fails the frozen adoption criterion; both candidate policy/test files are restored
to exact prior bytes. Rejected copies, corrected readers, original reader failures
and rollback receipt remain in the root packet under `p15-throw-recovery-*`.
No replay, extension, production tuning or population acceptance follows.
Disposable type config is absent; processes terminal. BUG626 stays open.

The preceding status-report turn made no implementation progress. Resume BUG592
with one current-source browser trace, preserving save equality and item identity,
before choosing a further correction. Browser works; CI excluded; no pending
question or external blocker. Genuine continuation stays final Eve Claim / level
75 / next 1658; formal balance 0/210, BUG611/592, remaining Hell/endgame,
pacing/economy/recruitment/fairness/adaptation/manual-idle/defeat-retry and
integrated G0–G7/soak/review/later user playtest remain. Root retains the claimed
human2 worktree and required evidence through umbrella review and owns cleanup.

## 2026-11-03 — Earned first-entry metadata fixed; Act I screen98/100

[Recorded result](../balance/2026-11-03-corpse-act1-first-entry-screen.md):
first-entry BUG620fixed with25affected regression cases/scoped strict types/
explicit lint; earlier ignored lint is not validation. Earned level12fixture
reconciles exact save/admission/costs/11stat/14skill allocations. Original
noncanonical metadata is retained and not used as authentication. No replay for
the fix. Current source has2149unchanged production/provenance inputs and128
campaign inputs; two diagnostic paths changed since the preceding freeze.

The frozen100-seed Catacombs screen completes600native waves,98whole-area wins/
two60sboss draws,0hero/2merc death trials. All100whole saves/500carry edges/
7100enemy members/98quest transitions independently reconcile. Whole-area median
89.609s; Andariel median21.508s; nominal95%win interval92.999–99.450% exceeds
60–90%target. No tuning decision follows from a single acquisition history with
earned unique/set items. Formal0/210. Fixed ordinal108 isolates seed variation;
no training/retry/adaptation/holdouts/unrelated tests. Costs100admissions/
9,128,361.302combatms/32,852.005driverwallms/6,377,679journalbytes; all predeclared
bounds hold. Both consumers terminal, no disposable cache. Root retains human2/
required packet through umbrella review and owns eventual cleanup/release.

Only genuine continuation remains final Eve Claim/level75/19-of-19/next1658,
SHA256 `74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Diagnostics do not alter it. Previous goal turn was status-only/no progress;
this turn executes and verifies the next bounded evidence action. BUG611/592,
representative14-build fixtures/acquisition policy/holdouts/fairness/pacing,
adaptation/manual-idle/defeat-retry, remaining Hell/endgame and integrated
G0–G7/soak/review/later owner playtest remain. Browser works; CI excluded;
no pending question/external blocker. Older entries below are historical.

## 2026-11-03 — Intended Corpse Throne screen: 100/100, balance concerns

[Population report](../balance/2026-11-03-corpse-throne-population-screen.md):
fixed seeds 1–100 clear all 800 original waves. Separate readback reconstructs
100 native exports and verifies 700 HP/MP carry transitions. No deaths/draws;
whole-area median 99.91 s, Baal median 18.8 s, win-rate 95% interval 96.30–100%.
This earned checkpoint exceeds the boss strength target; no coefficient tuning,
holdouts, earlier-act replay, or formal-cell acceptance follows. Next freeze
affordable first-entry power/acquisition policies for intended role fixtures.

Genuine continuation remains final Eve Claim, level 75/19-of-19/next1658, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
The diagnostic used historical pre-Throne input in isolated realms and did not
advance or replace that authority. Costs: 100 admissions, 9,980,770.608 combat ms,
161,792.123 driver wall ms, 20,122,946 journal bytes; zero training/retries.
Original reader schema failure retained; versioned correction passes with no
combat replay. Production 2149/campaign125 inputs unchanged. No source edit or
unrelated tests. Formal 0/210, BUG611/BUG592 and full private v1 remain open.
Previous goal turn was status-only/no progress; this turn executes evidence work.
Processes terminal/absent, no disposable caches; root retains human2/packet
through umbrella review and owns cleanup/release. Browser works; CI excluded.

## 2026-11-03 — Intended Corpse/Bone Act V complete; next1658

[Native completion report](../balance/2026-11-03-intended-corpse-act5-completion.md):
CE rank-growth functional delivery retains353distinct affected passes/types/lint.
The earned successor completes51Highlands clears and Ancients, then all8original
Throne/Baal waves on its first admission; final native Claim completes19/19ActV
actions and earns Slayer of Baal/Nightmare at75. Full save/each transition,
custody/rewards/points/quests/clock/party/source independently reconcile.
No old stage restarted or earlier-act check repeated. Loot bags remain production
RNG inputs, not an independent drop-law certification.

Only continuation authority:
`p15-eve-claim-native-v1.native-export.json`, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`, next1658.
All4360backpack/359stash items are retained. Earlier1605/1657authorities and all
terminal controller budgets remain historical. Cumulative combat-stage costs:
285admissions/264training/49274722.663113005combatms/645816.0355213302driverwallms/
64322803journalbytes; Rite/Eve handoff wall4177.424461msseparate. Readers
verify2149production plus125campaign inputs against unchanged frozen source.
Reader-only metadata corrections did not repeat gameplay; receipts are retained.

Act V obstruction resolved for this population. Formal0/210/BUG611/BUG592/full
privatev1remain open. Fourteen historical five-act routes and29-area supplement
are already complete; next scope is intended-build populations/holdouts,
economy/recruitment/fairness/pacing and integrated/endgame acceptance. Browser
works; CI excluded; no pending answer/external blocker. All native launchers
terminal/absent; no disposable cache. Root retains human2/required packet through
umbrella review and owns eventual cleanup/release. Previous turn was status-only
(no progress); this increment records the earned completion. Earlier entries
below are superseded history and must not be used to resume a prior save.


## 2026-11-03 — Highlands training terminal; earned successor next1605

The [Ancients-entry stage](decisions/P15-earned-ancients-entry-v1.md) completed
five Highlands clears, then stopped at its first nonwin (1604, wave index4).
35waves:34wins/1draw;1,439,835earnedXP/391items;hero remains71. No Ancients
admission. ActV16/19/formal0/210 and BUG611/BUG592/fullprivatev1 remain open.
Independent reader reconciles the entire terminal native export, ordered rewards,
all actor outcomes, clocks and ordinals. Retained v1 reader failure concerned
summoned actor IDs; corrected subset interpretation passes without combat replay.

Only continuation authority is `p15-earned-ancients-entry-native-v1.native-export.json`,
SHA256 `94107bd7727f268bc723a957167251216dd8b2b3817e59c39c630f1b1ac66f6e`,
next **1605**. Handoff1599 and all earlier exports are historical. This stage is
terminal; no retry or controller extension. New costs:6training admissions,
765441.8907119657combatms/4494.442321999999driverwallms/547359journalbytes.
All historical costs remain carried in the native result. Launcher terminal/
absent; memory-only bundle/no cache. Root retains required packet and human2
through umbrella review and owns eventual cleanup/release.

Saved1604W4events show first corpse1600ms,14CEcasts/22542directFire damage,
minimum596Mana; both allies survive. CE20base164–194 is insufficient against
late-act pack Life. The [armored rank-growth decision](decisions/P15-corpse-armored-rank-growth-v1.md)
records a provisional source correction; old rejected experiments remain rejected,
with no reused admission/seed or coefficient sweep. Browser works/CI excluded;
no user answer needed. Historical entries below are superseded, not erased.

## 2026-11-03 — Crystalline cleared; Prison rewards and Rite Start earned

[Result](../balance/2026-11-03-declared-recovery-native-result.md): shared learned/
declared offensive recovery now accepts global or area declaration while keeping
all prior proof/adjacency/opt-in guards. Five RED failures;57affected cases,
scoped strict types and explicit lint pass. Production2149inputs unchanged;
four campaign paths change. Retained checks reused without earlier-act replay.

Native1598 wins all six Crystalline waves, including Nihlathak proof; both allies
survive. Earned68items/323991XP; one admission/158324.839combatms/1821.492wallms/
349608journalbytes. Independent native whole-save/reward/source/bound reader
passes. Different population from1597; no paired improvement/broad acceptance.
Three further native quest actions Claim Prison, Read scroll and Start Rite:
12000heroXP/9000fieldedmercXP/20wishstones, service entitlement and +10all six
resistances. No combat/training/clock/ordinal advancement or unrelated changes.
Independent complete transition/export reader passes; ActV advances13→16/19.

Only continuation authority:
`p15-prison-handoff-native-v1.native-export.json`, SHA256
`35dc240eee3177328d959b6ad054d72abda5df0ea3147a3ff406b417bbd5c07c`, next1599.
Do not resume1598combat/pre1598/pre1597/preparation/D07/older saves or exhausted
controllers. Next needs lawful earned Ancients preparation at75(current71), then
Rite/Throne/Baal. Formal0/210,BUG611/BUG592/fullprivatev1 remain open.
Browser works; CI excluded; no pending answer/external blocker. Launchers exit0
and are absent; memory-only bundles create no cache. Required evidence/human2
remain root-owned through umbrella review; root owns eventual cleanup/release.
Previous goal turn was status-only/no progress; this increment executes actual
native progression. Historical entries below are superseded, not erased.

## 2026-11-03 — Owned hero sockets verified; native1597 reaches wave six

[Result](../balance/2026-11-03-hero-sockets-native-result.md): campaign-only
preparation fills empty opted-in physical mainhands through native paid actions.
All27affected socket cases/scoped strict types/explicit lint pass; retained
checks reused without earlier-act replay. Actual preparation moves46items into
stash, spends1Mal+2Eld, raisesAttack475→725, preserves all487owned items/current
Life130/Mana87 and is byte-exact on repeat. Independent whole-save/request/cost
readback passes. Production2149inputs unchanged; only3campaign files change.

One bounded native1597 continuation wins waves1–5, then draws wave6 with one
Frozen Terror boss at6661/18136Life; both allies survive. Earned60items/332993XP,
no failed-wave income or quest completion. Different population from1596;
no causal comparison. Paid preparation is retained, no replay/reset/training.
New combat costs1admission/233539.88947281823combatms/2086.797593driverwallms/
461364journalbytes. Independent export/ownership/reward/source/clock reader passes.

Only continuation authority:
`p15-hero-sockets-combat-native-v1.native-export.json`, SHA256
`353a3401da3203b90a02d6c80dda0a98e97efdda6bf21c42eeaacd9e0aaea81d`, next1598.
Older1597/preparation/D07 inputs and earlier controllers remain closed. Next
inspect the actual singleton timeline and ground a progression decision before
another admission. ActV13/19/formal0/210/BUG611/BUG592/fullprivatev1 remain open.
Browser works; CI excluded; no pending answer/external blocker. Root retains
human2 and required packet through umbrella review and owns cleanup/release.
Both native processes are terminal/absent, memory-only bundles create no cache.
Historical entries below preserve their original chronology and are superseded
by this continuation authority.

## 2026-11-03 — Owned physical companion arithmetic resolved

[Audit](../balance/2026-11-03-owned-rogue-arithmetic.md) uses actual owned actors,
native common-equipment projections and all ten Act V archetypes at hypothetical
level 70. Independent readback v2 passes all 100 rows / 560 component endpoints;
the failed v1 metadata interpretation is preserved. Cold Arrow's split damage
can lose to a physical hit on cold-resistant targets, but neutral physical
resistance can reverse that comparison. Cold Arrow already has Basic Arrow and
conditional Inner Sight, so this is not a sufficient companion-selection or
party-DPS proof. No transfer, fielding, save, RNG, combat, training or admission.
All 2,147 production inputs remain exact; source save/ordinal 1594 unchanged.
The 2.563 s memory-only launcher is terminal and absent; no disposable cache.
Root retains required `p15-owned-rogue-arithmetic-v1-closure.json` and human2
through umbrella review and owns eventual cleanup/release.

Previous turn was a status report/no progress. This increment closes the open
formula hypothesis and rules out treating an unevaluated mercenary swap as the
progression correction. Next requires an explicit pack/first-kill/singleton
damage decision preserving the intended build; do not renew closed gameplay
budgets, replay old waves or restart terminal controllers. Act V 13/19, formal
balance 0/210 and BUG611/BUG592/full private v1 remain open. Browser works;
CI excluded; no pending answer or external blocker.

## 2026-11-03 — Crafting subscription correction retained

[Measured correction](../balance/2026-11-03-crafting-subscriptions.md) removes
unused gear subscriptions at their source. All54distinct affected cases have
passing evidence; final scoped types/lint and four exact native/public browser
save-transfer checks pass. Mobile median291.562→246.584ms, desktop
116.473→120.201ms; frozen selection passes without baseline replay/timing retries.
All2147baseline inputs authenticate; only the declared source/test pair changes,
gameplay data exact. Browser1123962 exits0 and is absent, exact owned caches absent.
Required `bug592-crafting-subscriptions-v1-closure.json`/human2 stay root-owned
through umbrella review; root owns eventual cleanup/release. Mobile114–118ms
long tasks keep BUG592 open. Previous turn read back the terminal browser result;
current turn closes evidence/selection. No combat/admission/training or reopened
allowance. Next address intended-build first-clear/singleton damage using retained
authored scaling evidence; no exhausted controller/rejected family restart.
ActV13/19/formal0/210 and fullprivatev1/BUG611 remain incomplete.
Browserworks/CIexcluded/no pending answer.

## 2026-11-03 — Gear state ownership corrected; independent quest refresh restored

[Measured correction](../balance/2026-11-03-inventory-gear-ownership.md): gear
subscriptions move below stable global panel elements; quest panel explicitly
subscribes to receipt/unlock/context inputs. Six bilingual regressions fail
before, all30affected cases/scoped strict types/unignored lint pass after.
Four real-tooltip browser contexts preserve complete native/public earned-save
state and retained card identity, with no errors/overflow. Mobile transfer median
937.327→433.043ms (53.800%); desktop203.831→171.059ms. Retained baseline reused;
2,147inputs authenticate, exactly4source/test paths change, gameplay data exact.
Longest mobile tasks277/284/297ms keep BUG592 open. No memoized validation or
serialization change; faster interaction can end before debounced saving.
Browser5567 exits0; exact owned caches absent, no live task process. Required
`bug592-gear-ownership-v1-closure.json` packet/human2 remain root-owned through
umbrella review; root owns eventual cleanup/release. Previous goal turn was
status-only/no progress; this turn delivers a verified source correction.
No combat/CE-family budget/admissions/training/quests; ActV13/19 and formal0/210
unchanged. Full privatev1 and BUG611 remain open. Next return to intended-build
first-clear damage/preparation analysis using existing evidence; no restart of
terminal controllers, rejected candidates, earlier acts or completed checks.
Browserworks/CIexcluded/no pending answer.


## 2026-11-03 — Equipped-party comparison closed without acceptance

[Diagnostic](../balance/2026-11-03-earned-act5-party-screen.md): first equipped
1591W4 case times out at60s with15enemies alive; both allies survive. One battle,
no selected change/native advancement. Independent reader failed on null basic
aggregation and exceeded its400ms cap; narrowed correction agrees but is not a
full passing readback. All costs carried:221admissions/207training/
43741604.38907475combatms/599885.3286653301wallms/58175799journalbytes.
Only114.67133466992527wallms remain under the unchanged600000ms family ceiling;
close this family to further comparisons. Controllers remain terminal.
Closure`d02-equipped-party-screen-v1-closure.json`; frozen references authenticate,
memory-only launcher completes without cache creation; root retains required
packet/human2 through umbrella review and owns eventual cleanup/release.
Previous goal turn was status-only/no progress; this turn records the actual
failed outcome and moves to authored damage/scaling analysis. No replay of
earlier acts, completed training, passing checks or rejected candidates.
ActV13/19,formal0/210,BUG611/BUG592/fullv1 remain open. Browserworks/CIexcluded.

## 2026-11-03 — Counted-reader candidate rejected; baseline restored

[Measured result](../balance/2026-11-03-counted-reader-rejected.md): the duplicate
counted-definition load was reproduced and all 293 affected candidate cases passed.
After repairing the new fixture's delete expression, its targeted check, scoped
TypeScript and explicit lint passed. Four browser contexts preserve complete
native/public earned-save state and card identity, but mobile median
937.327→1015.112 ms (+8.30%) fails the fixed improvement rule. Desktop is
203.831→196.412 ms. All four candidate files and 2,147 baseline inputs are restored
exactly; the selected stable-card fix remains. No timing retry or passing-check
replay. Browser 88287 exited 0 and exact owned caches are absent. Required
`bug592-counted-reader-v1` evidence remains root-owned through umbrella review;
root owns eventual packet cleanup/worktree release. No campaign advancement or
CE allowance consumed/renewed: Act V 13/19, formal balance 0/210. BUG592, BUG611
and full private v1 remain open. Browser works, CI excluded, no pending answer.

## 2026-11-03 — Inventory card identity fixed; transfer response improves

[Measured result](../balance/2026-11-03-inventory-card-identity.md): occupied
BackpackGrid keys use unique item IDs, preventing remount/focus loss when earlier
items move. Two reproduced failures now pass; all19affected grid/pagination
cases, scoped types and explicit lint pass. Four real-tooltip earned-save browser
contexts preserve surviving DOM identity and complete native/public save state.
Mobile transfer median1126.659→937.327ms, desktop242.460→203.831ms; fixed local
selection passes. Longest mobile tasks392–412ms keep BUG592 open. Original2147
inputs authenticate; only grid/source test change, gameplay data unchanged.
Browser process33963 exits0, exact caches absent, no live task process. Required
evidence uses`bug592-stable-cards-v1-closure.json` in the root-owned packet through
umbrella review; root owns eventual cleanup/release of packet/human2. No combat,
admissions or CE-family allowance consumed/renewed; ActV13/19/formal0/210 remain.
Previous goal turn was status-only/no progress; this turn makes a verified source
correction. Full privatev1 and independent review remain open. Next trace remaining
fresh quest projection/persistence cost from the new retained measurements;
do not repeat rejected memo/serializer/catalog experiments, earlier acts,
completed training or passing checks. Browser works/CIexcluded/no pending answer.

## 2026-11-03 — Selected Act V companion equipped; no combat advancement

[Follow-up evidence](../balance/2026-11-03-earned-act5-party-screen.md): all ten
existing Prayer items transfer to the selected Cold Arrow71 through48successful
native actions, including28canonical inventory moves for capacity. Independent
whole-save/custody/action/export reconstruction and2147production hashes pass.
No spending, new gear selection, combat, training or controller restart; ActV
remains13/19 and formal balance0/210. Runtime stat projection is observational.
Whole launcher4491.977232ms, freeze10.656143072992563ms and independent reader
109.48165482841432ms bring carried wall cost to595762.1097371888ms; only
4237.890262811212ms remain under the unchanged comparison-family ceiling.
Other costs remain221admissions/207training/43681604.38907475combatms/
58175799journalbytes. Launcher/reader exit0; owned cache absent; no live process.
Required packet/human2 remain root-owned through umbrella review. No external
blocker or pending answer; browser works and CI stays excluded. Privatev1 remains
incomplete, including restActV,14-build balance/economy/Hell,pacing/retry and
BUG592/runtime performance. Do not restart terminal controllers or repeat earlier
acts, completed training or passing checks. Further comparison needs a separately
frozen plan within the remaining original allowance; no renewed budget.

## 2026-11-03 — Paid Act V party prepared; first conditional screen fails

[Recorded result](../balance/2026-11-03-earned-act5-party-screen.md): CE8→20 costs
12ordinary points; one earned90-wishstone ten-pull supplies nine new actors;
first new SR/SSR Cold Arrow71 remains selected. Complete independent point,
recruitment, custody, actor and export accounting passes. One conditional1591W4
battle then draws at60s; naked recruit dies/deals34damage, all16enemies survive,
hero casts CE0. First-failure stop obeyed; no native advancement/acceptance.
Independent readback passes without baseline replay. Both processes terminal,
owned caches absent. Costs carry221admissions/207training/43681604.38907475
combatms/591149.9947072874wallms/58175799journalbytes under original ceilings;
only8850.005292712594wallms remain in this comparison family.

Next inspect/move actual owned equipment before more combat; no rerolls, recipe
fitting, formula changes or terminal-controller restarts. Accepted merc XP rules
stay unchanged. Previous turn status-only/no progress; this turn records results
and resumes preparation. Full privatev1 incomplete,ActV13/19,formal0/210. Browser
works/CIexcluded/no pending answer. Root retains human2/required packet through
umbrella review and owns eventual cleanup/release.



## 2026-11-03 — Protected corpse-life experiment rejected and restored

The [six-case result](../balance/2026-11-03-corpse-life-protected-rejected.md)
is five wins/one W4 timeout, zero party deaths: the fixed six-win gate fails.
All2270source/18input hashes verify before restoration. All13candidate files
are archived then restored to exact new pre-experiment bytes; the2verified
late-allocation files remain exact. No native progress or balance acceptance.
Costs carry221admissions/207training/43621604.38907475combat ms/
563544.0582516184wall ms/58175799journal bytes under unchanged ceilings;
only~36456wall ms remain in this comparison family. No coefficient/order fitting
or terminal native restart. Processes terminal, owned cache absent, three exact
scratch patches removed; required packet/worktree retained by root through
umbrella review. Previous turn status-only/no progress; this turn closes rollback.
Full privatev1 incomplete/formal0/210, ActV13/19. Browser works/CIexcluded/no
pending answer. Next independent implementation targets remaining performance.

## Previous state — Late Corpse Explosion allocation fixed, 2026-11-03

The intended corpse/curses growth list now finishes CE20 after the existing
Bone Armor20 target. A sequential level2–80 fixture fails at CE8 before the
change and passes afterward, conserving native paid points, unrelated save
domains and idempotence. Only that affected case was rerun after correcting
the callback's generic-record typing; scoped types and unignored lint pass.
All failed setup/check receipts remain, the exact task cache is absent, and
`d02-corpse-late-growth-v1-closure.json` records verification costs and hashes.
No native save, combat reward, campaign progress or balance acceptance changed.
The latest previous turn was status-only/no progress; this turn closes this fix.

The flat CE20 base remains below ordinary Crystalline W4 Defense before
resistance. Allocation alone is not a throughput solution. Continue the
intended-power/first-clear review; prior coefficient/body-life experiments stay
rejected unless a separate prospective design and evaluation explicitly changes
the experimental context. Full private v1 and formal balance0/210 remain open.
Root retains human2 and required evidence through umbrella review; no external
blocker, browser restriction, CI requirement or pending user answer.

## Previous state — Both Crystalline priority alternatives rejected, 2026-11-03

The [two bounded diagnoses](../balance/2026-11-03-crystalline-priority-diagnoses.md)
complete 18 isolated battles. CE-first wins all W1 safety cases but draws all
W4 cases; protected Amplify also wins W1 and draws W4. No change selected.
Original inputs/source hashes, baseline evidence and cost chain authenticated;
both processes completed and owned caches absent. No combat replay for closure,
earlier-act replay, completed-training replay, native rewards or extra retries.
Carried expense is 221 admissions/207 training/43376518.83753783 combat ms/
403763.4059509309 wall ms/58175799 native journal bytes, under original ceilings.

Next trace authored damage/mitigation and intended allocation/preparation to a
grounded correction. Priority alone is insufficient; no engine bug is proven.
Native progress remains 13/19 Act V actions, next1594 terminal. Rejected CE
coefficient/body-life experiments stay rejected. Previous goal turn was a status
report/no progress; this turn closes both diagnostic accounts and resumes root
analysis. Full private v1, formal balance 0/210 and every broader gate remain
open. Browser works; CI excluded; no user answer needed. Root retains human2
and the required packet through umbrella review and owns eventual cleanup.

## Previous state — Crystalline W4 draws independently verified, 2026-11-03

The [native terminal result](../balance/2026-11-03-crystalline-defense-native-terminal.md)
closes3admissions/zero training/12waves (9wins/3draws). All three attempts clear
W1–3 and drawW4 with party alive. Independent readbackv1 passes exact complete
save/custody/economy/points/merc/quest/clock/seed/party/recovery/bounds without
combat replay.13/19ActV actions remain earned; next1594 is terminal. Exact cache
absent; processes terminal. Full expense carried under original ceilings.

Next diagnose CE starvation using retainedW4 and winningW1 inputs, one learned
CE-first order versus exact baselines, at most12isolated battles. Debuff refresh
is legal and statuses coexist; do not silently change engine recast semantics.
Previous goal turn was status-only/no progress; this turn records the native
terminal result and takes the next bounded diagnosis. Earlier acts/completed
training and passing tests are not repeated. Full privatev1/formal balance0/210
remain open, including restActV,14populations/holdouts/fairness,economy/Hell,
retry/manual-idle,30–50active-hour pacing,BUG592/performance,G0–G7,soak/review
and later owner playtest. Browser works;CIexcluded;no user answer needed. Root
retains human2/packet through umbrella review and owns eventual cleanup/release.

## Previous state — Crystalline defensive recipe verified, 2026-11-03

The [nine-battle diagnosis](../balance/2026-11-03-crystalline-defense-diagnosis.md)
reproduces all original events/final teams. Dim Vision→Decrepify→CE wins all
three retained Crystalline W1 inputs; baseline loses all three. Only that area's
intended profile order changes. Eleven distinct affected cases pass across the
green and corrected single-case runs; final scoped types/unignored lint pass.
No earlier-act or completed training replay. Exact recipe cache is absent.

Next prepare one prospective comparison from authenticated original pre1591,
carrying162attempts/159training/954waves and13ActV actions, plus all original
terminal costs and new diagnostic/appraisal costs under unchanged ceilings.
Original1459/1505/1594 remain exhausted; no abandoned rewards enter the branch.
The previous goal turn was status-only/no progress; this turn finalizes recipe
verification and moves toward native continuation. Full privatev1 remains active,
formal balance0/210; all broader gates remain. Browser works/CI excluded/no user
answer required. Root retains human2 and the evidence packet through umbrella
review and owns eventual cleanup/release.

## Previous state — Act V reaches level71; Crystalline defeats verified, 2026-11-03

The [changed-recovery comparison](../balance/2026-11-03-act5-recovery-native-terminal.md)
clears Frigid, trains lawfully to71, then exhausts Crystalline1591–1593 in
wave-one defeats. Next1594 is terminal;13/19main actions remain earned. New138
admissions/134training/809waves (801victories/5draws/3defeats),28,865,158XP.
Independent readbackv2 passes complete save/custody/economy/points/merc/quest/
clock/seed/party/recovery/bounds without combat replay. Its v1 local-name collision
and explicit v2 correction remain preserved. Production2147/campaign123inputs
are exact. Original1459/recipe1505/new1594 remain terminal; no extra retries.

BUG617 is fixed locally, uncommitted: ineligible trap sources skip exact matching;
104affected cases/types/lint pass. All12before/after observations match; median
129.884→115.163ms in that exact-wave benchmark, not whole-game acceptance.
Native work141374.450ms; all carried costs remain within original ceilings.
Launcher/reader exit0; exact cache absent; no live task process.

Next diagnose the three retained Crystalline inputs. Level36 Prayer dies at
3.240/6.480/9.720seconds, removing the main first-kill source; hero dies later
with ample mana. Inspect lawful learned protection/curse choices before tuning.
Do not repeat earlier acts, completed training, affected tests or terminal runs.
BUG611 remains open; rejected CE coefficient/body-life candidates stay rejected.

Full privatev1 remains active;formal balance0/210. RestActV,14populations/holdouts/
fairness,economy/recruitment/Hell,retry/manual-idle,30–50active-hour pacing,
BUG592/performance,G0–G7,soak/review and later owner playtest remain. Browser
works;CIexcluded;no pending answer/external blocker. Root retains human2 and
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
through umbrella review and owns eventual cleanup/release. Previous goal turn
was a verified wait on49252; this turn closes native execution and readback.

## Previous state — Act V comparison verified; redundant recovery fixed, 2026-11-03

[Native result](../balance/2026-11-03-act5-corpse-native-terminal.md): Frigid1456
clears first attempt; shared training nonwin limit stops Crystalline preparation
at66/next1505. New49admissions/48training/285waves,278victories/7draws/no deaths;
13/19main actions reached. Crystalline/Ancients/Throne/Baal remain unearned.
Independent readbackv3 verifies complete custody/save/merc growth/quests/bounds
without combat replay. Production2147/campaign123inputs authenticated. All
abandoned and technical costs remain charged; original1459/new1505 terminal.
Launcher/reader exit0; owned cache absent; no process running.

BUG616 is fixed locally: preparation and recovery share area-specific selection,
and recovery requires an actual learned-priority change before retrying. An
unchanged order uses existing ranked cleared-source fallback.49distinct affected
cases pass (48initial passes plus the corrected ranking-expectation case only);
scoped types/unignored lint pass. No broad repeat or native campaign rerun.
Test process is terminal and exact task cache absent; receipts remain in packet.
Next resolve overall Act V throughput/BUG611 through source/count/power review;
this harness fix does not establish route success or authorize reviving terminal
controllers. Any new comparison needs prospective authority with costs carried.

Full privatev1 active;formal balance0/210. RestActV,14populations/holdouts/fairness,
economy/recruitment/Hell,retry/manual-idle,30–50active-hour pacing,BUG592/performance,
G0–G7,soak/review and later owner playtest remain. Browser works;CIexcluded;no
pending answer/external blocker. Root retains human2/packet through umbrella
review and owns eventual cleanup/release. Required evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Previous state — Act V corpse recipe implemented; native comparison next, 2026-11-03

The [exact-wave diagnosis and recipe](../balance/2026-11-03-act5-corpse-rotation-diagnosis.md)
reproduce every baseline event/final team. Amplify → CE → physical wins all three
failed Frigid W5 inputs at53.357/57.215/55.218seconds with original gear. The
owned-weapon combination regresses one input and is not selected. Exactly12
isolated battles; no native rewards, retries or acceptance.

The intended profile now declares that order for all five Act V main areas via
an optional shared area priority. All38 distinct selected cases pass, including
seven new area/conservation/legacy/unlearned cases; scoped campaign types and
explicit unignored lint pass. Earlier failed verification receipts are retained.
No production formula, item, rank cost, native casting authority or controller
limit changed. The previous goal turn was a status report (no progress); this
turn corrects the final test assumption and closes the affected checks.

Next is one [predeclared native comparison](../balance/2026-11-03-act5-corpse-native-comparison.md)
from authenticated pre1456, carrying prefix custody and all abandoned original
costs under original ceilings. Original1459 remains terminal. No earlier-act
route replay or renewed global allowance. Full privatev1 stays active with
0/210 formal balance accepted; Act V,14populations/holdouts/fairness,economy,
retry/manual-idle,30–50active-hour pacing,BUG592/performance,G0–G7,soak/review
and later owner playtest remain. Browser works;CIexcluded;no user answer needed.
Root retains human2/packet through umbrella review and owns eventual cleanup.


## Previous state — Act V terminal independently verified; throughput diagnosis, 2026-11-03

The [bounded Act V continuation](../balance/2026-11-03-intended-act5-prepared-terminal.md)
clears Bloody Foothills/Shenk and claims the socket service, then stops at
Frigid Highlands W5 after three60s draws. Final level63/next1459;30admissions,
25training,163waves/156victories/7draws. The controller is terminal; no retry
renewal or restart. Act IV remains independently complete for this one build.

Independent journal/export readback passes without combat replay, reconciling
complete ordered custody,5984563XP including Shenk, paid points, merc XP/levels,
quest graph/reward/service, clock/ordinal/seed, party carry, recovery/fallback
and every declared bound. Production2147/campaign123inputs remain stable.
Process/reader exit0; task cache absent. Historical prefix metadata duplicates
three inherited Starts; unique history is authenticated separately and no native
action was replayed. Four reader-construction failures remain recorded.

Recorded Frigid waves show a throughput gap: hero survives with ample mana,
mercenary supplies nearly all direct damage, last attempt leaves one2091HP
survivor. Earlier +6→+80 CE growth was rejected for new fatal seeds and stays
rolled back. Next bounded exact-wave diagnosis compares baseline and already
learned physical/CE rotations with canonical owned-weapon projections; no
production tuning, earlier-act replay, rewards, saves or restored retries.

Previous goal turn was status-only (no progress). Current continuation closes
independent terminal accounting and corrects authoritative progress records.
Full privatev1 active;formal balance0/210. Earned rest of Act V,14populations/
holdouts/fairness,economy,retry/manual-idle,30–50active-hour pacing,BUG592/
performance,G0–G7,soak/review and later owner playtest remain. Browser works;
CIexcluded;no pending answer/external blocker. Root retains human2/packet
through umbrella review and owns eventual cleanup/release.

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Previous state — Intended Act IV complete; Act V next, 2026-11-03

The [new-authority comparison](../balance/2026-11-03-intended-act4-kill-xp-completion.md)
clears Izual, Hellforge and Diablo at49/56/61, claims all three quests and earns
Act V access. All13ordered actions succeed. Independent exact native export,
custody/economy/XP/merc/points/quest/clock/seed/party/recovery/fallback/bounds
readback passes without combat replay. New197admissions/191training,1101waves
(1094victories/7draws),27,059,870combatXP; next1429. All carried costs remain.
Original exhausted1235/1434 are preserved. Run/reader exit0; owned cache absent.

Previous goal turn completed the native-run observation and independent readback
(progress). Next extend the existing shared challenge controller with a thin
Act V main-route wrapper, then freeze one source-bound continuation from the
actual level61/next1429 export. Preserve all19main quest actions, native proofs,
source items, rewards and Nightmare entitlement. Use earned training, existing
recovery/owned gear/capacity and fixed bounds; no earlier-act route replay.

Full privatev1 active;formal balance0/210. Act V,14populations/holdouts/fairness,
economy,retry/manual-idle,30–50active-hour pacing,BUG592/performance,G0–G7,
soak/review and later owner playtest remain. Browser works;CIexcluded;no pending
answer/external blocker. Root retains human2 and packet through umbrella review
and owns eventual cleanup/release.

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Previous state — Shared XP correction verified; bounded comparison next, 2026-11-03

The [D02 implementation](../balance/2026-11-03-d02-kill-xp-implementation.md)
is complete locally: validated JSON kill rewards preserve enemy1–18 and grow
as level^2.5 above18. Exact level costs/inverse/cap90 and historical XP remain
unchanged.39distinct focused cases, scoped types/lint and actual Chromium mobile
startup/import pass. No broad repeat or earlier-act regression replay.

Zero-combat source/count analysis authenticates preparedpre1232 at49 and earned
Durance eligibility. At least76347XP per complete victory would close the gap
to56 in179wins within200entries. This conditional arithmetic does not establish
future wins, economy, source selection or30–50active-hour pacing.

Next freeze one distinct bounded comparison from that native export using new
production authority and opt-in ranked fallback. Carry102training/612victories,
three original quest Starts, original ceilings and full256060.07459ms original
wall expense. Original1235/successor1434 remain exhausted; no allowance renewal.
Previously earned Izual/Fallen Angel remains historical linear-reward evidence.

Full privatev1 active;formal balance0/210. Earned rest of ActIV/V,14populations/
holdouts/fairness,economy,retry/manual-idle,30–50active-hour pacing,BUG592/
performance,G0–G7,soak/review and later owner playtest remain. Browser works;CI
excluded;no pending answer/external blocker. Previous goal turn was status-only
(no progress); this continuation updates authoritative policy/progress records
and proceeds toward the next declared earned comparison. Root retains human2
and packet through umbrella review and owns eventual cleanup/release.

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Previous state — Izual earned; exact XP reference corrected, 2026-11-03

The [bounded offensive comparison](../balance/2026-11-02-intended-act4-offensive-comparison.md)
has completed:1232draw,1233victory,Izual/Fallen Angel Claim earned. River is never
admitted;200training entries exhaust at51/next1434. Independent earned readbackv2
and raw333991-byte export check pass without combat replay. Capacity v2 and paid
three-Eld preparation are integrated into one actual area clear. Producer's
expected-save failure/unreached no-op assertion remain preserved. Original1235
and successor1434 stay terminal; no costs or ceilings renewed.

[Ranked cleared-source fallback](decisions/P15-ranked-cleared-training-fallback-v1.md)
is implemented and locally verified, opt-in and unused by existing earned
profiles/drivers.74affected constructed cases pass; final four boundary cases,
scoped types and explicit lint pass after equivalent validator/callback cleanup.
No earned combat or earlier-act route replay in those checks. BUG613 remains
open: even a generous upper bound cannot earn the River target within200entries.

[Exact D02 reference and pacing analysis](../balance/2026-11-03-d02-xp-reference-and-pacing.md)
now verifies90native costs/totals and inverse boundaries against independent
integer arithmetic. The progression spec no longer presents wrong totals,
unapplied multipliers or the superseded16h first-clear estimate as locked.
Native formula/rewards are unchanged. Retained-wave accounting records
Durance724579XP/combat-hour; the original13,597,117XP River gap is18.77combat-hours
at that rate, not a future guarantee or player-active pacing measurement.

Next select chapter entry/completion bands and reward rates together under D02,
with a prospective source/rate/count feasibility check before another bounded
screen. Do not solve by extra farming, renewed allowances, reviving terminals,
or lowering targets solely to pass. BUG611 whole-build viability/BUG613 pacing
remain open; BUG612 capacity integration is verified for one earned clear.
Full privatev1 active;formal balance0/210. Earned rest of ActIV/V,14populations/
holdouts/fairness,economy,retry/manual-idle,30–50active-hour pacing,BUG592/
performance,G0–G7,soak/review and later owner playtest remain. Browser works;CI
excluded;no pending answer/external blocker. Root retains human2 and packet
through umbrella review;previous status-only turn was no progress.

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Previous state — Owned capacity recovered; earned Act IV comparison declared, 2026-11-02

Previous goal turn was status-only (no progress). Current continuation verifies
live human2 ownership, the final driver strict types and the actual native
preparation readback, closes BUG612 campaign capacity handling, and declares one
bounded earned Act IV comparison. Nativev6 retains backpack97/stash222 after4451
salvages/42756scrap/185transfers;3paidEld insertions raise actual fielded mercenary
attack356→581. The producer's failed expected-save assertion is preserved;
independent readbackv3 reconciles every final field and original captured export
without repeating operations. Its later repeated-insertion assertion was not run.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Preparation/readback: `p15-intended-offensive-sockets-v6-preparation.json` and
`p15-intended-offensive-sockets-v6-preparation-readback-v3.json`.
Earned driver: `p15-intended-act4-offensive-v1-driver.ts`; final scoped type
receipt: `p15-owned-capacity-collection-final-driver-types-v1-exit.json`.

Next freeze and execute that comparison from preparedpre1232, inheriting102
training admissions/612victories and all original ceilings, deducting the entire
original wall256060.07459ms. Preserve original exhausted1235 and3questStarts;
never replay Starts or earlier acts. No Act IV success is yet proven. Independent
journal/export readback follows without combat replay. Full privatev1 active,
formal balance0/210; all wider population/economy/pacing/performance/final review
requirements remain. Browser works; CI excluded; no pending answer/external blocker.


## Previous state — Act IV terminal draws independently verified, 2026-11-02

Challenge-level Act IV preparation and the existing native quest route are
implemented. The bounded earned run starts at the actual verified Act III
level47/next1130 export and ends level49/next1235:105 admissions,102 training,
624 settled waves (621 victories/3 draws),3101390XP,6795 acquired/5786 removed
items and16372197.047817042combatms. Prayer earns2325896XP; Rogue0.
All three Plains route attempts1232–1234 draw at60000ms; no Act IV area clears,
claim or boss receipt. The exhausted controller remains terminal; no pending
wave or renewed retry. Physical runtime256060.07459ms; process0/cache absent.

Independent `p15-intended-act4-prepared-v1-readback-v1.json` passes without
combat replay: exact native export, ordered custody/economy, points, quest
graph, clock/ordinal/seed, party carry, mercXP and preparation/retry/recovery
bounds. All2142 authority80 production and119 frozen campaign inputs match.
Its source-label accommodation explicitly authenticates102 Act III training
labels and3 Act IV route labels. Subsequent BUG610 corrects that shadowed
controller binding; two targeted regressions, scoped types and explicit lint
pass. Original source files and reader receipts remain immutable; do not rerun
the old live-manifest reader against legitimately edited campaign files.

[Act IV terminal report](../balance/2026-11-02-intended-act4-terminal.md) preserves
the failure and costs. BUG611 investigates first-kill/boss throughput using the
three exact retained failing waves. Hero survives with mana available, but
Teeth/Bone Wall occupy physical attack turns. Diagnose lawful learned rotations
at fixed complete teams/carry/RNG before changing behavior. Do not silently add
a Bone Spear release requirement or restart exhausted1235.

Full private v1 stays active; formal balance0/210. Act IV/V progression,14 earned
populations/holdouts/fairness, acquisition/funding/recruitment/Hell economy,
retry/manual-idle,30–50 active-hour pacing,BUG592/performance,G0–G7,soak/review
and later owner playtest remain. BUG608 stays open. Browser works; CI excluded;
no pending answer/external blocker. Root retains the claimed worktree/evidence
through umbrella review and owns eventual cleanup/release. The preceding
status-only turn was no progress; this increment records the terminal evidence
and investigates the next concrete offensive failure without campaign replay.

## Previous state — Bone Act III completion independently verified, 2026-11-02

The bounded intended Bone successor clears Durance and Mephisto, claims Guardian
and unlocks Act IV at level47 / next1130. Durance1128 draws;1129 wins. It starts
from the explicitly authenticated native domain projection after985, not an
original live save/export. The exhausted1147 comparison remains terminal.

Independent `p15-intended-act3-training-recovery-v1-readback-v1.json` passes
without combat replay: exact native export, ordered custody/earned economy,
paid points, quest graph/rewards, clocks/ordinals/seeds, party carry, mercXP,
training stance/fallback and inherited preparation/retry bounds. All2142
production authority79 inputs and116 frozen campaign inputs match. A separate
`-readback-count-correction-v1.json` supersedes only the rolling Durance count:
181 lifetime training admissions (39 inherited +142 new), within the original200.
The original reader reset that displayed counter after route victory; gameplay
and the independently checked bounds did not change.

The successor adds144 admissions (142training),864 settled waves (863victories,
one draw),4249860XP,9296 acquired/8094 removed items and21327947.625779625combatms.
Cumulative Act III costs remain577 admissions/571training and75870762.46330373
combatms. The offensive training stance carries49 admissions before the normal
source upgrade resets it. Physical execution294065.707461ms is within600000ms;
process0, no unsettled wave, exact task cache absent. No earlier farming/route
replay, renewed budgets or production tuning. See
[earned Act III report](../balance/2026-11-02-intended-act3-completion.md).

Next implement challenge-level Act IV preparation around its existing native
quest route, using the actual terminal47/next1130 export. Full private v1 stays
active; formal balance0/210. Current14 earned populations, holdouts/fairness,
acquisition/funding/recruitment/Hell economy, retry/manual-idle,30–50 active-hour
pacing, BUG592/performance, G0–G7, soak/review and later owner playtest remain.
BUG608 remains open. Browser works; CI excluded; no pending answer/external
blocker. Root retains the claimed worktree and exact evidence through umbrella
review and owns eventual cleanup/release. The previous status-only goal turn
completed the specific live readback and yielded its terminal proof; this turn
corrects its reporting counter and records the verified milestone.

## Previous state — training recovery validated; post-timeout source authenticated, 2026-11-02

The later Bone Act III continuation is independently reconciled at level44 /
next1147:173 new training admissions,873 victories/one draw and1,649,580XP.
Durance remains unentered; its original200-entry preparation allowance is
exhausted. Terminal1147 remains terminal. Earlier four-area/Orb progress stands.

The healthy ordinal985 training timeout is reproduced exactly. Replacing only
learned Decrepify with Amplify wins that fixed wave at40440ms. The optional
[training-only retry and same-source stance](decisions/P15-intended-training-draw-recovery-v1.md)
is implemented;36 distinct affected regression cases pass across retained runs,
including the unchanged200-entry cap. Scoped strict types and explicit lint pass.
No production combat/data change or earlier farming replay was performed.

An independent reader authenticates complete native domains after the985 draw,
ordered custody/economy, paid points, quests, mercXP, clocks/seeds and all original
controller costs. At next986 this prefix has433 admissions/429 training,
54542814.83752411combatms,39 Durance training entries and one training nonwin.
The native projector independently matches expected save normalization, gear
caches, the normal final60000ms clock update and settled map return, then verifies
restore/snapshot/export equality. This is explicitly an authenticated native
domain projection, not an original live save/export. Evidence: retained
`p15-training-recovery-prefix-readback-v2.json` and
`p15-training-recovery-prefix-projection-proof-v1.json`.

Next run only a declared bounded successor from next986, handing training stance
evidence to the final native combo boundary and retaining all spent limits.
The full failed1147 branch remains comparison history; no budget is renewed.
Full private v1 stays active; formal balance0/210. Current14 earned populations,
holdouts/fairness, acquisition/funding/recruitment/Hell economy, retry/manual-idle,
30–50 active-hour pacing, BUG592/performance, G0–G7, soak/review and later owner
playtest remain. Browser works; CI excluded; no pending answer/external blocker.
Root retains the claimed worktree and exact evidence through umbrella review.

## Previous state — Bone Act III checkpoint independently verified, 2026-11-02

The full challenge-level Act III preparation controller and native quest route
have now run from the verified Act II terminal32/next553 boundary. Great Marsh,
Flayer Jungle, Kurast Bazaar and Travincal clear at33/36/40/43. Khalim components,
Council, Will assembly/claim and the Compelling Orb sequence complete. Durance
and Mephisto remain unfinished; terminal level43/next974 is a wall-budget stop.

Independent `p15-intended-act3-prepared-v1-readback-v2.json` passes without combat
replay: exact native export, ordered custody/economy, paid points, quest graph,
clocks/ordinals/seeds, party carry, mercXP and preparation/retry bounds. All2142
production authority78 inputs and115 campaign inputs matched before changes.
The run retains421 admissions (417training),2413 settled victories,10043510XP,
24297 acquired/23073 removed items and7532460 PrayerXP (Rogue0). Most admissions
are farming; these counts do not represent completed campaign areas.

The600000ms physical execution slice reports601328.566489ms including the
wave-boundary check and finalization. One staged training suffix at ordinal973
was not settled or rewarded. The remaining original bounds are194 admissions,
183 total training entries,173 Durance training entries and127205816.172871
combat ms. An explicit authenticated continuation must retain all spent limits,
validate restored native state/quest prefix before mutation and abandon the
unplayed training suffix without settlement or awards. Its plan is ready;
implementation is next. No completed area or Claim may replay.

Full v1 remains unfinished; formal balance acceptance is0/210. Current intended
populations/holdouts/fairness, acquisition/funding/recruitment/Hell economy,
retry/manual-idle,30–50 active-hour pacing,BUG592/performance,G0–G7,soak/review
and later owner playtest remain. BUG608 stays open. Browser works; CI is excluded;
no pending answer or external blocker. The preceding status-only turn was no
progress; this continuation begins with implementation. Root retains the
claimed worktree/evidence packet through umbrella review and owns cleanup/release.

## Previous state — Bone Act II completion independently verified, 2026-11-02

[Shared physical-offense mercenary weapon selection](decisions/P15-intended-merc-weapon-offense-v1.md)
is implemented for all fourteen intended profiles. Other slots and historical
profiles retain their existing policy. Eighteen selector cases, fourteen-profile
registration and the native equipment-boundary integration pass, as do scoped
strict types and explicit lint. The prepared suffix also supports authenticated
Staff prefix20 before Tomb; all51 distinct affected cases pass.

All three retained Tomb boss states clear with the owned-offense weapon under
their original rotations/seeds. The bounded earned successor then restores
pre552, equips the owned polearm natively, clears six waves in one admission,
claims Seven Tombs and unlocks Act III. It earns35470XP and69items in
163767.8350515464combat ms, with no training, salvage or earlier route replay.
Terminal level32 / next ordinal553 is verified; exhausted terminal555 remains
terminal and all earlier failed branches/costs remain evidence.

Independent `p15-intended-tomb-weapon-v1-readback-v1.json` passes without combat
replay: exact native export, ordered custody/economy, paid points, quest graph,
cache rewards, clocks/ordinals/seeds, party carry, mercXP and suffix bounds.
All2142 production authority77 inputs and113 frozen campaign inputs match.
Prayer earns26602XP; Rogue0. Two full-backpack socket transfer refusals preserve
state; no new sockets or draw recoveries. Process0 and exact cache absent.

Next continue from this verified Act III boundary with full challenge-level
preparation for each area. The existing coarse Act III entry target26 is not
adequate evidence for later areas. No Act III earned continuation has run yet.
BUG608 stays open pending broader recovery evidence; this conditional success
neither tunes production combat nor accepts population balance.

Full v1 remains unfinished; formal balance acceptance is0/210. Fourteen earned
populations/holdouts/fairness, acquisition/funding/recruitment/Hell economy,
retry/manual-idle,30–50 active-hour pacing,BUG592/performance,G0–G7,soak/review
and later owner playtest remain. Browser works; CI is excluded; no pending
answer or external blocker. Root retains the claimed worktree/evidence packet
through umbrella review and owns eventual cleanup/release. The preceding
status-only goal turn was no progress; this increment records verified results
and proceeds to Act III preparation.

## Previous state — Arcane cleared; earned Tomb boss draws reconciled, 2026-11-02

[Learned draw recovery](decisions/P15-intended-draw-curse-recovery-v1.md) and
authenticated retry carry are implemented for the intended Bone profile. All
affected regression checks, scoped strict types and explicit lint pass. The
earned continuation clears Arcane at level 28, completes four native quest
actions and earns level 32 before exhausting three Tomb boss attempts.

The recorded continuation contains 151 new admissions, 147 training admissions,
815 waves, 811 victories and four draws. One training draw triggers the existing
Dark Wood fallback; the other three are Tomb boss draws. Earned totals are
1,955,780 XP and 8,122 acquired / 7,620 salvaged items. No earlier training or
route admission was replayed. The exhausted terminal level 32 / next ordinal
555 must not be extended; the original failed branches remain retained.

Independent `p15-intended-draw-recovery-v1-readback-v4.json` now verifies the exact
native export, ordered custody/economy, points, quest graph/settlements,
clocks/ordinals/seeds, party carry, merc XP and carried retry limits. It also
validates 310 refused socket transfers and 22 refused stash retrievals without
state changes. Earlier reader failures are retained; native full-backpack
refusals and the fielded merc's quest XP share explain them. No combat replay
or repeated tests repaired the audit. Production authority 77 remains exact.

All three recorded Tomb boss waves are analyzed in
`p15-bone-tomb-turn-economy-v1.json`. Duriel starts at 25,600 Life and finishes at
21,270 / 3,832 / 4,973. Offensive recovery substantially improves damage, but
the nearly full-Life/Mana party still times out. Next inspect the declared
corpse/curse build's boss damage and lawful owned-offense/rotation tradeoffs.
BUG608 stays open; no production tuning or population acceptance follows from
this conditional run. The previous status-only goal turn was no progress;
this turn completes readback and recorded-state analysis.

Full v1 remains unfinished; formal balance acceptance is 0/210. Fourteen earned
populations/holdouts/fairness, acquisition/funding/recruitment/Hell economy,
retry/manual-idle, 30–50 active-hour pacing, BUG592/performance, G0–G7,
soak/review and later owner playtest remain. Browser works; CI is excluded;
no pending answer or external blocker. Root retains the claimed worktree and
evidence packet through umbrella review and owns eventual cleanup/release.

## Previous state — prepared suffix verified; three Arcane draws, 2026-11-02

[Prepared Act II suffix](decisions/P15-prepared-act2-suffix-v1.md) now validates
native cube/Staff prefixes and preceding clears before mutation, reusing existing
training/fallback/retries. All88 distinct affected cases pass; final11suffix
cases, scoped strict types and explicit lint pass after cleanup. No broad test
repeat or earlier campaign replay.

The earned suffix from authenticated28/ordinal403 exhausts three Arcane attempts:
18waves/15victories/three boss draws. One exact known control, two new retries;
no training/new sockets. Totals42900XP,144acquired/98salvaged items,
580068.3726708074combat ms. Independent v2 exact export/ordered custody/economy/
points/quests/clock/seed/party/mercXP and all six detailed parent-control wave
observations reconcile without replay. Syntax-failed reader v1 is retained.
Terminal28/next406 must not be extended; no Arcane clear/Tomb entry/quest action,
Staff prefix16 unchanged. Hero/Prayer finish full Life; Summoner216/1445/312Life.

BUG608 remains open. Recorded events show16defensive curse casts per boss draw,
with Prayer supplying most boss damage. Next investigate learned offensive
curse/utility/equipment strategy before a declared bounded earned comparison.
No speculative production tuning or per-seed victory selection. The previous
status-only goal turn was no progress; this increment completes independent
reconciliation and advances the recorded-state damage investigation.

Full-v1 unfinished; formal balance0/210. Fourteen earned populations/holdouts/
fairness,acquisition/funding/economy/recruitment/Hell,retry/manual-idle,30–50active-
hour pacing,BUG592/performance,G0–G7,soak/review/later owner playtest remain.
Browser works;CI excluded;no pending answer/external blocker. Root retains the
claimed worktree/packet through umbrella review and owns eventual cleanup/release.

## Previous state — owned sockets earn28; Arcane boss draws, 2026-11-02

[Owned-socket policy](decisions/P15-intended-owned-sockets-v1.md) is enabled for
all14 intended profiles. All13 affected socket cases plus the14-profile identity/
historical-isolation assertion and final scoped types/explicit lint pass. Native
zero-combat earned preparation confirms20paid insertions,32flat magic mitigation
each, shield resistance and unchanged attack/speed/Life/Mana.

One declared earned branch from original Lost City22/ordinal262 completes141
training admissions, earns28, wins five Arcane waves, then draws at its boss.
Total142admissions/711waves/710wins/one draw,1774780XP,6978acquired/6498salvaged
items,22paid insertions,13415809.389607545combat ms/105.215s wall. Independent
v2 exact export/ordered custody/socket costs/economy/points/quests/clocks/seeds/
party/mercXP readback passes without replay. Prayer21→24 earns1331052XP; Rogue
remains17/zeroXP. Hero/Prayer finish the draw at full Life; Summoner216Life.
Terminal28/next404; no Arcane clear/new quest action, Staff prefix16 unchanged.
The terminal diagnostic must not be extended. BUG608 remains open.

Next add a checked prepared-controller suffix entry, then exercise existing
bounded native retries from authenticated pre-Arcane28/ordinal403. Retain the
known draw and all ancestor costs; do not replay141training admissions or tune
production from one healthy-party draw. The failed reader's draw-winner
assumption and preflight type assertion are retained; final checks pass.
All consumers terminal/exact owned cache absent. Previous turn was status-only/
no progress; this increment changes shared preparation and adds earned evidence.

Full-v1 unfinished; formal balance0/210. Fourteen earned populations/holdouts/
fairness,acquisition/funding/economy/recruitment/Hell,retry/manual-idle,30–50active-
hour pacing,BUG592/performance,G0–G7,soak/review/later owner playtest remain.
Browser works;CI excluded;no pending answer/external blocker. Root retains the
claimed worktree/packet through umbrella review and owns eventual cleanup/release.

## Previous state — defensive priority improves training; owned sockets next, 2026-11-02

[Updated Act II evidence](../balance/2026-11-02-intended-act2-training.md) records
BUG609's persistent safe fallback (40 affected cases/types/lint pass) and the
[defensive-priority policy](decisions/P15-intended-defensive-curse-priority-v1.md)
(11 actual affected assertions/types/lint pass). The earned diagnostic improves
eight wins to17:4admissions/18waves/one defeat,39360XP,143acquired/133salvaged
items. Three Dry Hills farms clear; fourth loses wave3. Terminal22/next266,
no Arcane entry/new quest action. Independent exact export/custody/economy/
points/clock/seed/safe-selection/party/merc-XP readback passes without replay.

A two-battle exact-control Teeth-before-Wall comparison still loses and is
rejected; no promotion. BUG608 remains open. Next evaluate native owned-gem
preparation in empty sockets, preserving material conservation and all failed
histories. Do not extend exhausted branches or replay unchanged earlier routes.
The full prepared controller has fallback/retry; these first-nonwin diagnostics
do not establish failure of that complete policy.

The previous goal turn was status-only/no progress. This continuation rechecks
authority77/2142 production and113campaign inputs, closes retained evidence hashes
and updates progress records before the next implementation. Full-v1 unfinished;
formal balance0/210. Fourteen earned populations/holdouts/fairness,acquisition/
funding/economy/recruitment/Hell,retry/manual-idle,30–50active-hour pacing,
BUG592/performance,G0–G7,soak/review/later owner playtest remain. Browser works;
CI excluded;no pending answer/external blocker. Root retains the claimed worktree
and packet through umbrella review and owns eventual artifact cleanup/release.

## Previous state — Act II lower-level selection fixed; survival finding open, 2026-11-02

[Training evidence](../balance/2026-11-02-intended-act2-training.md) closes BUG607
locally: intended preparation reselects cleared Act I/II challenges by full
maximum<=entry level minus2; no source stops before admission. Audit uses recorded
entry levels/prior clears. Both new RED cases reproduce; all37 affected cases
and final scoped strict types/explicit lint pass. No unrelated tests or earlier
campaign route replay. Production77/2142 inputs exact;113 campaign inputs change
two paths since area-curse freeze (eight cumulative).

Two bounded earned Arcane-preparation comparisons from authenticated Lost City22/
ordinal262 are terminal. Latest-cleared Lost City yields2admissions/10waves/9wins/
1draw. Corrected shared selection farms Dry Hills(max20), yielding2admissions/
9waves/8wins/1defeat,16810XP/60acquired/45salvaged items. Prayer dies to wave3
casters and hero enters wave4 at77Life; minimum Mana302. BUG608 records the
remaining survival/progression finding. Both independent journal/export/custody/
economy/points/clock/seed/party readbacks pass without combat replay. No Arcane
admission/new quest action; both branches stop22/next264, retain ancestor and
comparison failures/costs, and must never be extended.

The preceding report turn closed the retained RED handle and verified the next
action; this increment implements the correction and adds earned evidence.
Next inspect native wave3 caster damage/recovery and currently owned defense
alternatives before declaring a new single-variable policy/tuning diagnostic.
Full-v1 unfinished, formal balance0/210; fourteen earned populations/holdouts/
fairness,acquisition/funding/economy/recruitment/Hell,retry/manual-idle,30–50active-
hour pacing,BUG592/performance,G0–G7,soak/review/later owner playtest remain.
Browser works;CI excluded;no pending answer/external blocker. All consumers
terminal/exact owned caches absent;root retains claimed worktree/required evidence
through umbrella review and owns eventual artifact cleanup/release.

## Previous state — Far Oasis and Lost City conditional clears, 2026-11-02

[Updated survival-curse evidence](../balance/2026-11-02-intended-survival-curse.md)
retains the exhausted original branch. The no-Teeth fallback draws and is rejected;
already learned Amplify clears Far Oasis in one admission/five victories. The
frozen area preference uses Amplify there and restores the defensive default
elsewhere. Eleven distinct affected cases, final scoped strict types and lint
pass. Production authority77/2142 inputs is unchanged; six campaign files changed.

One authenticated successor continuation clears Lost City in one admission/six
victories and completes Staff preparation (Act II action prefix16). Independent
journal/export/ordered custody/earned economy/points/clock/seed readback passes
without combat replay. A failed preflight made zero admissions or mutations;
failed reader attempts are retained. The successful level22 Lost City diagnostic
is below the whole-challenge preparation target26: it is conditional evidence,
not compliance with that preparation policy or fresh-population acceptance.

Next earn Arcane target28 from the authenticated Lost City successor, then resume
only the remaining Act II suffix; Tomb whole-challenge target32. Stop first
nonwin, retain native checkpoints and original failed histories/costs. Update the
artifact inventory after the new evidence. Full-v1 unfinished, formal balance
acceptance0/210; fourteen earned populations/holdouts/fairness, funding/economy/
recruitment/Hell, retry/manual-idle,30–50 active-hour pacing,BUG592,G0–G7,
soak/review/later owner playtest remain. Browser works; CI excluded; no pending
answer/external blocker. Root retains the claimed worktree/evidence packet
through umbrella review and owns eventual artifact cleanup/release.

## Previous state — intended curses clear Dry Hills; Far Oasis draws, 2026-11-02

[Survival-curse result](../balance/2026-11-02-intended-survival-curse.md) independently
reconciles130admissions/642waves/635wins/four defeats/three draws. Rocky Waste
clears first try; Dry Hills clears third try at20. Far Oasis260/261/262 all draw
at Radament at22with hero alive/ample Mana. Source77and113campaign inputs exact;
full export/economy/ordered custody/clock/seed/quests/retry/merc carry pass.
Seven native pre-route saves now preserve reusable earned preparation. Original
failed reader retained; corrected v2 handles exact draw outcomes without replay.

This increment completes BUG606local policy evidence and produces new earned
results. Next one bounded native physical-fallback diagnostic from authenticated
pre-Far-Oasis260; no earlier Act I/II replay or extension of exhausted trial.
Full-v1 unfinished,accepted balance0/210; populations/funding/economy/Hell,
retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,soak/review/laterplaytest
remain. Browser works;CI excluded;no pending answer/external blocker. Root
retains worktree/packet through umbrella review and owns eventual cleanup/release.


## Previous state — survival-curse policy checked, earned trial next, 2026-11-02

[Defensive pilot](../balance/2026-11-02-intended-defense-act2-pilot.md) independently
reconciles82admissions/392waves/388wins/four defeats. Rocky Waste clears; Dry
Hills exhausts three attempts at20. Native living-merc carry/fresh-admission rules,
full export, economy and ordered custody pass without combat replay. This
supersedes the older83admission/407wave companion trial, whose history is retained.

[Survival-curse policy](../balance/2026-11-02-intended-survival-curse.md) resolves
BUG606 locally: one learned Amplify/Weaken/Decrepify is submitted through native
combo controls. Eight selected cases plus scoped strict types/lint pass. No
production mechanic/data change. The previous report turn completed retained
check handles and yielded the evidence allowing this freeze (progress).

Next one declared curse-policy branch from the authenticated Act I before-claim
checkpoint; capture native pre-route saves. Keep equipment/Prayer/training/retry
budgets and failed histories; no unrelated tests or unchanged Act I replay.
Full-v1 unfinished, accepted balance0/210; populations/funding/economy/Hell,
retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,soak/review/laterplaytest
remain. Browser works;CI excluded;no pending answer/external blocker. Root
retains worktree/packet through umbrella review and owns eventual cleanup/release.


## Previous state — intended companion and owned defense verified, 2026-11-02

[Companion/rotations](../balance/2026-11-02-intended-companion-preparation.md):
seven native companion cases and12selected remaining rotation assertions pass;
scoped strict types/lint pass. Authenticated Act I continuation clears Rocky
Waste but exhausts three Dry Hills attempts at20:83admissions/407waves/403wins/
four defeats. Full independent journal/export/economy/ordered custody readback
passes without combat replay. Parent failures/budgets remain retained.

[Owned defense](../balance/2026-11-02-intended-owned-defense.md): all14intended
profiles opt into existing mixed Act II defensive gear and stash retrieval.
Equipment-only earned-save diagnostic improves hero lightning17→37/merc29→46,
with explicit Life/Mana tradeoffs and attack/speed preserved. BUG605 reserved
Iron Golem armor fixed after both owners reproduce RED. All47affected cases,
scoped strict types/lint pass. All2142production inputs retain authority77;
113campaign inputs freeze exactly four changed paths and all other profile
fields/historical source exact. No combat replay for this defense increment.

Previous status-only goal turn: no implementation progress. This turn closes
retained verification, records BUG605 resolution and updates authoritative
progress pointers. Next one declared authenticated pre-failure defense branch;
do not extend exhausted trials or replay unrelated campaigns. Full-v1 unfinished,
accepted balance0/210. Population/funding fairness,economy/recruitment/Hell,
retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,soak/review/laterplaytest
remain. Browser works;CI excluded;no pending answer/external blocker. Drivers
terminal/exact owned caches absent;root retains worktree/packet through umbrella
review and owns eventual cleanup/release. Exact retained artifact hashes verified
in packet p15-intended-preparation-artifact-closure-v1.json.

## Previous state — intended CE reaches Act II, 2026-11-02

[Corpse rotation/allocation evidence](../balance/2026-11-02-intended-corpse-rotation.md):
CE-first priority plus first CE point before optional curses. Six affected
native cases pass, with sequential level-six RED reproduced; scoped types/lint
pass. Fresh v1 stops at7without CE. Fresh v2 learns it at6, clears Act I and
reaches18before three Rocky Waste defeats:181admissions/645waves/636wins/
nine nonwins.1753CE casts consume1753corpses/pay35060mana. Independent full
journal readbacks reconcile earned state/export and corpse/resurrection events.
Reader-only resurrection and negative-zero corrections preserve original failures.
All2142production inputs retain authority76;111campaign inputs freeze exactly
two changed paths. Other profiles and production mechanics/data unchanged.

Previous goal turn was status-only/no progress. This increment corrects an
earned allocation defect and produces new native evidence. Next remaining role
rotations and shared companion/training/funding policy; do not extend exhausted
histories or replay unrelated campaigns. Full-v1 unfinished/accepted balance0/210.
Economy/recruitment/Hell,retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,
soak/review/laterplaytest remain. Browser works;CI excluded;no pending answer or
external blocker. Drivers terminal,no task cache/build;root retains required
worktree/packet through umbrella review and owns eventual cleanup/release.

## Previous state — intended Javelin recovery reaches Act II, 2026-11-02

[Javelin/recovery evidence](../balance/2026-11-02-intended-javelin-recovery.md):
seven native Javelin allocation/cast checks and50distinct affected recovery
checks pass;scoped strict types/explicit lint pass. All14intended profiles share
cleared-level-margin-v1, with historical profiles unchanged. One fresh pilot
retains its Dark Wood loss, earns13in ten Cold Plains challenges, retries and
clears Act I. It reaches20and stops after three Dry Hills route defeats:
220admissions/837waves/830wins/seven defeats. Independent journal readback
reconciles earned state/export and source76;no production code/data changed.

Previous status-only turn was no progress; this increment completes policy
checks and yields a new earned result. Next remaining role rotations and shared
companion/training/funding policy; do not extend exhausted histories or replay
unrelated campaigns. Full-v1 unfinished,accepted balance0/210. Remaining economy,
retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,soak/review/laterplaytest
remain. Browser works;CI excluded;no pending answer. Drivers terminal,no task
cache/build created;root retains required worktree/packet through umbrella review.


## Previous state — intended owned equipment verified, 2026-11-02

[Owned equipment](../balance/2026-11-02-intended-owned-equipment.md) now supports
backpack/stash upgrades for all fourteen intended profiles, native capacity
fallback, throwing/claw identity and reserved-item protection.113 distinct affected
cases pass; final explicit lint/scoped strict types pass. Source76 retains2,142
production inputs; only campaign discovery changes.111campaign inputs freeze five
changes. Authored data, production game source and22historical profiles remain exact.
No campaign replay. The previous status-report turn made no implementation progress;
this turn freezes completed equipment evidence and resumes the next safe action.

Next companion/training/funding and role rotations before fresh intended-build
populations/holdouts. Full-v1 unfinished, accepted balance0/210. Remaining economy,
retry/manual-idle,30–50active-hour pacing,BUG592,G0–G7,soak/review/laterplaytest gates
remain. Browser works;CI excluded;no pending answer/external blocker. Root retains
the required worktree/evidence through umbrella review and owns eventual cleanup.

## Previous state — fourteen intended growth profiles verified, 2026-11-02

[Versioned intended growth](../balance/2026-11-02-intended-build-growth.md) now
registers fourteen allocation candidates with later signatures, prerequisites
and masteries.93 distinct affected cases pass; explicit lint/scoped strict types
pass. Both sequential and batched native level grants conserve points, retain
earned ranks/reset budgets and project learned active signatures. Source75
retains2,142production inputs; only campaign test discovery changes.110campaign
inputs freeze three new files/two additive registry/profile changes; all22old
profile bodies and authored game data remain exact. No campaign replay.

Previous goal turn was status-only/no progress. This turn implements and verifies
the next available action. Next attainable weapon/gear, companion/training,
funding and role-rotation policies before fresh14-build populations/holdouts.
Growth fixtures supply XP to test allocation and are not earned-route acceptance.
Full-v1 unfinished, accepted balance0/210build×act×role. All remaining economy/
retry/manual-idle/pacing/BUG592/G0–G7/soak/review/laterplaytest gates remain.
Browser works;CI excluded;no pending answer. All new drivers terminal/exact owned
collector cache absent;root retains required worktree/packet through review.

## Previous state — map enemy levels verified, 2026-11-02

[BUG603](../balance/2026-11-02-map-enemy-levels.md) replaces the misleading
recommendation with actual whole-challenge enemy extrema.119engine/planner,
12UI cases, scoped strict types/lint/purity and18ordinary browser cases pass.
Source74 freezes2,142production inputs, exactly six projection/map/locale/test
changes from73. Authored data and107campaign inputs are exact. No campaign or
unrelated suite replay. Previous goal turn inspected newly completed check
handles and yielded evidence that permits this closure; it was progress.

Next freeze executable intended-build growth and attainable acquisition/funding
policy before fresh14-build populations and holdouts. Full-v1 remains active,
accepted balance0/210 (14builds×five acts×three encounter roles, not difficulties).
All population/pacing/economy/retry/manual-idle/BUG592/G0–G7/soak/review/later
owner-playtest gates remain. Browser works; CI excluded; no pending answer.
Root retains required worktree/packet through umbrella review and owns cleanup.

## Previous state — whole-challenge Bow Act II completes, 2026-11-02

[Whole-challenge preparation](../balance/2026-11-02-challenge-level-preparation.md)
implements explicit targets18/20/22/26/28/32;55distinct affected cases,scoped types/
lint pass. One authenticated pre-claim Act I continuation completes all six Act II
areas:407admissions/2,131waves/2,124wins/seven defeats;terminal32/nextNormal523.
Native custody,resources,rewards,seeds/clock and exact export pass independent
readback without combat replay. A reader-only negative-zero correction retains
the original failed readback. Source authority73/authored data unchanged;107
campaign inputs freeze exactly six campaign changes. Combat5.105hours/process
223.884seconds is not active-player pacing or population/balance acceptance.

Previous status-only turn: no implementation progress. This turn closes the
completed diagnostic and updates the authoritative pointers. Next address the
preparation information available to ordinary players and freeze attainable
build/power policies before population/holdout evaluation. Full-v1 unfinished;
accepted balance0/210. Remaining:14fresh populations/holdouts/funding fairness,
economics,retry/manual-idle,30–50active hours,BUG592,integratedG0–G7,soak/review,
then ownerplaytest. Browser works;CI excluded;no pending answer/external blocker.
Drivers terminal/exact owned caches absent;root retains packet/worktree through
umbrella review and owns eventual cleanup/release.

## Previous state — parser-owned save JSON retained, 2026-11-02

[Current JSON decoding](../balance/2026-11-02-parser-owned-save-json.md) passes
207 distinct affected cases, scoped strict types/lint and purity. Exact matched
production builds complete all24ordinary import/reload operations with complete
8,540-item native/public state equality, no browser errors or overflow. Median
import desktop468→293ms/mobile1360→957ms; reload desktop768→825ms/mobile3447→2494ms.
Direct decode230→95ms. Small local samples and remaining long tasks keep BUG592
and budgets open. Authority73 independently verifies2,141production inputs with
exactly five source/test changes from72; authored data/107campaign inputs exact.
The failed development-mode build is retained; actual production mode is asserted.

The preceding status turn was a verified wait on live driver70743. This increment
finishes its verification and records the retained implementation. Next resolve
build acquisition/level/preparation policy from retained Bow losses; no campaign
replay or further admissions on exhausted histories. Full-v1 unfinished,accepted
balance0/210. Remaining:14fresh build populations/holdouts/funding fairness,
recruitment/Hell economics,retry/manual-idle,30–50active-hour calibration,BUG592,
integratedG0–G7,two-hour soak/review,then owner playtest. Browser works;CI excluded;
no pending answer/external blocker. Drivers terminal; exact task caches/builds/
typeinfo/browser profile absent. Root retains required packet/worktree through
umbrella review and owns eventual cleanup/release.

## Previous state — Act II conditional screen completed, 2026-11-02

[Four Amazon setups × 100 seeds](../balance/2026-11-02-act2-amazon-conditional-screen.md)
complete 400 native area trials/2,316 waves. Independent reward/custody/resource
readback passes. All selected level/role-matched targets win100/100; whole-area
wins68/79/100/93 retain60later-wave deaths, no draws or observed zero mana.
Historical setups have unequal funding/gear/time: conditional tuning evidence
only, not fresh progression, fairness, pacing, holdouts or balance acceptance.
Authority72/data unchanged; no production edit or coefficient tuning follows.
No further admissions on exhausted histories and no unchanged screen replay.

The preceding status-report turn made no implementation progress. Completed
screen documentation/evidence closure now supersedes the older current pointer.
Next inspect retained BUG592 CPU evidence for a targeted root fix, while fresh
acquisition/intended-power policy remains unresolved. Full-v1 unfinished;
accepted balance0/210. Remaining:14fresh build populations/holdouts/funding,
recruitment/Hell economics,retry/manual-idle,30–50active-hour calibration,BUG592,
integratedG0–G7,two-hour soak/review,then owner playtest. Browser works;CI
excluded;no pending answer/external blocker. Driver terminal/exact cache absent;
root retains worktree/required packet through review and owns eventual cleanup.

## Previous state — managed Bow stash verified; progression remains open, 2026-11-02

[Managed stash preparation](../balance/2026-11-02-bow-managed-stash.md) passes144
distinct affected cases,scoped types/lint. Authority72 freezes2,141 production/107
campaign inputs;src/authored data unchanged from71. Fresh pilot:219 admissions,
828 waves,820 wins/eight defeats;level21/nextNormal219. Three Act II route areas
clear;Lost City216/217/218 all lose wave3,exhausting retries. Independent complete
journal/native-save/custody readback passes:55 staging transfers,five retrievals,
zero refusals;first347 waves equal the previous pilot. Current mana remains
available;health attrition/elemental damage are observed,not a proven code defect.
No seed-specific coefficients or further admissions on exhausted histories.

Previous status-only turn made no implementation progress. Next reuse existing
70-source/build-identity/role evidence to find a generalizable progression issue
and freeze intended-power/population policy. Do not repeat source audits or
passed campaigns. Full-v1 unfinished,accepted balance0/210. Remaining:14fresh
build populations/holdouts/funding fairness,recruitment/Hell economics,retry/
manual-idle,30–50active-hour calibration,BUG592,integratedG0–G7,two-hour soak/
review/later owner playtest. Browser works;CI excluded;no pending answer/external
blocker. All drivers terminal;exact collector cache absent. Root retains required
worktree/packet through umbrella review and owns eventual cleanup/release.

## Previous state — quest schema dispatch retained, 2026-11-02

Previous goal turn completed the live browser handle63232 and inspected its
passing report, yielding evidence for retaining the candidate. This turn closes
the independent source/save/timing readback. [Schema dispatch](../balance/2026-11-02-quest-objective-dispatch.md)
passes394affected tests and both generated browser validators'1,013-case corpus.
Complete native/public8,540-item state remains exact. Mobile first2356→1750ms,
warm median1149→1052ms; desktop roughly unchanged. Local development diagnostics
leave BUG592/budgets open. Authority70 independently re-enumerates2,141production
and106campaign inputs; only the schema changes from69. Gameplay content and all
earned checkpoints remain exact. No passing suites/campaigns replayed.

Next unresolved build progression using retained Bow failure diagnostics; do not
extend exhausted histories. Full-v1 unfinished, accepted balance0/210. Remaining:
14fresh build populations/holdouts/funding fairness, recruitment/Hell economics,
retry/manual-idle,30–50active-hour calibration,BUG592,integratedG0–G7/two-hour
soak/review/later owner playtest. All new consumers terminal/exact owned caches
absent. Candidate browser profile path was not captured; closure reported no
error. Inherited Bow artifact closure remains outstanding. Root retains active
worktree/packet through review and owns eventual cleanup/release. Browser works;
CI excluded; no pending answer or external blocker.

## Previous state — owned Bow policy verified; fresh pilot fails, 2026-11-02

The preceding status-report turn was no progress. The next safe action completed:
[owned Bow defense](../balance/2026-11-02-bow-owned-survival.md) is integrated,
with five new final passing cases,93distinct affected passing cases across retained
runs, scoped strict types and explicit lint. Authority69 freezes exactly five
campaign changes from67;2,141production inputs, authored data and original Bow
profile are unchanged. Intermediate68was not used for gameplay.

One fresh declared pilot records134admissions/419waves/417wins/two defeats;
terminal14/nextNormal134 loses Rocky Waste133 wave4. Native gear trades, every
wave, clock/ordinal/seed, economy and exact final export independently read back.
No exceptions or unmeasured/unobserved waves. Policy not promoted; all failed
histories remain terminal. No seed-specific coefficients/targeting/paralyze fix.
Next return to BUG592 using the retained browser profile; no broad test replay.

Full-v1 unfinished, accepted balance0/210. Remaining:14-build fresh populations,
holdouts/funding fairness, recruitment/Hell economics, retry/manual-idle,
30–50active-hour calibration, BUG592, integratedG0–G7, two-hour soak/review,
then owner playtest. Browser works; CI excluded; no pending answer/external
blocker. Drivers terminal, exact collector caches absent; root retains worktree
and required packet through review and owns eventual cleanup/release.

## Previous state — Slow Missiles corrected; owned Bow equipment policy underway, 2026-11-02

[BUG602/defensive Bow](../balance/2026-11-02-bow-survival-rotation.md) is verified:
55distinct affected passing cases plus scoped types/lint. Authority67 preserves
all106campaign inputs and authored data. The post-fix paired fresh pilot has
153admissions/509waves,506wins/3defeats,425,980XP and5,062acquired/4,840salvaged
items; independent v2 readback reconciles the complete journal/custody/native
export without combat replay. Terminal16/nextNormal153 loses Dry Hills152 wave3
with at least167mana. Rocky Waste clears. Earlier losses and reader failures
remain retained; no population or active-hour acceptance follows.

The preceding status-report turn made no implementation progress. Inspection
now establishes that the Bow policy omits existing owned survival selection;
[the new opt-in equipment policy](decisions/P15-bow-owned-survival-v1.md) is
specified and its native integration checks are being run before implementation.
No speculative targeting, paralyze, merc-weapon or coefficient fix is justified.
Existing exhausted branches stay terminal; source checkout remains read-only.

Full-v1 unfinished, accepted balance0/210. Remaining:14-build fresh populations,
holdouts/funding fairness, recruitment/Hell economics, retry/manual-idle,
30–50active-hour calibration, BUG592, integratedG0–G7, two-hour soak/review,
then owner playtest. Browser works; CI excluded; no pending answer/external
blocker. Root retains the active worktree and required packet through review
and owns eventual cleanup/release.

## Previous state — Dry Hills retries exhausted; Bow defense policy next, 2026-11-02

[Act II preparation](../balance/2026-11-02-act2-area-preparation.md) remains
implemented with13controller/33affected checks and scoped types/lint passed.
Owned-defense preparation and ordinary19-item capacity recovery equip hero and
merc helmets without grants or purchases. The original Dry Hills loss plus
two remaining native retries all fail; retries164/165 die on ordinary wave3
against18/19enemies, primarily lightning/cold, with mana available. Terminal
L16/nextNormal166; no further admissions on this branch. Independent native
journal/custody readbacks pass without combat replay, retaining diagnostic
assertion failures. The separate historical Arcane branch also stays exhausted.

Authority65/2,141production/106campaign inputs and authored game data remain
unchanged. All70pre-clear source audits and canonical earned72/Hell1043 are
retained. The4DEX/1VIT volley-only profile omits existing projectile defense;
next declare and validate a separate defensively prepared Bow policy before
any fresh trial. No damage coefficient or engine defect has been established.
The preceding status-only turn made no implementation progress.

Full-v1 unfinished, accepted balance0/210. Remaining:14-build fresh populations,
holdouts/funding fairness, recruitment/Hell economics, retry/manual-idle,
30–50active-hour calibration, BUG592, integratedG0–G7, two-hour soak/review,
then owner playtest. Browser works; CI excluded; no pending answer/external
blocker. Drivers terminal, exact caches absent. Root retains the active worktree
and required packet through review and owns eventual cleanup/release.

## Previous state — earned bow Act II retry exhausted, 2026-11-02

The preceding status-report turn made no implementation progress. The next
available action has now completed: native owned preparation and the two
remaining Arcane attempts, independently read back without combat replay.
[Defeat/retry evidence](../balance/2026-11-02-native-defeat-retry.md) retains
the entire chronology. Training earned level14→18 with44 area wins/10 losses
before exhausting its declared nonwin limit. Owned defensive helmets and four
earned Orts raise displayed lightning resistance15→23→83 (ordinary75 damage
cap). Arcane attempts2/3 both lose wave3 against level26 enemies; no training
counter or route-attempt budget was reset. The final increment earns12,480XP,
20 items and spends four Orts; terminal level18/Normal201 is captured exactly.

Authority64 remains current:2,141 production and104 separately frozen campaign
inputs are unchanged. All70 distinct build/act pre-clear sources have already
been audited; do not repeat that audit. Canonical earned72/Hell1043 stays intact.
Next inspect route level/preparation selection against the authored act curve;
this exhausted policy permits no additional training or Arcane admissions.
No source formula has been changed to force these observations to pass.

Full-v1 unfinished, accepted balance0/210. Remaining scope includes14-build
campaigns/populations/holdouts/funding fairness, recruitment/Hell economics,
defeat/retry/manual-idle, BUG592, calibrated30–50 active hours, integratedG0–G7,
two-hour soak and independent review before owner playtest. Browser works;
CI excluded; no pending question/external blocker. Drivers terminal and exact
task caches absent; root retains worktree/evidence through review and owns
eventual cleanup/release.

## Previous state — quest-recovery batching retained, 2026-11-02

The preceding status-report turn made no implementation progress. The verified
[recovery batching](../balance/2026-11-02-inventory-recovery-batching.md) increment
is retained:165 affected assertions, scoped strict types/lint, and complete exact
native/public desktop/mobile save checks pass. Mobile first opening2090→1482ms,
warm median1108→1086ms; desktop roughly unchanged. Development diagnostics do
not accept release budgets; BUG592 stays open. BUG601's nine stale storage
assertions are corrected and pass without changing reward or adapter behavior.
Authority58 uses the verified candidate manifest:2,141 inputs, exactly six
quest/inventory source/test changes from57; data and earned72/Hell1043 unchanged.
Drivers terminal; exact task caches absent. No passed checks or campaigns replayed.

Next authenticate/reuse all70 quest-ready boss sources and existing power evidence,
resolve intended-power/build-identity/population policies, and freeze complete
retry/adaptation costs and advancing RNG before acceptance. CE experiments remain
rejected/restored; stop coefficient sweeps and speculative inventory changes.
Full-v1 unfinished, accepted balance0/210. Remaining scope includes14-build
campaigns/holdouts/funding fairness, recruitment/Hell economics, defeat/retry/
manual-idle, BUG592, calibrated30–50 active hours, integratedG0–G7, two-hour soak
and independent review before owner playtest. Browser works; CI excluded; no
pending question/external blocker. Root retains required worktree/evidence through
review and owns cleanup/release.

## Previous state — corpse-life candidate rejected and restored, 2026-11-02

The preceding status-report turn made no implementation progress. The
[corpse-life experiment](../balance/2026-11-02-corpse-life-rejected.md) is now
independently reconstructed and rejected: 100 paired areas improve 5→97 wins,
but seeds29/84/93 change from timeout to defeat, violating the frozen rule.
Reader v2 corrects only the historical52 versus pre-candidate55 provenance
assertion, authenticating the frozen four-file bridge and exact reader changes.
It verifies859 settlement deltas and1,263 retained-unit carry transitions without
combat replay. No coefficient or curse timing was retuned.

All13 candidate files are restored exactly. Authority57 and independent source
enumeration verify2,141 inputs: only two separately corrected summon tests differ
from55; game data and production match55. Their183 cases pass. The candidate's
490 affected passes remain historical validation. Source snapshots, failures,
raws and readers stay in the root-owned packet through review. Drivers terminal;
exact task caches absent. No discarded-UI browser checks or broad suites repeated.

The three new defeats occur after wave2, where each baseline already timed out;
they do not establish same-wave survival regressions. Rejection stands. Next
review intended-power/first-clear fixture eligibility before matched-role
population and independent-holdout runs; stop CE coefficient sweeps on this
retained sample. Preserve failed areas and native retry/adaptation costs.
Full-v1 unfinished, accepted balance cells0/210: Corpse/curses progression,
14-build population/funding fairness, fresh campaigns/holdouts, representative
recruitment/Hell economics, defeat/retry/manual-idle, BUG592, calibrated30–50
active hours and integrated G0–G7/soak/independent review remain before owner
playtest. Earned72/Hell1043 successor unchanged. Browser works; CI excluded;
no pending user question or external blocker. Root retains worktree/packet and
owns eventual cleanup/release.

## Previous state — single-pass counted validation retained, 2026-11-02

[Single-pass counted validation](../balance/2026-11-02-counted-single-pass-validation.md)
is retained: 182 affected cases, scoped strict types/lint and exact native/public
desktop/mobile save checks pass. Mobile helper median 37→28 ms; first inventory
opening stays ~2.1 s, so BUG592 remains open. Authority55 rehashes all 2,141 source
inputs; exactly counted contract/test differ from54. Data and canonical earned72
successor remain unchanged. Drivers terminal, exact owned caches absent.

The preceding report turn also verified the previously running candidate had
completed successfully; it yielded new browser evidence rather than replaying
checks. Next address the unresolved Necromancer Corpse/curses progression using
retained evidence; no more speculative inventory micro-optimizations this slice.
Full v1 remains unfinished; accepted balance cells 0/210. Remaining scope includes
14-build/act population balance, fresh campaigns and independent holdouts,
representative recruitment/Hell economics, defeat/retry/manual-idle, BUG592,
calibrated 30–50 active hours and integrated G0–G7/soak/independent review before
owner playtest. Browser works; CI excluded; no question or external blocker.
Root retains required worktree/evidence through review and owns cleanup/release.

## Previous state — inventory paging scope fixed, 2026-11-02

The preceding goal turn was status-only/no progress. This increment records the
verified [inventory render-scope fix](../balance/2026-11-02-inventory-render-scope.md):
66 affected cases, scoped types/lint and desktop/en plus 360×640 zh-CN/4×CPU
browser checks pass. Mobile first/last-page medians improve 666→463/516→296 ms;
full 8,540-item public/native saves remain exact. Initial opening remains ~2.1 s;
BUG592 stays open. Measurements are development diagnostics, not acceptance.
Authority54 verifies 2,141 entries; only inventory screen/test differ from52;
engine/data and earned72/Hell1043 successor remain unchanged.

Completed Act II/IV comparison and CE rejection remain valid. Retained failed-seed
logs show earlier clearing shifts carried Weaken cooldown coverage; no mana
starvation or engine defect established. Do not fit coefficients to these seeds.
No passed browser/unit/combat runs repeated for this documentation increment.

Next diagnose initial inventory opening from retained CPU profiles. Full v1
remains unfinished, accepted balance cells 0/210: unresolved Corpse/curses and
14-build/act population balance, fresh campaigns and independent holdouts,
representative recruitment/Hell economics, defeat/retry/manual-idle, calibrated
30–50 active-hour pacing and integrated G0–G7/soak/independent review remain
before owner playtest. Browser works; CI excluded; no pending question/external
blocker. Root retains required worktree/evidence through review and owns cleanup.

## Previous state — Act II/IV comparisons complete; CE tuning rejected, 2026-11-02

[Act II/IV current-runtime comparisons](../balance/2026-11-02-act2-act4-current-runtime.md)
are complete: 108 sampled areas, 548 waves and 98 wins match historical combat;
548 settlement reconstructions and 785 carry checks pass. Reuse completed
Act I/III/V and Bow Act II evidence. These samples accept no balance cells.

The [CE rank-growth experiment](../balance/2026-11-02-corpse-growth-rejected.md)
finished with 5→96 full-area wins across 100 paired seeds, but two baseline-win
regressions and three newly fatal seeds fail its frozen criterion. Rejected;
all production/test inputs restored exactly to authority52, verified across
2,141 entries. The separate reader reconstructs 859 settlements and verifies
1,265 carry transitions. No further coefficient fitting or combat rerun.
The immutable candidate proposal remains historical, not the current contract.

Full v1 remains unfinished; accepted balance cells remain 0/210. Next address
the unresolved Corpse and curses progression problem and remaining build/act
balance, then independent holdouts, representative recruitment/Hell economics,
defeat/retry/manual-idle, BUG592 storage/runtime performance, calibrated 30–50
active-hour pacing and integrated G0–G7/soak/independent review before owner
playtest. Browser works; CI excluded; no pending question or external blocker.
The earned level72/Hell1043 successor is unchanged. Root retains the required
worktree/evidence through review and owns eventual cleanup/release.

## Previous state — Act III/V current-runtime comparisons complete, 2026-11-02

The preceding progress-report turn made no implementation progress. This increment
closes the retained [Act V comparison](../balance/2026-11-02-act5-current-runtime.md)
and completes [Act III current-runtime comparison](../balance/2026-11-02-act3-current-runtime.md).
Act V: 56 sampled areas, 330 waves, 53/53 current/historical area wins, 371
carry checks. Its three Corpse and curses Necromancer failures are unchanged,
after the intended matching target; no tuning is inferred. Act III: 56 areas,
288 waves, 56/56 area wins and 457 carry checks. Both independent readers
reconstruct all settlement deltas; zero changed combat metrics or unexplained
wave differences. All outcomes, capacity discards/overflow, classified current
wishstone changes and explicit legacy Inner Sight payloads remain visible.
Act III took 64.588 execution seconds; no combat replay for reader corrections.
No production code/data changes or unrelated unit/browser/campaign suites.

Authority 52 remains exact across all 2,141 inputs. Existing
[Bow Act II](../balance/2026-11-02-bow-act2-current-runtime.md) 100-seed studies
remain complete (79→93 area wins with the earned crown; reject the 49-win stat
reset). The earned successor stays level 72/Hell 1043 with 8,540 backpack items,
98,758 historical wishes reserved and 25 earned wishes left; actual paid draw
38/SSR party evidence is unchanged. BUG592 remains open; do not repeat the
rejected worker-save rewrite.

Next cover unresolved current Act II/IV roles using authenticated retained saves,
fixed selections and native preparations. Reuse Bow Act II and completed Acts
I/III/V. Two Act IV preparations include owned socket/equipment/skill operations
and the frozen Corpse and curses priority; reproduce their real costs. An Act II
Cold Sorceress legacy fixture lacks explicit target metadata; derive/freeze it
from authenticated planning before new combat, without outcome-based selection.
Then complete population fairness/holdouts, representative recruitment/Hell
income stability, defeat/retry/manual-idle, storage/runtime, calibrated 30–50
active-hour pacing and integrated G0–G7/soak/independent review before owner
playtest. Two-seed diagnostics accept no balance cells: accepted cells remain 0.
Full v1 remains active; browser works, CI excluded, no question/external blocker.
All current task processes are terminal and exact caches absent. Root retains
required worktree/evidence through review and owns eventual cleanup/release.

## Latest earned continuation — recruitment and party feedback, 2026-11-02

The previous goal turn was a verified wait on session78968. That same native run
now exits0:48admissions/288hero wins,1.659203combat hours/165.340wall seconds,
224new wishes/190paid/34left; original98,758wallet fully reserved. Actual21draws
produce12new identities/nine duplicates/18shards. First earned Iron Wolf trial
is exactly965–967; restore Holy Freeze before968. Trial companion dies at all
three openings and is absent15later waves; no causal party improvement claimed.
[Evidence](../balance/2026-11-02-earned-recruitment-party.md). Native paid-seed/
portable-decode and independent streaming journal/accounting readbacks pass;
339deltas conserve items/materials/currencies/hero and merc XP. Hero70→71,
backpack8085/nextHell1009 retained separately; canonical70/Hell961 unchanged.

Authority50rehashes2140inputs; source/data remain exact. Driver/readback scoped
types pass. Native/readback/streaming jobs terminal, exact owned typeinfo/caches
absent; required evidence retained by root. No application/campaign replay or
unrelated suite. Also advance pointers for preceding JSON storage/BUG598/599
closure (344affected unit/53precompile cases;14distinct browser cases). BUG592
and full-v1 remain open, accepted balance0. Next representative Hell stability
using retained training/source contexts first, current acquisition/party fairness,
runtime/14build holdouts/retry/manual-idle/30–50active-hour/G0–G7/soak/review before
owner playtest. Browser works; CI excluded; no pending question/external blocker.

## Latest implementation — JSON save storage and development boot, 2026-11-02

The preceding goal turn was status-only/no progress. This increment closes the
pending verified storage/browser fixes. [Storage evidence](../balance/2026-11-02-json-save-storage.md):344affected unit cases and four complete7413-item production
roundtrips pass, with physical JSON/legacy reads and unchanged logical33/IDB1.
Single profiled mobile reload5154→4866ms/import4427→4219ms improves; desktop
reload1186→1264ms/import665→700ms worsens. BUG592and performance acceptance
stay open. BUG598moves authored directory watching out of module load;53focused
cases and actual filesystem edit/failure/repair pass. Save plugin control passes
unchanged. BUG599corrects only frozen-clock display test timing. Final browser
union14passes:10save-management reused, only4offline cases rerun.

Authority50checks2140inputs; data/canonical earned70/Normal1314/Hell961/7413items
remain exact. Observer/E2E inputs separately hashed; owned server terminal and
exact cache/typeinfo removed. Required failure traces/evidence/worktree retained
by root through umbrella review. No campaign or unrelated suite replay. Accepted
balance0/full-v1 active. Next current earned recruitment/party economics, then
representative Hell stability, runtime/current14build fairness/holdouts/retry/
manual-idle/30–50active-hour/G0–G7/soak/review before owner playtest. Browser
works; CI excluded; no question or external blocker.

## Latest economy evidence — recorded wishstone expenses, 2026-11-02

The preceding status turn verified a live reader; this increment completes it
and corrects the three diagnosed inherited-ledger routes. All373historical
transitions now reconcile individually after100,277exact duplicate reward
entries are excluded and one explicit5-wish preparation debit is included.
28free skill and12free stat resets are recorded. The [expense report](../balance/2026-11-02-fourteen-route-wish-sinks.md)
and separate arithmetic readback preserve net/gross and historical/current limits.
Current finite rewards for the recorded source sets, less recorded expenses and
a5-wish reserve, leave450–480wishes: all14endpoints cover the450SSR rarity floor.
No historical wallet or kill income is credited; named identities/stars, current
party feedback and chronological acquisition acceptance remain open.

Authority48 checks all2139inputs; canonical earned70/Normal1314/Hell961/7413items
is exact. No game code/data/save changes, tests, builds, servers, combat or reward
generation. First unresolved audit retained; corrected reader and readback exit0;
no disposable outputs. Decision69/index22/handoff23 also close the preceding
save-validation fix and14-route chronology evidence. Accepted balance0/full-v1
active. Next representative current earned recruitment/party economics and Hell
income stability; runtime/current14-build fairness/holdouts/retry/manual-idle/
30–50active-hour/G0–G7/soak/independent review remain before owner playtest.
Browser works; CI excluded; no question or external blocker. Root retains the
required worktree/packet through review and owns eventual cleanup/release.

## Latest implementation — current-save validation scan, 2026-11-02

The prior turn was a status report; this increment closes the completed save fix
and pending14-route chronology evidence. Current33 uses the full validator once;
historical migrations and unchanged restoration/cache repair remain intact.
[Report](../balance/2026-11-02-current-save-validation.md). All164affected cases
across8files pass; scoped types/lint/purity pass. Both public production browser
roundtrips preserve the full7,413-item save, one startup read, activatedSW and no
errors/overflow. Desktop reload2,199→1,788ms; mobile4×CPU7,682→7,580ms. Mobile
import4,579→5,259ms worsens. These single profiled diagnostics do not accept
performance; BUG592 remains open. No campaign or unrelated suites replayed.

Authority48 verifies2,139inputs; only validate.ts and its test differ from47.
Data and canonical earned70/Normal1314/Hell961/7,413-item save stay exact.
Required emitted assets/evidence retained; owned caches/build/type-info absent.
Decision69/index22/handoff23 close this fix and the prior chronology census.
Accepted balance0/full-v1 active. Next recruitment/economy: reconstruct actual
competing sinks from retained records before projecting affordability. Remaining
runtime/current-build fairness/holdout/retry/manual-idle/30–50active-hour/G0–G7/
soak/review requirements remain before owner playtest. Browser works; CI excluded;
no pending question or external blocker. Root retains worktree/packet and owns
cleanup/release.

## Latest economy evidence — 14-route chronology, 2026-11-02

The retained chronology reader finished successfully in the previous goal turn.
The [census report](../balance/2026-11-02-fourteen-route-chronology.md) deduplicates
373 reports to 61,474 distinct waves, excluding 97,896 inherited entries and
retaining 699 defeats/draws. All 14 chains have contiguous ordinal/wave coverage;
clear rewards have winning-wave clocks and claims remain snapshot-bounded.
Current finite-income bounds exclude kill income and competing expenses. Actual
paid reset counts remain unknown. Historical combat spans 3.506–28.990 hours
across mixed revisions; this proves neither current fairness nor active pacing.

Existing 128 conditional Hell reward cohorts are reused without new rolls:
mean 80.653 wishes/combat hour, SD 28.964, 81.29% from boss contexts. Representative
six-hour/source/build stability remains unproven. All 2,139 authority47 inputs
and canonical earned70/Hell961/7,413-item save remain exact. No gameplay, wallet,
combat/reward replay, tests, builds or servers. Accepted balance0/full-v1 active.
Next address measured save-copy/storage costs; full recruitment/Hell economics,
runtime/build fairness/holdouts/retry/manual-idle/30–50 active-hour/G0–G7/soak/review
remain before owner playtest. Browser works, CI excluded, no question/blocker.
Root retains required evidence/worktree; no disposable outputs created.

## Latest economy evidence — 14-route finite funding, 2026-11-02

The previous goal turn was status-only/no progress. This increment projects
current finite rewards onto 14 actual retained route endpoints, preserving their
separate later all-area continuations. The [budget report](../balance/2026-11-02-fourteen-route-finite-funding.md)
finds 455–485 wishes without kill income; all fund the 450-wish SSR rarity floor
plus five reserve with zero paid resets. Charging one hypothetical paid reset
reduces that to12/14; after all29areas,485 funds six paid resets plus the floor
and reserve. Claims/source acts do not establish chronological acquisition times.
No economy tuning follows from historical counterfactuals.

The driver rechecks all2139authority47 inputs and all28endpoints; a separate
reader reproduces280payment scenarios. Native floor semantics/prices remain
unchanged. No gameplay, wallet or earned70/Hell961/7413-item change; no combat,
reward replay, unrelated tests, builds or servers. Authority47 stays current;
decision68/index21/handoff22 supersede prior pointers. Accepted balance0/full-v1
active. Next extract representative chronological acquisition/sinks and retained
Hell income variation, then close outstanding runtime/build/fairness/holdout/
retry/manual-idle/30–50active-hour/integratedG0–G7/soak/review requirements before
owner playtest. No external blocker/question; browser works; CI excluded.

A bounded accessor-walker diagnostic from the preceding implementation cycle
measures only about2% median Node gain; the rewrite is rejected and validation
boundaries retained. No source change. All owned jobs terminal; no disposable
artifacts created. Root retains the active worktree and required evidence packet
through umbrella review and owns eventual cleanup/release.

## Latest implementation — static policy precompilation, 2026-11-02

The registry now covers40all-errors schemas plus one first-error reset schema.
Twenty-two callers retain original compiler options, metadata/errors, secondary
guards and SSR behavior. All472distinct affected cases across23files pass;
scoped strict types, explicit lint and engine purity pass. Actual configured
edit/failure/repair checks cover both generated caches, with manually delivered
watch/HMR events and no listening sockets. No campaign/unrelated replay.

[Report](../balance/2026-11-02-startup-policy-precompilation.md). The first candidate
run regresses versus the older sample; a focused same-session retained-v8/v9
comparison gives desktop reload1,422.543 → 1,203.432ms and mobile
6,354.931 → 5,821.779ms, longest tasks456 → 431ms and
2324 → 2200ms. These remain localhost diagnostics, not performance acceptance.
Complete7413-item public/native roundtrips remain exact; one startup read,
activatedSW, no errors/overflow. Gzip adds22800bytes;760precacheURLs/all11assets
fit unchanged cap.29exact emitted assets are archived before disposable cleanup.

Authority47/decision67/handoff21/index20 supersede previous pointers. Exactly27
implementation/config/test inputs differ from46; all2139inputs rechecked, authored
JSON/schema and canonical earned save unchanged. Accepted balance0/full-v1 active.
Startup/storage/inventory/runtime, representative economics/recruitment,14-build
fairness/holdouts, defeat/retry/manual-idle,30–50active-hour pacing and integrated
G0–G7/soak/independent review remain before owner playtest. Next address measured
save snapshot/storage and validation costs; reload includes pagehide checkpoints.
Jobs terminal; exact build/cache/type-info outputs absent. Root retains required
packet/worktree and owns cleanup/release. Browser works; CI excluded; no question
or external blocker.


## Latest implementation — remaining startup data precompilation, 2026-11-02

This turn closes BUG596's verified test-only correction and extends the existing
schema registry to ten more eager data loaders. Original strict/allErrors,
metadata/errors, SSR and all secondary guards remain exact. The browser resource
case is RED before implementation;22precompilation cases and175distinct affected
cases across11files are green across retained scoped runs. Types/lint pass.
A separate inherited Khalim reward assertion (BUG597) reproduces identically
against all original loaders; pinning existing8000XP+20wishes repairs17/17cases.

[Report](../balance/2026-11-02-startup-leaf-precompilation.md). Production desktop
reload1389.312→1319.343ms/longest558→418ms; mobile4×CPU5804.651→5378.240ms/
longest2511→1967ms. Mobile import2361.469→2626.949ms is slower. These single
profiled localhost diagnostics do not establish budget/percentile/device acceptance.
Both complete7413-item public/native roundtrips remain exact, with one startup
read, activatedSW, no errors or overflow. Gzip adds16950bytes;760precache URLs/
all11assets pass unchanged cap.29exact emitted assets are archived before cleanup.

Authority46/decision66/handoff20/index19 supersede prior pointers. Exactly12
implementation/test changes plus separate BUG597test-only correction differ
from45;2139inputs, all authored JSON/schema and canonical earned save unchanged.
Accepted balance0/full-v1 remains active. All performance/economic/build/fairness/
holdout/retry/manual-idle/30–50active-hour/integratedG0–G7/soak/review/later owner
playtest scope stays open. Next address remaining engine-policy compilation and
large-save adapter costs from existing profiles, without campaign replay.
Jobs terminal; exact task caches/build/type info absent. Root retains required
worktree/packet through review and owns cleanup/release. Browser works; CI excluded;
no pending question or external blocker.


## Latest correction — save-test preconditions, 2026-11-02

Previous goal turn was status-only/no progress. BUG596 is fixed locally: the
missing-ledger fixture starts valid at current33; historical reserved-proof cases
keep decode/descriptor assertions and expect the precise current-only API error.
The affected suite passes91/91; scoped types/lint passed. Across retained runs,
all239 distinct selected cases have passing evidence; this is not a new full run.
Authority45 changes only this test from44; all2,139 current inputs, runtime/data
and canonical earned save are rechecked. Browser evidence is reused unchanged.

Decision65/handoff18/index17 record closure. No pending question/external blocker;
CI excluded, browser works. Full-v1/accepted balance0 remains open. Next diagnose
remaining module-evaluation compilation using retained v7 profiles, then address
startup/storage/runtime and the complete economic/build/pacing/gate scope.
Exact bug596.tsbuildinfo and freeze cache are absent. Root retains the active
worktree and required shared evidence packet through review and owns cleanup.


## Latest implementation — selected save schema precompilation, 2026-11-02

Previous goal turn was status-only/no progress. Current33, literal frozen32 and
ledger schemas now generate standalone browser checks with the original Draft07
options; SSR/other historical schemas retain their lazy caller compiler. Every
schema/descriptor/domain/migration guard and durable save ordering remains exact.
[Report](../balance/2026-11-02-save-validator-precompilation.md), ADR017.

Five new cases pass with2,283nested input comparisons; an actual-plugin rich-save
probe matches41inputs and all three pre-edit schema hashes. Scoped types/lint pass.
Nine affected suites exercise239cases:232pass/seven stale quest-item assertions
match the retained original exactly (BUG596, next focused fix). Explicit workspace
selection corrects an initial DOM-environment invocation error. Actual configured
edit/failure/repair/no-listening-socket checks pass. No campaign/unrelated replay.

Production import760.814→588.615ms desktop and3181.768→2361.469ms mobile4×CPU;
reload1426.102→1389.312ms and5918.844→5804.651ms. Longest tasks500→558ms and
2340→2511ms worsen; startup budgets stay open. Both complete public/native roundtrips
preserve migrated33/all7,413items, one startup read, activatedSW and no errors/overflow.
Single profiled localhost diagnostics with no contention/device/percentile claim.
New gzip66.68KB;760precacheURLs/all11assets fit unchanged cap. First candidate's
nested WebSocket side effect is fixed with ws:false; partial v6 is excluded.

Authority44/decision64/handoff17/index16 supersede earlier pointers; authority43
is excluded pre-socket-fix evidence. Exactly five inputs differ from42;2,139inputs,
all data/canonical bytes unchanged. Accepted balance0; full performance/economy/
build/fairness/holdouts/retry/manual-idle/pacing/G0–G7/soak/review/later ownerplaytest
remain. Jobs terminal; disposables absent,29exact emitted assets archived. Root
retains required worktree/packet and owns cleanup/release. Browser works, CI excluded,
no question/external blocker. Next fix BUG596, then resume the remaining budgets
and representative economic/build acceptance without replaying completed routes.


## Latest implementation — static authored catalog precompilation, 2026-11-02

Previous goal turn completed skill-startup verification and diagnosed remaining
compiler costs. Ten unchanged schemas now generate standalone browser validators
through a small registry/factory; SSR keeps each original caller Ajv/options.
Six loaders retain all secondary checks. [Report](../balance/2026-11-02-authored-catalog-precompilation.md).

422distinct affected assertions pass across retained runs, including754catalog
input comparisons, the existing loader suites and prior skill regression. Final
scoped types/lint pass. Actual configured-Vite schema/registry edits, invalid-schema
failure/no stale fallback, repair and metadata identity pass. No unrelated suite
or completed campaign is replayed. The initial production harness data-hash guard
is corrected to compare authored JSON separately from intended TypeScript edits.

Matched production desktop reload1.591→1.426s and mobile4×CPU6.609→5.919s; longest
tasks673→500ms and3129→2340ms. Both full public/native roundtrips preserve the
migrated33save/all7,413items, one startup read, activatedSW and no errors/overflow.
Single localhost diagnostics; import is slightly slower and budgets remain open.
Added gzip is46.85KB total;759precacheURLs/alltenassets fit the unchanged cap.

Authority42/decision63/handoff16/index15 supersede earlier references. Eleven
source inputs change; all authored JSON/schema and canonical earned70Hell961
bytes stay exact. The data-tree hash legitimately includes changed TypeScript.
Accepted balance0; remaining performance/economy/build/fairness/holdouts/retry/
manual-idle/pacing/integrated gates/soak/review/later ownerplaytest remain. Owned
jobs terminal; disposable outputs absent, exact emitted assets archived. Root
retains worktree/required packet through review and owns cleanup/release. Browser
works, CI excluded, no question or external blocker.

## Latest follow-up — remaining startup schemas identified, 2026-11-02

[Diagnosis](../balance/2026-11-02-remaining-startup-diagnosis.md) uses existing
production CPU/maps plus one bounded Node compiler wrapper. No new browser,
campaign or unrelated suite. Mobile compiler samples total 2.929s, of which only
0.396s has a mapped application ancestor; unassigned module-evaluation samples
are explicit. Node actual-import/decode tracing identifies quests, recruitment,
quest items and related catalogs as remaining static compilation costs; the
original SSR skill cost is already removed in browsers. Native save schemas stay
separate typed/history-sensitive work. No browser gain is inferred from Node.

Next extend the existing precompiler to the measured static authored schemas,
with full options/errors/metadata and edit invalidation preserved, then compare
one production candidate with authority41. Source/data/canonical checkpoint remain
exact; decision62 stays current, handoff15/index14 add this diagnosis. All broader
full-v1 requirements remain. Diagnostic wrapper is restored; its server is closed
and exact cache absent. Root retains worktree/packet through final review and owns
cleanup/release; browser works, CI excluded, no question or external blocker.

## Latest implementation — browser skill validation precompilation, 2026-11-02

Previous goal turn was status-only (no progress). The browser now imports the
unchanged strict/full skill validator generated on Node. SSR keeps its original
factory; every input is still checked afresh with complete errors. The generated
chunk fits the unchanged 2 MiB precache cap. No engine/data/save/migration or
canonical checkpoint changes. [Report](../balance/2026-11-02-skill-validator-precompilation.md).

Five distinct affected tests pass, including 1,444 direct generated-code input
comparisons, plus final scoped types/lint. A separate current-plugin hook probe
passes regeneration, invalid-schema failure/no stale fallback, HMR invalidation
and repair recovery; it does not certify filesystem event delivery. Both real
production browser roundtrips preserve the full migrated-33 save/all 7,413 items.
Desktop reload 2.076→1.591s; mobile 4×CPU 8.398→6.609s; longest tasks 1.151→0.673s
and 5.087→3.129s. Single matched localhost diagnostics, not percentile/device/soak
acceptance. Added gzip is about 148 KB. No unrelated/campaign suite is replayed.

Authority41/decision62/handoff14/index13 supersede previous pointers; authority40
is rejected candidate evidence only. Accepted balance0, full v1 active. Remaining
save/startup/storage/runtime budgets, representative economy/income variance,
14-build chronology/fairness/holdouts, retry/manual-idle, active-hour pacing and
integrated gates/soak/independent review/later ownerplaytest remain. Browser works,
CI excluded, no question/external blocker. Exact emitted code/maps are archived
losslessly; disposable outputs are absent. Root retains the active worktree and
required packet through full-v1/umbrella review and owns eventual cleanup/release.

## Latest investigation — production startup and corrected attribution, 2026-11-02

Previous goal turn was status-only (no progress). The normalization candidate
passes181 affected cases and exact native/public browser roundtrips, but has no
material mobile gain; only its own edits are removed and authority39's complete
2,130-input source is restored exactly. Recursive sample double-counting is
corrected: normalization155ms, first skill compilation2001ms on retained mobile.
[Report](../balance/2026-11-02-production-startup-baseline.md).

A genuine minified production build passes bridge exclusion and actual757-entry
precache checks. Complete earned7,413-item public import/Save/reload/export and
native IndexedDB are exact on desktop/en and mobile/zh at4×CPU, with an activated
controller and no errors/overflow. Production reload2.076/8.398s, mobile longest
task5.087s and mapped first skill compilation2.013s confirm material startup work
remains. Single localhost diagnostics, not percentile/device/soak acceptance.
The first build driver's inherited development NODE_ENV is diagnosed/corrected;
its failed output is excluded. No campaign or unrelated suite is replayed.

Authority39 stays current; authority40 is rejected source only. Decision61/
handoffv13/indexv12 supersede prior pointers. No runtime change retained, grants,
canonical checkpoint change, accepted balance cell, pending question or external
blocker. CI excluded. All broader performance/economy/build/fairness/holdout/retry/
manual-idle/pacing/integrated gates/soak/review/later ownerplaytest remain. Exact
disposable cleanup and lossless compressed production profile assets are recorded
in the packet; root retains worktree/required evidence through full-v1 review and
owns eventual release/removal.

## Latest implementation — save existence and one-load startup, 2026-11-02

Previous goal turn made progress on conditional recruitment funding. This turn
removes full-save deserialization from existence checks and the redundant startup
read. Two focused resource REDs precede implementation;158distinct affected cases
pass, with stale delayed-read fixtures corrected and four ordering cases rerun.
Final global types/scoped lint pass. No unrelated suite or campaign is run.
[Report](../balance/2026-11-02-save-existence-performance.md).

Native desktop/mobile import, explicit Save/reload/export preserve the complete
7,413-item earned source through migration33. Eight existence calls now perform
zero value reads; startup performs one instead of two. Median check32→1msdesktop,
137→2msmobile4×CPU. Reload3.454→3.488sdesktop/10.337→10.073smobile: no uniform
startup gain or budget acceptance. Schema option/reference screens are rejected;
no schema/compiler change is kept. Authority39/decision60/handoffv12/indexv11
supersede prior references; canonical earned70Hell961/data remain exact and
accepted balance0. All broader performance/economy/build/fairness/holdout/retry/
manual-idle/pacing/integrated gates/soak/review/later ownerplaytest remain. Browser
works, CI excluded, no question/external blocker. Owned jobs terminal; exact task
caches/tsbuildinfo absent. Root retains worktree/packet through ongoing full-v1
and owns eventual cleanup/release.

## Latest evidence — chronological recruitment funding, 2026-11-02

Previous goal turn was status-only (no progress). Current native rewards on
18 retained contiguous pilot segments yield 1,969 wishes over 7,020 waves /
20.3333 recorded combat hours. Include actual finite claims/clears, both free
hires and two free skill resets; pay only at safe native boundaries. All384
funding simulations pass in119.49s. Separate Python arithmetic reproduces all
80,768draws and reconciles8,192payments, ownership/shards/pity/history and all
2,129source inputs. [Report](../balance/2026-11-02-recruitment-funding.md).

Bulk affords210draws; first paid SSR p50 is5.294h (reserve0), while actual
free HolyFreeze hire occurs1.962h. No star is reached in any strategy/stream.
These are conditional historical combat-cadence results, not current earned
play,14-build funding, active-hour pacing or independent review acceptance.
Authority38/canonical earned70Hell961 remain unchanged; accepted balance0.
Decision59/handoffv11/indexv10 supersede prior handoffs. Representative funding/
Hell variance, remaining startup/inventory/storage,14-build fairness/holdouts,
retry/manual-idle,30–50active-hour pacing and integrated gates/soak/review/later
ownerplaytest remain. Native/reader handles36864/93225 exit0; exact cache absent.
No external blocker/question, browser works, CI excluded. Root retains worktree/
packet through ongoing full-v1 and owns eventual cleanup. No game-source tests
or completed campaign replay were run for this read-only diagnostic.

## Latest implementation — inventory recipe batching, 2026-11-02

Previous goal turn was status-only (no progress). This turn removes repeated
recipe-definition validation from the inventory list while retaining fresh reads
and all action/transaction guards. Two bilingual RED resource failures precede
the fix;89 actual affected cases pass, plus three corrected-fixture reruns.
Final global types/scoped lint pass. No unaffected suite or campaign is replayed.

The full7,413-item earned save remains exact through native public import,
inventory/export and IndexedDB on desktop/en and mobile/zh. Current4×CPU mobile
first-page wall2.298→2.082s, longest task354→231ms, sampled panel339→183ms.
Desktop panel CPU also falls but wall433→578ms; no uniform speedup is claimed.
Final-page timing has differing screenshot/scroll setup and is not accepted as
a matched comparison. [Report](../balance/2026-11-02-inventory-recipe-batching.md).

Authority38/decision58/handoffv10/indexv9 supersede earlier references. Canonical
earned70/Hell961 source and all game data remain exact; accepted balance0.
Recruitment mechanics/reveal remain locally verified under the
[retained evidence](evidence/2026-11-02-recruitment-stars.md). Next chronological
funding with actual sinks and representative Hell income; remaining inventory/
startup/storage,14-build chronology/fairness/holdouts, retry/manual-idle,
30–50active-hour pacing and all integrated gates/soak/independent review/later
ownerplaytest remain. Browser works; CI excluded; no question/external blocker.
Root retains active human2 and required evidence through review; exact disposable
cleanup/terminal handles are recorded in `bug592-quest-list-final-v1.json`.

## Current handoff — live recruitment stars and reveal verified, 2026-11-02

Previous goal turn completed terminal readbacks for three inherited jobs;
it added verification evidence but no source implementation. This turn proves
the public100-shard star upgrade, native signature effects and sequential
reveal/Skip with actual earned copies in Chromium desktop/en and mobile/zh.
Screenshot review also fixes BUG595's unlabeled base ability values. Natural
actors, equipment, current resources and the canonical earned70/Hell961 source
are preserved. [Evidence](evidence/2026-11-02-recruitment-stars.md).

512 distinct affected cases across22 files pass across retained runs; no
unaffected suite or completed campaign is replayed. Final global types, scoped
lint and engine purity pass. Source authority37/decision57/handoffv9/indexv8
supersede the prior handoff. Exact cache cleanup and retained ownership are
recorded in `bug594-stars-final-v1.json` in the ongoing packet.

The next bounded native study completes128 streams/1,536,000 draws in18.443s,
with independent source/hash/shard/outcome readback. Median first star is5220
wishes; paired retained Hell income still has large conditional variance.
[Acquisition report](../balance/2026-11-02-recruitment-acquisition.md).
No live source, canonical save or tuning changes during the study.

Next: representative chronological recruitment funding under the implemented
rules and actual competing sinks, Hell income/variance and large inventory/
storage/startup performance. Chronological14build funding,
fairness/independent holdouts, defeat/retry/manual-idle,30–50active-hour pacing,
integratedG0–G7, two-hour soak, independent review and later ownerplaytest remain.
F07/P13 and full-v1 stay open; accepted balance0. Browser works; CI excluded;
no pending question or external blocker. Root retains the active worktree and
evidence packet through umbrella review and owns eventual cleanup.

The sections below retain historical checkpoints and their then-current limits.

## Latest implementation — recruitment save33 and paid pity/shards, 2026-11-02

Previous goal turn was status-only/no progress. This turn integrates the actual
paid2/13/85% banner and10/50 guarantees, conservative32→33 migration, independent
SR misses, last100 history and15/5/2duplicate shards under the existing atomic
payment/roster lease. Both locales expose guarantees, receipts/history/copy and
probability disclosure.164engine/data/save and51store/UI cases pass; real earned
Settings import, paid ten-pull, clipboard, flush/reload/export and history pass
in desktop/en and mobile/zh-CN. No browser errors/overflow. Canonical earned70/
Hell961 source and7,413items remain unchanged; no campaigns or grants are run.
[Evidence](evidence/2026-11-02-recruitment-v33.md).

Authority35/decision56/handoffv8/indexv7 supersede the investigation handoff.
Next: live100-shard star upgrade, natural-stat/signature-rank effects and UI,
then reveal/skip and full recruitment acceptance before funding calibration.
F07 remains open; accepted balance0. All remaining economy, performance,
14build/funding/fairness/holdouts, retry/manual-idle,30–50active-hour pacing,
integrated gates/soak/independent review and later ownerplaytest remain. Browser
works; CI excluded; no pending question or external blocker. Root retains the
active worktree/packet through review and owns final cleanup.

## Latest investigation — schema startup and recruitment contract, 2026-11-02

Previous goal turn was status-only (no progress). This turn rejects optimizer-off
and inlineRefs:false for slower normal validation; standalone probe exceeds the
current precache limit; shared compiler passes383affected checks but shows no
material mobile reload gain. Only that candidate's own edits are removed; the
complete 2,106-input authority34 manifest is restored exactly. No runtime change
is kept from this investigation. [Report](../balance/2026-11-02-schema-startup-investigation.md).

The next implementation priority is F07/P13: BUG594 reproduces missing documented
rarity/pity behavior with native seeds180 (ten R pulls) and54 (no SSR in50).
Runtime banner10/30/60% and thresholds30/90 differ from the locked GDD's2/13/85%
and10/50; independent SR state is absent. Existing route/payment proofs do not
accept full recruitment mechanics. Finish the full versioned state/transaction/
duplicate/star contract before more acquisition/funding calibration. No new
question or external blocker; CI excluded.

Decision55 / handoffv7 / artifact indexv6 retain authority34 and the same earned
70/Hell961 successor, all7,413items and defeat/income history. Accepted balance0;
startup/inventory/storage, representative economy,14build chronological funding/
fairness/holdouts, retry/manual-idle,30–50 active-hour pacing and all integrated
gates/soak/independent review/later ownerplaytest remain. All owned processes
terminal and exact caches absent. Root retains the active worktree and packet
for full-v1/review and owns eventual cleanup. No agents, installs, commits,
pushes, completed campaign replays or unrelated suites.

## Latest implementation — native save descriptor checking, 2026-11-02

Previous goal turn made progress on inventory batching. This turn removes bulk
descriptor-map allocations from the complete native guard, preserving every
own/inherited/symbol/hidden/Map/Set/cycle check and all callers. The allocation
regression first fails with 303 maps; 122 affected cases and the final 14-case
guard rerun pass, with scoped strict types/lint and engine purity. No unrelated
suite or completed campaign/paste/inventory baseline runs.

The unchanged 7,413-item earned level-70 / Hell961 save survives exact native
import/export and explicitly flushed save/reload/export in desktop/mobile
Chromium. At 4×CPU, mobile import 2.892→2.428s and sampled descriptor CPU 723→376ms;
these are single-run diagnostics. Cold reload remains 9.915 s on mobile and needs
startup/schema/decode/storage work. Failed test-harness locale/selector attempts
are retained and excluded from acceptance. [Report](../balance/2026-11-02-native-save-descriptor-performance.md).

Authority34 / decision54 / handoffv6 supersede earlier references. Game data,
schemas, save version, combat, campaign helpers and canonical earned/income
history stay exact. No new grants/admissions or accepted balance cells. Remaining
performance, representative economy/income, 14-build chronological fairness and
holdouts, retry/manual-idle, 30–50 active-hour pacing, integrated gates/soak/review
and later owner playtest remain. Goal active; CI excluded; no pending answer or
external blocker. All processes are terminal, exact task caches absent. Root
retains the active human worktree 2 and required evidence packet for ongoing
full-v1/review and owns eventual cleanup.

## Latest implementation — inventory counter batching, 2026-11-02

Previous goal turn was status-only (no progress). This turn removes the five
repeated complete graph checks per inventory render: all counted families now
share one full validation per read, with no cross-read validation cache.69
distinct affected cases pass, including corrupt-state/repair/accessor cases and
bilingual real source/reward flows; scoped strict types/lint pass. BUG593 fixes
only the existing flow's stale 10-wishstone expectation, with unchanged production
reward data/code. [Report](../balance/2026-11-02-inventory-counter-batching.md).

The unchanged earned level 70 / Hell961 save preserves all 7,413 items exactly through native
browser import, first/final-page access, public export and IndexedDB.4×CPU mobile
first-page 2.563→2.200 s; longest task 732→282 ms; sampled inclusive quest-panel
CPU 707→274 ms (single-run diagnostics, not acceptance percentiles). No completed
campaign or paste baseline is replayed; no rewards, game data or engine change.

Authority33 / decision53 / handoffv5 supersede earlier references. Inventory rendering,
import validation/reload, representative economy/income,14-build chronological
acquisition/fairness/holdouts, retry/manual-idle,30–50 active-hour pacing and all
integrated gates/soak/review/later owner playtest remain; accepted balance 0.
All task processes are terminal and exact caches absent. Root retains the active
human worktree 2 and required evidence packet for ongoing implementation/review and
owns eventual cleanup. No pending question/external blocker; CI excluded.

## Latest implementation — large-save input, 2026-11-02

BUG592's large-paste path is fixed: the complete backup stays outside the text
editor, and file selection uses the same native importer. The earned-save mobile
paste diagnostic falls from 38.9 s to 0.28 s. Both clipboard and file paths
preserve the complete known save in IndexedDB and export. Twenty-five distinct
Settings/import tests pass, with scoped strict types/lint. Native decoding,
reload and inventory performance remain open; the recorded CPU profiles guide
the next change. [Report](../balance/2026-11-02-large-save-input.md).

Authority32 / decision52 / handoffv4 supersede the earlier source references.
Canonical earned state remains level 70 / Hell961, with all 7,413 items retained;
no combat, rewards or game data changed. All broader balance/economy/build/pacing
and integrated gates remain open, with zero accepted balance cells. All owned
processes are terminal and task caches absent. Root retains the worktree and
evidence packet for ongoing implementation/review and owns eventual cleanup.

## Current checkpoint — 2026-11-02

Use decision51, authority31, `p15-earned-hell70-progress-artifacts-v2.json`
and `p15-earned-hell-live-handoff-v3.json` in the retained evidence packet.
The independently audited earned successor is level 70 / Hell next 961 / Normal
next 1314, with 7413 backpack items and 98758 stored wishes. Earlier Hell914/live
training instructions below are historical and must not trigger a restart.

The original income sample is complete, including its defeat. BUG591 calibrates
the kill gate from 2% to 2.5%:128 paired native reward cohorts average80.65 wishes
per combat hour;54 affected tests, scoped types/lint/schema checks pass. No old
wallet or reward is rewritten; this conditional rate is not balance acceptance.

Public browser import/export/save/reload and final-item access pass on desktop
and mobile. BUG592 records severe large-save input/import/reload stalls and slow
mobile inventory interactions. Next isolate those paths and fix the measured
cause, keeping the transactional decoder and full custody checks. Do not replay
completed combat or repeat passed paste baselines without a changed path.

[Current report](../balance/2026-11-02-earned-hell-progression.md) contains exact
measurements and remaining scope. Accepted balance cells remain 0. Representative
income, inventory growth,14 build chronological economics/holdouts, retry/manual-
idle,30–50 active-hour pacing and G0–G7/soak/review/later ownerplaytest remain.
Goal active; no pending answer or external blocker; CI excluded. All owned
processes are terminal and caches absent. Root retains the worktree and packet
for full-v1/review consumers and owns eventual cleanup. No commits or pushes.


Preparation is complete when this package is reviewed and durable. No goal
was activated by preparing these documents. The following commands are for
the future implementation session, after these files are available in its
base branch or explicitly provided planning branch.

## Current execution scope — owner update, 2026-10-29

## Combined kill-wishstone rate candidate — 2026-11-02

[Report](../balance/2026-11-02-wishstone-kill-rate.md),
[decision](decisions/P15-wishstone-kill-rate-v1.md). The previous turn was a
status-only report, classified no progress; this continuation implements the
next available P15 tuning group. The read-only native source split reconciles
all 18 journals/7,020 waves: 16,741 direct TC + 34,159 secondary = 50,900 wishes
after BUG575. Guaranteed secondary awards alone account for 32,721.

BUG576 adds a required schema-validated 0.02 coin on combined kill wishes,
with native per-enemy/tick wishstone RNG isolated from item/material rolls.
Quest grants bypass it; stored wallets and prices remain unchanged. Candidate
0.015/0.020/0.025 values were frozen before the reward-only readback. The
selected fixed trace grants 1,297 wishes, 63.787 per combat hour; expectation
is 50.066/h, and the same-cadence Hell Act V projection is 75.157/h. First
10/90 thresholds are 46.013/291.259 combat minutes; no earned replacement,
observed recruitment, actual L70 Hell rate or active-time calibration claimed.

Every one of 74,951 wave item contents (except newly generated IDs), concrete
material ledgers and shard/rune/gem totals matches the original journals.
The separate 13 non-wave gear awards were not regenerated. Three new cases
fail before; 81 affected checks pass, then 38 final batch/award/bonus checks
pass, totaling 82 distinct current checks across eight suites. A scoped config
missing Vite ambient types is corrected; final scoped strict types/lint pass.
Eight stale Act I count/seed failures reproduce with the gate bypassed;
BUG577 updates exact ranged-source fixture expectations. No snapshots changed.

Authority22 records 10 existing source/test changes + two new tests,
2,096 provenance inputs and unchanged campaign manifest. The only post-native
readback production change is the batch stream implementation, proved by an
exact inverse to the pinned source and the final focused checks. No completed
combat, chapter, build route, browser or broad-suite replay. Decision41 retains
the full scope: early recruitment/actual L70 Hell budgets, inventory pressure,
14-build acquisition/fairness/holdouts, retry/manual-idle, calibrated 30–50h,
integrated G0–G7, soak, review and later owner playtest. Accepted balance0.
Browser works; CI excluded; no pending question or external blocker. All task
processes are terminal. Five exact disposable configs/failed drivers archived
and removed; four exact task caches absent. bug576-artifacts-v1.json records
cleanup and retained evidence paths. Root owns W/shared evidence until full-v1
and review consumers finish.

Previous continuation:


## Mini-boss wishstone component correction — 2026-11-02

[Report](../balance/2026-11-02-miniboss-wishstone-budget.md),
[decision](decisions/P15-mini-boss-wishstone-v1.md). Previous goal turn made
continuous-chain/currency-data-boundary progress. BUG575 finds ordinary bosses
using chapter8/12/16/24/40 rather than documented mini6–10. Authored boss table
now6/7/8/9/10; chapter/difficulty/rounding/other drops/prices/RNG unchanged.
Old wallets preserved; no save migration or new random gate. Two incorrect
80/h→8minute examples now67.5minutes per90-costtenpull perD10.

Read-only18journal/7020settled-wave tier census matches native ordinals/index/
outcome/time/raw-vs-actual wishes. Exact adaptive Normal counterfactual
98,607→50,900 (47,707/48.381% lower), still2503.283per combat hour. No new earned
save, payout, combat, chapter route or population/holdout/80/h acceptance.
15act×difficulty cases fail before;134affected checks/scoped types/explicitlint
pass. New1680case digest derived before edit by changing only boss wishes.
240boss wish fields change/1440complete cases equal; all other reward fields/
followingRNG equal. Old extraction evidence retained; one affected exact
material fixture updates60→15only. Authority21:3original inputs changed+1new
test,2094total; campaign manifest unchanged. No broad/earlier-act/browser replay.

Decision40 separates remaining direct-TC/ambient sources and reconciles per-kill
guarantees with encounter cadence/time-to-afford before another large cohort.
Acceptedbalance0; full acquisition/fairness/inventory pressure/14buildholdouts/
retry/manual-idle/calibrated30–50hours/G0–G7/soak/review/owner requirements
remain. Browser works/CI excluded/no pending question/external blocker. Exact
scoped config archived+removed; both task caches absent; terminal/cleanup
receipt bug575-miniboss-artifacts-v1.json. Root retains activeW/shared evidence
through consumers and owns eventual cleanup.

Previous continuation:


## Retained Javelin acquisition and authored currency controls — 2026-11-02

[Report](../balance/2026-11-02-javelin-acquisition-and-currency-knobs.md).
Previous goal turn makes native ActV completion/resume progress. This turn
reconciles18source-pinned fresh1→Baal55segments with exact full state custody;
three currency/ordinal/item corruption controls refuse altered junctions.
1314admissions/7020waves/23defeats/20.333combat hours;74,964gear awards,67,893
salvage removals and17socket insertions. Initial currencies/materials empty;
terminal49,114,796shards/98,607wishstones/6545backpack(6476rares)/499stash.
Wish balance can fund10,950bulk pulls; Normal adaptive pilot is not the
L70Hell80/h cohort.30/40/50hours requires unmeasured mean decision overhead
26.484/53.881/81.279seconds per admission; no human/menu calibration claimed.

BUG574 moves hardcoded secondary-currency values to required closed validated
JSON/typed loader and existing engine origin, preserving default arithmetic/
champion behavior/RNG. Five configured cases fail before;119affected checks,
scoped strict types/explicitlint pass. Production1680complete outputs+nextRNG
match pre-edit digest. Eight invalid authored shapes are refused. Absent
validate:data script is replaced by these existing Ajv-boundary checks, with
no tool install. Authority20:4production inputs changed+2newtests,2093total;
other material settings/campaign manifest exact. Old source/data hashes are
not current; default compatibility is explicitly bridged. No old combat/
quest/reward/build/browser/broad-suite replay. Acceptedbalance0.

Decision39 requires bounded explicit acquisition/faucet candidates from retained
contexts before a large campaign/population batch. All14build funding/fairness/
holdouts/retry/manual-idle/calibrated30–50h/integratedG0–G7/soak/review/owner
requirements remain. Browser works/CI excluded/no pending question/external
blocker. Scoped config archived+removed; both task caches absent; exact
terminal/cleanup receipt bug574-currency-artifacts-v1.json. Root retains
active W and required packet through consumers and owns eventual cleanup.

Previous continuation:


Current continuation,2026-11-02: earned Javelin ActV completion and authenticated resume.

[Report](../balance/2026-11-02-javelin-act5-resume.md). Previous goal turn
obtained terminal check evidence identifying type/lint corrections. BUG572/573
now implement authenticated settled training and partialActV suffix continuation.
Final43affected checks/scoped strict types/explicitlint pass; earlier70route
checks remain. First training attempt discovered no files, so no functional
pre-fix RED is claimed for572;573's31cases fail missingAPI before implementation.
New fixture reuses one constructed earlier-act baseline:31cases115.209→33.552s.
Authority19 records one workspace-discovery transition;2090other original
provenance inputs and game source/data remain unchanged.

Frozen native72620 exits0: actual55/next1314, ActsI–Vcomplete,64retained canonical
actions. Added119admissions/717victorious waves/zero defeats/5,187,480XP;
116Foothills farms finish the original365farm/39,078,269.553combat-ms stage,
then Nihlathak/Ancients/Baal and six remaining actions complete. Original
600/43.2M/3consecutive/10total loss bounds and946/XP18,470,390/clock origins
remain. Local411.441swall/12,655,971.419combat-ms fit carried494.501s/18.841M
limits. All economy/training/quest/recovery/export/source audits pass; separate
read-only terminal reconciliation passes. Entire chain1314admissions/7020waves/
23defeats and73,199,877.651combat-ms; every old failure/recording stop remains.

Decision38 retains this completed pilot, with no replay of earlier acts/builds
or completed encounters.6545backpack/499stash items expose candidate-scan/
recording cost; no large population batch or silent sink-policy change starts.
Acceptedbalance0; full14build chronological acquisition/economy/fairness,
representative populations/holdouts, calibrated30–50active-hour pacing,
retry/manual-idle, integratedG0–G7,soak,review and later owner playtest remain.
Browser works/CI excluded/no pending question/external blocker. Exact scoped
config archived+removed after terminal consumers; native cache absent. Root
retains W and required shared packet through full-v1/review consumers.

Previous continuation:

Current continuation,2026-11-01: overlay28/index7/measurement queue9/next
decision23 reuse two complete JavelinIV100seed studies and add one separate
level48elite learned-order alternative. Shared prefix is exactly equal across
policies per seed except newly allocated reward IDs: count100distinct matched
trash observations, not200. All100trash targets win, median19.655s/p9523.1s,
Wilson95%96.30–100%. Whole-area wins67/100fixed and81/100owned boss armor/order;
retain all6preboss/13adapted-Izual failures. No new gameplay for these200trials.
Independent raw outcomes/damage/carry and complete paid preparation/custody
readback passes:19owned skill points,1Hel/1FlawedSkull/1Shael/100rune-shards,
oldOrt destroyed. Three same-profile gear awards/five inherited paid socket
steps match exact source payloads. Reader1 normalized equipped flags wrongly;
reader2 corrects only those documented flags without gameplay. Whole-route
chronological funding/acquisition distributions/pacing remain open.

Separate original48elite source already knowsImpale20 but omits it from order.
Freeze LightningStrike>Impale, no further cost: exactly2affected ActIV areas/
10waves all win. Elite17.204/16.456s→13.464/15.708s; Izual60sdraws→37.725/36.740s
wins. Rogue dies wave1bothseeds; hero finalMP333/329. Exact prepared order-only
observation, first hero except order, every original enemy team,89Impale plus
94Lightning casts paying3240mana,10party carry boundaries and native rewards
pass. Original draws remain. Counts139original paired roles/six declared role
alternatives/140unique roles/70boss power reviews/accepted balance0.

[Report](../balance/2026-11-01-javelin-act4-retained-cohorts-and-impale.md);
closure`p15-javelin-act4-artifacts-v1.json`. Reuse unchanged batch-driver checks.
Current2091-input source/data unchanged; no game code/user save edit, baseline/
earlier-act/other-build/campaign/browser/broad-suite replay, agent/install/commit/
push/publication. Previous goal turn made native BoneV progress; this turn adds
retained100seed evidence/origins and native learned-order progress. Next freeze
appropriate owned hero/merc survival budget from retained46source failures;
do not repeat either cohort or the new48pair. Wider power/identity/funding/
representative-disjoint populations/within-three/manual-idle/economy/fairness/
30–50active-hour pacing/G0–G7/soak/review/owner requirements remain. Browser works,
CI excluded/no pending answer/external blocker. Root retains umbrella human2 and
shared packet through consumers, preserving source and owning exact cleanup.

Previous continuation:

Current continuation,2026-11-01: overlay27/index6/measurement queue8/next
decision22 register two BoneV owned-hero/paid-merc role alternatives. Both native
preparations insert11owned materials, equip3owned upgrades and allocate30unspent
Vitality; independent22-request/payment/intermediate inventory/whole-observation/
whole-save audit passes. Incremental source cost4FlawlessDiamonds/3Sol/4Eld;
charge inherited merc costs separately. Exact retained award reports and passed
readbacks establish the three upgrades before original56/58sources, with complete
unchanged custody chains. Whole-route chronological material funding stays open.

Four affected ActV areas/seeds1/8 win all24waves; matching elite36.4/29.484s becomes
24/36.8s. Prayer dies in every area, including elite seed8target; do not claim merc
retention. Hero finalMP488/460/496/315. Raw readback verifies195CE corpse/mana
charges,34party carry boundaries, exact frozen hero/merc projections, native
rewards and existing baseline enemies. Reader1 omitted Homunculus10effectiveEnergy
and5→7MP/s recovery; reader2 corrects it from authored data without combat replay.

Counts139original paired roles/five declared successful role alternatives/
140unique observed roles/70boss power reviews/accepted balance0. Preserve original
observations and both failed BoneV policies. Reuse scoped helper checks; no game
source/data/user-save change, other-act/build/campaign/browser/broad-suite replay,
agent/install/commit/push/publication. Previous goal turn was status-only and made
no implementation progress; this continuation makes native preparation/combat/
readback/registration progress. [Report](../balance/2026-11-01-bone-act5-owned-hero-power.md);
closure`p15-bone-act5-hero-power-artifacts-v1.json`. Next use retained histories and
plan acceptance contracts for intended-build identity/power, chronological funding
and representative/disjoint populations. Within-three/manual-idle, economy/fairness,
30–50active-hour pacing, integratedG0–G7,two-hour soak,independent review and owner
playtest remain. Browser works/CI excluded/no pending question/external blocker.
Root retains umbrella human2/shared packet through consumers and owns exact cleanup.

Previous continuation:

Current continuation, 2026-11-01: overlay26 / observation-index5 / measurement
queue7 / next decision21 retain two insufficient BoneV policies. Audit the
already-terminal four-curse4areas/19waves:1area/3matching-target wins;86Decrepify
casts pay1720MP and merc deaths remain. Complete prepared state differs from
baseline only in order. A bounded owned-armor projection yields no improving
replacement under its frozen floors; do not extend/replay it.

Two native paid preparations clear/resocket existing merc chest/head/shield:
3Hel/3FlawedSkulls/3Sol/1FlawlessDiamond/300rune-shards per source,14requests
total; destroyed contents have no refund. Full independent request/payment/
inventory/whole-save audit passes. Correct initial author projection46→38
physical resistance before native mutation; defense289→259/MR8→4, other
tradeoffs explicit. Restore cheaper CE>Amp>Weaken. Four newly executed affected
areas/21waves yield4target wins but0area wins; elite targets improve43.6/54.0s
to36.4/29.484s. Later physical/cold survival and a draw remain; mana ends
308/335/290/317. Do not promote either remedy or repeat these policies.

Combined8areas/40waves verify314CE charges/50party carry boundaries. Original
139paired roles/3successful alternatives/140unique roles and accepted balance0
are unchanged. [Report](../balance/2026-11-01-bone-act5-defense-and-curse.md).
New helper scoped strict types/lint pass after retained corrections; no game
source/user-save change, other build/act/campaign/browser or broad-suite replay.
Previous goal turn was a status-only no-progress turn; this continuation makes
native preparation/combat/readback/registration progress. Next freeze intended
hero/merc power and chronological funding from retained late failures before
further combat. All full-v1 gates remain; browser works, CI excluded, no pending
question/external blocker. Root retains the live umbrella claim/shared packet
through final consumers and owns exact cleanup; bounded closure records removed
configs/progress files and verifies cache absence.

Previous continuation:

Current continuation, 2026-11-01: overlay25 / observation-index4 / measurement
queue6 / next decision20 add BoneIV paid-merc-cold + learned-Weaken alternative.
Keep its unique helmet; two paid native shield actions300/301 change only cold
36→60/lightning27→15 and consume1Hel/1FlawedSkull/1FlawlessSapphire/100rune-shards,
destroying oldTopaz. Full five-action/saved-state/payment/preimage/request-hash
readback passes. Shield-only pair has one area win/one elite defeat across9waves;
preserve it. Add learnedWeaken1 afterCE>Amp>Decrepify:2areas/10waves all win,
Prayer survives throughout; elite45 takes18.8/20.0s.67Weaken casts pay6MP each.
Total4new areas/19waves/174CE charges/30carry boundaries. Source2091inputs exact;
no hero/rank/core/reset/formation change, new farm or production tuning. Tight
mana remains: final11/0MP. Coverage139original pairs +3declared alternatives,
140unique roles, accepted balance0. [Report](../balance/2026-11-01-bone-act4-merc-cold-and-weaken.md).
Scoped helper types/lint pass; failed initial lint and pure helmet projection
remain retained. No ActV/other-build/campaign/browser/broad-suite replay. Previous
goal turn completed JavelinI adaptation and acquisition proof; this continuation
adds BoneIV native paid preparation and two bounded policy comparisons. Next
BoneV retained CE/Amp/Weaken plus learnedDecrepify review, without copying IV's
power/resources or repeating its fights. All full-v1 gates remain; browser works,
CI excluded/no pending question/external blocker. Root retains umbrella claim
and required packet through consumers and owns eventual cleanup.

Previous continuation:

Current continuation, 2026-11-01: overlay24 / observation-index3 / measurement
queue5 / next decision19 add JavelinI's owned-merc-armor alternative. Two native
transfers, original rotation restored, exactly2affected areas/8waves, all wins.
The Rogue survives all waves; matching elite12 takes31.512/26.480s. Full saved
state/custody/native rewards and12carry boundaries pass. Existing journal earns
the selected head/chest by72.12combat minutes; entire retained source costs
1.281combat hours including one nonwin. No added farm/points/reset/income or
production tuning. Original failures/control remain retained. Coverage remains
139original pairs, now2declared alternatives,140unique observed roles and0accepted
balance cells. [Report](../balance/2026-11-01-javelin-act1-owned-merc-armor.md).
Scoped helper types/lint pass after retained external-type-resolution and
interface-semicolon corrections. No broad/other-act/campaign/browser replay.
Previous goal turn polled two exact handles to terminal failure and established
the helper correction; this continuation produces new preparation/combat and
acquisition evidence. Next BoneIV/V survival/intended-power review from retained
policies, then frozen power/funding before populations/holdouts. All full-v1
gates remain open; browser works/CI excluded/no pending question or external
blocker. Root retains the umbrella claim and required packet through consumers.

Previous continuation:

Current continuation, 2026-11-01: overlay23 / observation-index2 / measurement
queue4 / next decision18 supersede the counts below. There are **139 original
two-seed matching-entry recipes plus one separately declared Martial Act I
alternative**, covering all140 roles when the alternative is included. The
original Fists17/Talon1 recipe still fails. Accepted balance cells remain0.

Reuse recovered Martial II seeds1/8 plus98 exploration trials and the existing
Martial I owned-Isenhart/free-reset pair; four retained areas/22waves and36party
carry boundaries are authenticated with no new combat. The reset uses the same
21-point budget, consumes one free skill reset, costs no currency/material and
preserves merc/displaced items. Only Tail/Fists execute. Exact selected pieces
were earned after2.488additional combat hours from the retained level12 source;
an earlier complete set with different rolls exists at1.495hours. The entire
retained farm is2.950combat hours including six nonwins. Do not count this as
zero-cost fresh-save acquisition or a population pacing result.

`p15-recorded-role-power-triage-v1.json` summarizes all140 original pairs:
81without a listed flag,59with timing/survival flags,275target/250area wins.
These are baseline flags, not59unresolved game defects. Consult
`p15-retained-role-policy-discovery-v1.json` before any new trial:160 report/
fixture policies match original source+target plans across119roles. Javelin IV
already has100/100target wins under a paid-owned preparation; later-area
failures and the original failures remain. Its boss-policy exploration shares
seeds and trash prefixes, so do not sum it as independent target evidence.

Next intended-power/identity/chronological funding review of retained policies,
then representative populations/disjoint holdouts and legal within-three/manual-
idle evaluation. No new combat, preparation, tests, builds or browser work in
this continuation; no new disposable configs/caches or background processes.
Four earlier Martial reader failures and two new schema-correction records stay
retained. Production/source saves and all full-v1 requirements are unchanged.
Browser works; CI excluded; no pending answer/external blocker. Required packet
and human2 umbrella claim retained; root owns cleanup after final consumers.
Previous goal turn was no progress (status report); current continuation adds
bounded acquisition proof and a reusable cross-role policy inventory.

Completed role evidence reconciled, 2026-11-01: overlay 22 correctly records
**138 two-seed matching-entry roles**, one exploratory Martial Act II ordinary
role, and one unreached Martial Act I elite target. No never-screened recipes
remain; 140 setup recipes/70 boss reviews/zero accepted balance cells unchanged.
All 29 previously queued Act II–IV roles already existed in the original
52-role screen. Current readback reuses 58 areas/306 waves: 58 target wins,
52 area wins, six retained later failures, and 459 party carry boundaries.
All 19 source wrappers/raw pins and actual target/prefix/player/merc/item
custody checks pass. Current 2,091 inputs differ only in four UI/UI-test files;
engine/data are exact. No new combat, planning, campaign, browser, or test run.

The omitted original screen caused 23 Act I pairs to be repeated: 13 elite and
10 ordinary, or 46 area attempts. Complete combat observations are identical;
`p15-recorded-role-duplicate-audit-v1.json` preserves both sets of raw files.
Correct the bookkeeping through `p15-recorded-role-observation-index-v1.json`:
consult that consolidated per-role index AND retained native reports before any
new diagnostic. An unmeasured disposition alone cannot authorize replay.

[Report](../balance/2026-11-01-completed-role-evidence-reconciliation.md);
measurement queue 3 / next decision 16. Next inspect existing intended-power,
acquisition, mercenary, and survival evidence for the two Martial follow-ups and
retained later failures before choosing another trial. Keep all failed policies
and all full-v1 funding/population/holdout/within-three/manual-idle/economy/
pacing/G0–G7/soak/review/owner requirements open. Reuse browser proof; CI excluded.
No pending answer or external blocker. No disposable configs/caches/builds or
processes created; required packet and human2 umbrella claim retained, root owns
cleanup after final consumers. Previous/current goal turns both make progress.

Act I ordinary encounters and rejected adaptations, 2026-11-01: 11 new matching
ordinary pairs raise two-seed observations from 98 to **109**. One exploratory
role, 29 never-screened roles, and one unreached Martial target remain; 140 setup
recipes and zero accepted balance cells are unchanged. The ordinary cohort runs
22 areas/105 waves: all 22 targets win, 13 areas clear, and nine later nonwins
are retained. Reuse 11 point budgets, 158 equipped origins, and full native
planning; no completed area or forecast replay. Raw audit verifies 159 carry
boundaries.

Martial's held-one-skill/five-stat and Cobra-first preparation and Javelin's
order-only preparation pass exact save/point/resource/gear/mercenary audits.
Four affected areas/14 waves all fail. Cobra now executes and logs 17
finisher-coupled mana credits, but Martial still dies before its target.
Power Strike executes, but Javelin's new order loses both targets; retain its
original baseline. Reject both prepared policies and inspect existing power,
acquisition, and mercenary evidence before further survival trials.

[Report](../balance/2026-11-01-act1-ordinary-and-adaptations.md); catalog overlay
21, measurement queue 2, next decision 15. Seven process receipts pass; one
pre-combat qualifier-classification failure is retained and corrected without
native replay. Four disposable config/progress files are archived and removed,
five caches are absent, and no owned descendants remain. Production and source
saves are unchanged. Next: only 29 unmeasured roles (Act II 22, III three, IV
four), checking retained raw evidence for reuse first. Martial, the failed
policies, other later nonwins, and all full-v1 power/funding/population/holdout/
economy/pacing/integration/soak/review/owner requirements remain open. Reuse
browser evidence; CI excluded. No pending question or external blocker. The
required evidence packet and human2 umbrella claim remain retained; root owns
cleanup. Previous goal turn was a status report; this turn produces new native
evidence and registers 11 new matching-entry pairs.

Act I recorded-source elite screens,2026-11-01:14frozen sources run28native
areas/119waves,25wins.13matching target pairs are observed; Javelin loses one
target, Martial loses the preceding wave twice. Raw audit verifies163party carry
boundaries. Reuse two completed BowIII pairs/4areas/20waves with exact sources,
contexts/raw levels and unchanged engine/data; do not replay them.

Overlay20:140matching recipes/0unmatched/70boss-review/0missing, accepted
balance0. Actual entry evidence:98two-seed+1exploration;40never-screened and
1Martial target-unreached remain. Existing14point budgets/199equipped origins
are reused; Nova alternate serialization requires complete decoded-save equality.
Nested-packet source guards are corrected in native/raw helpers; strict types,
lint and raw readback pass. No native replay after the audit-only correction.

[Report](../balance/2026-11-01-act1-elite-recorded-screens.md); measurement queue1 /
next decision14. Cobra never executes for Martial, and learned PowerStrike6
never executes for Javelin. Next freeze/audit the proposed held1skill/5stat and
zero-cost order adaptations before any affected checks. They have not run.
Preserve all three defeats and BoneIVlater-wave survival follow-up.

Eight terminal receipts/6pass/2retained helper-path failures; three scoped
config/progress disposables archived/removed, three caches absent, no owned
descendants. Native gameplay14.667s; all process receipts37.413s. Closure
`p15-act1-elite-screen-artifacts-v1.json`. Production/source saves unchanged.
Full-v1 power/acquisition/funding/population/holdout/economy/pacing/integration/
soak/review/owner gates remain open. No old-act campaign or completed-screen
replay, broad suite, browser replay or CI. Required packet/human2 claim stay
retained; root owns cleanup. No pending question/external blocker.

All matching-level recipes identified, 2026-11-01: six Act V pairs and the final
Act IV Bone elite pair raise coverage133→**140matching/0unmatched/70boss-review/
0missing** (overlay19). This is setup coverage:83two-seed observations,
1exploration and56unmeasured recipes; accepted balance stays0.

Bow/Swing/SummonDruid earn56/58 through six bounded cleared-GreatMarsh jobs:
2986admissions/14930waves, all wins;12new area screens/72waves all win. Actual
limit successors continue without replay; exact rewards/discards/points/gear/
currency/carry and native Act V returns are audited. Bone's earlier42→45 earns
168admissions/840waves. Original curse order draws twice; held19skill/25Energy
CE>Decrepify>Teeth then draws/loses. Keep both rejected policies. CE>Amp>Decrepify
reaches and beats45elite in both seeds32.8/29.6s, but both later46wave defeats
remain explicit survival follow-ups. No whole-area or balance acceptance.

[Report](../balance/2026-11-01-all-matched-role-setups.md); remaining manifest11 /
next decision13.40terminal receipts/39pass/1retained initial lint-resolution
failure; two audit-generation errors corrected without native replay. Seven
redundant partials, five configs and four progress files are archived/removed;
16scoped caches absent, no owned descendants. Closure
`p15-all-matched-setups-artifacts-v1.json`; production/source saves unchanged.

Next intended-power/acquisition/material/reset-funding/adaptation/RNG/manual-idle
review, reusing existing70-source audits and inspecting only new deltas, before
populations/holdouts/economy/pacing/integration/soak/review/owner gates. Reuse
current browser proof and earlier-act evidence; CI excluded. No pending question
or external blocker. Required packet/human2 umbrella claim remain retained;
root owns cleanup. Full private v1 remains active.

Double Throw/Zeal recovery, 2026-11-01: four further measured setups raise
coverage129→**133matched/7unmatched/70boss-review/0missing**. Eight new full-area
checks win48waves. DoubleThrow's original overrun stays failed; a conserved
bounded56milestone qualifies, and continuation resumes the actual624-admission
terminal to earn58 in69new admissions/414waves. Zeal selects already-learned
Defiance20 and earns50→58 through354consecutive area wins/2124waves. Exact native
action/save comparisons and independent reward/point/container/carry audits pass.

DoubleSwing's priority edit adds no power: Shout/Orders already apply
automatically. It earns41→42 in27admissions/161waves before a retained defeat;
do not repeat that order-only trial. Resume its actual42/ordinal918 successor
only after freezing a real power/survival adaptation or bounded safer earning
route. Seven gaps remain: BoneIVelite; Bow/Swing/SummonDruidVordinary+elite.
[Report](../balance/2026-11-01-act5-doublethrow-zeal-recovery.md); overlay17 /
remaining manifest10 / decision12. Full-v1 gates remain open, accepted balance0.

Closure `p15-act5-doublethrow-zeal-artifacts-v1.json`:22terminal receipts,
21pass/1retained initial type failure; original budget failure separately
retained. Four redundant partials/two progress files removed, two check configs
archived/removed, scoped caches absent; no owned descendants. Production/source
saves unchanged. Reuse completed earlier-act/browser evidence; CI excluded.
No user answer/external blocker. Required packet evidence and umbrella claim
remain retained; root owns eventual cleanup.

Act V remaining-build preparation, 2026-11-01: fourteen actual level-56 ordinary
and level-58 elite pairs raise coverage from 115 to **129 matched / 11 unmatched /
70 boss-review / 0 missing**. Seven further builds reach level 58. Twenty-eight
fixed-seed area attempts retain 25 wins and three later-wave losses across 162
waves. Independent readback confirms all fourteen matching pairs, 174 party
carry boundaries and 170 Corpse Explosion corpse/mana charges.

Twelve builds use fourteen native jobs, 4,737 admissions and 28,418 waves. Two
actual limit successors continue without replay. Bow and Zeal draw; Double Swing
and Summon Druid are defeated. Double Throw ends at level 56 and overruns its
24-hour diagnostic ceiling by 96.932 seconds. Its raw audit fails, both roles
stay unpromoted, and its complete evidence and partial remain retained.

Native helper v3 reserves a complete area's worst-case time. A streaming
retained-journal regression, scoped types and explicit-file lint pass without
combat replay. Seventeen disposables are removed. All 32 receipts are terminal:
31 pass and one retained budget failure; no owned descendants remain.
[Report](../balance/2026-11-01-act5-remaining-setups.md), closure
`p15-act5-role-remaining-artifacts-v1.json`; overlay 15 / remaining manifest 8 /
next decision 11.

Next recover and audit eligible Double Throw level-56 bytes, then review actual
failure successors and intended power before adaptation and populations. Full-v1
gates remain open, accepted balance stays zero. Browser proof is reused and CI
is excluded. No user answer or external blocker is pending. Production code and
source saves remain unchanged; completed earlier-act work is reused.


ActV Nova/Summoner pilot,2026-11-01: four actual ordinary56/elite58 pairs
raise coverage111→115matched/25unmatched/70boss-review/0missing. Eight fixed-seed
whole areas win48/48waves; independent readback confirms all matching entries
and61party carry boundaries. Two native lineages earn all four milestones in
408new admissions/2448waves;17570720XP/29043items and3325further carry boundaries
are audited. Native level grants stay unspent; gear/core/ranks/priorities/resets
remain exact. Two obsolete diagnostic sink-audit failures recover actual56saves
without gameplay replay, then the corrected native-v2helper continues to58.
Targeted strict types/lint pass.18terminal receipts/14pass,5disposables removed,
9caches absent;2pinned recovery partials retained, no owned descendants.
[Report](../balance/2026-11-01-act5-nova-summoner-setups.md), closure
`p15-act5-role-pilot-artifacts-v1.json`; overlay13/remaining manifest7/decision10.
Next24ActVroles across12other builds; ActIVBone elite remains unresolved. Current
P18browser defeat/retry/3saved process restarts already pass and must be reused.
No production/source-save change or broad/earlier-act/browser replay. Full-v1
power/acquisition/funding/population/holdout/economy/pacing/integration/soak/owner
gates remain open, accepted balance0, no pending question/external blocker.

Bone elite cold-shield follow-through, 2026-11-01: six legal native actions are
recovered and independently audited without crafting replay. Cold30→60 trades
attack654→381; payment/custody and the complete saved state pass. Two new native
areas/four waves retain wave1 draws at60s (enemyHP990/5051); neither reaches the
elite target. No promotion:111matched/29unmatched/70boss-review/0missing,
accepted balance0. Raw audit verifies57CE corpse/mana charges and4party carry
boundaries. Preserve failures and do not retry this shield-only control. Three
configs archived/removed, four caches absent,16terminal receipts/no descendants.
[Report](../balance/2026-11-01-act4-bone-cold-shield.md), closure
`p15-act4-bone-cold-shield-artifacts-v1.json`; next decision9/remaining manifest6.
Current BUG558 browser defeat/retry plus3saved process restarts already pass;
reuse `evidence/p18-current-browser-defeat-retry.md`, do not replay older pending
notes. Next two-source ActV56/58 pilot resumes retained Nova55 and Summoner53;
all full-v1 gates remain open, no pending question/external blocker.

Act IV earned setups, 2026-11-01: the previous turn recovered and audited five
completed native jobs without combat replay. All 19 new role milestones are now
earned. Twelve preparations include 11 targets reached and one retained Bone
Necromancer draw. Recovery resumes its actual level 40 / XP 57,867 / ordinal 668
successor and earns level 42 through 94 new Great Marsh admissions, using native
navigation back to Act IV after each. No historical farming replay or source edit.

The 38 whole-area checks at seeds 1 and 8 win 34 attempts across 184 waves.
Independent readback confirms 18 actual equal-level role pairs and 248 further
party carry boundaries. Bone elite 51 dies at wave 1 before its target wave 3 in
both attempts; that forecast remains unresolved. Bone ordinary 42 reaches its
matching entry in both attempts, although later waves fail. New pack diagnostics
verify 104 corpse consumptions and 20-mana charges. The elite failures retain
ample mana and lose their mercenary early. Review intended survival and power
before another trial. [Detailed report](../balance/2026-11-01-act4-earned-role-setups.md).

Overlay 12: **111 matched / 29 unmatched / 70 boss-review / 0 missing**. Remaining:
Act IV Bone elite (1), Act V (28). Matched recipes comprise 56 unmeasured, 54
two-seed screens and one exploration. All 70 boss sources remain ready; accepted
balance cells remain zero. Preparation readback checks 3,072 admissions, 15,358
waves, 93,756,150 XP, 155,261 awarded items and 21,155 party carry boundaries.
Native normal/rare discards occur on disposable branches with no income; protected
items, materials and currencies are preserved. Gear, allocations, priorities,
aura and resets stay exact during preparation; level grants remain unspent.
Diagnostic Bone copies alone use the frozen learned CE > Amp > Weaken order.
The 55.358 logical combat hours span independent branches and do not measure
fresh-campaign pacing.

Task-local report errors are corrected without replay: discard conservation and
the existing level-36 bonus point. Scoped new-driver types/lint and targeted raw
readers pass; literal-only forecast/screen changes reuse pinned prior checks. No
broad suite or browser replay runs. Forty preceding receipts are terminal (31
pass, 9 retained check/report failures); cleanup subsequently passes. Six redundant
partials, five configs and one progress file are removed after comparison. Six
pinned recovery partials and required raw evidence remain. Closure:
`p15-act4-role-earned-artifacts-v1.json`; next decision 8 / unmatched manifest 5.
Full v1 remains active; browser works, CI is excluded, and no user answer or
external blocker is pending.

Act III elite setups completed, 2026-11-01: the previous status-only turn
made no progress. This continuation earns all nine retained characters to level
30 through 391 new native admissions and 1,955 waves, all wins. It retains
7,879,780 XP, 19,602 items and all currency/material/mercenary XP. Raw combat
covers 4.649 simulated hours across nine characters; training processes take
285.512 seconds in aggregate. Gear, allocated skills/stats, priorities, aura and
resets stay exact; native level grants remain unspent. Independent readback
checks 3,127 party carry boundaries, nine point budgets and 164 existing gear
paths. Double Throw farms cleared Great Marsh; the other eight farm cleared
Spider Forest. Necromancer uses the already audited ordinal-715 source.

Planning only these successors yields 306 contexts and nine matching elite
setups. All 18 full-area diagnostic attempts (seeds 1 and 8) win their 90 waves,
with actual hero/enemy entry levels of 30/30 and 144 further carry checks.
Native normal/rare backpack discards occur only on disposable diagnostic copies;
unique/set items, stash, equipped items, currencies and materials remain exact.
Several elite samples finish below 10 seconds; balance acceptance is pending.
[Detailed report](../balance/2026-11-01-act3-last-matched-roles.md).

Catalog overlay 11: **93 matched / 47 unmatched / 70 boss-review / 0 missing**.
All Act I–III ordinary/elite setup gaps are closed. Matched recipes comprise 56
unmeasured, 36 two-seed screens and one exploration. All 70 boss sources remain
ready; accepted balance cells remain zero. Next are Act IV's 19 and Act V's 28
unmatched roles, with intended-power/access/origin review before bounded
preparation. Choose earlier legal sources for overlevelled inputs; never edit
levels. Reuse completed earlier-act work.

Pinned literal-only driver adaptations reuse prior scoped type/lint evidence;
new runtime and raw audits pass. No broad suite or browser replay runs. An
initial preflight catches Double Throw's missing Spider clear before gameplay;
the corrected run uses retained Great Marsh evidence. Script-generation errors
also stop before file creation and are corrected without combat replay. Nine
redundant partials and one progress file are removed after exact comparison;
five launcher caches are absent. Closure: `p15-act3-role-earned-artifacts-v1.json`.
Next decision: version 7; unresolved manifest: version 4. Production and original
source saves remain unchanged. Full v1 stays active; browser works, CI is
excluded, and no user answer or external blocker is pending. Required evidence
and the umbrella worktree claim remain retained.

Last Act II recipe gaps, 2026-11-01: Fire Druid earns 15→17 through 20 new
Rocky Waste admissions/80 waves; Cold earns 26→27 through 14 new Lost City
admissions/84 waves. All win; 17.123 logical combat minutes, 18.365 execution
seconds. No gear/rank/core/priority/reset edits; native point/merc XP grants and
all 1,703 awarded items retained. Independent readback passes exact rewards,
custody, point budgets, 260 party carry boundaries and 38 reused equipment paths.
Only the two new sources are planned: 64 contexts, two matches. Four full-area
seed1/8 screens win 20/20 waves and verify actual elite17/17 and trash27/27
entries plus 32 further carry boundaries. Native overflow recovery is disclosed
on disposable screen copies; earned sources remain unchanged. Druid elite
8.760/4.560 s is below the proposed population timing band, not accepted balance.
[Report](../balance/2026-11-01-act2-last-matched-roles.md).
Overlay10: **84 matched / 56 unmatched / 70 boss-review / 0 missing**; Act II
trash/elite fixture gaps are closed. 70 decoded/70 boss-ready/accepted balance 0
remain. Next: nine Act III elite sources need earned level30 from retained
27/29 checkpoints, then remaining IV19/V28 and intended-power/population/pacing
work. Do not replay the resolved Act II training or screens. Eight terminal/pass
receipts; two configs/two identical partials/one redundant progress file removed
after comparison, three caches absent. Next decision6 and unresolved manifest3;
closure `p15-act2-role-earned-artifacts-v1.json`. No production/user-save edit,
earlier-act/completed study/broad/browser replay or agent. Full-v1 active,
browser works, CI excluded, no question/external blocker; packet/claim retained.

Retained post-claim pack sources, 2026-11-01: seven additional equal-level
recipes are measured, moving 75/65 to **82 matched / 58 unmatched**. A planning
pass over 144 retained source/act pairs and 4,919 contexts found seven conditional
matches; all now reach actual equal-level native entries at seeds 1/8, with all
14 full-area attempts winning. Three missing temporary item paths resolve from
three retained reports and three one-El socket debits; no journal rescan or new
training. Cold IV diagnostic copies recover legacy backpack overflow through
native normal/rare bulk-discard, preserving unique/set/stash/equipped items and
materials/currencies; authoritative sources stay exact. CE IV/V pack definitions
are frozen CE>Amp>Weaken. Act IV behavior verifies 48 real corpse/20-mana charges;
both additional attempts lose wave index 4 after four wins, with ample mana and
early mercenary loss. Preserve failures; inspect intended power/first-kill and
mitigation evidence before another trial. Act V behavior remains unmeasured.
[Report](../balance/2026-11-01-postclaim-matched-roles-and-corpse-packs.md).
Two native batches: 16 attempts/84 waves/23.546 owned process seconds; readers
pass rewards, custody, entry levels, prefix XP and 124 hero/merc carry boundaries.
18 terminal receipts/15 pass/3 retained check-format or launch failures; no
combat replay. Six configs/two redundant progress files archived and removed;
three caches absent. Catalog overlay9 and next decision5 are authoritative;
`p15-postclaim-role-artifacts-v1.json` closes the slice. Remaining roles:
Act II 2, III 9, IV 19, V 28; no retained conditional match remains. Reuse plans
and measured pairs for intended-power/earned-preparation work. 70 decoded cells,
70 boss-ready sources and accepted balance 0 remain. Full-v1 active; browser
works, CI excluded, no user answer/external blocker. Required packet/claim kept.

Equipped payload origins,2026-11-01: previous status-only turn is no progress.
Read retained rewards, no gameplay:14original journals/5274settled waves and
373reports supply all524profile/item award identities. Exact payload/socket
paths resolve1228/1230canonical equipped uses; independent raw readback passes
522awards/418socket debit receipts/5altered controls. Two targeted raw prefixes
resolve the remainder: JavelinV's earlier funded helmet preparation predates its
later report boundary; corpse-NecroV's0→4capacity is an actual consumed Larzuk
reward before4Eld inserts. Combined1230/1230paths/426socket debit receipts;
3additional funded fusions/1earned service/3further negative controls. This is
not complete historical material funding/reset payment/intended-power acceptance.
Four retained reader-format failures;3final processes pass. Route caches and
redundant progress removed only after content checks; all processes terminal.
[Report](../balance/2026-11-01-equipped-item-origins.md). No production/save edit,
gameplay/broad/browser replay or agent. Counts remain75matched/65unmatched/
70boss-ready/accepted balance0. Next explicit per-role power/CE pack rotations/
adaptation/stream policies and unmatched contexts; reuse source paths and prior
per-action checks rather than adding a general acquisition replay. Next decision4,
closure `p15-equipped-origin-artifacts-v1.json`; full-v1 active, no question/blocker.

Build identity/point follow-through,2026-11-01: previous status-only turn is no
progress; this continuation audits all70 exact boss exports. Starter/level/quest/
consumed-Book skill/stat budgets conserve70/70;35same-class/act pairs have distinct
signature investment under the new identity contract. Corpse-focused NecroIV/V
still need explicit CE pack rotations; aggregate conservation is not chronological
point/reset/drop or intended-power acceptance. Native planning of newer NovaII25/
37321/355 supplies one elite candidate. Historical355LostCity win has an older
data hash; two new current-data full-area diagnostics1/8 win12/12waves and actually
enter elite wave4at25versus25,11.680/24.820s,minMP356/297. Reader passes damage/
rewards/custody/prefix XP/19carry boundaries. Overlay7:75matched/65unmatched/
70boss-review/0missing;70decoded/70boss-ready/accepted balance0. No production/
user-save edit, previous preparation/broad/browser replay or agent. Scoped driver
types/lints pass; all processes terminal,3configs archived/removed,2caches absent.
[Report](../balance/2026-11-01-build-identities-and-points.md). Next intended power/
acquisition/role/adaptation/stream policies, then population/economy/pacing/final
integration. Reuse the resolved pair; full-v1 remains active, no pending question.

All boss-source gaps closed,2026-11-01: previous turn is progress. NovaIII resumes
earned27/385 Spider source, starts Khalim/Guardian, wins four required first areas/
23waves, then native recover/assemble/Khalim Claim/Orb. Earn123200XP/254items;
successor27/XP134188/389, existing points1/5 unused. Native gear/rank review passes
NovaIII plus seven ActV starts; no preparation replay. All seven ActV whole areas
win56/56waves on one ordinary actual-ordinal/time-seed attempt each. Actual fifth-
wave exports preserve earned Throne proof before Baal; exact eligibility inputs
permit reuse of native checks, new owner IDs independently reconcile. Ready
62→63→70of70. Three boss times in20–50s,three fast,Traps56.020s slow; no population
or within-three acceptance. [Report](../balance/2026-11-01-nova-and-act5-boss-sources.md).
Three native processes34.185wall seconds/11areas/79waves; all final readers pass.
14receipts terminal/13pass/one retained reader syntax failure;4configs archived/
removed,8identical partials removed,3caches absent/no owned process. No production/
user-save edit, broad suite/earlier-act/finished-study/browser replay or agent.
Current `p15-build-act-boss-source-catalog-v1.json` unifies all70 sources via
`p15-boss-journal-catalog-supplement-v3.json`; next decision2 and closure
`p15-nova-and-act5-boss-source-artifacts-v1.json`. Stop source-gap recovery;
reconcile intended build/power/point/acquisition/remaining-role fixture policies
before population. Keep seven pre-Throne whole-area inputs distinct from mid-area
pre-Baal exports; no fresh boss-only party. Five newly supplied boss contexts lack
a new current-source screen; inspect retained fights/power for reuse first.
Catalog74/66/70/0/all70decoded unchanged,accepted balance0. Full-v1 active/browser
works/CI excluded/no pending question/external blocker; required packet/claim kept.

Boss source follow-through,2026-11-01: previous status-only turn is no progress.
Four original journal boundaries pass current native quest gates/gear/ranks:
NovaI12/108,NovaII25/355,NecroV50/1296,JavelinV48/1137. Only NovaII native visit/
owned-Staff insertion changes gameplay fields; quest-ready sources58→62of70.
Seven ActV whole-area inputs now have native Eve Starts/full plans but no actual
Throne proof or Baal admission. Exact Throne-clear/Baal flags replace coarse
any-area `clearedActs` selection: six later earned sources replace conservative
early candidates; reuse Traps. Selected levels41/52/40/40/50/49/32/actual ordinals.
Three native processes18.944seconds/zero battles; original-journal/full-save
readers pass.18receipts terminal/15pass/three retained type failures;7configs
archived/removed,3caches absent/no owned process. Original55+3 inputs/failures and
all acquisitions stay exact; no production/save/full-suite/earlier-act replay.
[Report](../balance/2026-11-01-boss-journal-source-recovery.md). Next reuse earned
NovaIII27/385 Spider checkpoint for four required Will source clears/Council/Orb,
stop first failure and retain each committed export; never repeat14Spider
admissions. Review ActV legal gear/ranks and intended build/power/history before
population. Baal requires actual prefix wins/carry, not an injected proof.
Authoritative `p15-act5-prefix-source-cohort-v1.json`, next decision
`p15-boss-source-next-decision-v1.json`, closure
`p15-boss-journal-source-recovery-artifacts-v1.json`. Catalog74/66/70/0 and all
70decoded remain,accepted balance0. Full-v1 active/browser works/CI excluded/no
pending question/external blocker; required packet and human2 claim retained.

Nova prefix-source recovery,2026-11-01: previous status-only goal turn is no
progress; this continuation closes the rejected Prayer experiment and recovers
the two missing Nova sources from its authenticated original journal. ActI
line2562 preserves complete post-defeat domains12/XP14391/ordinal108 through
native serialization; ActII line2918 is the exact13/XP25288/117 native save before
Prayer hire. Current decode/access/planning only,2cells/6roles/zero battles,
5.099native seconds. Reader passes exact original-line/domain/save/index checks
and8tamper controls. Cumulative overlay6: decoded70/70,74matched/66unmatched/
70boss-review/0missing-source; ready58/accepted balance0 unchanged. Early sources
do not establish intended boss power or first-clear readiness. Six receipts
terminal/five pass/retained v1type failure;2configs archived/removed/cache absent.
[Report](../balance/2026-11-01-nova-prefix-source-recovery.md).
No production/user-save edit, broad suite/earlier-act combat/browser replay.
Next intended build/power/point/acquisition policies, especially12boss inputs
outside ready58, before population runs. Bosses do not require trash's strict
level equality. Keep all previous failed/resolved controls; no unsupported
global Bone tuning. Full-v1 active/browser works/CI excluded/no pending question.

NecroII owned-Prayer follow-through,2026-11-01: close the previous completed
experiment without battle/preparation replay.322unused owned items produce no
guarded hero offense upgrade or complete eligible set. One native Prayer head/
belt equip trades MagicResist/Lightning for HP/Physical dodge; boss Amp-only.
Seed1 draws60s with337DurielHP; seed8 loses pack3 at3.810s with Prayer already
dead.2areas/10waves, mana sufficient; reject/stop this combined policy. Reader
passes exact full-save/custody/native carry/payment checks and8tamper controls.
Seven terminal/pass receipts;4configs archived/removed,2identical partials
removed,2caches absent/no owned process. [Report](../balance/2026-11-01-necromancer-act2-owned-prayer.md).
No production/user-save edit, broad/resolved/earlier-act combat or browser replay.
Next recover missing Nova pre-Claim source/role fixtures from retained artifacts,
not more weak-gear controls or an unsupported global Bone spell tuning decision.
Full-v1 active; browser works/CI excluded/no pending question/external blocker.

ActII resource follow-through,2026-11-01: Javelin24 spends its four existing
points once on Impale4; original Lightning-only five-pack combat remains exact,
then boss-only Impale>Lightning clears both241seeds1/8 at41.884/39.620s. Seed8
still touches0MP. No gear/core/merc/reset/farm change or population acceptance.
Necro24 CE>Weaken restores MP but exposes2236ms carried utility CD against a
1620ms pack3burst. One learned Decrepify window clears all five packs both
242cases; Duriel still draws60s with6926/13817HP left. Prayer enters only1;
area minMP198/147. Stop these rejected controls; next eligible owned Prayer
mitigation and hero critical/cadence/offense review, not more mana/farming by
assumption. Exact next decision`p15-necromancer-bone-act2-next-decision-v1.json`.
Shared driver types/lint pass once, spec-only control reuses them.6areas/34waves/
25.655native seconds, reader3passes18tamper controls. Keep the v1reader item
serial-suffix comparison failure; no combat replay.8receipts terminal/7pass,
2configs archived/removed,6duplicate partials removed/3caches absent/no process.
[Report](../balance/2026-11-01-act2-resource-adaptations.md).
No production/user-save edit, broad/ActI/browser replay. Catalog72/64/68/6,
ready58/accepted balance0 unchanged; full-v1 active/browser works/CI excluded/
no pending question or external blocker. Required packet/live claim retained.

BowII mana-glove follow-through,2026-11-01: previous status-only turn is no
progress. Resume one retained native equip; no reset/acquisition/equip replay.
Owned Chain Gloves improve HP501→557/MP305→357/Defense189→222, trading6MR
and15Poison for Cold/Lightning/Physical defenses. Both791seeds1/8 win6/6waves;
Duriel49.700/48.300s, finalHP557/557. Seed1 still touches0MP; no population/
within-three/holdout/intended-power/pacing acceptance. Exact boundary
`p15-bow-act2-owned-mana-gloves-equipped-v1.json`; reader2passes including
four tamper controls. Keep the v1precombat assertion failure (expectedMR24,
actual30) and its successful equip/export.7receipts terminal/6pass;4configs
archived/removed,2identical partials removed/2caches absent/no owned process.
No production/user-save edit, earlier-act/broad suite/browser replay.
[Report](../balance/2026-11-01-bow-act2-owned-mana-gloves.md).
Do not extend this resolved pair. Next intended-power/acquisition/remaining
role coverage and population/economy/pacing/integration. Catalog72/64/68/6,
ready58/accepted balance0 unchanged; full goal active/browser works/CI excluded/
no pending question or external blocker.

BowII Decoy/ranged follow-through,2026-11-01: previous status-only turn is no
progress; this continuation pays the free Drognan reset once and retains31
allocations. Starter-Decoy fails both seeds; stop it. One ordinary Lost City
admission790/seed3902248427 earns19710XP/60items and a39Attack Heavy Crossbow,
no level grant,66.382logical seconds. Continue exact equipped boundary
`p15-bow-act2-earned-ranged-equipped-boundary-v1.json`,26/XP22191/next791;
never repeat reset/acquisition/equip. All five Tomb packs now win both seeds.
Magic filler still starves Duriel; all-wave InnerSight wins8 but loses1 early.
Combined original pack order/boss-only InnerSight wins8 at54.600s but draws1
with9424bossHP left. EntryMP141/253 and actual repeated utility costs remain
the limit; not a qualified pair or population/within-three acceptance. Next
inspect boss resource budget/new owned gear/available priority before farming.
Readbacks `p15-bow-act2-decoy-readback-v3.json` and
`p15-bow-act2-earned-ranged-readback-v1.json` reconcile reset/custody/native seed/
clocks/events/carry/rewards;15altered controls rejected.22receipts terminal,
19pass/three retained harness failures;7configs and8duplicate partials removed,
6caches absent/no owned process. No production/user-save change or earlier-act/
broad suite. [Report](../balance/2026-11-01-bow-act2-decoy-and-ranged-acquisition.md).
Catalog72/64/68/6,58boss-ready/accepted balance0 unchanged; full goal active,
browser works/CI excluded/no pending question or external blocker.

Current BowII follow-through,2026-11-01: Crown-only native swap fails both
retained seeds atwave3; stop it. Two new areas/8waves and two pure comparisons
are retained; no completed combat replay. Reader3 verifies custody/cost/carry/
rewards and eight altered controls. Driver3 binds top-level source hash; reader3
binds ordinal790. All scoped checks terminal,6configs removed/4caches absent.
Reuse already-qualified Zeal/Martial/HolyBoltIII/IV recoveries; stale baseline
failures do not justify a repeat. Next preflight source-owned free Drognan reset
1→0, redistribute31points by Penetrate7→4 to InnerSight1/SlowMissiles1/Decoy1,
retain all other ranks/gear/core/party and no farming. Candidate only, not yet
allocated/fought; check native prerequisites/cost/retargeting then freeze bounds.
Use `p15-bow-act2-recovery-decision-v2.json`; decision1's Fara name is superseded
by authored npc/drognan, with no reset/action committed. [Report](../balance/2026-11-01-bow-act2-owned-defense-diagnostic.md).
Catalog72/64/68/6,58boss-ready/accepted balance0 unchanged; full goal active,
browser works/CI excluded/no pending question or external blocker.

Latest follow-through,2026-11-01: remaining Cold/Nova26→27 and DoubleSwing24→27
preparations pass, including each lawful first Spider clear. Reuse55admissions/
275training waves and four seed1/8 full areas/20measurement waves; no repeat.
Both medians6.452/14.508s are within5–20s, conditional two-seed evidence only.
Current overlay5 is `p15-build-act-native-catalog-refinement-v5.json`:72matched/
64unmatched/68boss-review/6missing-source, ActIIItrash14/14,accepted balance0.
Driver4 preserves full actual-delta typing and first-clear reconciliation;
reader5 verifies native access/clears. Keep the initial type failure and reuse
unchanged measure checks. All55 ordinary admission seeds independently verify.
No production changes, previous-act/full-suite/browser replay or agent. Sources,
earned saves and all rewards remain retained, grants unused. [Report](../balance/2026-11-01-act3-last-two-matched-fixtures.md).
Next remaining role/boss/power/acquisition decisions and required population/
holdout/economy/pacing/integration; goal active, no pending question or external
blocker. The preceding four-fixture report remains valid historical evidence.

Latest ActIII fixture follow-through,2026-11-01: four bounded preparations
and eight new two-seed areas now pass native readers. HolyBolt/Traps/SummonDruid
25→27, FireDruid35→36; all loadouts fixed and level/milestone grants unused.
Reuse122admissions/636training waves plus42measurement waves; no repeat needed.
Current overlay4 is `p15-build-act-native-catalog-refinement-v4.json`:70matched/
66unmatched/68boss-review/6missing-source,accepted balance0. Controlling trash
band is5–20s, not8–20s. New medians20.700/3.270/3.560/5.886s do not accept balance.
Launcher3 now runtime exercised with current BUG558 audit; old launchers stay
historical. Generic training reader4 includes native level12/24/36 milestone
points; retain the initial Fire reader3 failure and reuse other valid reads.
Next the two remaining ActIII trash recipes: Cold/Nova26→27 has ActII Claim but
no Spider clear, so use ordinary first admission/progression; DoubleSwing24→27
needs a predeclared three-level target/bound. Do not prescribe earlier-act replay
or restart committed preparation. [Report](../balance/2026-11-01-act3-four-more-matched-fixtures.md).
Other intended-build/power, population/holdout/economy/pacing and G0–G7 gates
remain open; no pending owner question or external blocker.

Current follow-through,2026-11-01: BUG558 corrects StrictMode automatic
admission by reading current combat state.85affected UI cases/types/lint pass;
ordinary browser now passes both actual Ashen defeats, Return/fresh entry,
zero income, six full export comparisons and three acknowledged Save/process
restart/Continue boundaries. Do not repeat this completed diagnostic. Current
2,091-input source audit is`bug558-source-audit-v1.json` in the retained packet,
hashc40ea546cb3459ca8e8148fa19542ea68d7c3dcbf4456955084e199bbafb640d;
only CombatScreen and its StrictMode regression differ from BUG557, engine/data
unchanged. Launcher3 now authenticates this delta and is runtime exercised; existing
BUG557-bound launcher2 stays historical. Reuse earlier evidence. Next intended-build/power, holdout/economy/pacing and
remaining integrated G0–G7 work. Goal stays active, no pending owner question.
[Browser evidence](evidence/p18-current-browser-defeat-retry.md).

Verification strategy update,2026-10-31: use verified earned checkpoints during
act development and run only checks relevant to changed behavior. Reuse prior
results; do not replay earlier acts or repeat completed seed studies in the
inner loop. Reserve one fresh five-act run and required broad checks for final
integration. This changes development verification cost, not final acceptance.

Select exact files/cases; broad `--changed` is unsuitable for this dirty branch.
Reuse working verification setup: opt-in campaign lint needs `--no-ignore`;
packet-scoped TypeScript configs need the repository's Vite/Node ambient types.
Check fixture API IDs and character-name limits before launching a new fixture.

Owner follow-through,2026-10-31: an Act III-only change does not trigger Act I/II
tests. Select earlier-act cases only when a shared change affects their behavior.
Batch related forecasts and checks; reuse one scoped configuration and working
tool/plugin paths. Keep output to counts and decisive failures. Once affected
checks pass, move to the next implementation task. During earned preparation,
declare an XP/level target, admission limit and retry limit together; ordinary
loss/retry stays inside that one bounded run and retains partial income. Do not
restart the entire preparation after each expected training loss.

A passed check remains valid for unchanged inputs. Do not repeat it at every
checkpoint. Read the retained failed wave before a retry and name the missing
capability that the proposed change supplies. Check damage against mitigation
as well as resource sustain before prescribing more level acquisition. Use
one bounded continuation for the new work; keep every committed partial save
when a diagnostic fails instead of replaying its rewards or preparation.

Before launching a check, identify its changed input or unresolved failure and
select the smallest existing check that resolves it. Do not run a unit suite
after documentation, inventory comparison or readback-only updates. Share one
scoped type/lint setup for related new drivers and use the existing plugin
resolution flags. Record the new result once, then proceed with implementation.

Before prescribing acquisition, compare priority orders that use already-paid
core damage skills during cooldown gaps, then eligible owned equipment and
available points. Evaluate complete owned set bonuses before relying on a greedy
single-item score: Martial Sander gear clears Duriel without new farming. Inspect
actual slot eligibility and recipe currency as well as material counts before
launching preparation controls. A failed one-skill policy does not prove a level requirement.

Checkpoint retention update,2026-11-01 (BUG553): the opt-in campaign runner now
journals `campaign-boss-checkpoint` records with `boundary` equal to
`before-admission` or `before-claim`, plus quest/act/area and a complete native
`exported` save/decoded `snapshot`. Entry capture occurs after owned preparation
and before starting a chapter-boss route attempt; Claim capture occurs before
the reward through both adapters. Preserve boundary and source provenance when
extracting fixtures: a pre-Claim save already includes the boss fight's income.
Capture failure stops before admission/reward commitment; do not retry an old
campaign merely to obtain the newly supported records. The authenticated original
Nova Act II journal has no intermediate full saves; those two catalog gaps stay
explicit. Reuse its completed audit and proceed with the existing fixtures.
Javelin's City continuation improves materially by adding learned Impale to pack
priority. Keep acquisition totals distinct from minimum-level or pacing claims.

Entry-fixture selection update,2026-11-01: use the existing checkpoint metadata
index to batch native actual-ordinal plans before loading full cumulative reports.
Forecast preceding-wave XP with production `xpTotal`/`xpForKill`/`awardXp`; saved
XP is into-level. Forecasts are conditional on wins and their declared multiplier,
not observed combat. Authenticate/decode selected full sources, verify Claim/
access/bonus boundaries, then screen actual target-entry levels, carry and role.
Do not promote a saved-level match after native XP changes it, or reject an older
checkpoint solely because the latest checkpoint misses a different area level.
Reuse original seeds and failures. Stop larger studies when the small screen
exposes missing owned preparation; compare learned priorities and available
points before new farming. Current cumulative role overlay is
`p15-build-act-native-catalog-refinement-v3.json` in the retained packet; the
original catalog and prior overlays stay immutable.

Owned preparation update, 2026-11-01: inspect casting cadence as well as sheet
attack speed. Two-second skills sampled on780/620/700ms turns recur at
2340/2480/2100ms; faster turns can produce slower skill recurrence. Inspect
retained events and defensive socket tradeoffs before spending owned materials.
Javelin Act IV rare-chest/belt-Shael completes100 conditional seeds: trash100/100,
p50/p95 19.655/23.100s, whole-area67/100. Later Izual losses include749/791HP entry
without a merc; review mixed mitigation, mercenary survival and single-target
priority before acquisition. Preserve failed alternatives and reuse completed
seeds. No balance cell is accepted; catalog overlay2 remains current.

Boss adaptation follow-through: native UI/store priority and equip edits before
settling an already-recorded wave affect next-wave projection. Preserve current
recordings and carried HP/mana/cooldowns; never patch combat units. Returning
owned Silks and using Impale-first for Izual improves the full conditional100
from67 to81 area wins, but rescues21 losses and regresses7 wins. Keep both sides
of that comparison. Freeze a reproducible policy without future seed knowledge;
mercenary survival/retries remain open. These are exploratory Izual results,
not chapter-boss or within-three acceptance; original trash evidence is reused.

Mercenary follow-through: the bounded owned chest versus chest/Bloodfist/Coif/
shield screen at retained1/4/7/8 improves Rogue opening survival0/4 to3/4 or4/4,
respectively. Both policies win4/4areas, as do the prior boss-adaptation controls;
all mercs still die by wave2. Fuller gear regresses seed8 hero carry/final life
versus chest-only. Preserve that tradeoff; do not extend automatically to100seeds
or count these as additional matched-trash/boss acceptance. The opening question
is answered. Return to outstanding build/role power and acceptance work; further
Javelin experiments need a named unresolved criterion and predeclared policy.

Role-screen follow-through: the other52 original matched recipes now have a
two-seed native screen, with51both-target matches and MartialIelite unreached.
Reuse its104areas/513waves and the nine prior measured contexts;60of61 selected
matched recipes have native target observations. Measurement overlay is
`p15-build-act-role-measurement-overlay-v1.json`; recipe overlay2/counts remain
unchanged.50new roles win2/2, JavelinIelite splits,15observed medians are fast,
and JavelinItrash is slightly slow. No automatic100seed extension or acceptance.
Next inspect MartialI owned charge/recovery/carry/gear at retained prefixwave3;
mana>=174 and working Fists/Talon discharge rule out a mana-only prescription
or an assumed missing charge implementation. Preserve JavelinI's split too.

Legacy-source diagnostic admission (BUG554): nominal100/500 container limits
do not forbid lossless native awards. If stash-only preparation cannot create
space, retain the original over-cap containers and exercise native ingress;
never discard/salvage or invent capacity to satisfy a transport assumption.
Budget raw evidence for authenticated source inventory size, including legacy
61123-item saves. Freeze policy before new combat, retain failed admission and
reuse completed raw trials. Entry-life audit must distinguish full projected
life passives from Oak Sage's explicit maximum-life increase without healing;
do not patch a native unit or replay combat to satisfy a reader assumption.

Martial I follow-through,2026-11-01: six native areas/30waves retain both failed
controls and one qualifying owned adaptation. Cobra-first fails before the
elite; Isenhart4 reaches it but Fists17/Talon1 are clamped at one damage. A native
Akara reset to Tiger1/Fists1/Cobra1/Talon10/Tail8, Tail-first with Isenhart4,
uses the same21 earned points and one free reset allowance2→1. Both matched
elites clear10.920s and both whole areas win. No new farm/material/currency/
stat-reset/merc change. Talon10/Cobra1/Tiger1 never cast, so do not claim those
ranks necessary or validate the original Fists17 build. Boss4.368/6.552s is fast
and not first-clear proof. Current decision is
`p15-martial-act1-owned-adaptation-decision-v2.json`; readers verify custody,
costs, native carry/rewards and exact enemy streams. Original selected matched
observations stay60/61; declared adaptation supplies the remaining target
observation, with accepted balance0. Keep immutable overlays and all failures.
Return to75unmatched/68boss power/source review; no automatic100seed extension
or damage tuning from this small screen. See
[report](../balance/2026-11-01-martial-act1-owned-adaptation.md).

Boss source follow-through,2026-11-01: use exact area/objective/Claim/victory
history, never checkpoint `clearedActs`, to distinguish boss victory. BUG555
corrects the Martial report's inference; retain decision1 and the archived
prior report, with decision2 superseding only that interpretation.373 exports
yield58tracked pre-victory boss inputs across70slots.33native object/navigation
actions prepare nine more without combat/rewards, making55quest-ready inputs.
Three ActIII Will/Orb actions remain unavailable; twelve slots have no tracked
source in this index. Existing five ActV sources already own Throne credit.
Use `p15-build-act-boss-source-overlay-v1.json` for intended gear/power and
first-attempt/adaptation review; readiness does not establish those criteria.
Do not replay old campaigns solely to fill source gaps or automatically enlarge
seed studies. Recipe overlay2/counts and accepted balance0 remain unchanged.
See [source review](../balance/2026-11-01-boss-source-and-quest-preparation.md).

Boss baseline follow-through,2026-11-01: all55ready sources have reviewed native
gear/rank compatibility. Current character creation grants Druid DireWolf1;
do not reject native starter grants using later allocation gates or infer exact
point history from compatibility. Reuse55projections and six exact prior areas.
Frozen boss fixtures add104areas/600waves at1/8 in77.268s, combined110/632:
23double wins,8splits,24zero wins;42prefix failures and14boss failures.
38setups reach a boss,30both,17neither. Keep prefix survival separate from
boss throughput;16victorious medians are in20–50s,12fast,3slow. No acceptance
or automatic larger seed batch follows. A controlled first fixture attempt
does not require manufacturing an original campaign-first-encounter journal;
retain that separate campaign provenance gap.
Next inspect MartialV's Baal draw using retained Tail29/Cobra29/noTalon events,
physical damage floor, five available points and omitted owned Tiger1. Review
native owned offensive gear/sets/charge/cadence before farming/global tuning.
Mana minima126/18 and both failed trials remain. Current baseline fixtures and
decision are `p15-build-act-boss-fixtures-v1.json` and
`p15-build-act-boss-screen-decision-v1.json`; recipe overlay2/counts and accepted
balance0 remain. [Report](../balance/2026-11-01-boss-baseline-screen.md).

MartialV follow-through,2026-11-01: actual native Baal physical resistance0,
fire75/Defense560. Do not misattribute Cobra's one-damage floor to the unused
Talon20. Four frozen1/8 native controls/22waves take8.346s. Talon-first throughout
dies at prefixwave2 twice; Tail-first groups plus Talon-first boss clears2/2,
boss24.480/28.560s/minMP271, with exact prefix semantics and boss input except
order. Gear/ranks/five free points/merc/materials/resets/farming unchanged.
588owned/584eligible pure gear projections precede any tuning; no production
change needed. Reader/source/strict types/focused lint pass. Keep baseline draws
and failed global priority. Do not replay or automatically enlarge this resolved
diagnostic; next retained FireDruidV Fissure-only cooldown gaps and owned skills.
Recipe61/75/68/6,68/70decoded and accepted balance0 unchanged; all final gates
remain open. [Report](../balance/2026-11-01-martial-act5-order-adaptation.md).

FireDruidV follow-through,2026-11-01:107owned/40eligible native projections
find no complete eligible set; weak Boulder1/Firestorm5 floor at1. Boss filler
controls keep Fissure17 but seed1DPS/stack Burn, regressing both draws. Two
owned crit jewels applied for next boss wave clear2/2:54.720/37.061s, sample
median45.8905s with one slow win. Four areas/32waves take8.274s; exact seven-wave
prefix semantics and canonical payload custody pass. Crit11→29%/2.18→2.91 trades
Life665→593/MP526→500 and defensive stats; native clamps resources without
healing. No points/material/reset/farming or production change. Preserve weak
filler/original failures and mixed-Burn balance concern; no rerun/automatic100.
Next HolyBoltV selected aura/Conviction18 and22Hammer/22HolyBolt/22basic cadence.
All original acceptance gaps/counts stay open.

HolyBoltV follow-through,2026-11-01: selected Conviction18 is native/working.
Four retained free-order controls/28waves still fail despite recurring Bolt
2700→1800ms and minMP564. A source-owned free Malah stat reset refunds245points;
native98Dex/49Vit/98Energy changes core25/80/123/102→25/118/74/113 and stat3→2,
skill2 unchanged. AS200→238/maxLife846→748/maxMP589→605 yields596ms turns and
1192ms Bolt. Keep Hammer groups/Bolt Ancient+Baal: both complete eight-wave
areas clear, Baal45.296/42.912s, boss minMP579. Two new areas/16waves take7.735s.
Gear/ranks/merc/material/currency/farm/production/authoritative saves unchanged.
Pure44owned/44eligible/47single-placement projections enforce unique IDs/native
slots/2H mutex; no complete set. Separate author reader passes all6trials/44waves,
native reset/custody/orders/awards/streams/carry; scoped strict types/lint pass.
Retain projection signature type failure; no completed combat replay/broad suite.
No more HolyBoltV or automatic100seeds. Next retained FireSorceressIV two Diablo
draws: inspect learned Meteor/FireBall cadence, actual mitigation/status potency
and owned preparation before farming/tuning. All original acceptance gaps/counts
remain; [report](../balance/2026-11-01-holy-bolt-act5-cadence-adaptation.md).

FireSorceressIV follow-through,2026-11-01: retaining groups and switching only
Diablo to FireBall20 improves both draws, but free control still splits:11601HP
draw/55.5s victory.121owned/102eligible projections find14partial/no complete
sets. Owned sword+GoblinToe boots at boss clear2/2,50.208/37.500s (one >50s).
Crit15→40%/2.69→3.02, Life888→896/MP766→780, Defense537→535 and flatMR12→0:
old weapon's paid Diamond effects do not survive replacement. Percentage
resistances unchanged; no healing/new points/resets/material/currency/farm/merc/
production/save change. Four completed areas/28waves and exact six-wave prefix
semantics/boss carry pass free reader1/owned reader2. Retain two incomplete
pre-boss diagnostic failures and missing-report reader failure; do not claim
their partial prefixes reused. Driver3 computes full native candidate stats
before battles and checks exact post-equip agreement. No more IV/automatic100.
Next FireSorceressV ordinal1101 has seed1 Baal entry89/972HP/draw and seed8
prefixwave4 death after184HP entry: inspect actual incoming damage/status/merc
carry and owned defense before transferring an offensive boss policy. Existing
acceptance gaps/counts stay open;
[report](../balance/2026-11-01-fire-sorceress-act4-owned-adaptation.md).
[Report](../balance/2026-11-01-fire-druid-act5-owned-adaptation.md).

Before writing a one-off native adapter/readback, inspect the actual request,
receipt and encoded optional fields. Material requests use inputs/targets;
saves retain the latest material receipt; zero deltas may contain explicit zero
keys and optional observations may encode undefined. If an assertion fails
after a native commit, retain and independently audit that exact saved state,
then resume it; do not repeat the committed action or earned income.

CI is not required for the current work. The owner requested removal of
`.github/workflows/ci.yml`; use applicable local validation commands instead.
The owner will playtest after game implementation. Keep that acceptance pending
and continue implementation and automated verification.

Local browser investigation in WSL is authorized again. Preserve the original
terminal H3 failure and one-shot experiment records. Their recorded attempt
limits do not create a blanket ban on new, separately recorded tests. Preserve
earned saves and distinguish constructed tests from earned progression.

## Starting a goal

Official OpenAI documentation describes `/goal <objective>` as setting a
persistent target; `/goal` views it, `/goal edit` revises it, and `/goal pause`,
`/goal resume`, `/goal clear` manage it. Source checked 2026-10-20:
https://developers.openai.com/codex/cli/slash-commands/

A goal tracks an objective; it is not itself a detailed backlog, validation
result, or permission to ignore repository workflows. Keep evidence and task
state in the repository so a new context can resume. Budget controls, where
available in the installed client, are separate from completion criteria.
Do not invent CLI flags or promise that one session can run forever.

Recommended first bounded goal:

```text
/goal Complete checkpoint C0 in docs/plans/work-plan.md for D2H5TextGame.
Read docs/plans/README.md, baseline.md, playable-target.md, feature-coverage.md,
design-decisions.md and agent-contract.md. The final destination remains the
full seven-class, five-act v1 game, delivered in stages, with a 30–50 active-hour
fresh first campaign clear. Complete P00–P02: reconcile design decisions needed
for the first vertical slice, establish truthful current-head acceptance tests,
and deliver a reproducible production-path measurement harness and baseline.
Do not stop at documentation if C0 calls for executable harness/tests. Use the
studio team with explicit worktree/file ownership; preserve other agents' work.
Do not fix unrelated gameplay or tune global numbers in this checkpoint.
Record failed/unknown gates honestly; finish only when C0's own deliverables
pass independent review and its measurement/reproduction gates are satisfied.
```

After C0, use successive goals for C1, C2, C3 and C4, carrying forward accepted
contracts and evidence. This keeps each goal reviewable without reducing the
destination. The goal for C1 must explicitly include ordinary UI first-boss
victory, actual skill effects/upgrades, correct loot, quests, save/reload and
mobile. C2 must include all five acts with earned state, not injected checkpoints.

If using one umbrella goal instead:

```text
/goal Finish the complete private v1 game described by Diablo2TextGame.md and
docs/plans/README.md. Deliver checkpoints C0–C4 in docs/plans/work-plan.md,
seven classes with every advertised skill functional, Acts I–V reachable from
fresh earned state in 30–50 active hours, meaningful builds/loot, all canonical
economy/quest/merc/crafting/endgame systems, safe saves, mobile/locales and PWA.
Use docs/plans/playable-target.md gates G0–G7 and agent-contract.md for every
delegated assignment. Maintain the task/evidence ledger, review each integrated
slice, and continue through failed gates. Never declare completion from green
unit tests, registered skill IDs, screens or seeded endgame fixtures alone.
No public deployment or v2 expansion. Report genuine blockers and pending
human playtests honestly; do not treat partial checkpoints as full completion.
```

Do not set an arbitrary token budget on behalf of the owner. If a budget ends,
leave concrete status/evidence and next steps; budget exhaustion is not success.

## Session startup and resume

1. Read user/repository rules and relevant skills. Establish repository remote,
   current base/head and which planning commit is present. Claim an isolated
   worktree using installed `git-worktree`; start new work from latest base.
   If the plan is only on `feat/plans-playable-game`, integrate/provide its
   commit deliberately—do not assume a fresh main checkout contains it.
2. Read ledger and last checkpoint report; verify recorded dependency SHAs and
   whether source changed since baseline. Preserve baseline; create a dated
   new report when measurements change. Do not re-run historical work blindly.
3. Select ready child cards. Dispatch goal, constraints, gates, writable files,
   dependency commits and evidence template. Assign one shared-contract owner.
4. Integrate reviewed slices, validate the combined head, update ledger and
   retain decisive evidence. Push/open PRs and merge only within the user's
   authorized delivery scope and repository approval/CI rules.
5. If stopping, record current branch/commit, remaining failed/unknown gates,
   next ready cards, active processes/claims and retained artifact owners.
   Release finished worktrees via the skill; never remove them manually.

## Existing commands, verified against package/config

Run from the claimed worktree. Prefer CI's Node 20 for comparable results;
record the actual version. Never run watch mode in an agent shell.

```bash
npm ci --no-audit --no-fund
npm run test:related -- src/engine/combat/combat.ts
npm run test:fast
npm run test:engine
npm test
npm run typecheck
npm run lint
npm run build
```

Final integrated handoff: complete unit + typecheck + lint and engine checks.
During development, the owner update above overrides per-edit full-suite rules:
run only the cases affected by the change, with scoped type/lint checks when
needed; documentation or report corrections do not require combat replay.
For an Act III change, select Act III cases. Include earlier-act cases only
when the change affects their shared engine/data/save contract. Reuse earned
checkpoints and passed checks; repeat a check only after a relevant change,
failure or unresolved concern. Keep acquisition simulations separate from
acceptance reruns and use only new rewards to bridge a justified next gate.
Coverage is an additional release gate at the repository's configured
80% engine thresholds, not proof that all skills work:

```bash
npm run test:cov
npm run lint:i18n
npm run check:test-bridge-shake
```

The i18n script is currently report-only in CI; its successful job cannot
replace player-facing translation acceptance. `check:test-bridge-shake` builds
production and verifies debug helpers are removed; an E2E bridge-enabled bundle
does not establish this production safety gate.

Desktop (**D**), mobile (**M**) and production (**P**) examples:

```bash
E2E_PORT=4289 npx playwright test --grep @smoke --project=chromium-desktop
E2E_PORT=4289 npx playwright test --grep @smoke --project=mobile-portrait
E2E_PORT=4289 npx playwright test --project=chromium-desktop
E2E_PORT=4289 npx playwright test --project=mobile-portrait
RUN_PROD_BUNDLE=1 E2E_PORT=4289 E2E_PROD_PORT=4389 npx playwright test --project=prod-bundle
```

Production currently covers tagged production specs only. P17 must add actual
network-disabled reload/play/save assertions; the existing registration test
alone cannot pass G6. Also add production mobile coverage explicitly rather
than assuming the desktop production project covers it.

The earlier preparation host lacked a browser. That historical setup failure
is resolved for current work: headed Chromium runs in WSL, and the current31
production-browser checks pass in zh-CN360×640/en1280×800. See
[evidence](evidence/counted-source-family.md). Use the established local Playwright
browser setup and retain actual failures; no browser-launch or CI prerequisite
currently holds implementation. Browser checks establish their stated bounded
flows, with owner playtest following implementation.

**S** is a future harness delivered in P02. There is currently no `npm run sim`.
P02 must document executable tiny/screening/certification commands, discovery,
fixture validation and output schema before a worker uses them. Never cite a
nonexistent script copied from an old workflow as passed validation.

## Evidence and disk hygiene

For each checkpoint retain a small versioned Markdown summary plus JSON/CSV
metrics and necessary representative screenshots/traces. Name it by checkpoint,
SHA, fixture version and seed set. Raw logs/videos belong in a task-isolated
temporary directory or forge artifacts; record retained path, purpose, owner
and removal condition. Do not commit huge browser-output folders or asset dumps.

Track exact paths created, consumers and owned process IDs. Use Playwright's
server lifecycle; if a port is occupied choose another port. Remove disposable
task-owned build/test outputs and temporary logs after their results have been
preserved and consumers finish. Preserve installed tools/shared caches and
required evidence; never recursively delete shared parents or worktrees.

## Completion report

For each C0–C4 report: target gates passed/failed/unknown, feature/skill coverage,
head/data/fixture versions, exact command outcomes, seed/sample distributions,
browser/locale coverage, human playtest status, open defects and next actions.
Final completion requires G0–G7, independent reviewer/QA, applicable local
validation checks, full campaign/endgame proof and player acceptance. CI is
excluded for this work by the owner update above. If human play
feedback is pending, say so rather than claiming the game is finished.


Latest Martial checkpoint,2026-11-01: Acts III–IV and Bloody Foothills complete;
current29/XP39716/next366,24areas/48canonical Act II–V actions. Authoritative
p15-martial-act5-route-native-v1.json and readback-v1 pass. Original Rogue25;
stat2/skill0;67paid contents remain owned. Talon20/Tail14/Tiger1/Cobra1/Fists1,
Cobra/Talon/Tail priority. BUG547 current Talon growth60 preserves rank1 and
passes51focused checks plus scoped types/lint; full balance stays CONCERNS.
No additional farming in Act IV/V; Diablo22.4s. Frigid wave3 retains a5.24s
arcane defeat. Compare owned arcane/MR wards, complete set/runeword bonuses and
paid orders before training. Use launcher p15-martial-focus-run-v24.mjs,
forecast-v11, Act V continuation-v2/readback-v2; the old v22 cannot accept current
Talon source. See [current evidence](evidence/p15-martial-earned-act4-complete-v1.md)
and p15-martial-act34-complete-act5-frontier-artifacts-v1.json in the retained
packet. Earlier19/Act III statements are historical. No old-act replay; goal
active/incomplete, roster11/14, browser working, CI excluded, no external blocker.


## Martial five-act completion — 2026-11-01

Actual37/XP343352/next483 now clears all29areas and64canonical Act II–V actions. All five act-final Claims/native Baal receipt independently pass; Baal25.5s with paid Talon-first boss priority. Original Rogue28/stat2skill0/all75paid contents retained; statPoints0/skillPoints5. Historical roster12/14; Trap Assassin and Summon Druid remain. BUG548 changes only Tail growth6→120 (rank1 unchanged);163affected checks and scoped types/lint pass, broader balance stays CONCERNS. One bounded110-admission ActV preparation earns37; no old-act replay/broad tests. Current authoritative report/readback: p15-martial-act5-route-native-v4.json / p15-martial-act5-route-readback-v4.json, source944044048abf70b2ac1e6b7202ee059862d583ecc11d266123f74ae55e2ab800. See docs/plans/evidence/p15-martial-earned-act5-complete-v1.md. Closure p15-martial-act5-complete-artifacts-v1.json. Next Trap earned route, then Summon Druid, advertised skills/builds, disjoint holdouts/economy/pacing/final integration/owner acceptance. Browser works; CI excluded; no pending answer/external blocker. Goal/branch/human2 claim stay active; root retains packet until umbrella acceptance.


## Trap Assassin Act II complete / Act III frontier — 2026-11-01

Actual25/XP50171/next300,17areas/31canonical actions; original Rogue23/stat3skill1/2free skill points. Current p15-traps-act3-native-v2.json/readback-v2 pass. Acts I–II and five Act III areas complete; roster remains12/14. BUG549 Lightning growth6→24 passes162affected tests/scoped types/lint and exact2090-input/five-path audit. Legal Lightning20 reset clears Summoner19.686s; owned Rogue gear/six paid insertions clear Duriel59.4s. ThreeNef head/belt wards clear Bazaar; Travincal then clears. Native Durance admission299/runSeed533373627 retains Mephisto defeat and all income. Exact-source funded wards/paid orders/party28 forecasts do not qualify; BUG550 records late Normal trap damage. Next diagnose the remaining-act trap curves/paid alternatives, then qualify actual25/ordinal300 before retry; no further farming justified yet. Source866128d11212fd87ace8a9bc2c0df0628f3cddc2a2b0cfdd40719d319e4d4f69; data822083c67397a6de80747e3decf8549c6203a0e985e4f48818e614aade60270d. Launcher v26/forecast-v12/Act3-v6/readback-v3 are current. See docs/plans/evidence/p15-traps-earned-act3-frontier-v1.md and p15-traps-act3-frontier-artifacts-v1.json. Six temporary configs archived/removed; owned processes terminal. Full private v1/213skills/remaining routes/holdouts/economy/pacing/final integration/owner acceptance remain open. Browser works; CI excluded; no question/external blocker. Goal/branch/human2 claim stay active; root retains required packet until umbrella acceptance. No broad/old-act replay, agent/install/commit/push/publication.


## Trap Assassin five-act completion — 2026-11-01

Actual33/XP52911/next405 now clears all29areas and64canonical actions. All five
act-final Claims/native Baal receipt independently pass; Baal49.64s. Original
Rogue27/stat3skill0/all38paid contents owned; no free points. Roster13/14;
Summon Druid remains. BUG550 Blade growth5→120 passes168affected checks/scoped
types/lint; full balance and elemental variants stay CONCERNS. Current-source
owned gear/orders/set bonuses/free points/costs were compared before two bounded
ActIV preparations (29+62new admissions,455wins/zero losses) earned28then32.
Twelve paid insertions cost8Nef/4Thul. BUG551's false QA headroom stop preserves
those exact costs; three regression/three negative readback checks pass. Existing
helper-v3 is now consumed by forecast-v13/ActIV-v6/ActV-v4. Paid preparation was
not replayed. A free owned arcane helm clears Chaos/Diablo38.96s; no ActV training,
preparation or production change. Current p15-traps-act5-native-v1.json /
p15-traps-act5-readback-v1.json, report3824bb4a91c3fa2d24ce8966309cac59bbe3724a73525883bb6a90ec244f5df3.
Source dc39535bf1015c366a1e3e933683dfacc5ad4bdc55180ab616a85d105148a1d8;
data b809efd9e5be43436b9afa7c8389c798854b3a5ac25610aefeeceb5f57770197.
See [Trap completion](evidence/p15-traps-earned-act5-complete-v1.md),
p15-thirteen-route-roster-v1.json and p15-traps-act5-complete-artifacts-v1.json.
Earlier ActIII frontiers are historical. Next Summon Druid, then213skills/builds,
missing areas/holdouts, balance/economy/pacing/final integration/owner acceptance.
Browser works; CI excluded; no question/external blocker. Full goal and human2
claim remain active; no broad/old-act replay or install/agent/commit/push/publication.


## Prior Summon Druid Act IV completion — 2026-11-01

Actual40/XP221977/next572,23areas/45canonical Act II–IV actions. Current native
report/readback: `p15-druid-summon-act4-native-v2.json` / readback-v2. Acts I–IV
complete; historical roster13/14. BUG552 growth/runtime/preview correction passes
210affected checks, final new controls10/10 and scoped types/lint. Production
source2091-input audit remains `bug552-source-audit-v1.json`. No further tuning.
See `evidence/p15-druid-summon-earned-route-continuation-v1.md`.

Act V Foothills has a cold-heavy forecast failure at40. Owned gear/wards and a
free Oak/Grizzly control fail;45with owned Rockstopper/cold amulet qualifies.
Current bounded acquisition is `p15-druid-summon-act5-earned45-native-v1` from
exact source `p15-druid-summon-act4-native-v2.json`: Act IV Outer Steppes, target45,
max350admissions/5consecutive/15total nonwins/10800000logical ms. Read its owned
process receipt and saved result before resuming; observation timeout is not a
reason to restart. Required next step is independent training readback, then
fresh actual-source Foothills qualification/native suffix. Keep all old losses,
paid contents, free points/resets, native rewards and quest chronology.

Current launcher `p15-druid-focus-run-v1.mjs`; forecast-v13; Act II-v9/readback-v6,
Act III-v7/readback-v4; Act IV-v6/readback-v3; Act V-v4/readback-v2;
training-v10/readback-v14. v10 changes only explanatory wording from checked v9.
Ordered repeated target caps and explicit positive-XP initial training losses
are supported. Reader14 checks all production inputs plus source/config/HEAD;
only Markdown document Git-status deltas may vary, with negative controls.
Do not replay native rewards when a checker fails after a commit.

Full v1/213skills/builds/missing areas/holdouts/balance/economy/pacing/final
integration/owner acceptance remain open. Browser works; CI excluded; root sole
writer, no question/external blocker. Reuse unchanged affected checks, no broad
regression or historical campaign replay. Native earlier-area acquisition uses
new ordinals and retains every income/cost; it is not replay of old evidence.


## Latest continuation — fourteen main routes complete, 2026-11-01

All preceding Druid live-process instructions are terminal/superseded. Source
`p15-druid-summon-act5-native-v2.json`, SHA256
`9c7dd2128895bcb31ee89b79811de8c0ccb732ea2e8ab9db57801bced8217b2a`,
passes `p15-druid-summon-act5-readback-v2.json`:49/XP202871/next942,29areas/
64canonical actions/all five final Claims/native Baal receipt. Original Rogue,
stat3skill1 and two inherited Elds remain; one free skill point. No other paid
preparation or production tuning. Native Ancients56.96s; Baal9.10s. The final
policy uses Dire20/Spirit15/Grizzly1/Poison1, with Heart20/Oak1/Barbs1 passive.

Reader15 replaces reader14 for future training: completed Act IV inputs now
validate their five areas,45 actions, Claims and native receipts; old failure
and five negative controls are retained. The successful level45 preparation,
target48 run that actually stops at45 on retry limit, and level49 acquisition
all pass independent readers. Do not replay them. Training-v10, forecast-v13,
ActV-v4/readback-v2 and the2091-input launcher remain current.

Current machine roster `p15-fourteen-route-roster-v1.json` rechecks/preserves all
13 predecessor report hashes and adds Druid.22 build/area cells in five historical
routes remain missing. Historical lineage analysis deduplicates cumulative wave
summaries, verifies no conflicting duplicates/missing ordinals, and reuses the13
prior rows instead of replaying gameplay. Its3.5056–28.9898h combat-only range
and14.3371h median are diagnostic, not30–50active-hour or fairness acceptance.
See `docs/balance/2026-11-01-fourteen-route-screen.md` for the next acceptance work.

Artifact closure `p15-druid-summon-five-act-complete-artifacts-v1.json` inventories
all additions since the original Druid baseline, verifies predecessor evidence,
source/doc transitions, terminal receipts and exact cache/config cleanup. Root
retains that packet and live human2 claim for umbrella acceptance. No task process
is running. No broad/earlier-act replay, install, agent, commit, push or publication.
Full v1 remains active; all remaining requirements and owner playtest remain open.


## Latest Druid balance screen — 2026-11-01

Current-source exploratory fixtures/report `p15-druid-current-source-screen-v2`
and independent `...-readback-v3.json` pass32 seed trials plus two historical
controls/212waves. Nine completed trial records reused; no earned save, campaign,
cost or reward replay. Ancients free wolves/Barbs/Poison8/8 versus Oak2/8; boss
p50 53.40s. Ordinary post-Claim repeat Throne0/8 for both same-point orders,
all fail19-enemy level80wave5 before Baal; minimumMP483/485, boss timing n0.
First-clear9.10s remains historical. Four failed comparison controls pass, and
native boss tier classification is corrected by reader3 from the same records.

Production2091 inputs/BUG552 source hash unchanged; reuse210 affected checks.
New driver strict types/scoped unused/no-any lint pass. See
[screen](../balance/2026-11-01-druid-native-seed-screen.md). Exact retained closure
`p15-druid-current-source-screen-v2-artifacts.json` tracks source/predecessor pins,
all new files, terminal owned processes and exact config cleanup. No task process
remains live; original authoritative earned source is still
`p15-druid-summon-act5-native-v2.json` at49/XP202871/next942.

Next inspect repeat-Throne wave5 damage/mitigation, legal owned AoE/physical
adaptation/free points/reset cost before more acquisition or numerical tuning.
Current32 trials use seeds1–8 at fixed ordinals, not100-seed exploration,
1000/1000 acceptance, matched-power role coverage or pacing proof. Boss-only
work needs complete native input/carry, not player/enemy-array reconstruction.
All14 historical routes complete; full v1/213skills/22missing area cells and all
remaining gates/owner acceptance remain open. Browser works; CI excluded; root
sole writer/no external blocker or pending answer. Keep claim and packet active;
no broad replay, agents, installs, commits, pushes or publication.


## Latest Druid adaptation closure — 2026-11-01

All prior task processes are terminal. Earned authority unchanged at
`p15-druid-summon-act5-native-v2.json`, SHA256
9c7dd2128895bcb31ee89b79811de8c0ccb732ea2e8ab9db57801bced8217b2a:
49/XP202871/normal942, one free point, stat3skill1, original Rogue31, two Elds.
Source2091 inputs and BUG552 production hashes unchanged; reuse210affected checks.

Free skill screen `p15-druid-owned-adaptation-screen-v1`/reader2: learned five
(append Raven to existing four), Raven2, Carrion1; each0/2. SkillsScreen has9slots,
not4. Owned merc screen `p15-druid-owned-merc-screen-v2`/reader3: chest/gloves/ring,
then same plus cold axe; each0/2. All ten trials/60waves end in pre60s wave5 draws;
minimumMP463. Native gear stats change, Rogue dies wave2/1740ms in all packages.
No2/2 qualifier; no seeds2–7 extension. No paid material/reset/farm/tuning or
committed state/reward. Baselines and completed trials are never replayed.

`p15-druid-current-source-screen-v2-readback-v4.json` supersedes reader3's timeout
classification only: terminal-wave duration, not area total. All15 prior repeat
Throne draws are pre60s/action-cap-pressure; the genuine Oak60s draw remains.
Current free/merc readers and scoped strict types/no-any/unused lint pass.
Failed prebattle metadata driver/reader assumptions are retained and corrected
without battle reruns. `p15-druid-owned-adaptation-decision-v1.json` and
`docs/balance/2026-11-01-druid-owned-adaptation.md` give exact negatives/limits.
Artifact closure `p15-druid-owned-adaptation-artifacts-v1.json` inventories this
continuation from its start-v1 baseline, source/doc/predecessor pins, terminal
receipts and exact disposable config cleanup. No task process remains live.

Next stop this conditional49-versus80 repeat-area diagnostic. Freeze the plan's
intended-power70build/act and210role fixtures, legal earned-gear provenance,
point/priority/merc/summon/adaptation costs before exploration. Preserve this
underlevel negative boundary; first-clear Baal requires its original quest-source
context. All14 historical main routes complete, but full213skill/identity,
22missing area cells, disjoint holdouts/economy/fairness/30–50active-hour pacing,
final integration/mobile/locales/a11y/PWA/endgame/save stability/two-hour soak/
review/owner acceptance remain open. Browser works, CI excluded, no question or
external blocker. Keep umbrella goal/live human2 claim/packet active; root sole
writer, no agents, installs, commits, pushes or publication.


## Latest build/act fixture catalog — 2026-11-01

All preceding task processes are terminal. Current authority remains the14
unchanged earned route exports; Druid49/XP202871/normal942 remains unchanged.
Source2091/BUG552 hashes unchanged; reuse210 affected checks. No production,
earned XP/item/point/reset/material/merc/ordinal change or holdout use.

New index `p15-build-act-checkpoint-index-v3.json` streams/authenticates373 saved
checkpoints. Native catalog `p15-build-act-native-catalog-v1.json` selects latest
pre-final-Claim saved state, prior act Claim owned, excludes known later-act
progress, and checks current save restore/access/hero+merc projections/planning.
68/70 slots decode/plan; Nova Act I/II pre-Claim sources missing. A previous-act
checkpoint may enter an unlocked next act. Independent catalog reader1 passes
70/210 classifications,68 source pins/2091 inputs and four negative controls.
54 exact-level trash/elite recipes remain unaccepted;82 contexts unmatched,
68 bosses need first-clear/power review and6 role slots lack sources. Pre-Claim
is not necessarily pre-boss-victory or a proof of no unseen future partial loot.

Measurement `p15-build-act-native-measure-v2.json`/readback-v1: Bow31 source
`p15-bow-act3-inner-sight31-continuation-v1.json`, ordinal955, unchanged earned
ranks/gear/Rogue26. Frozen Great Marsh wave2 trash and Spider Forest wave4 elite,
seeds1and8, whole-area native paths clear4/4 /20waves. Actual targets remain
31vs31: trash9.72/10.80s; elite11.88/14.58s, n2each; targetMP≥328. All local
preparation/income discarded; native stash-only capacity preserves custody.
No accepted balance or pacing claim. Keep completed trials; no replay needed.

Scoped current driver strict types/no-any/unused lint pass. Catalog typed driver2
has identical emitted JavaScript to executed driver1; proof retained. Old wrapper
profileId assumption fails before first battle and is removed using authenticated
source/decoded class/ranks instead. Metadata diagnostic-status/long-line fixes
and the exact-PID stopped read-only full-array pass are retained; all terminal.
Closure `p15-build-act-fixture-artifacts-v1.json` tracks new files, predecessor,
source/doc pins, terminal receipts and exact disposable config cleanup. See
`docs/balance/2026-11-01-build-act-fixture-catalog.md` for limits and wall budgets.

Next recover original Nova pre-Claim Act I/II inputs, refine82 unmatched role
power/gear/identity and68 boss first-clear contexts, freeze adaptation/retry costs,
then run bounded100-seed exploration shards for eligible fixtures. Do not spend
holdouts or replay completed campaigns/trials. The native sample wall31.31s for
four whole-area runs projects roughly26minutes for200without startup amortization;
benchmark a bounded shard before a large batch. Full v1/213skill/identity,
22missing area cells, disjoint holdouts/economy/fairness/30–50active-hour pacing,
final integration/mobile/locales/a11y/PWA/endgame/save/two-hour soak/review/owner
acceptance remain open. Browser works; CI excluded; no question/external blocker.
Keep umbrella goal/human2 claim/packet active; root sole writer, no agents,
installs, commits, pushes or publication.


## Fire Sorceress V follow-through — 2026-11-01

[Owned jewelry and boss order](../balance/2026-11-01-fire-sorceress-act5-owned-adaptation.md)
qualifies both retained seeds under two frozen policies:4/4 whole-area wins,
32waves, Baal57.340/33.679s or54.653/27.078s. Native source-owned amulet/ring
swaps before admission change prefix combat; Meteor-first groups/FireBall-only
boss preserve native carry. Explicit poison/resistance/dodge/resource tradeoffs;
no point/reset/merc/material/currency/farm/production/save change. Seven scoped
receipts and separate author custody/carry/event/reward/HP-orb audit pass. Two
configs archived/removed, caches absent, processes terminal; no replay/large
study. Closure `p15-fire-sorceress-act5-owned-artifacts-v1.json`. No independent/
population/intended-power/within-three/holdout/first-encounter acceptance; source
already owns Throne credit. Historical14routes/61/75/68/6/68of70decoded/accepted
balance0 and full-v1 gates remain open. Next inspect retained TrapAssassinII
Duriel draws; no more resolved ActV runs. Required packet/live claim retained.


## Trap Assassin II follow-through — 2026-11-01

[Native adaptation](../balance/2026-11-01-traps-act2-owned-adaptation.md) keeps both original
Duriel draws and the owned-sword split (58.980s win/1181HP draw). Source-owned
one-hand sword improves Lightning cadence4380→3080ms despite AS130→120, trades
8flatMR/15Attack for crit, retains shield/resists and exact five-wave prefix.
One actual free native skill reset then refunds29plus1free point and reallocates
30 to FireBlast1/Shock1/Charged1/Lightning20/BladeSentinel7. Skill1→0/stat3 stays,
no currency/equipment/core/merc/material/farm change. New prefix combat and
Lightning/Blade priority clear2/2 full areas, Duriel50.640/41.880s. Four new areas/
24waves take12.137s; separate author custody/points/cost/events/rewards/carry
readers pass. Scoped types/lints pass; plugin-resolution launch failure retained.
Two configs archived/removed, three caches absent,13terminal receipts; closure
`p15-traps-act2-adaptation-artifacts-v1.json`. No production/save change or broad/
earlier-act replay. No independent/population/intended-power/within-three/holdout/
first-encounter/final acceptance; all baseline/counts/accepted balance0 remain.
Next exact-source audit identifies missing ActIII Flail for DoubleSwing and
SummonDruid, plus missing Eye for SummonNecro. Freeze and resume only required
native objectives/Council preparation; do not replay owned components/ActsI/II.
Required evidence/live claim retained; full-v1 goal active, no external blocker.

## Act III preparation and Mephisto follow-through — 2026-11-01

Current supplement `p15-act3-boss-catalog-supplement-v1.json` adds two native-earned
quest-ready pre-victory inputs to original55, now57accumulated catalog inputs;
this is not57uncleared campaigns. Original recipe overlays and boss diagnostic
baseline stay immutable. Two current gear/rank preflights pass. Native attempts
omit seed/ordinal overrides; keep them separate from explicit1/8diagnostics.
SummonDruid25 wins all6Durance waves, Mephisto28.480s; Guardian completed/unclaimed,
XP99241/next219. Reuse success. SummonNecro27 draws Durance wave4 after retinue/
Prayer attrition; retain XP168478/next716. D06 one-batch preparation intentionally
prevents replacements; do not reinterpret that as a bug. DoubleSwing's one free
Ormus defensive skill reset3→2 still dies to thorns; retain XP143162/next529 and
both failed prefixes' income. Stop this reset policy; inspect owned physical
mitigation and paid priority/party gear/rank projections before acquisition.
Three author audits pass7admissions/34waves;13terminal scoped receipts. Four
configs archived/removed and four caches absent. No broad/earlier-act replay or
automatic larger study. [Report](../balance/2026-11-01-act3-quest-preparation-and-mephisto.md);
closure `p15-act3-missing-objectives-artifacts-v1.json`. Full v1/independent balance/
pacing/final integration acceptance remains open; packet/live claim stay active.

## Act III owned recovery follow-through — 2026-11-01

Current boss supplement2adds Barbarian's native Council/Will/Orb-ready input:
55original+3=58accumulated ready pre-victory boundaries. All three original
preparation gaps now have native Mephisto wins: Druid28.480s, owned-reset/Prayer
Necro48.708s, owned-defense Barbarian25.668s. Guardian Claims remain unclaimed.
Reuse successes; do not replay them. Barbarian source24/XP218472/next531 retains
3actual owned hero defense swaps; ranks/core/
merc and prior skill2/stat3 remain. Necro27/XP193248/next717 keeps3Skeleton cap,
trades Mastery18→15 for Weaken1/IronMaiden1/LifeTap1 via one native33-rank reset,
skill3→2/stat2;3Prayer gear swaps. No farm/currency/material/stat spend.
Native actor preflight and full-party item custody pass. Preserve corrected
reader3 and both earlier metadata/normalization failures; no battle replay.
15terminal scoped receipts/12pass,3configs removed/4caches absent. Original
recipe/source/role/110diagnostic overlays stay immutable; native seed/ordinal
attempts are separate. [Report](../balance/2026-11-01-act3-owned-recovery.md), closure
`p15-act3-owned-artifacts-v1.json`. Next retained FireSorceressIII deaths begin
at79/329HP with344MP; inspect earlier prefix carry/Physical mitigation and owned
party gear before acquisition/tuning. No next trial launched, accepted balance0;
full v1/final gates remain open, packet/live human2 claim stays with root.


## Fire Sorceress III owned and paid recovery — 2026-11-01

The prior status-only goal turn made no progress. This continuation compares
all native owned hero/merc slots, then executes4diagnostic areas/23waves with
explicit retained seeds1/8/ordinal384. Two source-owned head/chest swaps preserve
casting stats and improve Physical11→27/Lightning25→52, but split1/2: failed
wave4now enters479HP and dies9.480s to critical burst; seed8clears Mephisto43.864s.
Pure all-owned rune/gem previews favor one Sol in the new helm's empty socket.
Native payment uses1of5owned Sol per independent diagnostic, material ordinal+1;
Physical27→34, no currency/points/reset/merc/farm change. New control clears2/2
full areas, Mephisto44.714/43.864s, final301/312HP. Local income/costs discarded;
source and saved admission counter unchanged. Rogue still dies; do not claim
party survival or population/intended-power/within-three/holdout acceptance.

Separate author custody/native payment/equip/event/reward/HP-orb/carry readers
pass without combat replay. Seventeen terminal scoped receipts/15pass; corrected
ordinal inference and pure socket exact-AS assumptions retained. Scoped strict
types/lints pass; reuse210BUG552/112BUG553 checks. Five configs archived/removed,
five caches absent. No production/save change, broad/earlier-act tests, agents,
installs, commits, pushes or publication. Adaptation overlay
`p15-fire-sorceress-act3-adaptation-overlay-v1.json`; accumulated ready catalog58,
original110trials/recipe/role overlays unchanged, accepted balance0.
[Report](../balance/2026-11-01-fire-sorceress-act3-owned-adaptation.md), closure `p15-fire-sorceress-act3-artifacts-v1.json`.
Next read-only TrapAssassinIII diagnosis pins two failed prefixes, available2
points and mana316: compare learned priorities/owned Physical+Lightning defense
and merc carry before resets/farming. Do not replay resolved FireIII controls.
Full v1/213skills/210roles/22areas/economy/pacing/final integration/owner gates
remain open; browser works/CI excluded/no external blocker or pending answer.
Required packet/live human2 claim remain with root for umbrella acceptance.


## Trap Assassin III follow-through — 2026-11-01

[Owned recovery report](../balance/2026-11-01-traps-act3-owned-adaptation.md):
four source-owned hero swaps and one free Ormus skill reset allocate31ranks
including Lightning20/Blade8. Lightning-first throughout splits35.880s win/
7971HP boss draw. Same packs with native Blade-first boss priority clear2/2,
41.580/50.280s. Preserve all4areas/24waves and original losses; reuse successful
controls. Author custody/reset/reward/event/carry audit passes, no production/
authoritative-save change or earlier-act/broad replay. Ten terminal receipts,
three configs removed/five caches absent; closure `p15-traps-act3-artifacts-v1.json`.
Ready inputs58/accepted balance0/full-v1 gates unchanged. Next exact read-only
DoubleThrowIV diagnosis records two wave5prefix deaths, Physical325/460 and
Fire22/86; inspect owned mitigation/party carry, recognizing Howl already casts.
No external blocker or pending answer. Required packet/live claim stay active.


## Double Throw IV bounded failures — 2026-11-01

[Owned diagnosis](../balance/2026-11-01-double-throw-act4-owned-diagnosis.md)
retains6areas/34waves. Three-slot physical defense regresses Arcane knights;
one ring with original boots/right ring clears seed1Diablo23.760s but loses
seed8mega-demon wave5. DoubleThrow-first late pack dies2/2; retain Howl-first.
Do not repeat either rejected policy. Full native Barbarian passive composition
replaces sheet-only comparison before combat; no production/save/rank/core/
reset/material/currency/merc changes. Author readback passes,14terminal scoped
receipts pass, five configs removed/five caches absent. Closure
`p15-double-throw-act4-artifacts-v1.json` pins next exact defense diagnosis:
compare legal43-rank reallocation toward IronSkin using an available free
reset, accounting for offense and earlier Arcane/Poison carry before any trial.
Recovery remains a split, accepted balance0/full-v1 gates open. Required packet/
live claim remain; browser works, CI excluded and no answer is pending.


## Double Throw IV recovery qualified, timing open — 2026-11-01

[Native reset/order recovery](../balance/2026-11-01-double-throw-act4-defense-and-boss-order.md)
retains the one-ring setup and actual free Tyrael43-rank reset. The final policy
moves two Bash ranks to IronSkin3, preserves Mastery14 and Howl-first packs,
then stages Throw-first only for Diablo. Both retained seeds clear,17.820/9.504s;
fast bosses and near-deadline mega-demon packs remain explicit timing concerns.
IronSkin6 offense-tradeoff failures and intermediate Diablo death stay retained.
Six areas/40waves pass author custody/reset/events/rewards/carry/prefix audit;
no production/save/material/currency/farm/core/merc change or broad/earlier-act replay.
Twelve scoped receipts/9pass, five configs removed/four created caches absent;
closure `p15-double-throw-act4-defense-artifacts-v1.json`. Next exact ZealIV
wave5deaths require whole-prefix/owned gear/aura/merc review; HolyFreeze is
already selected. Ready inputs58/accepted balance0/full-v1 gates remain open.
Reuse qualified controls; no external blocker or pending answer.

UI-only transition,2026-11-01 (BUG556): current source audit is
`bug556-source-audit-v1.json` (e80f7e5848fd671b225af4c547b1332228acc8eb0fb3b50306a925bee19c0773).
Only shared Tabs inactive text color differs across2091 inputs; engine/data/
campaign runtime unchanged. Preserve historical pins. Next native measurements
use `p15-current-source-run-v1.mjs` with matching current-audit readbacks. Do
not replay old battles merely to refresh a whole-tree UI hash. New launcher
syntax passes; first runtime assertions remain unexercised.


Quest preview follow-through,2026-11-01: BUG557 is locally fixed with34quest UI
checks/scoped types/lint/10ordinary-browser cases. Current source audit is now
`bug557-source-audit-v1.json` (0eba061fc55b3b948679f9d8005e4320a479486c253ca55b1546f3f3fa77cf58).
It authenticates the two exact UI-only transitions from BUG552 and reconstructs
the BUG556 fingerprint; engine/data unchanged. Future native work uses
`p15-current-source-run-v2.mjs` and matching current-audit readbacks. Syntax
passes; runtime unexercised. Old audits/launchers remain historical. Reuse
unaffected balance studies; return to remaining source/role/point/acquisition
gaps without extending resolved controls. Full-v1 acceptance stays open.


Capped spell candidate follow-through,2026-11-01: current-source launcher2 now
runs successfully against BUG557's manifest through four native preparations/
measurements; earlier runtime-unexercised notes are historical. The paid5wishstone
59-point BoneSpear fixture is legally earned, but all six pure spell pack controls
fail before Diablo. Higher Energy resolves mana, not overall effectiveness. Those
rotations excluded CE and are exploratory, not a new release criterion. Retain the
original corpse-focused route; do not invalidate its victories or extend rejected
controls/farm new levels. Resume required fourteen-build/role/intended-power gaps.
See `../balance/2026-11-01-bone-spell-candidate-audit.md`; catalog/accepted counts
unchanged. New priority reader5 and stat reader3 accept the current BUG557 audit;
reader3 validates pre-order allocation snapshots with the exact source combo.

Missing-area follow-through,2026-11-01: five native earned continuations now
close all22previously missing visits. Fourteen routes each cover29areas. Reuse
`p15-fourteen-route-area-coverage-supplement-v1.json` for latest post-campaign
successors while preserving historical roster and source revisions. All115waves
win; readback2 verifies actual authored4–6wave counts, native rewards/custody/
carry/XP/mercs/ordinals/exports. Reader1's failed five-wave assumption stays in
evidence; do not replay combat to fix a reader. No allocation/gear/reset/Claim/
farm/production change. These late exports do not replace pre-Claim or matched
level sources, so role catalog/accepted balance counts stay unchanged. See
`../balance/2026-11-01-fourteen-route-area-coverage.md` and closure
`p15-missing-area-artifacts-v1.json`. Two configs removed; five caches/pending
files absent;13terminal receipts/12pass/no owned descendants. Next use retained
intended-build/power histories for required balance and release gaps. Full-v1
active; root retains required packet and live claim until consumers finish.

Endgame defeat follow-through,2026-11-01: numeric review authenticates historical
one-point-hit solo draw versus current authored Attack growth/signatures. Native
diagnostic save22→current migration yields actual Ashen5hero defeat4.980s/no
income. Driver's omitted expected lastOnline change stops after settlement;
retain its failure and never replay that admission. Recovery from exact saved
successor uses native6, defeat3.320s/no income; full entry446HP367mana. Author
readback verifies complete state except endgame ordinal5→7 and actual clocks.
Final scoped types/lint pass;11terminal receipts/8pass/two configs removed/two
caches absent/no descendants. See `evidence/p18-current-native-defeat-retry.md`,
closure `p18-native-defeat-artifacts-v1.json`. Next use prepared exact migrated
`p18-current-weak-browser-input-v1.json` and its provenance in an isolated real
browser: public Settings import, defeat, Return/fresh Ashen entry, zero income
and durable Save-close-Continue. Service-store restore/export is not that proof.
No new weakening/seed search/content tuning or earlier-act replay is justified.
Retain genuine saves, both old browser draws and every current failed receipt.
Full-v1/role/pacing/holdout/final acceptance remain open; root retains packet/claim.


## Javelin Act IV owned survival100seed exploration — 2026-11-01

[Report](../balance/2026-11-01-javelin-act4-owned-survival.md). Previous goal turn was status-only/no implementation progress; this turn freezes an affordable owned defense recipe, diagnoses Ignite-amplified physical carry and qualifies earlier physical armor in100conditional areas/500waves. Prior81/100→100/100; all19failures recover/no regressions. Reuse2diagnostics and run98others once; preserve first late-armor1/2failure. Total new102areas/509waves. Trash100/100,median18.955s/p9523.100s; side-area Izual100/100,median34.977s. Rogue dies all100; minimum finalHP88/MP333. Not chapter-boss/population/holdout acceptance.

Source hero46/ordinal1024/Rogue31; all owned/eligible. Total3Hel/3FlawedSkulls/1Shael/3Sol/4FlawlessDiamonds/300rune-shards,11native transactions per preparation.100cohort preparations/1100requests and complete prepared saves,139685mana/469party carry boundaries/native awards pass; all102final exports/custody/currency/XP/clocks reconstructed. Current2091-input production source/data unchanged. Scoped types/launcher syntax pass; no earlier-act/other-build/campaign/browser/broad-suite replay, source-save edit, grant, farm, reset or publication.

Catalog29/index8/measurement queue10/next decision24 attach study; counts139original paired roles/6declared role alternatives/140unique observed roles/70boss reviews/accepted balance0remain. All original studies/failed policies stay. Next exact read-only action: same-profile retained award/custody and chronological material funding for three newly used merc pieces and11transaction recipe, then representative earned-power populations/disjoint evaluation. Do not replay any unchanged cohort. Wider identity/power/funding/retry/manual-idle/economy/fairness/30–50active-hour pacing/G0–G7/soak/review/owner requirements remain. Browser works/CI excluded/no pending answer/external blocker. Root retains required packet/active umbrella claim through consumers; exact task cleanup in `p15-javelin-act4-survival-artifacts-v1.json`.


## Javelin Act IV survival funding closed for one route — 2026-11-01

[Funding report](../balance/2026-11-01-javelin-act4-survival-funding.md) reuses the successful100seed survival study. Previous goal turn made native survival progress; this turn adds19checkpoint/18hash-pinned-edge chronological evidence: level1/zeroXP/ordinal0/empty economic root,309journal settlements,5405ordered economic records, no negative prefix balances and exact material/currency totals at every checkpoint. All17used source-gear payloads trace to awards/18paid socket transformations and continuous custody, including Coif/Bloodfist/61defense chain mail.

One11transaction preparation pays3Hel/3FlawedSkulls/1Shael/3Sol/4FlawlessDiamonds/300rune-shards; remaining2/85/21/14/5/12542162.100diagnostic forks are not100cumulative campaign purchases. No combat/test/build/browser/source-save/game-source change or unchanged cohort replay. Catalog30/index9/measurement queue11/next decision25 attach proof;139original paired roles/6declared role alternatives/140unique observed roles/70boss reviews/accepted balance0stay.

This closes historical single-route funding/used-gear custody, not acquisition reliability/current pacing/reset/population/holdout acceptance. Next exact task: freeze a property/eligibility-based independent fresh Javelin campaign policy from19retained transitions, including legal points/resets and per-act training/area budgets, before any bounded new-seed pilot. Do not grant the retained rare gear/levels/materials or replay favorable-source cohorts. Full14build/role/retry/manual-idle/economy/fairness/30–50active-hour pacing/G0–G7/soak/review/owner requirements remain. Browser works/CI excluded/no pending answer/external blocker. Root retains umbrella worktree/shared required packet; ownership/terminal evidence in `p15-javelin-act4-survival-funding-artifacts-v1.json`.

Funding metadata correction,2026-11-01: initial Amazon has her ordinary13attack training bow; empty backpack/stash/currency/material/quest/merc domains remain verified. Registrationv1's noInitialItems label was overbroad; v2 verifies exact starter against creation policy/JSON, preserving numerical5405event/17item proof and prior records without gameplay. Current catalog31/index10/queue12/next decision26 supersede intermediate30/9/11/25. Counts and next independent-earned-policy action unchanged.

## Executable property gear and fresh-clock transport — 2026-11-01

[Implementation report](../balance/2026-11-01-javelin-property-gear-and-fresh-clock.md). Previous goal turn was status-only/no progress. Added native bounded hero/merc armor selection by eligibility and mitigation properties, including legal Life/armor tradeoffs and current-resource projection. Nine meaningful checks pass; two retained inventory policies make eight total native equips, with373item payloads/complete exports/points/resets/merc attributes/economic domains independently read back by an author checker. No retained combat replay or game-source/data tuning.

Added optional validated campaign creation timestamp, retaining the historical default and recording the chosen value. Two fresh intro transports prove distinct native first-admission seeds; all five affected timestamp/clock checks, scoped types and explicit lint pass. No acquisition/population/holdout acceptance follows. Only campaign test registration differs among2091prior inputs: use `p15-campaign-harness-source-audit-v1.json` and launcher4 for next native work. Full hash2276471a962000e24f9e45a9553767743e563705191f13c4640702089a1309be; game/data unchanged. Launcher4 syntax and no-gameplay runtime validation pass.

Next decision27 supersedes26 for the next action; catalog31/index10/queue12 and counts139/6/140/70/accepted0stay. Next implement staged native point/reset control and freeze per-act training/adaptation budgets from19transitions, then integrate property gear/explicit clocks into a bounded fresh pilot. No CLI timestamp transport yet. No unchanged cohorts or other builds/acts to replay. All full-v1 identity/power/acquisition/holdout/retry/manual-idle/economy/pacing/G0–G7/soak/review/owner requirements remain active. Browser works/CI excluded/no pending question/external blocker. Root retains umbrella worktree/shared evidence; closure `p15-javelin-property-policy-artifacts-v1.json` records exact temporary cleanup and terminal receipts.


## Staged Javelin controller and first fresh pilot — 2026-11-01

[Report](../balance/2026-11-01-javelin-staged-controller-and-fresh-pilot.md).
Connected opt-in native staged growth/resets, property gear and five bounded
training boundaries; generic preparation/default profiles stay unchanged.
CLI creation timestamp now transported and recorded. Focused controller9 and
survival11 checks pass, along with affected economy/caster checks, scoped
strict types and explicit lint. No broad/other-build/later-act/cohort replay.

Frozen policy1/new timestamp1793690000000: one fresh Act I–II request stops
at level9/ordinal74 in Den farming:159waves/156victories/3defeats,1828005.892ms
combat,34.15s runner wall. Act II/new training stages not reached. Original
technical receipt also fails BUG559; native consumption preimages authenticate
legal starter salvage. Local fix plus retained readback reconciles174economic
records/14sinks/72620XP/1558earned/1438consumed items without replay. BUG560
fixes missing amulet traversal; plain retained amulet is not the defeat cause.

Current source hash e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a;
all production/data exact BUG558, supplemental campaign manifest binds new code.
Use current source authority3/standard native CLI; launcher4 is historical.
Next inspect exact level9/ordinal74 successor for bounded legal opening
preparation/recovery, preserving three losses and avoiding unchanged prefix
replay. Existing catalog31/index10/queue12 and accepted balance0 unchanged;
next decision28 supersedes27. Full-v1/14-build/role/pacing/economy/holdout/retry/
manual-idle/G0–G7/soak/review/owner requirements remain active. Browser works,
CI excluded, no pending question/external blocker. Root retains claimed
worktree/shared required packet; exact cleanup in controller artifacts1.


## Earned Javelin recovery reaches Act II — 2026-11-01

[Report](../balance/2026-11-01-javelin-earned-recovery-continuations.md).
Continued exact retained saves, without replaying the opening. Moor49wins earned
level12; bounded resume then earned13/14, beat Dark Wood and Andariel, and claimed
Sisters once. Current successor level15/ordinal151 stops in Act II Dry Hills:
first training stage8admissions/3wins/5defeats, three-consecutive-loss limit.
New route segment24admissions/108waves/6defeats; complete chain151/430/10.

Added validated main-route resume;48affected recovery/dispatch and9Javelin checks
pass, scoped strict types/explicit lint pass. BUG561 fractional-clock regression
failed before its one-nanosecond comparison fix; unchanged strict budgets.
Retained readback closes both audit errors with zero new combat; original receipt
and every failure stay. Native v2 binds source authority5; current readback/source
authority6 includes the audit fix. Production/data unchanged.

Next decision29: inspect/continue exact Act II save with declared bounded safer
native training and existing quest prefix. Opening acquisition integration still
unfinished. Catalog31/index10/queue12/accepted balance0 unchanged; wider full-v1
requirements active. Browser works, CI excluded, no pending question. Root keeps
active worktree and required shared evidence; cleanup/receipts are recorded in
`p15-javelin-recovery-continuations-artifacts-v1.json`.


## Safer Javelin acquisition and Act II continuation — 2026-11-01

[Report](../balance/2026-11-01-javelin-safer-acquisition-and-act2.md).
Integrated bounded post-Den Moor acquisition, moved first Act II training to
Dark Wood, and added verified cube/Staff-prefix continuation. Final affected
checks: 37 route + 11 Javelin + 21 dispatch; scoped types/lint pass. No broad
suite or unaffected route replay. Production/data unchanged; campaign authority8.

Two earned continuations add141admissions/703waves/one defeat: Dark Wood72wins
to20, Radament and Staff complete, Dry Hills67cumulative wins to24. Current
level24/ordinal292 stops after ArcaneW3defeat at291; audits pass. Full retained
chain292admissions/1133waves/11defeats. Not fresh-population/holdout/pacing
acceptance. Next correct the Act II gear policy's missing lightning/cold probes
and make one bounded retry from this exact successor, preserving every defeat.
Fresh lower-level acquisition reliability is still unproven.

Prior goal turn was status-only/no progress. Full-v1/14-build/five-act gates
remain active; accepted balance0, browser works, CI excluded, no question.
Closure `p15-javelin-safer-acquisition-artifacts-v1.json` archives two configs,
removes those exact temporary files and verifies two native caches absent.
Root retains claimed worktree/required shared evidence through consumers.


## Act II Javelin elemental gear and one retained retry — 2026-11-01

[Report](../balance/2026-11-01-javelin-act2-elemental-gear.md). Previous goal
turn was status-only/no progress. This turn fixes BUG562 in the maintained Act II
gear probes: lightning/cold protection now scores alongside physical/arcane.
Four native-selection checks fail before and pass after; all26affected checks,
scoped strict types and maintained-file lint pass. Production/data and all2091
original inputs unchanged; campaign authority9 binds the two changed files.

One bounded native Arcane retry adds1admission/3waves/1defeat,6960earnedXP,
24372.044combatms; six owned transfers raise lightning23→46/cold48→65. Still
failsW3 afterW2attrition; current level24/ordinal293, total293/1136/12defeats.
No new farm, quest action or earlier-route replay. Duriel/ActIII unreached.
Raw economy/quest audits pass; original scratch audit errors and preflight/
readback failures stay. Readback2 reuses retained stage1 and verifies the
already-earned stage has zero new admissions/time/XP, closing accounting with
zero new combat. The new resistance properties are not win-rate acceptance.

Next decision31: read-only owned mitigation comparison for225normal/337.5critical
physical hits and full-area fire/status attrition before another declared
adaptation/retry; no seed-only retries. Raw successor plus readback2 are the
paired authority. Accepted balance0; full14build/five-act acquisition/economy/
fairness/pacing/holdout/retry/manual-idle/G0–G7/soak/review/owner requirements
remain. Browser works/CI excluded/no pending question. Closure
`p15-javelin-act2-elemental-artifacts-v1.json` archives/removes two exact configs,
verifies four caches absent and records terminal checks; root retains active
worktree and required shared packet through consumers.


## Act II Javelin bursts, resource reserve and owned sockets — 2026-11-01

[Report](../balance/2026-11-01-javelin-act2-bursts-and-owned-sockets.md). Previous
goal turn made progress. Two pure owned-power comparisons show a maximum-mana
lock and unrepresentative physical probes; a level25eligibility forecast offers
no useful selection under original floors, so no farming was added. BUG563
adds validated optional mana reserve with original generic defaults, ActII150
reserve and normal/critical physical plus five elemental probes. Eight checks
fail before; all34affected checks/types/lint pass. First native retry clearsW3
but losesW4after entering with30Life; audits pass.

Next reuse bounded native gem transactions for the actual fielded companion,
retaining NovaPrayer behavior. New test fails before; all29affected socket/
dispatch checks/types/lint pass. One new native attempt pays1NormalDiamond+
12FlawedDiamonds,13exactinsertions/zero refusals, MagicResist42. W3ends431Life;
W4killsunder50pointphysical-resistance curse (normal hits3→104, elite237).
All economy/quest/training/recovery/export/source audits pass. Two new native
admissions/eight waves/two defeats/24460XP/79944.396combatms, no farm or quest
replay. Current level24/ordinal295; retained total295admissions/1144waves/14
defeats. Summoner/Duriel/ActIII unreached; no balance acceptance.

Production/data/all2091inputs unchanged; campaign authority10then11. Next
decision32: inspect authored curse/elite rules and read-only owned shield/
physical-protection tradeoffs with the actual skill damage model before another
adaptation. No seed-only retry. Accepted0; full14build/five-act acquisition/
economy/fairness/pacing/holdout/retry/manual-idle/G0–G7/soak/review/owner
requirements remain. Browser works/CI excluded/no pending question. Closure
`p15-javelin-act2-burst-sockets-artifacts-v1.json` removes two archived configs,
verifies four caches absent and records terminal checks; root retains worktree
and required shared packet until full-v1 consumers finish.


## Earned Javelin Act II completion — 2026-11-02

[Report](../balance/2026-11-02-javelin-act2-shield-and-freeze.md). Prior goal
turn was status-only/no progress. Pure owned comparison confirms a shield
Defense163→185 tradeoff with fixed rank20LightningStrike1505–1535base, retaining
AttackSpeed171. BUG564 adds explicit hero shield/minimumAttack opt-in only at
ActIIlevels24–27; authored50pointcurse enters physical probes. Three regressions
and native phase dispatch fail before;40affected checks/types/explicitlint pass.
One native attempt still losesW4at3480ms, normal cursedhits104→82,311entryLife;
audits pass. Preserve ordinal296 successor and fifteenth defeat.

Next native unlockedHolyFreeze at authoredlevel12 retains originalRogue/gear
and uses owned inventory. Three checks fail before;37affected Javelin/dispatch
checks/types/explicitlint pass. Maintained fresh runner wires only Arcane route
entry. Exact successor continuation wins12waves/twoareas, Summoner/Duriel and
five native questactions, earning57850XP/175704.484combatms; all audits pass.
HolyFreeze dies ArcaneW3/TombW2; later waves/bosses have no living aura source,
so no causal aura or population acceptance. Both new continuations total
3admissions/16waves/1defeat/71190XP/229756.791combatms, pay3FlawedDiamonds;
no newfarm/reset/questreplay/grant/seedoverride. Current level24/ordinal298,
chain298admissions/1160waves/15defeats; ActI–IIcomplete, ActIIIunplayed.

Production/data/all2091inputs unchanged; campaign authorities12then13. Next
decision33 continues exact ActIII successor with21retainedActIIactions and
already-declared bounded preparation, without earlier replay. Acceptedbalance0;
full14build/five-act acquisition/economy/fairness/pacing/holdout/retry/manual-idle/
G0–G7/soak/review/owner requirements remain. Browser works/CI excluded/no
pending question. Closure `p15-javelin-act2-shield-and-freeze-artifacts-v1.json`
archives/removes two configs, verifies three caches absent and task drivers
terminal. Root retains active worktree and required shared evidence.


## Earned Javelin reaches Flayer completion — 2026-11-02

[Report](../balance/2026-11-02-javelin-act3-preparation-and-resume.md). Previous
goal turn was status-only/no progress. Earned ActIII first clears Marsh/Brain,
then loses FlayerW4. BUG565 adds authenticated partial ActIII resume with shared
suffix; BUG566 moves existing bounded28preparation before Flayer and represents
observed379/568.5physical plus allfive elements. Fifteen regressions fail before;
106affected checks, scoped types and corrected explicitlint pass. Production/data
and all2091originalinputs unchanged; campaign authority14.

Exact ordinal300 continuation trains56admissions/53wins/3defeats to28, then wins
all6Flayer waves and recoversHeart once. BazaarW4 loses at4000ms after219/498Life
entry and prior physicalattrition; champions39/Attack416. All audits pass. New
segment58admissions/290waves/4defeats/1231300XP/2303351.044combatms;44.735swall.
Together the two new ActIIIsegments add60admissions/299waves/5defeats. Current
level28/ordinal358, chain358/1459/20defeats; Brain+Heartowned, ActIIIunfinished.

Read-only owned comparison finds no hero change under150ManaReserve; no reserve
patch or seed-only retry. First diagnostic omitted onlineclock and failed only
its timestamp preflight; corrected result and originalfailure both retained.
Next decision34 inspects authored level35/39 Bazaar requirements, owned gear
eligibility and physicalattrition before adapting exact358successor, preserving
21ActII+4ActIIIactions. Acceptedbalance0; full14build/five-act acquisition,
economy/fairness/pacing/holdout/retry/manual-idle/G0–G7/soak/review/owner gates
remain. Browser works/CI excluded/no pending question. Root retains active
worktree and required shared packet. Exact artifact cleanup/check receipts are
in `p15-javelin-act3-preparation-artifacts-v1.json`.


## Earned Javelin Act III completion — 2026-11-02

[Report](../balance/2026-11-02-javelin-act3-level-gates-and-support.md).
BUG567 splits existing later800/28.8M preparation across35/40/46 power gates,
with cleared-farm guards and separate stage loss bounds. Exact358 earns35 in172
Marsh farms then loses BazaarW4; successor531. BUG568 spends the seven earned
support points and pays native25/15Mana bodies; BazaarW4 still loses, successor532.
BUG569 adds explicit paid hero-shield-only owned Diamond preparation, retaining
older socket policies. One ownedFlawlessDiamond raises physical12→20.

Exact532 clears Bazaar, trains160 Flayer victories to40 within200/9M bounds,
then clears Council/Mephisto and completes seven remaining quest actions.
New163admissions/978waves/zero defeats/4228070XP/7141243.793combatms/160.693swall;
all economy/training/quest/recovery/export/source audits pass. Current level40/
ordinal695, total695admissions/3303waves/23defeats; ActsI–IIIcomplete and ActIV
unlocked. Full21ActII+11ActIII actions/settlements and every prior failure remain.
No causal or population acceptance is claimed.

Focused red→green: level gates3→18passing, support2→19passing, sockets2→10passing;
scoped strict types/explicitlint pass. Earlier suites/acts/builds are not rerun.
Production/data/all2091originalinputs unchanged; campaign authorities15–17.
Next decision35 continues exact695 into ActIV with already-declared Bazaar-to46
preparation, retaining all prefixes. Acceptedbalance0; full14build/five-act
acquisition/economy/fairness/pacing/holdout/retry/manual-idle/G0–G7/soak/review/
owner requirements remain. Browser works/CI excluded/no pending question.
Exact two-config archival/removal, three-cache absence and terminal processes
are recorded in `p15-javelin-act3-level-support-shield-artifacts-v1.json`.
Root retains active worktree and required shared packet for full-v1 consumers.


## Earned Javelin Act IV completion — 2026-11-02

[Report](../balance/2026-11-02-javelin-earned-act4.md). Previous goal turn made
concrete progress (Act III completion). Exact695 uses declared cleared-Bazaar
preparation:246 victories to46,10427217.375combatms within400/12.6M bounds.
Izual/Hellforge/Diablo and13 questactions complete natively; Act V unlocks.
New249admissions/1494waves/zero defeats/7176190XP/10766022.134combatms/373.245swall.
Current46/ordinal944; chain944admissions/4797waves/23defeats;45 retained actions.

BUG570: the frozen external driver's staged audit queries hardcodedActIII for
an ActIV entry, causing two raw audit errors. Economy/quests/source/export pass.
Read-only paired readback uses actual entryAct4 and existing pure training/
recovery auditors, checks native complete state/export and rejects three
corrupt-evidence controls; zero newadmissions/rewards. Raw errors remain.
All2091originalinputs/maintained manifest still authority17; no source change,
broad test, earlier route/quest/build/browser/CI replay. Native19301/readback59252
terminal exit0; both exact caches absent, no temporary configs created.

Decision36 requires raw+readback together and continues exact944 into Act V
main quests and existing boundedFoothills-to55 stage. Full balance/pacing/
acquisition/economy/fairness/holdout/retry/manual-idle/G0–G7/soak/review/owner
acceptance remains open. Browser works/CI excluded/no pending question.
Root retains active worktree/shared evidence; cleanup pins in
`p15-javelin-act4-earned-artifacts-v1.json`.


## Earned Javelin Act V recording limit and duplicate preparation — 2026-11-02

[Report](../balance/2026-11-02-javelin-act5-recording-and-preparation.md).
Prior goal turn made progress (ActIV complete, ActV started). Existing native
session31508 completes251admissions/1506waves, all victories, then journalcap
stops a gear diagnostic at52/ordinal1195. All audits pass; technical failure
and all income remain. Chain1195admissions/6303waves/23defeats;58 retained actions.
Siege/Rescue claimed, Anya thawed; Crystalline/Ancients/Baal still unplayed.
Original55 stage has249farms/26868865.951combatms spent; only351 admissions/
16331134.049combatms remain. Budget receipt pins original whole-act limits too.

Measured partial pilot throughActIV:1047.315snative/172942149locatedbytes;
linear1400campaign scenario407.3h/225.5GiB beforeActV, not a population forecast.
No large batch launched. BUG571 profiles three no-combat preparations, then
adds explicit defaultfalse entry-owned mode; native Javelin runner opts in,
omitting redundant post-farm gear selection while keeping final equip.
New regression red1/green20; final style assertion case1/types/explicitlint pass.
Three paired samples retain identical saves:median1060.086→525.114ms and
309254→154727bytes, ~50% reduction in this preparation work only. No campaign
battle/reward replay or broader/earlieract/build/browser/CI test. Production/
data/all2091inputs unchanged; authority18 binds helper/runner/test.

Decision37 requires authenticated partial main-quest/training resume from exact
1195 with original58actions/249farms and cumulative time/admission/loss bounds;
no repeated Starts/Claims/potion/thaw or replenished budgets. Acceptedbalance0;
full14build acquisition/economy/fairness/pacing/holdout/retry/manual-idle/G0–G7/
soak/review/owner requirements remain. Browser works/CI excluded/no question.
Terminal native/profile/benchmark/check sessions and nine disposable sample
journals/one config archival+removal/cache absence are recorded in
`p15-javelin-act5-preparation-artifacts-v1.json`. Root retains active worktree,
required raw partial campaign/CPU/profile evidence and shared packet for full-v1.


## First-clear and starter recruitment wishes — 2026-11-02

[Report](../balance/2026-11-02-early-recruitment-wishes.md),
[decision](decisions/P15-early-recruitment-budget-v1.md). Previous goal turn was
a status-only report, classified no progress. This continuation implements
BUG578/579: authored five-wish ordinary-area first clear per frozen difficulty
ledger, future numeric quest wishes to the canonical spendable wallet, and
explicit Den/Blood Raven/Andariel bonuses 15/15/25. Existing reward fields, old
wallet keys, clear flags, claims and save shape remain intact; no compensation.

Three intended assertions fail before. Final 160 distinct affected assertions
across eleven suites pass, covering native final/intermediate/repeat/loaded
clear/profile/UI selection/defeat/safe sum/rollback; canonical payment and
quest rollback; actual starter claims through save/import/hydration; Countess
and both endgame exclusions. Scoped strict types and explicit lint pass.
Raw failures retained; filtered tests are not counted as passes. Exact prior
reward assertions retain all fields and add only the authored currency.
No snapshot regeneration, completed campaign/earlier-act route or broad replay.

Authority23 records 13 existing source/test changes + one new fixture, 2,097
inputs and an unchanged campaign helper manifest. The retained pilot has 23
Normal clears and claimed Den/Andariel, without Blood Raven: prospective
non-kill addition 115 + 40 = 155, never paid to its old save. All three starter
quests plus six Act I clears guarantee 85, not a bulk pull. First single is
affordable by a qualifying Den claim; no pilot affordability timestamp claimed.

Decision42 continues the full scope: later main/side/specialized quest budgets,
actual L70 Hell faucet, inventory pressure, 14-build chronological acquisition/
fairness/holdouts, retry/manual-idle, calibrated 30–50 active hours, integrated
G0–G7, soak, review and later owner playtest. Accepted balance cells remain zero.
Browser works; CI excluded; no pending question or external blocker. All task
consumers are terminal, exact scoped config archived/removed, task cache absent;
bug578-579-artifacts-v1.json records cleanup. Root retains W and the shared
packet for full-v1/review consumers and owns eventual artifact cleanup.


## Shared main-quest wish budget and claim integrity — 2026-11-02

[Report](../balance/2026-11-02-main-quest-wishes.md),
[contract](decisions/P15-main-quest-wish-budget-v1.md). Previous goal turn made
concrete progress (first-clear/starter grants); this continuation adds the 19
shared main bonuses, totaling 360 new / 415 authored main wishes across 22/24
main quests. Exact inverse reproduces every old main field. Cain/Malus
specialized main integration and all side/special/repeatable budgets remain
required; BUG581 is partial, not closed. No old claim/save is compensated.

BUG580 unifies preflight/publication currency keys, accepting opaque plural
MAX_SAFE_INTEGER beside a valid canonical grant. BUG582 retains the original
failed overflow assertion and validates every participating current currency
at inventory and claimed boundaries; unsafe single/claimed-observer grants
roll back and retry, valid same-wallet observer additions remain. BUG583
localizes the quest wish label through the existing gacha string.

Two core/data and two bilingual assertions fail before correction. Incremental
affected checks cover 572 distinct passing assertions across 12 suites, excluding
filtered cases. Final core/family cases run after the transaction correction.
Scoped strict types/lint pass; the scoped UI config is corrected to include
the existing matcher setup. Browser baseline 1/after 4 cases use ordinary fresh
creation/navigation in zh-CN/en at 360×640 and 1280×800: no document overflow,
page exceptions or HTTP errors. Screenshots inspected. No bridge, injected
state, import, battle or claim, and no completed campaign/broad test replay.

Authority24: 2,097 inputs, twelve deliberate transitions, unchanged kill engine
and campaign helper manifest. Retained pilot's 17 claimed main rows would
supply 340 wishes plus 115 from 23 clear flags, totaling 455 prospectively, never
paid to its old wallet or treated as earned replacement/pacing acceptance.

Decision43 keeps the full objective active: remaining main/side/specialized
quest budgets and finite/repeatable policy; actual L70 Hell faucet; protected
inventory pressure; 14-build chronological acquisition/fairness/holdouts, retry/
manual-idle, calibrated 30–50 active hours, integrated G0–G7, soak, review and
later owner playtest. Accepted balance 0. Browser works/CI excluded/no pending
question or external blocker. All consumers terminal; exact scoped config
archived/removed, three exact task caches absent. bug580-583-artifacts-v1.json
pins cleanup and retained evidence. Root owns W/shared packet through full-v1
and review consumers and is responsible for eventual cleanup.


## Cain and Malus finite quest wishes — 2026-11-02

[Report](../balance/2026-11-02-cain-malus-wishes.md),
[contract](decisions/P15-specialized-act1-wishes-v1.md). Previous goal turn was
status-only, classified no progress. This continuation implements BUG584:
Cain/Malus main20/15 and finite Talk/Present side10/10. All24 main rows now
have450 wishes; two of22 finite side rows have20. Remaining20 finite side rows,
other specialized publishers and repeatable bounty policy remain open.
BUG581's missing-main-row portion is closed; full side economy is not accepted.

A shared finite-currency journal retains the existing +1 gem source contract
and attributes ordinary additions before synchronous observers. Native
Cain/Malus publishers settle wishes before claimed-last, with XP, merc shares,
services, physical proof and full scoped rollback. Independent additions,
absent/zero wallet presence, held debit/quest guards and explicit restoration
failures are verified. No saved state shape or historical grant changes.

Eight original assertions fail. Exact old bundle expectations are amended only
for authored currency; a new guard assertion's initial label is corrected to
the established claim-in-progress contract.614 distinct cases pass across11
affected suites incrementally; final86 core cases run after source corrections.
Scoped strict types/lint pass. Exact JSON inverse preserves all previous fields.
No completed campaign, prior-act combat/build route, broad suite, browser
campaign, install, CI, commit or publication is run.

Authority25 records2100 inputs and13 deliberate source/test/data transitions;
kill engine and campaign helper manifest remain unchanged. Decision44 retains
Javelin1314/five-act completion and all14-build evidence with accepted balance0.
The retained campaign skipped these four claims; prospective non-kill455 and
historical wallet remain unchanged. No new earned admissions/reward grants.
Full L70 Hell/inventory pressure/acquisition/fairness/holdouts/retry/manual-idle/
30–50-active-hour calibration/G0–G7/soak/review/later owner playtest remain.
Browser works; CI excluded; no pending question or external blocker.

All task command sessions are terminal. Exact type config archived/removed,
exact source-audit cache absent. bug584-artifacts-v1.json pins retained original
failures, baselines, checks and drivers in the external packet. Root retains
W/shared evidence for full-v1/review consumers and owns eventual cleanup.


## Enlistment and Act IV finite side wishes — 2026-11-02

[Report](../balance/2026-11-02-enlistment-side-wishes.md),
[contract](decisions/P15-finite-side-wishes-v1.md). Previous goal turn made
concrete Cain/Malus progress. This continuation implements BUG585: six10-wish
side bonuses for Kashya/Greiz/Asheara/Qual-Kehk, Tyrael and Halbu. Eight of22
finite side rows now total80; main450 remains exact. Planned finite side220 /
all finite670 require the other14 publishers. Repeatable regional bounties
retain gem-shards and grant0 direct wishes, including first claim; the policy
is explicit in drop-tables and the side budget. No old claims are paid.

Mercenary wishes join the source-owned ensure-owned Claim transaction before
claimed-last; Enlist itself grants no wishes. Actual actor investment, dismissal
replacement, fielding and proof remain. Tyrael/Halbu keep their two skill points
and socket-armor charge under the existing generic transaction. Exact JSON
inverse preserves every old side field; main and bounty data remain unchanged.

Twelve original assertions fail. Selected13 author/native/policy cases pass.
Review finds BUG586: source verification preceded the new currency rollback
boundary. Initial harness targets the wrong method; correcting it to direct map
setState reproduces the genuine late claim-flag corruption in both publishers.
Currency now restores first, then existing scoped source/physical participants
and final source checks, then wallet verification. Every rollback is attempted;
original failed byte comparisons pass without a compensating write loop.

727 distinct cases pass incrementally across9 affected suites, excluding all
filtered/skipped cases. Final99 claim cases rerun after the order correction.
Scoped strict types/lint pass. No completed combat/campaign, prior-act build
route, browser campaign, broad full-suite, install, CI, commit or publication.
Authority26 records2101 inputs and10 deliberate transitions; campaign helper
manifest and kill engine unchanged. The retained campaign skipped these six
claims, so prospective non-kill455 and its historical wallet remain unchanged.
Decision45 keeps accepted balance0 and every full-v1 requirement active.

Next: fourteen finite side publishers, including source-owned gem-plus-wish
settlement for Gheed/Fara; then actual L70 Hell income/inventory pressure,
fourteen-build chronological acquisition/fairness/holdouts, retry/manual-idle,
30–50-active-hour calibration, G0–G7, soak, review and later owner playtest.
Browser works; CI excluded; no pending question or external blocker. All task
processes terminal; exact type config archived/removed and exact audit cache
absent. bug585-586-artifacts-v1.json pins retained baselines, raw failures, checks
and drivers. Root owns W/shared evidence through full-v1/review and eventual
cleanup after all consumers finish.


## Counted-source and Fara finite wishes — 2026-11-02

[Report](../balance/2026-11-02-counted-fara-wishes.md),
[policy](decisions/P15-finite-side-wishes-v1.md). Previous goal turn was a
status-only report: no progress. The authority26 checkpoint was revalidated;
this turn implements BUG587, adding six10-wish bonuses for Gheed, Fara,
Alkor, Jade, Jamella and Malah. Main450 remains; side rewards now total140
across14/22 finite quests. Planned side220 / all finite670 require8 remaining
publishers. Repeatable bounties retain their catalyst and pay0 direct wishes.

The shared ephemeral journal permits distinct currencies for one finite source
under the existing quest lease, retains per-key independent additions/presence,
excludes other sources and preserves the exact+1 gem facade. Both Gheed/Fara
owners reserve before publication; wishes settle before claimed-last in each
native publisher. All original XP/mercenary/stat/material/Vitality/source proof
and Fara's no-XP behavior remain. Restore currencies before final source/actor
checks, verify both last, attempt every restoration and release all owners.
Unknown overwrites stay untouched and cause explicit restoration failure.

15 original assertions fail.687 distinct incremental cases across18 affected
suites pass, excluding skipped/filtered cases. Final112 Claim cases and22
journal cases pass; four affected bilingual UI-to-crafting cases pass after
correcting the new test's label namespace and retaining wishes in its expected
post-fusion wallet. Scoped strict types and explicit lint pass. Exact inverse
of only six added fields reproduces the previous side document byte-for-byte;
main and bounty authoring remain unchanged. No completed campaign, prior-act
combat/build route, broad full suite, install, CI, commit or publication runs.

Authority27 pins2101 inputs and17 deliberate transitions. Engine and campaign
helper manifest remain unchanged. The retained campaign has no side claims:
prospective non-kill455 and historical wallet98607 remain unchanged, with no
new earned admissions or grants. Decision46 preserves all five-act/Javelin1314
and14-build/29-area evidence, accepted balance0 and the complete v1 objective.

Next: Cow rumor, Lost Caravan, Drognan, Summoner's Secret, Ormus, Larzuk,
Anya and Nihlathak; then actual L70 Hell income, protected inventory pressure,
chronological14-build acquisition/fairness/independent holdouts, defeat/retry,
manual/idle, calibrated30–50 active hours, integrated G0–G7, soak, review and
later owner playtest. Browser works; CI excluded; no pending question or
external blocker. All task processes terminal; exact type config and audit
cache absent. bug587-artifacts-v1.json retains baseline, raw failures, checks,
test index and audit drivers. Root owns W/shared packet through full-v1/review
consumers and eventual cleanup after they finish. No source edits after audit.


## Final eight finite side wish rewards — 2026-11-02

[Report](../balance/2026-11-02-remaining-finite-side-wishes.md),
[policy](decisions/P15-finite-side-wishes-v1.md). Previous goal turn polled
terminal validation handles and identified four concrete failing assertions;
this continuation completes BUG588 and resolves all affected expectations.
Cow, Lost Caravan, Drognan, Summoner's Secret, Ormus, Larzuk, Anya and Nihlathak
now settle10 wishes each inside their native Claim. Side220 across22/22 plus
unchanged main450 across24/24 yields670 authored finite quest wishes.
Repeatable bounties retain one gem-shard and grant0 direct wishes, including
first claim. Existing claims receive no compensation.

The shared ephemeral wish participant captures the complete authored quest and
reserves before native rewards. Wishes publish before claimed-last, restore
before original source/physical/actor participants and verify last. Independent
additions and absent/zero keys remain; unknown overwrites remain untouched and
throw an explicit restoration error. All original XP, mercenary XP, retained
tools, unique items, skill points, resistances, services and catalog/source
semantics remain. Anya's engine allowlist accepts the authored fourth field;
its six-resistance effect is unchanged. No combat formula or persistence change.

16 original failures are retained.478 distinct incremental cases across25
affected suites pass, excluding skipped/filtered cases and prior-slice counts.
Core and UI consumer reruns resolve stale reward/wallet expectations; the final
two recovery corrections rerun only those two cases. Scoped strict types and
explicit changed-file lint pass. Exact inverse reproduces the preceding side
JSON byte-for-byte; main hash and five bounty rewards remain unchanged.
No completed campaign, prior-act/build route, broad full suite, install, CI,
commit, push or publication is run for this slice.

Authority28 pins2102 inputs and37 deliberate transitions. Campaign helpers
remain unchanged. The retained campaign has no side claims: prospective
non-kill455 and its historical wallet98607 remain unchanged. Decision47 retains
completed Javelin1314, all14-build/29-area evidence, accepted balance0 and the
full v1 objective. Next: source-backed L70 Hell income and protected inventory
pressure/performance; chronological build acquisition/funding/fairness and
independent holdouts; defeat/retry and manual/idle; calibrated30–50 active hours;
integratedG0–G7, soak, review, then owner playtest. Browser works; CI excluded;
no pending question or external blocker.

All task processes are terminal; exact temporary type config and audit cache
are removed. bug588-artifacts-v1.json records retained baselines, raw failures,
checks, budget and audit drivers. Root owns W/shared packet through full-v1 and
review consumers and their eventual cleanup. No source edits after authority28.


## Protected inventory preparation cost — 2026-11-02

[Report](../balance/2026-11-02-protected-inventory-preparation.md).
Previous goal turn completed BUG588/all46 finite quest wish bundles and saved
authority28/decision47. This continuation profiles the retained earned
L55/ordinal1314 state with6545 backpack/499 stash items. It does not replay
combat, completed acts/build routes or rewards. Initial three native samples
measure1657.501ms median preparation and703.459ms nested recorder time.
A completed-object serialization memo preserves bytes but regresses to1767.226ms;
all three codec/journal files are restored exactly and raw evidence retained.

BUG589 clones only slot-compatible candidates and exact comparison inputs;
decision records remain detached. Full refusal guards are captured before
recording only when an upgrade can be attempted. Every actual refusal still
checks all stores. Mercenary selection also skips unused hero quest projection.
No game source/data, gear/sink/selection rules, observation format or cache change.
Two focused regressions reproduce11 eager store observations and9 unused hero
preparations. Corrected fixture name and frozen snapshot time are recorded as
fixture issues rather than product failures.25 distinct affected checks across
two gear suites, scoped strict types and explicit lint pass; filtered cases and
abandoned-experiment tests are excluded. No completed campaign or unaffected
suite is run.

Three samples per mode in one process, fixed interleaving and original baseline
modules reduce median1611.715→1380.953ms (14.318%). Every trial preserves all21
journal records,17,216,336 raw/691,124 compressed bytes and the complete earned
successor observation hash. Six final duplicate journals plus six earlier paired
ones are verified against retained canonical bytes, closed and removed. Shared
raw baseline/rejected-experiment profiles/journals remain required evidence.

Authority29 retains all2102 game/provenance inputs unchanged from28 and records
four supplemental campaign transitions. Decision48 keeps completed Javelin1314,
14-build/29-area evidence, wallet98607, prospective non-kill455, finite wishes670
and accepted balance0. Next freeze a bounded earned Hell/training policy for
actual L70 Hell income. Protected inventory growth, recorder/storage cost and
browser performance remain; do not silently change sinks. Chronological build
acquisition/funding/fairness/holdouts, defeat/retry/manual-idle, calibrated30–50
active hours, integratedG0–G7, soak, review and later owner playtest stay open.
Browser works; CI excluded; no pending question or external blocker.

All task processes are terminal. Exact repository type config and all task
benchmark/audit caches are absent; scoped configs are retained as check evidence.
Root owns W/shared packet through full-v1/review consumers and eventual cleanup.
bug589-artifacts-v1.json pins raw failures, rejected experiment, final checks,
baselines and drivers. No source/helper edits after authority29.


### Earned Hell continuation — live checkpoint, 2026-11-02

Authority29/decision49 retain audited Hell24 after132new native pilot victories,
1,480,490XP, exact source/save/economy/quest histories and no Normal replay.
[Progress report](../balance/2026-11-02-earned-hell-progression.md).
Actual L55 Foothills4kill wishes over32.818combatminutes has high coin variance;
read-only native reward replay gives conditional27.26wishes/SD23.936, not an
accepted L70 result.

The sole frozen training process is live exec session10345, stem
`p15-earned-hell-level70-v1`. Last observed L64/nextHell477/2265training waves
is not yet a validated exported successor. Poll the same handle; do not restart
on missing output or modify source/helpers/tests during its freeze. Whole
limits1100admissions/16combat hours/1800wallseconds/190MiB journal remain fixed.
On terminal, audit the genuine stopped successor and retain failures before any
new declared continuation or actual L70 HellActV income measurement.

BUG590 has a constructed pre-debit reproduction and pending focused test;
apply its retention-only fix after this freeze, preserving actual equip guards.
Exact live/pending-work references and cleanup ownership are in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-earned-hell-live-handoff-v1.json`.
All broader inventory/browser,14build chronological funding/fairness/holdout,
retry/manual-idle,calibrated30–50active hours,G0–G7/soak/review/laterplaytest remain
open. Root retains the worktree and packet; full-v1 goal stays active.


## Earned70, retention repair and first actual Hell income failure — 2026-11-02

Previous goal turn was a verified wait: exec10345 was confirmed live during the
status report. This turn makes authoritative progress. Training part1 reaches
its frozen190MiB cap at earned68/Hell796:772admissions/3860wins/38,324,940XP.
Native and separate full-save/custody/economy/journal readbacks pass, including
one committed unjournaled47normal-item/188scrap sink. Preserve the recorder
failure and its exact successor; no replay.

BUG590 is fixed only in caster diagnostic retention ranking. The new native
salvage/equip-gate regression is RED before; six distinct affected GREEN cases
pass, with final scoped strict types and explicit two-file lint. Nineteen
filtered cases are excluded. Ignored lint, a numeric-template fixture issue and
an early authority/check-file ordering failure are retained and corrected.
Authority30 records two supplemental helper/test transitions; all2102 game/
provenance inputs, source/data hashes and the Javelin normal-only sink stay exact.

An explicit80MiB recorder part continues only the validated68 export/cursor,
carrying original admission/combat/wall consumption. It reaches70/Hell913 after
117new admissions/585wins/5,814,900XP. Both parts total889admissions/4445wins,
44,139,840XP,10.255simulated combat hours and26.083actual minutes, all within
original gameplay/time limits. Independent exact export/ownership/economy/
context/history/clock readback passes. No Normal act/build route is repeated.

The actual70 HellFoothills income sample then consumes ordinal913, wins3waves
and loses4 after its merc dies in3. All income is retained:34,940XP/25items;
zero wishes,58,198.072combatms including defeat. Native and independent audits
pass, but the48-admission income plan is incomplete. Latest earned successor is
level70/XP64519/Normal1314/Hell914, not the pre-defeat checkpoint. No income-rate
acceptance or seed-only retry. Report: docs/balance/2026-11-02-earned-hell-progression.md.

One fixed owned-defense preparation, no combat, lowers explicit surplus Mana
floors to500hero/150merc. Hero physical38→60/armor508→592; merc cold16→70;
attack/speed stay exact. Nine native equips preserve complete earned ownership,
XP, materials/currencies and actor progression. The first audit incorrectly
froze the native legacy equipment mirror; retained failure is corrected to
check canonical custody plus unchanged actor power/history. Both copies are
disposed, so no prepared successor is promoted. The merc35/hero70 exponential
versus polynomial XP divergence is a recorded risk, not a confirmed sole cause
or authorized change to D12's explicit75percent award share.

Next: freeze earned income continuation from914 using the audited owned-defense
policy, carrying original sample consumption and retaining its defeat in combined
throughput. Stop on next nonwin; do not restore913 or count only victorious time.
Actual L70 rate, protected inventory/browser/storage, chronological14build
acquisition/funding/fairness/independent holdouts, defeat/retry/manual-idle,
calibrated30–50active hours,G0–G7/soak/independent review/later owner playtest
remain. Accepted balance0; full-v1 goal active. Browser works; CI excluded;
no pending question or external blocker.

All task processes are terminal and exact Vite caches are verified absent.
No repo temporary config or disposable build is left. Required raw inputs,
failures, policies, drivers, reports, readbacks and type/lint evidence remain
in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Root retains this packet and the active human2 worktree for umbrella review
consumers and owns eventual cleanup. Current authority30/decision50 and the
p15-earned-hell70-progress-artifacts-v1.json index are the handoff entry points.


### 2026-11-02 — Paid recruits start at the hero level

The previous status turn completed pending scoped types/browser checks and
exposed their actual limits; this turn closes BUG600 locally. The paid factory
now follows gacha-spec L1 baseline plus hero-level natural growth. Existing
actors/duplicates and deterministic hires remain unchanged.200distinct affected
cases, scoped strict types, explicit lint and engine purity pass. Desktop/en
and mobile/zh paid/save/reload checks pass; both actual outcomes are duplicates,
so new-recruit rendering is not claimed. Full types was stopped, not passed.
[Evidence](evidence/2026-11-02-paid-recruit-levels.md). Authority51 has2141inputs;
data unchanged. Exact owned typeinfo/Vite cache absent; report/runners/logs/PNGs
retained by root through umbrella review. Historical earned successor and
canonical70 remain exact. Next bounded earned continuation tests a genuinely
new correctly levelled recruit, without changing saved actors. Full-v1 active,
accepted balance0; remaining party/economy/fairness/performance/pacing/integrated
gates stay open. No owner question or external blocker; browser works/CI excluded.


### 2026-11-02 — Genuine levelled recruit trial and browser confirmation

Previous goal turn completed the pending browser handle11435(exit0), adding
new-recruit rendering/field/save/reload evidence. Close that earned increment:
11Hell admissions/66hero wins,70new/70spent wishes preserve carried34and
historical98,758; actual new SR Cold Arrow Rogue starts71and trials1017–1019.
Present15/18waves,alive12/dead3,121,197direct damage and163,574earned mercXP;
restore veteran afterward. Native exact decode/paid replay and independent full
journal readback pass;84deltas conserve state. Desktop/en and mobile/zh exact
whole-save roundtrips/display/fielding pass,zero errors/overflow. No campaign
replay,grants,forced identity or canonical overwrite. Authority51/data unchanged.
[Report](../balance/2026-11-02-earned-levelled-party.md). All consumers terminal;
exact owned typeinfo/caches absent; required evidence/root worktree retained
through umbrella review. Next measured large-save performance repair. Full-v1
active/accepted balance0; broader party/economy,fairness/holdout,retry/manual-idle,
30–50active hours,G0–G7/soak/review/laterplaytest remain; no external blocker.


### 2026-11-02 — Remove redundant live-export serialization

Previous goal turn was status-only/no progress. Apply measured two-line root
fix in persistence.ts: one existing stringifySave call replaces compact
stringify/parse/pretty stringify. Nine-pair warm Node screening on genuine8235-item
state improves92.493→57.208ms median with exact output; actual candidate store
probe passes.87affected persistence tests, scoped strict types/lint pass. Desktop/en
and mobile/zh ordinary byte-exact export/Save/reload pass, zero errors/overflow.
No purchases/combat, campaign or unrelated suite rerun. Initial probe's incorrect
native-Map fixture assertion failed before timing and is retained; corrected probes
record actual zero Maps and separate nested Map/Set equality. Authority52 has2141
inputs, only persistence.ts differs from51; authored data and earned checkpoints
remain exact. [Report](../balance/2026-11-02-single-pass-save-export.md). All consumers
terminal; exact owned caches/typeinfo absent; required packet/worktree retained
by root through umbrella review. BUG592/performance budgets remain open; no
production browser performance claim. Full-v1 active/accepted balance0. Next
representative earned party/economy/income acceptance using retained successor;
14-build fairness/holdouts, retry/manual-idle,30–50active-hour calibration and
integratedG0–G7/soak/independent review/later owner playtest remain. No external
blocker or pending question; browser works and CI excluded.


### 2026-11-02 — Earned SSR acquisition and three-admission trial

Authority52 unchanged: Hell1020–1042 yields138hero victories/0.774579combat hours,
hero71→72,81new wishes/90spent using carried34; historical98,758reserved and25
new wishes retained. Actual paid draw38 is new Battle Orders Barbarian SSR72;
trial1040–1042completes, then veteran restored. Present15/18waves,alive12/dead3,
34,264direct damage/130,498mercXP; no passive-support or causal claim. Native
payment replay/exact decode and full journal readback pass;162deltas conserve
state. Contiguous funding chain375earned/350spent/25left across38paid draws,
first paid SSR funded2.715736combat hours. Not population/active-hour acceptance.
[Report](../balance/2026-11-02-earned-ssr-party.md). Previous status turn no progress;
next repair measured large-save performance. Full-v1 active/accepted balance0;
all remaining gates retained, browser works/CI excluded/no owner question.


## 2026-11-03 — Materials refresh candidate rejected and restored

[Measured result](../balance/2026-11-03-material-refresh-rejected.md): the memo
candidate removes unrelated MaterialsPanel rendering but mobile transfer median
1126.659→1131.632 ms fails the fixed improvement rule. No source optimization is
retained; all2147baseline production hashes restored. Eight complete independent
public/native transfer checks,18affected tests,scoped types/unignored lint pass.
All processes terminal/owned caches absent. No combat/admissions or campaign
advancement; CE family allowance unchanged. Required evidence uses
`bug592-material-refresh-v1-closure.json` in the retained root-owned packet.
Previous turn status-only/no progress. Next investigate measured serialization
and quest-validation cost; BUG592 open, privatev1 incomplete,ActV13/19,formal0/210.
Root retains human2/packet through umbrella review and owns eventual release.


### 2026-11-03 — Scalar dispatch candidate rejected; status unchanged

The pending browser session34848 completed exit0. Fixed selection rejects
mobile transfer median1126.659→1175.280ms(+4.32%); exact original serialize.ts
and all2147baseline production hashes restored.27affected save/storage tests,
scoped strict types and explicit lint passed; four complete independently modeled
public/native transfers passed with zero errors/overflow. Node screen improvement
8.16% did not establish runtime benefit. Baseline reused; no earlier-act/combat/
training replay, admissions or CE-family allowance consumed. All task processes
terminal and exact owned caches absent. No campaign advancement this status turn.
[Report](../balance/2026-11-03-scalar-dispatch-rejected.md); packet closure
`bug592-scalar-dispatch-v1-closure.json`. Root retains packet/human2 through
umbrella review and owns eventual cleanup/release. BUG592 open; privatev1 active,
ActV13/19 and formal balance0/210. Browser works, CI excluded, no owner question
or external blocker. Rest of ActV,14-build populations/holdouts, economy,
retry/manual-idle,30–50active-hour pacing and integrated gates remain.


### 2026-11-03 — Player Corpse Explosion Defense bypass delivered

The previous goal turn was status-only/no progress. Complete the pending new
authored rule: player CE ignores flat Defense, retaining all numeric damage,
Fire resistance/dodge/critical/absorption/Ignite and earned finite-corpse payment.
Thirteen behavioral RED assertions precede production changes; 222 affected
cases, scoped strict types and explicit lint pass. Four real browser contexts
(360×640/1280×800 × zh/en) verify CE20 prose/164–194/20MP/2s, zero overflow/errors
and whole-save export with only exact equivalent combo aliases/locale changes.
Original driver status/alias-oracle failures remain as evidence. Full discovery
of2147inputs proves exactly nine declared source/test changes; no numeric tuning.
[Report](../balance/2026-11-03-corpse-defense-bypass.md), packet closure
`d06-ce-defense-v1-closure.json`. No combat/admissions/training/quests, earlier-act
replay or closed allowance renewal. Exact owned caches absent, all consumers
terminal; root retains human2/packet through umbrella review and eventual release.
BUG611 first-kill/singleton and BUG592 remain open. ActV13/19/formal0/210/full
privatev1 incomplete; broader populations/holdouts, economy/Hell, adaptation,
manual-idle,30–50active-hour pacing and integratedG0–G7/soak/review/laterplaytest
remain. Browser works, CI excluded, no pending question or external blocker.


### 2026-11-03 — Staged Necromancer preparation verified

Previous goal turn was status-only/no progress. Complete campaign stat staging
and one earned native Malah reset: 350 points refunded/reallocated, free stat
uses 3 to 2, skill uses 3 unchanged, wishstones 1,703 unchanged. Core becomes
15 Strength / 169 Dexterity / 155 Vitality / 91 Energy. Native attack 294,
attack speed 289, physical dodge 53.8%, mana capacity 616; current Life/mana
stay 130/87. Eight focused checks, scoped strict types/lint and independent
whole-save/payment/derived arithmetic pass; equipment aggregation is native
input evidence. Existing passing checks reused. Preserve driver wrong-field
and reader receipt-key failures; read-only correction repeats no payment or
allocation. Combined driver/launcher 731.133/5,363.268 ms, original ceilings
retained. [Report](../balance/2026-11-03-corpse-hybrid-stat-growth.md); packet
closure `p15-corpse-hybrid-stats-v1-closure.json`. All 2,147 production hashes
and five candidate paths authenticate, canonical source unchanged, processes
terminal, no new cache. Root retains human2/packet through umbrella review and
owns eventual release/cleanup. No combat/admission/training/quest/balance cell,
closed-family renewal or controller restart. BUG-611/592 open; Act V 13/19,
normal ordinal 1,594, formal 0/210 and private v1 incomplete. Next address real
earned opening-kill/singleton viability; remaining Act V, 14-build populations/
holdouts/fairness, economy/Hell, adaptation/manual-idle, 30–50 active-hour pacing
and integrated G0–G7/soak/independent review/later owner playtest remain. Browser
works, CI excluded, no pending owner question.


### 2026-11-03 — Bulk-discard count correction verified

[Single-pass counts](../balance/2026-11-03-bulk-discard-counts.md) replace four
array-producing count selectors while sharing actual tier eligibility. Five new
count cases fail before; all 35 affected cases, scoped strict types and explicit
lint pass. Four browser contexts preserve full native/public saves, card identity,
last-page access, independently checked counts and localized previews. Mobile
median 246.584 to 228.272 ms (7.426%); desktop 120.201 to 118.762 ms. Retained
baseline reused, one candidate round, no timing retries or earlier-act replay.
Long tasks 93–117 ms keep BUG-592 open. All baseline inputs authenticate; exactly
four declared source/test paths change and gameplay data is unchanged. Closure
`bug592-bulk-counts-v1-closure.json` remains in the root-owned evidence packet;
processes terminal, exact owned caches absent, root owns eventual cleanup/release.
The following goal turn was status-only/no progress; this continuation finishes
the pending delivery record and returns to earned opening-kill/singleton viability.
No combat/admissions/training/quests; Act V 13/19 and formal balance 0/210 remain.
BUG-611 and full private v1 remain open. Closed experiment families/controllers
stay closed. Browser works, CI excluded, no pending owner answer.


## 2026-11-03 — Owned upgrade and admission1595 recorded

[Consolidated result](../balance/2026-11-03-owned-weapon-native-result.md): BUG618
is fixed with34distinct affected cases and scoped types/lint. Four native
preparation actions conserve442items and equip the owned weapon. Admission1595
wins waves1–3, then draws wave4 with18/20alive; first corpse25.275s/two CE casts.
Independent whole-save/reward/source readback passes. Resume only the latest
export next1596; no earlier save/replay. ActV13/19,formal0/210,BUG611/592/fullv1
remain open. Saved events motivate the explicitly new shared targeting design
[D07](decisions/D07-automatic-single-target-v1.md); implementation/viability
are not yet claimed. Previous goal turn was status-only/no progress. Root
retains human2/packet through umbrella review; no pending answer/external blocker.


## 2026-11-03 — Shared targeting implemented; admission1596 still draws

[Recorded result](../balance/2026-11-03-automatic-targeting-native-result.md):
D07 is implemented with Taunt/non-summon/lowest-Life/order priority;125 final
focused cases, scoped strict types and explicit lint pass. One new native
admission1596 clears waves1–3 and draws wave4 with3/8champions alive; first corpse
4.614s, five CE casts/3729direct damage. Whole-save/rewards/source readback passes.
Different population prevents a causal comparison to1595. Resume only
`p15-d07-targeting-native-v1.native-export.json`, SHA256
`764a1aac8003431c1c8c1e2131a07a1d018df9ea4ba43ae46773848d590a0122`, next1597.
No replay, training, old-family renewal or formal cell. ActV13/19/formal0/210;
BUG611 sustained champion/singleton damage, BUG592 and fullprivatev1 remain open.
Previous goal turn was status-only/no progress. This continuation records the
completed implementation before diagnosing saved damage events. Root retains
human2/packet through umbrella review and owns eventual cleanup/release; native
consumer terminal, no new cache. Browser works, CI excluded, no pending answer.


## 2026-11-03 — Intended Act I experiments reconciled; unproven default removed

Previous turn made evidence progress: the separate reader reconciled all three
owned-defense campaigns, not additional gameplay. This continuation removes the
provisional canonical opt-in, keeps explicit experimental support and the real
native capacity fallback, and verifies four affected cases plus scoped strict
types/two-file lint. Original selector verification is 106 retained unaffected
plus two final capacity cases = 108 distinct cases. Reuse earlier checks; no
campaign replay, seed search, controller extension or unrelated suite.

[Current report](../balance/2026-11-03-intended-act1-acquisition.md) consolidates
five Act I clears/eight stops among thirteen additional intended builds, the
separate current intended Corpse/Bone five-act clear, signature repairs, rejected
Fire Frost Nova control (22/25 both arms, one regression) and owned-defense losses
(0/3 clears; 130 admissions, 154 waves/150 wins). Candidate and final source
authorities are distinct; production tree remains unchanged. BUG623 mechanism
and capacity correction are implemented in working tree; default adoption is
rejected, with progression still open under BUG611.

Current genuine continuation remains level75, ActV19/19, next ordinal1658,
`p15-eve-claim-native-v1.native-export.json`, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
This supersedes old frontier references above. Formal balance remains0/210.
Next use retained opening losses to diagnose sustain/recovery before another
implementation; no benefit is inferred from defensive proxy scores. BUG592,
intended populations/holdouts, pacing/economy/recruitment/fairness/adaptation,
manual-idle/retry, remaining Hell/endgame and integratedG0–G7/review/human soak/
later owner playtest remain open. No external blocker or pending owner answer;
browser works and CI stays excluded. Root retains the human2 worktree and packet
through umbrella review and owns eventual cleanup/release. All validation
consumers are terminal; exact disposable type config removed, no new cache.

## 2026-11-03 — Bounded Den farming verified; acquisition audit repaired

The preceding status turn completed the pending retained-history auditor:
progress through new verification evidence, with no combat replay. This turn
records BUG624/625 as fixed/verified in working tree and retains the canonical
Den acquisition opt-in under its predeclared criterion. Double Swing completes
Act I at level 13 and reaches first boss at ordinal 106; Double Throw stops at
level 7 after its bounded three consecutive farming losses. Both pass their
former ordinal-41 stop. Original thirteen-build five-clear/eight-stop counts
remain historical, distinct from these revised-policy diagnostics.

[Consolidated report](../balance/2026-11-03-intended-act1-acquisition.md) records
165 admissions, 419 waves/414 victories, whole-save/journal reconciliation and
81 distinct affected accounting tests, scoped strict types and zero-warning
explicit lint. Original screens failed after their reports were saved; final
audit code passes against the same journals and rejects missing/forged evidence.
Candidate gameplay and final audit-code source remain distinct; no production
engine/data edit or broader replay occurred. Exact retained-auditor cache is
removed/verified absent, consumer terminal. Required packet/worktree remain
root-owned through umbrella review; no commit/push/publication.

Current genuine continuation remains level 75, Act V 19/19, next ordinal 1658,
`p15-eve-claim-native-v1.native-export.json`, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Formal balance remains 0/210; BUG611/592 and full private v1 remain open. Next
inspect retained Double Throw losses for sustain/skill-growth constraints before
another gameplay change. Intended populations/holdouts, pacing/economy,
recruitment/fairness/adaptation/manual-idle/retry, remaining Hell/endgame,
integrated gates/review and human soak/later owner playtest remain. Browser
works, CI excluded, no external blocker or pending owner answer.


## 2026-11-03 — Double Throw bridge rejected and canonical allocation restored

Exactly one prospective native Act I trial of Double Swing rank 5 before
Throwing Mastery reaches the boss at level 14 (first entry ordinal 134), then
loses Catacombs wave 5. Totals: 135 admissions, 419 waves, 414 victories and
five nonwins. Its Den interval reaches level 12 with 62 admissions; this is
an early acquisition improvement in this diagnostic, not population acceptance.
The full Act I-clear adoption criterion fails. BUG626 and BUG611 remain open.

Separate readback passes full terminal-save/journal/source reconciliation and
13 legal stat / 16 legal skill allocations. Native driver wall time is
33,358.580 ms, versus 6,472,648.866 logical combat ms. Seven candidate checks,
scoped strict types and explicit lint passed; gameplay still failed.
Candidate source is `p15-throw-bridge-v1-source.json`; result/readback is
`p15-throw-bridge-readback-v1.json` in the retained root-owned packet.

The rejected two source files are preserved as
`p15-throw-bridge-rejected-intended-growth-v1.json` and
`p15-throw-bridge-rejected-intended-growth.regression.test.ts`. Canonical
Throw targets now match the prior native profile; the regression file matches
its previous bytes. The JSON retains the candidate's formatting normalization,
so five scoped growth checks were run and pass. Canonical bounded Den farming
remains enabled. No production skill/data tuning or additional combat occurred.
`p15-throw-bridge-rollback.json` records restoration; the task-owned type config
is removed and verified absent. All consumers are terminal. Root retains the
worktree/evidence through umbrella review and owns eventual cleanup/release.

The previous goal turn was a status report only (no progress). Current genuine
continuation stays level 75, Act V 19/19, next ordinal 1658; formal balance
0/210 and full private v1 remain open. No external blocker/pending answer;
browser works, CI excluded. Do not rerun or extend this closed Throw trial.


## 2026-11-03 — Shared dialog focus verified

Previous turn was status-only (no implementation progress). BUG627 is now
fixed/verified in working tree: shared Modal entry/wrapping/return, unique names,
handled/nested Escape, crafting Cancel-first and native Button refs. Affected
102 UI cases pass; five Modal cases rerun after test-only lint cleanup, scoped
strict types and explicit zero-warning lint pass. Real Chromium desktop en and
360×640 zh passes import/delete/bulk/crafting keyboard cancellation and exact
save equality, with no overflow or browser errors/warnings. The first browser
assertion skipped Chromium's keyboard-scrollable preview; diagnostic trace and
corrected final assertions are retained. No production workaround or replay.

[Evidence](evidence/shared-dialog-focus.md), BUG627 and retained packet contain
source hashes, commands, failed and final reports and inspected screenshots.
No campaign advancement: level75 Corpse/Bone Normal ActV19/19, next ordinal1658,
`p15-eve-claim-native-v1.native-export.json`, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Formal balance0/210 and BUG611/626/592/full privatev1 remain open. Next address
the separate mobile inventory detail sheet's name and keyboard focus. Browser
works; CI excluded; no external blocker or pending answer. Root retains the
worktree/evidence through umbrella review and owns eventual cleanup/release;
no agents, installation, commit, push or publication.


## 2026-11-03 — Mobile inventory focus verified

Previous goal turn was a status report/no progress. BUG628 now fixed/verified:
translated Details name, safe entry/native wrapping, Escape/Close/backdrop return,
sibling Discard layering and desktop sidebar. All20affected UI cases, scoped
strict types and explicit two-file lint pass. Real Chromium ten profiles
(five required sizes×both locales) preserve exact exports with no overflow or
browser errors/warnings; Close44px minimum. Initial lint failure is retained;
final source differs from browser-tested bytes only by its explanatory ESLint
comment, authenticated in closure. [Evidence](evidence/mobile-inventory-focus.md).
Eight screenshots visually inspected. No campaign advancement; genuine level75
Corpse/Bone NormalActV19/19/next1658 save remains SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Formal balance0/210; BUG611/626/592/fullprivatev1 remain open. Next use retained
Double Throw failure timelines to diagnose resource/survival/action causes before
another implementation; no replay/extension of the rejected bridge. Browser works,
CI excluded, no external blocker/pending answer. All consumers terminal and exact
owned configs/caches absent. Root retains worktree/required packet through
umbrella review and owns eventual cleanup/release; no agents/install/commit/push/
publication.


## 2026-11-03 — Reject paging experiment; close dialog entry ordering

Previous goal turn was status-only (no progress). The sole complete pagination
candidate round passes integrity/AX/responsive checks but fails frozen mobile
performance thresholds:274.451→240.180msmedian,12.487%gain,78/97/80mslong tasks.
Reject/restore exact hook/test snapshots and only InventoryScreen page-size
block; retain BUG632focus-order correction. Final28affected cases/scoped strict
types/explicit lint and default-production desktop en/mobile zh focus/save
check pass with zero browser warnings/errors. BUG632fixed/verified locally;
BUG592remains Open. No timing retries or campaign replay. Reports:
[focus](evidence/dialog-entry-order.md) and
[paging](../balance/2026-11-03-mobile-pagination-trial.md).

Current genuine continuation remains Corpse/Bone75, NormalActV19/19, next1658,
SHA25674d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1.
Ten intended builds have individual ActIclears; Javelin/Zeal/Martial/Traps
unresolved. BUG626DoubleThrow is fixed for its declared native-reset route;
older Open references above are historical. Formal0/210; BUG611/fullprivatev1
remain open. Next inspect Martial charge/finisher eligibility from retained
failures, without repeating rejected unlock trial. Browser works/CI excluded/
no pending owner answer or external blocker. All consumers terminal; exact
disposable configs/build/cache removed/verified. Root retains human2 and
required evidence packet through umbrella review and owns eventual cleanup/
release; no agents/install/commit/push/publication.


## 2026-11-03 — Intended Javelin clear reconciled; fourteen individual Act I clears

Previous goal turn was status-only (no implementation progress). The sole fresh
[pack/physical bridge route](../balance/2026-11-03-javelin-pack-bridge.md) now has
full independent readback:14/132admissions/406waves/402wins/four retained defeats.
Both permitted route recovery cycles are used; Catacombs retry131wins. Adopt
only the two declared campaign JSON/regression paths; all2151production and
131canonical campaign hashes authenticate. Eight affected checks/scoped strict
types/explicit lint already pass; no combat or unrelated tests repeated here.
BUG640fixed/verified in working tree. This establishes14individual intended
ActIclears; formal balance remains0/210 and fullprivatev1 is incomplete.

Original frozen reader fails before journal processing at exact Git status
comparison because the result document was created during the native run.
Versioned v2 amendment admits only that exact non-code entry, rejects four
unauthorized status changes and retains every original gameplay/input-hash
assertion. Original plan/reader/failure remain. Final readback passes without
combat replay:13stat/16skill allocation transactions and all native custody/
economy/clock/seeds/bounded acquisition/recovery reconcile. Evidence prefix
`p15-javelin-pack-bridge-v1`, readback`-readback-v2.json`, closure`-closure.json`.
Javelin terminal next132saveSHA256
`713d8536a8d0b61d3aad28f88b380c41080256075fca39114c3e73fd3a545da1`.
Main Corpse/Bone75/NormalActV19/19/next1658remains unchanged.

Exact task-owned type config removed and verified absent; native/launcher
owners and children terminal/absent. Root retains claimed human2/required packet
through umbrella review and owns eventual cleanup/release. Browser works;
CI excluded; no pending answer/external blocker. Next investigate the remaining
measured mobile inventory transfer cost, without replaying rejected pagination
or offscreen-CSS trials. Later intended progression/populations/holdouts,
economy/pacing/recruitment/fairness/adaptation/manual-idle/defeat-retry,
remaining Hell/endgame and integratedG0–G7/review/soak/later owner playtest remain.


## 2026-11-03 — Native wave input retained; stopped Throw trial preserved

Previous goal turn was status-only (no implementation progress). BUG662 is now
fixed/verified locally: earned playback binds the published native receipt to
its exact run/wave/seed/recording/area before effects, then retains complete
serializable engine input. P15 observer and both raw-recording comparators retain
that input; historical absence remains visible. All22affected cases pass, plus
final scoped strict types and explicit eight-path zero-warning lint. Original
REDs and first lint failure are retained. No unrelated tests or campaign replay.
[Evidence](evidence/p15-native-wave-input.md).

The earlier Throw Attack20→30trial is stopped-control-mismatch: one control,
zero candidate waves, no production tuning, exact restoration of three tests.
Its omitted Find Potion projection prompted BUG662; neither old missing inputs
nor opaque Battle Command carry are reconstructed. BUG656/659 remain Open;
Throw706–708/Swing708–710 and all separate preparation budgets stay exhausted.
Throw terminal49/next709save and journal hashes authenticate unchanged. No new
campaign acceptance;14individual ActIclears,3five-act Normal completions,
formal0/210. Full privatev1, BUG592, remaining viability/populations/holdouts,
economy/pacing/recruitment/fairness/adaptation/manual-idle/defeat-retry,
offline/PWA/endgame and integration/review/soak/later owner playtest remain.

Exact task-owned type config removed after validation; shared caches preserved.
Root retains human2 and required native-input/stopped-trial packets through
umbrella review and owns eventual cleanup/release. Browser works; CI excluded;
no pending answer/external blocker. No agents/install/commit/push/publication.


## 2026-11-03 — Fresh preparation defaults to ranked cleared farms

Previous goal turn was status-only/no implementation progress. BUG663 is now
fixed/verified locally: the shared constructor records ranked-cleared-v1 for
new omitted/empty options; historical absent-policy states retain legacy runtime,
continuation and audit behavior. Constructor and actual source-selection REDs
precede the one-line source fix. All45selected affected constructed cases pass
(25ActIII/10ActIV/10ActV), with scoped strict types and explicit four-path lint.
[Evidence](evidence/p15-ranked-training-default.md). No earned earlier-act replay,
new combat, XP/target changes, relabeled history or renewed budgets. The shared
XP correction already resolves the earlier structural mismatch for one build;
no further XP correction is proposed.

Counts remain14individual ActIclears/3five-act Normal/formal0/210. Full privatev1,
BUG592, remaining intended-build viability, population/holdout/economy/pacing/
recruitment/fairness/adaptation/manual-idle/defeat-retry, offline/PWA/endgame and
final integration/review/soak/later owner playtest remain. All owned validation
sessions terminal; exact disposable type config removed and absence verified.
Root retains human2/required packet through umbrella review and owns eventual
cleanup/release. Browser works; CI excluded; no pending answer/external blocker.
No new agents/install/commit/push/publication. Continue unfinished gameplay from
retained evidence without reopening exhausted attempts.


## 2026-11-04 — Double Throw rank Attack tuning verified locally

Previous goal turn was status-only/no implementation progress. The sole30pp
candidate now passes its frozen diagnostic and affected validation:15exact
controls/12published transitions; all15candidate battles won, including Izual
in54.5396/47.0578/50.4570seconds.32diagnostic battles include both stopped
predecessor controls. [Evidence](evidence/p15-double-throw-rank-growth.md).
The single production JSON value changes Throw20→30Attack pp per rank above
one; four affected test files assert it. Rank1/Swing/mitigation/costs/targeting
retain their contracts. All33focused cases, scoped strict types, explicit
four-path zero-warning lint and16real English/Chinese desktop/mobile synthetic
browser cases pass.24screenshots and all initial failures remain recorded.

These reconstructed legacy inputs and synthetic previews earn no campaign
clear, income or renewed budget. BUG656 remains Open; Throw706–708 and all
separate preparation limits stay exhausted. Original level49/next709save/journal
hashes authenticate unchanged. Counts remain14intended ActIclears/3five-act
Normal/formal0/210. Full privatev1, BUG592, remaining intended-build viability,
populations/holdouts, economy/pacing/recruitment/fairness/adaptation/manual-idle/
defeat-retry, offline/PWA/endgame and integration/review/soak/later owner playtest
remain. Root self-review is not independent final acceptance.

All owned validation sessions terminal; browser drivers absent. Exact disposable
type config and packet-local Vite caches removed, absence verified. Root retains
human2 and the required parent/child packet through umbrella review and owns
eventual cleanup/release. Browser works; CI excluded; no pending answer/external
blocker. No agents/install/commit/push/publication or earlier-act campaign replay.
Next define a prospective progression continuation for the adopted tuning,
without erasing the failed history or silently resetting exhausted attempts.


## 2026-11-04 — Double Throw earned Act IV clear verified

Previous goal turn was status-only/no implementation progress. The post-tuning
[earned continuation](evidence/p15-double-throw-act4-completion.md) now clears
all three Act IV quest areas: 3 admissions, 18 victories, zero training/retry/
nonwin/unplayed waves, all three Claims. Native save is level49/next712 with
Act V unlocked. Scoped types/lint, five negative schedule controls, input
preflight and independent retained-output save/economy/custody/party/quest/
clock/seed/ordinal reconciliation pass; closure authenticates all inputs and
terminal processes/config/cache absence. No gameplay source change or replay.

BUG656 is locally resolved for Act IV; original706–708 failures and exhausted
controller stay terminal. Cumulative712admissions/40.167Mcombat ms/459.936s
measured execution remain inside original global envelope. This underlevel
single-checkpoint result earns no wider balance/pacing acceptance. Counts stay
14ActI/3five-act Normal/formal0/210 until Act V completes. Full privatev1,
BUG592, other intended campaigns and broader balance/economy/pacing/recruitment/
fairness/adaptation/manual-idle/defeat-retry/offline/PWA/endgame/integration/
review/soak/later owner playtest remain. Next continue Act V from exact save.
Root retains human2/required packet through umbrella review and owns eventual
cleanup/release; browser works, CI excluded, no pending answer/external blocker.
No agents/install/commit/push/publication or earlier-act campaign replay.


## 2026-11-04 — Partial Act V custody and preparation adoption

Previous goal turn reported status only; no implementation progress. BUG665 is
now fixed/verified locally: [settled unprepared route adoption](evidence/p15-unprepared-route-continuation.md)
retains historical failed admissions and all native custody under original
bounds.30affected cases, one native-quest/constructed-combat integration,
five selected shared-controller guards, corrected strict types and explicit
lint pass. Initial final type failure is retained; fixture callback corrected.
No native campaign or production gameplay changed in this repair.

Actual Double Throw Act V evidence is now recorded: two clears/Claims followed
by Crystalline714draw; level49/next715,12victories/one draw/13quest actions.
Conditional conservative training count480/80/114exceeds existing200per-area/
600total bounds but is not proof actual runs cannot fit. No new training,
budget renewal or old campaign replay. Next inspect Holy Bolt's earned52/906
Act IV partial checkpoint under its already verified signature priority; River
and Chaos remain unattempted. Five-act completion remains3/14, ActI14/14,
formal0/210; full privatev1 remains active and incomplete. Browser works/CI
excluded/no pending answer or external blocker. Root retains human2/required
packet through umbrella review and owns eventual cleanup/release.


## 2026-11-04 — Holy Bolt successor and P17 coverage reconciled

Previous goal turn was status-only/no progress. This turn records the already
verified [Holy Bolt Act IV clear and partial Act V](evidence/p15-holy-bolt-act4-and-act5-checkpoint.md).
River906/Chaos907 clear with both Claims/all13 Act IV actions; Act V clears its
first three areas, reads Anya's scroll, then draws at Ancient's Way911 wave4.
Exact successor52/next912; no farming/retry. Both closure records and their five
evidence-file hashes authenticate unchanged. Original failures, budgets, seeds,
ordinals and unknown120000ms wrapper reservation remain. Conservative489+114
training projection exceeds existing limits but does not prove actual runs
cannot fit; no training started. BUG647 locally resolved for Act IV only.

Coverage F13/F16 now links existing close/reopen, production offline gameplay,
real worker update and PNG icon evidence instead of stale baseline-only claims.
These are historical bounded acceptances, not full current P17/integration.
No combat, test suite, build, install or source gameplay change was needed for
this documentation correction. Counts remain14ActI/3Normal/formal0/210; full
privatev1 remains active. Next implement an actual unfinished source requirement;
avoid replaying accepted offline/campaign slices or rejected performance trials.
Root retains human2 and required counted-source packet through umbrella review
and owns eventual cleanup/release. Browser works/CI excluded/no pending answer.


## 2026-11-04 — Offline hourglass fix verified

Previous goal turn was status-only/no progress. This continuation closes BUG681
locally: [font-independent hourglass](evidence/p17-bonus-hourglass.md) works on
both home and HUD after actual offline reopening in all four locale/device
cases. Twelve existing offline units, scoped strict types/lint and isolated
production/Workbox/bridge checks pass. Initial worker-timeout failures remain;
final four browser cases pass without retries. All766build/eightcapture hashes
reverified; disposable output/configs removed, port4401closed, no owned server
process. Root retains required evidence/human2 through umbrella review.

No campaign replay/training/budget renewal;14ActI/3Normal/formal0of210 unchanged.
Full privatev1 remains active. Next implement missing boss reward quantities
under BUG680. Browser works/CI excluded/no pending question or external blocker.


## 2026-11-04 — Exact chapter-boss materials verified

[Material-bundle evidence](evidence/p17-boss-material-bundles.md) verifies all
five bosses' rune quantities/bands and gem counts on all three difficulties.
Original15failures, final199affected loot passes and19native settlement passes
are retained; scoped strict types/lint/build/ten-chunk bridge scan/precache pass.
BUG682's stale scripted fixture is corrected; BUG680 remains partially open for
ordinary/jewelry counts, optional uniques and first kills. Exact source/766build
hashes match; disposable build/config removed and verified absent. Root retains
required packet `p17-boss-material-bundles-v1` and human2 through umbrella review.

Previous goal turn was status-only/no progress; this continuation closes real
implementation verification. No campaign replay/full suite/new agent/install/
commit/push/publication or renewed training limits.14ActI/3Normal/formal0of210
remain; full privatev1 active. Browser works/CI excluded/no pending question or
external blocker. Next implement missing ordinary/jewelry boss equipment groups.


## 2026-11-04 — Chapter-boss ordinary equipment groups verified

Previous goal turn was status-only/no progress. This continuation completes
[ordinary equipment/jewelry groups](evidence/p17-boss-equipment-groups.md): exact
4+2/5+3/6+3/7+3/8+4 live-boss picks, offset minima and finite terminal-only caps.
Original15failures,27focused passes and20native settlement passes are retained.
BUG683 isolates the14broader affected failures to stale current-level oracles and
historical pools inheriting later policies;164corrected-file cases pass and
30final selected cases pass. Exact reward/next-RNG assertions remain. Final
scoped types/lint, production build/ten-chunk bridge scan/precache pass.14source
and766build hashes verified; exact disposable build/config removed and confirmed
absent. Root retains human2/required packet through umbrella review and owns
cleanup/release. No owned server/process remains.

No full suite/campaign replay/new agent/install/commit/push/publication or budget
renewal.14ActI/3Normal/formal0of210 unchanged; full privatev1 remains active.
BUG680 is partial: next implement optional unique attempts, then first-kill
rewards. Browser works/CI excluded/no pending question or external blocker.


## 2026-11-04 — Optional chapter-boss uniques implemented and verified

[Optional-unique evidence](evidence/p17-boss-optional-uniques.md) completes the
five optional gates and Andariel's distinct5×unique rarity attempt with actual
gear/offline MF. Positive eligible boss-TC base weights and existing unique
materialization preserve live ilvl; impossible successful bonuses refuse the
complete bag. Native inventory receives10ordinary+3guarantees+1optional Diablo
item atomically. Original15failures,35focused cases,341affected loot and22native
settlement passes are retained; counts overlap. BUG683 documents17stale component
fixture failures and their scope isolation without weakened assertions. Scoped
types/explicit lint and production/precache/ten-chunk bridge scan pass.14input/
766build hashes match; exact disposable build/config removed and verified absent.
All processes terminal; no server started. Root retains required packet and human2
through umbrella review and owns eventual cleanup/release.

The preceding status turn polled the original reproduction to terminal and
reported status; this continuation makes source/verification progress. No full
suite/campaign replay/new agent/install/commit/push/publication or budget renewal.
Counts14ActI/3Normal/formal0of210 unchanged; full privatev1 remains active and
incomplete. BUG680 remains partial for first-kill rewards, which are next. Broader
build viability, economy/pacing, integration, accessibility/performance and final
review/soak remain. Browser works/CI excluded/no pending question or external blocker.


## 2026-11-04 — Chapter-boss first kills verified; BUG680 resolved locally

[First-kill evidence](evidence/p17-boss-first-kills.md) completes the five
boss bonuses once per difficulty/save using existing clear ledgers. Exact named
chances, restricted random uniques and Hell-only Baal high rune materialize at
actual ilvl. Native terminal victory owns eligibility; repeat/reload, frozen
replay difficulty, defeat, abort, rollback and impossible whole-bag refusal are
covered. Review reproduced and fixed excess-runtime-field authority by moving
boss identity to a separate private argument. Original failures are retained.
247affected loot and89final selected cases pass (overlapping populations), as
do scoped strict types/explicit lint and isolated production/precache/ten-chunk
bridge scans.12source/766build hashes match. Exact disposable build/config
removed and verified absent; all processes terminal, no server started.

The preceding status-only turn was no progress; this continuation finishes
production verification and authoritative records. BUG680's guarantees, boss
material/ordinary/jewelry counts, optional uniques and first kills are resolved
locally. Full P17/privatev1 and wider loot/economy acceptance remain open.
14ActI/3Normal/formal0of210 unchanged. No campaign replay/full suite/new agent/
install/commit/push/publication or renewed training budgets. Next inspect the
remaining nonboss loot requirements before another source change. Browser works;
CI excluded; no pending answer/external blocker. Root retains required packet
`p17-boss-first-kills-v1` and human2 through umbrella review and owns eventual
cleanup/release.


## 2026-11-04 — Treasure goblin bundles and native encounter binding verified

[BUG684 evidence](evidence/p17-treasure-goblin.md) implements five equipment
picks plus the existing rare+, independent1–4next-act runes and5–10actual-act
gems with D10 caps, MF and finite122eligibility. Actual goblins are elite;
table identity supplies boss loot context, and treasure waves retain their
single authored spawn instead of11–13clones. Missing configured sources refuse
before draws. Native delivery, pre-XP refusal and full publication restoration
pass. Original failures retained;164affected loot and237final selected cases
pass (overlapping), as do scoped types/explicit lint and production/precache/
13-JS bridge scans. Ten source/766build hashes verified; exact disposable
build/config removed and confirmed absent. BUG684 resolved locally.

The preceding status-only goal turn was no progress; this continuation fixes
source behavior and completes real verification. Counts14ActI/3Normal/formal
0of210 unchanged; full privatev1 remains active/incomplete. No full suite,
campaign replay/new agent/install/commit/push/publication or renewed training
budget. Next inspect remaining nonboss loot requirements before another source
change. Browser works/CI excluded/no pending question or external blocker.
Root retains human2/required packet through umbrella review and owns cleanup
and release; all processes terminal, no server started.


## 2026-11-04 — Champion and rare-leader loot verified

[BUG685 evidence](evidence/p17-nonboss-equipment.md) implements actual-tier
source projection, two/three ordinary picks with shifted minima, independent
rare-leader jewelry, actual-difficulty noDrop and corrected rarity weights.
Finite terminal-only extensions cover current five-act native/replay levels;
low-level ordinary emptiness and refusal/restoration are explicit.25focused
and30native cases pass within the affected run (152passed/one obsolete rare
snapshot); corrected award file then passes all10cases. Independently reviewed
rarity/next-RNG changes preserve the boss snapshot body and historical evidence.
Scoped strict types/explicit lint and production/precache/13-JS bridge checks
pass.12source/766build hashes match. Exact disposable build/config removed and
verified absent; all consumers terminal, no server started. BUG685 resolved locally.

Previous status-only turn was no progress; this continuation finishes actual
verification and authoritative records.14ActI/3Normal/formal0of210 unchanged;
full privatev1 remains active/incomplete. No broad suite, campaign replay, new
agent, install, commit, push, publication or renewed closed budgets. Next inspect
remaining miniboss/trash reward contracts, then continue build viability,
economy/pacing, integration, accessibility/performance and final review/soak.
Browser works; CI excluded; no pending answer/external blocker. Root retains
required `p17-nonboss-equipment-v1` packet and human2 through umbrella review
and owns eventual cleanup/release.


## 2026-11-04 — Live miniboss equipment verified

[BUG686 evidence](evidence/p17-miniboss-equipment.md) implements three shifted
trash-source equipment draws, independent jewelry and the existing50%rare+
bonus with finite unshifted bonus eligibility. Local3/4/8rarity applies to
ordinary/conditional rolls; actual ilvl/MF, D10 independent materials/currency,
chapter/goblin/cache contexts and historical evidence persist.11original
failures become19focused passes;124affected loot and33native settlement cases
pass (overlapping). Native Blood Raven delivery/refusal/restoration, scoped
types/explicit lint and production/precache/13-JS bridge checks pass.11source/
766build hashes match; exact disposable build/config removed and verified
absent. BUG686 resolved locally, uncommitted. All consumers terminal/no server.

Previous goal turn was status-only/no progress; this continuation implements
and verifies an unfinished requirement.14ActI/3Normal/formal0of210 unchanged;
full privatev1 remains active/incomplete. No broad suite, campaign replay, new
agent, install, commit, push, publication or renewed closed budgets. Next inspect
trash difficulty/source eligibility, then continue build viability, economy/
pacing, integration, accessibility/performance and final review/soak. Browser
works; CI excluded; no pending question/external blocker. Root retains required
`p17-miniboss-equipment-v1` packet and human2 through umbrella review and owns
eventual cleanup/release.


## 2026-11-04 — Ordinary-monster equipment verified

[BUG687 evidence](evidence/p17-trash-equipment.md) closes ordinary-monster
actual-tier equipment: one unshifted draw, difficulty noDrop .6/.5/.4, authored
1/1/1 rarity and finite terminal-only act caps. D10 materials/currency, actual
ilvl/MF, explicit caches and special sources persist. 18 focused/36 native
cases pass within 153 affected cases; scoped types/explicit lint and isolated
production/precache/all-13-JS bridge checks pass. Seven source/766 build hashes
verified; exact disposable build/config removed and confirmed absent. Original
fixture failures retained; no snapshots changed. BUG687 resolved locally,
uncommitted; local review only. All processes terminal/no server started.

Previous goal turn was status-only/no progress; this continuation completes real
verification and closure. Full private v1 remains incomplete; 14 Act I / 3 Normal /
formal 0 of 210 unchanged. No broad suite, campaign replay, new agent, install,
commit, push, publication or renewed closed budgets. Next inspect remaining
loot/economy requirements, then continue build viability, pacing, integration,
accessibility/performance and final review/soak. Browser works; CI excluded; no
pending answer/external blocker. Root retains required packet and human2 through
umbrella review and owns eventual cleanup/release.


## 2026-11-04 — Goblin conditional wishstone quantity verified

[BUG688 evidence](evidence/p17-goblin-wishstones.md) separates the goblin's
1–3 wishes from its boss equipment/material context. Existing one 2.5% gate,
conditional wishstone-stream entropy, non-goblin/cache isolation and native
transaction authority persist. Original 8 failures become 12 focused passes;
160 cases in eight explicit affected files pass, including native credit and
all-domain restoration with a real successful wishstone seed. Scoped strict
types/four-file lint and isolated production/precache/all-13-JS bridge checks
pass. Six source/766 build hashes verified. Exact disposable build/config removed
and confirmed absent; required packet retained. BUG688 resolved locally,
uncommitted; local review only. All task processes terminal/no server started.

Previous goal turn was status-only/no progress; this continuation changes actual
source behavior and completes verification/closure. Full private v1 remains
incomplete; 14 Act I / 3 Normal / formal 0 of 210 unchanged. No broad suite,
campaign replay, new agent, install, commit, push, publication or renewed closed
budgets. Continue remaining loot/economy requirements, build viability, pacing,
difficulty/endgame integration, accessibility/performance and final review/soak.
Browser works; CI excluded; no pending answer/external blocker. Root retains
required `p17-goblin-wishstones-v1` packet and human2 through umbrella review
and owns eventual cleanup/release.


## 2026-11-04 — Holy Bolt cadence diagnostic closed

Previous goal turn was status-only/no progress. [Retained diagnostic](evidence/p15-holy-bolt-cadence-diagnostic.md)
closes one control/zero candidates/zero campaign admissions with no adoption.
The exact-event gate failed on36new cadence observations; all1050 original
noncadence events and full final parties match. No replay or weakened gate.
Original checks/preflight mistakes retained; frozen source/journal pins exact.
Active scoped configs archived/removed; three runtime PIDs and task cache absent.
Required packet retained by root through umbrella review; no disposables or
cleanup failures.14ActI/7Normal/formal0of210; full privatev1 remains incomplete.
Next check one prospective current-source Glacial browser admission from genuine
endgame5 successor, with no earlier clears/Claim/socket replay. Browser works/CI
excluded/no pending answer or external blocker; no broad checks/new agents/
installs/commits/pushes/publication. Human extended playtest stays with user.


## 2026-11-04 — Current-source earned Glacial repeat verified

[Glacial integration](evidence/p18-current-glacial-repeat.md) wins one public
ordinal5admission/four waves from exact v33 earned endgame5. Native Frozen
Terror Frost Aura→allied cold/Chill, card chips and hero cadence0.5→1.5s are
observed. Exact Save/browser restart/Continue export passes. Separate reader
reconciles all27643ancestral items/ten new payloads,150930heroXP,113197mercXP/
23→24growth,29758Rune Shards and three material units including sapphire cache.
Current authoritative successor is versioned endgame6/Ashen4/Glacial2; all prior
admissions/Claim/title/socket actions stay closed. No product fix was needed.

1582frozen source inputs/194DOM geometries and runtime errors/receipts pass.
Required external d2-p18-glacial-_s8af4t2 packet retained by root through umbrella
review. Executor3787350/port5173 and exact task cache/profile/tmp/downloads absent;
no remaining disposables/cleanup failures. Current development-source integration
only: production Glacial, fairness, pacing and broader acceptance remain open.
No build, broad tests, earlier clear replay, new agent/install/commit/push/CI or
publication.14ActI/7Normal/formal0of210; full privatev1 remains active/incomplete.
Browser works/no pending answer or external blocker; extended human playtesting
stays with user. Continue remaining build causes/acquisition/economy/difficulty/
app readiness and final review rather than repeating this consumed admission.


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


## 2026-11-04 — Retained Druid Act V closed at Ancients

[Fixed Act V evidence](evidence/p15-druid-fixed-act5.md) closes retained output
without replay: four admissions720–723,25waves/24wins/one Ancients60s draw,
three Claims and separate resistance scroll Read. Actual50/next724; Throne
never entered. Source Oak10/Heart1 persists. Accepted reader plus supplemental
wave+quest mercXP/direct-damage accounting reconcile. Prayer gains1248221XP;
initial supplemental omission of22500questXP is corrected without gameplay.

Cumulative724admissions/16466434.85016471combat ms/496448.204456driver ms/
637798.7110901005reserved execution ms include both advisory launch costs once.
Feasibility662-victory conservative estimate is conditional, not an impossibility
proof or renewed training budget. Shout/flat mitigation explains low wolf hits;
no engine defect or new tuning adopted. All20recorded PIDs/exact config/cache
absent; no remaining disposables/cleanup failures. Required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-act5-b99gu3d4` retained
by root through unfinished umbrella review. BUG708 stays Open.14/14ActI,8/14Normal,
formal0/210; full privatev1 active/incomplete. No broad checks/build, new agents,
install/commit/push/CI/publication; browser works/no pending question or external
blocker. Extended human playtest follows implementation.


## 2026-11-04 — Shared mercenary XP correction

[BUG709 verification](evidence/p15-merc-xp-policy.md) closes one local numerical
implementation: preserve costs1–18; anchor later2.5power costs at18 to match
actual polynomial rewards. Validated immutable JSON policy and registered
schema feed the canonical store. Existing explicit thresholds remain until
consumed;75%sharing, recruitment, stats and saved histories stay exact. No
backfilled XP, free levels, save migration or campaign credit.

Four legitimate pre-edit RED cases become green.43selected progression/schema
cases, scoped strict types and five-file lint pass; four unrelated equipment/
dismiss cases excluded. No repeat checks, earlier-act replay or broad suite/build.
External packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-xp-policy-n89no0k9`
retains exact arithmetic/source deltas/check receipts/closure. All four recorded
checker PIDs and active type config absent; exact config archived as evidence.
No task server/browser/isolated cache, remaining disposables or cleanup failures.
Root retains packet and claimed human2 through unfinished umbrella review and
owns later cleanup/release after consumers finish.

14/14ActI,8/14Normal,formal0/210remain unchanged. Druid50/next724 and all six
unfinished routes retain their earned boundary and closed budgets. Acquisition/
crafting/economy/pacing, higher difficulties/endgame, PWA/a11y/performance and
independent acceptance remain open. Full privatev1 active/incomplete. Browser
works/CI excluded/no pending answer or external blocker. Extended human playtest
follows implementation. No new agent/install/commit/push/publication.


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


## 2026-11-04 — Holy Bolt earned Normal completion

[Verified completion](evidence/p15-holy-bolt-merc-survival-normal-completion.md)
closes Ancients913/first Throne914:15/15victories, all19ActVactions, main Claims,
consumed sources, Baal title and Nightmare unlock. Actual53/next915 earns
801923heroXP/148items; Prayer survives all waves. One owned helmet replacement
uses53native staging moves/retrieval/equip; no production tuning, training,
completed-act replay or renewed closed trial. Complete606-event control and
separate preparation/earned save/journal/point arithmetic readbacks pass. All
2230production/134campaign inputs stable. Original helper failures and costs
retained and resolved without replay. BUG647 locally resolved for earned Normal;
BUG714 gains earned validation. Counts14/14ActI,11/14Normal,formal0/210.

Six recorded PIDs and six exact caches absent; no remaining disposables/cleanup
failures. Root retains required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-holy-merc-survival-4eiiudoo`
and human2 through unfinished umbrella review, then owns exact cleanup/release.
Carried campaign915admissions/44184368.83228759combatms; known cumulative driver
773689.974043ms. Separate two-battle diagnostic46508logicalms, no admissions;
new wrapper times unmeasured. Full privatev1 active/incomplete. Zeal,Javelin,
Double Swing and broader acquisition/crafting/economy/pacing, higher difficulties/
endgame, PWA/device/a11y/performance, soak and independent acceptance remain open.
Previous goal turn was status-only/no progress; this closure adds verified earned
completion. Browser works/CI excluded/no pending question or external blocker.
No broad suite/build, agents/install/commit/push/publication. Human extended
playtest follows implementation.


## 2026-11-04 — Empty crafting search work removed

[P16/F21 evidence](evidence/p16-empty-crafting-search-performance.md) locally
resolves BUG720 with one production line: blank normalized queries preserve the
list directly. Bounded retained-save development-browser median336→32ms;30affected
cases, final10component cases/types/lint and bilingual mobile/desktop checks pass.
Original after-run Chinese-selector failure retained; supplemental layout/state
run passes with exact complete save equality and no repeated timing/gameplay.
Three exact caches removed; browser PIDs/port/config terminal, no cleanup failure.
Root retains required `d2-crafting-empty-search-u8uw5wli` packet through umbrella
acceptance, then owns exact cleanup. Previous turn verified pending terminal
results; this turn closes the fix/evidence. Counts14/14ActI,12/14Normal,formal0/210
unchanged. Full privatev1 active/incomplete; wider build/economy/pacing/difficulty/
PWA/device/a11y/performance/soak/acceptance open. Next inspect offline artwork
metadata delivery. No broad test/build, agents, commit, push or user hold.


## 2026-11-04 — Startup language preference retained

[P16/BUG722 evidence](evidence/p16-startup-language-preference.md) closes the
pre-character English reload defect with one shared guarded preference reader
used by i18n and initial meta settings. Chinese defaults/reset and native
save/import precedence remain. 21 affected tests, scoped strict types/four-file
lint and ten real browser checks pass; both imports preserve exact player and
inventory data. Initial harness failures are retained and explained.

All seven tool handles terminal; PID4137076 absent/port5173 closed, exact cache
removed/config archived, no remaining disposables or cleanup failures. Root
retains required `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-locale-startup-ybab12cl`
and human2 through unfinished umbrella acceptance, then owns cleanup/release.
Previous turn was status-only/no progress; this turn implements and verifies a
source fix. Counts14/14ActI,12/14Normal,formal0/210 unchanged; Zeal/earned Double
Swing, economy/active-hour pacing, higher difficulty/endgame, broader app/PWA/
a11y/performance/soak and independent acceptance remain open. Full privatev1
active/incomplete. No earned save mutation, completed-act replay, broad checks/
build, agents/install/commit/push/CI; browser works/no pending answer or hold.


## 2026-11-04 — Direct gem-fusion fee included

[P15/P12b evidence](evidence/p15-gem-fusion-complete-cost.md) closes a bounded
currency-cost component: 28 recipes × eight native plans, empty stock and a
reserved input plus distinct surplus gem dismantled for the one-shard fee.
Six focused cases, prior native report, scoped strict types/lint and a separate
57,344-point sequential readback pass. Source/protected hashes and current
cost/yield catalogs reconcile; prior report values remain unchanged. Required
packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-gem-fusion-cost-jfkgq6dq`
retains checks/reports/readers and source snapshots; root owns retention through
unfinished umbrella review, then exact cleanup and human2 release. Executed
configs are archived, exact processes terminal and disposable cache absent.

The preceding status turn was no progress; this turn completes the local model
and family measurement. This does not prove earned crafting, all-source economy,
30–50 active-hour pacing or formal acceptance. Counts14/14ActI,12/14Normal,
formal0/210 stay unchanged. Zeal/earned Double Swing, wider economy/time policies,
higher difficulty/endgame, broader app/PWA/a11y/performance, soak and independent
acceptance remain open. Full privatev1 stays active/incomplete. No broad checks,
build, earned replay, browser run, install, new agent, CI, commit or push.
No pending answer or external hold; owner playtest follows implementation.


## 2026-11-04 — Fresh Double Swing Act III qualified

[Fresh observed lineage](evidence/p15-swing-fresh-observed-lineage.md) now
qualifies Acts I–III: Act III adds224admissions/1297victories, no nonwins,
level47/next688, both main Claims once. Separate streaming readback reconciles
all native rewards/custody/material actions/XP/allocations/save/clock and
2240production/135campaign inputs. Root readback is not independent final QA.
Cumulative688admissions/21862861.146490753combatms/401507.462413driverms;
reserved execution780000ms, original aggregate unchanged. Act IV preparation
uses the exact qualified successor, one launch/250admissions/40000000combatms/
180000executionms. No production changes, completed-act replay or broad checks.
Act III PIDs/cache absent; config archived/deleted, stderr empty, packet48822874
bytes within cap. Required `d2-swing-fresh-act3-qjvbrbnm` remains under zai-temp
with root through umbrella acceptance, then exact cleanup; human2 retained.
Previous turn was status-only/no progress; this turn qualifies native evidence.
Counts14/14ActI,12/14Normal,formal0/210; full privatev1 active/incomplete.
Zeal/earned Swing IV–V, wider acquisition/economy/30–50active-hour pacing,
higher difficulty/endgame, broader app/PWA/device/a11y/performance, soak and
independent acceptance remain. Browser works/CI excluded/no pending question.


## 2026-11-04 — Fresh Double Swing Act IV qualified

[Fresh observed lineage](evidence/p15-swing-fresh-observed-lineage.md) now
qualifies Acts I–IV:225new admissions/1225victories, no nonwins,61/next913;
Izual/Hellforge/Diablo and all13actions/three Claims complete. Separate streaming
readback passes for rewards/custody/sockets/XP/allocations/save/clock/source;
root verification is not independent final QA. All2240production/135campaign
inputs stable. Native PIDs/cache absent, stderr empty; config archived/deleted.
Required `d2-swing-fresh-act4-toj_odhf` packet51708484bytes within cap remains
with root under zai-temp through umbrella acceptance, then exact cleanup.
Cumulative913admissions/33450552.64786695combatms/574187.435638driverms;
reserved execution960000ms. Act V main-quest plan uses exact successor, one
launch/450admissions/40000000combatms/300000executionms, no aggregate renewal.
Full privatev1 active/incomplete; counts14/14ActI,12/14Normal,formal0/210.
Zeal/earned Swing V and broader economy/pacing/difficulty/endgame/app/PWA/device/
a11y/performance/soak/independent acceptance remain. No production edit,
completed-act replay,broad checks,new agents,CI or user hold.


## 2026-11-04 — Double Throw screen and actual Act II power qualified

[Double Throw screening](evidence/p15-throw-act2-checkpoint-screen.md) completes
200trials/1200victorious waves with no deaths/unreached bosses; Duriel p50
10.980s/manual and idle, win95%interval[0.9630065,1]. BUG731 records the challenge
concern; no broad boss buff from one build. BUG730 corrects the retained reader's
ordered binary64 summation only; original failure remains, no combat replay.
Separate readback passes,2248production/eight helper inputs stable; exact PIDs/
cache absent. Root retains `d2-throw-act2-screen-qms4rpxa` through fullv1 acceptance.

[Actual earned Act II power](evidence/p15-act2-earned-power-cohort.md) adds14exact
source qualifications/28descriptors and separate readback, zero combat/reward
rolls. Thirteen intended completions are32; Bone is24 and used manual boss-boundary
order adaptation. Keep its actual state separate. Canonical inventory equipment,
current hero/merc projection, saved resources, source/acquisition and outer realm/
clock restoration reconcile. Exact PIDs14145/14146/cache absent, stderr empty,
cleanup record passes. Root retains required `d2-act2-earned-power-phx87ot5`.

The preceding goal turn was status-only/no progress. This turn revalidates the
claimed human2 worktree/session and moves to the next safe diagnostic: frozen
[cohort policy](decisions/P15-act2-earned-cohort-screen-v1.md),12other32builds,
100paired manual/idle seeds each, native whole Tomb carry, exact ordinals/clocks,
zero adaptation, one launch and finite2400attempt/14400wave/1200native-second
budgets. Throw200 reused, Bone24 separate; no holdouts or outcome-based retries.
Required `d2-act2-boss-cohort-screen-dgv98tt0` native execution started under
handle97080/PID15322, wrapper15321; processes verified live, no exit yet at this
entry. Results await actual terminal/readback; do not infer completion from
launch or logs. Root retains both current packets through umbrella acceptance,
then exact cleanup/release after consumers finish. Counts14/14Normal,
210/210supplemental sources,formal0/210. Full privatev1 active/incomplete;
wider balance/acquisition/economy/30–50active-hour pacing/difficulty/endgame and
integrated app/mobile/a11y/performance/PWA/soak/independent acceptance remain.
No runtime code edit, broad checks, completed campaign replay, new agents,
install, CI, commit, push or user hold. Browser works; owner playtest follows
implementation. No pending question.


## 2026-11-04 — Duriel passive Aura verified

The preceding progress-report turn observed the pending browser handle's exit0
and passing desktop/mobile results, changing the next action to evidence
closeout. This continuation revalidates the existing human2 session claim,
reviews source/assertions/browser harness and inspects role/viewport screenshots.
[BUG734 evidence](evidence/p15-duriel-passive-frost-aura.md) records28focused
tests, scoped strict types/lint and browser passes for15cold/5s/2sChill with
Charge/basic actions and Freeze immunity preserved. Frozen Terror unchanged;
BUG732 active cadence superseded without rewriting historical evidence.

Seventeen source snapshots/manifest and cleanup added. Exact PIDs30955/30946/
31523/31522 absent, both servers/caches closed/removed, no disposables/failures;
21/24native diagnostic battles, packet about1.4MB below8MiB. Required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-passive-aura-oow7i3w5`
remains with root through umbrella acceptance, then exact cleanup after consumers
finish. No broad suite/build/completed-campaign replay/new agent/CI/commit/push.

BUG731 and wider balance remain open. Next freeze a small paired current-source
diagnostic using retained actual earned saves before selecting tuning; do not
renew the spent2,400-attempt baseline. Counts14/14Normal,210/210supplemental
sources,formal0/210. Full privatev1 active/incomplete; general acquisition/
economy/30–50active-hour pacing/difficulty/endgame and integrated app/mobile/
a11y/performance/PWA/soak/independent acceptance remain. Browser works/CI excluded/
no pending question; owner playtest follows implementation.

## 2026-11-04 — Corrected Duriel comparison and Charge implementation

Previous goal turn was status-only/no progress. Exact session
01a1577a-5af4-70e3-8699-50a906877d8fowns existing human2worktree,in_use;
preserve inherited changes/CI exclusion. Completed24attempt screen and separate
paired analysis pass;120prefix waves exactly match,all24bosses win.
[Evidence](evidence/p15-duriel-corrected-paired-screen.md) records limits/source
tree/retained paths. No replay. [New design](decisions/P15-monster-charge-attack-v1.md)
and BUG735precede implementation:100%Attack plus base through ordinary damage.
Shared Charge changes;formal balance/first-clear acquisition/mitigation stay open.
No broad tests,new agents,CI,commit,push or user hold. Fullv1active/incomplete.
