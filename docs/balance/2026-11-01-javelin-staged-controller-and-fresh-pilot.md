# Javelin staged controller and first fresh pilot

Full private v1 remains incomplete. This work connects an explicit
`javelin-earned-v1` campaign execution mode to native point allocation, two free
skill resets, owned defensive gear selection and bounded training. Existing
registered profiles and default execution retain their behavior. The CLI now
transports a validated `CAMPAIGN_TIMESTAMP` into creation and report metadata.

The opt-in controller follows the retained route's level12 poison and level24
lightning transitions, then adds Impale from28. It spends available points only;
its supplied-XP regressions do not establish earned campaign viability. Training
is declared before Far Oasis, Arcane Sanctuary, Durance, Plains and Crystalline
Passage. Each stage limits admissions, consecutive/total losses and actual
combat time. It reserves a conservative whole-area duration before admission,
and retains interrupted checkpoints, actual income, ordinals and failures.
Generic act-entry training is bypassed only for this execution mode.

The first policy was frozen before choosing creation timestamp1793690000000.
One fresh Act I–II request started at level1/zeroXP/ordinal0 with empty backpack
and stash. It stopped in Act I at level9:74admissions/159played waves,156victories
and three defeats. Actual combat time was1828005.892ms (about30.47minutes), with
34.15seconds in the runner. Act II and the new later training stages were never
reached. This is a failed fresh pilot, not a balance acceptance result.

The final Den elite wave began at188HP/122mana and ended in6.8seconds with the
hero dead and106mana remaining. Keep all failed attempts. Next investigate
bounded legal preparation from the exact level9/ordinal74 successor; earlier
unaffected campaign admissions need not be replayed. Do not infer mana starvation,
acquisition reliability or population success from this single trace.

The pilot also exposed BUG559: creation-time equipment flags falsely prohibited
salvaging a legally unequipped starter. Normal salvage now supplies consumption
custody, checked alongside exact payloads and native yields. Re-reading174
economic records, including14sinks, reconciles72620XP/1558earned items and1438
consumed items without new combat. The original failed receipt stays intact.
BUG560 adds the omitted amulet slot for hero and merc; the retained plain amulet
does not explain the pilot loss.

Focused controller/reset/clock checks, equipment checks, affected economy/caster
checks, scoped strict types and explicit lint pass. No broad suite, other build,
later-act, old cohort, browser, install or CI rerun was used. Production/data
remain byte-identical to BUG558; current production source hash is
`e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a`.
The only original-manifest change is campaign regression registration; a
supplemental manifest binds the actual campaign implementation.

Evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-javelin-earned-pilot-policy-v1.json`,
`p15-javelin-earned-fresh-pilot-v1/`,
`p15-javelin-earned-pilot-readback-v2.json`,
`bug559-retained-pilot-accounting-v1.json` and focused check reports.
The first readback queried the wrong action-event fields; v2 removes that
unsupported field without gameplay. Accepted balance cells remain0. The14-build
balance/pacing/economy/retry/holdout and G0–G7 finish requirements remain open.
