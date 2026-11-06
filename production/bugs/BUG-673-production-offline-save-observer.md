# BUG-673 — Decode the physical save envelope in offline acceptance

- **Status:** Fixed and verified locally; uncommitted on retained HEAD `b5a0898`.
- **Severity:** Medium; prevents P17 verification despite a working game save.
- **Owner / affected systems:** Root / QA; `tests/pwa/offline-gameplay.spec.ts`.

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source including
BUG-672's passive-notification fix. Production Chromium desktop 1280×800, en,
WSL. No engine seed applies: failure precedes any combat admission.

1. Run the existing production offline-gameplay desktop-English case.
2. Ordinarily create a Sorceress, select English, Save and export a backup.
3. Compare the test's native IndexedDB observation with the parsed backup.

**Expected:** independent observation of the complete logical save object.

**Actual:** observer returns `record.data` as if it were an object. Current
physical records carry `encoding: 'json-v1'` and a JSON string, so equality fails
on string versus object. `src/stores/save-adapter.ts` intentionally supports
this physical format independently of the logical save version.

## Evidence and correction

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-native-reader-v1`:
`browser-red.json`, `browser-red.log`, screenshot/trace under `playwright-red/`.
The original test source is preserved as `offline-gameplay.before.ts`.

Parse only the physical JSON envelope in this readonly test observer; retain
legacy object observation and reject unsupported/invalid encodings. Keep every
whole-save, activated-worker, SW response, offline navigation/combat and locale
assertion. No game/save-format change, fixture storage writes or new build.

## Verification

The original desktop-English case fails before combat on string/object equality.
After physical-envelope parsing only, all four original locale/viewport cases
pass in28.2s, with no retry/skip/flaky result. Scoped strict types and explicit
lint pass. The unchanged production bundle is reused from the integrated-reward
slice; no second build. [Current evidence](../../docs/plans/evidence/p17b01-production-offline.md).
Other older specs' duplicated observers are not accepted by this bounded fix.
No commit created; failed trace and final receipts remain retained.
