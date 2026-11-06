# BUG-398 — Evaluate earned gear for empty campaign equipment slots

- Status: Fixed locally; final regression/contracts/types/lint/boundary checks
  and independent exact-delta review APPROVE. Corrected diagnostics separately declared.
- Severity: Medium — the diagnostic silently omits its intended gear policy.
- Build: uncommitted current32 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL/Linux, Node24.21.0, installed Vitest1.6.1 campaign workspace;
  no browser/viewport/locale is involved in this service-path diagnostic.
- Fixed clock:1793304000000; native seed stream includes Catacombs754407005.
- Affected systems: QA/balance harness, `tests/campaign/actions.ts`.

## Reproduction

1. Run the predeclared fresh cold Act I screen using the existing campaign runner.
2. Observe production character creation with an empty sparse `equipped` record.
3. Earn actual ordinary drops and call the existing `equipCampaignGear` policy.
4. Inspect the retained journal for `gear-decision` and `equip` records.

Expected: evaluate all canonical hero equipment slots, including initially empty
slots, and equip only an actually owned, eligible clear net upgrade. Retain the
native candidate comparison and actual equip outcome in the journal.

Actual: zero gear decisions/equips occur despite2996 earned drops in the cold
case. The loop iterates `Object.keys(inventory.equipped)`; the fresh sparse record
has no keys, so it never examines an owned item for any slot. The cold campaign
honestly records CatacombsW5 defeat at L12, but did not exercise the intended
earned-upgrade policy. This is not evidence that the game lacks gear or that the
class needs numerical tuning.

## Evidence and correction boundary

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `p15-current32-act1-cold-v1/sorceress-cold.json` and its journal retain the actual
  state,309 played waves/308 wins, native defeat and zero failed-wave rewards.
- `p15-current32-independent-review-v1.{json,md}` records the independent finding
  and both original diagnostic outcomes when its review completes.
- `p15-current32-screen-before-v1.json` pins all3004 inputs and installed tools;
  both original cases remain descriptive naked-hero diagnostics, not successful
  execution of the intended acquisition policy.

Preserve the active final P14 source lock. Before changing the harness, add a
meaningful regression using sparse empty equipment plus an actual owned eligible
upgrade, then iterate the canonical slot domain instead of occupied map keys.
Keep native eligibility, net-upgrade checks, deterministic tie-breaking, real
equip calls and ownership conservation. Do not grant gear or change production
combat, drops, skill mechanics or outcomes. Corrected diagnostic cases require
new exclusive outputs and explicit source attribution; original cases stay
retained and are never promoted to earned or balance acceptance.

## Root-ratified correction protocol

Producer's read-only diagnosis identifies `EQUIPMENT_SLOT_ORDER` exported by
`src/ui/EquipmentPanel.tsx` as the existing complete hero domain. Iterate a
sorted copy in `actions.ts`, preserving the previous alphabetical order without
mutating the shared list. Do not use the narrower mercenary/runeword lists,
which omit charm. Keep all selection/equip logic unchanged.

The writable code scope is `tests/campaign/actions.ts`, new
`tests/campaign/actions.regression.test.ts` and
`vitest.campaign.workspace.ts`. Add a separate exact-include explicit-only
`campaign-regression` project with Node, one isolated fork. Existing
`--project campaign` must still run only the declared screen. Default ordinary
unit discovery/import boundaries remain unchanged.

Write and run the actual regression before applying the loop correction:
native fresh Sorceress `{}` and sparse native Amazon equipment, owned diagnostic
Cap/Quilted Armor/authored charm fixtures, actual helper call and real equips.
Require exact destination IDs and stat changes, full slot observations including
charm, preserved Amazon starter and canonical item/economy/quest/merc/service
conservation. Add meaningful eligible-vs-level-refused, deterministic tie,
replacement/no-op and real full-bag native refusal controls. Constructed regression
fixtures prove wiring; they are not earned campaign gear or a balance result.

After meaningful RED, apply the one loop-source correction and require complete
explicit regressions GREEN, affected ordinary policy/manifest/economy/settlement
contracts, unchanged default test boundary, strict types and zero-warning delta
lint. Independent exact-delta review must precede corrected diagnostics. No
production source, game numbers, drop table or save format changes are needed.

## Regression and minimal correction

After the bounded P14 source lock closed, the explicit campaign-regression project
ran four actual service-path tests. RED-v1 failed exactly three tests at missing
head equips for fresh Sorceress, sparse starter Amazon and deterministic tie
selection; the real full-backpack native-refusal control passed. Replacing only
the occupied-key loop with a sorted copy of canonical11 `EQUIPMENT_SLOT_ORDER`
then passed all four unchanged tests. All eligibility/comparison/scoring/equip
logic remains unchanged. The ordinary four policy/manifest/economy/settlement
suites pass14tests; default discovery/import audit remains1170tests/1880modules.

The initial exact-delta lint finds two new-test style errors only (numeric template
interpolation and a shorthand void callback). They require a style-only correction
and refreshed source pins/checks before final review or declared corrected cases.
All attempts remain retained in `d2-counted-source-z3jj3xa1/bug398-*`.

## Final correction validation

Final GREEN-v2 passes4/4; affected ordinary contracts pass14/4. Strict
`tsc --noEmit` exits0 after the two style-only test edits; exact three-file lint
exits0 with zero warnings. Default test/import audit still passes1170tests/1880
modules. Independent final v2 source review APPROVE reconstructs the exact patch
SHA256 `e60634d1668d63ec4ca870c418ffb9f5947396e4f0a02a508c7358ee36dbd14d`.
Only the three ratified harness/test/config paths differ from acceptedP14;
runtime/data/save inputs are unchanged. The historical broad P14 manifest also
includes diagnostic configuration:1511/1512 pins match; the sole approved drift
is `vitest.campaign.workspace.ts`. Final manifest has3005 entries. Packet receipt
`bug398-production-provenance-correction-v1.json` clarifies the original receipt's
ambiguous `productionDrift` field without replacing that retained receipt.

Packet receipt `bug398-validation-acceptance-v1.json` accepts the bounded harness
correction. `p15-current32-screen-before-v2.json` freezes the separately declared
cold/fire-v2 pair, with unchanged policies/clock/route/bounds. Original diagnostic
outputs and the first lint failure remain retained. No numerical tuning, earned
viability/full-v1 acceptance or replay of original cases is included.
