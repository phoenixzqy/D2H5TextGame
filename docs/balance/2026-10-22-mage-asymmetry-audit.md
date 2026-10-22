# Controlled Mage resistance and dodge audit

BALANCE-CHECK: CONCERNS

This **unearned L26 Necromancer** audit measures five predeclared synthetic enemy
cases in actual historical physical and elemental Git domains: **10,000 fresh
battles / 5,000 P→E seed pairs**. Each domain/case uses seeds0..999. An additional
8,000 derived intervention-versus-neutral contrasts reuse those same measured
battles; they are not extra measurements. All10,000 battles end in defeat with
hero death. Successful-only TTK and paired-success effects have count0 and null
quantiles. Defeat duration measures battle end, not clear speed or viability.

The cases isolate resistance or dodge main effects at Defense0/MR0. They do not
measure resistance×dodge interactions, tune production, rank equal-investment
builds or establish global balance. Whole-battle trajectories can diverge through
hero damage, targets, kills, controls, later actions and RNG consumption. Effects
must be read by source; total player effects cannot be credited solely to Mages.
The controlling contract is [D06 v1e](../plans/decisions/D06-mage-elemental-identity-v1.md).
Target combos, realistic mixed armies, earned campaign/holdout/global acceptance,
signature statuses, full D06/P09/P10 and private-v1 remain open.

## Frozen source and closed transforms

The exact accepted v1bl d00-m00 outer source has logical hash
`e3eb0805ba668583a8f2d26d986071aab9ede8d68c7cbe7a70702302c4d537dd`
and serialized SHA-256
`5efa93aa26fb17572bd5c4bd1ec4b99871cb20f12f0b4c6d4244e224be6bb2f2`.
Its underlying Mastery0 logical/serialized identities remain
`71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1` /
`af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c`.

Mage6/Skeleton1/Mastery0 uses ordinary330HP/187MP/Attack72/Defense95/AS125,
core15/25/15/25, all125 stat points unspent, spent7/unspent20 skills and ordinary
recovery. Production allocation/prerequisites are used. Mage is the sole combo;
no gear, mercenary or preloaded summon exists. The source wave is Act2 Arcane
Sanctuary manual first ordinary wave0, ordinal0/pity0, plan7/enemy991: six L24
Undead Flayers and two L24 Horror Mages. HP in source order is
425/395/349/318/393/376/411/303, total2970. IDs/order, Attack147, AS110/100, all
skills/controls, hero, resources and allocation remain unchanged.

All cases are synthetic/unearned. Every enemy retains Defense0/MR0 and arcane
resistance0. Neutral resets all physical/fire/cold/lightning/poison resistances
to0 and both dodge pools to0.05. Each intervention changes only one resistance
group or dodge pool versus neutral; counts below inventory changes versus the
frozen outer source, whose authored resistances are not neutral.


| Case | Physical resist | F/C/L/P resist | Physical dodge | Magical dodge | Changed field entries |
| --- | --- | --- | --- | --- | --- |
| neutral | 0 | 0 | 0.05 | 0.05 | 16 |
| physical-resist | 75 | 0 | 0.05 | 0.05 | 18 |
| elemental-resist | 0 | 75 | 0.05 | 0.05 | 32 |
| physical-dodge | 0 | 0 | 0.35 | 0.05 | 24 |
| magical-dodge | 0 | 0 | 0.05 | 0.35 | 24 |

The closed Ajv recipe exposes no custom build/stat/seed controls. Full expected
source/recipe/snapshot/allocation/changed-only inventory and both logical/byte
identities are reconstructed before the accepted Mastery recorder. Rehashed
semantic forgeries and shared wrong metadata reject against external expected
case/source/transform/fixture identities. P→E pairs require the same fixture;
neutral contrasts deliberately have different fixture/input hashes and validate
each side separately against its own expected case in the same domain/seed.

Each case registers four fresh Mages at0ms, one22MP payment187→165, Life123 /
Attack45 / Defense10 / AS70 / magical dodge0.09. Only the elemental domain assigns fire/cold/lightning/poison
in registration order; the historical baseline uses four physical bolts. No
automatic status/DoT is added. DoT rejects the direct-only method. First Mage
actions cannot precede1940ms. Nonactors remain recorded observations.

## Independent static damage and probability oracles

These literals use base45, no statuses and no flat mitigation. Resist0 yields
45 noncrit /67 crit; resist75 yields11/16. Crit applies before resistance and
flooring. Dodge damage is0. These static oracles apply to either species here,
without claiming observed exposure to both.

At dodge0.05, the actual computed hit threshold is0.7999999999999999; at0.35 it
is0.5. Crit threshold is0.05 among landed hits. Every comparison uses strict `<`:
below accepts, equality/above reject. In particular roll0.8 misses the baseline.
All elemental bolts use magical dodge, including fire/poison, even though their
flat-mitigation path differs from cold/lightning. Physical bolts use physical
dodge. Existing engine integration tests verify actual type routing; isolated
resolver probes verify literal chance arguments and below/at/above threshold rolls.


| Case | Physical noncrit/crit | F/C/L/P noncrit/crit | Physical hit threshold | Elemental hit threshold |
| --- | --- | --- | --- | --- |
| neutral | 45/67 | 45/67 | 0.7999999999999999 | 0.7999999999999999 |
| physical-resist | 11/16 | 45/67 | 0.7999999999999999 | 0.7999999999999999 |
| elemental-resist | 45/67 | 11/16 | 0.7999999999999999 | 0.7999999999999999 |
| physical-dodge | 45/67 | 45/67 | 0.5 | 0.7999999999999999 |
| magical-dodge | 45/67 | 45/67 | 0.7999999999999999 | 0.5 |

## Outcomes and P→E effects

TTK includes victories only, using nearest-rank p50/p95. Defeats and draws are
separate censored outcomes. Every domain/case has1000 hero deaths and successful
TTK count0/p50null/p95null. Every P→E paired-success count is0, faster/equal/slower
0/0/0, with mean/p50/p95 effects null. No defeat duration is a fabricated TTK.

DPS means the arithmetic mean of each battle's damage divided by its own logical
duration. Logged damage includes overkill; effective HP removed clamps each event
after intervening heals/HP orbs. It is not a unique-enemy-HP percentage.


| Case | Domain | Victories / defeats / draws | Mean battle duration ms | Successful TTK count / p50 / p95 |
| --- | --- | --- | --- | --- |
| neutral | physical | 0 / 1000 / 0 | 11353.3000 | 0.0000 / null / null |
| neutral | elemental | 0 / 1000 / 0 | 11353.3000 | 0.0000 / null / null |
| physical-resist | physical | 0 / 1000 / 0 | 11123.9800 | 0.0000 / null / null |
| physical-resist | elemental | 0 / 1000 / 0 | 11157.5800 | 0.0000 / null / null |
| elemental-resist | physical | 0 / 1000 / 0 | 11353.3000 | 0.0000 / null / null |
| elemental-resist | elemental | 0 / 1000 / 0 | 11215.9000 | 0.0000 / null / null |
| physical-dodge | physical | 0 / 1000 / 0 | 11134.1600 | 0.0000 / null / null |
| physical-dodge | elemental | 0 / 1000 / 0 | 11247.5400 | 0.0000 / null / null |
| magical-dodge | physical | 0 / 1000 / 0 | 11353.3000 | 0.0000 / null / null |
| magical-dodge | elemental | 0 / 1000 / 0 | 11251.0400 | 0.0000 / null / null |

| Case | Mage effective damage P → E | Mage effective HP/s P → E | Mage logged DPS change % |
| --- | --- | --- | --- |
| neutral | 275.9950 → 275.9950 | 24.6157 → 24.6157 | 0.0000 |
| physical-resist | 67.5830 → 275.0520 | 6.1664 → 24.9828 | 308.5539 |
| elemental-resist | 275.9950 → 67.6910 | 24.6157 → 6.1246 | -75.7863 |
| physical-dodge | 174.2910 → 277.0870 | 15.8517 → 24.9866 | 59.3986 |
| magical-dodge | 275.9950 → 174.3190 | 24.6157 → 15.6575 | -37.2550 |

Mean direct damage for source **hero**:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| neutral | physical | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| neutral | elemental | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| physical-resist | physical | 98.4240 | 98.4240 | 8.8602 | 8.8602 |
| physical-resist | elemental | 98.6220 | 97.1520 | 8.8532 | 8.7288 |
| elemental-resist | physical | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| elemental-resist | elemental | 396.2160 | 377.3930 | 35.3755 | 33.7628 |
| physical-dodge | physical | 248.6160 | 230.5900 | 22.3152 | 20.7697 |
| physical-dodge | elemental | 248.6880 | 227.6550 | 22.0814 | 20.2482 |
| magical-dodge | physical | 400.6800 | 367.6470 | 35.3275 | 32.3930 |
| magical-dodge | elemental | 394.1280 | 359.8010 | 35.0303 | 31.9849 |

Mean direct damage for source **mages**:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| neutral | physical | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| neutral | elemental | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| physical-resist | physical | 67.5830 | 67.5830 | 6.1664 | 6.1664 |
| physical-resist | elemental | 277.5250 | 275.0520 | 25.1932 | 24.9828 |
| elemental-resist | physical | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| elemental-resist | elemental | 67.6920 | 67.6910 | 6.1247 | 6.1246 |
| physical-dodge | physical | 175.7150 | 174.2910 | 15.9821 | 15.8517 |
| physical-dodge | elemental | 282.5820 | 277.0870 | 25.4752 | 24.9866 |
| magical-dodge | physical | 283.7320 | 275.9950 | 25.2942 | 24.6157 |
| magical-dodge | elemental | 176.7510 | 174.3190 | 15.8709 | 15.6575 |

Mean direct damage for source **player**:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| neutral | physical | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| neutral | elemental | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| physical-resist | physical | 166.0070 | 166.0070 | 15.0267 | 15.0267 |
| physical-resist | elemental | 376.1470 | 372.2040 | 34.0464 | 33.7116 |
| elemental-resist | physical | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| elemental-resist | elemental | 463.9080 | 445.0840 | 41.5002 | 39.8874 |
| physical-dodge | physical | 424.3310 | 404.8810 | 38.2972 | 36.6214 |
| physical-dodge | elemental | 531.2700 | 504.7420 | 47.5566 | 45.2348 |
| magical-dodge | physical | 684.4120 | 643.6420 | 60.6217 | 57.0087 |
| magical-dodge | elemental | 570.8790 | 534.1200 | 50.9011 | 47.6424 |

Mean direct damage for source **enemy**:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| neutral | physical | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| neutral | elemental | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| physical-resist | physical | 929.7920 | 821.9870 | 85.4738 | 75.7035 |
| physical-resist | elemental | 931.3430 | 823.5200 | 85.3819 | 75.6253 |
| elemental-resist | physical | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| elemental-resist | elemental | 932.1960 | 824.7920 | 85.1308 | 75.4557 |
| physical-dodge | physical | 932.0360 | 824.2330 | 85.7103 | 75.9265 |
| physical-dodge | elemental | 931.5230 | 825.8830 | 84.7170 | 75.2497 |
| magical-dodge | physical | 935.8100 | 827.4520 | 84.4426 | 74.7887 |
| magical-dodge | elemental | 933.7780 | 825.8930 | 85.0241 | 75.3483 |

## Within-domain main effects versus neutral

These8,000 ordered seed contrasts use the same10,000 battles. The different
fixture/input identities are expected and independently bound. Absolute effect
is intervention minus neutral; percentage is `(intervention/neutral−1)×100` on
source-specific means. A zero baseline or absent metric yields null percentage,
never an infinite or fabricated effect. All four damage/DPS metrics, outcome
summaries and rate denominators are retained in control artifacts; effective
HP removed and effective DPS are displayed for all four sources below. Each
control paired-success count is0 with null mean/p50/p95 TTK change.


| Domain | Case | Source | Metric | Neutral | Intervention | Absolute effect | Percent effect |
| --- | --- | --- | --- | --- | --- | --- | --- |
| physical | physical-resist | hero | effectiveHpRemoved | 367.6470 | 98.4240 | -269.2230 | -73.2287 |
| physical | physical-resist | hero | effectiveDps | 32.3930 | 8.8602 | -23.5327 | -72.6476 |
| physical | physical-resist | mages | effectiveHpRemoved | 275.9950 | 67.5830 | -208.4120 | -75.5130 |
| physical | physical-resist | mages | effectiveDps | 24.6157 | 6.1664 | -18.4493 | -74.9491 |
| physical | physical-resist | player | effectiveHpRemoved | 643.6420 | 166.0070 | -477.6350 | -74.2082 |
| physical | physical-resist | player | effectiveDps | 57.0087 | 15.0267 | -41.9820 | -73.6414 |
| physical | physical-resist | enemy | effectiveHpRemoved | 827.4520 | 821.9870 | -5.4650 | -0.6605 |
| physical | physical-resist | enemy | effectiveDps | 74.7887 | 75.7035 | 0.9148 | 1.2232 |
| physical | elemental-resist | hero | effectiveHpRemoved | 367.6470 | 367.6470 | 0.0000 | 0.0000 |
| physical | elemental-resist | hero | effectiveDps | 32.3930 | 32.3930 | 0.0000 | 0.0000 |
| physical | elemental-resist | mages | effectiveHpRemoved | 275.9950 | 275.9950 | 0.0000 | 0.0000 |
| physical | elemental-resist | mages | effectiveDps | 24.6157 | 24.6157 | 0.0000 | 0.0000 |
| physical | elemental-resist | player | effectiveHpRemoved | 643.6420 | 643.6420 | 0.0000 | 0.0000 |
| physical | elemental-resist | player | effectiveDps | 57.0087 | 57.0087 | 0.0000 | 0.0000 |
| physical | elemental-resist | enemy | effectiveHpRemoved | 827.4520 | 827.4520 | 0.0000 | 0.0000 |
| physical | elemental-resist | enemy | effectiveDps | 74.7887 | 74.7887 | 0.0000 | 0.0000 |
| physical | physical-dodge | hero | effectiveHpRemoved | 367.6470 | 230.5900 | -137.0570 | -37.2795 |
| physical | physical-dodge | hero | effectiveDps | 32.3930 | 20.7697 | -11.6233 | -35.8820 |
| physical | physical-dodge | mages | effectiveHpRemoved | 275.9950 | 174.2910 | -101.7040 | -36.8499 |
| physical | physical-dodge | mages | effectiveDps | 24.6157 | 15.8517 | -8.7640 | -35.6032 |
| physical | physical-dodge | player | effectiveHpRemoved | 643.6420 | 404.8810 | -238.7610 | -37.0953 |
| physical | physical-dodge | player | effectiveDps | 57.0087 | 36.6214 | -20.3872 | -35.7616 |
| physical | physical-dodge | enemy | effectiveHpRemoved | 827.4520 | 824.2330 | -3.2190 | -0.3890 |
| physical | physical-dodge | enemy | effectiveDps | 74.7887 | 75.9265 | 1.1378 | 1.5214 |
| physical | magical-dodge | hero | effectiveHpRemoved | 367.6470 | 367.6470 | 0.0000 | 0.0000 |
| physical | magical-dodge | hero | effectiveDps | 32.3930 | 32.3930 | 0.0000 | 0.0000 |
| physical | magical-dodge | mages | effectiveHpRemoved | 275.9950 | 275.9950 | 0.0000 | 0.0000 |
| physical | magical-dodge | mages | effectiveDps | 24.6157 | 24.6157 | 0.0000 | 0.0000 |
| physical | magical-dodge | player | effectiveHpRemoved | 643.6420 | 643.6420 | 0.0000 | 0.0000 |
| physical | magical-dodge | player | effectiveDps | 57.0087 | 57.0087 | 0.0000 | 0.0000 |
| physical | magical-dodge | enemy | effectiveHpRemoved | 827.4520 | 827.4520 | 0.0000 | 0.0000 |
| physical | magical-dodge | enemy | effectiveDps | 74.7887 | 74.7887 | 0.0000 | 0.0000 |
| elemental | physical-resist | hero | effectiveHpRemoved | 367.6470 | 97.1520 | -270.4950 | -73.5747 |
| elemental | physical-resist | hero | effectiveDps | 32.3930 | 8.7288 | -23.6642 | -73.0534 |
| elemental | physical-resist | mages | effectiveHpRemoved | 275.9950 | 275.0520 | -0.9430 | -0.3417 |
| elemental | physical-resist | mages | effectiveDps | 24.6157 | 24.9828 | 0.3671 | 1.4913 |
| elemental | physical-resist | player | effectiveHpRemoved | 643.6420 | 372.2040 | -271.4380 | -42.1722 |
| elemental | physical-resist | player | effectiveDps | 57.0087 | 33.7116 | -23.2971 | -40.8658 |
| elemental | physical-resist | enemy | effectiveHpRemoved | 827.4520 | 823.5200 | -3.9320 | -0.4752 |
| elemental | physical-resist | enemy | effectiveDps | 74.7887 | 75.6253 | 0.8366 | 1.1186 |
| elemental | elemental-resist | hero | effectiveHpRemoved | 367.6470 | 377.3930 | 9.7460 | 2.6509 |
| elemental | elemental-resist | hero | effectiveDps | 32.3930 | 33.7628 | 1.3698 | 4.2287 |
| elemental | elemental-resist | mages | effectiveHpRemoved | 275.9950 | 67.6910 | -208.3040 | -75.4738 |
| elemental | elemental-resist | mages | effectiveDps | 24.6157 | 6.1246 | -18.4911 | -75.1192 |
| elemental | elemental-resist | player | effectiveHpRemoved | 643.6420 | 445.0840 | -198.5580 | -30.8491 |
| elemental | elemental-resist | player | effectiveDps | 57.0087 | 39.8874 | -17.1213 | -30.0328 |
| elemental | elemental-resist | enemy | effectiveHpRemoved | 827.4520 | 824.7920 | -2.6600 | -0.3215 |
| elemental | elemental-resist | enemy | effectiveDps | 74.7887 | 75.4557 | 0.6670 | 0.8918 |
| elemental | physical-dodge | hero | effectiveHpRemoved | 367.6470 | 227.6550 | -139.9920 | -38.0778 |
| elemental | physical-dodge | hero | effectiveDps | 32.3930 | 20.2482 | -12.1447 | -37.4919 |
| elemental | physical-dodge | mages | effectiveHpRemoved | 275.9950 | 277.0870 | 1.0920 | 0.3957 |
| elemental | physical-dodge | mages | effectiveDps | 24.6157 | 24.9866 | 0.3709 | 1.5066 |
| elemental | physical-dodge | player | effectiveHpRemoved | 643.6420 | 504.7420 | -138.9000 | -21.5803 |
| elemental | physical-dodge | player | effectiveDps | 57.0087 | 45.2348 | -11.7739 | -20.6528 |
| elemental | physical-dodge | enemy | effectiveHpRemoved | 827.4520 | 825.8830 | -1.5690 | -0.1896 |
| elemental | physical-dodge | enemy | effectiveDps | 74.7887 | 75.2497 | 0.4609 | 0.6163 |
| elemental | magical-dodge | hero | effectiveHpRemoved | 367.6470 | 359.8010 | -7.8460 | -2.1341 |
| elemental | magical-dodge | hero | effectiveDps | 32.3930 | 31.9849 | -0.4081 | -1.2597 |
| elemental | magical-dodge | mages | effectiveHpRemoved | 275.9950 | 174.3190 | -101.6760 | -36.8398 |
| elemental | magical-dodge | mages | effectiveDps | 24.6157 | 15.6575 | -8.9582 | -36.3921 |
| elemental | magical-dodge | player | effectiveHpRemoved | 643.6420 | 534.1200 | -109.5220 | -17.0160 |
| elemental | magical-dodge | player | effectiveDps | 57.0087 | 47.6424 | -9.3662 | -16.4295 |
| elemental | magical-dodge | enemy | effectiveHpRemoved | 827.4520 | 825.8930 | -1.5590 | -0.1884 |
| elemental | magical-dodge | enemy | effectiveDps | 74.7887 | 75.3483 | 0.5596 | 0.7482 |

| Domain | Case | Neutral crits/landed | Intervention crits/landed | Neutral dodges/attempts | Intervention dodges/attempts | Neutral/intervention outcomes V-D-Draw |
| --- | --- | --- | --- | --- | --- | --- |
| physical | physical-resist | 301/6158 | 299/6008 | 1555/7713 | 1514/7522 | 0/1000/0; 0/1000/0 |
| physical | elemental-resist | 301/6158 | 301/6158 | 1555/7713 | 1555/7713 | 0/1000/0; 0/1000/0 |
| physical | physical-dodge | 301/6158 | 200/3807 | 1555/7713 | 3771/7578 | 0/1000/0; 0/1000/0 |
| physical | magical-dodge | 301/6158 | 301/6158 | 1555/7713 | 1555/7713 | 0/1000/0; 0/1000/0 |
| elemental | physical-resist | 301/6158 | 295/6023 | 1555/7713 | 1519/7542 | 0/1000/0; 0/1000/0 |
| elemental | elemental-resist | 301/6158 | 301/6017 | 1555/7713 | 1514/7531 | 0/1000/0; 0/1000/0 |
| elemental | physical-dodge | 301/6158 | 306/6130 | 1555/7713 | 1512/7642 | 0/1000/0; 0/1000/0 |
| elemental | magical-dodge | 301/6158 | 198/3831 | 1555/7713 | 3793/7624 | 0/1000/0; 0/1000/0 |

## Actual per-Mage/type/species strata

Each of the80 rows retains one registration slot/type × Flayer/Horror stratum
across1000 seeds, including zero attempts. Slots1..4 map to retained actual IDs
in raw/pair files. Landed is the crit denominator; attempts are the dodge
denominator. Histograms are `logged amount:count`, split noncrit/crit; dodges are
excluded. Effective HP is independently replayed, not inferred from damage.
Counts describe these observations and do not prove nominal rates for small
strata. No target or crit coverage is forced.

**neutral / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**neutral / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**physical-resist / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1886; 1516 | 76; 370 | 11:1440 | 16:76 | 17056 / 17056 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1855; 1502 | 77; 353 | 11:1425 | 16:77 | 16907 / 16907 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1850; 1478 | 62; 372 | 11:1416 | 16:62 | 16568 / 16568 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1931; 1512 | 84; 419 | 11:1428 | 16:84 | 17052 / 17052 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**physical-resist / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1896; 1525 | 75; 371 | 45:1450 | 67:75 | 70275 / 69744 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1862; 1504 | 72; 358 | 45:1432 | 67:72 | 69264 / 68551 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1851; 1479 | 63; 372 | 45:1416 | 67:63 | 67941 / 67329 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1933; 1515 | 85; 418 | 45:1430 | 67:85 | 70045 / 69428 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**elemental-resist / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**elemental-resist / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1885; 1515 | 76; 370 | 11:1439 | 16:76 | 17045 / 17045 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1861; 1505 | 77; 356 | 11:1428 | 16:77 | 16940 / 16940 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1852; 1483 | 63; 369 | 11:1420 | 16:63 | 16628 / 16627 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1933; 1514 | 85; 419 | 11:1429 | 16:85 | 17079 / 17079 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**physical-dodge / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1869; 907 | 42; 962 | 45:865 | 67:42 | 41739 / 41319 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1856; 1006 | 54; 850 | 45:952 | 67:54 | 46458 / 46218 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1918; 898 | 45; 1020 | 45:853 | 67:45 | 41400 / 41027 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1935; 996 | 59; 939 | 45:937 | 67:59 | 46118 / 45727 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**physical-dodge / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1895; 1532 | 69; 363 | 45:1463 | 67:69 | 70458 / 69003 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1890; 1542 | 68; 348 | 45:1474 | 67:68 | 70886 / 69527 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1920; 1506 | 67; 414 | 45:1439 | 67:67 | 69244 / 67950 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1937; 1550 | 102; 387 | 45:1448 | 67:102 | 71994 / 70607 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**magical-dodge / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1943; 1549 | 72; 394 | 45:1477 | 67:72 | 71289 / 69287 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1897; 1536 | 74; 361 | 45:1462 | 67:74 | 70748 / 68954 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1903; 1525 | 65; 378 | 45:1460 | 67:65 | 70055 / 68170 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1970; 1548 | 90; 422 | 45:1458 | 67:90 | 71640 / 69584 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**magical-dodge / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1896; 937 | 42; 959 | 45:895 | 67:42 | 43089 / 42352 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1889; 976 | 52; 913 | 45:924 | 67:52 | 45064 / 44519 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1888; 935 | 47; 953 | 45:888 | 67:47 | 43109 / 42719 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1951; 983 | 57; 968 | 45:926 | 67:57 | 45489 / 44729 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

## Controls, deaths, nonactors and resources

Status events expose target/time/status ID; stunned has no status ID. Neither
event kind exposes a source, so attacker control attribution is unavailable.
Observed summon deaths include orphan transactions and do not prove direct kill
cause. Absence and nonactors are separately counted. Authored control behavior is retained; observed event traces
and later cadence can diverge. MP low-water marks cannot establish a
mana-starved-action percentage; no such rate is claimed.


| Case | Domain | Nonactors / registered | Observed Mage deaths | Absent without death | Status / stunned | MP entry / minimum / final ranges |
| --- | --- | --- | --- | --- | --- | --- |
| neutral | physical | 234/4000 | 4000 | 0 | 4539 / 0 | 187..187 / 165..165 / 187..187 |
| neutral | elemental | 234/4000 | 4000 | 0 | 4539 / 0 | 187..187 / 165..165 / 187..187 |
| physical-resist | physical | 234/4000 | 4000 | 0 | 4468 / 0 | 187..187 / 165..165 / 187..187 |
| physical-resist | elemental | 234/4000 | 4000 | 0 | 4501 / 0 | 187..187 / 165..165 / 187..187 |
| elemental-resist | physical | 234/4000 | 4000 | 0 | 4539 / 0 | 187..187 / 165..165 / 187..187 |
| elemental-resist | elemental | 234/4000 | 4000 | 0 | 4491 / 0 | 187..187 / 165..165 / 187..187 |
| physical-dodge | physical | 235/4000 | 4000 | 0 | 4495 / 0 | 187..187 / 165..165 / 187..187 |
| physical-dodge | elemental | 235/4000 | 4000 | 0 | 4573 / 0 | 187..187 / 165..165 / 187..187 |
| magical-dodge | physical | 234/4000 | 4000 | 0 | 4539 / 0 | 187..187 / 165..165 / 187..187 |
| magical-dodge | elemental | 234/4000 | 4000 | 0 | 4515 / 0 | 187..187 / 165..165 / 187..187 |

## Interpretation and remaining gates

The actual Horror Mage stratum attempt count is0 across all ten cells. Horror-specific damage/probability numbers are static oracles only; these battles provide no observed Mage-versus-Horror hit distribution.

BALANCE-CHECK: CONCERNS. The bounded family isolates enemy resistance/dodge main
effects and whole-battle propagation. All-loss observations cannot establish
clear-speed regression, survival viability, equal-investment per-element ranking
or global balance. Independent GD/LD review streamed all 10,000 recordings,
reconciled Mage damage/counters/literals, all 5,000 P→E pairs and 8,000 controls,
and verified stream hashes. Root's exhaustive checker separately replays HP/MP.

With zero flat mitigation and neutral resistance/dodge pools, physical and
elemental domains produce identical per-seed numerical summaries. Changing bolt
identity alone produces no measured numerical advantage in this neutral fixture.
Relevant 75 resistance changes observed landed Mage values from 45/67 to 11/16.
Against neutral, physical resistance reduces physical-domain Mage effective
damage 75.513%, while elemental resistance reduces elemental-domain Mage effective
damage 75.474%. The large P→E advantage under physical resistance is conditional
on suppressing historical physical bolts; elemental resistance reverses it.
Increasing the relevant dodge pool reduces Mage effective damage 36.850% for
physical bolts and 36.840% for elemental bolts. Observed dodges increase from
1555/7713 neutral to 3771/7578 and 3793/7624 respectively. Physical-domain numerical
summaries remain identical to neutral under elemental resistance or magical dodge.

Whole-battle effects also involve the hero. In the elemental domain, physical
resistance reduces hero effective damage 73.575% while Mage effective damage
changes −0.342%; physical dodge reduces hero effective damage 38.078% while Mage
effective damage changes +0.396%. These small Mage changes and associated DPS
differences reflect altered battle trajectories. Elemental resistance raises
observed hero effective damage 2.651% despite leaving the hero's physical
resistance path unchanged. Source-separated effects are necessary for interpreting
total player output. Every observed Mage attack targets a Flayer; Horror damage
distributions remain unobserved.
No recipe, HP, controls, target or action was changed after observing losses.
Target combos, mixed armies, earned/campaign/holdout/global balance, signature
statuses and the full Mage/D06/P09/P10/private-v1 gates remain open.

## Reproduction and retained evidence

Physical Git revision `cf19757dd5e50f122371e5eda7327f8a79095fbb`; candidate
`ca3e06500732d0494c6ea256c40839347ab40254`. Both capture173 non-test engine/data
files directly from immutable Git blobs, with matching data hashes. Eight shared
helpers, the external driver, config/tool identities and five once-serialized
fixtures bind both domains. Every cell is freshly measured on these revisions;
no old results are relabeled as current evidence. Ten isolated Node cell
processes retain distinct PIDs and actual loaded gameplay identities.

Config/env loading, watch/HMR and client/SSR discovery are disabled, Ajv is
deduplicated and SSR closes in finally. Each cell checks A/A and A/B/A on0/1
without registry resets plus plain/recorded parity on0/999. Bounded determinism
checks and20-row/domain preflights0/7/991/999 are excluded from10,000 measurements.
Exclusive gzip writes honor backpressure and awaited completion. Both readers
settle on failure. Nineteen integrity probes accept2 valid stream/control cases
and reject17 missing/duplicate/reordered/truncated/writer/provenance cases,
including swapped control cases, wrong domains and shared wrong identities.
The full matrix remains external opt-in tooling, excluded from default tests
and production bundles.

The first retained1000-battle cell took5.626s (7.332s wrapper), before the remaining nine serial cells. Raw streams total706,444,085 uncompressed bytes / 37,343,434 gzip bytes. Raw events stream one battle at a time; only lightweight summaries are retained for aggregation.

Root retains source/raw/receipt/deliverable and original failure evidence at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les` for subsequent audits and reviews.

| Artifact | SHA-256 |
| --- | --- |
| mage-asymmetry-source-manifest.json | 2416779d3ed44245804b15434de457dc373f0e090a98bccf325f89cfe0f3fa8f |
| mage-asymmetry-tool.json | b893d11aee5aeb9ee77c8410f7e1889f8c9461ffc60a70ff0014063412583346 |
| mage-asymmetry-fixtures.json | d397b6bec58b7558e19034b9c4d25f1e7adda4a81fb3a4795d6052cb0f929ed2 |
| mage-asymmetry-comparison.json | ccfa94694f8d2aea1d508f13dd2a64c1346a334913f7717c54e851aed4140d5f |
| mage-asymmetry-control-physical.json | dd1fe9471cd9ccd8ec7a227a09f080b1ed1d4412045b40d1de6d5c63174e1b04 |
| mage-asymmetry-control-elemental.json | f402a5774871d7dc0a37591f62c3f82c57a6a9083a9b7bd73c2e3662f1f05e78 |
| mage-asymmetry-integrity.json | c66c28b9adceba93b7555370974a3befaf98789396dff33f01fc371fa79a72b8 |
| mage-asymmetry-domain.mjs | 804277cf8caa9d2f1cf7d1970d3dcabb116522ccc2aae4366871bc13f345ae72 |

`mage-asymmetry-fixtures/`, `mage-asymmetry-raw/`, `mage-asymmetry-pairs/`,
`mage-asymmetry-controls/`, `mage-asymmetry-sources/` and
`commands/mage-asymmetry-*/` retain exact inputs, streams, indexes, immutable
source/helper closures, output/source hashes, PIDs, times and exit receipts.
Root preserves this diagnostic evidence. Only exact inventoried disposable
dist/tmp paths are removed after every reader/process releases. No exhaustive
historical descendant-process claim is made.

Accepted measurement/comparison commands exit0 without `[ERROR]` or WebSocket
server diagnostics. Root initially overlapped the two control aggregation
commands while polling. The elemental attempt reported a WebSocket port error;
root stopped its exact verified task-owned PID3967664 (exit−15), preserved both
attempts in `mage-asymmetry-control-overlap/` and regenerated all8,000 derived
contrasts serially under the `controls-*-serial` command receipts. The10,000
measured battles were not rerun or changed. Original failure/partial artifacts
remain diagnostic evidence and do not supply accepted aggregates. Existing
test budgets and Browserslist/chunk-size/manifest-precache build warnings remain
open in the execution ledger. No engine/data/save/config/SaveCurrent11 or remote
action occurs, and no broader acceptance follows from this bounded audit.
