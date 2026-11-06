# P17 — Ordinary-monster equipment difficulty and eligibility

Verified locally, 2026-11-04, on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Implements drop-tables §2.1/§3/§4 under
[D08](../decisions/D08-trash-equipment-v1.md); BUG687 is resolved locally.
Constructed engine/native settlement evidence; no earned campaign or balance credit.

Actual trash now receives one weighted equipment attempt for all fifteen
configured ordinary act-table aliases. No minimum shift or extra jewelry;
Normal/Nightmare/Hell noDrop is .6/.5/.4 and authored rarity is 1/1/1. Only terminal
bands extend to finite actual-act caps 59/72/87/101/122. Actual ilvl, weights,
fixed rarity, gear MF and post-curve offline MF persist. Valid low levels may
produce an empty pool; missing/invalid configured sources, wrong acts and
out-of-envelope levels refuse before entropy/publication. D10 independent
rune .006 and gem .015 probabilities, quantity 1, sampler caps, wishstone and
shard behavior remain. Explicit caches, special/unconfigured sources, raw TC
JSON, other tiers, persistence and history are unchanged.

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-trash-equipment-v1`.
Counts overlap and must not be added.

| Check | Result / retained evidence |
| --- | --- |
| Original real-pool reproduction | 10 failed / 1 passed; `original-failure.log` |
| Initial implementation | 11 passed; `initial-green.log` |
| Expanded boundaries | 18 passed; `boundaries.log` |
| Final seven explicit affected files | 153 passed, including 18 focused and 36 settlement; `affected-final.log` |
| Scoped strict types / explicit five-file lint | Pass; `types-final.log`, `lint-final.log` |
| Isolated production / actual offline precache | Pass; `production-build.log`, `precache.log` |
| All emitted JavaScript | 13 files pass five forbidden bridge patterns; `bridge-scan.json` |

Focused coverage includes exact difficulty thresholds, five finite caps, terminal-only
bands/minima/weights/fixed rarity, actual-tier aliases and following RNG, closed
schema, MF, material independence, invalid sources/acts, low-level emptiness,
weighted boundaries and cache/special-source isolation. Actual spawn planning
checks 30 act/difficulty/mode contexts and over 50 distinct reward contexts with
seed 7/ordinal 0, without combat or campaign reruns. No award snapshots changed.

Three new native cases use manual Blood Moor seed 7 with a constructed finisher:
complete inventory delivery, refusal before player/merc XP, and all-domain
restoration after publication mutates then throws. Initial idle fixture promoted
champions even with pity zero; retained `native-settlement.log` and
`native-corrected.log` record those failures. Switching only the new fixtures
to manual mode produced `native-manual.log` (3 passed / 33 deselected), followed
by the entire 36-case settlement pass. Production source was not changed to fit
the fixture.

Local five-axis review (`local-review.md`) found no material issue: existing
bounded projection and settlement paths are reused, authored schema uses the
browser validator catalog, and no new dependency/network/save boundary is added.
This is local verification, not independent umbrella sign-off. No UI changed.
Existing large-chunk/optional-art-manifest build warnings remain; production
success does not establish runtime performance or physical-device acceptance.

Seven source and 766 build hashes were verified (`verified-sha256.json`) before
removing exact disposable `production/` and `types.config.json`. `cleanup.json`
confirms both absent. All handles are terminal; no server started. Required
logs, baselines and manifests remain root-owned through umbrella review, as
does the claimed human2 checkout; root owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This continuation completes
actual offline/bundle checks, review and closure. No full suite, campaign replay,
new agent, install, commit, push, publication or renewed training budget.
14 intended Act I clears / 3 five-act Normal completions / formal 0 of 210 remain.
Full private v1, remaining loot/economy/pacing, build viability, difficulty/endgame
integration, accessibility/performance and final review/soak/user playtest remain
open. Browser works; CI excluded; no pending answer or external blocker.
