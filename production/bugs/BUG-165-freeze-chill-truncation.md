# BUG-165 — Preserve secondary Chill on freezing cold attacks

Status: Fixed locally; independent acceptance pending.
Severity: Medium. Freeze still applies; sustained Chill requires a different
skill or a living Holy Freeze mercenary.
Owner: root, engine responsibility; no delegation.

## Reproduction

- Commit333a6ef; Node/Vitest production engine, no browser required for repro.
- Constructed combat fixture, seed5, English-independent engine behavior.
- Browser verification target: production Chromium360×640, en/zh-CN.

1. Load actual JSON-backed default skills.
2. Cast Ice Blast, Glacial Spike or Amazon Ice Arrow once at a living enemy.
3. Compare the authored `appliesStatus:[freeze,chill]` and the registered
   damage effect; inspect the resulting status events and enemy cadence.

Expected: one successful cold hit applies Freeze followed by Chill. Chill
remains for its full two seconds after the shorter Freeze has expired.

Actual: the registered effect contains only `applyStatus:{id:'freeze'}`.
No Chill is applied by any of these three skills. The secondary adapter accepts
explicit Freeze metadata and Meteor's contracted Armor Melt, then discards
the ordinary Chill tail. The UI still advertises both statuses.

Evidence: `src/engine/skills/dataCatalog.ts` secondary-status flatMap;
`src/data/skills/sorceress.json` Ice Blast/Glacial Spike and
`src/data/skills/amazon.json` Ice Arrow. Retained Ancients trace separately
shows the mercenary dying before the final wave; it does not prove this defect
caused that campaign failure. No genuine save or consumed action is modified.

`src/engine/combat/freeze-chill.test.ts` and the BUG165 registry cases reproduce
29 failures/82 passes at the unchanged adapter. Raw `red-v4.log` is retained in
the contract's task directory. Earlier attempts retain a deprecated cache CLI
failure and three fixture mistakes: pure legacy engine callers intentionally
fall back to rank1, and comparing full legacy/explicit results also compares
their deliberately different allocation metadata. The corrected compatibility
case compares actual recordings and enemy state; no runtime assertion is
weakened. These tooling/oracle failures are separate from the29 causal failures.

Implementation/acceptance contract:
[D04 Freeze/Chill](../../docs/plans/decisions/D04-freeze-chill-v1.md).

## Resolution and validation

The shared JSON adapter now preserves default Chill for the exact active cold
`[freeze,chill]` pair. The production catalog comparison finds exactly three
changed skills among213; the other210 are unchanged. No balance data, save
format or combat execution loop changes.

Final focused suite139/3files PASS; engine5792/178files PASS77.95s;
full unit11722/455files PASS503.87s, two existing skips. Final typecheck/lint
and explicit `VITE_E2E=false` production build PASS. Existing test-time budgets
are exceeded; bundle/PWA warnings and independent acceptance remain open.
Production Chromium360×640 verifies Ice Blast and Glacial Spike in en/zh-CN:
four cases show ordered Freeze then Chill with the merc unfielded, exact
Save-close-Continue, no page/console errors or horizontal overflow. Each case
uses a diagnostic copy and flees before rewards; no earned action is replayed.
The initial zh selector failure and initial incorrect three-target Glacial Spike
oracle are retained separately from the causal failures; its authored fallback
is two targets, and the corrected case also asserts the third stays untouched.

Raw logs, recordings and screenshots remain at the task path in the contract.
The genuine campaign input still has nextNormal400 and raw SHA256
`a6f706340a4a3f5a6374f2322a85fdf12dd1770dc46bf08c74af1711aa14bc90`.
Qualified native preparation and campaign continuation are separate actions.
