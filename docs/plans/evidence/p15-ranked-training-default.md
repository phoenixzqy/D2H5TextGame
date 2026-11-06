# P15 — Ranked training fallback defaults for fresh preparation

Date:2026-11-03. Owner:root. BUG663 fixed/verified locally in the retained
`feat/playable-foundations` working tree; full privatev1 remains incomplete.

## Cause and correction

Fresh shared preparation silently omitted the already implemented ranked policy
unless a driver opted in. After a failed productive training source and its
single learned offensive retry, this selected permanent Dark Wood fallback
instead of the next eligible earned clear. The constructor now explicitly
records `ranked-cleared-v1` for omitted, empty and explicit options.

The correction is at construction only. Retained absent-policy states keep
historical behavior in runtime, continuation and audit. No source eligibility,
two-level margin, recovery, exclusion, route reset, XP, target, save or limit
changes. No retained recording or exhausted budget is upgraded.

## Verification

Packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-ranked-training-default-v1`.

- `default-red.log`: omitted and empty options fail the recorded-policy check.
- `behavior-red.log`: default source selection fails the productive-farm check
  after two constructed Plains training draws, including the offensive retry.
- `affected-green.log`:45selected constructed cases pass (ActIII25,ActIV10,
  ActV10). The52unselected cases are excluded by the recorded name filter;
  no tests are disabled and no earned campaign is replayed.
- Default and explicit Act IV policies both retain Durance after the failed
  source, reset exclusions after route victory and pass full attempt audit.
- Historical Act III states preserve absent policy across interrupted training,
  safe fallback, nonwin/per-area/admission limits and offensive recovery.
- The Act V fixture uses no options and requires the new policy. Existing
  fallback/recovery/cap and forged-evidence cases retain their assertions.
- `types.log` and `lint.log`: scoped strict TypeScript and explicit four-path
  zero-warning ESLint pass. Exact commands and exits accompany every log.

Plan/security review and exact preimages are retained in the packet. Root
self-review verifies a single shared source correction; it is not final
independent integrated acceptance.

## Limits and ownership

No native combat, income, new clear, population/holdout or pacing evidence.
Counts remain14individual intended ActIclears,3five-act Normal completions,
formal0/210. Browser works; CI excluded; no pending answer/external blocker.
No agents/install/commit/push/publication. Required packet and worktree remain
root-owned through umbrella review; root owns eventual cleanup/release.
`closure.json` records final hashes and exact disposable config cleanup.
