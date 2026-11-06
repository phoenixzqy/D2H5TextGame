# BUG-678 — Restore Magic Find on ordinary equipment drops

- **Status:** Fixed locally on retained source at HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`; uncommitted.
- **Severity:** High; equipment MF and the offline MF reward have no production effect.
- **Owner / affected systems:** Root / authored loot, reward integration and QA.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
- **Environment:** WSL; engine/store reproduction, browser-independent, both locales.
- **Seed:** 7 for native settlement; deterministic boundary inputs for rarity tests.

## Reproduction

1. Load all38 shipped treasure classes through `loadAwardPools`.
2. Observe that every equipment pick has an explicit `rarity`.
3. Roll ordinary equipment with MF300, with and without the1.5 offline multiplier.

**Expected:** `drop-tables.md` §1/§3 and `idle-offline.md` §6 require
ordinary base selection followed by MF-modulated rarity. Deliberately fixed
quest rewards and authored unique/set picks retain their guarantees.

**Actual:** All equipment bypasses `rollRarity` at `pick.rarity ?? rollRarity(...)`.
Even the store's existing MF test substitutes an unforced fixture table; it
cannot detect that MF is ineffective for every shipped table.

## Evidence and correction scope

Closure: [production MF evidence](../../docs/plans/evidence/p17-real-magic-find.md).
Regression: `src/engine/loot/production-magic-find.test.ts`, native
`combatHelpers.idle-bonus.test.ts` and all four production
`tests/pwa/magic-find-rewards.spec.ts` cases, including actual enemy-ID forks.
Economy acceptance and separate boss guarantee BUG680 remain open.

The original38-table inventory and exact source snapshots are retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-real-mf-v1`.
Restore random rarity on491 normal/magic/rare equipment entries in31 ordinary
tables. Preserve all bases, ordering, weights, level bands, direct rewards,
fixed unique/set entries, and all quest-cache tables. The JSON fixture declares
the exact removal indices and predecessor hash so preservation is testable.
Historical rarity-preservation promises are superseded only for these entries.
No saved item is regenerated and no historical campaign reward is backfilled.
