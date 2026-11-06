# BUG-619 — Restore Poison Explosion native fixture preconditions

2026-11-03. Severity: Medium (local regression fixtures). Status: fixed locally; affected checks pass.
Owner: root, native store QA. Baseline HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus retained feat/playable-foundations worktree changes. Node/Vitest jsdom UI;
browser/viewport/locale N/A. Synthetic unearned Necromancer18, seed7,
Blood Moor wave0. This is a store integration fixture, not earned campaign replay.

## Reproduction and evidence

Run only `uses a real first kill before the first native Poison Explosion` and
`replays unlocked with current eligible rank and captured fractional resources`
in src/stores/poison-explosion-native.test.ts. Expected first death4500ms and
positive captured Mana fraction after opening wave. Actual3000ms and zero carry.
Both fail with the exact two pre-CE-growth production files restored from their
retained byte backup; candidate source is byte-exactly restored afterward.
Evidence packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1;
p15-pe-prechange-source-comparison-v1.json/.log, candidate source backup,
and p15-armored-rank-growth-v1-green.json preserve both sides. Neither fixture
learns or slots CE. This rules out the new CE coefficient as their cause.

## Diagnosis before correction

D07-automatic-single-target-v1 intentionally replaced player random selection
with lowest-current-Life focus. It changes first-kill timing and RNG consumption.
The fixture still embeds the earlier seed7 spread timeline and an energy26
comment relying on a9s opening wave. Inspect current actual input and paid
Dagger/PE events before revising these assumptions. Preserve strict payment,
real-body, damaging-spread, replay/settlement/authority and fractional-resource
checks; do not skip, weaken or restore obsolete production targeting.
Security check: pass; authorized local first-party fixtures and evidence only.
No dependencies, network, CI, permissions, publication or earned-save mutation.

## Root cause and correction

Current recorded opening chooses the29-Life Quill Rat and kills it at3000ms;
PE first casts at4500ms and the wave ends7500ms. The first dodging survivor has
spread DoT receipts [4500,1],[5220,2],[5917,2],[6000,1],[6960,9],[7500,6].
Update the literal timeline oracles while retaining the complete independent
plain/recorded equality, source/potency/expiry and exact payment assertions.
Energy26 produces5.2MP/s ×7.5s=39MP, no fractional carry. Set this replay-only
synthetic fixture's energy27:5.4MP/s ×7.5s=40.5MP. Strengthen positive carry to
approximately0.5; retain exact carried-resource and repeated receipt equality.
No production Poison behavior/targeting, seed, monster or earned save changes.
Raw timeline/carry diagnostic JSON/logs are retained in the packet; temporary
console instrumentation has been removed byte-exactly before the final patch.

## Verified resolution

Fixed locally in the working tree; no new commit. Both original failures pass
under the corrected synthetic assumptions (`p15-pe-native-fixture-green-v1.json`).
The other351cases retain passing evidence from the original focused run; none
were rerun. Scoped strict TypeScript including both test setup and the repaired
fixture passes; explicit lint passes. The earlier type command omitted the
existing src/test/setup.ts matcher augmentation; correcting only the external
scope config resolves all17matcher errors without source suppression.
This closes the fixture defect, not formal balance or BUG611.
