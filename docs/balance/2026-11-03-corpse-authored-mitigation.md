# Corpse Explosion authored mitigation audit

2026-11-03. Analytical diagnostic only; BUG611 and private-v1 acceptance remain
open. All2,147 production inputs authenticate against the retained gear-ownership
source manifest before this audit. No combat, RNG, training, save changes, native
admissions or reopened experiment allowance.

The retained `ce-authored-mitigation-v1.json` contains777 archetype/reference-level
rows from all five monster catalogs at levels1/20/40/60/70/80/99. Each row treats
the archetype as ordinary tier, with native rounded Defense, capped authored Fire
resistance and mean authored grown life. These are explicit hypothetical levels,
not actual encounter/population distributions; boss archetypes are also treated
as ordinary for this formula comparison and do not represent boss fixtures.

At reference level70, CE20 has164–194 base Fire damage. Connected noncritical
hits with zero outgoing bonus and no curses/auras/affixes give:

| Archetype | Defense | Fire resistance | CE20 final damage |
| --- | ---: | ---: | ---: |
| Barbarian Savage |144|0%|20–50|
| Death Mauler |169|0%|1–25|
| Overseer |164|25%|1|
| Blood Lord |194|75%|1|
| Warped Shaman |154|0%|10–40|
| Succubus |159|0%|5–35|
| Frozen Terror |199|0%|1|
| Ancient Barbarian |304|25%|1|
| Baal Minion |204|50%|1|
| Baal |454|75%|1|

The six complete floors do not imply that actual critical hits, outgoing bonuses
or resistance-reducing effects always deal one. The prior equipped native
comparison, however, already failed its time limit and remains terminal.

Other authored cap-rank direct bases are Fire Ball2350–2380, Meteor1620–1670,
Holy Bolt2520–2540 and Fissure7660–7690. Different targets/cooldowns/passives
prevent treating these as a common DPS budget. CE retains its finite-corpse
opening requirement and cannot supply its own first kill.

This establishes a progression/calibration mismatch worth a new design decision;
it does not establish a damage-engine defect or select a coefficient. Do not
repeat rejected growth/body-life/order families or restart exhausted controllers.
Further rotation-only changes do not address this unmodified floor. Independent
measured UI performance work proceeds while a defensible progression correction
remains unselected. ActV13/19, formal balance0/210, full-v1 gates incomplete.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/ce-authored-mitigation-v1.json`
SHA256 `486830120d08262ca611ec3559d4423bb61bc820259b2f920e28afc6ab52ccb0`.
Root retains this required packet and the current human2 worktree through umbrella
review and owns eventual cleanup/release.
