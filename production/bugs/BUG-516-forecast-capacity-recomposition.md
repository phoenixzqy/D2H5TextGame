# BUG-516 — Clamp carried diagnostic pools to changed equipment capacity

Status: corrected in task driver v5; bounded native agreement passed. Severity: Low.
Owner: root. Environment: WSL / Node24, pure restored-store diagnostics.
Base HEAD: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, current dirty source.

Reproduce: inspect `recovery-physical-ring-no-control` W5, seed4080632751,
in `p15-barbarian-next-bloody-policy-v10.json`. Its input carries788.59HP
from the larger-capacity ring into gear with743.65 maximum HP. The manual
forecast refreshed stats without the native next-wave resource clamp. It also
did not refresh current equipment's mana-regeneration fields.

Expected: preserve absolute carried HP/MP on increases, clamp on capacity
decreases and refresh fresh mana regeneration. Native `stageWave` already
does this. No healing or refills from a gear swap. Actual: the diagnostic can
temporarily overstate the carried pool. No production bug or earned-save
change. Both executed v10 candidates drew; no accepted win or native suffix
depends on the projection. Earlier negative outputs stay retained.

Correction: version the diagnostic, refresh current regeneration and clamp
the hero's carried pools for this non-temporary-buff policy. Validate scoped
types/lint and exact input-pool bounds in the next owned-gear comparison.
This diagnostic does not establish support for arbitrary paid temporary buffs.
Evidence retained in root's packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Security check: pass; local diagnostics, no grants, engine/save change or bypass.

## Completed local verification

Completed: v5 refreshes regeneration and clamps absolute carried pools;
barbarian-next-area-types-v7/lint-v7 pass. v11/v12 inputs enforce pool bounds,
and every selected v12 wave exactly matches native Bloody888 HP/MP/time,
independently checked by p15-barbarian-bloody-progress-summary-v1.json.
No arbitrary temporary-buff support or broad acceptance is inferred.
