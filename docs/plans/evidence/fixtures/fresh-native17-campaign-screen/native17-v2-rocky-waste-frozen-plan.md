# Authentic v2 earned Rocky Waste continuation — frozen plan

Experiment: `native17-v2-earned-rocky-waste-v1`. This is a separate earned
saved-domain service experiment, authorized after the v2 evidence commit
`389633f`. It does not replay the campaign prefix or retry Radament.

## Authenticated ancestry and restoration

Use only `native17-v2-native-export.json.gz` from this directory. Authenticate
the compressed bytes before decompression and the exact export bytes before
JSON parse and production `decodeSave`:

- gzip SHA-256: `51d1611a1dbae156d43293a392ccdb5749a61161605f0a47f91c1c050e48655e`
- raw export SHA-256: `c038427361d2171ebb3693509804966ff5538f2b9bd6e0da1d23f660516567d6`
- decoded native save hash: `688505bef96a7fc2129564d12c1215cc82709d55ffc1d11dac7c365053ed6a8f`
- restored earned-state hash: `64972a1f3494c8f488fd85a843365e6d07a628c5c7a5ffcfdf688b579e789df7`
- parent full-report raw SHA-256: `90a79b6c0fe564f250379660705fb7ab9cc619dc2726c5b4fe1eb9d8e021a1cd`

Freeze `Date.now()` at `1792497600000`, the original experiment clock. Restore
the actual decoded SaveCurrent through `restoreEarnedSave`, then require full
`snapshotStores()` deep equality to the decoded save before any adaptation.
Require the earned-state hash above. No offline accrual, fresh player creation,
observation reconstruction, source edits, or arbitrary replacement save.

This is saved-domain service hydration. It does not establish browser,
IndexedDB, or public Save/Continue acceptance. Native saves omit transient
combat HP and mana. Do not transplant W5 combat HP/mana or manually heal;
ordinary `startSubAreaRun` constructs the next challenge's native opening.
The dedicated Vitest process seeds the monotonic native item ID sequence from
authentic owned IDs; its module realm terminates with that process. All caller
stores/methods, combat/hydration state, clock, and elite pity are restored in
`finally`; no nonexistent item-sequence restoration is claimed.

## Exactly two earned adaptations

Require actual hero L13, 1 skill point, 5 stat points, Ice Blast 8, and the
fielded ordinary Rogue `mercs/act1-rogue-inner-sight` with an empty amulet slot.

1. Transfer only actual pre-Far-Oasis amulet `it-4fzod-2jh` to that Rogue using
   production equipment ownership and equip APIs. Require sole ownership and
   exact full payload: rare brass amulet, level/ilvl 19, unidentified,
   unequipped, empty base rolls/generated name, absent own `socketCapacity`;
   ordered tier-1 affixes mana 21, physical dodge 4, critical damage 26,
   cold resistance 12, mana 25, fire resistance 11. No substitute or selector.
2. Production `allocateSkillPoint('skills-sorceress-ice-blast')` spends the
   actual point, taking Ice Blast 8→9 and skill points 1→0.

Leave all 5 stat points, core stats, other learned skills, hero equipment,
other Rogue equipment, and hero/mercenary combos unchanged. Record each
production result and the prepared-state delta. Stop the experiment at the
first ordinary adaptation refusal, without launching combat.

## One ordinary Rocky Waste challenge

Require normal difficulty, unlocked Act II, uncleared/unattempted Rocky Waste,
and naturally persisted next ordinal 108. Select `areas/act2-rocky-waste` and
call the ordinary manual challenge entry exactly once, without run-seed or
ordinal options. Assert the returned ordinal 108, four waves, and the ordinary
seed `hashSeed(areaId + '|' + String(Date.now()))`. Never force these values.

Play each native wave once, preserving frozen equipment, core stats, skills,
and combos during the challenge. Stop immediately at the first nonwin or
refusal. If all four waves win, perform ordinary Return to map: clear idle
target, reset elite pity, and end combat. No replay, sweep, projection,
Radament retry, quest Claim, Book use, Arcane entry, or later continuation.

## Evidence, failure handling, and execution gate

Capture the actual live production snapshot and exact native export before
cleanup at every ordinary stop. Publish exact export and lossless capture
envelope independently while live; retain publication errors with the stop.
Restore the caller in `finally`, then record post-run source/reference checks.
Publish the full primary report before assertions, retaining every actual wave,
ancestry, restored/prepared/terminal states, rewards, native capture, and
cleanup/publication/provenance failures. Partial publication must not erase the
original stop or native capture. Use new external output paths with exclusive
leaves; preserve all historical evidence.

Before execution require no-combat restoration/adaptation/refusal/publication
contracts, typecheck, scoped ESLint, diff whitespace check, and concrete READY
verdicts from both design and QA/save reviewers. Commit the preparation and
freeze its clean source fingerprint and reference hashes. Root has authorized
execution immediately after these gates; no additional permission is needed.
Run the opt-in driver once in a dedicated process, expected 5–15 seconds with
a 30-second test timeout. Any failed attempt still consumes this one-attempt
authorization; do not rerun combat.

Retain the three exact raw outputs as deterministic gzip plus a concise
summary and result. Ask both reviewers to audit actual evidence, then remove
only tracked task-owned scratch files after all consumers finish, verify
cleanup, commit the evidence, and report the result and limitations.
