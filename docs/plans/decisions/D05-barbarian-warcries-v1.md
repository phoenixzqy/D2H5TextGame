# D05 — Automatic personal Shout and Battle Orders

Status: local implementation contract; independent design/QA and earned-build balance open.
Baseline: `98c3d817ff5372c217165120514e03ae2688aace`.

The shipped JSON is the numerical authority for this reconciliation. Older
skills-spec and locale text promise fixed50% party/timed effects or maximum
mana, conflicting with the authored passive/self rows. This decision replaces
those two descriptions, following the existing Iron Skin/endurance contracts.
It does not constitute independent approval or earned campaign acceptance.

- Shout: unlock6, Howl prerequisite, cap20, ordinary defense+3% per rank.
- Battle Orders: unlock24, Shout prerequisite, cap20, maximum life+4% and
  ordinary effective-Energy mana recovery+1% per rank. Maximum mana is unchanged.
- Both apply automatically to the Barbarian hero only, with no cast, combo,
  cost, timer, aura selection, mercenary/summon effect or persisted bonus.
- Only exact authored/canonical aliases count, taking MAX once, capped by the
  copied schema-validated JSON definition. Class/finite level eligibility is
  checked at the fresh hero boundary; native learning owns prerequisites.
- Same-kind passive bonuses add over fresh equipment/quest stats: life is
  freshLifeMax*(1+Stamina+Orders), defense is freshDefense*(1+IronSkin+Shout).
  Orders multiplies ordinary recovery before existing item recovery composition.
- Composition preserves current HP/MP and clamps on decreases. Fresh encounter
  entry retains its existing full-pool policy. Learning/reset affects the next
  wave; explicit replay uses original teams/resources/carries/seed, grants no
  duplicate income and never compounds derived bonuses.
- Save remains22. UI shows actual current/next values and bilingual capacity,
  recovery, self-only, unlock/cap and next-wave semantics.

Acceptance requires rank1/20 actual mitigation, useful capacity/healing and mana
recovery; malformed/foreign/locked/duplicate aliases; immutable strict tuning;
fresh equipment recomposition, native learning/reset/wave/replay/import, both
locales and production browser Save/Continue. Synthetic proof is labeled and
never promoted to genuine campaign progress.
