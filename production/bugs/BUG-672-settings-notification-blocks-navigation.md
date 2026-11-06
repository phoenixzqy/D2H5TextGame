# BUG-672 — Let navigation receive input beneath passive notifications

- **Status:** Fixed and verified locally; uncommitted on retained HEAD `b5a0898`.
- **Severity:** Medium; transient input obstruction, with waiting as a workaround.
- **Owner / affected systems:** Root / frontend; Settings notification overlay.

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained dirty source;
production Chromium in WSL, mobile 360×640, zh-CN. Not engine-related; no seed.

1. Create a character and open Settings on mobile.
2. Export a save and, while its success notification is visible, tap Map.

**Expected:** the passive status notification remains announced and navigation
responds immediately to the tap.

**Actual:** the fixed notification overlaps the Map link and intercepts pointer
input. Normally this lasts until its 2500ms dismissal. The controlled acceptance
clock makes the interception persist and the click reaches the test timeout.
There are no controls or actions inside the notification that need pointer input.

## Evidence and correction

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-integrated-rewards-v1`:
`browser-v3.json`, mobile zh-CN screenshot, trace and error context under
`playwright-v3/`. The click log identifies the status element as the interceptor.
The case reaches the decayed return bonus but no combat admission.

Guard the outcome with a real browser hit test and ordinary Map click while
the notification is visible. Make the passive overlay ignore pointer input;
retain its content, status role, positioning and dismissal. Do not force clicks,
remove the notification in the fixture, or advance bonus time to hide the bug.

## Verification

V4 deterministically fails the real mobile Map hit test on unchanged production.
Settings now applies `pointer-events-none` to the passive status overlay. V5
passes hit testing and ordinary navigation while the notification is visible in
all four desktop/mobile × en/zh-CN cases. Build, scoped types and lint pass.
[Evidence](../../docs/plans/evidence/p17-integrated-rewards.md).
Regression: `tests/pwa/offline-rewards.spec.ts`; no commit created.
