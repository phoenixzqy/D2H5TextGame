# D05 — Authored Amazon Critical Strike, Penetrate and Dodge

Status: root contract implemented and locally verified; independent acceptance pending.
[Implementation evidence](../evidence/d05-amazon-passives.md).
Scope: Critical Strike, Penetrate and Dodge, including ordinary learning,
next-wave/replay, display and persistence. Avoid/Evade/Pierce are covered by
[D05 remaining passives](D05-amazon-remaining-passives-v1.md). Full C3/G2 remains open.

Preserve existing JSON as the numerical authority, following the prior D05
Warmth/mastery/Iron Skin reconciliations. This supersedes only the three older
fixed-value rows in `docs/design/skills-spec.md` and their conflicting locale
descriptions. It changes no JSON potency, class identity, active skill, save
field/version, equipment rule, or existing dodge/crit formula.

| Exact identity / canonical alias | Unlock | Cap | Per allocated rank |
| --- | --- | --- | --- |
| skills-amazon-critical-strike / amazon.critical_strike | 1 | 20 | +.01crit chance |
| skills-amazon-penetrate / amazon.penetrate | 18 | 20 | +.03fresh Attack |
| skills-amazon-dodge / amazon.dodge | 6 | 20 | +.01physical dodge |

Penetrate's actual authored field is `attackPct`. It therefore multiplies fresh
Attack, rather than introducing an accuracy stat or changing enemy dodge.
Ordinary allocation retains its existing Critical Strike prerequisite.
Critical Strike/Dodge add percentage points to their corresponding decimal
stats; no intermediate flooring. Penetrate multiplies the ordinary fresh,
equipment-derived Attack once. Existing downstream crit/dodge/Attack consumers
and caps govern actual effects. Non-Attack spell bases gain no Penetrate bonus.

Require exactly one row per authored identity, strict passive/self/zero-cooldown
metadata, positive integer unlock/cap and a closed one-coefficient scaling
object. Coefficients must be finite and nonnegative, without an invented tuning
ceiling. Copy/freeze primitives without retaining/freezing caller JSON; avoid
three copies of the same composition logic. Take the maximum valid positive
integer rank under the two exact aliases, clamp once to the copied cap, and
ignore malformed/unknown aliases. Do not infer allocation from skills, combo,
registry, statuses or equipment. Native learning owns prerequisite validation;
the combat adapter consumes the saved allocated ranks consistently with the
existing passive adapters.

Only a player Amazon at finite level at least each copied unlock receives the
corresponding bonus. Other classes and mercs/summons inherit none. Compose at
the fresh hero boundary; never mutate persisted derived stats or source data.
Ordinary recordings stay frozen. New waves and explicit current-configuration
replay recompose from the existing immutable original resource/equipment
baselines, without accumulation, healing or resource/carry changes. Removing
an allocation clears its bonus on recomposition. No action, mana cost,
cooldown, status marker or RNG draw is introduced for any passive.

Both locales and the skill spec must state these rules. Verify actual current/
next detail values and ordinary learn/rank-up visibility, not descriptions
alone. Production desktop/mobile proof must use labeled constructed Amazon
eligibility; it is not an earned Amazon campaign or numerical balance verdict.

Plan review (`plan-review`): ready after explicitly preserving the allocation
prerequisite boundary, fresh-equipment ordering, both exact aliases, resource
baselines, non-Amazon controls, actual damage/dodge/crit consequences and the
old served build's isolation from new source work. Root self-review only.
Security check: pass; local typed combat/schema/copy/tests, no dependencies,
network, credentials, permissions, CI bypass or save shape change.

Implementation order: retain causal native6RED/6controls and BUG158; add strict
schema/immutable-definition/rank oracles; wire one fresh composition point;
prove rank1/cap, alias/cap/eligibility/removal/gear/no-refill and native playback
consequences; update truthful copy/details; run focused/engine/full/type/lint/
production build and qualified browser checks. Do not commit knowingly failing
required tests. The current earned farming build remains immutable while its
browser consumer runs; preserve and audit its results independently of these
new test/contract files.
