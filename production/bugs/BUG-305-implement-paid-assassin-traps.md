# BUG-305 — Implement actual paid Assassin traps and Blade Shield

Status: Open — reproduced; charge matrix is terminal, trap foundation/runtime correction is next.
Severity: High — eight advertised skill identities lack their defining persistent, corpse or reactive behavior.
Build: 8709a8db71235715ce6d5fcb49f3f61e578308aa.
Environment: native actual playerToCombatUnit projection and default authored registration, Vitest/jsdom; browser/viewport/locale not applicable to this engine reproduction. Both authored locale descriptions were checked.
Seed: 19. Constructed level30 Assassin, ranks1/20, prerequisite allocations disclosed; this is not an earned build or campaign action.

## Reproduction

1. Use trap-red/native-traps.test.ts with its retained config.mjs/workspace-initial.mjs. Native hero learns the actual selected trap and its prerequisites; zero passive MP regeneration,100MP.
2. Cast at900ms, then hold the living hero from901ms. The target is held throughout. A constructed poison clock ends the source at5000ms so observation has a finite bound.
3. Check one actual canonical skill action, one exact authored MP debit, immutable input, repeated recorded equality and recorded/unrecorded outcome equality.
4. Inspect subsequent direct damage separately from ordinary Burn dot events. Repeat six trap families at ranks1/20.
5. In native-trap-specials-final.test.ts, Death Sentry has one1HP victim and a living survivor. Observe a real first death, then check Lightning and a real shared-body consumption. For Blade Shield, let an actual enemy hit at2000ms after the one paid cast; inspect a later attacker-directed Physical reaction and absence of an immediate area attack.

Expected: paid fields/sentries keep attacking without another caster action/payment; Death Sentry shoots Lightning and explodes actual finite corpses; Blade Shield damages real attackers during its paid lifetime.
Actual: all six families produce only one direct cast-time hit at900ms. Wake of Fire/Inferno have later ordinary Burn ticks only. Death Sentry produces immediate Fire85–125/+7 and no corpse observations. Blade Shield produces immediate Physical95–135/+8 and no later retaliation.

## Evidence and controls

Exact evidence root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc/trap-red.
native-trap-red.json/log:12 mechanic failures/8 controls pass,8.536s. witnesses.json retains actual action/damage/payment/dot/death values. Unpaid cases never create later direct damage; Fire Blast remains a single hit; actual paid Blaze is observed at900/1900/2900ms through the same caster-control setup.
native-trap-special-final-red.json/log:4 valid mechanic failures,8.705s. special-final-witnesses.json retains literal ranks/payments/hits. All2524 repository runtime/test/config inputs, four external controlling inputs and HEAD remain unchanged during each run.
Earlier special attempts are retained: missing Blade Fury prerequisite invalidated the initial Shield setup; a subsequent unverified3300ms cadence assumption was corrected to source-derived2000ms. Neither failed setup is counted as Shield mechanic proof. Original controlling workspace bytes were separately retained and hash-matched.

Affected systems: engine-dev/content-designer/game-designer/frontend-dev/qa-engineer; root sole executor.
Root cause: the actual catalog registers eight scalar damage effects. No paid trap lifetime, scheduled attacks, shared corpse consumer or Blade Shield attack reaction is established by those registrations.
Workaround: none for the advertised mechanics. Recasting scalar skills or counting Burn ticks does not supply the missing behavior.

## Correction and acceptance

Follow docs/plans/decisions/D06-assassin-traps-v1.md. Establish strict JSON timing/ownership, native class/prerequisite projection and private committed shadow bindings; pay once, schedule finite ordinary damage, consume the existing once-only corpse FIFO, and gate Shield reactions against actual attacks. Preserve seeds/replay/resources and existing authored rank damage/payment. Add native lifecycle, rank/Command/forged-state controls and truthful bilingual UI/public combat/save/offline evidence. Whole-shadow, earned balance, independent review and full-v1 gates remain open.
