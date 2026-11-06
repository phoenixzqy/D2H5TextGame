# BUG-539 — Restore Fire Ball rank damage against ordinary armor

Severity: High. Status: fixed in working tree; full balance acceptance pending. Owner: root (content/engine QA).
Build: feat/playable-foundations, base9e0ef64; sourceTree8ac2b58cb01837cee6b58e3c157c9c3b80493d7f35bcf68413a74202048fbf9a.
Environment: Node24.21 deterministic production engine/store admission in WSL;
DOM/locale independent. This is native combat evidence, not a browser playtest.

1. Restore packet p15-sorceress-fire-act2-dry-continuation-v1.json, SHA256
   a3585ab02a12e67d38522d9c28564b2d608fd5e16a9bdbbf1759260f0fc54118.
2. Qualify Far Oasis at normal ordinal119, original Fire Ball8/Blaze7, original
   equipment/Rogue, without spending or growth.
3. Observe four victories then Radament draw at60s; hero345HP/275MP,
   boss4952/5330HP. Native prior ordinal118 also draws, boss4443HP remaining.

Expected: investing earned ranks in the primary level12 fire attack can supply
boss throughput under the existing resistance/Defense rules. Ordinary fire
progression must not depend on bypassing mitigation or injected levels.
Actual: Fire Ball8 is119–149, cap20 is203–233; 50%fire and242Defense floor every
noncritical hit. Prospective18/Fire Wall1 still draws, and prospective24/Meteor1
also draws with2809HP left. Hero survives with mana; defensive spending and
unbounded farming do not address this authored numeric wall.
Evidence: packet p15-sorceress-fire-act2-far-forecast-v1.json and raw native journal
p15-sorceress-fire-act2-dry-continuation-v1.raw.jsonl.gz. All diagnostic income is discarded.
Fixed seeds and exact native input are retained by p15-sorceress-fire-radament-screen-v1.ts.
Affected systems: src/data/skills/sorceress.json, registered fire effects, bilingual
skill damage previews; no schema/save change. Suspected root: obsolete +7 rank
coefficient compared with authored flat boss mitigation. No safe gameplay workaround
has qualified. Full cross-build fairness remains an independent open gate.

Validation: the committed-style regression src/engine/combat/fire-ball-growth.test.ts
fails at1>200 before the change, then passes after authored growth7→120.
Rank1 base and all functional contracts stay unchanged.32 paired native/current
boss inputs improve0→32 wins, zero deaths; native next-run Radament dies36.92s.
506 affected tests pass, plus the readonly-fixture corrected regression; scoped
strict types/lint pass. No commit was created. Historical type/lint/setup failures
remain in the packet. Lost City later defeats the party on a physical/curse pack;
that separate preparation problem is retained and is not claimed fixed here.
