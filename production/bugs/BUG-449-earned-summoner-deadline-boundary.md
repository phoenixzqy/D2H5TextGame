# BUG-449 — Earned Arcane Sanctuary attrition and Summoner deadline boundary

Status: fixed locally for the measured earned route; fresh native and public browser follow-through pass. Broader build/holdout acceptance remains open.
Severity: High for the measured earned route; universal impossibility unknown.
Environment: WSL/Node24.21.0, current b5a0898+private-v1/BUG440/BUG447 work.

Reproduce fresh p15-earned-authored-copy-act2-v1. Exact346-wave ActI and998-wave
pre-cold evolution controls retain all paid costs. LostCity now wins all6waves
atL24/ordinal307 after actual shield transfer; final444HP/60mana. Native training
there wins27more admissions toL26. Arcane attempts308/L24 and321/L25 loseW4;
337/L26 clearsW1–W5 but SummonerW6draws60s with454HP/7mana and1177bossHP left.

Expected: earned combat preparation can recover and finish the route within a
reasonable adaptation budget; resource/priority failures remain observable.
Actual: current Blizzard→Nova→Static order enters the boss with442HP/80mana.
Boss has5342HP,50cold/lightning resistance and81MR. Hero casts Blizzard3times,
Nova8, Static16, IceBlast9; regen7.28/s. It survives but fails the deadline.
This does not justify changing boss stats before testing existing owned skills.

Evidence: packet d2-counted-source-z3jj3xa1, native report/journal and frozen
20boundary waves p15-authored-copy-earned-boundaries-v1.json. Technical and
independent socket/reset/shield/ownership audits pass;1465waves/1453wins/
12nonwins,13992earned items/2410980XP,~295.98min raw combat. No ActII completion.

Next: exact replay of all14Arcane inputs and bounded priority-only alternatives,
retaining actual ranks/teams/resources/cooldowns/statuses/enemies/RNG. A frozen
win is not native all-area acceptance. No runtime/data change or pending question.


Completed diagnosis: priority-only434trials and paid Energy-only76trials both
fail every boss grid. Energy increases regen7.28->22.88/s and leaves572mana,
but1338bossHP remains. Combined eight-arm Energy/priority screen304trials also
fails all originals' boss fights and every32seed boss grid. No actual Energy
reset performed. Native resources/ranks/party/enemies/RNG were retained; exact
controls/source stability/owned cleanup pass. Summoner's50%cold resistance and
81flatMR reduce rank20Blizzard237-277 to37-57before crit; rank7Nova43-53to1.
Next read-only screen varies only its native factory MR-growth knob; D11's
prior retained MR81 is historical tuning rather than current build acceptance.
No data change, actual all-area victory or universal impossibility is implied.

Resolution: only Summoner fire/cold/lightning50→25, retained MR/HP/skills/RNG,
plus ordinary owned defensive Prayer equipment. Focused524tests/types/lint/build
pass. Fresh L1 successor reproduces exact old pre337state and all6Arcane wins;
W6wins39.356s, final hero899HP/196mana. Journal/Claim proceeds to actual tomb.
Independent transformation audit passes full ownership/payload/source/cost checks.
Bridge-free public Chromium import plays all6wins, exact52items/571final owned,
quest graph/rewards/export/reload in zh360/en1280,35.856s, no errors/overflow.
All4screenshots reviewed; mobile boss frame shows player viewport while DOM
assertions verify all4enemyIDs/HP maxima.763hash-verified staging files removed
(42900143bytes), all directories/server/contexts absent. DurielW6draw is separate
BUG451; ActII/five-act/fourteen-build/pacing/holdout acceptance remains open.
