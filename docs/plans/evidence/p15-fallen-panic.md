# P15 — Fallen family Panic Flee

## Implementation and limits

The [adopted contract](../decisions/P15-fallen-panic-v1.md) is implemented locally.
Fallen/Dark One/Devilkin select Panic only, leaving ordinary or appended elite
skills available otherwise. Fallen32/+5 is preserved; Dark One/Devilkin32/+5
explicitly adopt their former fallback provisionally. Inventory27authored/
84pending; every row remains numerically unaccepted.

A battle-owned state machine records original qualifying bodies and prelethal
hostile allegiance. One original shaman death marks each eligible original
living recipient pending once per wave. Its next eligible ordinary action pays
MP0/CD5 and grants both dodge inputs+0.2 for5000ms. Further deaths coalesce;
stun/cooldown can delay payment. Death/conversion forfeits pending/active power;
revival and later allegiance changes cannot rearm it. Fresh waves strip forged
or carried markers. Expiry is half-open and scheduled exactly; status-state
projection reproduces the private window without changing base stats or saves.

Qualification covers original Fallen/Carver/Devilkin Shamans and Bishibosh;
recipient tiers exclude bosses, summons, ownership markers, later entrants and
spoofed identities. Prelethal capture includes direct/projectile/reflection/DOT
settlement. Simultaneously dead recipients do not receive power. Affix priority,
shared finite corpses, revival allowances, rewards and default damage rules stay
native. Always-hit and periodic non-dodge semantics remain. No numerical tuning,
earned campaign rerun or balance acceptance follows this bounded mechanic.

## Functional evidence

Initial32cases:21RED/11controls. Initial implementation exposed Ajv strictRequired
schema failure before four suites loaded; its corrected run214PASS. Expanded
negative inputs and conversion/reflection cases exposed additional failures;
those exact intermediate logs remain. Final64enginecases and3playbackcases PASS,
including bundled factory/default registry, no-opening Panic, Den manual/idle
no-shaman guards, original identity/allegiance, coalescing, actual action/CD/MP,
reflection/projectile/periodic deaths, conversion/death/revival forfeiture,
finite expiry/both damage channels, affixes, immutability and replay agreement.
The first playback oracle incorrectly retained a dead display body's statuses;
its corrected proof respects native dead-display cleanup and exact final pools.

Final combined affected validation:17files/247PASS in43.802s. This includes all
67Panic cases and the14integration files repaired under
[BUG411](../../../production/bugs/BUG-411-catalog-test-fixture-coupling.md).
Strict root types PASS11.368s; scoped14-file lint v2 PASS14.020s. An initial
Panic typecheck failed test-literal widening; corrected types PASS8.448s. Initial
Panic lint found numeric template interpolation and an Object.setPrototypeOf
any-return; scoped9-file lint v2 PASS13.472s. Subsequent integration lint found
two asymmetric matcher any-values; explicit unknown annotations resolved them.
These are retained failures, not successful runs.

Independent read-only review: `[P15-PANIC-REVIEW]: APPROVE` for the bounded
mechanic; `BUG411-LIFETIME-FIXTURE-REVIEW: APPROVE` and
`BUG411-MAGE-FIXTURE-REVIEW: APPROVE` for the scoped integration repairs.
The ordinary full unit sweep is terminal:1186files/25178tests,25143PASS and
35failures in exactly the14subsequently repaired integration files;1202.880s,
no timeout or owned living descendants. The final247case run covers every failed
file. `p15-panic-unit-reconciliation-v1.json` records that aggregate coverage;
this is not a clean one-shot full invocation. The next melee-family41RED is
separate and not included. Final types v2 PASS7.733s after matcher annotations.

## Retained artifacts and cleanup

Packet retained through umbrella acceptance (root owns eventual cleanup):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Exact Panic logs/receipts use `p15-panic-{red-v1,green-v1,green-v2,expanded-v1,
expanded-v2,expanded-v3,expanded-v4,playback-v1,final-focused-v1,types-v1,
types-v2,lint-v1,lint-v2,unit-full-v1}{.log,-exit.json}`.
Integration logs/receipts use `p15-catalog-{fixtures-v1,native-traces-v1,
native-traces-v2,trace-diagnostic-v1,extra-v1,mage-mixed-v1,
lifetime-diagnostic-v1,lifetime-fixtures-v1,final-affected-v1,
final-types-v1,final-types-v2,final-lint-v1,final-lint-v2}{.log,-exit.json}`.
Complete native diagnostic recordings are retained in these raw logs. Temporary
console instrumentation has been removed. Completed wrappers verify no owned
living descendants. Established umbrella type cache and worktree claim remain;
full sweep is terminal and all owned descendant cleanup is verified.
Browser works in WSL; CI remains intentionally removed/excluded.
