# BUG-506 — Act III ordinary boss guards inherit boss multipliers

Status: fixed locally, uncommitted; earned full-area acceptance obtained. Full campaign balance remains open. Severity: High for campaign progression.
Owner: content-designer / engine-dev (root executing locally).
Environment: WSL, Node24, branch feat/playable-foundations, base b5a0898.
Browser/viewport/locale: not applicable to native pure-TS encounter evidence.
Source hash: 6b09550934feaefc782b42c0c162470d70ff6d3b706439fc59bd038688109e52.

Reproduction:
1. Resume the earned Double Swing24/next522/25action report below; its retained
   preceding Kurast Bazaar admission521 contains the exact failed sixth wave.
2. Resolve Kurast Bazaar's authored Sarina boss encounter. Only the Serpent
   Magus has boss:true; its four Flayer companions omit boss.
3. Existing encountersToSpawns falls back to waveTier=boss for those companions.
   The native wave therefore constructs all five units as bosses.
4. At native run seed 1101814979, wave seed 4108355301, the first
   Flayer's critical physical hit deals368; the hero enters at370.64HP and
   dies at1.660s with five living enemies and224MP.

Expected: one named boss and four ordinary Flayer guards; explicit three-boss
Council remains three bosses. Endugu's five ordinary Flayer guards use the
same ordinary role. Encounter levels/counts, named bosses and loot stay authored.
Actual: Sarina's four and Endugu's five unmarked companions inherit boss tier,
including3xHP,1.6xAttack,1.5xDefense and elevated crit/other boss properties.

Root cause: two ActIII bossEncounter guard rows lack the supported boss:false
annotation. The shared planner already honors explicit boss:false (Radament's
companions demonstrate the intended contract). Fix those data rows, not shared
fallback logic or global multipliers.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-barbarian-double-swing-level24-continuation-v1.json; corresponding raw.jsonl.gz in the same root packet.
Fixed-seed fixture: src/engine/combat/fixtures/act3-bazaar-guard-tier.json.
Regression: src/engine/combat/act3-boss-guards.test.ts.
Workaround: additional preparation can mask the erroneous guard budget; this is
not the intended correction. Full matrix/pacing acceptance remains pending.

Fix: two boss:false annotations in ActIII bossEncounter Flayer companion rows.
No shared planner, monster formula, level/count or named-boss changes.
Validation: eight focused ActIII cases pass following five expected red failures.
The schema, manual/idle companion roles, three Council bosses, exact rebuilt old
enemies and corrected native Sarina seed/party/resource-deficit victory are checked.
Scoped types/lint pass after typing-only corrections; prior numeric pass reused.
Artifacts: bug506-act3-red-v1.json / bug506-act3-green-v1.json and bug506-types-v2 /
bug506-lint-v2 receipts in the root packet. No earlier-act or broad unit replay.

New native continuation522 clears KurastW1/W2 then loses at eliteW3 before Sarina.
It retains7,560XP/5items in p15-barbarian-double-swing-bug506-continuation-v1.json;
this ordinary Thorns loss does not invalidate the role correction but keeps full
area/campaign balance acceptance open. Final root packet custody readback passes.

Earned area acceptance,2026-10-31: the exact successor
`p15-barbarian-double-swing-owned-physical-continuation-v1.json` clears all six
Kurast524 waves, including Sarina, and recovers Khalim's Eye. It retains the
native two-Sol chest preparation and old physical-resistance helm; earlier
areas, claims and acquisition are not repeated. The subsequent
`p15-barbarian-double-swing-silks-continuation-v1.json` completes ActIII.
Throw's `p15-barbarian-double-throw-post-training-continuation-v2.json` also
clears Flayer/Endugu and Kurast/Sarina. These are earned native admissions,
not merely corrected fixtures. The eight unchanged focused regressions are
reused; no ActI/II or broad-suite replay follows. Exact successors/custody are
recorded in `p15-barbarian-gap-progress-summary-v1.json`, with retained paths
and hashes in `p15-barbarian-gap-artifacts-v1.json` in the same root packet.
