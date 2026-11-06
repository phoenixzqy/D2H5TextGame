# BUG-743 — Recover HUD portraits and skill icons after reconnecting

- Severity: Medium; fallback preserves controls and accessible names.
- Status: Fixed locally in the working tree; not committed. Producer source review has no material findings.
- Base: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained human2 changes.
- Environment: Vitest/jsdom and Chromium 147 on WSL; zh-CN/en at 360×640 and
  1280×800. No engine RNG/seed applies.

## Reproduction

1. Render a player HUD on Town or a class skill tree.
2. Fail the current portrait or a generated skill-icon image request.
3. Restore image availability and reconnect without navigating away.
4. For HUD, also switch player class after a failed portrait without reconnecting.

Expected: failed art retries its unchanged URL on reconnection, healthy art stays
mounted, and a new source starts with fresh failure state. Controls, geometry
and accessible names remain usable throughout.

Actual: local permanent `errored`/`failed` state removes the image forever; HUD
also carries the old source's failure into the next class portrait.

## Evidence and cause

Three new assertions fail on the original production sources in
`src/ui/CharacterHud.test.tsx` and `src/features/skills/SkillsScreen.test.tsx`.
Exact report: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-avatar-skill-recovery-zjof2q7o/red.json`.
The initial two-file run has 50 passes/four failures: three reproduce this bug;
the fourth is the unchanged Raise Skeleton displayed-Life assertion, outside
this image change. Preserve that result; do not claim a clean full-file run.

`Avatar` and `SkillIcon` bypass the existing `useRecoverableImage` hook. Reuse
that hook and reset state by source identity rather than adding timers/cache
busting/PWA changes. Reloading or remounting was the workaround.

## Local resolution — 2026-11-05

Both components now reuse `useRecoverableImage`; keys reset failure state when
the class or icon source changes. The shared hook is unchanged. The two test
files select 11 passing assertions and 43 filtered assertions, not 54 passes
(the Vitest JSON aggregate miscounts filtered cases). Four-file ESLint and
scoped strict TypeScript pass. The original unrelated Raise Skeleton assertion
failure is preserved separately and does not invalidate this image reproduction.

Four Chromium cases verify both surfaces recovering at unchanged URLs after
real offline/online transitions, decoded art, stable healthy nodes/controls,
geometry, decorative semantics and no horizontal overflow. All eight surface
observations pass; no unexpected browser errors. Mobile fallback/recovered
screenshots were inspected. Both initial observer failures are retained.

[Evidence](../../docs/plans/evidence/p16-avatar-skill-image-recovery.md) records
the exact retained packet, source snapshots/patch/hashes and process/cache
cleanup. Full private-v1 and wider art/PWA acceptance remain open.
