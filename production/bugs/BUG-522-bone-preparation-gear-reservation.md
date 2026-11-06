# BUG-522 — Reserve qualified equipment before campaign capacity recovery

Status: Fixed in task-local helpers (uncommitted; implementation HEAD unchanged)
Severity: Medium (campaign helper; native earned accounting remains correct)
Owner: root / QA preparation helper

## Reproduction

Implementation HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` (dirty source tree `08d3c5a00897cd7fae9dc516228dfbeffe7001465058adbac1948eecef257595`). Node24.21.0 native-store harness; browser/viewport/locale not applicable. Exact earned source: `p15-bone-act4-initial-continuation-v1.json`, normal next ordinal667. Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Qualify the owned level50 Feral Claws / two-socket gloves / belt setup in `p15-bone-act4-plains-owned-elite-forecast-v1.json`.
2. Run bounded earned acquisition `p15-bone-act4-earned50-training-v1.json` without reserving those backpack items.
3. At a full-backpack boundary, `recoverCampaignCasterCapacity` scores current unsocketed equipment and salvages the future socket bases.
4. Exact earned50 next1279 forecast refuses to retrieve the now-unowned item; see `p15-bone-act4-plains-earned50-forecast-v1.log`.

## Expected

The preparation plan moves the exact selected owned backpack bases to native stash before capacity recovery. Future equipment survives until legal level/preparation; no save rewriting or synthetic inventory.

## Actual

`it-6lr45-n6u`, `it-103zb-ld8`, and `it-1079r-eij` are salvaged during the retained612-admission training. Independent accounting correctly includes every removal. Equipped gear and all29 existing paid sockets remain unchanged. Earned level50/XP14651/next1279 is retained; do not replay acquisition or restore destroyed items.

## Cause and fix scope

The local preparation driver invokes generic surplus selection without reserving equipment named by its qualification. Reserve at the plan-entry boundary using native `moveToStash`, assert identity/custody before and after recovery, and refuse missing items or full stash rather than changing salvage policy globally. Extend only task-local helpers/drivers; no engine/data/UI change.

## Recovery

Keep the actual earned50 save. Acquire replacement white socket bases through a separately bounded already-cleared ActIV farming run, preserve selected drops before capacity recovery, then requalify the exact current owned equipment/ordinal before route. Further training, old quests and already-paid insertions must not replay.

## Verification

Focused native boundary regression and scoped strict TypeScript/lint pass; no unrelated combat/unit/browser replay.

## Fixed verification

Native task-local reservation v1 and training/route drivers preserve selected canonical gear before capacity recovery. Exact focused reservation red fails and green passes; existing reservation types/lint receipts pass. Replacement gear was earned, never restored. See `p15-bone-act4-reservation-red-v1`, `p15-bone-act4-reservation-green-v1`, `p15-bone-act4-reservation-types-v1`, `p15-bone-act4-reservation-lint-v1` and the earned ActIV/ActV evidence. All29old sockets remain owned. No production-source change or new commit.
