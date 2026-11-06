# BUG-562 — Score Act II lightning and cold protection

- Severity: Medium; the campaign can equip owned alternatives through ordinary controls.
- Status: Fixed locally; uncommitted. Campaign survival remains open.
- Owner: campaign equipment policy, root sole writer.
- Build: `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
  production hash `e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a`,
  campaign authority v8.
- Environment: Node native campaign service in WSL; viewport/locale inapplicable.

## Reproduction

1. Continue the retained earned Javelin campaign to level 24 and Arcane Sanctuary.
2. Observe the native wave-three defeat at ordinal 291 in
   `p15-javelin-act2-stage-continuation-v1.journal.jsonl.gz`.
3. Inspect `javelinGearThreats(2)` and the actual incoming damage.

Expected: the declared Act II equipment policy values protection against its
lightning and cold casters, alongside physical and arcane damage.

Actual: it scores physical and arcane hits only. The hero has lightning 23 and
arcane 80 resistance; incoming direct damage is physical 175, lightning 273,
cold 65, with no observed arcane damage. Mana is not exhausted. This omission
does not prove an owned replacement is sufficient to win.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-javelin-act2-stage-continuation-v1.json`
and the adjacent native journal preserve the unmodified failure and native seed.
No seed override or completed-route replay is required to reproduce the policy
omission. The exact successor is level 24/normal ordinal 292.

Fix scope: add equally weighted, 120-raw lightning/cold probes to the maintained
Act II policy; retain existing physical/arcane probes and offensive/resource
floors. Native owned-item eligibility/transfers remain authoritative. Other acts
are unchanged. Regression must show native hero/merc equipment selection values
both previously omitted elements and conserves income/resources.

Security check: pass. Local harness policy only; no dependency, network,
credential, permission, CI, source-save mutation or publication change.

## Verification

Four native-selection regressions (hero/merc × lightning/cold) fail before the
change and pass afterward. All 26 affected survival/Javelin checks, scoped strict
types and lint of the two maintained files pass. The new native ordinal 292
equips six eligible owned upgrades; hero lightning resistance rises 23→46 and
cold 48→65. It still loses Arcane wave three after wave-two attrition. This
confirms the missing scoring terms are fixed, not campaign viability or a causal
win-rate improvement across different seeds. Original failures stay intact.

Native receipt `p15-javelin-act2-elemental-continuation-v2.json` preserves the
actual gameplay and two scratch-driver accounting errors. Readback
`p15-javelin-act2-elemental-readback-v2.json` authenticates and closes those
errors without replay: an already-earned training target legitimately produces
a zero-admission stage, and the full stage auditor needs the historical first
boundary. Economy and quest audits pass in the original receipt.
