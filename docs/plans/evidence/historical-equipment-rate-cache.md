# Historical equipment-rate caches normalize at restoration

2026-10-23. BUG094 on `16db3c5`, following BUG091/BUG093.

Validated decoding now identifies affected equipped sources and refreshes only
those player critical/dodge fields through the canonical equipment projection.
The per-stat mask covers nonzero modern rolls and the exact corrected unique
and active-set fields. Set membership and distinct pieces follow the existing
aggregator. Legacy Maps alone and originally fractional sources do not trigger
repair. Raw items, current HP/MP, maxima, MR, unrelated caches and all mercenary
state remain exact. Removed gear cannot identify a stale cache; that limitation
remains. No format bump or CharacterScreen change.

Genuine initial RED: four failed rate assertions and one unaffected control.
Forty-two engine cases cover all corrected sources, nontriggers, exact save
preservation, mixed legacy fractions, idempotence, supported historical versions,
malformed input and finite-input overflow. Four real-adapter persistence cases
cover JSON import, native-Map load, startup/offline reconciliation and failed
writes preserving prior state. Focused engine/persistence: 104 tests pass.

Production browser proof uses an explicitly constructed diagnostic amulet and
stale caches on a retained earned L12 skeleton. This is not an acquisition or
campaign proof. Both en/zh-CN cases import through Settings; readonly IndexedDB
and complete export equal the expected save with only four changed rates.
Character rows show 7%, 230%, 12%, 6% at 360×640 and 1280×800. Raw modern rolls
and the legacy .25 critical-damage contribution stay exact. Save → close page →
new page → Continue preserves the complete save and rows. A single ordinary
Dexterity allocation then succeeds, spends exactly one earned point, and
performs the expected normal rederivation. MR17/Attack777 sentinels remain exact
through restoration and intentionally return to MR0/Attack62 on ordinary Apply.
No test bridge or direct storage mutation is used; no page errors or horizontal overflow.
Page reopening does not prove a full browser-process restart or touch interaction.

Validation: **8646 tests / 278 files pass, 202.56s; typecheck and full lint pass;
two final browser cases pass, 61.619s, zero retries/skips/flaky cases**. Production build passes with VITE_E2E
unset; all four JS chunks pass the five forbidden-bridge checks. Existing
bundle/precache warnings and repository test-time budgets remain open.

Validation corrections are retained honestly: the first full run passed 8645
cases but rejected one source-identity measurement after the test file changed
while it ran. A subsequent frozen full run passed all 8646; the typed assertion
rewrite then exposed readonly test objects, corrected with explicit immutable
copies. Final frozen checks follow. The first browser run passed both cases;
its mobile screenshot showed the scroll container's top rather than rate rows.
The final run adds scrolling and viewport assertions before screenshots.

Producer runtime/source APPROVE and security PASS. Independent browser preflight
found and corrected a nonexistent Character navigation link and missing desktop
row assertions. Independent final browser evidence ADEQUATE; complete saved/applied oracles,
provenance and screenshots audited. Final numeric test-oracle rewrite APPROVE.

Reproducible browser harness: [spec](fixtures/bug094-cache.spec.ts.txt) and
[config](fixtures/bug094-cache.config.mjs.txt). Required fixtures, screenshots,
reports, source hashes, RED/GREEN/validation logs and cleanup receipt remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-equipment-cache-p_071mu1`.
Root owns retention through C1/full-v1 consumers and removes it afterward.
All validation/browser processes are terminal and readers released. Exact task-owned
tmp/cache/dist/browser-output cleanup succeeds; remaining[] and failures[].
Shared caches remain untouched. No remote actions. C1–C4/G0–G7 remain open.
