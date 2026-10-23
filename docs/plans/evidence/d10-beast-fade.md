# D10 Beast/Fade — bearer stat adaptations

Continuation of the full private-v1 objective, based on `d5e6cdc`. Implements
Beast and Last Wish/Fade; seven other runtime adaptations remain open. The
closed grant union/schema and all nine remaining authored rows are groundwork,
not evidence that their active/combat effects execute.

Beast multiplies complete ordinary maxLife (including quest Life) by1.15 and
attackSpeed by1.05 once, after flat composition. Fractional values are retained.
Mercenary composition uses the saved bare baseline plus the ordinary gear delta.
Fade adds10 resistance points in all six types and.025 magical dodge through
ordinary composition. Current HP/MP are preserved or clamped, never refilled.
Canonical matching equipped slots alone own grants; highest rank wins for each
name. Nested damage tuning is copied/frozen. No allocation or derived grant
cache is persisted, and merc saved baselines remain unchanged.

Native19 decoding repairs only identifiable equipped-grant cache fields:
Exile defense; Beast Life maximum/current-Life clamp/attackSpeed; Fade six
resistances/magicDodge. Other historical caches remain exact. Bilingual details
and comparisons describe the implemented self-only effects.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-adaptations-6ut43sa0`.
Root retains indexed diagnostics for ongoing integration and removes them after
their consumers finish.

- Causal RED:11 missing-data/stat failures; cache RED2; display RED4. Retained
  logs distinguish these from passing controls and subsequent GREEN runs.
- Focused corrected tests46/4files pass; duplicate/ownership controls11pass.
  Synthetic legal Dream/Exile sources exercise every named grant's highest-rank
  selection/removal/wrong-slot behavior; they are not real combinations or
  earned balance evidence.
- Engine5266/149files pass in48.42s. Final standard `npm test`, alone after all
  heavy validation finished:10898pass/396files/2existing skips,251.07s,exit0.
- Final typecheck/lint and production build pass. Initial fixture-only lint
  findings were corrected without changing assertions. Existing bundle/PWA
  warnings remain, including the2.57MB manifest asset outside precache limits.
- Production scan:7JavaScript files, zero forbidden bridge tokens.
- Production browser20/20 pass in268.58s:Beast/Fade ×en/zh-CN ×360×640,412×915,
  640×360,1280×800,1920×1080. Zero retries/skips/flaky/unexpected/report errors;
  tests observe empty page/console error-warning lists. Public equipment/import/
  Save-close-new-page-Continue paths, strict layout and44px controls are covered.
- Root audited all60 attached JSON saves:exact grant ratios/deltas, removed
  sources, unchanged13HP/17MP and learned allocations. Tests separately assert
  exact complete Save-close-Continue equality and masked import repair.
  `stat-browser-audit.json` records these checks. The four extracted mobile
  screenshots show the upper scrollable inspection and usable Close controls;
  they do not visually show every effect line at once.
-1039source/test/config inputs and760build files match their freezes with no
  drift. Three fixture-only lint edits during the matrix are separately audited;
  production/browser inputs did not change. Independent read-only design/save
  reviewers returned CLEAR for this metadata/stat scope, without running tests.

BUG129 stays open for the seven remaining integrations. These constructed
browser saves do not establish earned materials, combat balance, earned ActII–V,
213-skill completion, endgame,30–50-hour pacing or C2–C4/G0–G7 acceptance. No
push, PR, merge or deployment is claimed. Disposable build/browser outputs are
removed after validation; retained paths/ownership are indexed in the root.
