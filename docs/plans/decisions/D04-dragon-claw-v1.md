# D04 — Dragon Claw paired strikes and local critical bonus

2026-10-25. Preimplementation author contract for BUG208. Root sole writer;
independent design/QA and earned balance remain open. The existing native
[reproduction](../evidence/d04-dragon-claw-repro.md) proves one attack where
both locales promise two; the design table also promises a critical boost.

Preserve Physical70–100/+7rank per attempt, single original target,20MP once,
one-second cooldown, unlock6/cap20 and Dragon Talon prerequisite. Author
`hitSequence:{strikes:2}` and `critChanceBonus:0.1`: two independent attempts,
each with ten additional percentage points of critical chance. The exact bonus
is provisional author tuning, not a canonical or earned balance claim. The
existing v1 skill has no equipment restriction; retain that eligibility and
represent the dual-claw flourish with two attacks. This does not establish a
general dual-wield equipment system. Martial charge/finisher promises elsewhere
remain open.

Add the bonus to the attacker's existing critical chance and any eligible
Heart of Wolverine contribution only when building this opted-in damage
effect's input. Preserve the shared damage resolver's overflow conversion:
chance above100% adds half the excess to the critical multiplier. Never mutate
hero/merc/global stats, grant the bonus to basic/periodic/reflected damage or
other sequences, or double a single scalar hit to imitate two attempts.

Reuse the existing bounded sequence loop. Settle hit/base/critical RNG,
Defense/resistance/combo, finite personal absorption, reflection and death
independently per attempt. Misses consume attempts. Stop on caster/original
target death, with no retargeting and exactly one corpse/orb settlement. One
action/payment/cooldown per cast. No weapon Attack scaling or save/version
change. JSON Schema requires this actual skill's complete active Physical
single-target identity, two attempts and finite positive bonus at most1;
reject contradictory fields, unrelated ownership and the old scalar row.

RED precedes source changes: actual rank1/2/20 native HP loss, multiple seeds,
independent misses/criticals, bonus-off causal comparison, ordinary additive
critical/overflow and eligible party-aura interaction, both personal shields,
reflection/death, resource/cooldown boundaries, class/unlock/rank/MAX aliases,
captured allocation isolation and immutable replay. Preserve Fury/Jab/Talon
and ordinary single-hit controls. Schema and adapter tests retain JSON bytes.

Expose attempts, damage per attempt and the local critical bonus from the pure
display model. Both locales must explain the original target, missed attempts,
death stop and one payment/cooldown at unlearned/current/next/MAX ranks. Verify
public production learn/configure/cast and exact five-domain Save-close-new-
page-Continue in both locales at desktop/mobile; inspect screenshots and
required-size geometry. Disclose synthetic resources and fixed combat time.

Run focused/compatibility/data/engine/types/lint/build/browser checks, freeze
source/design/build/genuine bytes, then one final full suite. Retain original
failures, audit actual committed blobs, credit only Dragon Claw after the
bounded path passes, archive hashes and remove exact task-owned artifacts.
Preserve umbrella scope/branch/worktree/claim; no remote or genuine campaign
actions. Independent acceptance and earned builds/pacing/economy remain open.

Security check: pass. Scope is local gameplay/schema/display/tests; no new
dependency, network, credential, CI or data-export behavior. Plan review: ready
after correcting the preliminary clamp assumption to preserve actual critical
overflow and retaining current equipment eligibility explicitly.
