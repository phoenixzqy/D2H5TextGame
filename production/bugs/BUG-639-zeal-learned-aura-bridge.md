# BUG-639 — Evaluate Zeal's already-learned early aura

- Status: Fixed/verified for one earned intended Act I route; population acceptance open.
- Severity: Medium (intended campaign policy; no production defect established).
- Owner: root, existing claimed human2; no agents.
- Environment: Node24.21.0 / WSL, installed deterministic native engine.

## Reproduction and diagnosis

Retained intended Zeal Act I route stops6 at Den40W3 and recovery Moor41W3.
Might5 is selected, Sacrifice1 is active, Mana stays100. Den enters its final
played wave with37Life; recovery enters with151Life and takes129direct
Lightning plus48self damage. The native Might control has been reproduced
exactly in BUG637's corrected diagnostic. Removing Sacrifice was rejected.

The created Paladin already owns Holy Fire1. It is ineligible before6, but at6
offers its authored automatic group pulse without extra allocation or Mana.
The current campaign never selects it. Hypothesis: use the learned aura during
the single-target bridge, then restore Might at Zeal's12unlock. Preserve every
rank target, stat, skill priority, owned gear, native training and retry limit.
Do not combine this with the rejected ordinary-attack or Javelin gear changes.

## Bounded verification

First compare only the two retained native failures: unchanged controls must
reproduce full events/final teams, then switch only the native aura projection
to eligible Holy Fire1. Proceed only if recovery Moor wins and neither
candidate draws; otherwise reject without campaign or source change.
Conditional results are not earned progression or population acceptance.

If qualified, add native staged selection with the two idle-boundary switches,
verify levels1/5/6/11/12 and final ranks/points/unchanged domains, and run exactly
one earned Act I route with independent full journal/native-save accounting.
Adopt only on a full clear; otherwise archive and exact-restore candidate code.
No seed search, replay, coefficient tuning or limit extension after results.

Required evidence remains root-owned through umbrella review at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
conditional prefix `p15-zeal-fire-bridge-v1`. Root owns eventual cleanup/release.

## Conditional comparison qualified

`p15-zeal-fire-bridge-v1.json` reproduces both complete native controls.
Holy Fire1 still loses low-Life Den40W3, but wins recovery Moor41W3 in19500ms
with113Life/100Mana,88fire hits and13Sacrifices. Neither candidate draws.
All2151production/131campaign inputs unchanged. This qualifies the single
prospective staged-selection trial; it establishes no earned clear or balance.

## Accepted earned trial

[Full result](../../docs/balance/2026-11-03-zeal-learned-aura-bridge.md):
Nine affected checks/scoped types/explicit lint pass. One fresh native route
completes13:126admissions/368waves/364wins/four defeats. First Catacombs125
wins6/6. Full independent journal/save/custody/economy/clock/payment/training
readback passes; native aura selections2/6/12and all final targets preserved.
Candidate retained. Reader lineage/owner corrections and original failures
are disclosed in the result. No production input edit or population claim.
