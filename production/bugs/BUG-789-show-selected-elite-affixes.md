# BUG789 — Show selected elite affixes on cards and logs

- Severity: Medium — selected enemy modifiers are invisible to the player.
- Status: Locally implemented and verified; uncommitted; full-v1 acceptance remains open.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux; jsdom full CombatScreen and Chromium 147 at 360×640 / 1280×800; en/zh-CN.
- Seed: 7.
- Affected systems: frontend-dev/engine-dev; root owns this solo increment.

## Reproduction

1. Construct an Act II champion through `buildEnemiesForWave` with a selected live elite affix.
2. Resolve its combat name and stage its native recorded battle.
3. Mount the paused CombatScreen with that enemy in either locale.

Expected: monster-spec §9's visual affix tag identifies the selected modifier on the card and in combat-log names. Actual: construction discards `eliteAffix.nameKey`; neither surface can show the tag. Ordinary enemies and unmodified bosses must remain unlabelled.

Evidence: all five executed cases in `src/stores/combatHelpers.affix-display.test.ts` and `src/features/combat/CombatScreen.affix-display.test.tsx` fail causally for missing native metadata/card labels. RED report and exact preimages are retained in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-affix-visibility-o064bocg`.

Security check: pass; trusted local presentation requirement, React text rendering, no credential, dependency, permissions, CI, save-format or publication change. Workaround: inspect authored data outside the game.
## Resolution and verification

Selected `eliteAffix.nameKey` is retained as transient presentation metadata.
Combat names append its localized icon/text tag; cards render one wrapping,
accessible badge outside their truncated name. Ordinary/unmodified bosses,
unknown keys and non-monster units remain unlabelled. No save migration,
affix selection or mechanics change.

Six new focused cases and seven existing naming/immunity cases have latest
passes; 25 filtered cases were skipped, not passed. Scoped strict types and
lint pass. Four bilingual mobile/desktop real Chromium fixtures verify the full
paused CombatScreen and recorded-wave log names without console errors/warnings,
request failures or horizontal overflow. Some decorative emoji lack WSL font
glyphs; full modifier text remains readable. Root self-review only. Exact reports,
initial failures and cleanup are linked in
[the evidence record](../../docs/plans/evidence/p15-elite-affix-visibility.md).
