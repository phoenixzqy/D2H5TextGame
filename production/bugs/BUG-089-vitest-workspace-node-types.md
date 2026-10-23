# BUG-089 — Move unsupported workspace worker limits to their owner

Status: reproduced, open. Severity: Medium. Owner: technical-director.

Environment: source `85537b1` with the BUG088 browser config added;
Node/TypeScript CLI, locale/browser/viewport/seed not applicable.

Reproduction:
1. Run `npx tsc --noEmit --project tsconfig.node.json` (use a task-local
   `--tsBuildInfoFile` to keep compiler output outside the checkout).
2. Observe TS2353 at `vitest.workspace.ts:75`: `maxThreads` is not allowed
   in the workspace project's `poolOptions.threads` type.

Expected: the tooling project typechecks. Actual: exit2. The existing UI
worker cap predates BUG088; the required `npm run typecheck` does not check
this referenced tooling project and still passes. This is a separate tooling
validation gap, not evidence of failed combat entry or browser behavior.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-challenge-entry-r7znpyb5/typecheck-node.log`.
Root retains that diagnostic through progression/C1 and removes it after
dependent readers finish. No workaround or type suppression applied. Resolve
worker configuration at its supported owner, preserving bounded execution,
then validate both tooling types and the test suite.
