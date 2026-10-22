# Unearned near-level Mage Mastery audit

BALANCE-CHECK: CONCERNS

This paired **unearned L26 Necromancer versus authored L24 Arcane Sanctuary**
audit holds Mage 6 and Skeleton 1 fixed at Mastery 0/1/19/20. It executes 1,000
fixed combat seeds per cell in each immutable domain: **8,000 measured battles**
and 4,000 pairs. It measures the actual historical physical baseline and the
elemental engine from Git objects. No runtime patch stands in for the baseline.

Every measured battle is a defeat. Successful TTK and paired-success deltas are
therefore null, with zero successful observations. Defeat duration measures time
to battle end, not clear speed. Damage before defeat remains useful local
evidence but cannot establish survival, neutral overall power or global balance.

No production engine, data, save or configuration changes occur in this increment.
The contract remains [D06 v1e](../plans/decisions/D06-mage-elemental-identity-v1.md).
Other families, earned progression, campaign/holdout/global balance, signature
statuses, full Mage/D06/P09/P10 and private-v1 acceptance remain open.

## Closed recipe and literal boundaries

All cells use authored core 15/25/15/25, all 125 stat points unspent, ordinary
330 HP / 187 MP, Attack 72 / Defense 95 / AS 125 and recovery. The L26 skill pool is 27:
spent 7/8/26/27 and unspent 20/19/1/0. Exact canonical nodes and prerequisites are
allocated through production `allocatePoint`. Mastery uses production
`composeSkeletonMastery`, bound to the hero owner, omitted at 0. Learned rank
alone does not activate it. Mastery and Skeleton are unslotted; Mage is the only
combo skill. No equipment, mercenary or preloaded summon is present; explicit
unarmed equipment and ordinary hero basic attacks remain enabled.

Four inputs are generated and serialized once, then supplied unchanged to both
domains. Each freshly registers cap 4 Mages at time 0 for one 22 MP batch payment,
187→165. Only the elemental domain assigns fire/cold/lightning/poison in that
order; the physical baseline uses physical bolts. Attack speed 70 and magic dodge 0.09
remain unchanged. Fresh creation stats are checked exactly once:

| Mastery | Life | Attack | Defense | Floored bolt base |
| --- | --- | --- | --- | --- |
| 0 | 123.0 | 45.0 | 10.0 | 45 |
| 1 | 127.92 | 45.9 | 10.1 | 45 |
| 19 | 216.48 | 62.099999999999994 | 11.899999999999999 | 62 |
| 20 | 221.4 | 62.99999999999999 | 12.0 | 62 |

Mastery 20 stores Attack **62.99999999999999**, which floors to 62. There is no
epsilon, rounding or arithmetic reordering. Static no-status/noncrit resolver
oracles are separate from actual battle hits: cold/lightning against a Flayer
is 22→39, against a Horror Mage 10→23 (Mastery0→20); fire/poison is1 here. Actual
hits may dodge, crit, encounter controls or never occur.

All cells reuse authored Act2 Arcane Sanctuary manual wave 0, challengeOrdinal 0,
pity 0, plan seed 7 and enemy-generation seed 991. AreaLevel 23 plus authored bonus 1
produces L24. In wave order the HP values are 425/395/349/318/393/376/411/303
(2,970 total): six Undead Flayers and two Horror Mages. All have Attack 147,
Defense 65 / MR 23 and both dodge pools 0.05. Flayers have physical 25 / poison 75
resistance and AS 110; Horror Mages have cold/lightning 25 and AS 100. No act-only
resistance multiplier, target HP injection, reroll, prolonged fight or forced
summon action is used. The authored skills produce direct/control events; any
DoT causes the direct-only meter to reject the stream.

## Outcomes, censoring and duration

TTK is the logical end timestamp for victories only. Defeats/draws are censored
and counted separately. Nearest-rank p50/p95 are null when no victory exists;
no defeat is converted into a 60-second kill. Each row below has 1,000 battles.
Values separated by an arrow are physical → elemental.

| Mastery | Victory / defeat / draw P → E | Hero deaths P → E | Successful TTK n; p50 / p95 ms P → E | Mean defeat duration ms P → E |
| --- | --- | --- | --- | --- |
| 0 | 0 / 1000 / 0 → 0 / 1000 / 0 | 1000 → 1000 | 0; null / null → 0; null / null | 11123.9800 → 11123.9800 |
| 1 | 0 / 1000 / 0 → 0 / 1000 / 0 | 1000 → 1000 | 0; null / null → 0; null / null | 11398.9600 → 11398.9600 |
| 19 | 0 / 1000 / 0 → 0 / 1000 / 0 | 1000 → 1000 | 0; null / null → 0; null / null | 14441.1600 → 14453.0600 |
| 20 | 0 / 1000 / 0 → 0 / 1000 / 0 | 1000 → 1000 | 0; null / null → 0; null / null | 14537.0200 → 14562.5200 |

Every paired-success denominator is 0: faster/equal/slower are 0/0/0, and mean,
p50 and p95 paired successful-duration deltas are null in all four cells.

## Damage before defeat

Mean DPS is the arithmetic mean of per-battle damage divided by that battle
duration (1,000 observations per cell/domain). Logged damage includes overkill;
effective HP removed clamps each actual source event to remaining HP after
intervening heals/HP orbs. Neither measure is a unique HP-budget percentage.

| Mastery | Mean Mage logged damage P → E | Mean Mage effective HP P → E | Mean Mage logged DPS P → E (delta) | Mean Mage effective HP/s P → E (delta) |
| --- | --- | --- | --- | --- |
| 0 | 6.0080 → 71.7220 | 6.0080 → 71.7220 | 0.5482 → 6.5547 (+1095.74%) | 0.5482 → 6.5547 (+1095.74%) |
| 1 | 6.4810 → 77.5530 | 6.4810 → 77.5530 | 0.5760 → 6.9018 (+1098.18%) | 0.5760 → 6.9018 (+1098.18%) |
| 19 | 13.7390 → 252.7980 | 13.7390 → 252.5700 | 0.9629 → 17.6790 (+1736.05%) | 0.9629 → 17.6636 (+1734.45%) |
| 20 | 14.0910 → 259.3940 | 14.0910 → 259.1160 | 0.9806 → 17.9984 (+1735.49%) | 0.9806 → 17.9797 (+1733.59%) |

## Controls, deaths and non-acting summons

Raw `status` events expose target, time and status ID. `stunned` events expose
target and time, with no status ID. Source is unavailable for both kinds, so
they cannot attribute control to a particular attacker. Observed
Mage death events include owner-orphan transactions; their count does not prove
a direct-kill cause. Final absence is counted independently. `No action` means
no observed action before battle end, not a failed measurement.

| Mastery | No action / registered P → E | Observed Mage death events P → E | Final absent (without death) P → E | Status / stunned events P → E | Status targets Mage / hero P → E |
| --- | --- | --- | --- | --- | --- |
| 0 | 234/4000 → 234/4000 | 4000 → 4000 | 0 (0) → 0 (0) | 4468 / 0 → 4468 / 0 | 1357 / 3111 → 1357 / 3111 |
| 1 | 181/4000 → 181/4000 | 4000 → 4000 | 0 (0) → 0 (0) | 4596 / 0 → 4596 / 0 | 1459 / 3137 → 1459 / 3137 |
| 19 | 3/4000 → 3/4000 | 4000 → 4000 | 0 (0) → 0 (0) | 5914 / 0 → 5924 / 0 | 2798 / 3116 → 2808 / 3116 |
| 20 | 1/4000 → 1/4000 | 4000 → 4000 | 0 (0) → 0 (0) | 5982 / 0 → 5987 / 0 | 2877 / 3105 → 2883 / 3104 |

All observed statuses are chill. All final Mage rows are present with 0 life.
Controls can delay actions; pairing therefore requires identical preparation,
inputs and registration IDs without demanding identical later action timing.
No first action is allowed before 1940 ms. Actual observed timing is:

| Mastery | First-action min..max; delayed count P → E | Later action interval min..max ms P → E |
| --- | --- | --- |
| 0 | 1940..1940; 0 → 1940..1940; 0 | 1940..1985.1546391752577 → 1940..1985.1546391752577 |
| 1 | 1940..1940; 0 → 1940..1940; 0 | 1940..1985.1546391752577 → 1940..1985.1546391752577 |
| 19 | 1940..1940; 0 → 1940..1940; 0 | 1940..1986.3917525773195 → 1940..1986.3917525773195 |
| 20 | 1940..1940; 0 → 1940..1940; 0 | 1940..1986.3917525773195 → 1940..1986.3917525773195 |

## Rate denominators and resources

Crits use landed direct events; dodges use all direct attempts. These aggregate
event denominators are observations, not proof of exact nominal-rate convergence.
MP entry/minimum/final columns are the min..max of each per-battle measure.
No mana-starved-action percentage is inferred from MP low-water marks.

| Mastery | Physical crits / landed; dodges / attempts | Elemental crits / landed; dodges / attempts | MP entry / minimum / final P → E |
| --- | --- | --- | --- |
| 0 | 299 / 6008; 1514 / 7522 | 299 / 6008; 1514 / 7522 | 187..187 / 165..165 / 187..187 → 187..187 / 165..165 / 187..187 |
| 1 | 330 / 6481; 1637 / 8118 | 330 / 6481; 1637 / 8118 | 187..187 / 165..165 / 187..187 → 187..187 / 165..165 / 187..187 |
| 19 | 578 / 12005; 3016 / 15021 | 580 / 12012; 3014 / 15026 | 187..187 / 165..165 / 187..187 → 187..187 / 165..165 / 187..187 |
| 20 | 600 / 12291; 3081 / 15372 | 602 / 12297; 3081 / 15378 | 187..187 / 165..165 / 187..187 → 187..187 / 165..165 / 187..187 |

## Design interpretation and limits

BALANCE-CHECK: CONCERNS. Logged Mage DPS drift exceeds the 10% screening threshold
at Mastery 0, 1, 19, 20. There is no successful-TTK
comparison: all 8,000 battles lose. Mean defeat duration must not be interpreted
as a 15% clear-time acceptance test. The ordinary bare build is not shown viable
in this wave. Damage changes reveal a local Mastery/mitigation interaction under
the fixed encounter, without an equal-investment per-element claim or a reason
to retune production data from this experiment alone.

The physical baseline is heavily constrained by mitigation. At Mastery 0/1,
every landed physical hit deals 1. At Mastery 19/20, noncritical hits deal 1 and
critical hits 4; their aggregate damage matches those literal values. Read the
large relative DPS changes alongside the absolute damage values. Mastery 19/20
both floor bolt base to 62: different whole-battle totals do not establish a
new per-hit step at 20 because life/Defense and later trajectories also differ.

This completes only the approved Mastery boundary family. Defense/MR contrasts,
resistance/dodge asymmetry, status/combo families, realistic mixed armies and
earned campaign/holdout evidence remain separate work. Broader acceptance stays
open; no loss is hidden and no recipe is adjusted to secure wins.

## Reproduction and retained evidence

Physical revision `cf19757dd5e50f122371e5eda7327f8a79095fbb`; elemental revision
`94ef958a6e8da2fb5aaf61c2a7c3d9ed4f46c634`. Each domain captures 173 non-test
engine/data files directly from Git blobs. Only `src/engine/combat/combat.ts`
differs; data hashes match. Identical helper closure includes Mastery fixture/
runner, balance fixture/runner and `fixture.ts`, plus both tsconfigs. Loaded
gameplay paths are verified against the corresponding immutable source domain.
Eight cells use eight distinct Node processes, each with retained raw gzip hash,
count, bytes and expected domain/driver/tool/frozen-fixture identity.

Config/env loading, watch/HMR and client/SSR dependency discovery are disabled;
Ajv is deduplicated. Every SSR server closes in `finally`. Each cell checks A/A,
A/B/A on seeds 0/1 with no registry reset and plain/recorded parity on 0/999.
The 8,000 measured recordings exclude those bounded checks and the tiny
seeds 0/7/991/999 preflights. Both 16-row preflights returned defeats and controls.

Exclusive gzip writes respect backpressure and await completion before indexing.
Both pair readers settle, including failures. Ten retained integrity probes
accept a complete stream and reject missing/duplicate/reordered seeds, one-sided
provenance, shared wrong rank/fixture/driver, truncated gzip and failed writer.
These are tool contract probes, not balance measurements. The full audit is
opt-in external tooling, excluded from production bundles and default unit runs.

The first retained 1,000-battle cell took 3.213s
(4.893s wrapper), before the remaining seven cells.
Raw streams total 602,870,265 uncompressed
bytes and 28,385,337 gzip bytes. Events stream one
battle at a time; only lightweight summaries are retained for aggregation.

Root retains evidence at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les` for subsequent audits and reviews:

| Artifact | SHA-256 |
| --- | --- |
| mage-mastery-source-manifest.json | 07d4231913ae97ea7d67de34994ab63836e4f6b8226eab47615f35eb65366035 |
| mage-mastery-tool.json | b893d11aee5aeb9ee77c8410f7e1889f8c9461ffc60a70ff0014063412583346 |
| mage-mastery-fixtures.json | 34dc4d60ef09227546b1d6c32f8297c054e3e23a6a79ad336f8d0e94e827a130 |
| mage-mastery-comparison.json | 6c1c726c800bbd07aa28da3cb9baebe1efea4db463e4505a2a73f09f4028d364 |
| mage-mastery-integrity.json | ec834135d628ff95daa3b2a1475f62ce5e48d2f29771d8024c95798df51c1cbf |
| mage-mastery-domain.mjs | d826086fb72ab9130201a74f36e55b06f625c798e9ce98d17bb1075c089ccdf1 |

`mage-mastery-fixtures/` holds four frozen inputs; `mage-mastery-raw/` holds eight
raw gzip streams and indexes; `mage-mastery-pairs/` holds four paired-summary
streams. `mage-mastery-sources/` retains both immutable source/helper closures.
`commands/mage-mastery-*/` retains source snapshots, original RED/GREEN stages,
stdout/stderr, PID and source/output hash/timing/exit receipts. Root retains
these requested deliverables and diagnostic evidence. Only exact inventoried
disposable `dist/` and `tmp/` are removed after readers/processes release.

All eight measurement commands and the comparison exit 0 with no `[ERROR]`
diagnostic. Existing full-suite budget and build warnings remain tracked in the
execution ledger. No remote action or broader sign-off follows from this report.
