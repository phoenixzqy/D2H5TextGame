# P15 — Earned caster and summoner Act II continuations

2026-11-05. Two one-shot native continuations from the previously qualified
Act I sources are terminal. Their completed gameplay is retained and must not
be replayed for reporting. This evidence does not accept balance or active-hour
pacing. The preceding goal turn was status-only and made no implementation
progress; this continuation closes the verified diagnostic defects and records
the completed findings before selecting further work.

## Policies and outcomes

Historical stat/skill targets, priority, fielded Inner Sight Rogue and paid
socket custody are preserved. Prospective policies explicitly add
`owned-build-v1`, `monotone-fielded-v1` and `owned-shortlist-v2`; profiles are
therefore not wholly unchanged. Neither branch hires Prayer, resets skills,
adds sockets or receives free preparation. Each frozen plan permits one launch,
at most100admissions,7,200,000combatms,90,000wallms and64MiB journal; ancestral
admissions/combat and execution reservations remain charged. These budgets and
the per-area three-attempt limits are not renewed by this report.

| Source | Gameplay outcome | Level | Admissions / waves | Wins / defeats | Recovery admissions | Branch combat |
| --- | --- | --- | --- | --- | --- | --- |
| Fire Sorceress | Nonwin: Dry Hills three attempts exhausted | 13→16 | 56 /221 | 217 /4 | 51 | 24.51min |
| Summon Druid | Act II complete, all five Claims once | 13→15 | 6 /32 | 32 /0 | 0 | 4.30min |

Fire clears Rocky Waste on its second attempt at14, then loses Dry Hills at
14/15/16. It gains229,560XP and1,773items, with1,646salvage removals and no new
sockets. Its saved-next Normal ordinal is167. Druid gains179,367XP and275items,
with150salvage removals and no new sockets; saved-next ordinal116. Combined
historical combat is2.35727h for Fire and1.528509h for Druid, excluding human
reading, decisions, menus and AFK/offline time.

Druid defeats Duriel in33.840s. Hero minimum466/526HP(88.59%), final492; boss
incoming damage3,784is distributed60to hero,24to Rogue and the remainder to
summons. Eight Spirit Wolves provide most outgoing damage; Rogue direct share
3.1663%. This single lineage is not a paired or population challenge result.

## Fire diagnosis and next decision

Fire's four defeat-wave minimum Mana values are298/306/315/323; these samples
do not indicate mana starvation. Most direct incoming damage is cold/lightning
from Horror Mages; physical hits are largely at the one-point floor. Carried
poison also contributes. The general pressure reader only reconciles life on
Duriel waves, so its passing result does not independently reconcile Fire's
defeat HP. Do not equate damage-event sums, which include overkill, with life
lost or assume a missing spell-execution defect.

This profile retains starter Fire Ball8/Blaze5 targets, unlike the current
intended growth profile. Its monotone equipment selector rejects a candidate
whenever any compared field decreases. Actual owned boots `it-54xyd-2vg` offer
cold+13/lightning+18/physical+10/Mana+35 and both dodge chances+3percentage
points, but cost21Defense,10attack speed and10fire resistance. These are real
tradeoffs; reporting only their resistance gains would overstate the case.
The shared intended survival selector also preserves entry speed, so these
boots are not proof that its existing policy will select them.

The subsequent owned-adaptation inspection below is complete. It does not
establish a production monster defect or a changed combat outcome. No gear or
points were granted, Act I replayed, historical outcome changed, attempt
accounting reset or balance cell accepted.

## Native owned adaptation, without combat

`caster-owned-adaptation-v1-plan.json` prospectively permits zero admissions
and zero combat. The one completed native launch restores Fire's exact terminal
save and applies the existing mixed-threat survival equipment selector, then
spends only four already-owned skill points against current intended growth.
Six owned armor/jewelry choices increase Life capacity446→487, magical dodge
10%→26%, cold resistance8→27, lightning27→32, arcane19→64, physical23→39 and
poison31→46. Attack165 and speed150 stay exact. Tradeoffs remain explicit:
Mana capacity345→339, Defense227→187, physical dodge17%→10%, fire resistance
59→50 and critical chance10%→9%. The fixed mixed-threat equipment score improves
−0.09951494768→−0.06052618070; this is a projection, not a victory claim.

Four native allocations raise Fire Ball8→12 and available points4→0. No reset,
reward, purchase, hire, crafting or socket action occurs. Existing learned
ranks, core stats, combo, mercenary, sockets, item payload custody, map/ordinal,
quests, currencies/materials/XP and outer realm restoration are checked.
Persistent stored Life120/Mana102 stay exact; they are not the defeated
combatant's terminal resources. Native captures decode exactly.

The passing report/journal are `caster-owned-adaptation-v1.json` and
`caster-owned-adaptation-v1.journal.jsonl.gz` in the same retained packet.
Scoped strict types cover888files with zero diagnostics; explicit external-script
lint and the native launch pass. The original typecheck-wrapper output-name
collision remains retained; the corrected wrapper passes without rerunning
gameplay. Source/campaign manifests remain stable during the inspection.
Fire's exhausted three-attempt Dry Hills sequence remains a nonwin. No further
combat budget is inferred from this equipment/point inspection.

## Verification and retained evidence

Root retains this exact packet through full-v1 acceptance, then removes it
after all consumers finish:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-caster-summoner-p59d92kj`

Both native reports/journals/exports, source manifests, frozen plans, ancestry,
profiles, drivers and exclusive command receipts remain. Fire reward/save
reader v2 and analysis v2 pass; Druid reward/save reader v1 and analysis v2
pass. Each readback includes nine negative accounting and seven mercenary
carry controls. Native source-stability checks passed before the subsequent
two-file audit correction; their frozen manifests are not rewritten.

[BUG741](../../../production/bugs/BUG-741-act2-audit-selected-farm.md) corrects
the audit's selected-farm continuation metadata. The two regression cases fail
before the correction;173affected cases pass afterward, scoped strict types
cover964files/zero diagnostics and explicit two-file lint passes.
[BUG742](../../../production/bugs/BUG-742-retained-life-capacity-analysis.md)
corrects the external Druid pressure reader to account for explicit capacity
events and passes its capacity/orb corruption controls. Original failures stay.
Neither correction is a production gameplay fix or independent final QA.

Counts remain14/14intended historical Normal completions,210/210supplemental
checkpoint sources and formal balance0/210. Acquisition/economy/30–50active-hour
pacing, difficulty/endgame, broader browser/mobile/a11y/performance/PWA/soak and
independent acceptance remain incomplete. Browser works; CI is excluded and
owner playtest follows implementation. No user answer or external hold applies.
