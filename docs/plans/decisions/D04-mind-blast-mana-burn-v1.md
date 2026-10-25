# D04 — Mind Blast and shared Mana Burn

2026-10-25. Author contract for
[BUG210](../../../production/bugs/BUG-210-mind-blast-missing-stun-and-mana-loss.md).
Root sole writer/reviewer; independent design/QA and earned balance remain open.
No reduction of the full seven-class/C0–C4/G0–G7/private-v1 objective.

## Required behavior and settlement

Mind Blast retains Arcane50–70/+5rank, all living enemies,30MP once,CD3,
unlock24/cap20 and Cloak of Shadows prerequisite. A landed ordinary hit applies
ordered Mana Burn then Stun. Stun uses the existing1s/0.5s boss duration and
real action interruption/expiry. Misses apply neither effect. Do not invent
Conversion or additional hits. Actual JSON/native registration and legacy
builder callers must agree on the ordered pair.

combat-formulas.md §9.6 requires20% damage as mana loss and50% increased
Arcane damage at zero mana. combo-matrix.md separately specifies20% Arcane
and15% Lightning marker combos lasting until mana restores. Keep both rules:
the ordinary marker combo remains unchanged, including boss combo resistance;
while that marker is active and the target has exactly0MP, multiply incoming
direct Arcane damage by1.5 in addition. Thus an otherwise unmodified ordinary
marked zero-mana target receives1.2×1.5=1.8, a boss1.1×1.5=1.65. This condition
uses pre-hit state: the strike that empties mana cannot amplify itself. No
bonus from a missing/future/expired marker or from merely having0MP.

Author the shared coefficient/multiplier/lifetime policy in closed validated
combat JSON, following the existing Chill/mitigation definition pattern.
Every successful hostile on-hit Mana Burn carrier, including monster Mana
Rift, uses the same primitive. Drain floor(0.2×actual direct HP removed), capped
at the target's current mana after personal shields. There is no minimum1MP
debit, no negative mana, drain on misses/full absorption, periodic/reflection
inheritance or extra random draw. Lethal hits use actual HP removed rather
than overkill; death/corpse/orb closure remains exactly once. Ordinary status
application ordering remains; apply the debit before later Stun/death closure.
Publish changed absolute MP with a mana-burn reason through existing transport.

The marker lasts until real MP restoration, rather than the current accidental
3s expiry. A positive MP increase from regeneration, an orb, refund, Redemption
or Solar Creeper clears the active marker. Fractional recovery carry that has
not increased actual MP does not clear it. Spending mana does not clear it.
No new persisted status, save field or version; transient status observations
and wave rebasing retain the ordinary recording path. Explicit finite legacy
status overrides remain finite. Affected original monsters at0MP cannot select
skills, including zero-cost skills; they may make basic attacks. Unaffected
zero-mana monsters and ordinary authored free attacks keep existing behavior.
Restoration releases the marker and therefore that lockout.

## Presentation, verification and review

The pure display model explains damage, drain percentage/rounding, conditional
Arcane multiplier, lifetime and Stun/boss seconds. Both locales show truthful
unlearned/current/next/MAX details with one cost/cooldown. Public allocation,
configuration, visible cast and exact five-domain Save-close-Continue must work
on mobile/desktop; synthetic fixtures earn no class/build/balance credit.

Require RED before runtime repair. Cover actual ranks1/2/20/seeds7/19/41/97,
immutable exact replay/HP/MP, native prerequisites/class/aliases, paid misses,
Defense/MR/resistance, both shield directions, overkill, ordering, zero-mana
pre-hit bonus and boss factor, recovery/carry/expiry/lockout, real Stun timing,
recorded UI resource playback and unchanged non-Mana-Burn controls. Required
focused/engine/full/types/lint/build and public browser validation precede credit.

Plan review: ready after resolving lifetime and the independent zero-mana bonus
explicitly rather than retaining the accidental flag-only behavior. The change
belongs in shared damage/status/resource settlement, not a Mind-Blast-only mana
patch. Security check: pass; first-party local gameplay/data only, no credentials,
new dependency, permission/CI change, genuine campaign or remote action. These
are author reviews; independent and earned acceptance remain open.
