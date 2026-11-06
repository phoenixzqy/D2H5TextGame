# P15 — Barbarian owned weapon selection and retained-save checks

2026-11-03. [Decision](../decisions/P15-barbarian-owned-weapon-v1.md).
Campaign preparation now uses the existing physical-offense selector for intended
Double Swing from level 6 and Double Throw from level 12. First acquisition of
the required weapon type takes precedence over that score; subsequent preparation
retains the build's weapon type. This changes evaluation preparation, not game
damage, rewards or equipment rules. BUG659 and BUG656 remain Open.

## Focused implementation verification

All 35 cases in `tests/campaign/intended-equipment.regression.test.ts` pass,
including unlock boundaries, offensive tradeoffs, first throwing-weapon acquisition,
capacity fallback, custody and idempotence. Scoped strict types and explicit
zero-warning lint pass. The original RED, initial GREEN and corrected GREEN
results remain retained; the decision explains the two test-expectation corrections.
No broad suite or earlier-act campaign was repeated.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-barbarian-owned-weapon-v1`.
It retains exact preimages, plans, source manifests, drivers, reports, exports,
logs, failure readbacks and the archived typecheck configuration.

## Retained Double Swing check — incomplete preparation

The single preparation invocation starts from the level49/next711 export with
SHA256 `5668fcbe45ee098447b4aa8dc2c7cd508730a13fea414326337984c4b861f10a`.
Its 149-item backpack exceeds nominal capacity100. Retrieving the selected
stashed weapon needs50 staging transfers before retrieval, exceeding the frozen
32-action limit. Transfer33 settles before the diagnostic callback throws.
The driver preserves the actual partial terminal save and restores its isolated
memory realm. No equip or repeated preparation call occurs.

`swing-failure-readback.json` reconstructs all33 transfers and the entire terminal
save, including the last transfer absent from the per-action snapshot list.
The first32 snapshots match individually. Equipment, resources, quests, economy,
timestamp and ordinal remain unchanged; all items remain owned. Partial export:
`swing.native-export.json`, SHA256
`7acaff5c072833202d0e96b31abf0bb3ecddbe84199f0059c911f51f00219850`.
The selected candidate's physical expectation is446.837 versus229.769 current;
selection is observed, but native equipping and encounter improvement are unproved.
The original input remains unchanged. This failed preparation is not restarted
and its limit is not renewed; preserve the partial successor as diagnostic evidence.

## Retained Double Throw check — no eligible owned upgrade

Read-only preflight finds142 backpack items, requiring at least43 transfers for
a stashed candidate. Before any Throw execution, the unused32-action plan is
archived as `throw-plan-unexecuted-v1.json` and superseded by a prospective
128-action plan. All other limits remain unchanged: two calls maximum, zero
combat, no clock advancement. This does not renew Swing's spent limit.

The single Throw invocation performs no native action: every slot selects no
upgrade. It then fails the driver's assumption that its mainhand must change.
The sole eligible alternate throwing knife scores199.766 versus200.731 current;
stronger nonthrowing weapons are correctly rejected by the build requirement.
`throw-failure-readback.json` independently checks signed score arithmetic,
candidate policy, source manifests and byte-exact unchanged terminal export.
The level49/next709 export retains SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`.
There is no second call or verified idempotence on this save. Newly added ordinary
throwing tiers establish possible future sources, not earned ownership in this
checkpoint. Earned acquisition and BUG656 throughput remain unresolved.

## Accounting, cleanup and completion boundary

Both invocations are terminal. Recorded launcher PIDs are absent; Vite/esbuild
close and exact case caches are absent. The exact disposable `tsconfig.json` is
removed after checking equality with retained `tsconfig.archive.json`; absence is
verified. Root retains the required packet and human2 worktree through umbrella
review and owns eventual cleanup/release.

There are zero admissions, combat milliseconds, quest actions, training runs,
balance cells or clock advancement. No failed encounter is replayed, no earned
gift is introduced and no exhausted gameplay attempt is renewed. Counts remain
14 individual intended Act I clears, three five-act Normal completions and
formal balance0/210. Full private v1 remains incomplete. Root's accounting
readback is not final independent review. Browser works; CI is excluded; no
pending user answer or external blocker. No agents, install, commit, push or
publication. The previous goal turn was status-only/no progress; these retained
checks resolve the next-action assumptions without claiming a combat fix.
