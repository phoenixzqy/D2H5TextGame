# BUG-752 — Restore Diablo’s four-move chapter signature

Status: Fixed locally; independent/owner acceptance remains open. Severity: High (signature path unavailable; no player workaround).
Date: 2026-11-05. Owner: root, solo. Systems: content/engine/native chapter.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
Environment: Node/WSL pure engine; browser/viewport/locale independent. Seed13,
challengeOrdinal450. Synthetic durable controls are not earned campaign evidence.

## Reproduction

1. Load validated Chaos Sanctuary and resolve manual or idle native chapter plan.
2. Build the actual chapter boss using buildEnemiesForWave.
3. Record actions at native AS140 against a durable party.

Expected: §7 Fire Breath, Lightning, Bone Prison and Charge actually execute;
Fire/Lightning cone-five, Burn3 and Paralyze, native trap and physical Charge.
Actual: Inferno1380/5520/9660ms, basic attacks at other opportunities. The chapter
Inferno override discards catalog skills. Merely restoring generic skills would
also let their shorter priority cooldowns starve the later actions.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-signatures-z9esxw00/red-native.log
(two genuine manual/idle action-sequence failures before production mutation).
Regression: src/stores/combatHelpers.diablo-signature.test.ts.
Decision: docs/plans/decisions/P15-diablo-four-move-signature-v1.md.

## Resolution

Both native sources now select explicit cone-five Fire Breath/Lightning variants,
then existing Bone Prison/Charge; selected cooldowns prevent priority starvation.
All chapter stats/loot source preserved.24distinct selected cases pass; strict
scoped types602files/zero diagnostics and changed-file lint pass. Unsupported
immunity fixture and event narrowing/matcher issues corrected without production
casts/suppressions. [Final evidence](../../docs/plans/evidence/p15-diablo-four-move-signature.md).
Enrage/stun resistance and full-v1 balance/integrated acceptance remain open.
