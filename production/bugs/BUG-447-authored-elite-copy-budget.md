# BUG-447 — Preserve authored elite budget while fitting challenge copies

Status: fixed locally; native Lost City and production Chromium follow-through pass.
Severity: High (earned progression path; universal impossibility not inferred).
Build: b5a0898 plus current local private-v1 and BUG440 work.
Environment: WSL/Node24.21.0 production planner/factory/native settlement,
locale/viewport independent; real browser launch already verified.
Affected systems: challenge fitting/balance; root sole writer.

1. Run earned cold-evolution-act2-v1 or its static-order follow-through at
   Date epoch1793304000000, retaining exact201/761 and250/998earned prefixes,
   native95point stat reset/six gem costs/30point skill reset/57extra farming wins.
2. Enter LostCity at actualL24, ordinal307, runSeed3902248427, native6-wave plan.
3. W1–W3 win; ordinary authored W4contains19elite bodies (10scarabs/9mummies).

Expected: challenge crowd fitting should not multiply the authored elite budget
into every filler copy; an appropriate paid cold upgrade can recover past the
mage wave without a discontinuous army of elite physical attackers.
Actual: source W4has four bodies (two scarabs/two GreaterMummies); wave-level
elite fallback makes all4elite. fitSpawnsToMonsterCount clones their elite tier
onto all19fitted bodies. This is separate from BUG440 promoted champion/rare
core, whose group budget does not apply to this ordinary authored elite wave.

Original cold order entersW4at739/739HP, receives780physical/18fire/6arcane
and dies5.887s. Static-order native follow-through enters551HP and dies3.774s,
despite an isolated W4win from the original fullHP input. Carried Blizzard CD
2999.816ms and ally attrition remain native. No resource shortage or affix spell
is responsible for this boundary. Current code/tests explicitly preserve these
unpromoted flags; any correction needs a new scoped balance contract first.

Evidence: packet d2-counted-source-z3jj3xa1, both native reports/journals,
original4waves in p15-lost-city-cold-evolution-frozen-waves-v1.json; static-order
actual4waves will be retained separately. Both native runs technically/audit
PASS with1287waves/1277wins/10nonwins; strict item/cost/quest/point/save/source
closure and exact process/cache cleanup. No ActII completion or holdout claim.

Source: src/engine/combat/sub-area-run.ts fitSpawnsToMonsterCount and
encountersToSpawns; src/data/maps/sub-areas/act2.json LostCity w4.
Workaround: no full-area recovery proved by current bounded policies.
Next: reconstruct exact planner/factory/geometry/events for both actual W4
inputs; compare original against keeping4authored elites and making only15extra
copies trash, retaining every archetype/index/level/body/RNG/player resource.
No runtime edit before frozen results and explicit contract/review.

Authored-copy screen v1 technical PASS11.022s,8exact planner/factory/geometry/
event/terminal controls and132rows. Four-authored-elite/15trash-copy candidate
wins both original inputs (739HP/13.356s and269HP/22.500s). Grid32/32 and14/32
versus native15/32 and1/32. The declared both-input≥26/32criterion is not met;
no runtime adoption or full-area acceptance. Source/cache/descendants checks pass.

Next isolated screen distinguishes explicit authored elite markers from wave-
level fallback. Only two scarabs in raw W4are elite:true; two GreaterMummies
have no elite flag but inherit waveTier:elite. Compare native, prior four-body
core and explicit-two-elite core with all other fitted copies ordinary. Preserve
all bodies/order/IDs/levels/RNG/resources/skills/cooldowns and existing factory
coefficients; rebuild stats natively. Same8controls/original+32grid per arm and
case,198rows, same both-original+≥26/32criterion. This is diagnostic only; a
runtime change would require a separately reviewed explicit-marker/fitting
contract, regressions and full source/earned follow-through. No product edits.

Explicit-marker screen technical PASS13.845s,8exact controls/198rows. The new
2elite/17trash candidate wins both originals (739HP/16.500s and345HP/22.500s),
but grid32/32 and13/32 still miss the declared both-input≥26/32criterion.
Repeated native/four-core rows remain unchanged; neither candidate adopted.
No runtime/data edit. Next inspect unused owned Rogue shield preparation under
BUG448 before inferring that player gear cannot recover this physical burst.


### 2026-10-30 — Authored elite copy correction qualifies for native follow-through

Shield/copy factorial PASS16.811s/8exact controls/264trials. Actual owned shield
plus four-authored-elite core wins both inherited originalW4inputs and32/32,
29/32grids; separate arms remain ineligible. No full-area claim. Shared fitter
contract P15-authored-elite-copy-budget-v1 preserves source elites, makes only
added ordinary-elite copies trash, and leaves promoted groups/bosses/RNG/roster
unchanged. New3regressions observed RED then pass with minimal fitter change.
Current2349plan comparison PASS1101exact/1248projected,14976tier-only changes
in ActsII–V; sampledActI unchanged. Engine/types/lint validation collecting.
Fresh native successor has its own contract P15-earned-authored-copy-route-v1;
oldActIIprefixes stay historical, old346-waveActI equality remains a control.
No commits/push/PR/install/deploy/newagents. CIdeleted; browser launch resolved.
Exact raw packet retained for umbrellaQA/root cleanup; completed screen/control
wrapper descendants and private caches absent. Private-v1 remains incomplete.


Resolution: shared fitter keeps authored elite bodies and downgrades only added
ordinary-elite copies. All6native LostCity waves pass atL24/ordinal307, followed
by27training admissions. Real public browser replay passes zh360/en1280 with
exact enemies/rewards/items/export/reload. New3regressions RED then GREEN;
2349plan controls and segmented engine/source/static checks are reconciled in
`docs/plans/evidence/p15-earned-catacombs-recovery.md`. Remaining Arcane deadline
is BUG449. This closes only the authored-copy boundary, not ActII/private v1.
