# BUG-149 — Initialize reset allowances before the first save

Severity: Medium. Status: reproduced on `6521722` plus the town-reset candidate;
root correction and regression validation pending. Owner: root/frontend/QA.
Environment: Vitest 1.6.1, Node, en/zh-CN; no browser or combat seed involved.

1. Create a fresh character using the production character factory.
2. Snapshot it with the new save21 serializer.
3. Compare live and saved player state, or import a current snapshot replacing
   its player with the fresh live player.

Expected: a fresh character explicitly owns three independent stat and skill
reset uses before saving. Current live and saved state agree; replacing the
player in a valid current save does not accidentally remove required counters.
Actual: the factory omits counters. Serialization adds3/3; snapshot/live
comparisons fail and the current import is correctly refused for missing counts.

Evidence: `full-v2.log` in the root-owned `d2h5-respec-b3pdijst` diagnostics
directory:22 failures/11 files,11297 passed,2 existing skips. Counter-related
receipt, save-management and quest-item refusals expose this source omission.
The same run proves separate stale current20 expectations and old ActII NPC
cardinality assertions. Preserve exact historical20 fixtures; update only
assertions that actually mean current saves and the newly authored Drognan.

Root cause: save21 was connected to migration/serialization but omitted at
ordinary character creation. Workaround: saving/reloading supplies counters,
but this must not substitute for correct initialization.

Security check: pass. Local initialization and exact fixture corrections only;
no relaxed import validation, new privileges, dependency/network or publication.
