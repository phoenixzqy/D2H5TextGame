# BUG-096 — Restore the actual Radament encounter and qualified quest credit

Status: fixed and accepted for approved D11 encounter/provenance/kill-credit scope.
Severity: High. Owners: engine-dev, content-designer, map store integrator.
Environment: local Vitest/Node, implementation base `2b50d02`; seed123,
challenge ordinal0, canonical `areas/act2-far-oasis`, manual and idle.
Initial reproduction was engine-only. Final constructed en/zh-CN production
proof and scope limits are recorded in the evidence below.

Reproduction:
1. Resolve the actual Far Oasis map with `resolveChallengeWavePlan`.
2. Inspect the final five spawns and per-wave treasure class.
3. Resolve the legacy authored map with `resolveWavePlan`.
4. Inspect Radament's authored quest and the production settlement event paths.

Expected: actual `monsters/act2.radament`, four ordinary mummy companions and
the sole authored `loot/mini-act2` table. A qualified actual kill advances the
tracked exact-area `kill` objective without automatically claiming rewards.
Ambiguous authored boss-wave treasure-class sources must be rejected.

Actual: Greater Mummy stands in for Radament in both map representations; four
companions inherit boss tier; explicit boss encounter loses its wave TC and
falls back to trash. Quest target/location remain legacy IDs and no ordinary
kill event producer exists. Book acquisition/Read is separately planned D11 work.

Evidence: genuine 10 failing/60 passing planner assertions,1.29s, before source
edits, in `src/engine/combat/sub-area-run.test.ts`. Raw log retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-09s2yzs1/a-red.log`.
Production kill-credit RED is required before that child is implemented.

That child is now reproduced independently: factory provenance and a real native
run leave two failing/25 passing assertions. Correcting only canonical quest IDs
still leaves the actual completed-kill regression failing. The new batch reducer
has17 failing/one canonical-context control before its API exists. Raw b-red.log,
b-canonical-target-red.log and b-reducer-red.log retain those stages.

Root cause: authored encounter identity/tier and planner TC handoff; missing
builder-captured canonical provenance plus qualified settlement-to-quest handoff.
Approved contract: [D11](../../docs/plans/decisions/D11-radament-quest-v1.md).
Security check: pass. No network, credentials, dependencies, permissions or policy
bypasses; keep exact target/area/playback/receipt/hero guards and no rewards.

Final-gate regression: adding canonical monster provenance changes the serialized
units reconstructed by two historical synthetic mage fixture builders. The full
suite reports76 failures across four downstream suites, all rejecting their
frozen source hashes (`full.log`). Preserve their original hashes, recipes,
semantic validators and combat inputs. At those two historical construction
boundaries only, verify the new provenance equals the resolved catalog ID before
projecting to the original unit shape. Current production units retain provenance.
This is fixture compatibility work, not fresh campaign or pacing evidence.

Resolution: genuine RED stages now pass, full8735/282 tests, engine4237/109,
type/lint/clean production build/four-chunk bridge scan pass. Constructed en and
zh-CN five-wave encounters kill actual Radament, complete the tracked quest
without claiming, preserve all original item IDs and save/Continue exactly.
Producer APPROVE/security PASS and independent QA-A/B ADEQUATE.
[Evidence and remaining D11 reward/UI work](../../docs/plans/evidence/radament-encounter-objective.md).
No earned C2 or full-v1 acceptance.
