# BUG-245 — Apply paid Weaken to outgoing direct damage

- Status: locally fixed/verified; runtime cef44c4c, presentation/native/public2a71b623. Full17375/789/two existing skips, engine8622/323, types/lint/purity/build/bridge/precache and production4/4PASS. All1561committed source blobs exact; one bounded Weaken credit. Independent/earned acceptance open.
- Severity: High — the paid advertised reduction has no effect on damage.
- Owner: root, engine/content/frontend; independent design/QA and earned balance open.
- Base:075d2ec5; Node24.21.0, Vitest1.6.1, actual native adapter/registry/recorded engine.
- Browser/viewport: native engine reproduction, no browser claim; locale-independent numbers.
- Seed:1; real native learned ranks1/20 with Amplify Damage prerequisite.

## Reproduction

1. Run src/stores/necromancer-weaken.causal.test.ts.
2. Native L30 Necromancer acts once400ms and pays exactly6MP/rank1 or2MP/rank20.
3. An enemy with100Attack/AS250 acts every500ms through4500; no mitigation/critical.
4. Compare actual damage/HP with a matched uncursed caster-held control.

Expected: the advertised reduction changes actual damage. The explicitly
provisional [author contract](../../docs/plans/decisions/D04-weaken-v1.md)
specifies33% for3000ms, without changing cadence. Outcomes are
67,67,miss,67,67,miss,100,100,100;568HP loss. Duration and percentage are new
author choices, not recovered source authority.

Actual: the paid action/debit occur, but damage remains
100,100,miss,100,100,miss,100,100,100;700HP loss, exactly the uncursed control.
The bare marker lasts400–1400ms and carries no potency. Both ranks fail actual
damage, HP and status-interval/payload expectations; six authority/resource/
cooldown/no-target/uncursed controls pass.

## Original evidence and root cause

Terminal weaken-red:2failed/6passed,7.147s,exit1. Raw log/receipt are retained through the packet linked in
[final evidence](../../docs/plans/evidence/d04-weaken.md);
logSHA256:cf0f454f792630cd7ee967f00979fde172e28aad096850db62882d4d37b26805.

JSON has only appliesStatus:weaken with no authored duration/reduction;
dataCatalog emits a generic debuff, the unknown status falls back to1s, and
buildDamageInput never consumes Weaken. Repair the complete authored paid
packet and the existing outgoing direct-damage projection. Preserve base stats,
cadence, RNG, resources and other damage paths; do not alter gameplay assertions
to match the inert marker.

Another implemented curse may help survival, but does not repair this skill.
No genuine campaign/replay, external publication, save22, dependency or CI change.
Independent/earned acceptance and C2–C4/G0–G7/privatev1 remain open.

## Local repair and remaining acceptance

The strict authored finite packet now changes actual direct damage before
mitigation without changing native payments, base stats or action times.
92new regression cases and four production cases pass; eight exact six-domain
save pairs/four actual offline Continues preserve learned configuration.
[Evidence, limitations and retention](../../docs/plans/evidence/d04-weaken.md).
Independent design/QA, earned balance and full-v1 acceptance remain open.
