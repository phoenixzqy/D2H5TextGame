# BUG-709 — Align later mercenary XP costs with earned rewards

Status: Locally fixed; earned pacing/population acceptance remains open.
Severity: High (shared mercenary progression).
Owners: game-designer/content-designer/engine-dev; root implements locally.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
Native TypeScript store arithmetic; browser/viewport/locale/seed not applicable
to this deterministic no-combat reproduction.

1. Evaluate `mercXpForLevel(31)` and `mercXpForLevel(82)`.
2. Compare the exponential costs4,873,191 and8,344,045,038,748 with the current
   polynomial hero-cost/kill-reward rules in `docs/design/kill-xp-policy.md`.
3. Sum hero costs through81 and hypothetically apply75% to a level1 mercenary:
   hero cumulative139,623,865XP advances the mercenary only to37.

Expected: later earned mercenary advancement should scale with reward growth.
Actual: the canonical store formula assumes exponential reward growth that the
authored game does not provide; costs increasingly outrun income.
Root cause: `mercStore.ts` applies `floor(60*L*1.3^(L-1))` at every level.
Workaround: none adopted; no free XP, level repair or campaign retry authorized.

## Decision and evidence

[Selected policy](../../docs/design/merc-xp-policy.md) retains costs1–18 and
uses the anchored2.5 power curve afterward. Existing saved thresholds remain
authoritative until consumed; no migration or historical XP grants.
Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-xp-policy-n89no0k9`.
`arithmetic-before.json` reproduces costs and labels population arithmetic as
hypothetical. Original edited-source snapshots are under `before/`.
This finding does not prove a specific Ancients/Izual outcome or pacing target.

## Local implementation result

No commit created. The shared store now reads a validated immutable JSON policy;
registered browser precompilation includes its schema. Four new store cases
first fail on the original exponential costs. After correction,43selected
progression/schema cases pass, including old-threshold consumption, multi-level
spillover, manual upgrades, missing progress and inactive exclusion. Strict
scoped types and explicit five-file lint pass. No unrelated act/test/build replay.
Exact receipts/source deltas and verified cleanup are retained in the packet;
[verification](../../docs/plans/evidence/p15-merc-xp-policy.md). No native XP,
admission, successor, pacing or campaign credit is created by these fixtures.
