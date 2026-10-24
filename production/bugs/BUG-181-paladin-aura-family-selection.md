# BUG-181 — Complete advertised Paladin aura selection and effects

Severity: High
Status: Open; eight stat auras locally verified, ten distinct aura mechanics outstanding
Owners: engine-dev, frontend-dev, content-designer; root sole writer this run

## Reproduction

- Baseline `2b5608b`; deterministic native/store inspection, browser-independent.
- Both locales; viewport-independent. Save boundary requires no combat RNG seed.
1. Create an eligible Paladin and learn an authored aura other than Might/Meditation.
2. Inspect Skills selection or call `selectAura('paladin.thorns')`.
3. Round-trip a save carrying that canonical selection.

Expected: explicit single-aura selection, truthful distinct effect and durable
canonical selection for every advertised aura.

Actual: store rejects eighteen canonical IDs; UI provides only two auras; native
snapshot only carries Might/Meditation and current save validation rejects the
additional IDs. Generic passive-stat projection cannot implement the ten promised
pulse/control/recovery/resource mechanics.

## Evidence and root cause

`playerStore.ts` selection whitelist; `SkillsScreen.tsx` hardcoded radios;
`combatHelpers.ts` two projection paths; `validate.ts` two-value current enum.
`aura-v22.test.ts` baseline: 41 failed/15 passed, including rejected current IDs
and absent strict future migration. Original output retained in the task evidence.

Workaround: use existing Might or Meditation; this does not supply the missing
effects. Track the full family against `D05-paladin-aura-family-v1.md`. Do not close
this bug merely because selection/save support or the first eight effects pass.

Production validation of the first eight effects found a further integration
defect on baseline2b5608b plus the uncommitted batch: Chromium/en/1280×800,
new L1 Paladin → Skills → Resist Fire → Allocate leaves its aura radio disabled.
The allocator writes `paladin.resist_fire`; the new rank resolver checks only
`paladin.resist-fire` and `skills-paladin-resist-fire`. Four multiword selections
are affected. The tests had manually supplied the hyphenated selection ID as an
allocation key, missing the real producer contract. Preserve the selection domain;
resolve actual canonical underscore allocations as well as data/selection aliases
by maximum. Reproduce with the public allocation action before changing runtime.
Original screenshot, trace, browser report and log are retained in task evidence.

Local implementation: save a5c9c3a, runtime/native9329b3f, UI fdbbd55. The corrected
public-allocation regression passes34cases; full12229/515, engine6088/205,
types/lint/build/production bridge checks pass. Browser en/zh×desktop/mobile4/4
proves36 exact Continue pairs and40 geometry samples. [Evidence and original
failures](../../docs/plans/evidence/d05-paladin-stat-auras.md). The allocation-ID
finding is repaired; the whole family remains open for the ten explicitly listed
pulse/control/recovery/corpse/interrupt effects, earned balance and independent QA.
