# BUG-360 — Resolve the fresh-lineage entry's file-URL assumption

Status: Open — current-source root-expression correction has focused regression coverage; full native-entry collection remains unverified. The frozen experiment remains terminal and cannot be retried. No forge hold/label/status applied.
Severity: High — blocks this test-only evidence path with no permitted workaround; no product defect or gameplay crash established.
Found: 2026-10-28 UTC.
Build: `33cf626fbb8ad7cbe8e2d2e6ffd30f845d0a6def` plus the four frozen fresh-lineage source files listed in the linked evidence.
Environment: Node 24.21.0/npm 11.19.0, Vitest/runner 1.6.1, jsdom 24.1.3, Vite 5.4.21, Tinypool 0.8.4. Browser/viewport do not apply; no browser was launched. No locale or engine RNG seed was selected before collection failed.
Owners: qa-engineer / technical-director; producer coordinates terminal review.

## Observed reproduction (historical; do not rerun)

1. With the reviewed fixed packet, manifest, sources and installed runtime, invoke `node scripts/measure-fresh-lineage-once.mjs` once in the claimed worktree. Tool session 18415 preserves the native result.
2. The parent records its exclusive `launcher-invoked.json`, then the installed runner collects the dedicated `.once.ts` entry in jsdom.
3. At entry line 38, `fileURLToPath(new URL('../../../..', import.meta.url))` throws `ERR_INVALID_URL_SCHEME: The URL must be of scheme file` before `it()` registers the case or worker admission runs.
4. Observe one failed suite, zero tests, child exit 1/signal null, awaited clean close and a durable failure footer. The parent wall duration is 1671.784203ms. No character or combat action occurs.

## Expected and actual

The frozen harness should resolve its source root and register its single case,
then reach the independently admitted native prefix. Instead it fails while
converting a non-file URL to a Node path. The exact rejected URL was not captured;
the precise jsdom/Vite transformation was unverified at that checkpoint. Static policy contracts
and launcher syntax checks did not exercise this entry's collection environment.

## Evidence and follow-up

[Terminal evidence](../../docs/plans/evidence/fresh-lineage-native-prefix.md)
binds the four exact sources and 1,872-input map to the invocation. Root retains
`native-stdout.log`, `native-stderr.log`, `launcher-footer.json`,
`native-terminal.json`, `resolved-runner.json`, `launcher-invoked.json` and reviews
under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-fresh-lineage-gxhxzxtj`
through unfinished consumers; root owns eventual verified cleanup.

The worker admission marker is absent because the case never registered.
The retained launcher record and explicit no-relaunch rule consume the attempt
regardless. Do not retry, remove markers, rewrite the historical frozen source, or create a
replacement experiment to rescue this outcome. Any future tooling fix needs a
separate scoped plan and a collection-only regression that cannot import or
start native gameplay. This report does not authorize another native experiment.

## Separate current-source correction — 2026-10-28 UTC

The scoped [root-resolution evidence](../../docs/plans/evidence/fresh-lineage-root-resolution.md)
identifies installed Vitest's non-SSR `NormalizeURLPlugin`: literal
`new URL(relative, import.meta.url)` is transformed to use jsdom's HTTP
`self.location`. Direct `fileURLToPath(import.meta.url)`, followed by `dirname`
and filesystem `resolve`, avoids that browser-URL transformation. The current
entry changes only its path import and root initializer. Historical source,
manifest, approvals and consumed launcher record remain immutable.

An ordinary jsdom regression extracts only the actual root expression as source
text and executes it in harmless modules at the same nesting depth, including
spaces/Unicode. Both assertions reproduce `ERR_INVALID_URL_SCHEME` before the
fix and pass afterward. Eight rejection-only controls constrain extraction;
review's generic-type-argument guard finding is corrected and covered. The
native entry, policy, launcher and stores are never imported by this regression.

This verifies the filesystem-root correction only. It does not establish that
the entire native entry now collects, reaches admission or runs gameplay.
The original failed outcome is unchanged; no new native experiment is authorized.
