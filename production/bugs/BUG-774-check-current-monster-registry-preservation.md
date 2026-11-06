# BUG-774 — Check current monster registry preservation

Status: fixed locally and verified; uncommitted. Severity: Medium.
Owner: root, solo QA/engine. No production change required.

## Reproduction

2026-11-05, Linux/WSL Vitest1.6.1, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited dirty worktree.
Run the first registration-preservation case in
`src/engine/combat/act1-lightning.test.ts`. No battle RNG is involved;
locale/browser/viewport do not apply to this registry assertion.

Expected: repeat default registration restores the specialized Act I Lightning
spell and preserves all ordinary native monster skills, aliases, projectile
metadata and authored data. This remains the original regression's purpose.

Actual: `MONSTER_STUB_SKILLS is not iterable`. The assertion imports a removed
stub export; BUG770 completed the native JSON adapters and removed that catalog.
The test never reaches its ordinary Lightning or shared skill assertions.

Failure: `green.log`/`green.json` in root-retained
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-elite-fast-qe1q81mq`.
Exact test preimage is retained there. Root removes after full-v1 acceptance and
all evidence consumers finish. Observed during affected BUG773 verification:
100of101cases pass; this single stale case fails.

## Required correction

Use the actual authored monster catalog to capture the installed native runtime
skills before replacement/reload. Require every authored ID and canonical alias
to resolve, preserve complete skill values/projectile fields and authored input,
keep the explicit40–60Lightning/Paralyze oracle and restore the specialized leaf.
Do not restore retired stubs, change production, skip or weaken the assertion.

Plan review: ready; root cause is the removed source import in one stale test.
Security check: pass; local test-only correction, no external or save effect.
Affected regression, scoped types/lint are sufficient; no campaign replay or
spent budget renewal. Full-v1/independent acceptance remains unfinished.

## Resolution

See [Fast elite evidence](../../docs/plans/evidence/p15-fast-elite-speed.md).
Affected checks, scoped types/lint and four native Chromium cases pass.
The initial100/101run and corrected one-case rerun remain separate evidence.
No campaign/balance/pacing credit or full-v1 completion is claimed.
