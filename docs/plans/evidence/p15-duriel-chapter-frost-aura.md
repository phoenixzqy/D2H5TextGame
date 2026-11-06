# P15 — Duriel chapter Frost Aura restored

BUG-732 corrects Tomb `chapterBoss.skills` to retain the native Charge followed
by Frost Aura. The wave builder correctly replaces native skills with authored
chapter skills; its previous Charge-only override discarded the cold mechanic.
Stats, skill payloads and rewards are preserved.

## Verification

Two genuine missing-aura failures precede the JSON correction. Final affected
tests pass: **9 passed, 75 excluded** across `combatHelpers.duriel-aura.test.ts`,
`chapter-boss.test.ts` and `sub-area-run.test.ts`. Scoped ESLint passes; scoped
strict TypeScript reports zero diagnostics across 895 reachable files.

Native manual/idle Tomb seed 13, ordinal 450 retains HP 25,600 / Attack 220 /
Defense 280, Charge first and Aura at 3,000 ms. Hero, mercenary and summon take
cold damage and Chill. Actual action times prove slowed cadence and recovery
after expiry for all three roles; dedicated cadence telemetry is hero-only.
Snapshot/wave immutability and deterministic recorded/plain/repeat parity pass.

Four Chromium checks pass: desktop 1280×800/mobile 360×640 × zh-CN/en, with no
page errors, console issues, failed requests or horizontal overflow. Mobile
English and desktop Chinese screenshots were visually inspected; Chill chips
appear. This uses synthetic party/native combat playback, not an earned run.
Header/location/name and synthetic hero cadence presentation are not accepted
by this packet. No new formal balance acceptance is claimed.

Failed diagnostic versions remain: initial telemetry assumptions for secondary
roles, a TypeScript harness missing normal `vite-env.d.ts`, and a browser
harness launched from the packet CWD. Corrected harnesses preserve strict
settings and gameplay assertions; these failures required no engine workaround.
The CLI Browserslist age notice remains; browser console itself is clean.

## Limits and retention

This restores the existing active skill. It does not settle continuous passive
Aura cadence, Duriel Freeze immunity or BUG-731's wider balance concern. Do not
globally change the shared Frost Aura: later Act V design explicitly preserves
Frozen Terror's active cold wave.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-aura-t8fmqaqn`.
Final evidence: `regression-green-v2.stdout.log`, `types-v2.json`,
`browser-v2.json` and four screenshots/native recordings. Original failures stay.
`cleanup.json` verifies exact PIDs 21418/21990 and both owned caches absent,
servers closed, zero remaining disposables/failures. Root retains this exact
approximately 1.32 MB packet through full-v1 acceptance, then removes it after
all consumers finish. Full private v1 remains incomplete.
