# BUG-464 — Select merc gear with native slot compatibility

Status: fixed locally and verified; no commit. Severity: High (campaign harness).

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local
changes, Node24.21.0/Vitest1.6.1/WSL. Browser/viewport/locale are not applicable
to native campaign simulation. No supplied seed or historical save was loaded;
native creation uses the runner's declared clock1793304000000.

## Reproduction

1. Run the maintained fresh Act I campaign with `sorceress-cold-nova-focus`,
   `level-training-v1` and `act1-training-v1` recovery.
2. Earn L6 in40 native Blood Moor admissions; apply the first merc gear boundary.

Expected: only candidates compatible with the native merc equip slot are scored.

Actual: player `slotCandidates` includes one-handed weapons for offhand, while
native merc `equipOnMerc` accepts the base's own slot. The harness selects an
earned katar and stops on `incompatible_slot`. Native rejection is correct and
unchanged. All40 preceding waves won; L6/11080 earned XP and152 dropped items
remain in the terminal report, with100 native salvage removals reconciled.

Evidence: retained `p15-maintained-nova-act1-v1` report, compressed journal and
export plus `p15-maintained-nova-act1-v1-run-exit.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Wrapper exits1 after18.207s and verifies no live owned descendants. Journal
records the exact failed `merc-equip` and native refusal reason.

Affected system: campaign QA, root sole writer. Filter candidates with the same
native slot rule as `equipOnMerc`; retain monotone projections, owned-item
transfers and strict unexpected-refusal assertions. Add a failing owned-katar
regression before changing candidate selection. No gameplay-data change,
validation bypass, install, commit or publication. The owned-katar regression
first fails with the exact native refusal, then7 gear checks pass13.308s after
the existing helper is exported as `isMercEquipmentSlotCompatible` and used by
both selection and transfer. Existing native transfer/capacity27PASS15.536s,
scoped strict types12.348s and harness/native-file lint13.552s/8.104s pass.
The failed fresh report remains retained; a new exclusive measurement follows.
