# BUG-760 — Show explicit damage immunities on combat cards

Status: Fixed locally; focused/browser verification passed; independent acceptance pending.
Severity: Medium; the player can change damage types, but the
target card does not explain the need. Date: 2026-11-05. Owner: root, solo,
acting as frontend/QA. Affects combat target readability (P16/F15) and encounter
fairness (P15). Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited
local changes. Environment: WSL, Vitest/jsdom; both en and zh-CN. Browser
verification will use Chromium at the five target viewport sizes. Seed13 only
constructs native monster metadata; no battle or earned campaign is run.

## Reproduction

1. Build native Andariel/Mephisto with the monster factory and render them on
   the real CombatScreen in a paused constructed encounter.
2. Read each target card before dealing damage.
3. Run src/features/combat/CombatScreen.damage-immunities.test.tsx.

Expected: a readable localized "Immune to poison damage" label on both cards,
including the compact battlefield layout. Actual: cards display identity, Life,
buffs and statuses, but omit explicit damageImmunities. All three causal tests
fail because the immunity list/items are absent. Their native control units
remain susceptible despite numeric resistance100 or poison-status protection.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-combat-immunity-labels-42kpjvyt/red.log.
The earlier red-setup.log is an invalid test-fixture failure, preserved separately;
its corrected fixture supplies the factory's actual tier argument.

## Cause and scope

UnitCard does not consume CombatUnit.damageImmunities. Render that metadata
directly through localized type labels, outside the compact/normal branch.
Never infer damage immunity from numeric resistance or status immunity. No new
immunity, encounter tuning, combat/RNG, save-format or reward change is needed.
Plan review: ready; security check: pass for local first-party UI work. Retain
new/adjacent component checks, scoped types/lint and bounded browser evidence.
No campaign replay or exhausted sample/retry allowance renewal.

## Local resolution

Combat cards now expose explicit damage immunities in a named semantic list,
with localized type names and readable wrapping14px labels. Native Andariel/
Mephisto, susceptible resistance/status controls, all seven supported types,
mounted locale changes and removal on team replacement pass. All13distinct
affected cases pass; the final3new cases also pass after redundant ARIA-role
cleanup. Strict scoped TypeScript654files/zero diagnostics and final explicit
lint pass. Chromium verifies both locales at all five target sizes; final-source
mobile/desktop checks additionally verify scroll reachability of all seven
labels. No combat/campaign or balance acceptance follows.

See [local evidence](../../docs/plans/evidence/p16-combat-damage-immunity-labels.md).
The named packet is retained by root through full-v1 acceptance, then removed.
