# P17 — Production equipment responds to Magic Find

Verified locally on 2026-11-04 at HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
BUG678 and the stale cache test BUG679 are fixed locally; full private v1,
loot economy and wider P17 acceptance remain open.

[D08](../decisions/D08-ordinary-magic-find-rarity-v1.md) removes exactly491 fixed
normal/magic/rare properties across31 ordinary tables. Existing base choices,
weights, quantities, level bands, direct rewards, fixed uniques/sets and all
quest caches are preserved. Ordinary equipment now uses the existing MF rarity
roller. Runtime formulas, save format and earned saves are unchanged. Extra
rarity/affix RNG draws intentionally change later rewards on the same stream.

| Check | Result |
| --- | --- |
| Original reproduction | 7 failed / 1 passed |
| Real-table MF and native settlement | 27 passed |
| Broader affected run | 304 passed; stale Act IV cache test failed |
| Corrected cache and selected historical contracts | 35 passed, 100 unselected |
| Final MF/helper contracts | 10 passed, 130 unselected |
| Scoped strict types and explicit no-ignore lint | Passed |
| Production build / forbidden bridge scan | Passed; 13 JS chunks |
| Final browser, actual enemy-ID oracle | 4 passed, 47.9s; no skips/retries |

Historical rarity expectations are reconstructed only in test helpers; a whole
predecessor canonical hash separately proves precisely the declared data delta.
BUG679 corrects Diablo's cache expectation from5 to14 authored outcomes, and
tests four progression entries at their legal levels rather than ilvl61. The
cache itself is identical to its predecessor; all three cache tests pass.

The production browser cases cover desktop1280×800/mobile360×640 and English/
Chinese. Constructed level60 gear is imported, then all eight pieces are equipped
through the ordinary UI (285MF). The first native wave has eight enemies.
The oracle rebuilds the canonical wave and monster IDs with the same seeds,
binds visible representative IDs and total counts to it, and uses each actual
enemy ID for its wishstone fork. Baseline/decayed offline-bonus rewards match
complete item properties except allocator IDs, the full currency ledger,
materials and XP. Equipment/map state is preserved; offline service-worker
reload returns the exact saved result. No debug bridge, overflow or page error.

Baseline rarities: normal/magic/normal/magic/normal/magic; boosted:
normal/magic/normal/magic/magic. Shards663→626; one flawed emerald→none;
wishstones0 in both. The initial placeholder wishstone fork was corrected even
though its zero-wishstone result had passed. Eight durable screenshots were
visually inspected: they show Settings/export, offline status and the return
message, not the loot presentation. The bonus chip's missing hourglass glyph is
tracked separately in BUG681. These imported-fixture/synthetic-clock cases grant
no earned campaign, balance or pacing credit.

The retained 90,000-call sample uses15 actual Normal contexts ×1000 seeds ×six
paired variants. Materialized totals:

| Source / MF / bonus | Items | Normal | Magic | Rare | Set | Unique |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Predecessor, all three variants | 29894 | 2024 | 0 | 27140 | 192 | 538 |
| Current / 0 / 1 | 29672 | 16953 | 5153 | 6195 | 512 | 859 |
| Current / 300 / 1 | 29672 | 10526 | 6816 | 10198 | 814 | 1318 |
| Current / 300 / 1.5 | 29672 | 7941 | 7518 | 11790 | 940 | 1483 |

New RNG consumption also changes items−0.743%, shards−0.301/−0.415/−0.328%,
runes≈+0.62%, gems≈+0.31%, wishes+3.093% versus the predecessor. Rates are
unchanged. Act I mini at level4 has no eligible equipment choice. Restoring MF
substantially reduces the formerly forced rare output; economy acceptance is
not inferred from these samples. The sample also proves missing Andariel rarity
guarantees (BUG680):843 rare+ across1000 kills cannot satisfy one per kill.
Boss bundle/first-kill requirements remain unfinished and are not replaced by MF.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-real-mf-v1`.
It retains original failed attempts, corrected/final logs, source and build
manifests, paired sample JSON, browser JSON/trace failures, final PNGs and exact
constructed/native saves. `review-and-cleanup.json` records final source hashes,
terminal handles, exact disposable paths and cleanup verification. Root retains
this evidence and human2 through umbrella review and owns eventual cleanup.

Local source/test review found no remaining defect in this slice after correcting
the enemy-ID oracle; no independent approval is claimed. No full-suite/campaign
rerun, install, new agent, commit/push/publication or renewed closed budget.
Counts remain14 intended Act I/3 five-act Normal/formal balance0of210. Continue
boss guarantees, build viability/economy/pacing, wider idle/PWA/endgame integration,
accessibility/performance and final review/soak. Browser works; CI excluded.
