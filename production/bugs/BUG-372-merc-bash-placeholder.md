# BUG-372 — Replace the mercenary Bash single-hit placeholder

Status: Open — native repair verified; browser/earned feature acceptance pending.
Severity: High — the Battle Orders barbarian lacks its advertised combo.
Owners: engine-dev / content-designer; producer coordinates independent QA.

## Reproduction

- Commit: `75cb704378c9c017c709bc6ed36a8cace9aa245f`.
- Environment: Linux, native Vitest, seed 7. Browser/viewport not exercised under
  terminal `H3_PREREQUISITE_FAILED_NO_APP`; neither locale UI exercised.
1. Load `mercs/act5-barbarian-battle-orders` through the real pool, owned factory
   and `mercToCombatUnit`; retain the actual Battle Orders passive loadout.
2. Supply surviving constructed resources, zero MP, Attack 100, speed 100 and
   an enemy with zero mitigation. Inspect the first default-registry Bash action.
3. Repeat with Attack 200, preserving all other inputs.

Expected: two independent physical attempts against the original enemy for one
action/CD2s/zero MP; flat damage stays independent of Attack. The GDD advertises
two hits and 25% stun. The scoped contract explicitly reconciles that chance per
landed attempt and canonical stun duration; those are not old GDD details.

Actual: both cases observe one damage event instead of two. Native RED exits 1
with two failures in 12.031306s; all 2,076 inputs remain unchanged at
`63ccb4475e0a423515896fdbac75e35c7ff55b25154dac4e5e038ea98494be8d`.

## Evidence and diagnosis

`src/stores/merc-bash.test.ts`; exact frozen source, binding, native JSON/log and
before/after receipts are retained by root at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-bash-txtr1cps`.
This bug was filed after reproduction and before production edits.

Root cause: `MERC_STUB_SKILLS` registers Bash as one flat 25–40 damage effect;
the authored row has no hit sequence or explicit chance/duration metadata.
No native resolver replaces the stub. There is no workaround for the missing
combo. Constructed mechanics are not earned recruitment or balance evidence.

## Implementation and native verification

The authored two-attempt/status metadata, immutable exact-ID resolver, default
registry replacement and truthful bilingual descriptions are implemented.
Frozen primary GREEN passes both cases; native combat/public lifecycle and
schema controls provide65newcases. A test-filter typing error is corrected with
an erased predicate; failed receipts and identical-emission evidence remain.
Successor focused256/10, engine11260/420, project types, scoped/full lint and
external build pass. Ordinary units terminate21101pass/one failure (BUG373).
Native trace proves an invalid paid-Blaze fixture premise; its minimal test
correction retains every original assertion and passes12/12 plus scoped lint.
Independent source review approves. Final ordinary units pass21102tests/993files
in1584.117326s with zero failed/pending/todo; project types pass280.345979s and
full zero-warning lint/engine purity passes540.454492s. All2080inputs remain
unchanged on final12bc7597map. Exact final review/commit binding governs the
local checkpoint. This is not browser, earned
recruitment, balance or feature acceptance. See
[validation evidence](../../docs/plans/evidence/merc-bash.md).
