# BUG-054 — Execute active frozen targets below the Shatter threshold

Status: Reproduced before runtime patch.
Severity: High — the advertised Freeze→physical execution never occurs.
Owner: engine-dev; GD/TD contract and producer/QA frozen tests approved.

## Reproduction

Commit179748c2df73ae2154b65271d9300c021bb75386, Node/Linux Vitest engine
project; browser, viewport and locale are not applicable to this pure engine
reproduction. Seed5, actual authored rank1 Sorceress Frost Nova, hero attack10,
AS250 and20mana; target190/1000HP. Test-only stun holds isolate the cast and
later basic attack without replacing the production skill.

1. Run `npx vitest run --project engine src/engine/combat/shatter.test.ts`.
2. Observe native Frost Nova at500ms dealing33cold and applying Chill/Freeze.
3. Observe the later landed basic attack at1000ms against157/1000HP.

Expected: pre-hit active Freeze and strict below20% enable Shatter. Emit one
157physical damage event, then one target death and player victory at1000ms.
Actual: the physical event is16, leaving141HP; no execution. The minimal
seed7 basic fixture similarly deals1 instead of19 at1700ms.

## Evidence and root cause

Frozen test SHAe88edaa0941322d50b7d0162adc466723ba9334be9e3ca09e28628a51405bcc6.
Bounded focused RED:14 failures/15 controls, exit1,2.509s, no timeout/signals/
survivors. All failures are reached runtime assertions. Native Freeze/cold
assertions are retained. Exact20%, crossing, miss, nonphysical/thorns/DoT,
expiry/future/current-hit Freeze and no-Freeze controls pass.

RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-shatter-u75_js3c`
retains frozen sources, `focused-red.log`, `focused-red-report.json`, command/
process metadata and complete no-Freeze control. Durable evidence will be
indexed at `docs/plans/evidence/p08a06-shatter-execute.md` before cleanup.

The existing `shouldShatter` predicate encodes the promised threshold but is
never called by the shared direct-damage path. Apply that unchanged helper to
the active pre-hit target after ordinary resolution, without extra RNG or a
new death handler. Keep ordinary damage for on-hit DoT potency. No workaround
provides the advertised mechanic. This defect establishes no cause for prior
native campaign draws and no campaign/balance acceptance.

## Resolution

The shared direct hit path now applies the existing pre-hit predicate after
ordinary resolution and adjusts only damage event/HP amount. Status potency,
RNG, metadata, ordinary overkill and death handling retain their existing paths.
Frozen29cases and engine1160/fullcov3343 pass; types/lint/build/80%gate pass.
GD/TD/producer/QA approve source and causal evidence. Commit closure follows
final durable review; this report remains the before-patch defect record.
