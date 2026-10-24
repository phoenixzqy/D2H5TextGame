# Earned wishstone recruitment

Root implementation and whole-save audit; independent acceptance pending.
Baseline `a0d7c7f`; implementation `b2ed62b`. BUG154 repairs the disconnected wallet and payment boundary;
BUG155 reconnects the existing screen to production; BUG156 bounds the Chinese
rates control to44×44px. This implements one F07 economy path, not full gacha or
the remaining campaign/class/skill/endgame acceptance matrix.

## Contract and verification

Inventory wishstones are canonical. Positive safe payments may combine genuine
legacy meta currency with inventory value, write the exact remainder to inventory,
and clear legacy currency. Loading, importing or reading alone never converts it.
New grants use inventory. No persisted shape/version changes. Unknown currency
keys and all existing items are conserved. Only authored1/10 pulls are supported,
at10/90. Invalid numbers, overflow, insufficient funds, missing hero, hydration,
combat and competing ownership refuse before payment.

Rarity/SSR-pity RNG order remains unchanged. Every concrete result is prepared
before publication; missing content throws before spending. The shared material
lease excludes snapshots, restores, nested payments and supported roster/meta
mutation. Payment, complete merc equipment/progress/ownership and pity publish
together; all participating references restore on publication failure. An
unverifiable/throwing restoration blocks saves and requires saved-state recovery.
Legacy suffixed merc IDs count as already owned, matching deterministic hire.

The first store run has25 causal failures/13 controls before source changes.
The UI-only boundary then has6 failures/39 passes before its correction. Two
production-route tests fail before reconnecting `/gacha`. Final integrated
focused run84/6 passes; one additional character-guard case runs in the full
suite. Observer failure at each publication, missing content, replacement of the
final reference, nested operations and restoration failure are asserted.
Types and full lint pass; the later minimum-width class also passes a final
targeted lint check. Initial typecheck found an unchecked test fixture index;
initial lint found six void-arrow callback forms. Both are corrected without
removing assertions; original failure logs remain.

Final production build passes; all4 emitted JS chunks pass the test-bridge
identifier scan. Existing bundle/PWA-manifest and test-time budget misses remain.
Final full-unit run passes11550 tests/441 files, with2 existing opt-in skips,
exit0 in423.07s. No tests/thresholds were weakened or new skips added.

## Genuine acquisition

The exact through271 save (SHA
`331c8bcb4df3f24709b5d8e7c94bfc05d9c789105106d82d3ea1193d0a0ea6fc`)
is imported through ordinary settings. The fixed policy is one ten-pull, retaining
every result; no debug grant, seed selection, reroll or injected state. Historical
Date/native timers preserve the prior save clock convention. Chromium production
en/zh×360×640,412×915,640×360,1280×800,1920×1080 passes10/10 with no horizontal
overflow and measured recruitment controls≥44×44px. The dev grant is absent.

Two earlier zero-pull setup runs remain retained: the first assumed a nonexistent
global gacha link and exposed the redirect; the second measured rates width
39.828125px in Chinese. Neither consumes currency or a campaign attempt.

The actual keyboard ten-pull returns10 reveals, all10 new. Wishstones8790→8700;
legacy balance stays0. All original player, map, endgame, non-gacha meta and
inventory fields are exact except the90-wishstone debit. All7622 gear payloads,
materials/quest ledgers, original Rogue equipment/progress and fielded choice
remain exact. New roster/mirror/progress persist. Two exact
Save→close→new-page Continue pairs pass; zero browser/console errors.

[Current authoritative save](fixtures/earned-recruitment-next272/retained-final.json.gz):
SHA `7d311ad83afb2162a5b8ea880260dde1bcc1d9ab8ffbb60893b77c3a2805fc92`.
L25/current XP122811,10 stat/1 skill unspent, nextNormal272/Nightmare0,
8700 wishstones,11 owned mercs, original Rogue still fielded, SSR pity0.
[Whole-save audit](fixtures/earned-recruitment-next272/retained-recruitment-audit.json)
contains every reveal, new ID and source/build digest. Resume this save; never
repeat this recruitment purchase or restart the271 parent.

## Remaining and artifacts

Independent SR pity, duplicate shards, star progression, missing merc effects,
earned Travincal/five-act completion, all213 skills/seven-class builds and final
economy/pacing/experience/PWA/performance acceptance remain required. C0/C1 retain
their original acceptance; C2 incomplete; C3/C4/full G0–G7 open.

All three owned previews and browsers are terminal. Final disposable
`dist-gacha` removal and port4417 refusal are verified. Root retains the exact
`bug154-*`/`bug155-route-red.log` reports, scripts, saves, screenshots and failed
logs at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`
through full-v1 consumers, then removes them. No remote publication.
