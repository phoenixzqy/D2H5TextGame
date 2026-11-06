# P15 — Restore ordinary current-tier claw coverage

2026-11-05. Quick content-tuning decision for BUG790, following the existing ordinary sword/ranged/throwing/spear policies. Previous goal turn was status-only (no progress). Full private v1 remains the objective.

## Problem and exact change

Existing native claw bases require levels 1/8/22/32/50/60. In trash Act III, Hand Scythe (32) disappears after enemy 38; subsequent Feral Claws requires hero 50. Other ordinary tables omit current usable tiers too. Earlier Katar/Wrist Blade sources and higher claw sources exist; do not describe them as globally missing.

Within the 28 finite source envelopes already frozen for ranged progression, ensure positive availability of Wrist Blade 8–21, Greater Claws 22–31, Hand Scythe 32–49, Feral Claws 50–59 and Runic Talons 60–122. For each base/source, append only the uncovered intersection with that source envelope. Leave every already covered band alone. This yields exactly 49 new rows across 23 tables: five Greater Claws, 18 Hand Scythe, 11 Feral Claws and 15 Runic Talons. No Wrist Blade addition is needed. The independent fixture freezes every band, weight, preexisting count and the entire predecessor content hash.

Reuse each source's established `weightPerFamily` (one eighth of the pre-ranged ordinary weapon weight), with no forced rarity except existing quest-cache rare policy. These provisional economy weights need future acquisition/pacing acceptance. Existing eligible probability w/T becomes w/(T+W); preserving old rows does not preserve old selection probability. Material/currency table entries remain byte-for-byte unchanged but their relative selection weight can change.

## Preservation and acceptance

- Preserve all existing rows/order/weights/requirements, including already dropping higher-level claws; preserve every table field, treasure-goblin and fixed reward. Append only declared missing intervals, never duplicate an existing base at the same level.
- Reuse existing bases/stats/art/names, native loader/rewards, MF, equipment requirements and mastery. No save/schema/engine/UI/formula change or campaign equipment-policy change.
- Causal RED must demonstrate absent coverage. Final focused checks prove continuous current-tier availability, exact suffix rows and predecessor reconstruction, native positive selection/materialization and equip refusal below base level, Attack/mastery/shield custody at level.
- Update D08 and MF historical comparisons to peel back only this independent delta, keeping their original predecessor expectations and hashes intact. Run only the affected named tests plus scoped strict types/lint. Existing base UI is unchanged, so do not repeat broad browser/campaign acceptance.

Root owns this increment in retained human worktree 2. Preserve inherited preimages; no agents, installs, CI, commits, pushes, campaign/farming/retry admissions or renewed exhausted budgets. No recommended-power, earned acquisition, Act III outcome or 30–50-hour pacing claim follows from constructed checks. Root self-review is not independent final approval.

Plan review: ready; finite exact rows avoid overlapping old coverage and account for downstream preservation tests. Security check: pass; authorized local first-party JSON/test work without credentials, network, dependencies, permission or publication changes. Existing broad implementation authorization supplies routine content-tuning decisions; no pending user question.

## Result

Implemented locally: 49 frozen additions, all original content retained. The 91 latest distinct affected cases, final scoped strict types and explicit five-path lint pass. [Evidence](../evidence/p15-claw-progression.md) preserves initial tool/fixture failures and final results. No acquired-power, campaign or pacing acceptance is added; no full-v1 completion claim.
