# BUG-155 — Make wishstone recruitment reachable

Severity: High. Status: Fixed in `b2ed62b` locally; independent acceptance pending.
Owner: frontend-dev. Runtime baseline `a0d7c7f` plus local BUG154 wallet fix.

## Reproduction

Chromium headless360×640, imported genuine through271 save; zh-CN. Open mercs
from navigation and look for wishstone recruitment. There is no entry, and
`/gacha` redirects to `/mercs`. Two production `AppRoutes` regressions reproduce
the inaccessible route and missing roster link:2RED/2, exit1 in8.02s.

Expected: the F07/gacha-spec recruitment control is reachable, displaying the
earned wallet and allowing authored single/ten pulls. Actual: the existing
GachaScreen component is disconnected from production routing.

Evidence: `src/app/gacha-route.test.tsx` and retained
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/bug155-route-red.log`.
Initial browser runner incorrectly assumed a global gacha link; its zero-pull
failure/report/screenshots remain at sibling `bug154-earned/`. It consumed no
recruitment or campaign attempt. No RNG seed applies to navigation.

Root: `src/app/routes.tsx` explicitly redirects the old route, and MercsScreen
offers deterministic hire only. No ordinary UI workaround exists. Retain
deterministic hire and add an accessible localized wishstone link plus the
existing character-guarded screen. This implements F07's promised access.

Security check: pass; local navigation only. Plan review: ready; production
route tests plus bilingual/five-viewport browser proof cover the integration.
Full rarity/pity/duplicates and merc mechanics remain separately unaccepted.

## Verified correction

Implementation `b2ed62b`; full11550 tests/441 files pass with2 existing skips,
types/lint/build pass, production en/zh×five viewport sizes10/10 and two exact
Save-close-Continue pairs pass. [Earned evidence](../../docs/plans/evidence/d10-earned-recruitment.md).
Regression coverage: `src/stores/gachaActions.test.ts`,
`src/features/gacha/GachaScreen.test.tsx`, `src/app/gacha-route.test.tsx`;
BUG156 also has the measured production touch-target matrix.
