# D08 v1 — Act I manual chapter-boss equipment band

Status: scoped contract APPROVE by design, exact plan READY by producer/QA.

The real Catacombs manual chapter boss is level19 (area12+bonus2+5), so extend
all seven `loot/act1-boss` equipment maxima from14 to19. Preserve authored
minima9/10/12, all weights/rarities, direct rewards, rune maximum18, pick/noDrop
and every other table. No schema, engine, save or global tuning change.

Equipment boundary counts: 8→0,9→4,10→5,12/14/19→7,20→0. Counts exclude direct
rewards, which remain eligible at8/20. Runes eligible18, excluded19; their
acquisition/economy is deferred to D10/P12b. D08 remains partial.

Seed1 source reconstruction after correction: all five selections complete
before materialization; chance0 still consumes a draw. First two draws
.6270739405881613/.002735721180215478, eligible total930; second×930 falls in
rare skull-cap120. Selection sequence helm/direct-gold/amulet/kite/kite; four
rare equipment instances at19 with generated IDs, base rolls and affixes.
Before correction only direct weight280 remains at19. No seed search.

Regression follows real resolveSubArea→manual plan→buildEnemiesForWave→explicit
synthetic slain boss→awardLootForVictory→inventory/export. No mocked RNG/data,
injected gear or alternate table. This proves eligibility and production reward
ingress only. Earned victory, guaranteed equipment, unique materialization,
reload persistence, pacing, other area contexts and economy require later cards.
