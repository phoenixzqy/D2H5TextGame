# BUG790 — Restore usable claw tier coverage

- Status: Locally implemented and verified; uncommitted (not an independent acceptance).
- Severity: Medium; earlier-act farming/previously owned claws provide a workaround.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes, 2026-11-05.
- Environment: native TypeScript loot loader, WSL; browser/viewport/locale not applicable to data eligibility. Both locales reuse existing bases.
- Seed: eligibility is deterministic and independent of seed; materialization fixtures use 3286157777.
- Owners: content-designer / engine-dev / qa-engineer (root handles this increment solo).

## Reproduction

1. Load `loadAwardPools()` and inspect `loot/trash-act3` at enemy level 39 through 49.
2. Filter positive item rows using native inclusive `qlvlMin/qlvlMax` eligibility.
3. Resolve claw base requirements and compare with the current authored claw tier.

Expected: Hand Scythe (requires level 32) remains obtainable while it is the current usable tier, through 49. The existing claw ladder has equivalent continuous current-tier coverage within finite ordinary source envelopes.

Actual: Hand Scythe is available only in trash Act III at 26–38; Feral Claws starts dropping at 38 but requires level 50. Act III's champion/unique/mini/boss and Mephisto cache sources also omit Hand Scythe. Other level bands/source tables omit existing current-tier claws. Hand Scythe and Runic Talons are not globally absent; early Katar/Wrist Blade already have sources.

Root cause: incomplete authored treasure-class references/bands, not combat damage, equip requirements, class skill formulas or RNG. Preserve original rows, including existing above-character-level candidates; fill only missing current-tier coverage with ordinary family weights.

## Evidence and scope

Prospective policy: `tests/fixtures/claw-progression-v1.json`; 49 additive rows across 23 tables, plus five unchanged source controls. Decision: `docs/plans/decisions/P15-ordinary-claw-tiers-v1.md`.
Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-claw-progression-dvheyztp. Root retains preimages, RED/GREEN, exact increment and cleanup through full-v1 acceptance.

This increment grants no earned acquisition odds, Act III clear, population balance or pacing acceptance. No spent campaign/pilot/retry budget is renewed.

## Resolution and verification

Append only the frozen 49 missing rows. Latest 91 distinct affected cases pass, including native selection/reward/equipment, strict schema, MF and exact historical preservation. Scoped strict types and five-path lint pass. All original table bytes reconstruct exactly after removing only the additions. Existing MF predecessor hash remains unchanged. See [final evidence](../../docs/plans/evidence/p15-claw-progression.md) for retained failures, limitations and cleanup. No commit exists yet; root self-review only. Acquisition odds/time and recommended-power/Act III balance remain unaccepted.
