# BUG-358 — Localize canonical main and side quest cards

Status: Open — resource repair, native rendering and development-browser layout verified; final production-bundle completion remains pending. No forge label/status applied.
Severity: Medium — zh-CN quest cards fall back to English; the quest remains usable in English.
Found: 2026-10-28.
Build: `36d54d677c79ff3f70684d19e1d622e6a9f0bc39`.
Environment: Node24.21.0, installed i18next23, shipped JSON and exact QuestsScreen lookup/defaultValue policy; no browser/viewport or combat RNG seed applies to this resolver reproduction.
Locales: zh-CN and en resource completeness; visible language defect in zh-CN.
Owners: frontend-dev / writer / content-designer; producer coordinates native acceptance.

## Reproduction

1. Load both shipped `quests.json` locale resources into the installed i18next resolver, with fallback language en.
2. For each of the 46 shipped main/side quests, derive its key with the existing trailing slug and `side-` prefix removal, then resolve `byId.<slug>.name`, `desc` and each ordered `objN`, using authored English data as defaultValue as QuestsScreen does.
3. For example, resolve `byId.act1-sisters-burial-grounds.name` in zh-CN: the result is `Sisters' Burial Grounds`; the canonical entry is absent in both resources.
4. Repeat for `act2-seven-tombs` and 17 side quest slugs. There are 59 missing fields per locale across 19 quests, out of 164 required fields per locale.

## Expected and actual

Every shipped canonical quest name, description and objective has an entry in
each own locale resource. Chinese cards use Chinese copy. English entries retain
the actual main/side quest meaning and ordered objectives.

The runtime resolver falls through to authored English for all 59 missing fields
in each language. Legacy keys such as `act1-sisters-burial` do not match the
canonical ID. `act2-duriel` is bounty copy and lacks the second main objective,
so blindly aliasing it would show the wrong quest and omit required context.

## Evidence and repair boundary

The fresh native resolver probe exits0 and preserves all missing tuples and
resolved English values at:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-quest-locales-bu0ggpfk/localization-resolver-probe-results.json`.
Its executable is `reproduce.mjs` in the same root-owned packet. This reproduces
the resolver defect; it is not React/browser or viewport evidence.
The independently reviewed source/lookup findings are retained in the prior
Cobra packet as `localization-followup-review.json`, SHA256
`3041015e4662eac1b2bd7942169b75444af0f23ad42bf09efffac1e36d9998b9`.

Repair only missing canonical `byId` entries in both locale resources, with an
all-shipped own-locale contract and affected main/side card render regression.
Preserve quest IDs, authored gameplay data, fallback behavior, rewards/progression,
legacy locale entries and scanner policy. Root retains decisive raw evidence
through unfinished full-v1/independent consumers and owns verified cleanup.
Whole-app locale/layout/browser and full-v1 acceptance remain separate.
## Native repair checkpoint — 2026-10-28

Added only the missing canonical entries to both own-language resources. All
46 shipped quests now supply all 164 required fields in each locale. Existing
values/aliases, authored gameplay, IDs, fallback and scanner policy are preserved.
The six-case regression in `src/features/quests/QuestsScreen.localization.test.tsx`
fails against baseline resources and passes against the reviewed repair, with
zero act warnings in both final runs. It checks actual main/side cards in both
languages and own-resource completeness, including ordered objectives.

[Native repair evidence](../../docs/plans/evidence/canonical-quest-localization.md)
records the exact source hashes, RED/GREEN pair, passing typecheck/lint/fresh
production build and clean full run: 21,195 passed, two exact baseline skips,
991 files. The first full run's initialization timeout remains preserved in
[BUG-359](BUG-359-player-inventory-entry-timeout.md); unchanged isolated and later
full runs pass, but its cause remains unresolved.

This completes native resource/render verification only. Keep BUG-358 Open for
browser/layout completion; whole-app locale, device and full-v1 gates are pending.

## Development browser checkpoint — 2026-11-04

[Current quest readability evidence](../../docs/plans/evidence/p16-quest-readability.md)
verifies all24 main/22 side cards, own-locale names/descriptions and ordered
objectives in both locales across five target sizes. Larger body/status text
under BUG689 preserves scroll reachability with no measured page overflow or
navigation overlap. Six unchanged native localization cases pass again.
This uses fresh characters/public UI on the current ordinary development server.
Final production-bundle verification remains for the combined source, as required
by the owner's scoped-verification override; keep this bug open for that check.
