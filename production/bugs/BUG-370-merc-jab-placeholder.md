# BUG-370 — Replace the mercenary Jab single-hit placeholder

Status: Open — native repair implemented; revised ordinary units, focused checks,
lint and build pass; final helper types also pass on the reviewed successor.
Final review/commit binding is recorded separately; browser/earned/feature
acceptance remains pending. Historical unfiltered validation stopped after the
separate BUG-371 closed-harness boundary breach; that run stays failed and is
neither a pass nor a timeout.
Severity: High — six Act II mercenaries lack their advertised primary combo.
Owners: engine-dev / content-designer; producer coordinates independent QA.

## Reproduction

- Commit: `8b279e6d55b69b4597493fb872190d85d9c4ed7a`.
- Environment: native Vitest, seed 7; browser/viewport not exercised under the
  terminal `H3_PREREQUISITE_FAILED_NO_APP` prerequisite result.
- Locale: engine invariant; zh-CN/en descriptions also need clarification.
1. Load the real mercenary pool, create Holy Freeze through the owned factory,
   and project it through `mercToCombatUnit` and the default skill registry.
2. Hold the hero/enemy, retain the native mercenary loadout, and supply surviving
   constructed combat stats with Attack 100, zero MP and zero target mitigation.
3. Inspect the first actual `mskill-jab` action and its damage attempts. Repeat
   with Attack 200, leaving seed and other combat inputs unchanged.

## Expected and actual

Gacha spec §4.1 advertises three physical hits and +50% physical damage. The
scoped [mercenary-v1 decision](../../docs/plans/decisions/D04-merc-jab-v1.md)
defines the Attack baseline and additive bonus explicitly. Each action must
make three ordinary attempts against the selected original target, stopping
when it or the attacker dies. Current equipment Attack must affect every hit.

Actual: one damage event, amount 19, at 1700 ms for both Attack values. The stub
rolls flat 18, then the native Holy Freeze Chill gives the existing ×1.1 physical
combo. It has no hit sequence or Attack contribution. This is a real-loader
constructed mechanical reproduction, not earned recruitment or balance proof.

## Evidence and diagnosis

`src/stores/merc-jab.test.ts`: original native RED exits 1 with two failures;
2063 inputs are unchanged at `a8c248e612e0c1716204cfa81de31a5e43c5148faf269130ba056846630b014f`.
Root retains original source/binding/log/report/receipts under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-jab-r33hewez`.
The initial expected numeric arrays omitted Chill's legitimate ×1.1 combo;
that test-oracle diagnosis is retained separately before production changes.

Root cause: `MERC_STUB_SKILLS` registers `mskill-jab` as one flat damage effect;
no native resolver replaces it. Authored JSON also lacks a hit sequence,
Attack contribution and explicit Jab damage-increase tuning.

Workaround: none for the missing combo. Browser, earned recruitment, campaign
balance and full-feature acceptance remain open. No save or acquisition change
is required by the native repair.
