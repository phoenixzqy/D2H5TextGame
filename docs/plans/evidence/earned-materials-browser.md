# Earned combat materials and storage continuation

2026-10-23. C0/C1 remain accepted; C2 is in progress; C3/C4 and complete G0–G7
remain open. This evidence covers a bounded earned combat prefix and separate
storage/UI acceptance. Authored-cache acquisition, crafting, earned campaign
completion and balance/pacing remain unaccepted.

## Actual combat result: original test failed after six wins

The unchanged authentic L24 native17 input receives ordinary public Import,
then exactly one Catacombs Enter at native Normal ordinal252. All six actual
native terminal victories pass, without Skip, retry, supplied seed, modified
clock, speed, character or holdings. Ordinal becomes253. All5680 original full
gear payloads survive;13 unique earned gear items bring the total to5693.

Concrete earned holdings are Eld1, Chipped Skull2, Flawed Skull2, Flawed
Sapphire2 and Flawed Amethyst1. Rune-shards increase18806, wishstones14 and
gem-shards remain1159; native reward summaries match. Public export and exact
original downloaded raw-text reimport preserve all gameplay domains.

The test nevertheless fails: the Inventory material-row assertion sees0 rather
than5 within the existing5s. Later observation shows the correct inventory.
Manual Save/new-page Continue and the panel matrix were not completed in this
invocation. Its report remains0expected/1unexpected. The setup-only clipboard
transport interruption remains separate and launched no combat. Neither failure
is reclassified or discarded, and no second combat is launched.

## Measured defect and correction

Storage-only profiling of the unchanged retained earned data measures40.838s
from Inventory click to panel. Of the40.793s CPU profile,37.4s is under backpack
comparison and about27.7s is repeated quest/catalog validation. The fix prepares
gear-independent quest bonuses and current-loadout stats once per comparison
batch, retaining exact candidate equipment/stat derivation, displacement rules,
eligibility, upgrade predicate and resource clamping. No global cache or item
removal is introduced. Three new tests and existing actual-equip/quest controls
cover correctness and constant entitlement resolution across100candidates.

## Separate storage result: pass

The sole storage input is the exact retained `earned-export.json.gz` JSON
artifact, not the formatting of the original native download. Its recorded
JSON.stringify representation retains earned data unchanged. Gzip SHA256:
`1de7b2371224cd09d2b1baad532416bad2e4ac19f0719e2dcf64fec9c05c0c8c`;
decompressed SHA256:
`f68fb4988f388f493e54a279c4d0b9bbe2e6ad2f091b4ede886987d39e9dc10a`.
The [retained input](fixtures/earned-materials-browser/retained-earned-export.json.gz)
is copied byte-for-byte. This test launches zero combat.

Ordinary public Import/export, manual Save/Saved, read-only game IndexedDB,
page close and new-page Continue conserve all5693 full unique owned payloads,
5677 backpack entries, player, inventory, mercenaries, map/quests and formation.
Currencies remain2461541 rune-shards,8059 wishstones and1159 gem-shards;
Normal253/Nightmare0 and all five material stacks remain exact. Only actual
timestamp/offline metadata and explicit locale changes differ.

Both locales show exact material names/counts at360×640 and1280×800 before
and after Continue. All eight geometry records have zero horizontal overflow
and fitting rows. Four route-ready times are3232.04/2844.55/3371.35/2869.24ms,
all within the unchanged5000ms assertion plus explicit click-to-ready boundary.
Independent QA inspects all eight screenshots and independently compares every
saved domain/item payload. Three attached native exports retain the actual
multiline downloaded text losslessly, including the
[final native export](fixtures/earned-materials-browser/final-native.json.gz).

The dedicated production test passes1/1 in38.216s, retry/skipped/unexpected/
flaky0, empty global/page/console errors. All1745 frozen source/build/input hashes
match after execution; seven emitted JS files pass the five forbidden bridge
patterns, and all12 tracked task processes are absent. Producer/QA READY precede
execution; independent final QA returns ADEQUATE and releases readers.

Final full unit10312tests/369files PASS230.50s with two existing opt-in skips;
engine4826/134PASS58.14s; related3799/180PASS232.04s. Typecheck, full lint,
explicit scoped lint and fresh production build pass. Test-runner time budgets
remain exceeded; no test-runner performance acceptance is claimed.

## Evidence and lifecycle

The [summary](fixtures/earned-materials-browser/summary.json) contains exact
counts, timings, source hashes, results and integrity records. The lossless
[raw evidence archive](fixtures/earned-materials-browser/raw-evidence.tar.gz)
preserves original/setup/storage reports, native/observed saves, six terminal
records, screenshots, profiler, freezes, process records and full-unit log.
Build payloads are excluded; their complete hashes remain in the freezes.

Root owns the original diagnostic root
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-materials-_gkzh9u6`
through umbrella consumers, including immutable attempt markers preventing
accidental repeated combat. Disposable `dist`, `dist-inventory` and storage
browser-output directories are removed after reviews and archival verification;
the pre-existing repository dist and shared caches are preserved. The exact
cleanup receipt is copied with these fixtures. Root removes retained diagnostics
after umbrella consumers finish. Work stays local in the claimed worktree;
there is no push, PR, merge or deployment.
