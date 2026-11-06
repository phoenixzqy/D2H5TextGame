# D09 — Optional chapter-boss unique rewards

2026-11-04. Implements the still-missing optional unique bullets in
`drop-tables.md` §5 under BUG680. First-kill rewards and broader acceptance remain
open. Work continues in the existing claimed human2 checkout without commits,
new agents, installations or campaign replays.

| Boss | Chance gate | Result after gate |
| --- | ---: | --- |
| Andariel |25%| One ordinary chapter-boss rarity attempt with unique weight ×5; only a unique result awards an extra item |
| Duriel |30%| One eligible unique |
| Mephisto |35%| One eligible unique |
| Diablo |40%| One eligible unique |
| Baal |50%| One eligible unique |

This preserves the spec's explicit distinction between Andariel's boosted
**attempt** and the other bosses' **extra unique**. The attempt's probability is
`5U / (N + M + R + S + 5U)`, using existing live-tier rarity weights, actual gear
MF and its offline multiplier. A failed gate or failed attempt awards no extra
item; it never replaces ordinary equipment or guarantees. There is no reroll
loop or first-kill eligibility implied by this optional reward.

The successful unique selects from the boss's existing equipment TC, filtered
to positive weighted, level-eligible bases with a materializable unique. Keep
source base weights and existing weighted template selection. All items retain
actual ilvl; qlvl/reqLevel, reviewed socket capacities and template weights use
the existing item materializer. No missing-template rare fallback counts as a
unique. A successful bonus with no eligible unique refuses the complete bag.

Add a strict schema/data/validated loader and precompilation registry binding,
injected separately as `chapterBossUniques` in award pools. Apply only to the
configured live `chapter-boss` with its matching act. Append after ordinary
rewards and rarity guarantees so per-call ordinary rewards remain intact; future
shared-stream kills intentionally change. Quest caches and other tiers do not
apply this policy. Material-only and historical component tests explicitly omit
this later independent policy rather than inheriting it into synthetic tables.

Plan: first reproduce missing rewards for all five bosses/three difficulties;
then wire the authored policy and bounded roller; verify chance edges, the
Andariel multiplier/MF formula, actual template/level gates, complete reward and
following-RNG determinism, caches/tiers, and native atomic inventory publication.
Run only affected loot/settlement tests, scoped types/lint and isolated production
build/precache/bridge checks. Retain failures and exact hashes; remove verified
disposable build/config output. No earned campaign/pacing/balance credit.

Plan review: **ready**. The distinct Andariel semantics, finite candidate pool,
source eligibility, missing-template refusal, ordering, historical fixture
isolation and native publication cover the material risks. Security check:
**pass**. Local authored reward rules; no new dependencies, permissions,
network, secrets, persistence format or external publication.
