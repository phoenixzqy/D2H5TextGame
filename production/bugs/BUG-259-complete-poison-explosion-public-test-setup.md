# BUG-259 — Complete Poison Explosion public-test setup

Status: fixed in `761fa2f1`; targeted compiler setup corrected externally. Severity: Medium — the new acceptance
harness cannot yet pass its required checks. No production failure established.
Date:2026-10-26. Owner:root sole author (QA/frontend responsibility).

## Reproduction

Baseline`05732820` plus the two new PE acceptance spec/config paths. Linux,
Node/TypeScript/ESLint; no browser/viewport/locale or engine seed applies to these
static-check failures. Browser execution has not begun.

1. Run explicit `--no-ignore --max-warnings=0` ESLint on the two new PWA files.
2. Run strict targeted `tsc --noEmit --project <task>/typecheck.public.json`,
   inheriting repository rules but including only those two entry points.

Expected: strict valid callbacks and the same existing ambient declarations as
the repository project. Actual: lint rejects two shorthand callbacks returning
void at spec56/194; TypeScript reports19missing ImportMeta.glob declarations
and one missing Window.__GAME__ declaration in existing imported code.
Lint exits1/7.678s; types exits2/5.242s. The unchanged production build/bridge
passes12.833s. This does not establish a game/runtime error.

## Cause, evidence and intended correction

Use braces for the two new void callbacks. The temporary targeted compiler
input omitted existing `src/vite-env.d.ts` and `src/app/test-bridge.ts`, which
the normal repository-wide compiler includes. Include those actual existing
sources in the targeted check; do not add a fake global, suppression or runtime
bridge import to the acceptance spec. Production bridge absence remains asserted.

Root retains original spec/config, initial lint/types logs and hash-bound
terminal receipts under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-explosion-public-rt94uggx`.
Root owns lossless retention/read-back and exact disposable cleanup after PE/full-v1
evidence consumers finish. No skip, timeout, worker, gameplay or fixture change
is proposed. Rerun both static checks before the real browser batch. Independent
acceptance, earned-L18 balance and manual feel remain open.

## Verified correction

The two callbacks use explicit blocks. The targeted compiler includes the
existing repository ambient sources, with no fake declarations or runtime
bridge import. Final explicit lint passes8.061s and strict types pass6.853s.
The canonical production browser passes4/4 in137.842s with bridge absence
asserted. Both original static failures and all terminal receipts remain
retained. See [public evidence](../../docs/plans/evidence/d06-poison-explosion-public.md).
