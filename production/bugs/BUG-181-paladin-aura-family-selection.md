# BUG-181 — Complete advertised Paladin aura selection and effects

Severity: High
Status: Open; fourteen selected auras locally verified in bounded scope, six distinct aura mechanics outstanding
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
finding is repaired; at that checkpoint the family remained open for ten distinct
pulse/control/recovery/corpse/interrupt effects, earned balance and independent QA.

Second batch bee0cd8 implements selected hero Holy Freeze and Conviction through
the shared wave projection. Actual Chill/cadence/provenance, six-type resistance
reduction, recipient damage/dodge, source authority, native public allocation,
replay and persistence pass. Full12261/517/two existing skips, engine6114/207,
types/lint/build/bridge pass. Production browser4/4 proves12 exact five-domain
Continue pairs and40 geometry samples. [Evidence and retained original failures](../../docs/plans/evidence/d05-paladin-enemy-auras.md).
Remaining after that checkpoint: Holy Fire, Holy Shock, Sanctuary, Cleansing, Redemption, Prayer,
Vigor and Concentration. The complete family, earned balance and independent
acceptance remain open.


Third batch `df9f1c0` adds actual selected Holy Fire and Holy Shock pulses and
canonical mitigated Fire Burn, with explicit JSON timing/base/Burn ownership,
source/death/tie/deadline/cap guards and no damage/proc RNG. Native allocation,
original-input replay, bilingual UI and savev22 selection pass. Full12286/519
plus two existing skips, engine6131/209, types/lint/build/bridge PASS; production
browser4/4,12 exact five-domain Continue pairs and40 geometry samples pass.
[Evidence and original failures](../../docs/plans/evidence/d05-paladin-pulse-auras.md).
Remaining six: Sanctuary, Cleansing, Redemption, Prayer, Vigor and Concentration.
Earned balance and independent whole-family acceptance remain open. Genuine
campaign save/next402 is unchanged; no actual campaign action occurred.
