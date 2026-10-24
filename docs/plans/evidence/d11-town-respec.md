# D11 — Ordinary town stat/skill reset

Local implementation `b67f0a0`, root self-review; independent acceptance pending.
Controlling contract: [D11 town reset](../decisions/D11-town-respec-v1.md),
implementing progression-curve §§4.3/5.3 rather than inventing a Duriel-specific fee.

## Result

Three free uses **separately** for stats and skills, then five real inventory
wishstones. The matching current unlocked town NPC presents refund/cost and
requires explicit confirmation. Cancel/Escape is inert. Changed hero/wallet/town,
combat, incomplete hydration, restore and competing ownership refuse safely.
Exact actual investment is refunded, including earned starter/quest allocations;
no level-derived reconstruction. Canonical skill aliases cannot refund twice.
Stat reset restores the authored class baseline; skill reset clears learned
ranks/priority/selected aura and leaves equipment grants owned. Both preserve
XP, quests, mercs, gear and ordinals. Canonical derived composition preserves
Life/Mana except a reduced maximum clamp. Payment/refund publication, verification
and rollback run under existing material ownership; failed restoration blocks saves.

The synthetic-gold store API is removed. Existing native composition regressions
now explicitly construct a free post-reset input and make no ordinary service or
payment claim. Real paid and aura-refusal assertions use the actual town service.

Save21 requires strict independent counters. Historical actor types remain frozen;
validated20 and older migrate to3/3, without inferring old grants or changing other
holdings. Historical future counters and malformed current descriptors/counts
are rejected before normalization. Build/snapshot preserves exhausted counters.

## Failures retained

Initial missing-module REDs establish absent planner, persistence and UI. The
first broad engine run found stale current-version/predecessor fixtures; their
explicit expectations were reconciled with21 while keeping historical native
contracts. Original failures remain, rather than weakening raw import checks.

The first production browser setup timed out opening Drognan: ActII authored only
Atma. A causal presence test then fails for the configured reset NPC. Adding the
canonical Drognan dialogue/localized name/greeting makes every configured NPC
reachable; no image generation. The earlier full run was deliberately interrupted
before this runtime correction and is not passing evidence. Initial lint failures
were corrected without suppressions.

An exploratory Duriel script also had an invalid target ID and later an incorrect
handle assertion. Its four-wave fallback wins are **invalid Duriel evidence**;
`invalid-diagnostic-note.json`, scripts/logs and outputs remain. Corrected diagnostics
must resolve the exact authored Tomb ID and verify native run identity. No
projection or browser fixture becomes authoritative campaign state.

## Validation and retention

Final standalone full unit run:11326passed/430files,2 existing opt-in skips,
467.30s. Engine5513/167passed74.78s before the final factory-only correction;
the full run includes all engine tests on the final source. Typecheck, full lint,
production build and all4 emitted-JS bridge scans pass. BUG149 supplies7 causal
fresh-character failures, fixed at the production factory before315/12 affected
regressions pass. Original22-failure broad run is retained; historical20 inputs
stay explicit while current expectations and Drognan cardinality are corrected.

Final production browser matrix en/zh-CN×360×640/1280×800×free/paid passes8/8,
zero retries/page/console errors. New characters explicitly export3/3. All56
native saves receive a root payload audit: exact source migration/control basis,
inert Cancel,31 skill points,115 stat points, independent counters, exact paid5,
all other holdings/XP/map/merc/endgame/metadata preserved, current120HP/102MP,
and8 exact Save-close-new-page Continue pairs. Stat reset changes only its core,
points/counter and canonically recomposed Life/Mana maxima; composition controls
cover that calculation. Controls remain isolated; no ordinal258 entry occurs.

Source/config/test1083 and build760 hashes retain zero drift across the final
checks. Both preview processes are terminal. Exact disposable `dist`, `dist-v2`
and `dist-v3` paths are absent; cleanup remaining[]/failures[]. Test-time targets,
bundle/PWA budgets and independent acceptance remain open. Root self-review found
no remaining local transaction/migration defect; this is not independent signoff.

Raw evidence is root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-respec-b3pdijst`.
Root removes it after independent review and full-v1 consumers finish. Disposable
builds are separately tracked/removed after all readers stop; versioned source,
logs/archive and diagnostic failure evidence are retained.

Authoritative campaign input remains the unchanged earned Summoner257 final,
raw SHA256 `458c75cc6b609f1b15cdb6d77fd8435917cad10d1df9d1525a1925a9917f1fd7`,
next Normal258, L24/two unspent skill points. Browser reset controls are isolated
functional branches, never promoted. Earned Duriel/ActsII–V, C2, full seven-class/
213-skill acceptance, economy/pacing, C3–C4 and every full G0–G7 remain open.
