# BUG-320 — Observe the disabled claimed quest button

Status: Locally resolved; zero-action public recovery and exact durability verified.
Evidence/fix commit: `3768356e` (task-local observer correction; no product change).
Severity: Medium (native QA harness; workaround preserves the consumed claim).
Owner: qa-engineer / root campaign driver. Game UI is behaving as authored.

## Reproduction

1. Runtime `2850de61`, validated production build `8fc0ae32`, bundled Chromium,
   360×640, en. No supplied native combat seed; this failure is a UI assertion.
2. From the genuinely completed Throne427 export, click Eve's Claim once.
3. The task-local `claim-eve.mjs` then expects the claim button count to become
   zero. That expectation times out with one matching button.

Expected: observe the existing disabled claimed button and its localized text,
verify the exact earned reward, then Save → close → Continue. Never repeat the
consumed claim to repair an observer.

Actual: the assertion stops after the successful claim. The caught stop exports
the current genuine state, including rewardClaimed=true, title and Nightmare
entitlements, XP and loot. No second claim occurs.

## Cause and evidence

`src/features/quests/QuestsScreen.tsx:243` renders the button whenever quest status
is completed; `disabled={!claimable}` and `rewardClaimed` select the disabled
localized label. Removing that correct behavior would repair the wrong layer.

Task root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-baal427-nfhiv849`

Original `native-eve-claim/report.json`, log, failure screenshot/DOM and
`native-eve-claim/004-stopped-native.json.gz` preserve the failure. Stopped raw
SHA256: `0abd575b9e591d8a8dc42653ebe496509acc77f6dd566b84bcc6dc009c23d52b`.
Original process 56306 exited 1 and was consumed. One claim was clicked.

## Recovery

Use only the stopped genuine claimed export. Correct the observer to require
the disabled localized claimed button before and after exact Save/close/Continue.
Verify authored rewards against the preclaim genuine export and pure deterministic
quest reward calculation. No gameplay action, claim replay or product change.
Retain the original failed evidence alongside the recovery result.

## Verified result

`recover-eve-durability-r2.mjs` requires the authored disabled `Claimed` button
before and after exact Save/close/new-page Continue. Original process59034
exited0 with six save snapshots, zero gameplay actions, no native errors and no
remaining browser profiles/downloads. Full reward IDs/payloads also pass after
BUG321's separate oracle setup correction. The original single claim is never
repeated. [Integrated evidence](../../docs/plans/evidence/d11-earned-baal427.md)
and its summary retain original failure, recovery, archive and cleanup receipts.
