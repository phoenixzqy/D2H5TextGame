# ORMU-21 — Activate the executable localized quest and honest journal

Status: bounded functionality accepted locally; current25 integration checks pass.
Own: side.json, en/zh-CN quests, QuestsScreen.tsx and focused catalog/UI tests.

Preserve first objective ID, replace nonexistent kill/dungeon with actual
Normal manual Flayer Jungle full clear, append ordered current-town Ormus Talk,
and author the exact unique object reward. Both locales describe equipped-only
Life20/Mana10. Completed proofless legacy history renders actual flags and
cannot Claim. Starting the real side-tab quest initializes both objectives.

QA:71/6 passes across Claim/journal/Town/catalog. Two causal legacy-objective
rendering REDs precede the UI repair; earlier wrong-selector/tab fixtures are
harness diagnostics. Independent design_contracts APPROVE. See
[bounded evidence](../../../docs/plans/evidence/ormus-first-charm.md).

Local checkpoint: 2026-10-29, full units22,247/1,057, typecheck/lint/build
pass; independent bounded browser ADEQUATE. No commit/push. Owner playtesting,
earned balance and full-v1 acceptance remain open.
