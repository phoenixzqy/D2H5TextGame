# P15 — Diablo Stun resistance local evidence

2026-11-05;root,solo. BUG758 fixed locally, not committed/independently accepted.
Decision:[quarter-duration Stun](../decisions/P15-diablo-stun-resistance-v1.md).
Packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-stun-x8bo46w5.
Root retains this exact packet through full-v1 acceptance, then removes it.

red.log:5fail/3pass; green-initial.log:8/8; affected-tests.log:87/87 across six
affected files. Native manual/idle chapter stats44800Life/420Attack/460Defense/
AS140 unchanged; a4000msStun at900ms expires1900ms in engine and actual playback.
Positive1msfloor, fractional flooring, legacy rounding, refresh/no stack, both
boss tiers, half-open expiry and no input/RNG mutation are checked. Generic
boss/Baal Stun0.5, Diablo Freeze0.5 and ordinary Chill are preserved. Existing
native four-move signature also passes. No ActI/II, full suite or campaign rerun.

types.log:604strict implementation/data files,zero diagnostics. lint.log:exit0.
schema-source.log:10valid ActIV rows, bounded positive≤1 coefficient, malformed
types/unknown keys rejected; only Diablo coefficient added. Other rows/schema
fields remain unchanged. Source review/diff/hashes/cleanup included. Initial shell
redirection suffix typo stopped before execution; corrected launch is retained.

No UI/layout changes or browser diagnostic added; no balance/pacing/independent/
owner acceptance. Historical14/14Normal,210sources/formal0/210 unchanged. No
exhausted campaign/sample/per-area budget renewed. Browser works; CI excluded.
Full private v1 remains unfinished; progression/challenge/economy/pacing and wider
acceptance remain open.
