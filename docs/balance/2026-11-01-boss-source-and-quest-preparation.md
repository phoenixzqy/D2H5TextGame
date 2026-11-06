# Chapter-boss source review and native object preparation

Status: CONCERNS. Review all70 build/act boss slots against exact saved quest
history. Fifty-five inputs now have a tracked pre-victory boss row and completed
quest prerequisites. This is source/preparation progress, not accepted power,
first-attempt history, retries or balance. No new combat or production change.

## Correct the history boundary

The checkpoint index's `clearedActs` lists acts containing **any** cleared
area. It never meant chapter-boss victory. The preceding Martial report used
that summary too strongly. Its actual save has four ordinary Act I clears,
no Catacombs clear, false `obj-kill-andariel`, and no victory/Claim receipts.
[BUG555](../../production/bugs/BUG-555-act-clear-boss-provenance.md) records and
corrects the evidence error. The source is pre-victory; its two successful boss
observations remain4.368/6.552s, below the proposed20–50s boss band. Do not
infer first-ever attempt, no earlier partial area income or full gear provenance
from absent victory flags.

Retain the original index, native trials, v1 decision and closed artifact pins.
`p15-martial-act1-owned-adaptation-decision-v2.json` supersedes only the incorrect
boss-history interpretation. `bug555-prior-martial-report-v1.md` retains the
exact preceding report. No game save or combat was repaired or replayed.

## Exact source and gate review

`p15-build-act-boss-history-v1.json` authenticates373 existing exports and projects
each canonical boss's exact area clear, kill objective, Claim and native victory
receipts. Ordinary area progress stays separate. It finds58 tracked pre-victory
cells; the other12 do not contain such a row in the existing index. All68 old
catalog selections are either tracked pre-victory58 or untracked/unknown10,
with two missing sources. None is rejected as a boss win merely from an act clear.

`p15-build-act-boss-source-review-v1.json` decodes/restores those58 sources with
current production code, verifies owned act access and checks authored objective
ordering plus native Guardian/Act IV/Act V admission predicates. It plans the
canonical boss at seed1 and the actual source ordinal, forecasting preceding
victory XP without simulating combat. Forty-six already meet the quest gate;
twelve need explicit quest preparation. Source validity and ability to earn
quest credit are distinct from the ability to start an ordinary area battle.

| Act | Tracked pre-victory sources | Ready before actions | Ready after actions | Preparation still needed | No tracked source in index |
| --- | ---: | ---: | ---: | ---: | ---: |
| I |13|13|13|0|1|
| II |13|10|13|0|1|
| III |13|10|10|3|1|
| IV |14|8|14|0|0|
| V |5|5|5|0|9|
| Total |58|46|55|3|12|

The three unresolved Act III sources are Summon Necromancer, Double Swing
Barbarian and Summon Druid. Nova has no tracked pre-victory source in Acts I–III.
The nine Act V index gaps are Bow/Javelin Amazon, both Necromancers, both
Barbarians, Zeal Paladin, Trap Assassin and Summon Druid. These are retained
source/preparation limitations, not missing gameplay features or external holds.
Do not replay completed campaigns solely to manufacture missing journal inputs.

The five available Act V sources already own Throne-wave credit and use ordinary
plans (`questSourceProjection: null`). They do not reconstruct the original
five-wave quest-source battle or its carried party resources. Boss levels in
the retained plans are19/32/47/61/82 across the acts; the hero sources retain
their actual earned levels. Recommended power and original first-attempt
context still require review; bosses are not classified as matched-level trash.

## Native preparation without combat

Before execution, freeze the twelve not-ready sources and a bounded policy:
visit the authored object location; assemble an existing Staff/Will only if the
native status is ready; insert the owned Staff or execute the available Orb
action; separately interact with each remaining Diablo seal. No recovery,
Claim, drops, farming, points, resets, gear, merc or ordinary currency/material
changes are permitted. All state transitions use existing production actions.

`p15-build-act-boss-preparation-v1.json` completes33 actions in7.845wall seconds:

- Bow Amazon, Double Swing Barbarian and Summon Druid each insert their already
  owned Horadric Staff. Each local branch consumes that quest-tool receipt and
  sets its real tomb-open flag. No assembly or new component is needed.
- Bow Amazon, Double Swing Barbarian, Holy Bolt Paladin, Javelin Amazon, Martial
  Assassin and Summon Druid each activate three separate Diablo seals.
- The three Act III sources visit Travincal, but Will assembly and Orb action
  are both unavailable. No action is forced and no prerequisite is injected.

These are twelve visits, three Staff insertions and eighteen seal interactions.
Nine local fixture branches become quest-ready. Native exports preserve every
other byte-equivalent save field except declared navigation and exact quest
transitions. Level/XP, all ordinary items/equipment/materials/currencies, points,
resets, mercs, formation, offline/meta state, clears and ordinals are unchanged.
The three Staff consumptions belong to three different fixture branches.
Authoritative earned route exports and the historical roster remain unchanged.

## Verification, artifacts and next action

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `p15-build-act-boss-source-readback-v1.json` separately audits all373 exact
  exports,70 selections,58 current decoded sources and46 initial gates. Five
  regression controls distinguish ordinary area clear, exact boss clear, kill
  flag, Claim and victory receipt. It takes11.874s; metadata extraction14.011s
  and current native review11.675s. These readers are author checks, not
  independent reviewer/QA approval.
- `p15-build-act-boss-preparation-readback-v1.json` checks each entire native
  export against its original plus only the declared transitions. All12 match
  exactly; nine become ready. No battle, reward or broad test suite is needed.
- Final drivers pass scoped strict types and focused no-any/unused lint. All2091
  production inputs remain unchanged at source hash
  `3ec0567f2eb3b29ecdc4d929d0e24b16d7bef11d5cfa84965860f9c24f3bd82c`
  and data hash
  `7dccbccb569f547fd595137e50e3f29795e7d0f53cb86dd2347ede8277ff4c1c`.
  Reuse210 BUG552 and112 BUG553 checks.
- `p15-build-act-boss-source-overlay-v1.json` binds all70 dispositions to exact
  original/prepared sources and existing native plans. It supplements immutable
  recipe overlay2;61matched/75unmatched/68boss-review/6missing stays unchanged.
- Closure: `p15-build-act-boss-source-artifacts-v1.json`. Two disposable configs
  archived/removed, both task Vite caches absent, all owned processes terminal.
  Root retains required evidence and the live human2 claim for umbrella work.

Next use the55 quest-ready inputs for intended gear/power and first-attempt
policy review before any new exploration. Keep the three unavailable Act III
preparations and12 index gaps explicit; use existing journals/checkpoints before
new acquisition. Preserve the fast Martial boss result and all earlier failed
controls. Do not count this source review as accepted boss coverage or silently
substitute a later retry for an original first encounter.

All14 historical routes remain complete; accepted balance cells remain0. Full
213skill/build/210role acceptance,22 historical area gaps, disjoint holdouts,
economy/fairness/30–50active-hour pacing and final integration/mobile/locales/
a11y/PWA/endgame/save stability/soak/review/owner playtest remain open. Browser
works; CI excluded; no pending answer/external blocker. Goal remains active.

## Earned Act III follow-through — 2026-11-01

The original table is historical. New bounded native acquisition completes the
missing Eye/Flail for SummonNecro and Flail for SummonDruid, then native Will/
Khalim Claim/Orb. Two new tracked pre-victory sources bring current accumulated
quest-ready inputs55→57; DoubleSwing remains the one unready source among these
three. Original indexed58pre-victory source rows and12untracked gaps stay intact.
No old campaign is replayed to manufacture a missing journal.

The two new sources pass current native gear/rank gates. Subsequent actual
Durance attempts retain Druid Mephisto victory28.480s/Guardian completed-unclaimed
and Necromancer wave4prefix draw. Barbarian's native free defensive reset retry
still dies; exact residual529preserves both prefixes' rewards. Original55source
and110explicit-seed reports stay immutable. Current supplement is
`p15-act3-boss-catalog-supplement-v1.json`; [report](2026-11-01-act3-quest-preparation-and-mephisto.md)
records all7native admissions/34waves, author audit/cleanup and remaining scope.
Readiness, a single native win and author readback do not prove recommended
power, acquisition/point history, independent/population/within-three acceptance.

## All three tracked Act III preparation gaps supplied — 2026-11-01

Owned hero armor lets Barbarian actual529clear Council and natively recover
Flail/assemble/Claim Khalim/break Orb. Exact24/XP185732/ordinal530pre-victory source
passes native gear/rank review. Current supplement2has58accumulated ready inputs,
covering all58tracked pre-victory slots in the historical source index. The
12untracked index gaps and original source/recipe/role overlays remain intact.

Subsequent native Durance530wins Mephisto25.668s; Necro's retained716successor
wins48.708s after owned Prayer gear and one free33-rank paid-support reset.
Druid's preceding28.480s result is reused. All3Guardian Claims remain unclaimed.
Exact income/item custody/quest/reset/carry author audits pass. These are bounded
new-seed owned recovery sequences, not recommended-power/acquisition/point-history/
population/within-three/independent acceptance. [Report](2026-11-01-act3-owned-recovery.md),
`p15-act3-boss-catalog-supplement-v2.json`; full private v1 remains open.
