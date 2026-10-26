# BUG-246 — Apply Iron Maiden, Life Tap and Lower Resist to damage settlement

- Status: implemented locally; integrated/browser verification in progress, no new skill credit yet.
- Severity: High — three advertised paid skills have no corresponding damage effect.
- Owner: root, engine/content/frontend; independent design/QA and earned balance open.
- Base:7883b882; Node24.21.0, Vitest1.6.1, real native adapter/registry/recorded engine.
- Browser/viewport: native-engine reproduction, locale-independent; no browser claim.
- Seed:1; learned native ranks1/20 with actual transitive prerequisites.

## Reproduction

1. Run src/stores/necromancer-damage-curses.causal.test.ts.
2. The L30 native Necromancer casts once400ms and pays the exact existing cost:
   Iron Maiden11/6MP, Life Tap9/5MP, Lower Resist22/16MP at ranks1/20.
3. Iron Maiden: a cursed enemy deals100Physical HP damage500ms; no reflection occurs.
4. Life Tap: a merc removes100HP from the cursed enemy500ms; no healing occurs.
5. Lower Resist: a merc's100base hit against50% resistance/10flat mitigation
   still deals40, across all seven damage types.
6. Matched inert-effect controls retain the same real action, payment, cadence
   and damage. Twelve ownership/level/prerequisite/rank/resource/CD/no-target
   controls pass.

Expected: each advertised effect changes actual combat. The explicit provisional
[author contract](../../docs/plans/decisions/D04-damage-curses-v1.md) chooses
100% Physical HP-loss reflection,25% direct HP-loss healing and30percentage-point
all-resistance reduction, each3000ms. These numbers are new author choices,
not recovered prior numeric authority. Expected native outcomes are100reflected
damage,25healing and70direct damage respectively.

Actual: all three apply generic one-second markers without potency or consumers.
Terminal RED18failed/12passed,exit1,7.691s; original assertions retained.
Raw logSHA256:a125d35d90f914a73244563b996597e96d6274acd6fc203057a26b9c09c62915.
Task packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9.

## Root cause and scope

The three authored rows have only appliesStatus; the generic adapter emits
unconfigured debuffs, unknown defaults last1s, and damage settlement never
consumes these IDs. Repair complete authored metadata, copied paid packets and
the shared actual damage/resistance/healing settlement. Do not buff other skills
or alter assertions around the inert markers.

No genuine campaign/replay, external publication, save22, dependency or CI change.
Independent/earned acceptance and C2-C4/G0-G7/privatev1 remain open.
