# BUG-250 — Apply Blood Golem's advertised life-leech aura

- Status: locally fixed/verified; independent design/review/QA and earned acceptance open.
- Severity: High — advertised10% life recovery is absent.
- Owner: root engine/content/frontend; independent design/review/QA and earned balance open.
- Original build:`de803c76`; repair core`aeb19477`, presentation/native/public`aa33b6b7`. Node24.21.0/Vitest1.6.1/linux-x64.
- Environment: native engine/store reproduction, browser/viewport independent; both en/zh-CN promise10% recovery. Final production browser four/four PASS; see linked evidence for scope and limits.
- Seed:7; legal native L30, ranks1/2/20, actual Clay Golem/Golem Mastery prerequisite chain.

## Historical reproduction

1. Original baseline reproduction used `node_modules/.bin/vitest run src/stores/necromancer-blood-golem.causal.test.ts`. The current command verifies the repair; exact original RED bytes/logs are retained.
2. Use actual native selected Blood Golem preparation and its unchanged registered body.
   The diagnostic owner has synthetic injured HP/pools/Attack; an actual seeded enemy
   attacks eight times before a future Stun holds it. Both owner/body attack and
   the body actually loses HP. The million-HP target remains alive, preventing orbs.
3. Inspect actual friendly `heal` events after the one25MP startup payment.

Expected: the promised life-leech behavior restores positive actual friendly HP
when injured allies deal positive hostile damage while a living paid body exists.
This broad diagnosis does not settle the final aura beneficiaries or exact numeric
rules; those require the linked repair contract and literal counterexamples.
Actual: real body creation/payment/damage/injury assertions pass, but total friendly
healing is zero at ranks1/2/20. Unlearned and poor24MP controls grant no body/payment/
healing and pass. Original RED3failed/two passed,exit1,7.076s; logSHA256
`b9ab7e7e209938fc32aed63a841f31a10dac02bc897003d58f6fea7c27b0f485`.

Root retains the lossless raw archive and three sidecars at the exact paths in
[final evidence](../../docs/plans/evidence/d06-blood-golem.md) through BUG250/full-v1
consumers. Original reports are also indexed in committed fixtures. Disposable
task root/build and the completed cleanup driver are absent; remaining[]/failures[].

## Root cause and scope

`src/data/skills/necromancer.json` defines only paid summon preparation.
`summons.ts` supplies a physical body without leech metadata, and ordinary damage
settlement has no Blood Golem recovery/aura consumer. A paid spawn proves startup,
not the advertised life-leech behavior. The old `docs/design/skills-spec.md:93`
uses legacy `necromancer.corpse_attracter` for a Blood Golem10% life-leech aura;
the current bilingual Blood Golem descriptions retain that promise. The accepted
D06 preparation contract did not behavior-accept the aura.

See [provisional complete repair contract](../../docs/plans/decisions/D06-blood-golem-v1.md)
and [progress evidence](../../docs/plans/evidence/d06-blood-golem.md).
The repair adds one fresh actual-HP recovery consumer and qualified paid native
body authority, preserving preparation/stats/cadence/saves.97new regressions,
engine8875/333, full17749/812/two existing skips, types/lint/official build/bridge/
precache and four public production cases pass. Only after lossless retention and
exact cleanup was Blood Golem credited once (inventory161bounded); no other
summon credit or independent/earned/full-v1 acceptance is inferred.
