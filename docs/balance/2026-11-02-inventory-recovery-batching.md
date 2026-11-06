# Inventory recovery batching — 2026-11-02

Status: retained locally; BUG592 and full private v1 remain open.

The quest reward list now resolves recovery statuses in one fresh query. It reads
the authored quest catalog once and validates the complete delivery ledger once
for eligible rewards. Singular APIs delegate to the batch. No caller-supplied
trusted context or cache survives between reads; recovery actions still revalidate
at the transaction boundary. Non-delivery quests preserve their previous semantics.

Affected verification passes 165 distinct assertions across nine files, scoped
strict TypeScript and six-file ESLint. Tests cover bilingual query read counts,
real hand-ins versus flags alone, fresh ready/owned/consumed reads, malformed and
repaired ledgers, mixed delivery/non-delivery quests, and existing persistence
boundaries. Nine stale storage assertions now check ADR-018's json-v1 envelope
and complete parsed portable payload; reward and once-only checks are retained
(BUG601). Earlier failed fixture expectations remain in the evidence packet.

Matched Chromium desktop/en (1280×800) and mobile/zh-CN (360×640, 4×CPU) use the
same earned level72 save with 8,540 backpack items. Each profile has one profiled
first opening and five unprofiled warm openings.

| Inventory opening | Before | After |
| --- | ---: | ---: |
| Desktop first | 452.789 ms | 446.631 ms |
| Desktop warm median | 402.099 ms | 407.695 ms |
| Mobile first | 2090.427 ms | 1482.247 ms |
| Mobile warm median | 1108.497 ms | 1086.399 ms |
| Mobile first longest task | 236 ms | 225 ms |

Mobile sampled inclusive recovery-query time drops 26.067→8.953 ms and quest-panel
time 172.141→153.782 ms. These overlapping CPU samples cannot be added. Development
diagnostics support retaining the reduced work, not uniform speedup or release
budget acceptance. Warm improvement is small and desktop is roughly unchanged.
Exact complete native IndexedDB and public import/export equality pass before and
after inventory; no console/page errors or horizontal overflow. Viewed screenshots
show the opening inventory, not complete quest-panel visual/accessibility coverage.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `bug592-recovery-batch-{baseline,candidate,readback}-v1` reports/drivers,
profiles, screenshots, affected JSON/logs, types/lint logs and BUG601 results
through umbrella review. No unrelated test or campaign reruns.

Authority58 adopts the already-verified candidate manifest: 2,141 inputs, exactly
six changed quest/inventory source/test files from57. Source hash
`a5ddfda8d0b7071a20a0ebc326386b45fafdf9b462e3770f5d6ef057f526405a`;
unchanged data hash
`f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`.
Canonical earned72 successor remains SHA256
`aa7f9ed5196513e1a0045c59624550c815876b745d5e48c4512129859ca8ed76`.
Both driver-owned caches are absent, cleanup reports empty and consumers terminal.
Root retains required worktree/evidence and owns eventual cleanup/release.

Next return to intended-power/build-identity/population and retry policies using
the all70 quest-ready boss-source union. Accepted balance remains0/210; full
14-build fresh campaigns/holdouts, funding/economy, defeat/retry/manual-idle,
calibrated30–50 active hours, BUG592, integratedG0–G7, soak and independent review
remain before owner playtest. Browser works; CI excluded; no pending answer or
external blocker. Security check passes: local first-party documentation and
existing evidence only; no grants, installs, credentials or publication.
