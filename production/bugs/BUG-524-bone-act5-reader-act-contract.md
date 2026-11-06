# BUG-524 — Bind Bone Act V readback to the Act V contract

Status: Fixed in task-local helpers (uncommitted; implementation HEAD unchanged)
Severity: Medium (task-local independent reader; native save is retained)
Owner: root / QA campaign readback

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty claimed worktree. Python3 reader; browser/viewport/locale not applicable. Native seeds remain in the retained journal. Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Retain `p15-bone-act5-initial-continuation-v1.json` after earned Shenk victory, Siege Claim and the Frigid loss.
2. Run the new `p15-bone-act5-resume-readback-v1.py` against that report.
3. Its admission assertion still requires `areas/act4-`, inherited from the Act IV reader. The correct Act V handle fails.

## Expected / actual

Validate actual `areas/act5-` handles and aliases, the canonical Act V quest suffix and authored potion/scroll receipt sources. Actual readback exits1 on the stale Act IV prefix. Review also finds draft potion/read IDs inconsistent with `src/engine/save/act5-state.ts`; these paths have not yet executed.

## Evidence and scope

`p15-bone-act5-initial-readback-v1-exit.json` and `.log` retain the failed assertion and terminal process cleanup. Native report remains technically completed, level50/XP363511/next1290/48 cumulative successful actions; its inline quest/economy audits pass. Correct only the local reader, preserve its failed bytes, and rerun readback without replaying combat or relaxing accounting/proof assertions. No production engine/data/UI change.

## Verification

Pending corrected independent readback. Retain native Shenk, all earlier acts, paid sockets and partial Frigid rewards.

## Fixed verification

Corrected task-local reader v1 checks actual ActV handles and canonical authored receipt IDs. `p15-bone-act5-initial-readback-v2` and `p15-bone-act5-frigid-control-readback-v2` pass without combat replay, covering all cage/potion/thaw actions and58 inherited/new actions. Failed reader bytes/log/exit1 remain retained. Scroll Read is still unexecuted; its literal ID is corrected against source but this partial route does not certify that later runtime flow.
