# Unearned L32 Mage rank-family audit

BALANCE-CHECK: CONCERNS

This is a paired **unearned L32 Necromancer versus early Blood Moor** rank-family
audit: Mage ranks1–20, Skeleton1, Mastery0, 1,000 fixed combat seeds per rank and
revision, **40,000 measured battles**. It extends the two-seed screen without
claiming earned progression, on-level/on-zone viability or global balance acceptance.
The physical and elemental revisions are actually executed from immutable Git
objects; a runtime patch or synthetic physical label is not the baseline.

The engine/data/save/config are unchanged by this increment. The direct-bolt
identity contract remains [D06 v1e](../plans/decisions/D06-mage-elemental-identity-v1.md).
Signature statuses and all other outstanding D06/P09/P10/private-v1 gates remain open.

## Recipe and interpretation

The common L32 is the smallest legal common level for Mage20 under the authored
rank gate. Every hero starts with authored core15/25/15/25, 378HP/211MP,
Attack84/Defense113/AS125, ordinary recovery, no gear/merc/preloaded summons and
explicit unarmed equipment. All155 stat points remain unspent. Skill points
spent are rank+1, from33 available; no Mastery is allocated. Summons are freshly
registered at time0 for one22MP batch payment. The hero has Mage as its sole
combo slot and otherwise uses its ordinary basic attack.

All ranks reuse the same authored manual Blood Moor wave0, challengeOrdinal0,
pity0, plan-generation seed7 and enemy-generation seed991: eight level2 enemies,
330 total HP, six Fallen Defense12 and two Quill Rats Defense10, MR1, zero
resistances, both dodge pools0.05. No act-derived difficulty or resistance
multiplier is invented. Each rank fixture is generated/serialized once and
passed unchanged to both captured domains; only combat seed varies0–999.

Hero level/statistics are constant across rank cells. This is an overleveled,
unearned early-zone experiment; hero attacks, target depletion, excess damage
and early combat termination can saturate clear times. Registered Mages need
not attack. No fight is prolonged, target HP injected, seed rerolled or summon
forced to act to make its assigned type observable. Every *observed* damage
event is checked against that Mage's actual fresh-registration cycle index.

TTK is the logical end timestamp for victories only; defeat/draw would be
censored, with separate counts. Quantiles use nearest rank, so p50 of1,000
successes is sorted observation500. Mean DPS below is the arithmetic mean of
per-battle damage/seconds, with1,000 observations per domain/rank. Logged damage
is post-mitigation event amount including overkill; effective damage clamps to
remaining target HP, including intervening heals/HP orbs. It is not a unique
HP-budget percentage or a general power estimate.

## Outcomes and successful TTK

Every domain/rank has1,000 victories,0 defeats,0 draws and0 hero deaths.
Each TTK p50/p95 denominator is1,000 successful battles; no censored observation
is silently converted into a60-second kill.

| Mage rank/cap | Physical p50/p95 ms | Elemental p50/p95 ms | Mean duration delta |
| --- | --- | --- | --- |
| 1/1 | 15000/18000 | 15000/18000 | +0.00% |
| 2/2 | 10500/13580 | 9000/12000 | -11.92% |
| 3/3 | 7760/10500 | 7760/9700 | -10.72% |
| 4/3 | 7760/9700 | 7500/9700 | -7.03% |
| 5/3 | 7760/9700 | 7500/9000 | -13.46% |
| 6/4 | 5820/7760 | 5820/7760 | -5.81% |
| 7/4 | 5820/7760 | 5820/7760 | -8.94% |
| 8/4 | 5820/7760 | 5820/7500 | -13.67% |
| 9/5 | 4500/5820 | 3880/5820 | -7.88% |
| 10/5 | 3880/5820 | 3880/5820 | -4.20% |
| 11/5 | 3880/5820 | 3880/5820 | -4.20% |
| 12/6 | 3880/3880 | 3880/3880 | +0.00% |
| 13/6 | 3880/3880 | 3880/3880 | +0.00% |
| 14/6 | 3880/3880 | 3880/3880 | +0.00% |
| 15/7 | 3880/3880 | 3880/3880 | +0.00% |
| 16/7 | 3880/3880 | 3880/3880 | +0.00% |
| 17/7 | 3880/3880 | 3880/3880 | +0.00% |
| 18/8 | 3000/3880 | 3000/3880 | +0.00% |
| 19/8 | 3000/3880 | 3000/3880 | +0.00% |
| 20/8 | 3000/3880 | 3000/3880 | +0.00% |

Each paired-success denominator below is1,000. Mean/p50/p95 deltas are seedwise
`(elemental_duration / physical_duration - 1) × 100`, distinct from the change
in mean duration above. Negative means faster.

| Rank | Faster / equal / slower | Mean paired delta | p50 / p95 paired delta |
| --- | --- | --- | --- |
| 1 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 2 | 627 / 311 / 62 | -11.07% | -12.50% / +7.78% |
| 3 | 608 / 357 / 35 | -10.11% | -7.22% / +0.00% |
| 4 | 423 / 535 / 42 | -6.60% | +0.00% / +0.00% |
| 5 | 675 / 283 / 42 | -12.85% | -13.78% / +0.00% |
| 6 | 281 / 687 / 32 | -5.26% | +0.00% / +0.00% |
| 7 | 397 / 559 / 44 | -8.18% | +0.00% / +0.00% |
| 8 | 544 / 437 / 19 | -12.89% | -3.00% / +0.00% |
| 9 | 300 / 672 / 28 | -6.49% | +0.00% / +0.00% |
| 10 | 161 / 823 / 16 | -3.26% | +0.00% / +0.00% |
| 11 | 161 / 823 / 16 | -3.26% | +0.00% / +0.00% |
| 12 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 13 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 14 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 15 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 16 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 17 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 18 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 19 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |
| 20 | 0 / 1000 / 0 | +0.00% | +0.00% / +0.00% |

## Mage damage and throughput

Values are physical → elemental. Effective HP removed is credited to its actual
source; the hero can take a different share after elemental targeting/kill traces
diverge. No per-element equal-investment conclusion follows from mixed Mage armies.

| Rank | Mean logged damage | Mean effective HP removed | Mean logged DPS (delta) | Mean effective HP/s (delta) |
| --- | --- | --- | --- | --- |
| 1 | 106.5010 → 106.5010 | 104.8010 → 104.8010 | 7.3234 → 7.3234 (+0.00%) | 7.2143 → 7.2143 (+0.00%) |
| 2 | 185.0530 → 201.8780 | 166.4890 → 161.1730 | 17.3611 → 21.5797 (+24.30%) | 15.6008 → 17.1655 (+10.03%) |
| 3 | 242.4200 → 269.6900 | 195.0660 → 207.9590 | 28.4279 → 35.6841 (+25.53%) | 22.8091 → 27.5817 (+20.92%) |
| 4 | 254.9830 → 291.2060 | 200.9220 → 212.5870 | 31.4328 → 38.9540 (+23.93%) | 24.7850 → 28.4638 (+14.84%) |
| 5 | 280.7050 → 299.9050 | 205.2300 → 217.2820 | 34.8555 → 43.6843 (+25.33%) | 25.5009 → 31.7126 (+24.36%) |
| 6 | 319.2850 → 344.4270 | 237.2040 → 242.4750 | 51.1024 → 58.6194 (+14.71%) | 37.8926 → 41.3768 (+9.19%) |
| 7 | 348.0540 → 358.9910 | 239.7660 → 245.1730 | 55.7068 → 63.2294 (+13.50%) | 38.2813 → 43.3315 (+13.19%) |
| 8 | 373.4960 → 354.4580 | 245.4670 → 249.1850 | 60.4546 → 67.0682 (+10.94%) | 39.5847 → 47.3635 (+19.65%) |
| 9 | 370.2390 → 368.9010 | 259.3910 → 261.7390 | 80.5154 → 86.3644 (+7.26%) | 56.5957 → 61.5623 (+8.78%) |
| 10 | 359.7980 → 367.5500 | 267.6760 → 268.7990 | 85.0024 → 89.9167 (+5.78%) | 63.3785 → 65.9392 (+4.04%) |
| 11 | 383.5960 → 389.8310 | 268.6600 → 269.5550 | 90.6239 → 95.3657 (+5.23%) | 63.6128 → 66.1278 (+3.95%) |
| 12 | 340.0360 → 373.3270 | 266.3280 → 266.3280 | 91.2274 → 100.1710 (+9.80%) | 71.6062 → 71.6062 (+0.00%) |
| 13 | 359.8810 → 393.1720 | 266.3280 → 266.3280 | 96.5524 → 105.4960 (+9.26%) | 71.6062 → 71.6062 (+0.00%) |
| 14 | 379.4050 → 412.6960 | 266.3280 → 266.3280 | 101.7920 → 110.7356 (+8.79%) | 71.6062 → 71.6062 (+0.00%) |
| 15 | 406.0860 → 445.0910 | 273.3280 → 273.3280 | 129.8955 → 142.3934 (+9.62%) | 87.5908 → 87.5908 (+0.00%) |
| 16 | 425.9580 → 464.9630 | 273.3280 → 273.3280 | 136.2533 → 148.7512 (+9.17%) | 87.5908 → 87.5908 (+0.00%) |
| 17 | 446.1540 → 485.1590 | 273.3280 → 273.3280 | 142.7139 → 155.2118 (+8.76%) | 87.5908 → 87.5908 (+0.00%) |
| 18 | 482.8560 → 518.2190 | 283.0580 → 283.0580 | 187.3156 → 201.0789 (+7.35%) | 109.8166 → 109.8166 (+0.00%) |
| 19 | 503.7880 → 539.1510 | 283.0580 → 283.0580 | 195.4352 → 209.1984 (+7.04%) | 109.8166 → 109.8166 (+0.00%) |
| 20 | 524.3700 → 559.7330 | 283.0580 → 283.0580 | 203.4195 → 217.1827 (+6.77%) | 109.8166 → 109.8166 (+0.00%) |

## Rate denominators, resources and non-acting summons

Crits use landed direct events as denominator; dodges use all direct attempts.
Rates aggregate these event counts within the cell. They are sanity observations,
not proof of exact5% crit/20% dodge convergence. `No-action/registered` counts
registrations without any action before battle end, not censored battles.
MP columns show observed min..max of per-battle entry/minimum/final values.
No mana-starved-action percentage is inferred from low-water marks.

| Rank | Physical crits/landed; dodges/attempts | Elemental crits/landed; dodges/attempts | No-action/registered P → E | MP entry / minimum / final P → E |
| --- | --- | --- | --- | --- |
| 1 | 285/5532; 1395/6927 | 285/5532; 1395/6927 | 0/1000 → 0/1000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 211..211 |
| 2 | 428/8331; 2048/10379 | 358/7307; 1773/9080 | 0/2000 → 0/2000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 211..211 |
| 3 | 460/9532; 2324/11856 | 419/8324; 2018/10342 | 0/3000 → 0/3000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 211..211 |
| 4 | 443/8942; 2164/11106 | 418/8211; 2003/10214 | 0/3000 → 0/3000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 211..211 |
| 5 | 447/8875; 2156/11031 | 388/7768; 1902/9670 | 0/3000 → 0/3000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 211..211 |
| 6 | 448/9291; 2312/11603 | 435/8637; 2123/10760 | 0/4000 → 0/4000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 208..211 |
| 7 | 448/9291; 2312/11603 | 434/8347; 2036/10383 | 0/4000 → 0/4000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 208..211 |
| 8 | 452/9214; 2288/11502 | 394/7699; 1890/9589 | 0/4000 → 0/4000 | 211..211 / 189..189 / 211..211 → 211..211 / 189..189 / 208..211 |
| 9 | 435/8457; 2065/10522 | 386/7669; 1867/9536 | 0/5000 → 0/5000 | 211..211 / 189..189 / 208..211 → 211..211 / 189..189 / 208..211 |
| 10 | 382/7678; 1857/9535 | 369/7181; 1733/8914 | 0/5000 → 0/5000 | 211..211 / 189..189 / 208..211 → 211..211 / 189..189 / 208..211 |
| 11 | 382/7678; 1857/9535 | 369/7181; 1733/8914 | 0/5000 → 0/5000 | 211..211 / 189..189 / 208..211 → 211..211 / 189..189 / 208..211 |
| 12 | 321/6401; 1614/8015 | 321/6401; 1614/8015 | 0/6000 → 0/6000 | 211..211 / 189..189 / 204..211 → 211..211 / 189..189 / 204..211 |
| 13 | 321/6401; 1614/8015 | 321/6401; 1614/8015 | 0/6000 → 0/6000 | 211..211 / 189..189 / 204..211 → 211..211 / 189..189 / 204..211 |
| 14 | 321/6401; 1614/8015 | 321/6401; 1614/8015 | 0/6000 → 0/6000 | 211..211 / 189..189 / 204..211 → 211..211 / 189..189 / 204..211 |
| 15 | 324/6516; 1646/8162 | 324/6516; 1646/8162 | 0/7000 → 0/7000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |
| 16 | 324/6516; 1646/8162 | 324/6516; 1646/8162 | 0/7000 → 0/7000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |
| 17 | 324/6516; 1646/8162 | 324/6516; 1646/8162 | 0/7000 → 0/7000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |
| 18 | 350/6744; 1712/8456 | 350/6744; 1712/8456 | 158/8000 → 158/8000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |
| 19 | 350/6744; 1712/8456 | 350/6744; 1712/8456 | 158/8000 → 158/8000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |
| 20 | 350/6744; 1712/8456 | 350/6744; 1712/8456 | 158/8000 → 158/8000 | 211..211 / 189..189 / 198..211 → 211..211 / 189..189 / 198..211 |

## Design verdict and remaining evidence

BALANCE-CHECK: CONCERNS. Mean-duration comparison flags above15% occur at ranks
none. Mage logged-DPS drift above10% occurs at
ranks 2, 3, 4, 5, 6, 7, 8. These are screening flags requiring
design interpretation, not proof that any global equal-investment invariant has
failed. Rank1 is a useful physical/fire control in this zero-resistance encounter;
later cold/lightning members use MR rather than ordinary Defense. Clear-time
saturation and overkill make logged gains and effective throughput diverge.

This completes1,000 paired seeds for each retained **rank-family** cell only.
Mastery boundaries, Defense/MR contrasts, resistance/dodge asymmetry, target
statuses/combos, realistic mixed-army coexistence and earned campaign/holdout
families remain separate work. The common hero level and fixed early wave do
not establish on-level/on-zone, Normal/Nightmare/Hell or full balance coverage.
No retuning, new status behavior or broad acceptance is authorized by these data.

## Reproduction, identity and retained evidence

Physical revision `cf19757dd5e50f122371e5eda7327f8a79095fbb`; elemental revision
`0b2b907ff378a60d7bc6d7ae15eefdc810a9cf29`. Each capture contains173 non-test engine/data
files read directly from Git blobs. Only `src/engine/combat/combat.ts` differs.
Gameplay data hashes match. The identical driver closure includes the new rank
fixture/runner plus `mage-balance-fixture.ts`, `mage-balance-runner.ts` and
`fixture.ts`; no relative helper leaks back into the checkout. Loaded gameplay
paths are verified to the corresponding source domain (58 physical/59 elemental).
Each of40 cells has a distinct Node process, captured process identity and raw
gzip hash/count index. Vite config is disabled, watcher/HMR disabled, Ajv deduped;
client and SSR dependency discovery/include are explicitly disabled. All servers
are awaited closed in `finally`. Measurement and comparison diagnostics are
retained in their own command logs.

Every cell checks A/A and A/B/A on seeds0/1 without registry reset and preserves
input bytes. Plain/recorded parity is checked at ranks1/2/3/6/9/12/15/18/20 on
seeds0/999. There are40,000 measured recordings in addition to bounded preflight
repeats/parity executions. The full audit is opt-in external tooling, excluded
from default unit execution and production bundles.

Streaming gzip writes use exclusive creation, backpressure and awaited pipeline
completion; an index is written only after successful completion. Pairing checks
the expected outer rank, exact source/driver/tool/fixture identity, ordered full
seed grid, preparation and surviving initial cadence. Retained negative probes
reject missing/duplicate/reordered seeds, changed provenance, shared wrong
rank/fixture/driver metadata, truncated gzip and intentional writer failure.
The three shared-identity checks first failed against preserved v1 tooling,
then passed after the boundary fix. These contract probes are not measurements.

The first complete retained cell measured1,000 battles in2.332s
(3.856s wrapper), before the remaining39 cells began.
Raw streams total1,998,641,840 uncompressed bytes,
85,586,671 gzip bytes. Raw events are not accumulated
in memory; only lightweight per-cell summaries are retained for aggregation.

Root-owned evidence retained at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les` for subsequent audits/reviews:

| Artifact | SHA-256 |
| --- | --- |
| mage-ranks-source-manifest.json | 22963a6d56cf938599d6fd147e35a9b7d28d0d056047d80bd81144ced3d2bd29 |
| mage-ranks-tool.json | b893d11aee5aeb9ee77c8410f7e1889f8c9461ffc60a70ff0014063412583346 |
| mage-ranks-fixtures.json | 568a1b0b215df7d65eb096b6d187743da738d418d70fe90c589963e7782074d3 |
| mage-ranks-comparison.json | a1e82c2425a582ec4e4988e89df2a22bf147b8d5d7cbbf0e3f06455f9896cb5d |
| mage-ranks-integrity-v2.json | ec834135d628ff95daa3b2a1475f62ce5e48d2f29771d8024c95798df51c1cbf |
| mage-ranks-domain.mjs | d78e8dc6404b70ca392e73531e3a5bbf86fd0db75f16239be89d8e1645b57c00 |

`mage-ranks-fixtures/` holds20 frozen inputs; `mage-ranks-raw/` holds40 raw gzip
streams and their indexes; `mage-ranks-pairs/` holds20 paired-summary gzip streams.
`commands/mage-ranks-*/` retains source snapshots, original RED/GREEN stages,
stdout/stderr, process IDs, source/output hashes and exit/timing receipts.
`mage-ranks-sources/` retains both immutable source/helper closures. Root retains
these deliverable/diagnostic paths; only manifest-inventoried disposable `dist/`
and `tmp/` may be removed after all readers/processes release. No remote action.

All40 actual measurement commands and the paired comparison exit0 with no
`[ERROR]` shutdown diagnostic; the older two-seed screen cancellation remains
separate historical evidence. Existing full-suite budget and build warnings
remain tracked in the execution ledger. This report alone is no broader sign-off.
