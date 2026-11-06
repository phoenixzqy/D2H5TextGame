# BUG-501 — Capped Bow volley cannot scale into boss damage

Status: Implemented locally; earned Act II boss verification passed. Severity: High.
Base: b5a0898806bfba369a2d84a1b6c41d0bbb057fce with private-v1 source.

Native489 Far Oasis W5 retains Bow20/Multi20/Magic1/Critical1/Dodge1,
206HP/111MP plus earned Rogue. Radament5050HP/242Defense/63MR/25%Physical
resistance draws60s at4603HP; hero149HP/4MP. Physical damage events total272
and Arcane19 against the boss. Exact input and derived seed are retained in
`src/engine/combat/fixtures/amazon-radament-frontier.json`.

Root cause: the capped cone has flat damage268–288; its damage ignores level,
attributes and weapon Attack. Increasing the flat curve enough for retained
Baal82/57600HP/560Defense would also increase low-level damage substantially.
Add JSON rank growth for its Attack contribution; rank1 remains unchanged.
No enemy/stat/seed/resource grants or extra targets are part of the fix.

Regression: `src/engine/combat/amazon-radament-frontier.test.ts`.
Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Source reports: p15-bow-act2-level20-continuation-v2 and
p15-necro-act5-group-health-continuation-v1. Constructed regression earns no
campaign rewards, levels or acceptance. Later earned Bow/matrix/pacing and
holdouts remain required.

Native490 clears Radament25.868s;791 clears Duriel42s and completes Act II.
Later Act III reaches Durance W5 with insufficient mana; Mephisto remains
unreached. Shared fixed/per-rank Attack percentages preserve fractional values
until final damage flooring. Coefficient40 remains provisional; full later-act,
fresh/matrix/pacing/holdout signoff remains open. See p15-bow-earned-act2 evidence.
