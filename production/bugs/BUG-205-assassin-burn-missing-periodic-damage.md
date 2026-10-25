# BUG-205 — Seven Assassin skills apply Burn without periodic damage

- Status: six Fire-hit/Burn paths locally repaired; Death Sentry and other whole-skill promises remain open.
- Severity: High — an advertised damaging status never removes periodic HP.
- Environment: Node24.21.0, actual default registry and native L30 Assassin.
- Scope: Fire Blast, Phoenix Strike, Fists of Fire, Dragon Tail, Wake of Fire,
  Wake of Inferno and Death Sentry.
- Owner: root; independent design/QA and earned balance acceptance open.

## Reproduction

1. Recursively allocate each selected skill's actual prerequisites, select only
   that skill through native `playerToCombatUnit`, and use ranks1/2/20.
2. At seeds7/19/41/97, allow one1700ms action against a held2000HP target.
   Synthetic resources, zero defenses/critical chance and a later caster hold
   isolate that cast; this is not earned campaign play.
3. Assert one action/payment, immutable input, exact recorded replay and final
   HP equal to2000 minus direct and periodic HP loss.
4. Require every landed declared Burn to cause positive periodic HP loss.

Expected: an applied damaging Burn removes actual HP over time under the
existing Burn/Ignite semantics. Numeric potency needs explicit authored data.

Observed:84cases,63positive hits and63actual Burn markers, but zero periodic
HP loss. Each skill has12cases/nine positive hits and fails the same property.
The separate diagnostic exits1 after retaining all cases.

Root cause: all seven actual JSON rows omit `statusEffect.dotPctOfDamage`.
The catalog forwards explicit potency; an unpowered status marker cannot
provide damaging DoT. Do not introduce a global default to conceal the defect.

Phoenix Strike also advertises typed Fire/Cold/Lightning damage; the catalog's
composite path is currently limited to Vengeance. A correct Phoenix repair
must establish Fire-component attribution rather than derive Burn from an
incorrect all-Fire scalar hit. Charge, trap and corpse promises require their
own acceptance evidence; fixing Burn alone cannot credit seven whole skills.
Death Sentry additionally has conflicting identity: actual JSON is Fire/Burn,
while both locale descriptions promise a lightning trap and corpse explosions.
Do not cement that conflict by adding potency to the wrong damage identity;
resolve its full trap/corpse contract before repairing that row.

See [native reproduction](../../docs/plans/evidence/d04-assassin-burn-repro.md).
At initial reproduction, no Burn implementation, genuine campaign action,
source/data repair, inventory functionality credit or remote publication had
occurred. The current partial repair is recorded below.

## Local repair continuation

Six explicit authored fractions and real Phoenix components are verified in
[Assassin Fire evidence](../../docs/plans/evidence/d04-assassin-fire.md).
Final full14626/651/two existing skips, types/lint/build and bounded production
checks pass. Only Dragon Tail gains functionality credit. Death Sentry remains
unpowered pending lightning/trap/corpse identity repair; cone, charge and
persistent-trap requirements stay open. This is partial resolution, not closure
of all seven advertised skills. Original reproduction remains historical.
