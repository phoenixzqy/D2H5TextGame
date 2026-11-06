# BUG-658 — Restore ordinary throwing weapon upgrades

- **Status:** Fixed/verified locally in retained uncommitted source — ordinary
  content availability, equipment and persistence; campaign balance remains open.
- **Severity:** High — the intended weapon family has no ordinary upgrade path.
- **Owner:** root; content-designer/game-designer responsibilities, self-reviewed
  under the session's no-new-agents constraint.
- **Affected systems:** Item bases, ordinary campaign loot, bilingual item names.

## Reproduction

- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
  human2 source; exact affected before bytes/hashes in evidence packet below.
- Environment: WSL/Linux, JSON inspection; browser/viewport/locale not needed
  to reproduce this authored-content omission.
- Seed: not RNG-dependent. Related retained Act IV seeds are
  3385400074/4018905663/4070659197; do not replay them.

1. Filter `src/data/items/bases.json` by `weaponType === 'throwing'`.
2. Resolve ordinary throwing references in `src/data/loot/treasure-classes.json`.
3. Inspect the retained Double Throw level49 terminal save.

## Expected

A weapon-based intended build can find equip-eligible throwing upgrades through
ordinary campaign sources, following the established one-handed damage curve.
Saved starter items retain their identity and stats.

## Actual

Only `items/base/weapon-throwing-knife` exists: level1, physical4–8, no sockets.
Its sole ordinary loot reference is Act I trash. The retained level49 hero still
equips a normal starter knife with Attack8. BUG656 separately records three Act
IV draws; the content omission does not alone prove their complete cause or fix.

## Evidence and remedy

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-throwing-progression-v1`.
`before-source.json` and `before/` retain exact affected predecessors. The earned
terminal export remains untouched (SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`).

Implemented the bounded [decision](../../docs/plans/decisions/P15-throwing-weapon-progression-v1.md):
five additive tiers and ordinary loot access, preserving all prior entries and
the existing zero-socket throwing rule. [Verification](../../docs/plans/evidence/p15-throwing-progression.md)
records 176 distinct affected unit checks, four final Chromium passes, scoped
strict types/lint and exact additive preservation. Full balance,
earned acquisition and Act IV completion require separate evidence; attempts
706–708 and preparation limits stay exhausted.
