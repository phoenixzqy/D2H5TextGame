# BUG788 — Complete standard Lightning Enchanted

- Severity: High — two advertised standard-affix mechanics are absent.
- Status: Locally implemented and verified; uncommitted. Root self-review only; full private-v1 acceptance remains open.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux native engine; en/zh-CN. Browser verification: Chromium360×640/1280×800.
- Seed:7.
- Affected systems: engine-dev/content-designer; root owns this solo increment.

## Reproduction

1. Read the actual `elite-affix/lightning-enchanted` live row.
2. Build a standard later-act champion/rare carrier through `buildEnemiesForWave`.
3. Strike it with a surviving hostile attacker.

Expected: +50 lightning resistance (existing cap75) and25%chance to retaliate with one lightning bolt. Actual: only active `monster-lightning`; no resistance metadata or receiving-hit reaction. The legacy AI descriptor is not the native wave path. D07v1c's actual promoted ActI special leaf is an explicit exception and must stay unchanged.

Evidence: `docs/design/monster-spec.md §9`, `docs/plans/decisions/D07-act1-lightning-affix-v1.md`, live elite JSON, factory and shared damage settlement. Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-lightning-affix-ru4ypvkc` holds preimages and the reviewed bounded plan. No gameplay workaround; no pending user question.

## Review finding — secondary impact bolts

Source review found that on-hit secondary impact bolts call shared damage settlement
without an auxiliary discriminator. The new Lightning reaction would therefore roll
again for each secondary bolt, contrary to the frozen direct-strike-only rule.
Reproduce with one direct strike carrying three same-target impact bolts; expect
one retaliation roll and one carrier bolt, with all three player bolts preserved.
Security check: pass; local combat classification and focused tests only, with no
credential, dependency, network, permission, CI or publication change. Root solo
uses the root-cause-fix and test-driven-development workflows.

## Resolution and verification

Authored standard resistance/retaliation now flows through schema, factory and
shared receiving-hit settlement, preserving actual promoted ActI's exception.
The secondary-impact classification finding is corrected at its dispatch site.
Two causal native RED reports demonstrate missing construction/retaliation; a
third executed regression demonstrates four bolts instead of one before review
correction. Initial109 cases and final34 affected cases pass (118distinct latest
passes). Scoped strict types and affected lint pass. Four en/zh mobile/desktop
Chromium CombatLog fixtures pass; the final zh mobile rerun adds a real native
secondary-bolt check and passes. No full suites, campaigns or pacing acceptance.
See [evidence](../../docs/plans/evidence/p15-standard-lightning-affix.md).
