# BUG-644 — Compare campaign source identity independently of Git document metadata

- Severity: Medium
- Status: Fixed locally in external V2 reader; no commit requested
- Owner: QA / root session (no delegation authorized)
- Affected systems: external retained-output campaign reader
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working production tree
  `b7783834bf865c8521c1d95a19b9d31d7f5bdb665dc4eff96765c10b90981eb9`
- Environment: WSL, installed Python/Node tools; no browser, viewport or locale
  involved. No combat replay or new RNG seed is needed to reproduce.

## Reproduction

1. Read the immutable `p15-fire-earned-act3-v1.json` in the evidence packet.
2. Compare `sourceBefore` and `sourceAfter` using the frozen V1 reader.
3. Observe its assertion failure at line 41 before journal accounting starts.

Expected: independently authenticate every production/campaign input, source
revision, tool identity and policy. Report document-only Git status changes
separately from source identity.

Actual: whole-object equality also compares advisory `dirty.porcelainEntries`.
The only difference is the untracked report filename changing from
`docs/balance/2026-11-04-fire-act2-completion.md` to the corrected
`docs/balance/2026-11-03-fire-act2-completion.md`. Both complete source manifests,
tree/data hashes, revision, tool versions and campaign manifest are identical.
Production `assertSourceStable` correctly compares revision/tree/data identity.

## Evidence and remedy

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain original `p15-fire-earned-act3-v1-readback-v1.py`,
`p15-fire-earned-act3-v1-readback.log`, `p15-fire-earned-act3-v1-readback-exit.json`,
plan, report, journal and native export unchanged.

Correct only a new V2 reader: require exact equality of every source field
except advisory Git status; independently hash every frozen source/campaign
entry; require and report this exact observed document rename. Add negative
checks showing source hash, manifest and unrelated status drift are rejected.
Read retained outputs once; never replay gameplay to repair accounting.

## Local verification

The V2 reader passes the complete 1,304-wave retained journal and exact native
save accounting without gameplay replay. Its SHA256 is
`20d0273a9720cd819efcc7e6d9949372e695a41cc1ff2030784d9776b8dfb0c8`.
The same evidence prefix retains `-reader-v2-correction.json`,
`-reader-v2-guard-check.json`, `-readback-v2.json` and `-readback-v2-exit.json`.
Eight negative cases reject tree/data/revision/tool/manifest/policy drift and a
verified new unrelated Git status entry. Original failure and V1 stay intact.
The initial negative fixture appended an already-present status entry; its
preparation correction is recorded in the guard receipt. No production change
or combat rerun is involved. See the [completion report](../../docs/balance/2026-11-03-fire-act3-completion.md).
