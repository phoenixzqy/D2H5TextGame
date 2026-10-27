# BUG-327 — Execute Blood Raven's authored trainee reward

Status: Fixed locally; authored trainee Claim and exact persistence verified.
Severity: High — the authored quest reward cannot be claimed.
Owner: root quest integrator / frontend-dev transaction boundary.
Affected systems: Claim preflight, mercenary ownership/XP, rollback and persistence.

## Reproduction

Integration base `276101d4f5b9fe2ff4183d0079a23c4eb22c1e65`.
Node24.21.0 / Vitest1.6.1 / jsdom. No combat RNG, viewport or locale dependency.
This constructed completed-quest state isolates Claim; native earning is tested
separately by BUG326 and ordinary browser acceptance remains required.

1. Construct the actual Blood Raven quest as completed/unclaimed with both
   authored objective flags true, a real player and hydration ready.
2. Read its authored bundle:1500XP and `mercenaryUnlock: mercs/act1-rogue-trainee`.
3. Call the shared `claimQuestReward` boundary.

Expected under the independently reviewed P14 repair plan: grant1500 hero XP,
1125XP to the previously fielded mercenary when present, ensure the actual
authored level3 trainee is owned, preserve fielded selection and existing
trainee instances/progress/equipment, then mark claimed exactly once. Preserve
whole-bundle preflight, reentrancy guard and participating rollback.
Actual: returns `unsupported-rewards` before any grant because the authored
`mercenaryUnlock` reward has no executable branch.

## Evidence and bounds

The external causal suite records11 failures/four passing refusal controls
before production edits. It covers real-definition creation, missing/unknown
identity, already-owned canonical/suffixed instances, previously fielded XP,
mixed unsupported bundles, nested Claims, mutate-then-throw publication failures,
explicit restoration failure and the exported save bundle. Source snapshots,
hashes, original tests/config/log and receipt remain in the root-owned task
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-raven-objective-py73of_m`.
The reviewed policy is in `docs/plans/p14-act1-quest-repairs.md`.

Use the real definition/factory and `addMerc`, preserving the existing selection;
`hireMerc` automatically fields the recruit and is unsuitable unchanged.
Recognize existing suffixed identity without deleting or merging historical
instances. Unknown identities and unsupported mixed bundles still refuse before
writes. No free gacha shards/pity/upgrades, combat changes, save-version bump,
historical quest credit, genuine save promotion or external publication.

## Correction and verification

The bounded repair passes488 focused tests/seven files, full20001 tests/946
files with two existing opt-in skips, types, lint and production build. Four
ordinary en/zh-CN mobile/desktop browser cases earn the native kill, perform
ordered Talk and explicit Claim, and preserve exact Save-close-Continue state.
Independent final source/test review approves. Constructed strength proves
functionality rather than earned balance or pacing.

Original failures and final receipts are retained after verified archive/readback
and exact disposable cleanup; see
[repair evidence](../../docs/plans/evidence/p14-blood-raven-quest-repair.md).
The raw root mentioned above is now absent; its sibling `.evidence.tar.gz`,
`.manifest.json` and `.retention.json` are root-owned through independent/full-v1
consumers. No historical credit, genuine save promotion or external publication.
