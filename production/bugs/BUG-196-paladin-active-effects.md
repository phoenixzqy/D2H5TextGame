# BUG-196 — Resolve the advertised Paladin active effects

Severity: High — three active skills lack advertised combat consequences.
Status: Reproduced; repair in progress. No new inventory credit.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Base `35015455e88aa10f968a9663d2962f66260abdc9`, Linux/Node24.21.0,
seed7. Native `playerToCombatUnit` and actual registered combat, no browser.

1. Project a disclosed synthetic L30 Paladin with all active prerequisites
   learned and Holy Bolt, Blessed Hammer or Vengeance as its sole selected skill,
   at rank1 or20. The hero starts5000/10000HP, with exactly one cast's MP and
   ordinary mana regeneration disabled. No equipment or selected aura.
2. Use a permanent target hold and a hero hold starting1701ms, just after the
   real first action at1700ms. Target has100000HP, zero dodge/armor/resistances;
   Hammer compares magicResist30 against an otherwise identical zero-MR run.
3. Run seed7; require native selection, one real paid cast, positive direct
   damage, exact payment, unchanged input and identical deterministic replay.
4. Require Holy Bolt actual self HP restoration for50% of removed enemy HP;
   Hammer's direct damage unchanged by MR; and actual Fire/Cold/Lightning
   Vengeance damage plus Burn/Chill/Paralyze.

Expected: all advertised consequences in
[`skills-spec.md` §3.3](../../docs/design/skills-spec.md) and both locales.

Actual: all36 selection/cast/payment/damage/immutability/replay controls pass.
Eight behavior assertions fail across six rank/skill cases:

- Holy Bolt hits51/146HP at rank1/20 but restores0HP, expected25/73.
- Hammer hits31/145 with30MR versus61/175 with0MR; it does not ignore MR.
- Vengeance emits one Fire hit93/264 and Burn only; Cold/Lightning damage and
  Chill/Paralyze are absent. Its later Burn is real but does not substitute for
  the missing direct components or controls.

Reproduction exits1 in4.745s; exact script, result, log and terminal receipt at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-paladin-actives-8zm0aycd/`.
Root retains this exact task-owned path while repair consumers run, then
archives required diagnostics and removes disposable scratch after validation.
No genuine campaign, external message, remote or deployment action.

## Root cause

The Holy Bolt JSON has no hit-recovery payload despite the existing shared
actual-HP recovery primitive. Hammer has no explicit mitigation-bypass metadata;
its ordinary Arcane hit subtracts magicResist. The class catalog adapter ignores
`damage.breakdown`, emits a single primary Fire damage effect, and whitelists
secondary statuses only for other reviewed skills. A cast/name/tag or partial
Burn marker cannot satisfy the missing effects.

Contract: [D04 Paladin active attacks](../../docs/plans/decisions/D04-paladin-active-attacks-v1.md).
Independent design/QA and earned balance remain open; C2-C4/fullG0-G7/privatev1
are unchanged and unfinished. Remaining seven Paladin actives still need their
own audited behavior; this packet does not redefine the class scope.
