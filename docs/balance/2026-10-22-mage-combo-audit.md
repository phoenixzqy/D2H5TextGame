# Controlled Mage target-condition combo audit

BALANCE-CHECK: CONCERNS

This synthetic, unearned L26 Necromancer audit measures four predeclared initial
target conditions: none, chill, ignite and paralyze. Two actual Git engine domains
and seeds0..999 yield **8,000 fresh battles /4,000 P→E pairs**. The6,000 derived
within-domain intervention-versus-none contrasts reuse those battles.
All8,000 battles end in defeat with hero death. Successful TTK and paired-success
effects have count0/null quantiles. No production formula or tuning changes. The contract is
[D06 v1e](../plans/decisions/D06-mage-elemental-identity-v1.md).

These are imposed conditions on every enemy, with a common synthetic [0,6000)ms
window explicitly approved before implementation by GD/TD and independent QA.
They are not earned casts, sustained natural uptime or a Mage-only causal effect.
Default authored paralyze lasts1000ms, before the first uncontrolled Mage action
at1940ms. No duration was extended after preflight or measurement. Initial
records have stacks1/remaining6/appliedAtMs0/expiresAtMs6000 and source marker
diagnostic-mage-combo-condition; no DoT payload, tags, cooldown marker, caster,
action or MP payment is added. Production paralyze application additionally
creates a cooldown marker; this counterfactual intentionally is an initial record.

## Source and fixed transform

Direct accepted Mastery0 source,6084 serialized bytes: logical
`71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1`, SHA-256
`af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c`.
No mitigation/asymmetry helper import chain is added. The no-condition snapshot
exactly equals the accepted neutral snapshot: canonical sorted-key UTF-8 JSON
5468bytes, SHA-256
`0461e16947781dd1eb09d1ecfc87c68034f70fe3222a5ca2678e5f56373416a8`, logical
`97e3d6a84c77d895f442909da7bd4b13167a45c88f96be90bcd85c3981865661`.

Mage6/Skeleton1/Mastery0 retains330HP/187MP/Attack72/Defense95/AS125, starting
15/25/15/25,125unspent stats,7spent/20unspent skills and ordinary recovery.
Mage-only combo; no gear, mercenary or preload. Act2 Arcane Sanctuary manual
wave0/ordinal0/pity0, plan7/enemy991 retains six L24 Flayers/two Horror Mages,
exact IDs/order/2970HP/Attack147/AS110/100/skills/native controls.
Enemy Defense/Magic Resistance and physical/fire/cold/lightning/poison resistance
become0; arcane0 remains; both dodge pools become0.05. Every other source field
is preserved. The full source-relative changed-only old/new inventory contains
32 entries for none and40 for each intervention (eight initial status records).

Closed Ajv recipes reject custom status/window/build/seed/stat knobs. The full
expected source/snapshot/allocation/inventory/identities validate before the
legacy Mastery primitive. Rehashed source, timing, stacks, marker, payload, HP,
hero, skills, IDs/order and metadata forgeries reject. P→E validates each index
against its expected domain and shared fixture; controls separately validate
both distinct expected fixture/input identities in one domain/seed.

Fresh preparation is four Mages at0ms, one22MP payment187→165; each Life123 /
Attack45 /Defense10 /AS70 /magicDodge0.09. Only the elemental domain assigns fire/cold/lightning/poison
in registration order; physical uses four physical bolts. Bolts create none of
these enemy conditions or DoTs. No automatic signature-status implementation is
claimed. First Mage actions cannot precede1940ms; nonactors remain observations.

## Independent functional oracles

Landed base45 noncrit/crit, zero resistance and flat mitigation:


| Initial condition | Physical | Fire | Cold | Lightning | Poison |
| --- | --- | --- | --- | --- | --- |
| none | 45/67 | 45/67 | 45/67 | 45/67 | 45/67 |
| chill | 49/74 | 45/67 | 45/67 | 58/87 | 45/67 |
| ignite | 56/84 | 45/67 | 45/67 | 45/67 | 51/77 |
| paralyze | 45/67 | 54/81 | 45/67 | 45/67 | 45/67 |

Production activeStatusView, comboMultiplier and resolveDamage are exercised
together: active at0/5999, expired at6000/6001; expired damage uses the none row.
D06 resistance25/Defense12/MR5 noncrit cross-checks are Lightning→chill38,
Poison→ignite26, Fire→paralyze28. Combo applies before crit/resistance/mitigation
and one final floor; no epsilon. All elemental bolts use magical dodge,
physical uses physical dodge. Actual hit threshold0.7999999999999999 and crit0.05
use strict `<`; below accepts, equality/above reject, roll0.8 misses. Tests probe
below/at/above with Number.EPSILON, without claiming immediate adjacent neighbors.
Static formulas apply to both species without inventing measured exposure.

## Outcomes and source-separated effects

Successful-only TTK uses nearest-rank quantiles. Defeats/draws are censored;
defeat duration is battle-end time, not clear speed. Logged damage includes
overkill; effective HP removal replays life/heal/orbs/deaths. DPS divides each
battle's damage by its own duration, then averages. Zero baseline effects are
null. Hero/Mage/player/enemy effects remain separate: chill/paralyze alter enemy
scheduling, targets, survival, controls and RNG; physical hero attacks also gain
chill/ignite combos. Whole-battle changes cannot be credited solely to Mages.


| Case | Domain | V/D/draw | Hero deaths | Successful count; p50/p95 ms | Mean battle end ms | Nonacting /registered Mages | Death events; absent w/o death |
| --- | --- | --- | --- | --- | --- | --- | --- |
| none | physical | 0/1000/0 | 1000 | 0; None/None | 11353.3000 | 234 /4000 | 4000; 0 |
| none | elemental | 0/1000/0 | 1000 | 0; None/None | 11353.3000 | 234 /4000 | 4000; 0 |
| chill | physical | 0/1000/0 | 1000 | 0; None/None | 12491.2200 | 0 /4000 | 4000; 0 |
| chill | elemental | 0/1000/0 | 1000 | 0; None/None | 12481.8400 | 0 /4000 | 4000; 0 |
| ignite | physical | 0/1000/0 | 1000 | 0; None/None | 11486.0800 | 234 /4000 | 4000; 0 |
| ignite | elemental | 0/1000/0 | 1000 | 0; None/None | 11339.1600 | 234 /4000 | 4000; 0 |
| paralyze | physical | 0/1000/0 | 1000 | 0; None/None | 18492.6800 | 0 /4000 | 4000; 0 |
| paralyze | elemental | 0/1000/0 | 1000 | 0; None/None | 18753.6400 | 0 /4000 | 4000; 0 |

### hero per-battle means

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective DPS |
| --- | --- | --- | --- | --- | --- |
| none | physical | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| none | elemental | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| chill | physical | 461.6050 | 424.2720 | 36.9648 | 33.9901 |
| chill | elemental | 459.5240 | 424.1160 | 36.8336 | 34.0021 |
| ignite | physical | 448.9020 | 419.3810 | 39.1562 | 36.5713 |
| ignite | elemental | 443.3400 | 406.8350 | 39.2228 | 35.9629 |
| paralyze | physical | 673.0560 | 618.3900 | 36.1657 | 33.1964 |
| paralyze | elemental | 681.9840 | 626.4620 | 36.0931 | 33.1292 |

### mages per-battle means

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective DPS |
| --- | --- | --- | --- | --- | --- |
| none | physical | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| none | elemental | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| chill | physical | 429.2160 | 411.7460 | 34.8285 | 33.4247 |
| chill | elemental | 421.8770 | 404.4050 | 34.2865 | 32.8738 |
| ignite | physical | 359.3020 | 342.2420 | 31.5955 | 30.1143 |
| ignite | elemental | 294.3070 | 282.4990 | 26.2761 | 25.2407 |
| paralyze | physical | 755.4080 | 719.1300 | 41.3046 | 39.3432 |
| paralyze | elemental | 777.9110 | 740.6070 | 42.0060 | 40.0207 |

### player per-battle means

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective DPS |
| --- | --- | --- | --- | --- | --- |
| none | physical | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| none | elemental | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| chill | physical | 890.8210 | 836.0180 | 71.7934 | 67.4147 |
| chill | elemental | 881.4010 | 828.5210 | 71.1201 | 66.8759 |
| ignite | physical | 808.2040 | 761.6230 | 70.7517 | 66.6856 |
| ignite | elemental | 737.6470 | 689.3340 | 65.4989 | 61.2036 |
| paralyze | physical | 1428.4640 | 1337.5200 | 77.4703 | 72.5396 |
| paralyze | elemental | 1459.8950 | 1367.0690 | 78.0991 | 73.1498 |

### enemy per-battle means

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective DPS |
| --- | --- | --- | --- | --- | --- |
| none | physical | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| none | elemental | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| chill | physical | 939.0490 | 830.2070 | 76.5465 | 67.7473 |
| chill | elemental | 938.7290 | 830.0530 | 76.6167 | 67.8072 |
| ignite | physical | 936.9190 | 829.4860 | 83.4738 | 74.0092 |
| ignite | elemental | 934.6610 | 827.9430 | 84.3660 | 74.8552 |
| paralyze | physical | 945.2760 | 833.1040 | 52.2615 | 46.1060 |
| paralyze | elemental | 946.5790 | 832.9770 | 51.7408 | 45.5855 |

### P→E source effects, shared fixture and seed

| Case | Source | Metric | Physical | Elemental | Absolute delta | Percent delta |
| --- | --- | --- | --- | --- | --- | --- |
| none | hero | effectiveHpRemoved | 367.6470 | 367.6470 | 0.0000 | 0.0000 |
| none | hero | effectiveDps | 32.3930 | 32.3930 | 0.0000 | 0.0000 |
| none | mages | effectiveHpRemoved | 275.9950 | 275.9950 | 0.0000 | 0.0000 |
| none | mages | effectiveDps | 24.6157 | 24.6157 | 0.0000 | 0.0000 |
| none | player | effectiveHpRemoved | 643.6420 | 643.6420 | 0.0000 | 0.0000 |
| none | player | effectiveDps | 57.0087 | 57.0087 | 0.0000 | 0.0000 |
| none | enemy | effectiveHpRemoved | 827.4520 | 827.4520 | 0.0000 | 0.0000 |
| none | enemy | effectiveDps | 74.7887 | 74.7887 | 0.0000 | 0.0000 |
| chill | hero | effectiveHpRemoved | 424.2720 | 424.1160 | -0.1560 | -0.0368 |
| chill | hero | effectiveDps | 33.9901 | 34.0021 | 0.0120 | 0.0354 |
| chill | mages | effectiveHpRemoved | 411.7460 | 404.4050 | -7.3410 | -1.7829 |
| chill | mages | effectiveDps | 33.4247 | 32.8738 | -0.5508 | -1.6480 |
| chill | player | effectiveHpRemoved | 836.0180 | 828.5210 | -7.4970 | -0.8968 |
| chill | player | effectiveDps | 67.4147 | 66.8759 | -0.5388 | -0.7992 |
| chill | enemy | effectiveHpRemoved | 830.2070 | 830.0530 | -0.1540 | -0.0185 |
| chill | enemy | effectiveDps | 67.7473 | 67.8072 | 0.0599 | 0.0884 |
| ignite | hero | effectiveHpRemoved | 419.3810 | 406.8350 | -12.5460 | -2.9916 |
| ignite | hero | effectiveDps | 36.5713 | 35.9629 | -0.6084 | -1.6636 |
| ignite | mages | effectiveHpRemoved | 342.2420 | 282.4990 | -59.7430 | -17.4564 |
| ignite | mages | effectiveDps | 30.1143 | 25.2407 | -4.8737 | -16.1839 |
| ignite | player | effectiveHpRemoved | 761.6230 | 689.3340 | -72.2890 | -9.4914 |
| ignite | player | effectiveDps | 66.6856 | 61.2036 | -5.4821 | -8.2208 |
| ignite | enemy | effectiveHpRemoved | 829.4860 | 827.9430 | -1.5430 | -0.1860 |
| ignite | enemy | effectiveDps | 74.0092 | 74.8552 | 0.8460 | 1.1431 |
| paralyze | hero | effectiveHpRemoved | 618.3900 | 626.4620 | 8.0720 | 1.3053 |
| paralyze | hero | effectiveDps | 33.1964 | 33.1292 | -0.0673 | -0.2026 |
| paralyze | mages | effectiveHpRemoved | 719.1300 | 740.6070 | 21.4770 | 2.9865 |
| paralyze | mages | effectiveDps | 39.3432 | 40.0207 | 0.6775 | 1.7220 |
| paralyze | player | effectiveHpRemoved | 1337.5200 | 1367.0690 | 29.5490 | 2.2092 |
| paralyze | player | effectiveDps | 72.5396 | 73.1498 | 0.6103 | 0.8413 |
| paralyze | enemy | effectiveHpRemoved | 833.1040 | 832.9770 | -0.1270 | -0.0152 |
| paralyze | enemy | effectiveDps | 46.1060 | 45.5855 | -0.5205 | -1.1290 |

### Intervention versus none, same domain and seed

| Domain | Intervention | Source | Metric | None | Intervention | Absolute delta | Percent delta |
| --- | --- | --- | --- | --- | --- | --- | --- |
| physical | chill | hero | effectiveHpRemoved | 367.6470 | 424.2720 | 56.6250 | 15.4020 |
| physical | chill | hero | effectiveDps | 32.3930 | 33.9901 | 1.5971 | 4.9303 |
| physical | chill | mages | effectiveHpRemoved | 275.9950 | 411.7460 | 135.7510 | 49.1860 |
| physical | chill | mages | effectiveDps | 24.6157 | 33.4247 | 8.8090 | 35.7860 |
| physical | chill | player | effectiveHpRemoved | 643.6420 | 836.0180 | 192.3760 | 29.8887 |
| physical | chill | player | effectiveDps | 57.0087 | 67.4147 | 10.4061 | 18.2535 |
| physical | chill | enemy | effectiveHpRemoved | 827.4520 | 830.2070 | 2.7550 | 0.3329 |
| physical | chill | enemy | effectiveDps | 74.7887 | 67.7473 | -7.0415 | -9.4152 |
| physical | ignite | hero | effectiveHpRemoved | 367.6470 | 419.3810 | 51.7340 | 14.0717 |
| physical | ignite | hero | effectiveDps | 32.3930 | 36.5713 | 4.1783 | 12.8989 |
| physical | ignite | mages | effectiveHpRemoved | 275.9950 | 342.2420 | 66.2470 | 24.0030 |
| physical | ignite | mages | effectiveDps | 24.6157 | 30.1143 | 5.4986 | 22.3380 |
| physical | ignite | player | effectiveHpRemoved | 643.6420 | 761.6230 | 117.9810 | 18.3302 |
| physical | ignite | player | effectiveDps | 57.0087 | 66.6856 | 9.6770 | 16.9746 |
| physical | ignite | enemy | effectiveHpRemoved | 827.4520 | 829.4860 | 2.0340 | 0.2458 |
| physical | ignite | enemy | effectiveDps | 74.7887 | 74.0092 | -0.7795 | -1.0423 |
| physical | paralyze | hero | effectiveHpRemoved | 367.6470 | 618.3900 | 250.7430 | 68.2021 |
| physical | paralyze | hero | effectiveDps | 32.3930 | 33.1964 | 0.8034 | 2.4802 |
| physical | paralyze | mages | effectiveHpRemoved | 275.9950 | 719.1300 | 443.1350 | 160.5591 |
| physical | paralyze | mages | effectiveDps | 24.6157 | 39.3432 | 14.7275 | 59.8296 |
| physical | paralyze | player | effectiveHpRemoved | 643.6420 | 1337.5200 | 693.8780 | 107.8050 |
| physical | paralyze | player | effectiveDps | 57.0087 | 72.5396 | 15.5309 | 27.2430 |
| physical | paralyze | enemy | effectiveHpRemoved | 827.4520 | 833.1040 | 5.6520 | 0.6831 |
| physical | paralyze | enemy | effectiveDps | 74.7887 | 46.1060 | -28.6827 | -38.3517 |
| elemental | chill | hero | effectiveHpRemoved | 367.6470 | 424.1160 | 56.4690 | 15.3596 |
| elemental | chill | hero | effectiveDps | 32.3930 | 34.0021 | 1.6091 | 4.9675 |
| elemental | chill | mages | effectiveHpRemoved | 275.9950 | 404.4050 | 128.4100 | 46.5262 |
| elemental | chill | mages | effectiveDps | 24.6157 | 32.8738 | 8.2581 | 33.5483 |
| elemental | chill | player | effectiveHpRemoved | 643.6420 | 828.5210 | 184.8790 | 28.7239 |
| elemental | chill | player | effectiveDps | 57.0087 | 66.8759 | 9.8673 | 17.3084 |
| elemental | chill | enemy | effectiveHpRemoved | 827.4520 | 830.0530 | 2.6010 | 0.3143 |
| elemental | chill | enemy | effectiveDps | 74.7887 | 67.8072 | -6.9816 | -9.3351 |
| elemental | ignite | hero | effectiveHpRemoved | 367.6470 | 406.8350 | 39.1880 | 10.6591 |
| elemental | ignite | hero | effectiveDps | 32.3930 | 35.9629 | 3.5699 | 11.0207 |
| elemental | ignite | mages | effectiveHpRemoved | 275.9950 | 282.4990 | 6.5040 | 2.3566 |
| elemental | ignite | mages | effectiveDps | 24.6157 | 25.2407 | 0.6250 | 2.5389 |
| elemental | ignite | player | effectiveHpRemoved | 643.6420 | 689.3340 | 45.6920 | 7.0990 |
| elemental | ignite | player | effectiveDps | 57.0087 | 61.2036 | 4.1949 | 7.3584 |
| elemental | ignite | enemy | effectiveHpRemoved | 827.4520 | 827.9430 | 0.4910 | 0.0593 |
| elemental | ignite | enemy | effectiveDps | 74.7887 | 74.8552 | 0.0665 | 0.0889 |
| elemental | paralyze | hero | effectiveHpRemoved | 367.6470 | 626.4620 | 258.8150 | 70.3977 |
| elemental | paralyze | hero | effectiveDps | 32.3930 | 33.1292 | 0.7362 | 2.2726 |
| elemental | paralyze | mages | effectiveHpRemoved | 275.9950 | 740.6070 | 464.6120 | 168.3407 |
| elemental | paralyze | mages | effectiveDps | 24.6157 | 40.0207 | 15.4050 | 62.5820 |
| elemental | paralyze | player | effectiveHpRemoved | 643.6420 | 1367.0690 | 723.4270 | 112.3959 |
| elemental | paralyze | player | effectiveDps | 57.0087 | 73.1498 | 16.1412 | 28.3135 |
| elemental | paralyze | enemy | effectiveHpRemoved | 827.4520 | 832.9770 | 5.5250 | 0.6677 |
| elemental | paralyze | enemy | effectiveDps | 74.7887 | 45.5855 | -29.2033 | -39.0477 |

## Actual initial-condition exposure and hit values

Strata retain every registered Mage/type/species and both active/expired rows,
including zero attempts. None has explicit no-initial-condition rows. Replay uses
the frozen initial records and real event clocks, preserving equal-time order;
finite/nonnegative/nondecreasing clocks are required, fractional clocks allowed.
Production status activity/expiry functions classify the exclusive6000ms boundary.
No explicit expiry event is fabricated. Unsupported enemy status applications,
actions during active paralyze and enemy stunned-window inconsistencies reject.
The closed roster cannot refresh/reapply the imposed enemy conditions. Native
player chill/control events remain supported. Source-less DoT rejects the method.

### none /physical

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | none | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/physical | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | none | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/physical | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | none | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/physical | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | none | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/physical | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |

### none /elemental

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | none | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/fire | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | none | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/cold | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | none | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/lightning | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | none | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/poison | horror-mage | none | 0; 0 | 0; 0 | none | none | 0 / 0 |

### chill /physical

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | active | 2597; 2073 | 105; 524 | 49:1968 | 74:105 | 104202 / 99512 |
| 1/physical | flayer | expired | 57; 45 | 0; 12 | 45:45 | none | 2025 / 1843 |
| 1/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | active | 2602; 2114 | 111; 488 | 49:2003 | 74:111 | 106361 / 102399 |
| 2/physical | flayer | expired | 71; 57 | 3; 14 | 45:54 | 67:3 | 2631 / 2369 |
| 2/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | active | 2596; 2089 | 104; 507 | 49:1985 | 74:104 | 104961 / 101246 |
| 3/physical | flayer | expired | 57; 44 | 3; 13 | 45:41 | 67:3 | 2046 / 1961 |
| 3/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | horror-mage | expired | 2; 1 | 0; 1 | 45:1 | none | 45 / 45 |
| 4/physical | flayer | active | 2614; 2086 | 111; 528 | 49:1975 | 74:111 | 104989 / 100532 |
| 4/physical | flayer | expired | 61; 42 | 3; 19 | 45:39 | 67:3 | 1956 / 1839 |
| 4/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |

### chill /elemental

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | active | 2596; 2076 | 101; 520 | 45:1975 | 67:101 | 95642 / 91604 |
| 1/fire | flayer | expired | 58; 47 | 1; 11 | 45:46 | 67:1 | 2137 / 1866 |
| 1/fire | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/fire | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | active | 2600; 2109 | 110; 491 | 45:1999 | 67:110 | 97325 / 93883 |
| 2/cold | flayer | expired | 64; 52 | 3; 12 | 45:49 | 67:3 | 2406 / 2193 |
| 2/cold | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | active | 2597; 2092 | 103; 505 | 58:1989 | 87:103 | 124323 / 118745 |
| 3/lightning | flayer | expired | 56; 42 | 3; 14 | 45:39 | 67:3 | 1956 / 1904 |
| 3/lightning | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | horror-mage | expired | 2; 1 | 0; 1 | 45:1 | none | 45 / 45 |
| 4/poison | flayer | active | 2612; 2083 | 111; 529 | 45:1972 | 67:111 | 96177 / 92391 |
| 4/poison | flayer | expired | 59; 40 | 3; 19 | 45:37 | 67:3 | 1866 / 1774 |
| 4/poison | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |

### ignite /physical

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | active | 1914; 1511 | 70; 403 | 56:1441 | 84:70 | 86576 / 82014 |
| 1/physical | flayer | expired | 74; 61 | 2; 13 | 45:59 | 67:2 | 2789 / 2592 |
| 1/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/physical | horror-mage | expired | 1; 0 | 0; 1 | none | none | 0 / 0 |
| 2/physical | flayer | active | 1877; 1528 | 72; 349 | 56:1456 | 84:72 | 87584 / 83225 |
| 2/physical | flayer | expired | 67; 55 | 3; 12 | 45:52 | 67:3 | 2541 / 2499 |
| 2/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | active | 1876; 1508 | 73; 368 | 56:1435 | 84:73 | 86492 / 82854 |
| 3/physical | flayer | expired | 65; 52 | 4; 13 | 45:48 | 67:4 | 2428 / 2196 |
| 3/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | active | 1933; 1539 | 83; 394 | 56:1456 | 84:83 | 88508 / 84612 |
| 4/physical | flayer | expired | 65; 52 | 2; 13 | 45:50 | 67:2 | 2384 / 2250 |
| 4/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |

### ignite /elemental

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | active | 1899; 1511 | 67; 388 | 45:1444 | 67:67 | 69469 / 66848 |
| 1/fire | flayer | expired | 55; 43 | 1; 12 | 45:42 | 67:1 | 1957 / 1895 |
| 1/fire | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/fire | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | active | 1854; 1509 | 70; 345 | 45:1439 | 67:70 | 69445 / 66654 |
| 2/cold | flayer | expired | 52; 42 | 1; 10 | 45:41 | 67:1 | 1912 / 1793 |
| 2/cold | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | active | 1858; 1492 | 68; 366 | 45:1424 | 67:68 | 68636 / 65939 |
| 3/lightning | flayer | expired | 52; 41 | 0; 11 | 45:41 | none | 1845 / 1834 |
| 3/lightning | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | active | 1913; 1504 | 89; 409 | 51:1415 | 77:89 | 79018 / 75583 |
| 4/poison | flayer | expired | 59; 45 | 0; 14 | 45:45 | none | 2025 / 1953 |
| 4/poison | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | horror-mage | expired | 0; 0 | 0; 0 | none | none | 0 / 0 |

### paralyze /physical

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | active | 3000; 2405 | 114; 595 | 45:2291 | 67:114 | 110733 / 106087 |
| 1/physical | flayer | expired | 1894; 1545 | 84; 349 | 45:1461 | 67:84 | 71373 / 66346 |
| 1/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/physical | horror-mage | expired | 208; 158 | 8; 50 | 45:150 | 67:8 | 7286 / 7227 |
| 2/physical | flayer | active | 3000; 2395 | 131; 605 | 45:2264 | 67:131 | 110657 / 106701 |
| 2/physical | flayer | expired | 1869; 1479 | 80; 390 | 45:1399 | 67:80 | 68315 / 64492 |
| 2/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | horror-mage | expired | 192; 153 | 5; 39 | 45:148 | 67:5 | 6995 / 6896 |
| 3/physical | flayer | active | 3000; 2433 | 129; 567 | 45:2304 | 67:129 | 112323 / 107522 |
| 3/physical | flayer | expired | 1901; 1531 | 76; 370 | 45:1455 | 67:76 | 70567 / 65480 |
| 3/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | horror-mage | expired | 213; 169 | 15; 44 | 45:154 | 67:15 | 7935 / 7826 |
| 4/physical | flayer | active | 3000; 2413 | 135; 587 | 45:2278 | 67:135 | 111555 / 107219 |
| 4/physical | flayer | expired | 1881; 1514 | 85; 367 | 45:1429 | 67:85 | 70000 / 65792 |
| 4/physical | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | horror-mage | expired | 196; 167 | 7; 29 | 45:160 | 67:7 | 7669 / 7542 |

### paralyze /elemental

| Mage/type | Target species | Exposure | Attempts; landed | Crits; dodges | Noncrit value:count | Crit value:count | Logged /effective HP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | active | 3000; 2402 | 113; 598 | 54:2289 | 81:113 | 132759 / 125049 |
| 1/fire | flayer | expired | 1862; 1506 | 86; 356 | 45:1420 | 67:86 | 69662 / 64350 |
| 1/fire | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 1/fire | horror-mage | expired | 228; 171 | 8; 57 | 45:163 | 67:8 | 7871 / 7743 |
| 2/cold | flayer | active | 3000; 2401 | 132; 599 | 45:2269 | 67:132 | 110949 / 107862 |
| 2/cold | flayer | expired | 1859; 1464 | 74; 395 | 45:1390 | 67:74 | 67508 / 63515 |
| 2/cold | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | horror-mage | expired | 227; 178 | 7; 49 | 45:171 | 67:7 | 8164 / 8063 |
| 3/lightning | flayer | active | 3000; 2435 | 128; 565 | 45:2307 | 67:128 | 112391 / 108024 |
| 3/lightning | flayer | expired | 1881; 1505 | 69; 376 | 45:1436 | 67:69 | 69243 / 64815 |
| 3/lightning | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | horror-mage | expired | 255; 203 | 16; 52 | 45:187 | 67:16 | 9487 / 9321 |
| 4/poison | flayer | active | 3000; 2413 | 137; 587 | 45:2276 | 67:137 | 111599 / 107855 |
| 4/poison | flayer | expired | 1869; 1505 | 81; 364 | 45:1424 | 67:81 | 69507 / 65339 |
| 4/poison | horror-mage | active | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | horror-mage | expired | 233; 191 | 8; 42 | 45:183 | 67:8 | 8771 / 8671 |

Crit denominator is landed attempts; dodge denominator is all attempts.
Histograms separate noncrit/crit, exclude dodges, and reconcile to direct totals.
Zero-attempt Horror strata remain unobserved. Actual bounded Horror exposure is
reported per Mage/type/window; it is not representative species viability.
Synthetic meter tests include mixed active/expired hits, expiry equality,
fractional clocks, overkill/heal/orbs, orphan/death/absence and success censoring.

## Controls, resources and interpretation limits

Authored control behavior is retained; observed event traces include native
player status/stunned events and imposed-paralyze enemy stunned events. Raw
status/stunned events have no source; stunned has no status ID. Neither is
invented attribution. Initial conditions are not emitted casts/applications.
MP entry/minimum/final is observed; no mana-starved action percentage can be
inferred from low-water MP alone. Summon death events include owner-orphan
transactions and are not claimed to be all direct kills.


| Case | Domain | Status events | Stunned events | MP entry min/max | MP minimum min/max | MP final min/max |
| --- | --- | --- | --- | --- | --- | --- |
| none | physical | 4539 | 0 | 187/187 | 165/165 | 187/187 |
| none | elemental | 4539 | 0 | 187/187 | 165/165 | 187/187 |
| chill | physical | 3163 | 0 | 187/187 | 165/165 | 187/187 |
| chill | elemental | 3168 | 0 | 187/187 | 165/165 | 187/187 |
| ignite | physical | 4622 | 0 | 187/187 | 165/165 | 187/187 |
| ignite | elemental | 4565 | 0 | 187/187 | 165/165 | 187/187 |
| paralyze | physical | 5060 | 23254 | 187/187 | 165/165 | 187/187 |
| paralyze | elemental | 5110 | 23191 | 187/187 | 165/165 | 187/187 |

## Reproduction and retained evidence

Root owns evidence under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`.
Retain source/raw/fixture/index/pair/control/checker/command receipts and failed
attempts for reviewers and subsequent families. The physical Git revision is
`cf19757dd5e50f122371e5eda7327f8a79095fbb`; elemental is
`05dc47541bb19f9875d65910d105ec459d96cdf0`. Per domain173 immutable engine/data
Git blobs are captured, with seven shared helpers plus driver, seven configs,
installed Vite/esbuild/Ajv executable/file identities and actual Node identity.
Fixtures serialize once for both domains. Actual loaded gameplay identities
must stay inside their expected source domain.

Commands are captured by capture-mage-combo.py. The external driver supports
fixtures elemental, integrity, preflight physical/elemental, run DOMAIN CASE,
compare elemental and controls DOMAIN. Run one command to settled exit before
starting the next. First1000physical-none cell is inspected/timed before the
remaining seven unchanged cells. Preflight seeds0/7/991/999, A/A and A/B/A0/1,
plain/recorded parity0/999 and input preservation are excluded from8000 counts.
No forced wins/targets/hits or outcome-driven matrix extension.

Exclusive gzip streams retain compressed/uncompressed hashes/bytes/ordered seeds;
one full battle is written before the next. Both readers settle in finally.
Missing/duplicate/reordered/truncated/writer failures and paired/control wrong
provenance reject (19probes,2accepted/17rejected). SSR closes in finally, config/
env/watch/HMR/client/SSR discovery disabled, Ajv deduplicated. No broad kills.
Independent Python checks reconstruct fixtures and replay all raw HP/MP/source
counters/exposure/histograms/controls, pairs/contrasts/arithmetic, displayed tables,
provenance, serial receipts and final source/bundle exclusion.

TDD RED and the initial negative-test type-inference failure remain preserved.
The repository lint excludes tests; targeted default lint refused ignored files,
then explicit --no-ignore found style/runtime-check typing findings. Those were
corrected without suppression. The superseded premeasurement capture remains in
mage-combo-capture-v1; no measurements used it. Root later started elemental
control aggregation before a physical command settled; the elemental attempt
reported a WebSocket port error. Root stopped its exact verified owned PID3992954
(exit-15). Both original attempts/partial outputs remain in
mage-combo-control-overlap and their command receipts. All6,000 accepted contrasts
were regenerated from unchanged measured battles, using settled serial receipts
mage-combo-controls-physical-serial and mage-combo-controls-elemental-serial.
No measured battle was rerun or changed. Final serial focused/types/lint/
explicitlint/fullunit/build/checker receipts and independent reviews are recorded
in the execution ledger. Existing full-unit timing budget and Browserslist/
chunk-size/manifest-precache warnings stay open, not waived.


| Retained manifest | SHA-256 |
| --- | --- |
| mage-combo-source-manifest.json | 3b2f493fd7c3b3bd2e1e7ac25229222b54b92607c9e438f480c90ed8df17dd55 |
| mage-combo-fixtures.json | 9e12b3515873613a352c352710f50e5c8c95109678cc8bfdaa7f89267ddd8797 |
| mage-combo-comparison.json | de5b47bd8e42a80fc02b24885a24f03293ed19c2b3e16b802e1e952c82ee4f84 |
| mage-combo-integrity.json | c66c28b9adceba93b7555370974a3befaf98789396dff33f01fc371fa79a72b8 |
| mage-combo-control-physical.json | d8e23ab3f4355581722362f5b6e9b61977040ad8015f77cc21f31c712682f0a2 |
| mage-combo-control-elemental.json | 1945536d3ffcf8763c699629b53fb9e77c197ddead26279e7b48079f7a46cdf6 |

This finite audit cannot establish equal-investment or earned viability,
campaign pacing, natural combo uptime, drop yield or global balance. Realistic
mixed armies follow separately, then earned/campaign/holdout/experiential work.
Signature statuses, full Mage/D06/P09/P10/private-v1 remain unaccepted. Production
engine/data/save/config and SaveCurrent11 remain untouched; no remote action.

