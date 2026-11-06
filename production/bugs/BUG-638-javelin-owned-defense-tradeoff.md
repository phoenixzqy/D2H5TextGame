# BUG-638 — Evaluate owned defensive tradeoffs for intended Javelin

- Status: Candidate rejected and restored; intended Javelin progression remains open.
- Severity: Medium (campaign policy; early progression remains unresolved).
- Affected systems: intended campaign equipment selection; root owns this work.
- Build: accumulated `feat/playable-foundations`; production tree
  `12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
- Environment: Node24.21.0 / WSL, installed native store diagnostic; no browser
  viewport, locale-independent. No runtime or authored data defect established.

## Reproduction

1. Inspect the earned intended Javelin Act I journal's level7 gear boundary.
2. Current normal skull cap `it-5xhh3-c9` has13Defense. Owned eligible rare cap
   `it-zoq1-dh` has12Defense, +8Life, +6Mana, +2%physical dodge, and
   +7cold/+5lightning/+5poison resistance.
3. The canonical profile uses owned-build selection without early survival.
4. Observe `score:30`, `upgrade:false`; the cap stays unequipped because the
   monotone comparison rejects any negative delta, including one Defense.

Expected: an explicit survival policy evaluates that owned tradeoff through
native mitigation while preserving Attack/speed/Mana floors and item custody.
Actual: intended Javelin never evaluates the survival gain. Both retained Den
defeats persist (ordinals40/49, wave index3); this does not prove that the cap
alone resolves progression. No missed physical weapon upgrade was found.

## Proposed correction and validation

Opt only intended Javelin into existing `owned-balanced-v1` early survival.
Preserve all final skill targets, stats, rotation, threats, earned ownership and
native training/retry limits. First reproduce cap refusal in a native equipment
regression, then require resource/economy/custody conservation and idempotence.
Run only affected checks, scoped strict types/lint, and one earned Act I route.
Adopt only on a full clear and independent journal/save readback; otherwise
archive and restore both candidate files without further tuning or replay.

## Verified result — 2026-11-03

[Trial report](../../docs/balance/2026-11-03-javelin-owned-defense-rejected.md):
the exact-cap regression first reproduces refusal, then six affected checks,
scoped strict types and explicit lint pass with the opt-in. The first lint
invocation ignored campaign files; its nonpassing receipt is retained.
One fresh earned route reaches12 with112admissions/310waves/306wins/four
defeats. It clears Den55, earns the level12 training target, then loses Cold
Plains109 and recovery Den111. No first boss entry or Act I clear.

Independent full journal/native-save/custody/economy/clock/payment readback
passes and observes seven native survival equips. Before the run, its pool
checks were corrected to match canonical `min(previous,newMaximum)` clamping;
no healing is allowed. The candidate fails its frozen adoption criterion.
Both modified files are archived externally and restored to exact baselines;
all2151production/131campaign inputs match. No replay or further tuning.
The cap refusal is real, but this policy does not establish a viable intended
route. No production defect fixed or balance acceptance claimed.

Evidence packet (root retains through umbrella review):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-javelin-owned-defense-v1`. The frozen plan identifies the original
journal, exact candidate inputs, bounds, adoption rule and cleanup ownership.
