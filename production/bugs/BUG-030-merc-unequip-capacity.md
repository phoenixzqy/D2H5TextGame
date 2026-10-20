# BUG-030 — Guard manual mercenary unequip at backpack capacity

- Status: Fixed in854e88f; validated bounded P03b05b; root/QA/producer final APPROVE.
  Exact checks and limits: docs/plans/evidence/p03b05b-merc-equipment-capacity.md.
- Severity: Medium; manual merc unequip bypasses the regular100-item capacity
  and has no localized refusal/recovery feedback. No item loss observed.
- Owner/affected systems: store/frontend developer; merc equipment and UI.
- Reproduction head09fe00f,2026-10-20,Ubuntu26.04,Node24.21.0/npm11.19.0,
  Vitest1.6.1/jsdom. Direct-store cases have no browser/locale dependence;
  mounted cases en/zh-CN, no physical-browser claim. Seed not applicable.
- Control: docs/plans/p03b05b-merc-equipment-capacity.md; accepted D09 manual
  capacity policy, explicitly following P03b02's temporary unbounded return.

## Reproduction and expected/actual

1. Own authored InnerSight merc through actual factory/store. Equip Map-bearing
   helm and populate current backpack with100,101 or500 items.
2. Call unequipFromMerc(mercId,head). Expected backpack_full, same complete store
   references/contents, no publications and retained gear. Actual appends item
   to101/102/501 and clears gear, publishing both domains.
3. Mount real MercsScreen in each locale, open Equipment, click Unequip without
   opening picker (and separately with picker open). Expected persistent polite
   localized backpack-full message, retained gear/picker, room/retry available.
   Actual no role=status/message; unequip silently succeeds above capacity.

Genuine pre-runtime command:
`npx vitest run --project ui src/stores/merc-equipment-capacity.test.ts src/features/mercs/MercsScreen.equipment-capacity.test.tsx --reporter=dot --silent`

07:26:51UTC initial8fail/9pass6.29s:3actual reference mutations,4missing status,
plus one test-only wrong stash-reference baseline captured before discard.
Corrected that baseline to after the separate discard (which legitimately
filters stash), reduced assertion error dumps without changing oracles, then
07:27:15UTC **7fail/10pass/2files3.93s**:3actual capacity mutations and4missing
localized status nodes. Runtime source unchanged throughout both attempts.

## Cause, resolution boundary and workaround

Manual unequip inherited temporary unbounded-return behavior. Its existing
transaction can preflight before removing any gear; distinguish it from durable
earned/already-returned addItem ingress, which remains unbounded. The UI ignored
unequip failure and placed item-only feedback inside a conditional picker.
The fix guards the authoritative action, retains reasons and renders localized
status outside that picker. It preserves nongrowing swaps/overflow-reducing equips, full
payloads/Maps, current validation precedence and save schema. Workaround: keep
backpack below100 before manual unequip. No automatic discard/compensation.

Security check: PASS. Trusted local preflight/UI and isolated tests, no external
writes/credentials/permissions/dependencies/schema or validation bypass.
