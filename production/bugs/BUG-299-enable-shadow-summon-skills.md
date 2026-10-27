# BUG-299 — Enable advertised Shadow Warrior and Shadow Master skill use

Status: Reproduced; no implementation yet.
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
