# BUG-517 — Stop hostile replacements from permanently intercepting automatic focus

Status: local uncommitted design/source correction; scoped validation passed. Severity: High. Owner: root.
Environment: WSL / Node24, pure engine; no browser/locale dependency.
Base HEAD: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, current dirty source.

Reproduce the exact earned source35/next888 through the restored-store v10/v11
Bloody policies, W5 seed4080632751. Surviving comparisons still draw at60s;
the fixed5s summon cooldown is retained. Hostile summons receive unconditional
priority over every original monster, including their owners. Sixteen owners
can replace minions faster than a two-attempt single-target build kills them;
extra overkill damage cannot remove this barrier. This is separate from the
BUG514 cooldown leak, and revises an intentional old focus policy rather than
claiming the old implementation violated its own contract.

Expected final-game behavior: automatic single-target builds can attack a
summoner while its living adds remain threats. Proposed upstream correction:
hostiles use stable battle insertion order; a summon kind alone grants no
hostile Taunt. Preserve explicit active Taunt, player-side summon ordering
and monster threat weights. No new RNG, stat buff, enemy deletion, target-pool
refill or wave-count adjustment. The controlling author design is
`docs/plans/decisions/D04-hostile-focus-v1.md`.

Evidence: root packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`,
especially v10/v11 raw inputs/events, immutable source pins and the new
`src/engine/combat/enemy-focus.test.ts` fixed-seed counterexample. Constructed
high-damage tanks test reachability only, never earned balance or pacing.
Run only changed targeting/geometry/skill consumers plus the saved unfinished
area. Preserve old records and all exact target/damage/status/RNG assertions.

Security check: pass; local deterministic selection policy, no network,
dependencies, ownership bypass, save-format change, grants or publication.
Root is sole author/reviewer; independent and full balance acceptance stay open.

## Completed local verification

Implemented: kind bias applies only to effective player-side units; hostile
summons use battle insertion order. bug517-red-v1 has3reachability failures
and1explicit-Taunt control pass. Affected final union is282/282 cases:
259retained engine +3corrected new fixture +18retained store +2BUG518 cases.
The corrected new focus file passes4/4; its initial inherited attackRange
fixture error and before bytes are preserved. Final bug517-types-v2/lint-v2
pass. Both v12 policies clear the saved unfinished area; the selected native
Bloody888 continuation clears all six waves with exact HP/MP/time agreement.
The author-owned design revision is provisional; independent review, full
matrix, holdouts and pacing acceptance remain open.
