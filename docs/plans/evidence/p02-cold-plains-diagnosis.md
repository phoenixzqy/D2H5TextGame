# P02 — Corrected service restoration and Cold Plains diagnosis

Status: tooling corrected; unchanged gameplay failure reproduced. This accepts
neither an earned route clear nor browser/campaign/pacing completion.

## Correction and validation

BUG-083 originated in task scripts restoring stores without hydrating the
module-local item allocator. `restoreEarnedSave` now reconstructs prevalidated,
isolated, quiescent saves and invokes the existing production monotonic seeder
over backpack, stash, hero equipment and every mercenary's equipment before
publishing readiness. It clones the input and rejects duplicate owned IDs,
nonfinite anchors and live combat before state/allocator mutation. This is a
service helper, not browser IO or the public persistence restore protocol.
`earnedDelta` refuses duplicate IDs in either observation instead of silently
undercounting additions. Production persistence was already correct; no `src/`
or save-format change is included.

Original identity regressions: 3 failed/1 passed before correction, then 4
passed. First expanded suite found five test-oracle failures: the test exporter
included unsaved `idleBonusAnchor`; correcting that exporter yielded 11 passes.
QA requested nondefault saved domains and refusal during live combat. The final
12 cases cover wounded/spent resources, roster/progress/gear, quest/map/meta/
formation, clone integrity, actual `rollItem` in a readiness subscriber, and
rejection without allocator advancement. A temporary strict TypeScript failure
from an unchecked mercenary-definition lookup and two explicit-lint arrow-body
failures were corrected in test setup; the final checks below pass.

- Full suite with unchanged helper and original 11-case test: 8399 tests /
  264 files, exit0, 178.99s. This precedes the strengthened assertions.
- Final 12-case focused suite: exit0, 4.86s; final typecheck: exit0.
- Repository lint: exit0. Explicit `eslint --no-ignore` for both changed
  tooling files: exit0; ordinary lint excludes tests.
- No production build rerun: no production source/config/dependency changed.
  Previous runtime build remains recorded in the Act I entry evidence.
- Independent QA final source/test verdict: ADEQUATE, test SHA
  `7c6f8c578a7f1acd632c76533daf3dd1a83a6cfbad6077809b0a0291e7e60e41`.

## One frozen diagnostic

[Machine summary](fixtures/p02-cold-plains-diagnosis.service.json) and
[exact executed script](fixtures/p02-cold-plains-diagnosis.service.mjs).
Script SHA `5022b89f9133daa8cee6990da1555d72c9f4e1f2898de12fba7f594e3fdca436`;
QA ADEQUATE before execution. Original unique L12 input SHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
One invocation, exit0, no retries: seed2223645302/bonus1, Blood Moor ordinal102
then Cold Plains103; first nonwin stops. No farming, tuning, equipment change,
point allocation, respec, refill, direct XP or idle ticker. Initial full-save
equality and source hashes unchanged pass. All 52 raw item awards equal actual
additions; owned objects/unique IDs grow3737→3789. Old affected exports remain
unchanged and diagnostic-only.

Blood Moor wins at7500/18000/31500ms. Cold Plains wins at16500/12000ms, then
draws W3 at60000ms with the exact prior champion Zombie at38HP. The drawn wave
awards zero. No Burial Grounds, Dark Wood or Catacombs launch follows.

## Cause established and next action

W3 starts with9 enemies/2569HP. Three champions haveMR14, othersMR7; all have
25% cold resistance. Hero takes exactly40 scheduled actions at1500ms intervals:
20 Frost Nova and20 Ice Blast. Mana never falls below168/188; final hero140HP/
175MP and Rogue181HP. There is no observed resource stall or missed cadence.

Recorded damage including overkill: Nova1491 over116 target events (18 dodges),
Ice Blast953 over20 events (3 dodges), Rogue Basic Arrow166 over29 events
(8 dodges); Rogue spends10 actions on Inner Sight. Spawn-order targeting is
the existing intentional rule. The surviving Zombie gets single-target Ice
Blast only at57000/60000ms, for43/46damage. Last Stalker dies at54864ms.
The observed bottleneck is throughput against mitigation and the fixed
rotation/targeting, not mana. Damage totals include overkill and are not an
exact HP-loss sum or a hypothetical victory prediction.

Next GD/TD decision must address progression/build throughput before another
route attempt. Do not tune only the38HP remainder, invent a gear scaling rule,
add farming, or retry another seed. Existing merc weapon-damage limitations
and differing JSON/stub ranges require an explicit contract if changed.

Raw reports, final service save, scripts, command logs and later cleanup receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cold-plains-diagnosis-f76nlumd`.
Root retains this evidence for progression/C1/umbrella consumers and removes
disposable task-owned caches/tmp after all readers/processes finish. No remote
action; umbrella worktree claim remains active.

Final producer source/publication APPROVE, security PASS. All readers released;
diagnostic and validation handles are terminal. Exact disposable tmp/cache
cleanup removed 1 files/23 bytes; remaining[]/failures[].
Receipt at the raw root above. Required raw evidence remains root-owned as stated.
