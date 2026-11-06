# BUG-636 — Traps delays Blade Sentinel investment behind weaker early scaling

Status: Fixed/verified for the declared Act I route (uncommitted working tree).
Severity: Medium. Owner: root (campaign policy).

## Accepted correction — 2026-11-03

[Evidence](../../docs/balance/2026-11-03-traps-blade-investment.md): seven affected
checks/scoped strict types/explicit lint pass. One fresh native campaign clears
Act I at12 with107admissions/310waves/310wins/zero defeats. Full independent
journal/native-save/economy/clock/payment readback passes without replay after
correcting a reader assumption about mid-admission level-ups. Both original
reader and failure are retained. No production change or later-act/population
acceptance; final ranks and original native limits remain intact.

## Reproduction

Native Node 24/WSL; no browser/viewport/locale dependency. Working HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production tree
`12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
Retained evidence: external packet `d2-counted-source-z3jj3xa1`,
`p15-first-entry-intended-act1-v1/assassin-traps-intended-v1.json` and its
`.journal.jsonl.gz`.

1. Create the intended Traps profile at timestamp 1793469600000.
2. Follow the existing earned Act I route, native point allocation, owned gear,
   acquisition training and recovery limits.
3. Observe Catacombs admission 130, wave index 4, run seed 900012853.

Actual: level 14 has Blade Sentinel 1 / Charged Bolt Sentry 5 / Web 6 /
Fire Blast 5. The hero dies with minimum observed mana 250, leaving an elite
with 711 Life. Earlier failures at ordinals 104 and 118 also retain Blade 1
despite repeated physical and lightning field casts. No mana starvation.

Expected: invest early earned points in effective selected damage, retaining
the physical/lightning identity, both level-12 unlocks and all final targets.

## Diagnosis and bounded correction

`growCampaignBuild` fills targets in declared order. The intended policy fills
Charged Bolt Sentry 12 before Blade Sentinel 8. Authored per-rank damage growth
is 4 for the former and 120 for the latter. This is a campaign investment
defect; it does not establish an engine or authored-number defect.

Move the existing Blade 8 target immediately before CBS 12, below Lightning
Sentry 20. Preserve final ranks, early rank-one unlocks, rotation, stats, gear,
training, reset and retry limits. Before adoption: focused native sequential /
batched allocation, conservation, final-target and paid field-delivery checks;
scoped strict types and explicit lint; exactly one fresh earned Act I campaign
at the same timestamp. Adopt only on full Act I clear plus independent journal /
native-save / custody / economy / clock / payment readback. Otherwise archive
the candidate and restore the exact two-file baseline. No retries, seed search,
limit extension or production tuning in this trial.

Affected systems: campaign growth and progression evidence. Packet prefix
`p15-traps-blade-investment-v1`; root retains required evidence through umbrella
review. This trial cannot establish later-act or population balance acceptance.
