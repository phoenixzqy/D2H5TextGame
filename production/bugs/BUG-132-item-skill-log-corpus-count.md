# BUG-132 — Include the separate item skill in the combat-log corpus gate

Severity: Low. Status: Corrected and validated locally.
Owner: qa-engineer; root is the sole writer.

Reproduction: local2317d54 plus the active-integration changes; Node/Vitest
UI/jsdom, both en and zh-CN. Browser/viewport and RNG seed are not applicable.

1. Run standard `npm test` alone.
2. Observe the two complete-authored-name-corpus cases in
   `src/stores/eventToLogI18n.test.ts`.

Expected: explicitly preserve the286 historical non-item rows and require the
single approved `item-redemption` row; check localized log names for every
authored row and its normalized alias, including literal Redemption copy.

Actual: both cases stop at the old exact286 total, while the newly approved
separate item row correctly makes the central manifest287. Neither reaches
its complete name assertions. This does not establish a runtime name defect.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-actives-33rokgzu/full-integrated.log`.

Root cause: stale total-cardinality test after the approved item-only skill
was added. No workaround, skip, weaker count or runtime behavior change is
appropriate. Campaign and full-v1 acceptance remain open.

Correction: require286 non-item rows and exactly one item row, preserve every
authored/alias localization assertion, and add literal en/zh Redemption cast
messages for both `item-redemption` and `item.redemption`. The complete112-test
file passes; combined with the compatibility controls145/3files pass. The
independent follow-up source review is CLEAR; no full-head/browser acceptance
is inferred. Final commit and integrated evidence will be recorded in
`docs/plans/evidence/d10-runeword-actives.md`.

Integrated final gate: corrected root pool, standard `npm test`,407files/
11027pass/2existing opt-in skips,340.55s,exit0. No source/config drift through
that run; see `docs/plans/evidence/d10-runeword-actives.md`. Broader full-v1
acceptance remains open.
