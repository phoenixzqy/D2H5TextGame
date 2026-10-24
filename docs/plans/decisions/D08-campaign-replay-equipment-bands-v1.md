# D08 — Finite campaign/replay equipment bands

Root scoped reconciliation for BUG152; independent acceptance pending.
G4 requires legal equipment for every reachable reward context. Existing v1
replay profiles change monster levels (+20 Nightmare) while retaining table
IDs; no new difficulty multiplier or alternate table policy is introduced.
The old drop-tables tier-shift sketch is not the implemented replay contract.
This decision closes eligibility under the current level-only replay model;
full quality/acquisition/economy/balance acceptance remains required separately.

Extend only the highest existing equipment band in each live act table to its
finite resolved Nightmare ceiling. An entry qualifies when its `maxLevel`
equals the highest item `maxLevel` in that table before this change. Preserve
all lower rows, minima, bases, weights, rarity, direct rewards and cache tables.
Never cap monster/item levels or substitute a table in the roller/loader.

| Live table | Normal ceiling | New equipment ceiling (Nightmare) |
| --- | --- | --- |
| trash-act1 | 18 | 38 |
| mini-act1 | 12 | 32 |
| act1-boss | 19 | 39 |
| trash-act2 | 31 | 51 |
| mini-act2 | 28 | 48 |
| act2-boss | 32 | 52 |
| trash-act3 | 46 | 66 |
| mini-act3 | 43 | 63 |
| act3-boss | 47 | 67 |
| trash-act4 | 61 | 81 |
| mini-act4 | 56 | 76 |
| act4-boss | 61 | 81 |
| trash-act5 | 82 | 102 |
| mini-act5 | 75 | 95 |
| act5-boss | 82 | 102 |

These bounds include authored difficulty bonuses, encounter spreads, wave
offsets and chapter-boss levels. Top-band entries remain eligible beyond their
former ceiling, so high-level eligibility can change relative weight there;
existing eligible pools below those former ceilings stay identical. This is
not a promise of better equipment or a guaranteed drop on every kill. Neither
equip requirements nor affix/rarity/material rules change.

Supersedes BUG151's exact upper31 exclusion and the earlier ActI boss upper19
exclusion only; the previously repaired Normal contexts remain covered. No
earned save, consumed attempt or historical reward is edited or backfilled.

Verification: causal RED before data edits; continuous level-domain eligibility
through each finite cap, both profiles' real planners across all29 areas and
all13 count residues, native materialization at previously empty boundaries,
exact top-band one-above exclusions, unchanged lower pools, schema, existing
rewards/replay tests, full unit/type/lint/build. Planner seed samples do not
certify the full combat RNG period, all unique/set outcomes or G4 balance.

Plan review (`plan-review`): ready after adding explicit finite caps, preserving
the earlier bound tests under this superseding contract, and distinguishing
eligibility/materialization proof from economy or earned campaign acceptance.
Root self-review only. Security check: pass; local data/test changes only.
