# Cobra damage-based HP/MP recovery — native checkpoint

Status: Native implementation and automated checks verified; dedicated public
recovery/playback/persistence and earned acceptance pending. BUG304 stays Open.
Parent checkpoint: `a21c396ee721adf0e005938df1b29be9a1f4903a`.

## Decision and behavior

The user chose **“choose cheaper solution”**. The
[D05 amendment](../decisions/D05-assassin-martial-charges-v1.md#cobra-recovery-amendment--2026-10-27)
keeps monsters mana-free and redesigns local caster recovery. Adding monster
mana pools would require new data, schema, factory and resource policy.

Cobra uses the existing paid 1–3 charge stacks and 0.1-per-stack HP and MP
coefficients. The basis is actual hostile HP removed after mitigation and
absorption, excluding overkill. HP and MP each recover
`max(0, min(fresh missing capacity, floor(HP removed × coefficient × stacks)))`.
Enemy MP is neither read nor debited. A killing hit qualifies if the actual
caster survives. Reflection, death and orb settlement precede recovery; Cobra
never revives a dead caster. Paid-copy ownership, consumption/release order,
Mana Burn clearing, costs, cooldowns and all other charge behavior remain.

The schema edit changes only its description; localized zh-CN/en copy now
describes recovery. Coefficients, schema constraints, monster data and save
version remain intact.

## Causal proof and actual validation

The unchanged primary regression allocates real paid Cobra authority and passes
an unmodified authored factory zombie with zero MP to the native simulator.
Its constructed hero resources and observation timing are explicitly declared.
All fixture assertions pass on the baseline. Its sole new-policy assertion at
169:20 fails with no caster MP credit instead of the expected absolute 4 MP.
After the reviewed implementation, both primary cases pass unchanged.

| Check | Native exit | Result | Elapsed | Raw summary |
| --- | --- | --- | --- | --- |
| Primary baseline RED | 1 | 1 passed, 1 failed / 1 files | 10.103s | `primary-red-first-summary.json` |
| Primary amended GREEN | 0 | 2 passed / 1 files | 9.569s | `primary-green-second-summary.json` |
| Focused regression | 0 | 282 passed / 13 files | 42.384s | `focused-second-summary.json` |
| Engine | 0 | 10,736 passed / 401 files | 331.811s | `engine-second-summary.json` |
| Full unit | 0 | 21,187 passed, 2 skipped / 989 files | 896.543s | `full-first-summary.json` |
| TypeScript | 0 | pass | 227.974s | `typecheck-second-summary.json` |
| Lint | 0 | pass | 350.287s | `lint-second-summary.json` |
| Production build (before two test typing fixes) | 0 | pass | 27.840s | `build-first-summary.json` |

Each run preserves its before/after inputs. Final focused/engine/full/types/lint
use 5336 unchanged files at snapshot
`063597366ad3506334ba2698776e469dabcdca515b0fc2a7a55e2b05ce8f3e63`. Full command is unfiltered `npm test` with default
and JSON reporters; engine uses `npm run test:engine`. No discovery, worker,
assertion or timeout setting was weakened. Existing skipped tests remain skips.

The production build executed at
`7d70b9b0405ed66a831a4f693196d54251ff5b4f8f433d733ab3dbd3118a9a3c`. Exactly two test files subsequently
changed: an authored-status precondition guard in the display test and equivalent
split event filters in the native test for TypeScript narrowing. Production,
data, locale, configuration and dependency bytes are identical. This is the
prior production build with an exact test-only delta, not a fresh final-source
build. Schema validation uses real loader/Ajv tests; `validate:data` and `sim`
scripts do not exist.

Retained failures: an orchestration guard first rejected the application before
any write because it searched serialized JSON instead of the structured failure
location. The next run was mislabeled `primary-green-first` but executed the
unchanged baseline and failed identically; it receives no GREEN credit.
The first typecheck exited 2 with three typing errors in two new tests. The
exact two test typing fixes were independently approved, preserved all
assertions and made the fresh typecheck pass. Original outputs remain intact.

## Review, binding and retention

Root-owned raw logs, JSON reports, before/after input maps, source manifests,
RED/failure records and independent reviews remain under:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x`

Independent exact native RED/GREEN/source review:
`cobra-native-evidence-independent-review.json`, SHA256
`465e03776f79f925d7d16851b4a074dfbd23676e039ceb0c65e9af660cefbb39`.
Exact two-test typing review:
`cobra-test-type-fixes/independent-review.json`, SHA256
`0f20dba4f3c334c1048b62830e67f5e24a5a1677f3d980b9621ab6c54c82d5ab`.
Final documentation/inventory review and local commit are recorded in the root
retained packet. Native summary bindings:

- `primary-red-first-summary.json`: `d9fd03b348666a21a57d2ccbd6968048fc916f9d88561ba7796416b41ed70325`
- `primary-green-first-summary.json`: `cf40427ed0194c17b2b99d9cd30623eb88656e13e2f5dfe2fb69236a7a2a463c`
- `primary-green-second-summary.json`: `1054e6682a0df9f399ee10619e149fd86582ef0fb23bceb04021af762bfdee08`
- `focused-second-summary.json`: `85cb0f4a1fb16e585319e097115f9211a7e0c497ca1a724f1bae05e266912765`
- `typecheck-second-summary.json`: `77646c25b2683e0ad0f238ec0953a9b575d3020e2ae1c81020a2a718e62a10d8`
- `lint-second-summary.json`: `e4bdb6cee4aef0032b878c2399c75e0187f2da44defa0f191238003052b89950`
- `engine-second-summary.json`: `c5340ead652dff36a012ecd37121cbbf5b60ed834a32aca1ecd13d7aa8d3260b`
- `full-first-summary.json`: `86d41ec0a86beaa746e16dcdda25897139fa1497eee83a0c1c483380867e73a5`
- `build-first-summary.json`: `26493a80292e95038b58dfeb93d14d664899a732648e1de86878af30235305f8`

Root owns retention through unfinished full-v1 and independent evidence
consumers, then verified removal. Disposable build output is removed only after
all consumers release it; its cleanup receipt remains with this packet.

## Limits

[BUG304](../../../production/bugs/BUG-304-cobra-mana-free-monster-contract.md)
remains Open for dedicated production public zero-enemy-MP recovery, playback
and ordinary save/Continue/import/export evidence. Native replay equality and
constructed settlement/copy/death/absorption controls do not replace that gate.
The skill inventory remains 212 bounded plus one unverified Cobra. Earned
sustain/balance/pacing, campaign, independent full gates, CI and private-v1
acceptance remain pending. The separate terminated H3 blank-launch attempt is
not retried and supplies no Cobra gameplay result.
