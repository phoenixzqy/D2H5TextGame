# BUG-721 — Recover failed home and town backgrounds on reconnection

Status: Locally resolved in the retained working tree; no new commit.
Severity: Low. Owner: root / frontend. Affected systems: home and town artwork.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree; Chromium 147.0.7727.15 on WSL,
360×640, English. No combat or RNG seed applies.

1. In a fresh browser profile, interrupt the resolved Act I zone-art request
   while opening Home or entering Town through ordinary character creation.
2. Observe the failed background's computed `display: none`.
3. Restore the request and cycle real browser offline/online state without
   reloading or navigating away.

Expected: failed optional artwork retries once when connectivity returns;
healthy artwork and controls remain mounted.
Actual: one request total; the background remains hidden after reconnecting.
Both screens reproduce independently. Healthy NPC art and controls stay intact.

## Cause and evidence

Both screens mutate the failed image's inline display and bypass the existing
`GameImage` source/reconnection recovery. Use that component with an empty
decorative fallback, preserving fitting, opacity, layering and controls.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-background-recovery-ud6mbopw`.
`before-browser.json` contains the home reproduction and an initial town
selector failure (a decorative HUD image also had empty alt text).
`before-town-browser.json` contains the corrected, town-only reproduction.
The home success was not rerun. Root retains the packet through umbrella
acceptance, then owns its exact cleanup.

Workaround: revisit the screen after connectivity returns. Gameplay remains
available; no save or earned-campaign mutation is needed.

## Resolution — 2026-11-04

Both callers now use the existing `GameImage`, with an empty decorative fallback
and no wrapper border, rounding or background. No recovery hook or shared
component change. [Final evidence](../../docs/plans/evidence/p16-background-image-recovery.md):
19 affected component cases, scoped strict types/two-file lint, and eight
qualified bilingual mobile/desktop browser cases pass. Same-URL retry succeeds;
healthy images/controls remain mounted and computed fitting/opacity are preserved.
Initial selector and locale-label mistakes remain disclosed in the packet.
