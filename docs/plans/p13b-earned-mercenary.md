# P13b — ordinary mercenary progression and visible earned stats

Status: producer/root plan review APPROVE, depends on reviewed P13a integration.
Root owns this control,
runtime/UI regression, dedicated production acceptance spec/config change,
BUG027 and evidence. Do not edit P13a-owned runtime/tests until its worker has
finished and released ownership. This does not settle D10/D11 or full P13.

## Scope and smallest fix

QA source inspection found MercCard shows def.baseStats while its level/XP are
live. The card must show the owned merc's current core strength/dexterity/
vitality, including earned gains and mercs without a known definition. Keep
layout, labels, portraits/lore/skills and equipment calculation unchanged. This
is a core-stat display, not a new promise to show equipment-adjusted totals.

Before runtime edits, reproduce through real mercStore threshold crossing in
the mounted component in a separate live-stats regression file; an explicit
canonical304XP progress entry isolates this display defect from P13a. Retain
genuine failed UI assertions in BUG027 with
build/environment/steps/expected/actual/owner. Then bind existing stat cells to
owned coreStats and prove they update without remount. Keep level/XP/fielding
regressions, including P13a missing-progress fallback. No stat-gain/XP curve,
hire cost/eligibility, skill, combat, save/schema or data changes.

## Ordinary production acceptance

Extend tests/pwa/playwright.config.ts discovery with one explicit new spec;
keep the existing offline spec/config oracles intact. A fresh guarded no-bridge
production build and no server reuse are required. en/zh-CN at1280×800/360×640,
fresh contexts, ordinary Druid creation and locale selection. Use one fixed
browser Date before creation to make run seed/save comparisons reproducible;
native timers remain live. No imported save, store/bridge/storage write,
injected lifecycle, forced input, boosted hero, manual XP or soft balance skip.

Ordinary ActI InnerSight hire starts L3 with core12/22/16/14 and life148 and
auto-fields. Verify actual fielded
state and ordinary unfield/re-field controls, baseline XP0/304 and real export.
This current immediate/free hire proves obtain/field, not earned-currency
recruitment. Both D10 economy and its faucet/sink/pity paths stay unaccepted.

Source-derived candidate: stock Druid Firestorm plus L3 merc should win the
first BloodMoor trash wave on three runs (fresh ordinals0/1/2). Expected authored
first-wave counts8/9/10, allL2: hero awards160/180/200, merc shares120/135/150.
Assert first-wave monster count from displayed representatives plus their +N
stack badges, rather than treating card count as monster count. Compact cards
do not show levels; authored L2 is the source oracle, checked through literal
hero XP deltas160/180/200 as well as merc progression. Use ordinary Skip,
require displayed enemies dead and original hero alive, then numeric wave2. Use
ordinary Pause while playback is incomplete and require aria-pressed=true,
followed by ordinary Flee. Pause before Skip is ineffective because Skip resumes;
new waves also resume. Complete exported progress120/304,255/304,101/527 rejects
any accidental second-wave award. Use bounded waits/action timeouts and fail
on missing victory/progress; do not retry losses or adapt the oracle to output.
This route is source feasibility until browser execution confirms it.

After each earned award, show exact level/XP in Mercs UI and assert expected
runtime progress via ordinary export. Final L3→L4 includes exactly one rogue
gain: strength+1,dexterity+3,energy+1,lifeMax+8, vitality unchanged, and residual
101/527. Require live card strength/dexterity/vitality match those gains. Record
complete postcombat expected merc state and whole-save baseline. Ordinary Save,
readonly actual IDB equality and actual same-clock reload retain full exported
save, locale, merc/fielded identity, XP/level/stats and localized card. Preserve
unknown/unrelated saved fields; no schema edits. Require no bridge/overflow/page
errors. Delete downloaded backups after reading.

## Validation and limits

Run genuine UI RED then related/fast, full U/T/L/build plus forced PWA spec/config
lint. Run the four-case real production matrix once source is ready; a harness
failure requires diagnosis and a new truthful attempt record. Independent
source/test/evidence review before commit. Record exact artifact/process cleanup
and timing-budget misses. A first-wave Flee protocol proves qualified earned
XP and persistence, not area completion, balance, campaign pacing, merc damage
contribution, economy/fullP13, all seven classes or any fullG0–G7 gate.
