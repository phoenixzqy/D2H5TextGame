# D08 — Ordinary equipment uses the documented MF rarity roll

Status: BUG678 implemented and verified locally; full economy/balance acceptance open.

[Evidence](../evidence/p17-real-magic-find.md) includes native settlement,
production desktop/mobile×en/zh-CN, actual enemy-ID wishstone forks and materialized
rarity/currency deltas. Boss guarantee BUG680 remains a separate unfinished
requirement; removing fixed ordinary rarity does not satisfy it.

`drop-tables.md` §1/§3 requires base selection followed by rarity selection;
`idle-offline.md` applies its multiplier after the effective-MF curve. Every
shipped equipment pick currently forces rarity, making both sources of MF inert.

Remove only `rarity` from491 normal/magic/rare item entries in the31 ordinary
trash/champion/unique/jewelry/mini/boss/treasure-goblin tables. The closed delta
is `tests/fixtures/magic-find-rarity-v1.json`. Every such base uses the existing
roller, tier weights and materializer, including its documented rare downgrade
when a rolled unique/set template is unavailable. Report actual materialized
rarities, not merely requested ones. Fixed unique/set picks remain fixed; all
quest caches and material-only tables remain byte-equivalent as parsed data.

Bases, weighted selection, ordering, level envelopes, pick/noDrop policies and
direct rewards do not change. Random rarity now consumes its existing RNG draw;
later selections, affix generation and secondary rewards on that stream can
therefore differ from the defective source. Do not promise identical seeded
currency outcomes or item counts across the change. Measure those deltas with
fixed reward samples. No combat formulas, authored currency rates, save schema
or earned save changes. Prior campaign evidence stays historical and is not
replayed or converted into acceptance on this source.

This supersedes only forced normal/magic/rare assumptions in earlier D08/P15
preservation contracts. Preserve their base/level/weight and fixed-cache tests;
explicitly reconstruct the historical forced-rarity component for historical
seed-equivalence checks. A separate exact whole-data hash test binds the current
source to precisely the491 declared property removals.

Plan review: ready after accounting for RNG-stream changes, materialized rarity,
fixed-cache guarantees, historical tests and a native settlement test with real
tables. Use affected checks and local production browser verification only;
campaign diagnostics and preparation budgets remain closed.

Security check: pass; local data/tests only, no install, credential, network,
CI, permission or export-contract change. No external publication is requested.
