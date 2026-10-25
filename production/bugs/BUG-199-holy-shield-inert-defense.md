# BUG-199 — Apply paid Holy Shield defense and absorption

- Status: Fixed locally in `1c94a78`; presentation `36fc086`. Independent design/QA and earned balance remain open.
- Severity: High — the paid defensive skill provides neither authored defense effect.
- Build: `bafc8e0`; Node 24.21.0, Vitest/jsdom native player projection.
- Browser/viewport/locale: not applicable to the engine reproduction; production en/zh-CN desktop/mobile verification remains required.
- Seed: 7.
- Owners: root acting as engine-dev/frontend-dev/content-designer/QA; no independent approval claimed.

## Reproduction

1. Project a synthetic level30 Paladin with legal Smite→Charge prerequisites,
   Holy Shield rank1 or20 and Holy Shield selected in the native combo.
2. Isolate HP2000/MP100, ordinary Defense100, zero recovery/resistance/dodge,
   hero cast at500ms and one fixed ordinary enemy Physical1000 hit at1700ms.
3. Run `npx vitest run src/stores/holy-shield.causal.test.ts`.

Expected: after the paid cast, authored +4% Defense/rank affects ordinary
mitigation and 2% absorption/rank affects remaining damage. The explicit
[local repair contract](../../docs/plans/decisions/D05-holy-shield-v1.md)
reconciles absorption rather than inventing an unauthored block roll/capacity.
Rank1/rank20 HP loss should be879/492, with one35/31MP payment.

Actual: the cast event exists but both ranks lose900HP. The generic handler
adds only `holy-shield` to activeBuffIds; neither authored coefficient is read.
Both native causal tests fail. These fixtures are synthetic, not earned builds.

Evidence: original test, command output/terminal1 receipt and source hashes are
retained in [the verified raw packet](../../docs/plans/evidence/fixtures/holy-shield/raw.tar.gz).
[Final evidence](../../docs/plans/evidence/d05-holy-shield.md) records actual native
HP loss879/492,68new cases, full14226PASS/629files/two existing skips, production4/4,
eight exact Continue pairs and source/build/genuine/cleanup audits. Regression:
`src/stores/holy-shield.causal.test.ts`, plus the five companion files listed there.

Affected systems: paid buff registration, native rank authority/wave refresh,
ordinary mitigation/shared personal damage settlement, playback/logging and
bilingual current/next descriptions. Conversion is a separate open mechanic.
