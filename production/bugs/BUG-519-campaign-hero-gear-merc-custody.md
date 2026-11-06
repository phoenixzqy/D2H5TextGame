# BUG-519 — Resolve hero policy gear across mercenary custody

- Severity: Medium; diagnostic orchestration, not an observed production UI defect.
- Status: Locally fixed and verified in external policy drivers; uncommitted. No production API change or publication requested.
- Owner / affected systems: root (QA/campaign harness); external Barbarian native policy drivers.
- Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local implementation.
- Environment: Node24.21.0/Vite SSR in WSL; no browser/viewport involved; locale-neutral assertions.
- Seed: exact Frigid714 first-wave seed27650888; failure occurs before admission715, so no715 battle seed is consumed.

## Reproduction

1. Restore the exact Swing34/97329XP/next714/58action source.
2. Perform its selected native free stat/skill resets; equip the owned Hand of Broc gloves it-28hix-283.
3. Clear Frigid714. All six forecast/native HP/MP/time results agree; retain37660XP and its actual loot/sinks.
4. Return the hero to default equipment at the idle boundary. The monotone merc equipment selector fields the now-free gloves on the rogue.
5. The next hero policy entry uses inventory-only retrieveCampaignGear. It throws Unowned campaign gear retrieval before admitting715.

## Expected

The hero equipment-policy boundary finds the unique canonical owner of an already-owned item. If the owner is a mercenary, return that item using the native unequip service, then retrieve/equip it through normal inventory APIs. Never grant, duplicate, silently abandon, or delete the item.

## Actual

The external driver equates ownership with backpack/stash custody. Its final report is technically failed but retains34/134989XP/next715/58actions, core30/152/58/10, Natural Resistance13/Sword Mastery1/Double Swing20/Find Potion1 and stat2/skill2 resets. Gloves are canonically owned by the fielded rogue. The rolling checkpoint export exactly equals the failure export. A second entry was attempted before admission; only one admission actually occurred.

## Evidence

Packet /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1:
- p15-barbarian-swing-crystalline-training-run-v1.log and -exit.json.
- p15-barbarian-double-swing-current-act40-training-v1.json, .raw.jsonl.gz and .checkpoint.json.
- p15-barbarian-swing-frigid-training-policy-v1.json (six exact first-admission matches).

## Root cause and recovery

Use one external owned-custody retrieval helper for new hero-equipping drivers; retain the inventory-only helper's existing contract. Add a narrow regression against this exact failure export: original helper refuses without mutation; corrected helper returns the unique merc item through the native service while preserving all item IDs/payloads, economy and quest state. Resume the failure export at715; preserve both spent resets,37660XP, all loot/sinks,58actions and the original total training bounds. Do not replay714 or preparation.

## Verified local resolution

`p15-barbarian-owned-custody-v1.ts` finds unique canonical merc custody, calls
native unequipFromMerc and uses the existing inventory retrieval API. No change
to the inventory-only helper contract. New training v2, forecast v9 and native
continuation v3/v4 share it. Narrow regression v2 verifies old refusal without
mutation, exact native item return with unchanged economy/quests, and truly
unowned refusal without mutation. The retained regression v1 failed only on an
optional zero-valued audit field; v2 corrects the checker assumption.

`p15-barbarian-double-swing-current-act40-training-v2.json` resumes the exact
failed715 export without repeated reset or714 rewards. It reaches40/next861;
combined independent training readback passes actual147admissions/720waves.
Subsequent native Crystalline/Ancients/Throne/Plateau completes all five acts
and all six Act V areas. Campaign independent readback
`p15-barbarian-swing-campaign-progress-summary-v1.json` passes canonical full
custody/economy, spent-reset/point conservation, inherited history and lineage
including the failed predecessor. Regression result is
`p15-barbarian-swing-custody-regression-v2.json`; scoped strict types/lint pass.
Exact evidence is pinned in `p15-barbarian-swing-earned40-artifacts-v1.json`.
Root retains original failure/log/checkpoint, corrected drivers and all audits
through umbrella QA. Full private v1 acceptance remains incomplete.
