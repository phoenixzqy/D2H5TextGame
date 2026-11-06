# P15 intended corpse-and-curses rotation v1

Status: level-six allocation verified; universal CE-first order superseded by
[P15 defensive-curse priority](P15-intended-defensive-curse-priority-v1.md).
Historical diagnosis below is retained; earned viability remains pending.

The original intended Necromancer puts Bone Wall and curses ahead of Corpse
Explosion. Native fixtures demonstrate that those actions delay the first
eligible cast after a real kill. Corpse Explosion now comes first in this
intended profile's JSON priority, retaining the relative order of defenses,
curses and Teeth. Historical profiles and production data remain unchanged.

Use a natively created and allocated hero with supplied fixture XP. Construct
two living primary enemies with unequal health, so a real allied kill can leave
a surviving target. Levels6/12 use the hero alone; level24 includes the same native
initial Inner Sight Rogue as intended campaigns, without extra growth or gear.
No injected corpse, pre-applied damage, resource refill or
engine override. Require the next eligible action after that death to cast CE,
with finite corpse consumption, positive fire damage and paid mana. Verify the
empty-pool opening uses an eligible non-CE action. These are policy fixtures,
not earned acquisition, campaign, balance or pacing evidence.

Plan review: ready for a focused native-policy diagnosis. If the scenario does
not demonstrate delay, retain that evidence rather than changing the order on
assumption. Run only the affected role/growth cases and scoped strict types/lint.
Security check: pass; local evaluation policy/test/documentation only, with no
dependency, credential, network, CI or publication changes.

Initial diagnosis: level12 renews Amplify Damage after the hero's first kill.
The original level24 solo fixture never makes a first kill; adding the declared
native companion tests the actual campaign policy. Retain the solo failure as a
limitation: prioritizing CE cannot create its first corpse, and this change does
not establish solo or companion-loss viability.

## Level-six allocation correction

Fresh pilot v1 stops at level7 without learning CE: optional Weaken/Dim Vision
targets consume points before it. The original generic test allows signatures
two levels after unlock. A new exact level-six assertion fails during sequential
growth, while the batched level-six native combat fixture passes. This shows
why batched final-build coverage cannot establish earned sequential acquisition.

Move only the first CE rank target before Weaken/Dim Vision, after the existing
Teeth/Bone Armor/Amplify targets. All prerequisites and native point conservation
remain valid. Six selected cases pass: CE real-kill/corpse/mana/damage at6/12/24,
Necromancer sequential and batched growth, and fourteen-profile registration.
See BUG-604 and the retained allocation RED/GREEN evidence. A new pilot must
freeze fresh inputs and retain the original failed history.

The independent v1 journal reader initially missed42Fallen Shaman resurrection
consumptions. Its correction checks each native action, consumed body and revive;
the complete v1 readback now passes. No production corpse mechanic changed.
