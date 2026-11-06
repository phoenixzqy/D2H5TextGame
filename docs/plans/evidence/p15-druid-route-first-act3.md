# P15 — Earned Druid route-first Act III diagnostic

Status: completed diagnostic, nonwin; not balance or pacing acceptance.
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, frozen actual source bytes in
the retained packet's `authority.json` and `campaign.json`. No production
tuning changed for this diagnostic. Previous status turn made no progress.

## Source and execution

Continue the exact earned Act II successor from
`d2-act2-caster-summoner-p59d92kj/summoner-route-first-v1.native-export.json`
under the same zai-temp root: v33, level15, Normal next116, SHA256
`78a9ed1683256ab0d40ed8fa820ec55ae4616ba89b939798f3628bb8c25b79cf`.
Keep Wolf then Raven priority, +2Energy/+3Vitality per level, Raven1/Oak Sage1/
Wolf20 targets and the existing Inner Sight Rogue. No grants, resets, hires or
new sockets. BUG747's route-first policy admits each new area before training;
settled losses permit bounded level+1 recovery and at most three area attempts.

One prospectively budgeted native launch completed: 19 admissions, 92 waves,
89 victories/3 defeats, level15→18 and Normal next116→135. Five route admissions
and fourteen recovery admissions cost 507535.55999556 combat ms (8.45893min),
305242 XP, 670 items added/629 salvaged; no Act III Claims. Full ancestry remains
charged: 135 admissions, 1.6694911184345056 combat hours and 1110000ms reserved
execution allowance. Combat hours exclude human decisions/menus/AFK/offline
and do not establish active-hour pacing.

| Area | Outcome | Level | Admissions |
| --- | --- | --- | --- |
| Great Marsh | First-entry win, 5 waves/41.860s | 15 | 1 |
| Flayer Jungle | First-entry win, 6 waves/50.664s | 15→16 | 1 |
| Kurast Bazaar | Three losses; sequence exhausted | 16/17/18 | 3 |
| Dark Wood recovery | 70 victories/288.752s | 16→18 | 14 |

## Defeat findings and limits

| Normal ordinal | Entry HP | Duration | Effective incoming HP | Minimum Mana |
| --- | --- | --- | --- | --- |
| 118 | 433 | 6.320s | physical363, cold45, periodic25 | 323 |
| 122 | 555 | 23.660s | physical572, thorns11, lightning28, fire2, periodic4; orb62 | 330 |
| 134 | 502 | 11.060s | physical455, poison4, periodic71; orb28 | 337 |

Physical pressure dominates these defeats while Mana remains available. Some
summon deaths coincide with the hero-death cascade; these logs do not prove all
bodies died before the hero. One paid batch per wave follows
[D06](../decisions/D06-druid-summons-v1.md); ordinary resummoning is explicitly
excluded. No monster defect or tuning conclusion is established. Periodic
events lack source/type provenance, so their HP remains explicitly unattributed.
Do not renew this sequence or replay the earlier acts.

## Verification and custody

Separate `readback.py` passes all92settlements, source pins, ancestry, seeds/
ordinals/clocks, item/currency/material/XP/point custody, recovery/retry policy,
merc carry, quests and exact native export. Nine accounting and seven merc
corruption controls reject. `analysis.py` reconciles HP across all92waves,
including capacity changes, healing, direct/periodic damage and overkill; five
corruption controls reject. This is diagnostic root self-review, not independent
population acceptance. Native preflight's scoped strict types pass.

Retained SHA256:

- readback: `820e6f00c12923f2801b3aeb953e6d9ca52fd3e5b4cab6c5752aca334525bb3d`
- report: `e59293cd3e0343bfe7b79d8859fceab2f2477ee78677112869c4d26e148305f0`
- journal: `60cb1707acba810fea179b3a9580e6ed7584cc3583395b3ce24e7d4382cc0d6f`
- export: `ccb9d39557840121a764730cc4019a9187add54c3476fb60cec942147e2b9356`

Before subsequent source edits, closeout rehashes all2253production and
136campaign inputs, detects additions/removals, verifies plan pins and retained
outputs, and confirms task PIDs107272/107317/107485/107484 and the exact Vite
cache absent. No disposable directory remains. Security check passes: local
authorized diagnostic, no dependency/network/credential/permission/CI change.
No additional gameplay or broad test suite runs during closeout.

Root retains this exact packet through full-v1 acceptance, then removes it
after its consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-route-first-act3-1r7h9geh`.
`closeout.json` records source stability/review/cleanup;
`retained-inventory.json` lists exact files, sizes and hashes (excluding itself).

Historical counts remain14/14intended Normal completions,210/210supplemental
checkpoint sources and0/210formal balance acceptance. Natural pacing/economy,
fairness, difficulty/endgame and integrated app/soak/independent/owner acceptance
remain incomplete. Browser works, CI is excluded and no user answer is pending.
