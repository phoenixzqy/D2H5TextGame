# BUG-299 — Enable advertised Shadow Warrior and Shadow Master skill use

Status: Open — initial native skill-use repair passes actual branch full/static/public checks; complete copied charge/trap and independent/earned acceptance remain open.
Severity: High — both advertised skill-using summons only perform basic attacks.
Affected systems: engine-dev, content-designer, frontend-dev, writer, qa-engineer.

## Reproduction

Build:29c3b2ad7ffd4818bae55546593bb63a1245bf7d. Native Vitest/jsdom deterministic simulation, seed7; locale-independent runtime, English promises in skills.json (Chinese parity also required). No browser viewport or earned campaign claim.

1. Create a synthetic level30 Assassin with29 skill points. Recursively allocate the actual shadow prerequisites and Fire Blast, with the selected shadow at rank1 or20.
2. Select the shadow and learned Fire Blast in native active priority; use playerToCombatUnit. Hold the owner/target with permanent synthetic Stun to isolate startup body behavior.
3. Run real recorded combat. Require one paid native shadow spawn/action and positive basic HP loss by the body.
4. Require the Warrior to use the selected learned Fire Blast, or the Master to use any real skill independently.

Expected: Warrior can use the owner's eligible selected attack skills; Master has genuine independent skill use, as advertised. Safe exclusions/AI/payment/body data need an explicit implementation contract; no recursive summons or borrowed owner MP.
Actual: all four native rank1/20 cases pass allocation, payment, spawn and positive basic-damage controls, then fail the skill-use assertion. Bodies have empty skillOrder and zero mana capacity.

## Evidence and cause

Root-owned task:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_. assassin-shadow-skills-repro.test.ts and assassin-shadow-skills-native-red.json/log/inputs/process: four genuine assertion failures, exit1/18.575s, all2495 inputs/HEAD exact. This diagnostic is outside the required suite and intentionally remains RED until implementation.

src/engine/skills/summons.ts defines both bodies in TS and registers both with the default empty skill list; common body tuning has zero mana. Native startup preparation creates real bodies but supplies no copied or independent skill configuration. Merely moving body stats to JSON or crediting their positive basic damage would leave the missing promise intact. Workaround: use them as basic attackers; skill use has none.

Security check: pass for authorized first-party local data/combat/UI repair. No dependency, credentials, CI, networking, save format, campaign or remote action. Root sole writer; independent design/QA and earned balance remain open. No skill credit from this reproduction.


## Prospective implementation checkpoint

[D06 author contract](../../docs/plans/decisions/D06-assassin-shadow-skills-v1.md)
records skill ownership, independent policy, resources, captured ranks and
lifecycle boundaries. Original four native RED cases now pass in a strict
19-path source overlay;212native/policy/body/preparation plus176model/UI
cases pass, and six native lifecycle cases pass. Real production public
8/8PASS187.274s covers both shadows/en/zh/desktop/mobile/rank1/20, positive
typed skill damage,80geometries,16seven-domain pairs/eight actual offline
Continues. Product source promotion and real-branch gates remain required;
full copied charge/trap behavior, earned balance and independent acceptance
remain open. No skill inventory credit yet.


Local runtime/UI and permanent lifecycle/public tests are now committed. [D06 branch evidence](../../docs/plans/evidence/d06-assassin-shadow-skills.md) and its compact packet retain per-increment tests/types/lint,396distinct focused cases/10files, real branch production/precache checks and prospective public8/8 proof. Full shadow credit still waits actual charge/trap runtime and final branch/independent/earned gates. Original RED evidence now lives in the verified support raw archive linked by the packet; the original task directory was exactly cleaned.


## Final committed checkpoint

Frozenadc8528b/all2509inputs: full19369PASS/907files/two existing opt-in skips,
fulltypes/lintPASS and actual branch public8/8PASS232.528s. Audit confirms16paid
summons and positive typed skill hits,80geometries,16exact seven-domain pairs,
eight actual offlineContinues. All16mobile originals inspected with documented
limits. [Final evidence](../../docs/plans/evidence/fixtures/assassin-shadow/branch-final-gates.json)
retains exact receipts and the2014-member read-back-verified raw archive, followed
by exact cleanup with remaining[]/failures[]. The initial empty-order/zero-mana
failure is repaired locally. Keep full copied charge/trap behavior and final
independent/earned acceptance open; no shadow skill credit yet.
