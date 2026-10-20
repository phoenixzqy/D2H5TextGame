# BUG-010 — Preserve item identity and authored base category in art

Severity: Medium (inconsistent item recognition; inspection is a workaround).
Status: P05b01 resolver corrected and independently reviewed, 2026-10-20;
P05b02 consumer integration remains open. Integration SHA is in the ledger.
Reproduction base: `0ee36ae`. Owner: frontend-dev / art-director / QA.
Environment: Node 24.21.0, Vitest 1.6.1 UI/jsdom. Both locales share the
resolver; no strings, RNG, browser viewport or engine seed involved here.

## Reproduction

1. Run `npx vitest run --project ui src/ui/item-icon-identity.test.ts --reporter=dot`.
2. Resolve the shipped bow with `equipSlot: 'weapon'`, then a known base
   with contradictory generic hints. Compare helper output to base metadata.
3. Compare actual source callsites for `items/unique/biggin-bonnet`: backpack
   and picker pass only `baseId`; detail/tooltip pass `uniqueId` first.

Expected: a concrete instance retains its unique/set/runeword identity before
base art. Known base metadata determines category before hints or slug guesses.
Every surface uses that shared policy. Unknown/unclassifiable inputs retain a
stable fallback.

Actual: the currently unused instance helper prefers generic weapon/shield
hints, and the core resolver guesses categories from slugs without metadata.
Player-visible grid/picker additionally discard unique identity, unlike detail
and tooltip. Do not claim that the unused helper already changes live UI.
All currently shipped `wp1h` bases are swords; synthetic contradictory metadata
tests establish the durable category contract, not a shipped axe mismatch.

Evidence: new 29-case resolver suite at the reproduction base: **25 failed,
4 passed**, 1.65 s. Failures include actual bow→sword and differing APIs,
all weapon proxies/nonweapon metadata, and known-unclassifiable fallback.
The suite retains concrete assertions and existing-file checks.

Root cause: split instance resolution and metadata-blind fallback, with four
consumers implementing inconsistent identity selection.

## Scope and control

Producer's independent D13 art/UX + technical plan review: APPROVE.
P05b01 owns the two resolver modules, resolver test, this report and D13.
P05b02 will wire the four consumers and prove ordinary browser presentation.
No new images, manifests, source data, save shape, game balance or release
policy changes. Existing staff/bow/dagger proxies are category proxies.
Security check: pass; local presentation only, no new external access.

## Resolver verification

After correction: focused resolver/helper suites **47 passed** (1.70 s), then
47 passed again after test-only strict typing corrections (3.85 s).
`npm test -- --reporter=dot`: **94 files / 927 passed / 1 existing merc-XP
skip**, 20.74 s (>15 s budget). This includes integrated P04a01 quest tests.
Production build passed (10.24 s); existing large-bundle and 2.57 MB asset
manifest precache warnings remain. Existing React act/router warnings remain.
Typecheck, repository lint/engine purity and `git diff --check` passed after
strict optional-property and explicit-empty/null expression corrections.
Final focused rerun: 47 passed, 1.79 s; no suppressions or weakened checks.

Producer independently reviewed all five files: **APPROVE**, no blocking
finding. Scope is the shared resolver only. Existing surface mismatch remains
until P05b02; no F19/offline/performance/whole-D13 acceptance follows here.
