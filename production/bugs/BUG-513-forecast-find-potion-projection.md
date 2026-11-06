# BUG-513 — Carry Find Potion authority in diagnostic wave snapshots

Status: corrected in task driver; bounded runtime validation passed.
Severity: Low (task-owned forecast only). Owner: root.
Environment: WSL / Node24 / human-worktree-2.

Native stageWave includes composeFindPotion(player) in CombatSnapshot.findPotion.
The new next-area forecast v2 can model a legal skill reset allocating Find
Potion, but its manual W2+ snapshots omit this authority. Such a future suffix
would incorrectly disable recovery. The executed recovery candidate stopped
at W1, which reused its correct native recording; no reached suffix, native
save, passing forecast or campaign claim depends on the missing projection.

Expected: every diagnostic wave projects actual allocated recovery authority
through the same native composer. Fix: import composeFindPotion and include
the optional findPotion snapshot field. Preserve W1 recording and all v2
outputs/failed candidates. No engine/data/stat/eligibility or reward change.
Historical validation plan: scoped strict types/lint and exact snapshot projection.
Security: local diagnostics only; no grant, audit bypass or publication.

## Completed local verification

Validation completed: diagnostic v3+ includes native composeFindPotion;
v8 W2/W3 recovery events are retained. Final v5 strict types/lint pass in
barbarian-next-area-types-v7/lint-v7 receipts. All six selected v12 Bloody
HP/MP/time forecasts match the actual native continuation; independent
p15-barbarian-bloody-progress-summary-v1.json passes. Earlier negative outputs
are retained. This proves the exercised policy only, not arbitrary skill/buff
projection or full campaign acceptance.
