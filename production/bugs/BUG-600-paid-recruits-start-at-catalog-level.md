# BUG-600 — Scale new paid recruits to the hero's level

Status: Locally fixed and affected checks passed; integrated acceptance pending. Severity: High (paid late-game party acquisition is ineffective).
Owner: root, engine/store responsibility.

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, source authority50
`37814c32a1a260209b650490dfbf91cafb097c11bc61c44f84b426ec2ae3d5f2`.
Native production-store continuation, Node24.21; browser/viewport/locale do not
affect this shared transaction. Both zh-CN/en consume the same roster.

1. Continue the earned level70/Hell961 character with its historical wallet reserved.
2. Earn new wishes and make ordinary paid recruitment purchases.
3. Inspect and field the first genuinely new Telekinesis Iron Wolf.

Expected: gacha-spec §4 defines catalog core stats at L1 and
`mercLevel = playerLevel`. A new paid identity starts at the hero's level with
natural class growth, zero XP toward its next level, and full initial resources.
Actual: the level70 hero acquires a level16 recruit. It dies in each first wave
of its three trial entries, contributes three direct damage and is absent from
15 subsequent waves. Early heroes can conversely receive overlevelled recruits.
Death has other possible causes; correcting hire levels does not itself accept
late-game party balance.

## Evidence and root cause

`docs/balance/2026-11-02-earned-recruitment-party.md` records the actual run.
External packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-earned-recruitment-party-v1.json`, lossless journal and both independent
readbacks preserve actual paid RNG timestamps/pity; no fixed RNG is substituted.
The focused store regression uses native seed `(1750000000123 ^ 0) >>> 0`.

`gachaActions.ts` calls `createMercFromDef(def)` without hero level; the factory
sets level to `max(1, def.reqLevel)` with unchanged catalog core stats. Neither
D10 nor P13c01 overrides the new-paid-hire requirement. Historical save repair
and the separately accepted deterministic hire path use the catalog baseline.

## Bounded correction plan

Pass the captured valid hero level into new paid recruit construction. Interpret
the catalog's core stats at L1, reuse existing class growth through that level,
and fill only this fresh actor's initial pools. Keep the existing factory default
for deterministic hires/legacy fixtures. Reject invalid hero levels before RNG,
payment or publication. Preserve saved actors, duplicates, XP, equipment, stars,
fielding, rollback, native draw order and logical save33/IDB1. No retroactive
levels or new save migration; the prior earned successor remains historical.

Prove early/late/cap levels and full stat/XP state through public paid actions;
check duplicate preservation, save decode and existing atomic rollback. Verify
all catalog classes at factory boundary and subsequent real XP/equipment/star
composition. Run only these affected cases, types and lint. One public browser
purchase/save/reload on the earned successor can spend only its34new wishes,
preserving all98,758 historical wishes; do not replay campaigns or grant funds.

Plan review: ready. Covers both sides of reqLevel, existing saved baselines,
full growth and initial resources, invalid input and transactional failure.
Security check: pass. Local first-party game-state correction; no new network,
credentials, installs, permissions, publication or destructive operation.
No human question or external blocker is required. Root remains sole writer.

## Resolution and verification

New paid identities now use the captured hero level and ordinary class growth
from the catalog's L1 baseline. Existing saved actors, duplicate results and the
separate deterministic hire default keep their previous state. No migration or
retroactive level grant is introduced.

The original regressions fail before the correction. Afterward, 200 distinct
affected cases across nine files pass, including levels1/70/90, full initial
resources, exact save decode, invalid-level refusal, duplicate preservation,
publication rollback and subsequent XP/equipment/star composition. Scoped
strict types, changed-file lint and the engine-purity check pass. The expensive
full typecheck was stopped and is not counted as passed.

Real Chromium desktop/en and 360×640/zh paid purchase/save/reload checks pass
with no page/console errors or overflow. Both native draws are duplicates:
this browser evidence covers transaction/persistence and existing-roster
preservation, not new-recruit rendering. New-level construction is proved by
the affected public-action regressions. See
`docs/plans/evidence/2026-11-02-paid-recruit-levels.md` for exact artifacts and
the remaining party-balance/integration limits.

A later actual paid continuation acquires a new level71 Cold Arrow Rogue and
trials it through Hell1017–1019. Native and separate streaming readbacks pass.
Real desktop/en and mobile/zh checks now also confirm this new identity's
level/earned XP, fielding and exact save/reload/export. Earlier duplicate-only
browser evidence remains valid within its original scope. See
`docs/balance/2026-11-02-earned-levelled-party.md`. Integrated party/balance
acceptance remains open.
