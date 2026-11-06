# P15 — Preserve terminal campaign capture before validation

2026-11-04. BUG723 is locally resolved in the existing claimed human2 worktree,
`feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. The preceding goal turn was status-only/no progress;
this turn implements and verifies a diagnostic infrastructure correction.

## Change and scope

`tests/campaign/native-runner.ts` formerly recorded the terminal export after
decode/equality checks. A validator exception skipped that recorder before
cleanup restored the outer realm. The returned report could retain the save,
but the fsynced journal lacked the terminal record.

The same single raw snapshot/export record now precedes validation. Its local
recorder catch preserves technical failure and lets the existing independent
audits continue. Validation still rejects bad results, and cleanup still runs.
There is no second full-save record or change to the journal format, save
format, production persistence, gameplay or data. Capture itself must succeed;
an unavailable export or failed disk cannot be claimed as durable evidence.

## Verification

Two constructed route tests use real character creation, store changes and
native export, then inject decoder rejection or decoded-state mismatch. Both
fail against the original runner with zero terminal records. Both now receive
exactly one original export/snapshot before validation begins, retain explicit
technical failure and restore the complete nonempty outer realm, clock and pity.
The original decoder separately verifies that the captured export remains valid.
No combat is admitted in those cases.

The first affected run passed both new cases and all nine journal cases, but
found four stale Act II dispatch expectations. A bounded check with both saved
pre-change sources reproduces those four failures; the edited files are then
restored byte-for-byte. BUG724 documents the missing continuation expectation.
Its strict equality now includes every continuation field, including retained
clears, source, XP and zero consumed training/retry budgets. No assertion is
weakened and no production audit changes.

Final results: **37/37 affected dispatch/journal cases**, scoped strict
TypeScript and explicit two-file ESLint with zero warnings pass. The affected
journal cases include native reward settlement under recorder failure and real
gzip append/flush/rollback contracts. Test execution is about two seconds;
the final Vitest process takes 14.72 seconds including module startup.
No unrelated suites or completed campaign routes were replayed.

The initial scoped type configuration omitted the repository's existing
`src/vite-env.d.ts`; including it resolves the ImportMeta errors. The initial
lint command ignored diagnostic files; final lint uses `--no-ignore` and
`--max-warnings 0`. Both original logs remain retained and are not passing proof.

A separate Python source readback checks all 2,259 protected source/campaign/
script hashes. Only the runner and dispatch regression change; all 2,110
production source files remain exact. The retained patch hash is
`178d0d2d30eec06c937adab7e4b41230c8270b7c896d2716a34d0d2c509d4559`.
Root self-review covers capture ordering, recorder/validator failures,
unchanged happy-path record count, cleanup and absence of additional exports.
This is not independent final acceptance.

## Retention and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-campaign-capture-4gwv8cir`.
It retains plans, before/after sources, exact patch/manifests, original and
passing logs, baseline-restoration proof, executed configurations and cleanup
receipt. All recorded child PIDs are terminal. Active configs, the exact
task-local cache and temporary directory are absent; no cleanup failure remains.
The initial empty-directory check found a task-local Node compile cache;
its exact verified path was removed before the final cleanup receipt.
Root retains this packet through umbrella acceptance and then owns exact cleanup.

This cannot recover Double Swing's original missing export or turn its forward
diagnostic into an earned clear. A fresh sample needs its own frozen prospective
plan; none is launched here. Historical failures, costs and exhausted route/
preparation budgets stay unchanged. Counts remain **14/14 Act I, 12/14 intended
Normal, formal 0/210**. Zeal, qualifying earned Double Swing, wider economy and
30–50 active-hour pacing, higher difficulties/endgame, broader app/PWA/device/
accessibility/performance, soak and independent acceptance remain unfinished.
Browser works; CI remains excluded; no user answer or external hold is pending.
