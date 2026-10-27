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

## Runtime payment qualification subcase
At c9593f83, native flight/finite slow checks pass, but replacing the registered
exact Slow Missiles with manaCost0 still creates its paid-authority window.
Native seed7 isolated engine repro:slow-missiles-payment-red.json/log,1failure/
5controls,4.197s,2489inputs/HEAD exact. Preserve the advertised JSON MP/CD/growth
in the exact runtime matcher before granting private authority; a marker flag
and matching duration alone are insufficient. No saved player can directly
register skills; this is pure engine boundary hardening, not a remote exploit.
The earlier barrier probe assumed100capacity; authored Bone Wall rank1 is40,
so the source-backed literal is60HP loss/40absorbed at2200ms. Original failure
remains in projectile-impacts-probe.log; no product tuning or relaxed assertion.

## Presentation reproduction

At809afe9a, a separate external preview workspace reports14assertion failures/
one malformed-metadata guard PASS across model and en/zh-CN Skills UI ranks
0/1/18/20. The model omits duration/speed, the panel uses generic active-skill
copy, and combat locales lack `slow-missiles`. Original preview-red source,
workspace/config, log and exact2490input/HEAD receipt remain in the task root.
Expected: source-backed6s/33% travel, actual current/next/MAX payment, already-
flying shots and impact-time damage/defense copy, plus a localized live chip.

Plan: consume the existing strict definition in displayStats, render its finite
rows and bilingual description, add both status labels and retain native/public
save/offline proof. No new tuning or permanent authority. Root author plan
review: ready; security check: pass for authorized local gameplay presentation.
Independent design/technical/QA and the full private-v1 gate remain open.
