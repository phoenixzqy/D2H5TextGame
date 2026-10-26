# BUG-243 — Show actual Necromancer direct-spell rules

- Status: local presentation repaired/verified in a0cf908b; complete skill acceptance remains open. No new skill credit.
- Severity: Medium — mechanics work in controlled fixtures, but detail omits rules.
- Owners: root, engine display/frontend/i18n; independent design/QA open.
- Base:2e70eddb; Node24.21.0, Vitest1.x, pure native simulation and jsdom UI.
- Browser/viewport: not yet a browser reproduction; component DOM, en/zh-CN.
- Seeds:7/19/41/97; ranks1/2/20 native,0/1/2/20 bilingual UI.

## Reproduction

1. Run the three new necromancer-direct causal/display/Skills tests.
2. Inspect authored Poison Nova metadata: two Poison stacks,5% final-hit/s.
3. Open each direct spell detail at unlearned/current/next/MAX in both locales.

Expected: actual recipient scope, payment/CD and typed mitigation agree with
native combat. Nova exposes its two-stack rate, duration5s and cap10, rather
than suppressing the periodic rule or inventing final DPS.

Actual: all60native payment/recipients/damage/rate/expiry/authority/mitigation
controls pass. Five Nova preview cases fail because periodic is undefined;
32localized details fail because generic text omits recipient/resource/mitigation
rules (and Nova periodic details). One invalid-metadata control passes.
37RED/61PASS total; no mechanics defect is inferred from presentation RED.

## Evidence and cause

Initial direct-red log/terminal receipt retained by root in
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necro-direct-eza_lfus/.
Run9.876s,exit1. New tests:src/stores/necromancer-direct.causal.test.ts,
src/engine/skills/displayStats.necromancer-direct.test.ts and
src/features/skills/SkillsScreen.necromancer-direct.test.tsx.

periodicDisplay accepts only one-stack payloads; Nova's valid two-stack poison
is excluded. The generic damage description replaces authored copy and lacks
these four skills' actual scope/rules. Extend the existing pure descriptor only
for valid counts within the shared cap, preserve old one-stack shapes and
Bleed2 rejection, then reuse it for bilingual periodic prose and explicit scope.
[D04 author contract](../../docs/plans/decisions/D04-necromancer-direct-v1.md).

Workaround: numeric damage/cost/CD rows remain available. No genuine save,
campaign/replay, external publication, dependency or tuning change occurred.

## Presentation validation

[Evidence](../../docs/plans/evidence/d04-necromancer-direct.md): focused135/5, engine8484/317, full17173/775/two existing skips, types/lint/build/precache/bridge pass. Production4/4 en/zh desktop/mobile and exact save/offline pairs pass. This initial browser matrix does not assert individual casts. Native allocation/wave/import and repeated-Poison proof remain open; no inventory credit.
