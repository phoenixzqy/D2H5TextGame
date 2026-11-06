# BUG-383 — Complete Larzuk’s explicit item presentation route

- Severity: High — advertised side-quest has no executable completion action.
- Status: Resolved locally; bounded current26 source/UI/browser reviews and final local checks pass.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL static source/cross-reference reproduction; no browser
  or viewport execution for this reproduction.
- Locale: authored English data; both en/zh-CN UI need alignment.
- Seed: not applicable to missing action routing.
- Owners: frontend-dev/engine-dev/content-designer; root integrates.

## Reproduction

1. Read `quests/side-act5-larzuks-sockets` in `src/data/quests/side.json`.
2. Follow its `obj-bring-item` `deliver` objective into live town actions.
3. Inspect `QuestServicePanel` and existing selected-item service candidates.

Expected: after qualified Siege completion, select actual eligible gear at
Larzuk, explicitly Present it unchanged, then Claim the independent side charge.

Actual: generic quest delivery handles `give`; explicit gear Present is bound
to Charsi. Larzuk’s service panel only lists already-issued charges. The side
service source and socket consumer exist, but no current action earns the side
quest completion. Completed flags are not evidence of actual presentation.

## Evidence and repair boundary

Read-only producer and design-contract investigations agree. Exact static quest
and relevant source hashes are retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei/larzuk-source-repro.json`.
This records source reproduction, not an earned campaign or browser result.

[Approved contract](../../docs/design/larzuk-side-presentation.md) preserves the
item and separates Present, Claim, and use. Preserve existing legacy available/
consumed charges; infer no replacement charge. Ormus/current25 integration and explicit contract reviews now pass; literal25 compatibility freeze, save26, actual/deep Present, protected side Claim
and localized panel now pass focused tests and independent source review. Headed
production browser v3 passes the native Shenk→Present→Claim→socket and exact
Save/import/close/reopen routes in both locales. See
[implementation evidence](../../docs/plans/evidence/larzuk-presentation.md).
Final full checks and independent browser evidence review remain in progress.
