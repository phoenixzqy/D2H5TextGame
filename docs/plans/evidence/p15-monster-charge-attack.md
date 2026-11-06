# P15 — Monster Charge Attack component

BUG-735 is fixed and locally verified under the
[explicit design delta](../decisions/P15-monster-charge-attack-v1.md).
The shared native Charge now adds 100% current snapshot Attack to its sampled
60–90 physical damage before ordinary damage multipliers, criticals, mitigation
and shields. JSON owns the coefficient; the existing shared damage arithmetic
is reused. This affects all Charge users, including early Act I enemies.
The other four native physical skills retain their fixed damage.

The schema requires a finite nonnegative coefficient for Charge and continues
to prohibit it for Rend, Leap, Leap Attack and War Cry. The adapter copies the
coefficient into its immutable effect. Both authored and canonical zh-CN/en
descriptions explain the new damage. No save migration, extra action, RNG draw,
cooldown change, status or damage-formula exception is introduced.

## Verification

- Six affected test files pass: **169 cases**. Literal regressions cover the
  added 220 Attack, mitigation afterward, minimum damage, physical dodge,
  Charge/basic/basic cadence, plain/recorded parity, input immutability and
  action/hit-sequence equality after normalizing damage.
- Schema/adapter cases accept coefficients 0, 25.5 and 200, reject missing,
  negative, nonfinite and malformed coefficients, and retain the other four
  skills' prohibition. Existing signature endpoint oracles include native
  Attack. Native store cases load and validate real game data.
- Scoped strict TypeScript passes with zero diagnostics; four-file ESLint
  passes with zero warnings. After fixing test-only type narrowing, the eight
  Charge cases were rerun and pass.
- Native Chromium desktop 1280×800 zh-CN/manual and mobile 360×640 en/idle
  checks each use a native Tomb chapter Duriel and Dark Stalkers at levels 1/12
  against a clearly synthetic, passive, unmitigated target. Their Attacks are
  220/35/96. Seed 13 yields a 509 critical Duriel Charge and 106/167 ordinary
  Dark Stalker Charges, within the literal formula bounds.
- Browser plain/recorded results agree and inputs remain unchanged. Playback
  applies exactly the first-hit life loss; the visible localized Charge log
  includes its actual damage. Screenshots were inspected. Both viewports have
  no horizontal overflow, console warning/error, page error, failed request
  or HTTP error. The harness injects combat into a fresh character; campaign
  header/character presentation and general mobile usability are outside scope.

The initial RED has three meaningful failures. The first GREEN stops at strict
schema compilation because the required property's declaration was a sibling;
the Charge-specific declaration fixes it. Initial scoped types/lint expose
test-only union narrowing errors, now corrected without suppressions. All failed
logs remain. The dev tool emits only a stale Browserslist database notice;
no dependency change is needed for this increment.

Root reviewed the exact increment against eight saved before-sources, including
both schema allowlists, fixed-only exclusions, translation paths and early
users. This is local verification, not independent final review.

## Evidence and remaining work

Required packet retained by root through unfinished full-v1 acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-charge-attack-u_twfdqw`.

It contains the before/after sources and manifest, exact incremental patch,
RED/GREEN and scoped type/lint logs, browser script/native results/screenshots
and cleanup receipt. Browser/server are closed; the exact owned cache is
removed. The cleanup receipt verifies process absence and no disposable paths.
Root removes the retained packet after acceptance and all consumers finish.

No campaign or spent Duriel screen was replayed. These constructed probes
establish functionality, not first-clear acquisition, win-rate or pacing
acceptance. BUG-731 remains open: qualify representative acquisition/mitigation
before further encounter tuning. Counts stay 14/14 intended Normal clears,
210/210 supplemental candidate sources and 0/210 formal balance acceptance.
Full v1, wider economy/pacing/difficulty/endgame/app/soak and independent
acceptance remain incomplete. Browser works; CI is excluded; no user hold.
