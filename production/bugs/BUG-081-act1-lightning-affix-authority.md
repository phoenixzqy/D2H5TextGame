# BUG-081 — Give Act I Lightning affixes one authored combat contract

Status: open — source discrepancy and bounded progression failure reproduced;
controlling replacement behavior must be reviewed before a runtime patch.
Severity: High — the current first-act progression screen fails at its first
elite wave; the skill has conflicting runtime/data/design definitions. Other
builds/routes and the full campaign have not been ruled out.

## Reproduction

Production source `2f7df8a`; retained native failure at `8460668`. Playwright1.59.1,
Chromium desktop1280×800, en, Linux; fixedDate2026-10-20T12:00Z, real browser timers.
Plan seed2223645302, challengeOrdinal40. Diagnostic Node24.21.0; see exact receipt
and source manifest rather than assuming another environment is equivalent.

1. Follow the immutable native recipe in
   `docs/plans/evidence/fixtures/p04a08-bounded-den-earned-discovery.spec.ts.txt`:
   fresh Sorceress, exactly40ordinary Blood MoorW1victories, same earned upgrades,
   L6Fire4/Frost2/Warmth1 and L9InnerSight Rogue; no imports/refills/extra grind.
2. Accept Den, enter through native UI, win W1 and advance with surviving allies.
3. W2 has3champions+7trash. The champion Fallen Shaman appends `monster-lightning`
   after its authored Fire Bolt and Resurrect skills.
4. Trace config→factory→registry: `elite-config.json` references
   `monster-lightning`; `getSkill` aliases it to the hardcoded `monster.lightning`
   stub in `src/engine/skills/aliases.ts`. Contrast the authored
   `src/data/skills/monsters.json` entry and `docs/design/monster-spec.md` §9.

Expected: one explicit reviewed affix semantics/power policy, JSON-authored and
consistent with production lookup. The first-elite challenge must be evaluated
against actual earned carry, mitigation, encounter durability and acquisition.
This report does not require an arbitrary build/seed to win.

Actual: runtime is a free single-target40–60Lightning active skill,2sCD, no status;
authored data says all-enemies40–65,3sCD, Paralyze; older design says +50%Lightning
resistance and25%on-hit bolt. The runtime range is flat and unrelated to monster
level/ATK. D07 deliberately preserved this skill; no composition regression is
claimed. DEF51 does not mitigate Lightning under approved D04, and no targeting,
resource-carry or mitigation defect is demonstrated.

## Observed outcome and reduced source diagnostic

Native W1wins9trash and awards270heroXP/202mercXP/4items/133shards. W2loses when
the original hero dies; merc160/196HP, final champion Shaman36/297HP.
A separate single-process reconstructed diagnostic decodes the retained save
through production `decodeSave`, proves all six domain snapshots equal, then
uses existing `startEarnedRun`/`playEarnedWave` services for W1/W2 only. It matches
native IDs, terminal HPpercentages/MP, outcomes, W1awards and both capped log tails.
All23wave-unit HP/MP ledgers reconcile; no gameplay source/registry changes.

W2hero:112entryHP+18HPorbs−17otherdamage−143rawLightning→0HP,30overkill.
Lightning hits40at7653.846ms,57at15258.242ms and46at18920ms; another cast at11460ms
is dodged by the merc. Hero MP114+167regen−168casts+18orbs=131.
Merc:190+18orbs−48damage=160. No healing skill fired. This identifies a dominant
observed damage contribution; it is not a no-Lightning counterfactual or proof
that removing/tuning it alone wins. Simulation/cast order changes can change RNG.

## Evidence, ownership and next action

`docs/plans/evidence/p01-lightning-affix-diagnosis.md` and its immutable JSON/script
fixtures bind exact source, input, full event and resource ledgers. Original
native report/trace/screenshots are at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/den-attempt`.
Raw reconstructed report/receipts are at sibling `lightning-diagnosis`.
Root retains both through bug/fix consumers and removes them after umbrella ends.

Owners: game-designer/level-designer resolve narrow Act I affix authority and
power budget; engine-dev/content-designer implement it at the authored lookup
boundary; QA verifies regressions and a separately reviewed fresh native attempt.
Do not globally load the monster catalog or adjust all shared Lightning users,
pack counts/levels, XP, gear, carry, targeting, acquisition or resurrection to
hide this failure. Existing global authored-monster migration remains separate.
Workaround: none verified within this bounded recipe. No browser retry yet.
