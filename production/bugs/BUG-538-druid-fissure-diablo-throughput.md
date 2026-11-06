# BUG-538 — Restore capped Fire Druid throughput against Diablo

Status: locally fixed; full balance acceptance pending. Severity: High. Owner: root (content/engine/QA).

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained dirty source tree
0aea45836bd0aaee119c8c7f60a2b9c78eaf8d540f0c9a067a92601aef4d9f97.
Environment: Node24.21.0 production engine/store admission in WSL; viewport/locale
not applicable to this deterministic engine failure. Browser acceptance remains separate.

1. Restore retained `p15-druid-fire-act4-plains-continuation-v1.json`.
2. Apply the qualified owned Silks chest / three native Nef insertions and
   continue River425, native Forge/seal actions, Chaos426.
3. Resolve the last Chaos wave with Fissure20/Mastery16 and the original Rogue.
   Run seed and exact wave inputs/events are in the retained gzip journal;
   wave seed is `(runSeed ^ ((waveIndex+1)*0x9e3779b1)) >>> 0`.

Expected: a capped primary Fire Druid can defeat the mandatory boss within the
existing60s limit with earned preparation; ordinary armor/resistance/crit rules apply.
Actual: six Chaos wins, then Diablo44800HP/460armor/75%fire survives27747HP.
Hero remains253HP/428MP, no mana starvation. Owned offensive jewelry improves
next-entry damage but still leaves18860HP. Speed plus prospective39/Mastery20
also draws. Extra survival/growth alone does not address the damage budget.

Evidence: retained packet `d2-counted-source-z3jj3xa1`, native River continuation,
independent River readback, and `p15-druid-fire-act4-chaos-forecast-v1.json`.
Affected systems: authored Fissure scaling, registered fire combat, bilingual
skill preview. Workaround: none demonstrated within this Fire build.

Proposed root fix: a single provisional rank-growth coefficient180→400, preserving
rank1,20MP,3sCD, targets/Burn, boss defenses and save format. Exact frozen native/
next-entry inputs and fixed seeds must be compared before/after; only affected
fire combat/schema/UI validation. This is not whole-game balance acceptance.

Local outcome: coefficient400 plus owned offensive jewelry qualifies all seven
Chaos waves; native427 defeats Diablo42508ms and claims Terror once. Independent
complete readback passes.162 affected checks pass; scoped types/lint pass. Exact
source transition: p15-druid-fire-act4-fissure-source-binding-v1.json. No commit
or publication. Bounded tuning is not full build/holdout/fairness acceptance.
