# Actual Radament encounter and qualified quest credit

2026-10-23; implementation base `2b50d02`. D11 children A/B are accepted;
producer source/security APPROVE and independent QA-A/B ADEQUATE, no material
findings. This is encounter/objective
integration, not an earned Act II campaign or complete Radament reward claim.

Far Oasis now uses catalog `monsters/act2.radament` in both encounter forms.
Its four mummy companions explicitly remain ordinary. Explicit nonchapter boss
encounters inherit the sole authored boss-wave treasure class, reject multiple
defined sources, and retain the area fallback when no table exists. Chapter-boss
TC authority and the legacy spawn/RNG path remain intact. This shared correction
affects 14 nonchapter maps; historical C1 at `5f417b4` does not establish a fresh
route's loot or gear identities on this changed runtime.

The builder captures catalog provenance. Qualified native settlement matches the
planned boss against the frozen original enemy and a unique truly dead final
enemy, after receipt/playback/winning-result/living-original-hero checks. One
pre-event quest batch advances tracked exact-act/area/archetype boolean `kill`
objectives, preserving flags and ordered prerequisites without cascading.
Completion grants no automatic rewards. Unsupported counted goals do not advance.

Planner regressions first failed 10 cases, with 60 controls. The legacy chapter
append edge failed separately before correction. Provenance/native quest wiring
failed two cases; correcting only quest IDs still failed the native test. The
batch reducer failed 17 cases before its API existed. Final focused tests pass
139/4 files; engine passes 4237/109. The full suite initially rejected historical
mage fixture hashes in 76 cases because factory provenance changed serialized
units. Two historical fixture construction boundaries now verify exact catalog
provenance before projecting to their original DTO. Fixed hashes, recipes,
semantic validators and oracles remain unchanged; six mage suites pass113 tests.

Final integrated gate passes8735 tests/282 files in214.87s, typecheck, lint and a
clean production build with `VITE_E2E` unset. All four JS chunks pass the bridge
scan. Runtime/test-speed and bundle budgets remain open. Frozen1548 source,
760 build and five final browser-input hashes have drift[].

Production Chromium proofs use an explicitly **constructed** import derived
from the genuine C1 save. Seven changed paths inject a labelled head affix,
matching cached attack/defense/HP, full HP, empty combo and diagnostic name.
No constructed power is represented as earned progression. Each successful
en/zh-CN case clears all five native waves and kills actual Radament, completes
the tracked objective, and leaves the reward unclaimed and skill points unchanged.
All3920 original IDs remain; each final save contains4005 distinct owned IDs.
Full export/IndexedDB/Save-close-new-page-Continue states match exactly.
Quest panels at360×640 and1280×800 have no horizontal overflow; no page errors
or test bridge are observed. These are bounded wiring checks, not a full UI,
balance, manual-play, touch-target or pacing acceptance.

The English case passes in the first invocation. That invocation's Chinese case
fails before combat because the harness requests the English ActII label. A
second invocation rediscovers the archived old spec and repeats that setup
failure; the corrected case does not run. Isolating `testDir` to `spec/` and
using the actual Chinese label resolves discovery/selection. The final Chinese
invocation passes1/1 in27.8s, zero retries/skips/flaky cases. Both failed reports,
scripts and the selector screenshot are retained; no game code, input power,
seed or build changes between attempts.

The [Chinese encounter screenshot](fixtures/bug096-radament-zh-CN.png) shows
Radament and four ordinary mummy companions; the
[completed quest screenshot](fixtures/bug096-radament-completed-en.png) records
the unclaimed objective. Existing Sewers wording and reward presentation remain
known later D11 work; neither screenshot accepts those strings or book semantics.
The [browser script](fixtures/bug096-radament.spec.ts.txt) and
[summary](fixtures/bug096-radament-summary.json) accompany the raw proof.

Required logs, scripts, inputs, full saves, recordings, manifests and failed-run
evidence remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-09s2yzs1`
through dependent C2/full-v1 consumers; root removes them afterward. Preview
port44337 is closed. After independent reader release, exact task-owned
dist/tmp/cache/browser-output cleanup is recorded in the linked summary and raw
cleanup receipt. Required evidence remains available to dependent consumers.

Book storage/codec, claim/Read transactions, Atma and revised copy/locales remain
next D11 children. C2–C4, full G0–G7 and complete private v1 remain open. Local
work only; no push, PR, merge or deployment.
