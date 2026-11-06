# Current JSON semantic validation — 2026-11-03

Current-version JSON decoding now performs each semantic validation once.
The private JSON path parses internally without a reviver, normalizes by
identity and uses a read-only schema. Quest, campaign reward, socket and charm
checks therefore need no second pass over that identical tree. Legacy quarantine
still runs after the schema. Native objects and historical saves keep their
existing representation checks. No save format, persistence ordering, cache,
gameplay data or public trust option changes.

## Verification and measurement

All 183 affected cases pass across save validation, native descriptor safety,
persistence lifecycle, persistence and storage adapter tests. Four added cases
preserve valid quarantine payload/provenance and native error parity for invalid
origin, duplicate origin and malformed payload; those four also pass against the
original production implementation. Scoped strict TypeScript and changed-file
ESLint pass. The first test invocation collected no files because its external
configuration lacked an explicit workspace; the corrected invocation and the
original failure are retained. The final count uses actual assertion statuses.

Seven alternating complete parse/validate/restore pairs use the same earned
8,540-item current save. Every output equals the complete original state.
Median decode falls from 89.785 to 77.503 ms (13.680%), passing the frozen 10%
criterion. One pair regresses; all raw samples remain available.

One matched production build per variant runs in the same Chromium instance.
The baseline overrides only validate.ts with its exact pre-change bytes. Each
variant/profile performs three public imports and three reloads, verifying the
complete IndexedDB JSON-v1 save and public export after every operation.

| Profile | Median import before → after | Median reload before → after |
| --- | ---: | ---: |
| Desktop 1280×800, en, CPU1 | 439.312 → 229.872 ms | 738.610 → 602.126 ms |
| Mobile 360×640, zh-CN, CPU4 | 951.953 → 859.390 ms | 2,551.062 → 2,365.717 ms |

All four contexts have an activated service worker, no browser/console errors,
no horizontal overflow and no production test bridge. All four screenshots were
inspected. Candidate mobile reload long tasks remain 766–804 ms. These bounded
localhost samples do not establish device, percentile, offline or broader runtime
budget acceptance. Keep BUG592 open; no timing retries or campaign replays ran.

## Provenance and retention

Production source hash during both measurements:
`b7783834bf865c8521c1d95a19b9d31d7f5bdb665dc4eff96765c10b90981eb9`.
The baseline validate.ts SHA256 is
`5c7995f2bb1d8dd89f09b4a6331ce1d3089f16388745cab77db68328c071a2a3`.
The measured current JSON SHA256 is
`a16ffc887d5916bdbad9690eafc58aa145dc7f68cc059fab47aad75476f5c1f6`.

Required evidence is retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `bug592-json-semantic-once-v1`: frozen plan, exact source backups,
benchmark/browser drivers and reports, assertion results, check receipts,
screenshots, compressed production assets and closure receipt. Session75588
exited0. Its exact build/cache directories and the owned type-info file are
absent. Root retains the required packet and claimed human2 worktree through
umbrella review and owns eventual cleanup/release.

The preceding status turn was a verified wait on that live session. This
continuation accepts the measured code change and records its evidence.
All14 intended Act I clears, main Corpse/Bone Normal completion, Cold Act V
partial and Javelin Act IV partial remain unchanged. Formal balance acceptance
is0/210; full privatev1 remains incomplete. Next return to later intended-build
progression without renewing exhausted Cold/Javelin attempts. Economy/fairness,
pacing, manual-idle/defeat-retry, remaining Hell/endgame and integrated G0–G7,
review/soak and subsequent owner playtest remain. Browser works; CI excluded;
no pending user answer or external blocker.
