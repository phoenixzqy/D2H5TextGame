# BUG-222 — Show the actual Barbarian single-target and AOE attack rules

- Status: locally fixed and verified; independent acceptance and earned balance open.
- Severity: Medium — descriptions omit payment/control rules and promise
  positional movement absent from this game's combat model.
- Owner: root, frontend/copy; independent design/QA and earned balance open.
- Build: `3bef78ad`, Node24/Vitest1.6.1, actual React skill details under jsdom.
- Viewport: no browser viewport for this reproduction; both en/zh-CN.
- Seeds: no RNG in presentation; separate native controls use7/19/41/97.
- Affected systems: Bash/Whirlwind/Leap Attack/War Cry descriptions and truthful
  current/next/MAX damage, target, payment and control explanations.

## Reproduction

1. Render the real Skills screen for a declared synthetic L30Barbarian.
2. Open each of the four attacks at rank0/1/2/20, in both locales.
3. Compare the description with the existing JSON and
   [four-attack contract](../../docs/plans/decisions/D04-barbarian-basic-aoe-v1.md).

Expected: the description states the current skill-base damage, one independent
attempt per selected target, one payment/cooldown and, where applicable, on-hit
1s/boss0.5s Stun with no control on misses. It describes the existing no-movement
combat model. Details must agree with current/next/MAX data rows.

Actual:32description assertions fail. The current descriptions are generic;
Whirlwind promises spinning through enemies and Leap Attack promises jumping
to a new position, while neither changes position. Leap Attack/War Cry omit
the actual ordinary/boss Stun lifetime and missed-control rule. No runtime
damage defect is established by these presentation failures.

Evidence: `src/features/skills/SkillsScreen.barbarian-basic-aoe.test.tsx`, initial
`presentation-red.log`/terminal receipt in the four-attack task packet to retain.
The initial native probe passes rank1/2/20 ×seeds7/19/41/97 ×1/3/9enemies,
covering actual HP/MP/target counts; it did not itself grant skill credit.

## Local repair and verification

The real Skills screen formats existing computed damage, costs, cooldowns and
control durations in both locales for these four exact skill IDs. No engine,
game-data, persistence or save-version changes. Corrected focused88/3 and
full15329/703/two existing skips pass, as do types/lint/build/precache. The
production browser matrix passes16cases with32ordinary exact five-domain
Continue pairs,16offline fresh-page Continues and80geometry checks.
[Delivery evidence](../../docs/plans/evidence/d04-barbarian-basic-aoe.md) retains
the initial REDs and interrupted collector separately from final passing receipts.
Four bounded functional credits retain independent/earned acceptance open.
