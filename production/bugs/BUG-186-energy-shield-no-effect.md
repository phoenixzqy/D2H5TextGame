# BUG-186 — Implement advertised Energy Shield damage diversion

Severity: High. Status: locally fixed/verified; independent design/QA and earned balance remain open.
Owner: root / engine-dev + native integration.
Baseline:721ed13ebb82551988271d2605ec5e7e13f4ccec.

## Reproduction

Synthetic Vitest/jsdom native Player→combat boundary and real seeded battle, seed7.
Browser/viewport/locale: not applicable to this reduced engine reproduction.

1. Construct L30 Sorceress with Telekinesis1, Teleport1 and Energy Shield1 or20.
2. Use native projection, then a zero-defense/resistance/dodge fixture against100fixed physical damage.
3. Observe first HP damage and MP payment; compare ordinary projected MP recovery with rank0.
4. Repeat at rank20 with only10MP. Unlearned/foreign/locked/prerequisite-less controls accompany the test.

Expected under authored JSON:3%incoming damage diversion and2%ordinary recovery per rank, up to60%/40%; one MP per prevented HP and exhaustion spills to life. Actual:100HP damage, no mana payment and unchanged7MP/s at every rank. The fixed30%/L18 prose also conflicts with authored rank growth and requiredLevel24.

Evidence: src/stores/energy-shield.test.ts; causal RED5failed/4controls passed.
Original test and command log retained in task-owned d2h5-energy-shield-l_sdwiqp.
No earned campaign proof is implied.

Root cause: authored shieldAbsorbPct/manaRegenPct have display rows but no native composition or damage consumer. The engine's direct/periodic/reflection/Static Field writes settle HP without the passive.

Workaround: none for this skill effect; ordinary gear and other mechanics remain available.

Required regression: rank1/20/exact aliases/unlock/prerequisites; actual direct and pooled periodic diversion, finite mana, exact lethal timing, reflection/Static/Shatter/Bone Armor/RNG; native next-wave/reset/original-resource replay/import and mana playback; bilingual actual current/next semantics and production Save/Continue. No save version change.

## Local resolution

Copied authored rank/prerequisite authority now drives fresh native MP recovery and all four personal-damage writes through one exact whole-MP splitter. Periodic settlement and lethal prediction share the same quota, with finite mana, Bone Armor, Shatter and original-resource replay preserved. Both locales explain actual values. Final full12868/545/two existing skips, types/lint/build/bridge and production en/zh desktop/mobile4/4 pass; eight exact Save/Continue pairs and20geometry samples audited. See docs/plans/evidence/d05-energy-shield.md for immutable receipts, failures, boundaries and cleanup. No genuine campaign action or save-version change.
