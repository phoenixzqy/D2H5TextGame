# BUG-400 — Campaign gear policy stops at a native full-backpack refusal

- Status: Fixed locally; eight regressions/14contracts/types/lint/boundary and
  independent source review pass. No replay of failed cases.
- Severity: Medium — prevents the declared progression measurement; no product equip defect established.
- Build: accepted bounded current32 plus accepted BUG398 harness-only correction,
  uncommitted on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL/Linux, installed Node24.21.0/Vitest1.6.1, explicit campaign workspace.
- Fixed clock:1793304000000; no supplied seed/ordinal or historical save input.
- Affected system: `tests/campaign/actions.ts` owned-gear policy.

## Reproduction

1. Execute the separately declared cold-v2 case once after BUG398 validation.
2. Earn actual Blood Moor drops, evaluate canonical slots and perform native equips.
3. Clear Den at level6, Talk/Claim its actual500XP/skill reward, then evaluate gear.
4. Observe selection of owned TrainingBow `it-40ot9-4b`, normal Attack15.

Expected: a predeclared owned-gear policy accounts for native capacity constraints
and records ordinary capacity refusals honestly; unexpected mutation/refusal still
stops the technical measurement. Any changed policy must be reviewed and measured
in a new exclusive case, never silently applied to this failed case.

Actual: after11 successful real equips, the selected two-handed upgrade displaces
both existing weapon and offhand. The native store correctly returns
`{ok:false,reason:'backpack_full'}` because the actual backpack already holds183
items. Existing equipped weapon `it-5n089-19` and offhand `it-5n089-12` remain owned
and equipped. The harness asserts every selected upgrade must succeed, producing
a technical stop. Level/stats/net-upgrade eligibility is not transaction feasibility.

The native guard intentionally preserves over-cap ownership while refusing net
backpack growth. This finding does not authorize relaxing it, dropping items,
refilling resources, changing game numbers or treating refusal as successful equip.
No product defect has been established. Inventory management and capacity handling
were absent from the declared diagnostic gear policy.

## Retained evidence

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:

- `p15-current32-act1-cold-v2/`: original report/journal/log/process/execution, exit1.
- `p15-current32-cold-terminal-failure-v2.json`: root terminal failure receipt.
- `p15-current32-screen-before-v2.json`:3005-input/tool freeze; source and campaign
  before/after identities match. Runtime/data/save unchanged from acceptedP14;
  broad manifest1511/1512 equal, with approved diagnostic workspace-config drift.
- `bug398-validation-acceptance-v1.json`: the canonical-slot fix itself passed
 4regressions/14contracts/types/lint/boundary and independent exact-delta review.

Cold-v2 stops at L6/41admissions/44played wins, no gameplay nonwin. Native combat
915356ms; actual economy13230XP/190added items,183backpack+7equipped; checkpoint and
export match and economy conservation passes.22slot decisions,11successful equips
and1refusal are retained. The final gear failure is not a class/enemy tuning result.

The predeclared pair stops here. `p15-current32-act1-fire-v2` was never created or
executed. Original cold/fire-v1 and this failed cold-v2 remain distinct evidence.
The PASS-only terminal audit is not run against this known technical failure.

Independent review `p15-current32-cold-v2-independent-review.md` rejects technical
acceptance and fire-v2 execution. It verifies the refusal, unchanged ownership,
exact13230XP/190items, checkpoint/export and source identity. The provenance
clarification is retained in `bug398-production-provenance-correction-v1.json`.

## Correction boundary

Record and review the smallest policy correction against native equip/capacity
surfaces before implementation. Prefer an existing authoritative planner or real
native refusal/result handling over copied transaction rules. Preserve owned
eligibility/comparison/monotone scoring/ties, native mutation/refusal authority,
full conservation and explicit refusal feedback. Do not silently sell/salvage,
stash or grant gear. Any disposal/farming/adaptation policy is a separate choice.
Use meaningful regressions, explicit-only campaign discovery, strict types/lint,
source review and new predeclared exclusive cases after the finding is resolved.

## Reviewed correction plan

Focused producer plan review: ready. Rank clear upgrades with existing scores and
ID ties; try each through native `equipItem`. Journal every exact result, stop
after the first success. Only `backpack_full` may continue, after asserting the
complete six-domain earned observation equals its pre-slot snapshot. Unexpected
refusals still fail. If all upgrades are blocked, retain gear and continue the
declared route. No capacity formula, disposal, stash transfer or farming is added.

Code scope: `tests/campaign/actions.ts` and its existing regression file. Before
the source fix, require a failing real full100-bag2H continuation regression and
ranked fallback test. Also cover overflow swaps/empty slots and a real unexpected
native refusal. Retain the original first three canonical-slot regressions.
Validate explicit regressions, affected14contracts, exact lint, strict types and
default discovery boundary. Declare new v3 cases only after independent source
review; account for attempts/refusals/successes honestly in their terminal audit.

## Validated correction

Meaningful RED fails two capacity-continuation/fallback tests; final GREEN passes
all eight native tests. Four affected ordinary suites pass14tests. Strict types,
exact two-file lint and default boundary1170tests/1880modules pass. Independent
exact-source review APPROVE verifies original first three regressions unchanged
and no product/data/save/config drift from BUG398. Packet receipt
`bug400-validation-acceptance-v1.json` accepts this bounded harness correction.

The separately declared cold-v3 passes the former gear failure and reaches
L11/262victories before an unrelated recorder-capacity failure (BUG401). This
does not invalidate the gear regressions or accept the full campaign. Fire-v3
remains unexecuted; no numerical tuning is justified.
