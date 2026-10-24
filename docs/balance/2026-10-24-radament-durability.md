# Radament durability — local calibration

BALANCE-CHECK: CONCERNS

2026-10-24. Root measurement/self-review; independent design/source/QA review
pending. The bounded candidate target passes. Full balance approval remains
open: this is one earned L24 Sorceress/Rogue configuration in Normal, not the
on-level/mid-tier/BiS × seven-class × difficulty grid.

Contract: [D11](../plans/decisions/D11-radament-durability-v1.md).
Input: unchanged genuine attempt255 final, next256, raw SHA256
`5105a89cc1584baa2a4aea3140147965d1c54bb2570c16e29d70512df7a32573`.
No additional gear, points, farming or simulated state is promoted to campaign.

## Same-input before and after

Only Radament JSON life820–1020→500–620 and growth82–102→50–62 change.
The real builder/planner, native settlement, same64seeds and ordinal256 apply.
The first32 are screen, the separate33–64 holdout. Candidate was frozen before
its measurements; there was no alternate candidate or favorable-seed selection.

| Native full-area cohort | Before wins | After wins | Before boss TTK p50/p95 | After boss TTK p50/p95 |
| --- | ---: | ---: | --- | --- |
| Screen1–32 |17/32|32/32|55.692/57.460s|36.244/42.432s|
| Holdout33–64 |17/32|31/32|55.692/57.460s|40.664/46.852s|

No hero deaths before or after. All30baseline nonwins and the remaining
candidate holdout55 nonwin are boss-wave60-second draws. The first four waves
have identical recorded outcomes, durations, XP and new-gear counts for all64
pairs. Victory durations are computed only from victories. No draw is counted
as a clear and failed waves have zero XP/new gear. Native totals include the
actual preceding-wave carry, rewards and leveling.

| Separate1000seed isolated boss scenario | Before | After |
| --- | ---: | ---: |
| Wins |515/1000|991/1000|
| Hero deaths |0|0|
| Rolled HP range |7635–9440|4655–5739|
| Victory TTK p50/p95 |55.692/57.460s|39.000/49.504s|
| Nonwin terminal time p50/p95 |60/60s|60/60s|
| Mean boss HP removed |7573.773|5209.898|

Lower mean damage after a successful earlier kill reflects less enemy HP, not
a reduction in the build's outgoing damage. This isolated scenario starts both
allies at native full pools and omits earlier waves; it is an optimistic control,
not full-area/earned/pacing proof. The native scenario above supplies carry.

One native baseline seed1 shows4242hero/2418Rogue damage to7959boss HP, leaving
1299at60s; all heroes survive and boss entry heroMP310. Boss actions are one
startup summon and25StrongMelee casts. This supports a durability bottleneck;
it does not establish balanced monster spell priority. No spell/AI tuning is
included, so that separate concern remains visible.

## Evidence and limits

Raw task diagnostics:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-calibration-79tbdt04`.
`calibrate.mjs`, before/after native and isolated JSON, logs and paired checks
retain every seed, failure and outcome. Root owns retention through independent
review/full-v1 consumers, then removes exact diagnostics. Disposable browser
downloads/build are separately owned and removed after use.

Regression RED2/2 precedes the JSON change; focused GREEN2/2 covers the real
Normal22 boss envelope, four ordinary guards, Nightmare42 growth, all non-life
unit fields and following RNG. Candidate validation/actual browser continuation
are reported in the execution evidence, not inferred from simulations.

No claim is made for95% within three legal adaptation attempts, global element
parity, two builds/class, drop economy, earned ActsII–V or30–50active-hour first
clear. Those full-v1 requirements and G0–G7 remain open. This report approves
no PR, merge, remote publication or release.
