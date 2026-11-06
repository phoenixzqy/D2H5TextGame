# BUG-543 — Restore useful Poison Javelin rank growth against campaign mitigation

Severity: High. Status: implemented locally; affected regressions pass; broader balance pending.
Owner: content-designer / game-designer; root is sole writer for this goal.

## Reproduction

Dirty implementation branch `feat/playable-foundations`; production tree
`400dec2b862ed5daa341e54fe1faad25f64241efece16983070011c70ffc0a68`, data
`2e2ed866f9409ea93571535762475d54f7bbce73202c1a65323abc07d59171aa`.
Node24.21.0 production-store simulation; no browser, viewport or locale involved.

1. Restore earned `amazon-javelin-poison2-impale1` save at12/XP21631/ordinal107.
2. Admit Catacombs from that exact timestamp/ordinal; retain its native run seed
   and complete initial teams in the packet forecast below.
3. Compare inherited priority, sustainable Poison-only priority, owned spear with
   paid Elds/armor, native skill/stat reset diagnostics, then explicit projected
   level18/24 controls. All projected state/income is discarded.

Expected: investing earned ranks into the Javelin area skill should give useful
pack damage against the next Act I area. More levels alone should not be required
when the skill's growth is the limiting capability.

Actual: sustainable priority preserves mana but does not clear Catacombs. Even
level24/Poison20/633HP/32MR diagnostic loses W5 with all15Dark Stalkers still alive.
The hero has203mana at death. Rank20 base77–92, poison resistance and flat MR
leave very little direct area damage against the front rare. The uninvested
starter damage is not the defect; +3damage per rank fails to grow the skill.

Evidence: packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
`p15-javelin-act1-level-capability-forecast-v1.json`, row
`diagnostic-earned-level24-poison-vitality`, W5, and preceding retained controls.
The full initial teams, run seed, event stream and source pins are retained there.
Independent earned source audit: `p15-javelin-earned-source-readback-v1.json`.

## Proposed correction and verification

Change only Poison Javelin's linear damage growth3→15. Rank1 remains20–35;
rank10 becomes155–170 and rank20 becomes305–320. Costs, cooldown, shape, target
cap, hit rules and5%-of-final-hit Poison remain unchanged. Preserve all other
Amazon rows and update the existing native rank20 hit/DoT and bilingual preview
expectations. Compare the same restored native source and preparation afterward.

This targets the early earned route. Later-act/build balance, equal-investment
cross-class invariants, disjoint holdouts and the full1000-seed release balance
matrix remain pending; a local result is not a full balance signoff.

## Local outcome

Four-file change includes the exact Poison schema contract3→15. Native20/20,
lifecycle18/18 and bilingual preview40/40 passed; the follow-up Ajv88/88 passes.
Rank1 remains unchanged. Actual earned level12 Catacombs wins6/6 and Sisters
Claim passes independent readback. Source transition is pinned in the packet;
no commit was created. Wider balance remains CONCERNS; see
`docs/balance/2026-11-01-poison-javelin-growth.md`.
