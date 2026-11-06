# BUG-453 — Let earned training use ordinary surplus-gear salvage

Status: resolved locally in the earned diagnostic; maintained harness integration pending.
Severity: Medium (QA policy capacity; no runtime loss or combat failure).
Affected systems: earned diagnostic inventory/economy policy, root sole writer.
Build: b5a0898+private-v1/BUG447/449. WSL Node24.21.0, no DOM/locale dependence.
Repro: fresh p15-earned-travincal-training-act5-v1, same1493wave prefix, then
24wins/4Bazaar training admissions343–346. Actual133180XPearned, stillL26.
The retained-all-nonnormal policy fills500stash and leaves107bag; native move
returns stash_full, clean declared capacity stop beforeL30/Mastery or retry.

Expected: a normal player can salvage surplus gear to sustain finite training.
Actual: diagnostic forbids that existing legal action and hoards every rare.
No data loss, combat impossibility or game-storage-cap increase is justified.
Native source/economy/quest/save checks pass; independent capacity audit verifies
exact1493prefix,24actual wins/XP/no new skill and full stash.
Evidence: packet d2-counted-source-z3jj3xa1, report/journal/exit plus
p15-travincal-training-capacity-audit-v1.json. Native seed rule unchanged, actual
admission343–346waves retained. Next: preserve complete1517wave/capacity state
then use native salvage with exact input/output/receipt/item-payload audit.


2026-10-30 diagnostic follow-through: native salvage successor completed
273.447s with exact1517wave/capacity state. Three actions convert974items to
6932scrap,51Bazaar admissions all win/1451350XP, nativeL30/Mastery1 reached.
Actual retry394W5still draws; BUG452 remains open. Strict conservation and
independent transformation audit pass. Separate protection-audit V1 fails its
own expected-row shape: retained temporary `net` field alongside `{id,score}`,
while recorded rows deliberately contain only `{id,score}`. Original log/exit
retained. V2 will project that exact declared shape, with all candidate ranks,
score/ID ordering and protected-set/selection checks unchanged. No source fix.

Protection-audit V2 PASS4.850s independently recalculates126rankings/4126native
projections, including946future-base candidates, and the complete surplus set.
V1 shape error retained; projection-only oracle correction changes no policy or
selection. Conversion/XP/point/full-prefix audit passes all three exact native
actions and disjoint consumed payloads. Runtime source and storage unchanged.
