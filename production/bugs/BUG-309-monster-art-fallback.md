# BUG-309 — Render a truthful fallback for missing monster artwork

Status: Open — observed by root during trap production-browser validation.
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
