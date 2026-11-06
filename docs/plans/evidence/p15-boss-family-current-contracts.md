# P15 — Duriel and Izual family regression contracts

[BUG767](../../../production/bugs/BUG-767-align-boss-family-regressions-with-adopted-contracts.md)
is fixed locally, uncommitted. Only two existing test sources change; no combat,
status, encounter or tuning change.

The adopted [Duriel passive Aura](../decisions/P15-duriel-passive-frost-aura-v1.md)
and [ordinary Izual escorts](../../../production/bugs/BUG-507-act4-izual-guards.md)
supersede four old family expectations. Current reproduction fails all four.
Updated checks preserve literal curves and exact Charge/basic cadence, separate
passive cold damage from ordinary physical hits, and assert twelve cold15/Chill
pulses at5000…60000ms during Mana Burn. Physical174 becomes182 only during each
half-open2sChill window because the copied tank retains boss combo resistance.
Both values must occur. Izual's roster is one L49boss plus two L49trash Knights
with literal Attack299 each.

Final selected run:4actual passes,86filtered. Strict scoped715source files have
zero diagnostics; two-file lint exits0. Existing input immutability, deterministic
recorded/plain replay and construction/RNG assertions remain. Four retained
production/data preimages are byte-identical. No broader suite or campaign rerun.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-family-current-contract-7jgb36g2`
through full-v1 acceptance and owns eventual cleanup. The packet holds preimages,
original RED, intermediate failures, final GREEN/type/lint logs, source hashes and
the exact increment diff. All handles are terminal; no disposable process, build
or cache was created. This is test maintenance, not additional campaign/balance
evidence. Historical14/14Normal completions/210sources/formal0/210 stay unchanged.
Full privatev1, including progression/acquisition/economy/difficulty/endgame,
pacing and integrated acceptance, remains unfinished.
