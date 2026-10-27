# P15-S01 — Earned-gear Sorceress Act V screen

Status: diagnostic screen complete; both frozen candidates fail this area.
This establishes neither two viable Sorceress builds nor fourteen-build acceptance.
[Compact metrics](fixtures/p15-act5-sorceress-screen/metrics.json) retain every
first-repetition attempt, with raw-report hashes and source provenance.

## Input and native preparation

Integration base: `276101d4f5b9fe2ff4183d0079a23c4eb22c1e65`.
Node `v24.21.0`, Vitest `1.6.1`. The frozen policy hash is
`aad88b804120c178f7b689c50fb96313715069d676a634fd447b61cc736b2194`.
The source is the genuine [earned endgame4](p18-earned-endgame4.md) fixture:

- Raw SHA256: `7fc4a5495355542b07a0cc05bb265ee0502d9e6ffd968938902203acf5da5007`.
- Gzip SHA256: `73c79b289f9c010ee5b75813aa14867f4cf7616e2847ac52245b7fb9e3bd70f6`.
- L35, XP192311, no unspent stat/skill points, 48 allocated skills,
  27633 unique equipment and 25859 wishstones; all29 campaign areas cleared.
- Normal next431/Nightmare0; endgame attempt4, Ashen3/Glacial1,
  achievement claimed and Riftwalker selected. The equipped cap retains its ruby.

Each attempt restores a separate service-store copy, moves to the already
unlocked Act V town, pays Malah's native five-wishstone skill reset, refunds48
points and allocates exactly48 through public production APIs. Equipment,
stats, mercenary, materials, quest state and campaign ancestry are conserved.
The saved120HP/102MP remain unchanged through preparation. Production admission
to Bloody Foothills, at challenge ordinal431 with the declared combat seed,
refills the hero to635HP/474MP. The harness adds no healing or carry writes.
It restores the caller's stores, methods, clock, hydration state and elite pity.
Process-global item allocation is deliberately not reset.

| Candidate | Allocated ranks | Priority |
| --- | --- | --- |
| Cold | Ice Bolt1, Ice Blast1, Glacial Spike1, Blizzard4, Frozen Orb20, Cold Mastery20, Warmth1 | Frozen Orb → Blizzard → Ice Blast |
| Fire | Fire Bolt1, Inferno1, Blaze1, Fire Wall1, Fire Ball20, Meteor3, Fire Mastery20, Warmth1 | Meteor → Fire Ball |

These are diagnostic mature-gear candidates. L35 versus native L56–58 enemies
is not a matched-level viability fixture. No diagnostic save becomes a genuine
successor, and no consumed genuine action is replayed.

## All outcomes

Seeds1–8 each run twice for both candidates:32 attempts,64 settled waves.
The second repetition checks reproducibility; the independent denominator is
eight seeds per build, not16. All comparisons preserve exact preparation and raw
combat recordings. Reward comparison omits only top-level new `Item.id`, whose
process-global suffix advances between attempts; raw identities remain retained.

| Candidate / wave | Native role / initial enemies | Victories / started | Duration in seconds, min / median / max | Result |
| --- | --- | --- | --- | --- |
| Cold W1 | Trash /10 at L56 | 8/8 | 19.5 /24.25 /26.5 | Native next-wave |
| Cold W2 | Trash /11 at L57, plus native summons | 8/8 | 16 /21.833333 /30.166667 | Native next-wave |
| Cold W3 | Elite /12 at L58 | 0/8 | All60, failed duration | Engine draw; native defeat;3–7 enemies alive |
| Fire W1 | Trash /10 at L56 | 0/8 | All60, failed duration | Engine draw; native defeat;2–4 enemies alive |

Full six-wave clears: Cold0/8, Fire0/8. No hero dies. Boss waves are unreached
for both candidates; Fire never exercises elites. Draws retain `winner: null`
and native `defeat` separately, with no victory-only TTK. Unreached waves are
explicitly counted rather than represented as trials.

Cold W3 begins with2–53/474MP and reaches zero in every seed. Fire W1 starts
at474MP and also reaches zero in every seed. This is resource-pressure evidence,
not proof that resource supply alone causes either failure. Target resistance,
ordinary Defense, damage and priority must be separated in later controls.

Each Cold attempt earns11870 hero XP,8902 Holy Freeze mercenary XP,7–9 items
and5656–6004 rune shards from its two victories; occasional Nef or flawed diamond
drops remain in the metrics/raw records. Fire earns no XP, items, materials or
currency. Failed waves add no rewards or clear credit. No ancestral items are
removed. This is diagnostic accounting, not an economy-per-hour certification.

## Harness defects and validation scope

The original benchmark and32-attempt screen are preserved. Independent source
review found two outcome/publication defects before integration:

- [BUG324](../../../production/bugs/BUG-324-require-living-hero-for-screen-victory.md):
  an engine team win could outlive the hero and be rejected by native settlement.
  The corrected classifier requires the original hero alive and accepted native
  settlement; a complete clear also requires terminal native `victory`.
- [BUG325](../../../production/bugs/BUG-325-validate-screen-source-before-completion.md):
  completion was published before source validation. The finalizer now validates
  first, publishes stopped observations on failure, preserves execution and source
  errors together and then propagates them. An exclusive external fsynced journal
  records each settled wave before final report publication.

Four causal regression failures reproduced the actual defects; a fifth initial
failure incorrectly expected engine `'draw'` instead of `null` and was corrected
as a test assumption. The corrected ten contract cases pass. The final focused
run passes11/11 across three files, including a four-attempt native benchmark.
The default repository lint excludes this simulation directory: full lint passes,
and explicit `eslint --no-ignore` over all six P15 TypeScript files also passes.

The final32-attempt screen takes86.161228256 execution seconds and passes11/11
focused cases. Its64 journal entries exactly match all report waves. Original
and final raw combat recordings and semantic rewards are equal for every trial.
All retained original/final source snapshots match their report manifests, and
both genuine fixture hashes remain exact. The original source's Git dirty-list
metadata changes only because the two bug reports were created; all collected
runtime/data/tool bytes remain exact. This advisory difference is disclosed,
not presented as byte-identical Git metadata.

Three subsequent lint-only edits affect the harness and two test files. The
post-lint focused run passes11/11; its seed1 benchmark reproduces all original
combat recordings and semantic rewards. Its full collected source manifest
matches the bytes at that audit, and source identity is exact before/after that run,
including advisory metadata. No extra eight-seed run is needed to validate
those lint-only changes. Final full typecheck passes in136.741294421s after the
lint edits. Independent final bounded source/artifact review APPROVE reports no
findings and releases readers; it performs no independent runtime QA.

Original full-unit handle13090 is terminal PASS:944 files,19980 passing tests
and two existing skips,1154.31s Vitest duration/1155.998594496s wrapper wall.
Its initial six-file source capture precedes the three lint-only edits; a separate
Blood Raven reproduction test was added after discovery, without changing
production code/data. The final focused/type/lint checks cover the lint edits;
the Blood Raven reproduction is reported separately. This full result is not a
frozen check of the final repository tree.

To reproduce the screen, choose a new absolute report path outside the repository
and run `P15_SCREEN_STAGE=screen P15_SCREEN_REPORT_PATH=/owned/task/new-screen.json
npx vitest run --project sim-contracts tests/sim/production/p15-build-screen-measure.test.ts`.
The default stage is the four-attempt seed1 benchmark. Both the report and its
`.waves.jsonl` journal use exclusive creation; preserve failures instead of
overwriting an earlier result.

## Next causal measurement

Capture the actual immutable `engineInput` from native staging: unchanged Cold
W1/W2 prefix to W3, and Fire admission to W1. First prove native/plain/recorded
and A/A parity. Freeze these pure-combat counterfactuals before measuring:

- Cold: baseline, full initial mana only, hero125MP/s recovery only.
- Fire: baseline, hero125MP/s recovery only, Blood Lord fire resistance0 only,
  both recovery and resistance interventions.

The125MP/s value is a diagnostic ceiling derived from50MP maximum relevant cost
and400ms minimum action period, not proposed production tuning. Preserve every
other input/RNG field; discard fractional recovery carry at full mana. Report
remaining enemy HP, all outcomes, victory-only TTK, casts/basic attacks, mana
flows, one-damage fire-hit frequency and whether the ceiling covers each action.
Never settle rewards, export or promote these pure-combat copies. Pilot seed1,
then the same eight frozen seeds; do not retune thresholds or hunt seeds.

## Evidence ownership

Root retains these exact evidence files through full-v1 and independent
review consumers, and owns their removal after those consumers finish:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-p15-screen-v0nn_5xd.evidence.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-p15-screen-v0nn_5xd.manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-p15-screen-v0nn_5xd.retention.json`

All86 archive members/168152615 raw bytes were read back and SHA256-verified;
original files were rehashed before exactly86 files/eight directories including
the task root were removed. The unused empty retainer directory was also removed.
Both full-unit PIDs were absent and all review readers released before cleanup.
Cleanup records remaining[]/failures[]; shared caches and the genuine save remain
intact. Archive SHA256 `89c2233cf2a030e0bd094f06a84a0df0f9b5d2be7c8d8cf52b1ef7060a2e5bcf`;
manifest SHA256 `0d15fb9002baf2f73982d2c97ad6d75d0ce9d29d8388cb9ad99d6841b144c093`.
The archived handoff predates the full terminal result; the retained result/log
and this document supersede its liveness statement. No independent runtime QA
or balance certification is claimed. Preserve the registered umbrella worktree;
full C2–C4/G0–G7 acceptance stays open.
