# Crystalline defensive-order diagnosis, 2026-11-03

The retained three Crystalline W1 defeats are caused by losing the physical
first-kill source under the current prepared order. A nine-battle, prospectively
frozen comparison changes only learned hero skill order on the exact original
teams, resources, statuses, cooldowns and seeds. Every baseline event and both
complete final teams match the original records.

| Learned order, then physical fallback | 1591 | 1592 | 1593 |
| --- | --- | --- | --- |
| Amplify → Corpse Explosion | Defeat46.320s | Defeat32.400s | Defeat45.360s |
| Decrepify → Corpse Explosion | Win46.579s | Draw60s | Draw60s |
| Dim Vision → Decrepify → Corpse Explosion | Win48.155s | Win52.411s | Win57.611s |

The winning order preserves hero1259Life/806Mana and mercenary695/694/616Life.
Dim Vision's physical blindness and Decrepify's damage/speed reduction coexist
under current curse semantics. Bone Wall protects only its caster. No engine
formula, mercenary XP threshold or granted gear is selected for change.

A separate zero-battle appraisal projects eligible owned armor with unique,
conserved custody and exact native baseline stats. Its nominal physical453/
arcane145 score omits the monsters' Amplify curse and critical damage, and its
favored alternatives lower physical resistance66→46. That score does not
justify changing equipment; retain it as limited appraisal evidence only.

Implementation decision: replace only the intended corpse profile's Crystalline
area order with `necromancer.dim_vision`, `necromancer.decrepify`,
`necromancer.corpse_explosion`. Other areas retain their declared orders.
Preparation and recovery must preserve allocated-rank authority and complete
native state except combo order. Crystalline does not declare Amplify, so draw
recovery must not introduce it. Verify the affected regression cases, scoped
strict types and explicit lint before any native continuation.

This is isolated diagnosis, not native campaign or population acceptance. No
admissions, rewards, saves, retries or earlier-act replay occurred. Nine battles
cost448834.7311890575logicalms and913.581137wallms; carry those costs forward.
The original terminal controllers1459/1505/1594 remain exhausted. Any subsequent
native comparison needs its own prospective declaration, authenticated pre1591
checkpoint, historical cost carry and original ceilings; completed training is
not replayed. Full privatev1 and formal balance0/210 remain open.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Stems `d02-crystalline-defense-diagnosis-v1` and
`d02-crystalline-owned-appraisal-v1` retain plans, drivers, launchers, results,
logs and process receipts. Both processes are terminal and exact caches absent.
Root retains required evidence and human2 through umbrella review and owns
eventual cleanup/release. Browser works; CI excluded; no user answer is needed.

Implementation and affected verification are complete locally. The JSON change
is confined to Crystalline's three-skill order. Eleven distinct affected cases
pass: ten in the first green run, then only the corrected unlearned case. The
first expectation confused stored priority with learned executable authority;
`setComboOrder` retains unlearned Dim Vision, while native combat projection
excludes it. The corrected test checks both layers and whole-state conservation.
Final scoped strict types and explicit unignored lint pass after that correction.
Receipts use `d02-crystalline-defense-recipe-v1-*`, including retained red/failed
green evidence. All processes are terminal; its exact cache is verified absent.
No native campaign continuation has run under this recipe yet. BUG611 stays open.
