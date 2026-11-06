# BUG-489 — Caster gear score ignores Act V physical exposure

- Severity: Medium; diagnostic equipment policy makes earned progression fragile.
- Status: locally resolved; original failures and current outcome retained below.
- Environment: human2 current source, WSL/Node24.21.0; native Act V1399/1400.
- Reproduction: use the Act II elemental caster score for level55 Act V gear.
  The equipped hero has1005life/499defense/26physical resistance. Crystalline
  loses W3 after attrition, and the next admission loses W1 from full life.
- Expected: Act V equipment decisions account for physical/fire/poison armor
  mitigation as well as magic mitigation, retaining exact owned-item conservation.
- Actual: casterGearScore only examines cold/lightning/arcane at60 raw damage;
  a physical-resistance upgrade is invisible to that score. Critical weapons
  also need not improve survival. This is a policy flaw, not a combat-formula bug.
- Evidence: BUG488 reports/recordings and caster-preparation.ts scoring/filter.
- Fix plan: add explicit mixed-v2 scoring using production mitigateDamage and
  the ordinary hit floor. Preserve the frozen elemental-v1 default. Publish
  reference physical1000/magic60 hits in a diagnostic JSON config; these are
  evaluation probes, never gameplay stat overrides. Act V opts in. Require
  mixed critical candidates to improve survival and retain crit dimensions.
- Checks: physical/armor upgrades influence mixed scoring; elemental default
  and existing floors remain; native owned equip/conservation and capacity
  refusal still hold. Run only these cases, then one earned Crystalline retry.

- v2 native result: four owned equips improve physical26→63/defense499→531;
  W1/W2 win with751/622life. W3 Succubi defeat5744ms via arcane hits34–37.
  Physical protection improves but the inherited60raw magic probe understates
  actual Act V spell hits. Preserve this failed version and its exact four source
  snapshots in p15-caster-mixed-v2-frozen-*.
- Revised evaluation v3 keeps physical1000 and probes magic300, covering an
  approximately200 raw arcane hit plus ordinary1.5critical multiplier. It uses
  production mitigation, changes no enemy/hero/reward stats, and is not a balance
  acceptance result. Verify only relevant selector cases and the next admission.

- v3/result: actual1402 W1–W4 win, W5 resource defeat retained. Native stat
  recovery1403 wins W1–W5; W6 Frozen Terror764attack/1.75crit implies1337raw.
  Its217 final physical critical kills after low-life carry. Next version v4
  probes armor1500/magic300, with v3 source preserved separately. These remain
  selector probes; actual attacks, rewards and resources are never overridden.

- Current outcome: Resolved locally: maintained mixed-v4 probes armor1500/magic300 through production mitigation and ordinary hit floor. Original elemental default stays frozen; exact owned equips and focused checks pass. Native1405 Crystalline clears. Broader build/balance acceptance remains open.
