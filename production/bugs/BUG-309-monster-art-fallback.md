# BUG-309 — Render a truthful fallback for missing monster artwork

Status: Fixed in 19e5d096 — local functional verification complete; independent acceptance remains open.
Severity: Medium — combat names/HP remain readable; portraits display broken images.
Build: 33dc323957ae2f462fe7d1bc6cbec812b5d7eab6; unchanged production assets built at 5eb3948d, VITE_E2E unset.
Environment: Chromium1280×800/en; constructed level30 Assassin, ActV Bloody Foothills.
Engine seed: not pinned by public fixture; reproducible missing asset does not depend on RNG.

## Reproduction

1. Import the retained constructed public fixture from combat-open-act-captures/death-sentry-rank20-prepared.json.
2. Open Act5 and enter Bloody Foothills using ordinary controls; pause combat.
3. Inspect Blood Lord cards and their image request. The URL ends in monsters.act1.blood-lord.png and returns HTML rather than an image.

Expected: available identity-correct art, or a readable deliberate fallback when no art is registered. Never invent or substitute an unrelated monster image.
Actual: Blood Lord cards show a broken-image icon and alt text. The generated registry has no blood-lord entry; the fabricated Act1 path does not exist. HTTP200 alone does not establish a valid image.

Evidence: retained blood-lord-art-diagnosis.json records exact network observations and source locations. Originals combat-open-act-captures/death-sentry-rank20-visible-enemy.png and blade-shield-rank20-visible-enemy.png were individually inspected. All paths are under /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc/trap-red.

Affected systems: frontend-dev/qa-engineer; root sole executor.
Root cause: src/ui/imageHelpers.ts getMonsterImageUrl fabricates a path for unknown slugs; src/features/combat/CombatScreen.tsx compact card uses a plain img with no load-error fallback.
Required correction: reuse existing identity/override resolution and a deliberate missing/error fallback without generating art or claiming new art acceptance. Preserve localized names, accessibility and HP semantics; test unavailable images and a later source change.
Security check: pass for local UI/fallback work; no dependencies, network destinations, credentials or save changes. All prior consumers are terminal before source changes; this report precedes any fix.

## Correction and verification — 2026-10-27

19e5d096 resolves registered canonical monster artwork/curated overrides or returns
null, preserves Act-qualified identities, and uses the existing source-keyed
GameImage missing/decode-error fallback for compact portraits. A later source
change can load successfully. Hero contain/padding and localized names/HP remain.
Regression files: src/ui/imageHelpers.monsters.test.ts and
src/features/combat/CombatScreen.monster-art.test.tsx. Original11REDs become
250related cases/26filesPASS104.270s; scoped types/lint pass.

Actual production Chromium en/zh-CN across360×640,412×915,640×360,1280×800 and
1920×1080 passes10/10 in80.400s. Ordinary import/Enter/Flee/map/re-enter proves:
unregistered Blood Lord makes no fabricated request; registered Death Mauler
receiving intentional HTTP200 HTML falls back after decode failure; the next
native encounter loads real registered Death Mauler art. Names/HP and zero
horizontal overflow are checked; all20 original screenshots individually viewed.
Each fault-isolation context blocks service workers and asserts exactly the
Playwright harness warning "Service Worker registration blocked by Playwright",
with zero other warnings/errors. This run grants no new PWA acceptance.

Frozen19e5d096 final full19833PASS/931files/two existing opt-in skips1017.115s,
fulltypes147.001s/lint252.688sPASS,2539repository/four external inputs/HEAD exact.
Production buildPASS12.317s;762assets/six JS chunks, five tested bridge patterns
absent and all required precache assets among756URLs. Existing bundle/art-manifest
warnings, fixed-nav/sticky-header clipping, lower-row framing, header/glyph
truncation and card-height differences remain explicit limits. No whole-app
mobile/a11y, physical-device, performance, earned or independent acceptance.

Exact receipts/hashes and original browser/static errors are retained in
[the follow-up packet](../../docs/plans/evidence/fixtures/assassin-traps/integration-followup.json).
Original wrong Flee destination and intentional harness-warning classification
failures were corrected in the observer; no app requirement or assertion was
weakened. Raw evidence is now in the read-back-verified charge/trap archive and two sidecars
listed in docs/plans/evidence/d06-assassin-traps.md. All9685raw files,one link and
222directories were exactly cleaned with remaining[]/failures[]; shared dependency
target preserved. Root retains archive/sidecars through full-v1/independent review.
