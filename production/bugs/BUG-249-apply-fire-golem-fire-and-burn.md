# BUG-249 — Apply Fire Golem Fire attacks and Burn

- Status: reproduced before production repair; no skill credit.
- Severity: High — advertised burning summon only deals Physical damage.
- Owner: root engine/content/frontend; independent design/QA and earned balance open.
- Build:5cfed4e6; Node24.21.0/Vitest1.6.1; native engine reproduction, locale/viewport independent. Public en/zh-CN desktop/mobile proof remains required.
- Seed:7; legal native L30/ranks1/2/20, full authored prerequisite chain.

## Reproduction

1. Run `src/stores/necromancer-fire-golem.causal.test.ts`.
2. Hold the native summoner and high-HP target with synthetic permanent Stun;
   retain the actual registered summon, startup payment, generated body and attacks.
3. Inspect damage from the actual created Fire Golem and target periodic loss.

Expected: one actual35MP time-zero preparation creates one body; its ordinary
attacks deal Fire and apply shared Burn, with actual periodic target HP loss.
Actual: one paid body exists, but all its hits are Physical and there is no Burn.
Original terminal RED3failed/one unlearned control passed,exit1,7.129s;
log SHA2565f68d0ad60833387e1831ccf764cd270e17375a260f1ce437bf4b1ebcc2ddcdc.
Raw root-owned evidence:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necromancer-summons-1xe918fz.

Root cause: `summons.ts` creates a body with no attack identity/effects and
`basicAttack` defaults it to Physical. Preparation proves startup only.
The generic template constants also remain hardcoded; Fire Golem's base stats
must move unchanged to validated JSON when its attack definition is authored.

The original not-yet-reached status oracle used public alias burn; existing shared
normalization stores ignite. A retained test-only correction requires actual
ignite/Fire DoT, preserving the executed direct-Fire failure and all other checks.
See [provisional repair contract](../../docs/plans/decisions/D06-fire-golem-v1.md).
No Blood Golem recovery repair or credit is implied by this report.

## Core follow-up

Validated JSON-owned unchanged body stats and provisional10% shared Burn now
repair actual native ranks1/2/20. Fresh native/source/owner authority binds only
new paid runtime bodies.45new tests; corefocused288/5,correctededges45/3,
engine8786/329 and typesPASS. Full skill remains incomplete and uncredited.
[Current evidence](../../docs/plans/evidence/d06-fire-golem.md).
