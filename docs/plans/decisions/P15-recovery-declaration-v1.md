# P15 — Resolve offensive recovery from the build's declared skills

Status: implemented locally; affected checks pass and one earned Crystalline clear verified.
Date: 2026-11-03. Owner: root. Type: small preparation-policy tweak.

## Motivation and evidence

The saved ordinal1597 wave6 ends in a healthy 60s timeout. Retained
`p15-wave1597-cadence-diagnostic-v1.json` independently integrates all189 allied
action intervals with phase error below8e-15: Chill cadence is correct, and
same-curse refreshes respect3s duration. This does not prove a damage or scheduler
defect. The ordinary Crystalline recipe deliberately selects DimVision,
Decrepify and CE. Learned Amplify is declared globally but omitted locally, so
the existing recovery policy cannot select it. No counterfactual victory is proven.

## Explicit design delta

The [route decision](P15-intended-draw-curse-recovery-v1.md) requires
"already learned/declared Amplify"; the [training extension](P15-intended-training-draw-recovery-v1.md)
uses the same learned/declared requirement and separate stance proof. The old
implementation interpreted declaration exclusively through the area's order;
its Crystalline defense regression was intentional. This decision revises that
contract: an area's priority controls ordinary preparation, while either the
global profile or that area's priority may declare Amplify for offensive recovery.

Share one learned-and-declared eligibility predicate between priority selection,
route recovery and training recovery. Existing opt-ins, class/combo guards,
healthy settled draw, same source, adjacent ordinal, training stance proof,
successful stance carry and failed-retry termination remain required. Select
Amplify first, remove other exclusive physical curses, and retain all other
area actions in relative order. In Crystalline this yields Amplify → DimVision
→ CE. An ordinary/default/new-source boundary restores its usual order.

This changes campaign evaluation preparation only. Native ranks, resource costs,
skill effects, damage, gear, RNG, receipts, budgets and prior failures remain
authoritative. No area-name or seed exceptions, additional retries, grants,
automatic player feature or production code/data change.

## Acceptance and validation

- Actual-area and constructed-area route/farm cases resolve global declaration,
  retain DimVision/CE, record provenance and conserve every other save field.
- Ordinary order remains DimVision/Decrepify/CE. Local-only declaration works;
  neither declaration, unlearned skill, missing/stale history, dead hero and
  missing/forged farm stance retain ordinary state and record no recovery.
- Existing healthy recovery, successful stance carry, failed retry, reset and
  redundant-offensive-order controls pass. No earlier-act campaign replay.
- Amend the intentional old contract tests first and retain targeted RED;
  then implement the shared predicate and run affected cases, scoped strict
  types and explicit lint. Native viability requires a separate prospective
  one-admission bound from authenticated next1598, carrying actual1597 terminal
  history; no older save or exhausted family may resume.

## Review and scope

Plan review: ready with both route and training consumers explicitly covered,
ordinary controls retained and the intentional old contract acknowledged.
Security check: pass; authorized local first-party preparation/evidence only;
no dependency, credentials, network, CI, permissions or publication changes.
Full private v1, ActV13/19, formal0/210, BUG611 and BUG592 remain incomplete.
Root retains required evidence and human2 through umbrella review and owns
eventual cleanup/release. This decision alone proves no combat viability.

## Implemented and earned result, 2026-11-03

Five RED failures preceded the final57passing affected cases; scoped strict types
and explicit lint pass. All2149production inputs remain unchanged. Admission1598
uses authenticated actual1597history and clears all six Crystalline waves,
including native Nihlathak proof. Both allies survive;68items/323991XP earned.
Independent whole-save/reward/source/recovery/bound readback passes. This is one
new population, not paired causal or broad balance acceptance. The subsequent
three native quest actions earn Prison's rewards, consume its resistance scroll
and start Rite; ActV16/19,formal0/210. See [result](../../balance/2026-11-03-declared-recovery-native-result.md).
Only continuation is `p15-prison-handoff-native-v1.native-export.json`, SHA256
`35dc240eee3177328d959b6ad054d72abda5df0ea3147a3ff406b417bbd5c07c`, next1599.
Fullprivatev1/BUG611/BUG592 remain open. No old controller or allowance reopened.
