# BUG-734 — Give Duriel his passive Frost Aura

- Severity: Medium; the native encounter omits the designed passive pressure.
- Status: Fixed in working tree; focused engine/native/browser verification passed.
- Build: working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL, Node24.21/Vitest1.6.1; pure engine/native data repro,
  independent of browser/viewport/locale.
- Seed:13; native Normal Tomb chapter wave, challenge ordinal450, manual/idle.
- Affected systems: engine-dev/content-designer; root sole writer.

## Reproduction

1. Run `vitest run src/stores/combatHelpers.duriel-aura.test.ts --no-cache`.
2. Resolve and build the native Tomb chapter wave without modifying Duriel.
3. Use durable diagnostic hero/merc/summon targets and inspect the recording.

Expected: independent five-second15cold/2sChill pulses to all living player
units, preserving Charge and ordinary actions. See the
[prospective contract](../../docs/plans/decisions/P15-duriel-passive-frost-aura-v1.md).
Actual: native and chapter skill lists both contain active FrostAura. Existing
recorded regression established its3000ms action and5000ms Chill expiry; the
updated native regression fails in both modes because this active skill remains.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-passive-aura-oow7i3w5/`
`native-red-v2.*`. Original `native-red.*` records an unsupported cache flag
failure before tests; it is not behavioral evidence. No workaround or acceptance
claim. Root cause: only an active shared skill exists; no authored passive
metadata/scheduler. Preserve Frozen Terror's separately accepted active skill.

## Verification

[Passive Aura evidence](../../docs/plans/evidence/p15-duriel-passive-frost-aura.md)
records28focused tests, strict types/lint and desktop/mobile Chromium passes.
The active-Aura fix in BUG-732 is superseded, preserving its historical evidence.
Native stats, Charge, Freeze immunity and Frozen Terror remain unchanged.
BUG-731 and formal balance0/210 stay open; no campaign replay or commit.
