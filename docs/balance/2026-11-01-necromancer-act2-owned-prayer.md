# Necromancer Act II: reject the owned Prayer tradeoff

The two retained Tomb cases do not recover with the owned Prayer head/belt
tradeoff and boss-only Amplify Damage. Seed1 improves to a60s draw with337
DurielHP remaining; seed8 regresses to a fourth-pack defeat. Stop this policy.
This is a failed conditional survival screen, not an accepted Bone build or a
reason to tune every bone spell. Production code/data and the user's save stay
unchanged.

## Owned projection and one preparation

Source:`p15-bone-act2-arcane-earned24-continuation-v1.json`, Necromancer24,
XP62882, ordinal242,29paid ranks plus one unused point. The current route is
corpse-focused; Bone Spear is unlearned. The pure owned projection checks322
unused items and complete eligible sets with native eligibility/stat derivation.
No guarded hero Physical-throughput improvement or complete eligible set exists.
The guard-passing Prayer change is a belt. A second, explicitly riskier head
trades flat MagicResist/Lightning for HP/Physical dodge/Fire/Poison.

Equip only Prayer's owned head`it-6qp98-6j7` and belt`it-8bgt2-4t`, once through
native actions, retaining the exact prepared export before battle. Combined
Prayer maxima become461HP/227MP, Defense244, MagicResist16 and Physical dodge
14.4%. No points, resets, core stats, hero gear, acquisition, currencies or
materials change. Both displaced items remain owned; exported equipment mirrors
are normalized against canonical merc equipment.

Keep CE>Weaken for the first three packs and Decrepify>CE for the next two.
Use only Amplify Damage at the boss, removing repeated Weaken casts to allow
more basic attacks. This combined change is a declared diagnostic; it does not
isolate the causal contribution of each equipment slot or boss policy.

| Seed | Reached | Result | Resource evidence |
| --- | --- | --- | --- |
|1|All five packs and Duriel|60s draw,337bossHP left|Hero447HP/259MP and Prayer461HP at boss; final hero447HP/271MP; min bossMP249|
|8|Fourth pack|Hero dies at3.810s; Prayer already dead|Hero enters227HP/226MP; min fatal-waveMP211|

Seed1 pays20AmplifyDamage and makes58basic attacks; raw direct hero/Prayer
damage17111/8152. Seed8's preceding carry is worse despite the larger Prayer
HP pool. Mana is sufficient in these failures. Neither case qualifies; retain
the failed outcomes and do not extend this equipment policy or repeat preparation.

## Verification and closure

Projection and native driver pass scoped strict types/lint. Native execution
attempts two areas/ten waves in8.244process seconds. Separate readback verifies
the complete expected post-equip save, canonical item custody and displaced
items, normalized hero/merc mirrors, actual derived merc stats, unchanged
points/core/hero gear, native plans/events/payments/carry/rewards. Eight altered
point/item/merc-stat/payment records are rejected. No combat runs during readback.

Authoritative files:`p15-necromancer-bone-act2-owned-projection-v1.json`,
`p15-necromancer-bone-act2-owned-prayer-v1-prepared.json`,
`p15-necromancer-bone-act2-owned-prayer-v1.json` and
`p15-necromancer-bone-act2-owned-prayer-readback-v1.json`.
Closure:`p15-necromancer-bone-act2-owned-prayer-artifacts-v1.json`: seven
terminal/pass receipts, four configs archived/removed, two gzip-equivalent
partials removed, two caches absent and no owned process alive. Retain all
source/prepared exports, raw failures, specs, drivers, readers and receipts at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains this shared evidence until full-v1 consumers finish, then removes it.

Current source/data remain
`c40ea546cb3459ca8e8148fa19542ea68d7c3dcbf4456955084e199bbafb640d` /
`7dccbccb569f547fd595137e50e3f29795e7d0f53cb86dd2347ede8277ff4c1c`.
No broader suite, resolved/earlier-act combat, browser replay, agent, install,
commit, push or publication. Full-v1, intended-power/identity/acquisition,
population/holdout/economy/pacing and integrated acceptance remain open. No
pending question or external blocker; browser works and CI stays excluded.

Next separate the missing source/role fixtures from this rejected gear control.
Recover Nova's pre-Claim inputs from retained campaign artifacts if possible,
without repeating campaign combat. Do not prescribe a Bone-spell growth change
from an unlearned spell, a restrictive pure-Spear pack policy or this failed pair.
