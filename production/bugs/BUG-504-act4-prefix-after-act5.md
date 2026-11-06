# BUG504 — Closed Act IV assertion used after Act V receipts exist

Status: Fixed locally in the v2 external continuation; native run/readback passed.
Severity: Medium — prevents the new driver from reaching combat; product unaffected.
Owner: Root (P15 campaign transport), local private-v1.
Environment: WSL, Node24.21.0, dirty `feat/playable-foundations` at b5a08988.
Browser/viewport/locale are not involved.

Reproduction: run packet `p15-bow-act5-crown-magic-resist-continuation-v1`
against the exact earned next1487/40/48action Bow successor. The driver invokes
`assertActFourComplete` after Siege/Shenk has already completed in Act V.
The helper correctly requires a closed Act IV boundary; it rejects the extra
`quests/act5-siege-on-harrogath#action:shenk-victory` receipt. The assertion
fails before socketing/admission. This is an incorrect caller scope.

Expected: validate the unchanged successful Act IV action prefix and the
current cumulative quest graph, including earned later-act receipts. Preserve
the closed-boundary helper for its existing callers. No duplicate Starts or
Claims, receipt pruning, or suppressed validation.

Actual: technical failure at `tests/campaign/act4-route.ts:96`, zero new
waves/admissions/socket costs. Prior native capacity cleanup removes80 items;
that committed cleanup, currency/material delta and exact export are retained.
The report's cumulative economy/XP/quest/export/source audits pass.

Correction: new driver validates canonical Act IV entries plus the cumulative
quest auditor, then consumes the exact failed-driver successor. Explicitly
verify the known failure, zero new waves and48retained actions before restore.
Do not discard cleanup rewards by restarting the preceding save. Independently
read back both the failed cleanup and the new native continuation.

Evidence retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-bow-act5-crown-magic-resist-continuation-v1.{json,raw.jsonl.gz}` and
its terminal wrapper log/exit receipt. Root retains these through umbrella QA.

Resolution: v2 resumes the exact failed v1 successor, validates canonical Act IV
entries and the current cumulative quest graph, and reaches native1487 without
replaying prior Starts/Claims or deleting Shenk's receipt. It performs two native
Crown socket insertions, earns three new wave victories, then records a genuine
Frigid W4 defeat. Both the failed cleanup and corrected continuation pass the
independent `p15-bow-act5-crown-readback-v1.py` custody/seed/time/quest audit.
Scoped types/lint pass. The source helper remains unchanged. No commit/PR is
authorized for this local checkpoint; the report's exact source pins are retained
in the artifact manifest rather than claiming a committed fix.
