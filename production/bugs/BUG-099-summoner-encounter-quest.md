# BUG-099 — Use the Summoner's real encounter and quest identities

Status: Fixed locally; independent source/browser QA approved. Severity: High —
the advertised Summoner kill path could not advance.
Owner: content-designer; store integration and QA verification by root.

Reproduction at `e426c8e`, en/zh-CN; deterministic Node/Vitest integration,
seed123 for planner and seed7 for the constructed production-store recording.
Browser viewport is not applicable to this source/integration reproduction.

1. Resolve the final Arcane Sanctuary encounter through manual/idle or the
   legacy authored planner.
2. Track `quests/act2-arcane-sanctuary` and settle its actual winning recording.
3. Inspect ordered quest targets and bilingual objective labels.

Expected: the existing `monsters/act2.the-summoner` appears as the single boss,
with three ordinary undead-flayer companions in the explicit encounter. Its
qualified death advances only the first objective; journal interaction remains
separate and no quest reward is auto-granted. Both locale labels match that order.

Actual: both authored boss references use Horror Mage, companions inherit boss
tier, quest target/areas use unmatched legacy IDs, and the first locale label
says to find the journal with no second label. The maps specification already
names the Summoner; the monster catalog already supplies its definition.

Evidence: `src/data/__tests__/summoner-encounter.test.ts` and
`src/stores/combatHelpers.quest-objectives.test.ts`; pre-edit `red2.log` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-summoner-gtbnvvgp` records
7 failures/48 passing controls. The initial harness used the wrong locale
namespace, corrected before runtime changes. Initial level expectations also
confused authored and projected levels; a final correction after the first
postpatch run preserves existing generated28/legacy24 scaling. Those failing
runs and corrections are retained separately.

Root cause: map/quest content definitions disagree with catalog/runtime IDs.
Fix those definitions and localized objective copy; keep existing qualified
settlement logic, authored levels, wave structure, treasure class and reward
amounts. Journal interaction, earned routing and Radament balance are separate.

Verification: [bounded encounter/quest evidence](../../docs/plans/evidence/summoner-encounter-objective.md).
The journal interaction remains a separate unfinished campaign requirement.
