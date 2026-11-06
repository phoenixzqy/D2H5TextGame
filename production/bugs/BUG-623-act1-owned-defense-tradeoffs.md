# BUG-623 — Consider owned defensive tradeoffs before Act II

Status: Implemented in working tree; default adoption rejected. Severity: Medium. Owner: root (campaign policy).

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production tree
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Environment: Node native campaign services; browser/locale not applicable.
No combat or new seed is required. Restore each complete terminal native save
from `p15-first-entry-early-repair-v1/` for intended Fire Sorceress, Double Swing
and Double Throw. Inspect `equipCampaignGear` before Act II is unlocked.

Expected: an explicit intended-build policy can choose legal owned armor
tradeoffs using declared threats while preserving attack, speed, Mana capacity,
custody, current resources and build weapons. This is acquisition preparation,
not evidence that any particular build should win.

Actual: generic armor selection requires every numeric delta to be nonnegative;
the existing survival selector is enabled only after Act II unlocks. All three
retained saves have an eligible owned helmet swap with a better equal-weight
physical/fire/cold/lightning/arcane/poison score at raw damage 60. Projected
incoming damage per maximum Life improves approximately 1.6%, 5.8% and 5.7%.
Every swap preserves attack/speed/Mana capacity and current Life/Mana. No combat
outcome benefit, engine defect or production tuning requirement follows.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
`p15-act1-owned-defense-v2-plan.json`, `p15-act1-owned-defense-v2.json` and
`p15-act1-owned-defense-v2.raw.jsonl.gz` retain fixed probes, all three full input/export states, native
transfers, item payload custody, no-income and no-healing audits. Launcher exit
0; no cache remains. The v1 audit incorrectly forbade the player equipment mirror
from changing; its failed receipt remains history and is not accepted evidence.

## Planned correction

Opt the intended profiles into a separately named Act I hero-only armor policy.
Reuse the bounded native survival selector and stash retrieval, with all six
fixed probes in JSON, no Mana-floor relaxation, weapon/offhand changes or
companion reallocation. Preserve legacy profiles and existing Act II behavior.
The selector also must try the next improving candidate after a native capacity
refusal. The full-backpack/full-stash regression reproduces its initial failure
to equip an eligible backpack fallback. After that fallback is equipped, the
second bounded pass can retrieve the stronger stash item using the freed slot.
Add native tradeoff/opt-out/floor regression checks, run only affected checks,
then run the three affected earned Act I policies under their existing limits.
Keep all losses; do not extend exhausted controllers or select replacement seeds.


## Verified outcome and adoption boundary

The explicit opt-in and native capacity fallback are implemented without a
fabricated fixed commit SHA. Regression coverage is in
`tests/campaign/intended-equipment.regression.test.ts` and
`tests/campaign/survival-gear.regression.test.ts`. Original verification covers
108 distinct affected cases across retained/final runs. Four affected cases,
strict scoped types and explicit lint pass again after the default is removed.

The separately declared three fresh acquisitions produce zero Act I clears:
Fire stops in opening training; both Barbarian builds lose Den wave 4. A separate
reader reconciles all full saves and reward/economy/custody histories. Therefore
the score improvement does not justify canonical adoption. The option remains
explicitly experimental; all canonical builds retain their prior early armor
policy. The two-pass capacity fix is preserved. No production skill, monster,
reward or stat data changes. Build-progression balance remains open under BUG611.

See the final section of
`docs/balance/2026-11-03-intended-act1-acquisition.md` for source authorities,
rejected Fire control, costs, validation and retained evidence. No campaign was
repeated to validate the removal of an unaccepted default.
