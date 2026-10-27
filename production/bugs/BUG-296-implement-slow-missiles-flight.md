# BUG-296 — Implement actual finite Slow Missiles projectile slowing

Status: Reproduced; source correction pending.
Severity: High — advertised utility has no functional projectile consumer.
Affected systems: engine-dev,content-designer,frontend-dev,writer,qa-engineer.

## Reproduction
Build:c15b3ef54181719f5c42a3119aaa1bb89347e22f. Native deterministic Vitest/jsdom,
no browser viewport; locale-independent engine, seed7. Constructed legal level30
Amazon: actual recursive allocation and native bow equip/projection;100MP,
zero regen and100AttackSpeed isolates timing, not earned balance.
1. Record a stunned-owner control against authored monster-weak-ranged.
2. Observe first launch and actual damage at1700ms, with no flight interval.
3. Allocate/equip/cast Slow Missiles at ranks1/20 against the same source.
4. Launches stay1700/3400/5100ms; corresponding impacts remain immediate.

Expected: finite paid real projectile slowing; ordinary500ms normal flight and
33% speed/6000ms provisional contract give delayed impacts without slower casts.
Actual: permanent marker, no flight consumer; changing cadence/dodge would not
satisfy the promise. Historical cadence-only diagnostic is insufficient proof.

## Evidence
Root-owned task:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_.
slow-missiles-native-red.test.ts,slow-missiles-native-red.json/log/inputs/process:
3 genuine assertion failures,8.148s,all2482inputs andHEAD unchanged. Original
first-impact expectation2200 receives1700; rank1/20 second slower-impact
expectation receives unchanged3400. No gameplay fix/test weakening applied.
See docs/plans/decisions/D04-slow-missiles-v1.md and Proposed ADR-012.

Root cause: synchronous skill damage plus marker-only adapter; no queued
projectile progress or finite paid speed authority. Workaround:none for skill.
Independent/earned/full-v1 acceptance remains open. No inventory credit.
