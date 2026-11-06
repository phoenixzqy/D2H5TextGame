# Cold Sorceress: owned-weapon audit and rejected Ancients diagnostic

Verified 2026-11-04. BUG643 remains open. The highest-ranked owned weapon
does not meet the declared living-hero victory condition. No equipment policy,
skill order or production behavior is changed. Counts remain **5/14** intended
five-act Normal completions, **14/14** Act I and **0/210** formal balance cells.

## Read-only audit

The immutable terminal source is `p15-cold-direct-act5-suffix-v1.native-export.json`,
level73/next1225, SHA256
`4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a`.
Its source closure is `verified-partial`; the referenced readback passes.
The audit compares140eligible owned weapons with zero combat, admissions or
native mutations. `attackSpeed * (1 + critChance * (critDamage - 1))` is a
descriptive comparison scalar, not DPS or a prediction of victory.

Top Rogue's Bow `it-26bh9-dax` raises the scalar148.1→183.644 and speed125→155,
while mana maximum falls770→746, defense428→383 and magic resistance32→28.
It also loses18elemental and8arcane/physical resistance. The generic all-stat
nondecrease selector rejects those tradeoffs. This alone establishes no defect.

Initial audit fails before decode/comparison because it assumes the wrong
closure shape. The corrected audit reads `verified-partial`/`receipts` and the
passing readback. Original failure3187.573ms and corrected4097.807ms are retained.

## One gear-only diagnostic

Exactly one retained battle is consumed, with zero native admissions, training,
seed search or priority changes. The previous exact control is authenticated
from retained events/full final parties without rerunning it. Relative to that
control only `SkillsScreen.tsx` differs; combat production inputs are unchanged.

The driver restores the immutable source into isolated stores, retrieves/equips
the audited bow through native inventory actions and checks conservation of
economy/other save domains. `playerToCombatUnit` supplies all changed projection
fields: delivery, equipment speed, weapon, mana-regeneration baseline/current
and stats. Other retained hero/enemy state is preserved; entry mana750 is capped
at the new native746maximum. Ancients ordinal1224/wave4 uses seed366338786.

| Measure | Candidate |
| --- | ---: |
| Outcome | Draw at60000ms |
| Living enemies | 3 Frozen Terrors,292/213/424HP |
| Hero HP/MP | 1289/746 |
| Static Field / Blizzard / Frost Nova casts | 16 / 9 / 7 |

Candidate rejected. No earned successor, adopted fix, renewed retry/training,
pacing or balance credit. The terminal lineage remains73/next1225. This packet
is closed; do not tune or replay it. Production/campaign manifests remain stable.
Launcher5398.777ms; internal diagnostic1011.104ms; exit0.

## Retention and cleanup

Root retains these required packets through umbrella review and owns eventual
cleanup:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-owned-audit-63c5g38c`
  (including original failure and corrected `execution-v2`). Closure SHA256
  `9328fe50cc907a28ef56f59fdc733531641e1e51ad696b6e4a1eaa380986a201`.
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-owned-weapon-diagnostic-scc4wktu`.
  Closure SHA256
  `ff918ceccfb672e13ca81f3552848fdc3bd57ef74c3a84820b09808bce34d084`.

All six wrapper/child PIDs are absent; exact audit/diagnostic caches are absent.
Remaining disposables and cleanup failures are empty. No build/browser was
created. Recording these results requires no further combat or test replay.
