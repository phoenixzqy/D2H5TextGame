# D06 — Corpse Explosion blast and Defense

2026-11-03. Type: small mechanic tweak. Provisional gameplay design under the
owner's complete-private-v1 implementation request; root sole writer in the
retained human2 worktree. This is a new authored rule, not a damage-engine fix
or a claim of campaign/balance acceptance.

## Motivation and design delta

The [authored mitigation audit](../../balance/2026-11-03-corpse-authored-mitigation.md)
shows CE20's 164–194 Fire base falling to one against six of ten hypothetical
level-70 Act V ordinary archetypes. The finite-corpse mechanic works, but flat
Defense can erase its earned-rank blast. Turning a real kill into pack pressure
serves the existing corpse/curse identity and Challenge/Competence goals.

[D06's original contract](D06-corpse-consumption-v1.md) says:

> Use existing hit/crit/mitigation/status clocks.

Supersede only its ordinary direct-hit Defense rule: **player Corpse Explosion
ignores flat Defense**. Its Fire resistance, outgoing modifiers, hit/dodge and
critical rules, personal absorption, and ordinary Ignite rules still apply.
An explosion is a blast rather than a weapon strike; armor no longer completely
removes it. This uses the existing JSON-owned `ignoresDefense: true` effect.
There is no shared damage-formula change or new runtime subsystem.

## Exact rules and limits

- Keep 50–80 base, +6 per rank above one, rank cap 20, unlock 6/Teeth prerequisite,
  20 MP, two-second cooldown, all-enemy Fire and Ignite at 10% of final hit damage.
- Keep actual Player allocation authority, real wave-local primary-death supply,
  shared FIFO one-body payment, empty-pool fallback, existing rewards and replay.
- Require the exact opt-in in the independent authored-source and runtime
  semantic guards. Removing it or adding another bypass invalidates CE before
  payment. Schema ownership expands only from Impale to Impale/player CE;
  unrelated skills and monster Corpse Explosion cannot adopt it.
- No save field/migration, corpse-life coefficient, physical share, rank-growth
  change, free corpse or resource grant. The rejected growth/body-life/order
  families and their original seeds/controllers/ceilings remain closed.
- This does not supply an opening corpse or improve damage to a lone enemy
  before a real kill. First-kill and singleton damage remain BUG611 work.

There is no new numeric tuning knob/range. Existing rank growth is the curve
knob, MP/cooldown the feel knobs, and unlock/prerequisite the gate knobs. A
global elemental-mitigation change would affect unrelated builds; a coefficient
change would reopen the rejected family. Neither belongs to this rule change.

## Independent examples and acceptance

For connected, noncritical hits with no bonuses, the new direct result is
`max(1, floor(base * (1 - clampedFireResistance / 100)))` regardless of Defense.
At rank 1/6/20 base remains 50–80 / 80–110 / 164–194. Examples:

| Rank | Defense | Fire resistance | New direct range |
| --- | ---: | ---: | ---: |
| 1 | 199 | 0% | 50–80 |
| 6 | 115 | 50% | 40–55 |
| 20 | 199 | 0% | 164–194 |
| 20 | 304 | 25% | 123–145 |
| 20 | 454 | 75% | 41–48 |

These are formula examples, not population, TTK, survival or party-DPS evidence.
High Fire resistance still substantially reduces CE; the base remains much
smaller than other cap-rank area spells. Do not infer this finishes calibration.

1. Reproduce the Defense floor with actual registered CE casts before changing
   production. Assert the above independent endpoints, unchanged Ignite/payment,
   and absence of Defense bypass on ordinary fallback.
2. Verify strict source/registry rejection of missing/wrong/additional bypasses
   and schema ownership, including Impale and monster/Teeth negative controls.
3. Keep the existing CE corpse/payment/authority/reward/native lifecycle checks
   passing; execute only affected tests, scoped strict types and explicit lint.
   The package has no `validate:data` command; use the actual shared skill
   validator against the touched catalog and affected schema controls.
4. Update the bilingual skill explanation and its current/next preview checks;
   inspect that explanation at mobile/desktop in both locales. Historical
   defeat/retry/browser campaign checks remain closed.

No native campaign, admission, training, old-wave replay or acceptance sample is
part of this change. Freeze one implementation and use focused functional checks;
do not tune numeric coefficients against these examples. Later earned progression,
all-act/build holdouts, safety, pacing and final gates remain mandatory.

## Delivery and review

Affected systems: skill JSON/schema ownership, independent CE guards, localized
Skills explanation/tests, and current design references. General damage code,
registry conversion, save format and combat selection already support the flag.

Security check: pass; authorized local first-party mechanic/data/tests/docs only;
no permissions, credentials, dependencies, networking, CI or publication changes.
Plan review: ready for this bounded mechanic delivery; first-kill/singleton and
whole-build viability are explicitly incomplete and cannot be passed by unit
examples. Existing owner authorization covers routine design/implementation;
no further owner answer is needed. No subagents or external writes.


## Bounded implementation complete

[Recorded delivery](../../balance/2026-11-03-corpse-defense-bypass.md): 222 affected
cases, scoped strict types/lint and four bilingual mobile/desktop browser contexts
pass. The nine declared production/test paths are the only differences against
the prior2,147input manifest. All skill numbers and earned state remain intact;
existing equivalent combo-ID normalization is explicitly accounted for in browser
save comparisons. First-kill/singleton, actual earned continuation, full fourteen
build populations, pacing and final independent gates remain open.
