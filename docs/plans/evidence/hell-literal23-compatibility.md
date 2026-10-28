# Hell H1 — literal23 compatibility checkpoint

Status: H1 complete, independently approved; H2 remains next. Local only,
2026-10-27. Implements the compatibility prerequisite in the
[Hell implementation cards](../hell-replay-implementation.md),
[contract](../../design/hell-replay-contract.md) and
[ADR-013](../../decisions/ADR-013-source-backed-hell-replay.md).
BUG355 remains open. No gameplay or protected earned-save replay ran.

## Behavior and boundary

`validateFrozenV23Save` checks static literal23 quest/campaign/endgame authority
before and after normalization, while `validateSave` retains live current23
behavior. Historical two-profile types/aliases remain closed. The snapshot
contains46quests,21items,2actions,29areas and7service mappings, including
explicit Cain/Malus/Countess and Council authority, Act IV/V, titles,
entitlements, auras and replay profiles. Socket/material/base/stat/respec
validation and the generic structural shell remain intentionally shared; H2
does not change those catalogs or semantics.

Raw predecessor checks reserve new Hell keys only in the canonical container:
v1 `mapProgress`, v2+ `map`. Unrelated extras/shadow containers retain their
prior policy. Checks cover inherited, hidden and accessor properties without
invoking getters, intrinsic Map Hell entries, and own/hidden/inherited
Map-attached `.hell`. Current save version is23; no24 registration or Hell
runtime enablement is included.

## Exact validation and independent review

Baseline: `423d16e9b5e9e04d61f2525af91bf7873b017e96`.
The12-source digest is
`9111b7a3fa7a6890506388bf63050751fcf36725903533bbad918d99854316db`:
SHA256 of sorted relative path + NUL + lowercase file SHA256 + LF.
Frozen quest JSON SHA256:
`e7292ee8f2adb7d6433e236fc016c6b705be2c5c673b5841bc852ee94b159c71`.

| Check | Final result |
| --- | --- |
| Focused |185tests /3files PASS |
| Engine |10,480tests /396files PASS; native exit0 |
| Typecheck |native exit0;107.640s |
| Lint |native exit0;196.287s |
| Full units |20,796PASS /978files;2existing skips; native exit0 |
| Full duration |1118.94s Vitest;1120.558959722519s wrapper |
| Frozen inputs |3,459inputs; four static/full before/after manifests agree |
| Input differences |none |

Final input snapshot:
`f6146e02479cc346eeafd20fb1b9122c0ae9c31f99f10df1fc96527a35402a73`.
The original full session81831 is terminal0 and consumed. Both skips are
unchanged opt-in earned-state experiments, not new H1 skips. Source review
APPROVE/securityPASS/evidenceADEQUATE and combined exact-packet review
APPROVE/findings[]/readersReleased verify all44 referenced hashes/sizes,
12current sources,24unique baseline files and all four input inventories.
No source changed during final validation. `git diff --check` passes.

Packet SHA256:
`ab96bb908ecf59bfb8ba1cc0307b216741aca7cc2b418e2a8b12e84a3011b058`.
Combined review SHA256:
`1809a08a0a74129bcf35ffbc72d6e8b13a5dd4dc94c277088aa85afbc60878d5`.

## Retained failures and limits

The causal predecessor run records73failed/53passed/126total; all23 valid
version baselines and reciprocal Act I negatives pass. Map-attached6/6RED
and unrelated-shadow1RED remain distinct receipts. Earlier mixed attempts
include superseded fixture/expectation assumptions; they are retained as such,
not relabeled product defects. The nested focused attempt includes one
error-message expectation failure, superseded by final185/3.

Initial typecheck failed TS2322/exit2 at `current-campaign.ts:24`. The final
repair changes only the `act5-campaign.ts` validator parameter annotation to
accept an arbitrary candidate selected-title string before validation. It
does not change its runtime body, widen historical durable types, or add a
cast/suppression. Only that source differs between initial and repaired input
snapshots; final static/full green supersedes the failed attempt.

H1 build is deferred to the required H2 build under the approved cards. No
browser, earned acquisition, balance, pacing or full-v1 acceptance is claimed.
Constructed compatibility fixtures and unit passes cannot establish those.
H2 proposals and the separate Static Field Hell policy have not been
integrated or executed in this checkpoint.

## Retention and verified cleanup

The reviewed retainer (SHA256
`6d149efe2c9be7cd67cac34edc4a8202938cfaa15a337a112c0cb61f6292acc3`)
ran only after all readers/processes released and the exact packet passed.
Its source review is APPROVE/securityPASS. Its original overwrite/symlink
finding and the resolved exclusive-create revision are both retained.

Archive:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h1-final-4733zjmz.evidence.tar.gz`

SHA256:
`747d122d6be852aa55ae00c81db39b0fed6e57167ae9fd39db7061a7b51602ff`

Sidecars share that absolute prefix, replacing `.tar.gz` with
`.manifest.json`, `.retention.json` and `.cleanup.json`.
The47members include `final/packet.json`, `final/combined-review.json`,
raw `final/` and `producer/` logs/manifests/receipts and `retainer.py`.
All members were byte/hash verified during retention and independently read
back by root after native exit0. Exactly46raw files and3directories were
removed; both exact raw roots are absent, remaining[]/failures[]. Root then
hash-verified and removed the exact sibling retainer script after terminal;
its absence is recorded in the cleanup sidecar.

Root retains this archive and the three sidecars through H2, independent and
full-v1 evidence consumers, then owns their removal. The claimed umbrella
worktree and full objective remain active. H2 live Hell/save24, H3 browser
prerequisites and broader earned pacing/build/economy/device/a11y/performance/
PWA/CI/human acceptance remain unfinished; Cobra policy still awaits a choice.
