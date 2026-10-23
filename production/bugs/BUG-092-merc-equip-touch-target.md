# BUG-092 — Give mercenary candidate Equip buttons a 44px touch target

Status: Fixed in `6e2eb30`; independently validated.
Severity: Medium — the button works, but is smaller than the mobile target requirement.
Owner: frontend-dev; verifier: QA.

## Reproduction

- Build: `8c6a4e7`, VITE_E2E unset, production headless Chromium, English,
  360×640. No combat seed applies to this presentation defect.
- Import the genuine fresh campaign's `prepared.json.gz` through Settings →
  Import Save. Open Mercenaries → Rogue equipment → Gloves.
- Measure the rendered candidate Equip buttons with `getBoundingClientRect()`.

Expected: each button is at least 44×44 CSS pixels, as required by the mobile
standards. Actual: all 142 candidates measure 87.21875×40 pixels; horizontal
overflow is zero. The focused browser check fails on height 40 < 44.

## Cause and evidence

`MercEquipmentEditor` in `src/features/mercs/MercsScreen.tsx` permits
`min-h-[36px]`; the shared Button padding and `text-xs` compute a 40px height.
Earlier evidence described the declared 36px minimum as the actual size;
this measured reproduction corrects that imprecision.

Raw evidence root, owned by root through the C1 consumers:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-equip-target`.
The exact frozen `target.spec.ts`, `red-report.json`, `red.log`,
`measurements-red-en-360x640.json` and `target-red-en-360x640.png` retain the
reproduction. Source checkpoint is the sibling fresh campaign's
`prepared.json.gz`; it is imported for this focused check, not fresh campaign proof.

## Repair and verification

Raise this local minimum to 44px. Preserve the shared Button, localized label,
candidate ordering and equipment action. Verify actual geometry and no overflow
in en/zh-CN at 360×640, 412×915, 640×360, 1280×800 and 1920×1080; exercise keyboard
activation and exact full transfer/save/reload equality. Run existing U/T/L and
a clean production build. This style-only fix does not require replaying the
fresh campaign and does not accept C1 or full accessibility/performance gates.

Actual final result: all 10 browser cases pass, zero retries/skips/flaky outcomes.
Every case measures 142 buttons at 44px height; widths are 87.21875px in English
and 72px in Chinese, with no horizontal overflow. Keyboard equip, exact whole-save
transfer equality, Save and reload pass. Full 8,546 tests/273 files, typecheck,
lint and production build pass; the full suite takes 176.83s, over its 15s budget.
The four production JavaScript chunks contain none of the five forbidden bridge
patterns. Existing build warnings remain. Producer source APPROVE/security PASS
and independent QA ADEQUATE cover this bounded fix. Raw `browser-summary.json`
and the [published fixture](../../docs/plans/evidence/fixtures/bug092-browser-summary.json)
retain measurements and frozen harness identity. This imported-checkpoint proof
does not establish fresh campaign completion or physical touch-device behavior.
