# BUG-328 — Bind Act I scroll and Malus to actual physical recovery

Status: Open; causal production-action failures retained before repair.
Severity: High — two authored main quests cannot complete their recovery path.
Owner: root quest integrator / content-designer.
Affected systems: authored quest objectives, reciprocal bound items and recovery.

## Reproduction

HEAD`370aecb2`, with the separately reviewed Blood Raven changes present;
all1810 runtime/config/test input hashes frozen. Node24.21.0, Vitest1.6.1,
jsdom. This constructs tracked/cleared state to test the real recovery boundary;
it is neither earned combat nor browser/pacing proof.

For each actual quest:

1. Create a player, finish hydration and track the authored quest with all actual
   objective flags false and no reward claimed.
2. Visit its approved canonical area and construct that area's clear flag:
   Cain→`areas/act1-dark-wood`; Malus→`areas/act1-catacombs`.
3. Ask `questToolStatus` then independently call `recoverQuestTool` for the
   exact source below.

| Quest | Exact source | Expected physical item |
| --- | --- | --- |
| `quests/act1-search-for-cain` | `quests/act1-search-for-cain#objective:obj-inifuss-tree` | `quest/scroll_of_inifuss` |
| `quests/act1-tools-of-the-trade` | `quests/act1-tools-of-the-trade#objective:obj-recover-malus` | `quest/horadric_malus` |

Expected under the [focused owner contract](../../docs/plans/decisions/D11-act1-remaining-quests-v1.md):
status ready, Recover ok, exact bound owned item and source flag, no XP or Claim;
repeating recovery refuses without mutation. Later Give consumes the exact source.
Actual: unavailable/not-eligible, with no physical item or source progress.

## Cause and evidence

The legacy source objectives do not provide a canonical executable delivery
graph. Cain uses an interact objective at obsolete `areas/act1_dark_wood`; Malus
points at nonexistent `areas/act1_monastery_barracks`. Real recovery depends on
reciprocal authored bound-item definitions plus canonical area/objective matching;
loosening matching or inserting an inert token would not repair that graph.

External `recovery.test.ts` produces four causal failures/eight passing controls,
8.766245948s wrapper/8.15s Vitest. Untracked, uncleared, wrong-area and wrong-source
requests preserve exact stores for each quest. Positive assertions use actual
production loaders/actions, without mocked data or services. Correct source/data
definitions and real hand-in/rescue/Claim must satisfy the complete owner contract;
these recovery reproductions alone do not accept either quest.

Root retains original test/config/log/receipt and input hashes at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act1-recovery-hdfy5h1a`.
The test process is terminal; root keeps this exact evidence for implementation
and independent review, then owns archive/readback/exact cleanup. No production
repair, genuine save/action, migration or external publication occurred here.
