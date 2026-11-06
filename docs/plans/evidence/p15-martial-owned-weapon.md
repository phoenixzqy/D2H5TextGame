# P15 — Martial owned offensive claw preparation

2026-11-03. [Decision](../decisions/P15-martial-owned-weapon-v1.md),
[BUG664](../../../production/bugs/BUG-664-martial-owned-claw-selection.md).

The intended Martial profile now uses the existing physical-offense-v1 policy
from JSON level1, retaining claw affinity and native eligibility. The original
all-stat predicate rejected an eligible Greater Claws because replacing a
socketed Wrist Blade loses4MagicResist, despite physical expectation improving
278.710037→329.673792. Production combat/equipment formulas are unchanged.

## Verification

- All39affected equipment regressions pass, including level1/49 tradeoffs,
  stronger nonclaw rejection, base requirements over ilvl, lower-offense refusal,
  custody/resources and idempotence. Scoped strict TypeScript and explicit
  two-path zero-warning ESLint pass. No broad suite or campaign replay.
- One prospectively bounded native preparation from the original49/next708save
  uses26staging transfers, one retrieval and one equip:28native actions. It
  selects the diagnosed owned claw it-3k9m-eh6. The second call changes no bytes.
- Native Attack268→291, LifeMax987→1019, ManaMax500→527, MagicResist50→46,
  CritChance0.10→0.15 and CritDamage2.19→2.46. Combat-unit mastery projection
  gives Attack274.7→298.275 and CritChance0.105→0.155.
- Separate Python readback reconstructs the whole save after every native
  action, checks signed comparisons/ranking/cadence/crit math and verifies all
  394owned items. Current Life140/Mana87, costs, quests, level, ordinal and
  failures persist. No combat, time advancement, rewards, training or healing.
- All2159production and133campaign inputs authenticate unchanged during the
  native check. Original failed import occurred before main/zero comparisons;
  it and REDs, first GREEN offhand-resistance expectation error and first lint
  error remain retained. Corrected final runs pass; no suppression added.

## Required evidence and limits

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-martial-owned-weapon-v1

Original export SHA256:
e1888fb3b5f58b9a7d52bfb1a39c018ca88113e10ada1956c90faaee1d47cd4d.
Successor export SHA256:
88fde2d43c6c72b887bcc71221f0b0f84899214a48b9a009c10cd96305699e37.
Prospective native plan SHA256:
54c5f071d6642f6155f931a51844e0bde330f9dc00737a43557b3d12b7263f84.

martial.json, martial.native-export.json, martial-readback.json and the complete
launch/log/exit records retain the native transitions and source manifests.
Readback is root accounting verification, not independent final QA. Preparation
success proves neither boss viability nor acquisition odds, pacing or population
balance. No earned clear or accepted balance cell is added:14ActI/3Normal/0of210.

The earlier paired-finisher diagnostic remains rejected: three exact controls
and three candidates, two Izual draws and one pack win, no adopted order or
additional retries. BUG652 remains Open and attempts705–707 remain exhausted.

closure.json verifies recorded processes terminal, packet caches absent and
exact disposable tsconfig.json removed after equality with tsconfig.archive.json.
Root retains this required packet and human2 through umbrella review, and owns
eventual cleanup/release. Shared caches and all source/evidence remain preserved.
