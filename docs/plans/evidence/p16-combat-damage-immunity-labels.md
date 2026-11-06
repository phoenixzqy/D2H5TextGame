# P16 — Combat damage immunity labels

2026-11-05. [BUG760](../../../production/bugs/BUG-760-combat-damage-immunity-labels.md)
is fixed locally in the existing umbrella worktree, not committed or independently
accepted. The preceding goal turn was status-only/no progress. This increment
implements the missing player-facing explanation for literal damage immunity.

## Behavior and scope

UnitCard displays a named semantic list from CombatUnit.damageImmunities in both
compact and normal markup. Native Andariel/Mephisto display "Immune to poison
damage" / "免疫毒素伤害". Labels wrap at14px; changing locale or replacing the
team updates/removes them. Numeric resistance100 and poison-status immunity do
not create damage-immunity labels. Combat, tuning, RNG, rewards and saves are
unchanged. Only CombatScreen.tsx and the two combat locale files change in
production; the existing locale objects are otherwise equal to their baselines.

## Verification

Three causal component cases fail before the fix because the immunity list is
absent. An earlier invalid fixture's missing tier failure is retained separately
as red-setup.log; the corrected tests use the actual factory contract. All13
distinct cases in the new immunity, compact-health and monster-self-buff files
pass. After lint's redundant explicit list role is removed, all3new cases pass
again using the native ul semantics. Strict scoped TypeScript covers654
implementation/data files with zero diagnostics; final explicit two-file lint
exits0. No broad suite, build or campaign is run.

Chromium147.0.7727.15 verifies the real mounted CombatScreen with constructed
paused native monsters, in both languages at360×640,412×915,640×360,1280×800 and
1920×1080. All10layout cases and four all-type stress/removal cases pass, with
14px labels, correct accessibility list names, no label clipping/card overflow
or horizontal page overflow, and no page errors/warnings/failed requests.
After the ARIA cleanup, four final-source mobile/desktop cases and four stress
cases pass; every all-type label is scrollable into view and its center is
unobscured. Final harness uses production-shaped native boss IDs so their art/
names also resolve. The deliberately status-only control has a synthetic ID;
its fallback name is not a localization acceptance claim. Nested-scroll grid
screenshots may include fixed navigation over offscreen rows; the separate
per-label scroll/hit checks prove reachability. Native boss screenshots in en
mobile and zh-CN desktop were visually inspected.

## Retention and limits

Root retains this exact packet through full-v1 acceptance and removes it after
all consumers finish:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-combat-immunity-labels-42kpjvyt.
It contains source baselines/increment/hashes, causal/affected/final test logs,
scoped types, original/final lint receipts, both browser harnesses/reports/logs,
screenshots and cleanup/self-review. Both owned browser drivers close Chromium
and their server; their task-local Vite cache is removed and absence verified.
No shared cache or unrelated process is touched.

Security check: pass; local authorized first-party UI work. Plan/source review
is root self-review, not independent acceptance. No diagnostic gameplay budget
is consumed or renewed. Historical14/14Normal completions,210checkpoint sources
and formal balance0/210 are unchanged. Progression/challenge, acquisition/economy,
30–50human active-hour pacing and wider integrated/independent/owner acceptance
remain incomplete; full-v1 goal stays active. Browser works; CI is excluded and
no user answer is pending.
