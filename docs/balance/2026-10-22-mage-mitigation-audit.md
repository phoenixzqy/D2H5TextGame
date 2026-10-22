# Controlled Mage Defense and Magic Resistance audit

BALANCE-CHECK: CONCERNS

This **unearned L26 Necromancer** audit executes the predeclared four-cell enemy
Defense/Magic Resistance matrix in actual historical physical and elemental Git
domains: **8,000 measured battles / 4,000 seed pairs**. Each cell has 1,000 fixed
seeds per domain. All 8,000 battles end in defeat with hero death. Successful TTK
and paired-success effects are null, with zero successful observations. Defeat
duration is time to battle end, not clear speed or evidence of build viability.

Only `(65,23)` retains the authored enemies. The other three cases are synthetic
counterfactuals; all four use an unearned build. This measures whole-battle effects:
Defense also changes hero physical damage, and targets, kills, controls, later
actions and RNG traces can diverge. Outcome differences cannot all be attributed
to Mages. No production engine, data, save or configuration changes occur.

The controlling contract is [D06 v1e](../plans/decisions/D06-mage-elemental-identity-v1.md).
Resistance/dodge asymmetry, combos, mixed armies, earned campaign/holdout/global
balance, signature statuses, full Mage/D06/P09/P10 and private-v1 remain open.

## Frozen source and permitted transforms

The exact Mastery0 source has logical hash
`71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1`
and serialized SHA-256
`af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c`.
It uses Mage6/Skeleton1/Mastery0, ordinary 330 HP / 187 MP / Attack72 / Defense95 /
AS125, authored core15/25/15/25, all125 stat points unspent, spent7/unspent20 skill
points and ordinary recovery. Production allocation/prerequisites are used. Mage
is the sole combo; no equipment, mercenary or preloaded summon is present.

The source enemy wave is authored Act2 Arcane Sanctuary manual first ordinary
wave, ordinal0/pity0, plan seed7/enemy seed991: six L24 Undead Flayers and two L24
Horror Mages. HP in original order is425/395/349/318/393/376/411/303, total2970.
Attack147, AS110/100, full skills and controls remain unchanged. Flayers retain
physical25/poison75 resistance; Horrors retain cold25/lightning25. Both physical
and magical dodge pools remain0.05. Every other field and enemy ID/order remains
byte-equivalent under canonical JSON. Hero, resources, allocation and passive
projection are preserved. Only every enemy's Defense and/or MR is overridden.


| Case | Enemy Defense | Enemy MR | Changed field entries | Classification |
| --- | --- | --- | --- | --- |
| d00-m00 | 0 | 0 | 16 | synthetic / unearned |
| d65-m00 | 65 | 0 | 8 | synthetic / unearned |
| d00-m23 | 0 | 23 | 8 | synthetic / unearned |
| d65-m23 | 65 | 23 | 0 | authored-enemy / unearned build |

The closed Ajv recipe has no custom stat/build/seed knobs. Full expected snapshot,
source hashes and exact old/new field inventory are reconstructed before passing
a legacy-shaped primitive to the accepted recorder. Rehashed semantic forgeries
and shared wrong case/source/transform/fixture metadata are rejected against the
caller's expected identity. The legacy recipe is not a counterfactual public API.

All cases register four fresh Mages at0ms, one22MP payment187→165, Life123 /
Attack45 / Defense10 / AS70 / magic dodge0.09. Only the elemental domain assigns fire/cold/lightning/poison
in order; the historical baseline uses four physical bolts. No automatic status
or DoT is added. Any DoT rejects the direct-only method. No first Mage action may
occur before1940ms; nonactors remain observations rather than missing data.

## Independent static hit oracles

These base45, no-status resolver literals are separate from observed hits.
Crit multiplies before resistance and flat mitigation; flooring/minimum1 follows.
Each pair below means Defense0/65 for physical/fire/poison, or MR0/23 for cold/
lightning. Dodge damage is0; this does not mean the authored dodge pool is0.


| Target | Physical noncrit; crit | Fire noncrit; crit | Poison noncrit; crit | Cold/lightning noncrit; crit |
| --- | --- | --- | --- | --- |
| Flayer | 33/1; 50/1 | 45/1; 67/2 | 11/1; 16/1 | 45/22; 67/44 |
| Horror Mage | 45/1; 67/2 | 45/1; 67/2 | 45/1; 67/2 | 33/10; 50/27 |

## Outcomes and source-separated damage

TTK uses end time for victories only, with nearest-rank p50/p95; defeats/draws are
censored separately. Each domain/cell has0 victories,1000 defeats,0 draws and1000
hero deaths. Successful-TTK count0, p50null and p95null apply to all eight rows.
Every paired-success count is0; faster/equal/slower0/0/0 and mean/p50/p95 effects
are null. No censored defeat is converted into a fabricated kill time.

DPS below is the arithmetic mean of each battle's damage divided by its own
logical duration, not damage divided by the mean duration. Logged damage includes
overkill; effective HP removed clamps each event after intervening heals/HP orbs.
It is not a percentage of a unique enemy HP budget.


| Case | Mean defeat duration ms P → E | Mage effective damage P → E | Mage effective HP/s P → E | Mage logged DPS delta |
| --- | --- | --- | --- | --- |
| d00-m00 | 11233.9600 → 11245.5800 | 203.1470 → 222.1920 | 18.3304 → 20.0305 | +10.28% |
| d65-m00 | 11123.9800 → 11123.9800 | 6.0080 → 140.2620 | 0.5482 → 12.8169 | +2238.14% |
| d00-m23 | 11233.9600 → 11175.5600 | 203.1470 → 155.4180 | 18.3304 → 14.1040 | -23.30% |
| d65-m23 | 11123.9800 → 11123.9800 | 6.0080 → 71.7220 | 0.5482 → 6.5547 | +1095.74% |

Mean hero direct damage by actual source:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| d00-m00 | physical | 297.0000 | 279.2530 | 26.4989 | 24.9423 |
| d00-m00 | elemental | 297.4320 | 276.4820 | 26.5057 | 24.6538 |
| d65-m00 | physical | 16.5380 | 16.5380 | 1.4909 | 1.4909 |
| d65-m00 | elemental | 16.5380 | 16.5380 | 1.4909 | 1.4909 |
| d00-m23 | physical | 297.0000 | 279.2530 | 26.4989 | 24.9423 |
| d00-m23 | elemental | 295.1100 | 280.2890 | 26.4449 | 25.1819 |
| d65-m23 | physical | 16.5380 | 16.5380 | 1.4909 | 1.4909 |
| d65-m23 | elemental | 16.5380 | 16.5380 | 1.4909 | 1.4909 |

Mean Mage direct damage by actual source:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| d00-m00 | physical | 204.2400 | 203.1470 | 18.4262 | 18.3304 |
| d00-m00 | elemental | 225.5560 | 222.1920 | 20.3199 | 20.0305 |
| d65-m00 | physical | 6.0080 | 6.0080 | 0.5482 | 0.5482 |
| d65-m00 | elemental | 140.2620 | 140.2620 | 12.8169 | 12.8169 |
| d00-m23 | physical | 204.2400 | 203.1470 | 18.4262 | 18.3304 |
| d00-m23 | elemental | 155.7440 | 155.4180 | 14.1332 | 14.1040 |
| d65-m23 | physical | 6.0080 | 6.0080 | 0.5482 | 0.5482 |
| d65-m23 | elemental | 71.7220 | 71.7220 | 6.5547 | 6.5547 |

Mean total player direct damage by actual source:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| d00-m00 | physical | 501.2400 | 482.4000 | 44.9252 | 43.2727 |
| d00-m00 | elemental | 522.9880 | 498.6740 | 46.8256 | 44.6843 |
| d65-m00 | physical | 22.5460 | 22.5460 | 2.0391 | 2.0391 |
| d65-m00 | elemental | 156.8000 | 156.8000 | 14.3078 | 14.3078 |
| d00-m23 | physical | 501.2400 | 482.4000 | 44.9252 | 43.2727 |
| d00-m23 | elemental | 450.8540 | 435.7070 | 40.5780 | 39.2859 |
| d65-m23 | physical | 22.5460 | 22.5460 | 2.0391 | 2.0391 |
| d65-m23 | elemental | 88.2600 | 88.2600 | 8.0456 | 8.0456 |

Mean enemy direct damage by actual source:

| Case | Domain | Logged damage | Effective HP removed | Logged DPS | Effective HP/s |
| --- | --- | --- | --- | --- | --- |
| d00-m00 | physical | 933.1280 | 825.4560 | 85.0714 | 75.3873 |
| d00-m00 | elemental | 933.4120 | 825.9170 | 84.9878 | 75.3371 |
| d65-m00 | physical | 929.7920 | 821.9870 | 85.4738 | 75.7035 |
| d65-m00 | elemental | 929.7920 | 821.9870 | 85.4738 | 75.7035 |
| d00-m23 | physical | 933.1280 | 825.4560 | 85.0714 | 75.3873 |
| d00-m23 | elemental | 931.9730 | 824.4630 | 85.3758 | 75.6595 |
| d65-m23 | physical | 929.7920 | 821.9870 | 85.4738 | 75.7035 |
| d65-m23 | elemental | 929.7920 | 821.9870 | 85.4738 | 75.7035 |

## Actual hit strata and denominators

Rows below aggregate all1000 seeds and include each of the four Mage registration
slots × both target species, including zero attempts. Within each cell/domain,
slot1..4 maps to the retained actual summon IDs in raw/pair files. `Landed` is the
crit denominator; attempts are the dodge denominator. Histograms show
`logged amount:count`, split by noncrit and crit; dodge damage is excluded from
histograms. Effective HP is independently replayed from events, never inferred
from logged damage. These observations do not force target/crit coverage or prove
nominal rates from small stratum denominators.

**d00-m00 / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1901; 1530 | 74; 371 | 33:1456 | 50:74 | 51748 / 51442 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1870; 1504 | 76; 366 | 33:1428 | 50:76 | 50924 / 50676 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1854; 1485 | 67; 369 | 33:1418 | 50:67 | 50144 / 49897 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1934; 1514 | 86; 420 | 33:1428 | 50:86 | 51424 / 51132 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d00-m00 / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1899; 1524 | 73; 375 | 45:1451 | 67:73 | 70186 / 69151 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1875; 1508 | 75; 367 | 45:1433 | 67:75 | 69510 / 68083 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1867; 1494 | 68; 373 | 45:1426 | 67:68 | 68726 / 67860 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1937; 1519 | 85; 418 | 11:1434 | 16:85 | 17134 / 17098 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d65-m00 / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1886; 1516 | 76; 370 | 1:1440 | 1:76 | 1516 / 1516 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1855; 1502 | 77; 353 | 1:1425 | 1:77 | 1502 / 1502 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1850; 1478 | 62; 372 | 1:1416 | 1:62 | 1478 / 1478 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1931; 1512 | 84; 419 | 1:1428 | 1:84 | 1512 / 1512 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d65-m00 / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1886; 1516 | 76; 370 | 1:1440 | 2:76 | 1592 / 1592 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1855; 1502 | 77; 353 | 45:1425 | 67:77 | 69284 / 69284 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1850; 1478 | 62; 372 | 45:1416 | 67:62 | 67874 / 67874 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1931; 1512 | 84; 419 | 1:1428 | 1:84 | 1512 / 1512 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d00-m23 / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1901; 1530 | 74; 371 | 33:1456 | 50:74 | 51748 / 51442 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1870; 1504 | 76; 366 | 33:1428 | 50:76 | 50924 / 50676 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1854; 1485 | 67; 369 | 33:1418 | 50:67 | 50144 / 49897 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1934; 1514 | 86; 420 | 33:1428 | 50:86 | 51424 / 51132 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d00-m23 / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1889; 1517 | 74; 372 | 45:1443 | 67:74 | 69893 / 69681 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1859; 1501 | 77; 358 | 22:1424 | 44:77 | 34716 / 34646 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1853; 1484 | 63; 369 | 22:1421 | 44:63 | 34034 / 33990 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1935; 1516 | 85; 419 | 11:1431 | 16:85 | 17101 / 17101 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d65-m23 / physical**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/physical | flayer | 1886; 1516 | 76; 370 | 1:1440 | 1:76 | 1516 / 1516 |
| 1/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/physical | flayer | 1855; 1502 | 77; 353 | 1:1425 | 1:77 | 1502 / 1502 |
| 2/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/physical | flayer | 1850; 1478 | 62; 372 | 1:1416 | 1:62 | 1478 / 1478 |
| 3/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/physical | flayer | 1931; 1512 | 84; 419 | 1:1428 | 1:84 | 1512 / 1512 |
| 4/physical | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

**d65-m23 / elemental**

| Mage slot/type | Target | Attempts; landed | Crits; dodges | Noncrit histogram | Crit histogram | Logged / effective HP |
| --- | --- | --- | --- | --- | --- | --- |
| 1/fire | flayer | 1886; 1516 | 76; 370 | 1:1440 | 2:76 | 1592 / 1592 |
| 1/fire | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 2/cold | flayer | 1855; 1502 | 77; 353 | 22:1425 | 44:77 | 34738 / 34738 |
| 2/cold | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 3/lightning | flayer | 1850; 1478 | 62; 372 | 22:1416 | 44:62 | 33880 / 33880 |
| 3/lightning | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |
| 4/poison | flayer | 1931; 1512 | 84; 419 | 1:1428 | 1:84 | 1512 / 1512 |
| 4/poison | horror-mage | 0; 0 | 0; 0 | none | none | 0 / 0 |

## Controls, summon deaths and resources

Raw status events expose target/time/status ID; stunned has no status ID.
Neither event kind exposes source, so attacker control attribution is unavailable.
Observed Mage death counts include orphan transactions and do not prove a direct
kill cause. Absence and nonactors are separate counts. Authored control behavior is retained; observed event traces
and later cadence can diverge. MP low-water marks do not yield
a mana-starved-action percentage, so that rate is not claimed.


| Case | Domain | No action / registered | Observed Mage deaths | Absent without death | Status / stunned | MP entry / min / final ranges |
| --- | --- | --- | --- | --- | --- | --- |
| d00-m00 | physical | 234/4000 | 4000 | 0 | 4521 / 0 | 187..187 / 165..165 / 187..187 |
| d00-m00 | elemental | 234/4000 | 4000 | 0 | 4504 / 0 | 187..187 / 165..165 / 187..187 |
| d65-m00 | physical | 234/4000 | 4000 | 0 | 4468 / 0 | 187..187 / 165..165 / 187..187 |
| d65-m00 | elemental | 234/4000 | 4000 | 0 | 4468 / 0 | 187..187 / 165..165 / 187..187 |
| d00-m23 | physical | 234/4000 | 4000 | 0 | 4521 / 0 | 187..187 / 165..165 / 187..187 |
| d00-m23 | elemental | 234/4000 | 4000 | 0 | 4501 / 0 | 187..187 / 165..165 / 187..187 |
| d65-m23 | physical | 234/4000 | 4000 | 0 | 4468 / 0 | 187..187 / 165..165 / 187..187 |
| d65-m23 | elemental | 234/4000 | 4000 | 0 | 4468 / 0 | 187..187 / 165..165 / 187..187 |

## Interpretation and remaining gates

All Horror Mage stratum attempt counts are zero across all eight cells. The
Horror-specific numbers above are static resolver oracles only; these battles
provide no observed Mage-versus-Horror hit distribution. No additional actions
or target changes were forced to fill that coverage gap.

BALANCE-CHECK: CONCERNS. This family explains local mitigation effects, including
where the physical baseline is constrained near the one-damage floor, rather
than establishing neutral overall power. All four logged Mage DPS changes exceed the 10% screening threshold in absolute
magnitude, including the -23.30% change at Defense0/MR23. At Defense65 every
landed physical Mage hit deals1. At Defense0/MR0, effective Mage HP/s rises9.27%
while logged DPS rises10.28%, reflecting different overkill. Read relative DPS
drift alongside the absolute before-defeat damage. Removing Defense also increases hero damage; it
can change the fight trajectory and cannot be credited solely to Mages. MR changes
only the cold/lightning mitigation path here, but later whole-battle effects can
propagate to other actors. Target resistances still distinguish Flayers/Horrors in the static oracles.
At Defense65, increasing MR0→23 reduces all observed cold/lightning landed hits
by23: 2,980 such hits account for68.540 less mean elemental Mage damage. Hero
damage and Mage hit counts are equal between those cells. This is a local
Flayer-exposure result, not an observed Horror distribution.

All eight cells lose. Clear-time regression/viability thresholds, equal-investment
per-element ranking and broader balance are unavailable from these data. No
recipe, HP, controls, outcome or Mage actions were adjusted after seeing losses.
This bounded Defense/MR family leaves resistance/dodge, target combos, realistic
mixed armies and earned/campaign/holdout/global acceptance for separate work.

## Reproduction and retained evidence

Physical Git revision `cf19757dd5e50f122371e5eda7327f8a79095fbb`; candidate
`f647b665e5834e7c3bfe915c636a4a7be1c82f78`. Both capture173 non-test engine/data
files directly from immutable Git blobs; data hashes match. The same seven-helper
closure, config/tool identities and four once-serialized fixtures feed both
domains. The authored anchor is freshly measured on this candidate, with no old
measurements relabeled as new-head evidence. Eight isolated Node cell processes
retain actual loaded gameplay identities, distinct PIDs, raw hashes and indexes.

Config/env loading, watch/HMR and client/SSR dependency discovery are disabled;
Ajv is deduplicated. SSR closes in finally. Each cell checks A/A and A/B/A on0/1
without registry resets and plain/recorded parity on0/999. Bounded checks and
16-row/domain preflight0/7/991/999 are excluded from the8000 measurements.
Exclusive gzip writes respect backpressure and await completion. Both pair
readers settle on failures. Twelve integrity probes accept one complete stream
and reject11 missing/duplicate/reordered/truncated/writer/provenance cases,
including shared wrong case/source/override/fixture/driver identities. The full
matrix remains opt-in external tooling, excluded from default tests and bundles.

The first retained1000-battle cell took4.970s (6.549s wrapper), before the remaining seven serial cells. Raw streams total554,538,970 uncompressed bytes / 28,295,413 gzip bytes. Raw events stream one battle at a time; aggregation retains lightweight summaries.

Root retains requested raw/source/receipt/deliverable and original failure evidence at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les` for subsequent audits and reviews.

| Artifact | SHA-256 |
| --- | --- |
| mage-mitigation-source-manifest.json | 6d55c1d12d218b3bf2d38e1be85c31f9a35dcd2d8424f96e6e9bf35423011dcc |
| mage-mitigation-tool.json | b893d11aee5aeb9ee77c8410f7e1889f8c9461ffc60a70ff0014063412583346 |
| mage-mitigation-fixtures.json | a297450fc66eecb179da89bb1995bd7aad2e0c6a3ca019286a7622f2bf2f0cdf |
| mage-mitigation-comparison.json | ca399662469d47183e7b104e37bad152c9b35a7f9547d6d889709fb245c6f2ac |
| mage-mitigation-integrity.json | d749a9ef2aa8a4489f7217a330279bb17dac60fe638270b70b41c95a55dbff58 |
| mage-mitigation-domain.mjs | aa9bd63cce99a4a278036d25a4059ea0ed7e70c2e5be3790e06da0a356c36bd8 |

`mage-mitigation-fixtures/`, `mage-mitigation-raw/`, `mage-mitigation-pairs/`,
`mage-mitigation-sources/` and `commands/mage-mitigation-*/` retain exact inputs,
streams, indexes, immutable source/helper closures, stdout/stderr, source/output
hashes, PIDs, times and exit receipts. Root preserves this diagnostic evidence.
Only exact inventoried disposable dist/tmp files are removed after all readers
and processes release. No exhaustive historical descendant-process claim is made.

All measurement/comparison commands exit0 without `[ERROR]` diagnostics. Existing
test budgets and Browserslist/chunk-size/manifest-precache build warnings remain
open in the execution ledger. No remote action or broader sign-off follows.
