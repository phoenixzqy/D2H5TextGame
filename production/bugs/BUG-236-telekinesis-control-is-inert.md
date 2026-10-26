# BUG-236 — Telekinesis pays for an inert Knockback marker

- Status: locally fixed/verified in `431f453f`; independent design/QA and earned balance open.
- Severity: High — paid utility has no observed combat consequence.
- Build: `d030f410`; Node/Vitest, actual Sorceress data and native adapter.
- Browser/viewport/locale: final production checks pass en/zh-CN on desktop/mobile;
  broad UX/a11y and independent acceptance remain open.
- Seed: 7,19,41,97; ranks1,2,20; trash/boss/chapter-boss.
- Affected systems: content-designer/engine-dev/frontend-dev; root owns this repair.

## Reproduction

1. Compose a learned L30 Sorceress with only Telekinesis in her priority list.
2. Use diagnostic100MP/100000HP pools and a synthetic hold starting1701ms to
   isolate the first native cast at1700ms. Enemy acts every2000ms.
3. Compare the repaired recording with the identical registered skill retaining
   the original inert Knockback debuff. Assert identical hero cast/action and
   mana-payment events, no hero damage, exact enemy HP/position, seed and speed.
4. Repeat the exact input to verify deterministic output and immutable input.

Expected: spending mana on the utility produces an observable control effect.
The GDD forbids movement; a concrete no-movement adaptation must be recorded.

Actual before repair: the original Knockback debuff has no scheduling consequence;
all36 corrected baseline controls first act at2000ms. The repaired counterparts
first act at4000ms, with identical casts/payment and no hero damage or movement.
Stun expires at2700ms ordinary/2200ms boss. Data also advertised an unused passive
Arcane damage coefficient, and details omitted the utility's actual consequence.

Evidence correction: the original RED run recorded three failed parameterized
tests/108 control assertions. Its empty-effects comparator was flawed:
`hasAvailableEffect` rejects an empty list, making that side use a basic attack.
Its paired payment equivalence claim was unsupported. Preserve that log as
superseded evidence. The corrected comparator retains the old inert Knockback
and explicitly asserts equal cast/payment plus unchanged enemy HP/position;
all40 focused regressions pass. The full run started before this test-only
correction; it is not evidence for the strengthened assertions.

Evidence: `src/stores/telekinesis.causal.test.ts`, original `native-red.log`
in the task evidence packet when retained. Root sole writer/reviewer;
independent design/QA and earned balance remain open. No genuine campaign action.

Final quiet full:16276passed/734files/two existing skips,1035.57s/exit0,
including the corrected comparator. Types/lint/build and final production4/4
pass; eight exact six-domain save pairs/four actual offline Continues.
[Retained evidence](../../docs/plans/evidence/d04-telekinesis.md).
