# BUG-278 — Reconcile Mage Poison copy with adopted death spread

- Severity: Low — inaccurate new follow-up contract; shared runtime is unchanged.
- Status: Reproduced; correction and native regression pending.
- Owner: root, design/writing/QA; no independent approval or delegation.
- Baseline: `602d0f14`, Linux Vitest jsdom, zh-CN and en, seed7.

## Reproduction

1. Run `CombatScreen.skeletal-mage.test.tsx` with the native rank6/Mastery20
   Blood Moor fixture and real engine recording.
2. At1940ms Poison hits Fallen B for50 and kills it. The shared death handler
   gives Fallen C one ordinary Poison stack at2HP/s until6940ms.
3. At3080/3480ms it loses2+1HP before the Lightning hit at3880ms:35→32HP.

Expected from the newly written Mage child: no spread. Actual shared behavior
and older adopted D04 Poison Dagger, Rabies and combat-timing contracts: ordinary
Poison retains death spread. This discrepancy is an error in the new child,
not a newly introduced shared implementation. The main GDD phrase reserving
spread for plague variants remains a broader design reconciliation requirement.

Evidence: `mounted-hp-inspection.log/json`, with `MAGE_C_HP` observations, under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-signatures-kwew5kh6`.
Initial mounted expectation35 fails against32 in both locales. No campaign run.

## Correction

Honor the specific already adopted shared contracts in this bounded Mage work:
correct the child and bilingual copy; explicitly verify death spread,2HP/s source
capture and exact3HP native playback loss. Do not introduce a Mage-only exception
or silently change global Poison semantics. Later full-design acceptance must
reconcile the broad GDD wording and the adopted specific contracts.

Workaround: consult the existing D04 Poison contracts. Security check: pass for
first-party local docs/tests/copy; no save, permission, dependency or network change.
