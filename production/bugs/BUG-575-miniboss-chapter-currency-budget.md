# BUG-575 — Ordinary bosses inherit the chapter-boss wishstone budget

- Severity: Medium; recruitment economy, repeated boss farming.
- Status: Fixed; ordinary-boss table and component checks verified.
- Owner: root, sole writer; current claimed worktree.

`drop-tables.md` §9 and `gacha-spec.md` §2 distinguish mini-boss6–10 from
chapter-boss8/12/16/24/40. The runtime defaults give both tiers the chapter
array. An ActV Foothills victory contains four ordinary boss-tier kills:
their secondary grant is160wishstones before direct TC currency. That error
repeats on every farm. The retained7020wave census pins every source/journal,
matches native waves and counts actual rewarded dead nonsummon units.

Correction: author ordinary `boss` amounts6/7/8/9/10 by act. Keep chapter
amounts8/12/16/24/40, current boss difficulty multipliers and all other reward
rules. This is a bounded component correction, not full80wishstone/h or
acquisition acceptance. The one adaptive Normal-chain counterfactual reduces
wishstones98,607→50,900, still2503.283per combat hour. Do not mutate that save,
regrant rewards or claim a new earned campaign from this projection.

Plan review: ready; data-only existing-schema correction plus focused tests.
Freeze15act/difficulty tier regressions before editing. Derive the new1680case
digest from the retained old rows by replacing only ordinary-boss wishstones;
verify all other outputs and following RNG unchanged. No battle, earlier-act
route or browser replay; exact reward-component checks cover all affected acts.
No saved shape or migration. Historical extraction compatibility stays retained.

Security check: pass; local authored numbers/tests/docs only. No dependency,
credential, external input, permission, CI, network or publication change.

## Outcome

Ordinary boss6/7/8/9/10 now differs from unchanged chapter8/12/16/24/40.
15new regressions fail before;134affected checks/scoped types/explicitlint
pass after. Pre-derived1680case digest matches production; exactly240boss
wish fields change, all other rewards/following RNG remain equal. Census
projects47,707fewer wishes without gameplay/save/wallet mutation. The80/h
and full economy gates remain open. [Report](../../docs/balance/2026-11-02-miniboss-wishstone-budget.md); authority21.
