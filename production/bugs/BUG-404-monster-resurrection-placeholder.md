# BUG-404 — Shaman resurrection is a permanent self-buff placeholder

- Severity: Medium — the advertised support ability never restores a fallen ally.
- Status: Fixed and verified locally; complete ordinary1178files/25014tests, focused204/204, independent runtime review, strict types, lint, production build and constructed browser validation pass.
- Environment: pure engine/native recorded area combat; both locales/devices.

## Reproduction

Use the actual factory with a starting Fallen ally and Fallen/Carver/Devilkin
Shaman (or Bishibosh), preserving their authored spell order. Kill the Fallen
while its Shaman survives and advance to a legal resurrection action.

Expected: spend one eligible shared corpse and revive that original body once.
Actual: `src/engine/skills/aliases.ts` registers `monster.resurrect_fallen` as a
permanent self buff with cooldown6; JSON authors cooldown5. No corpse is spent,
no ally restored and no revive event exists. Replacing the buff alone would not
solve second-death cleanup or playback's permanent dead-ID latch.

## Approved correction and validation

See [exact design](../../docs/design/monster-resurrection.md). Reuse finite shared
corpse supply; capture original allowed sources/bodies, restore one existing ID,
separate per-life cleanup from once-per-original economic/death effects, and add
an explicit copied revive observation. Keep native settlement/save identity.
Require causal RED/GREEN plus engine/playback/native/replay checks; owner playtest
follows implementation and does not block this authorized mechanic correction.

## Local implementation and current evidence

The native registry now installs the authored zero-MP/five-second ability.
Combat captures eligible original enemies, consumes the existing shared FIFO,
restores one original row and preserves permanent first-death authority while
closing a revived body's second death. Copied revive/status observations clear
the playback dead latch; bilingual UI/log feedback replaces stale death cues.
No save schema or settlement exception was added.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Genuine lifecycle/registry/shared-corpse RED logs are retained under
`bug404-lifecycle-red-v1`, `bug404-skill-registry-red-v1` and
`bug404-corpse-competition-red-v2`. Focused GREEN is
`bug404-focused-green-v3.log` and `-exit.json`:7files/204tests, exit0, no timeout
or owned descendants. This includes native manual/idle transport and controlled
real settlement: two Fallen deaths, one revive, three original reward rolls,
XP120 once and Blood Raven-only quest credit. Settled replay correctly throws
`RecordedWaveAccessError('replaySettled')`; repeated advances leave payment and
all durable domains unchanged. Earlier draft failures remain recorded.

Independent runtime review APPROVE is retained in
`bug404-independent-engine-review-v1.md`. Exact seeded-priority collision was
inspected rather than forced in a test; three seeds do exercise a real5340ms
post-revival action tie. The settlement fixture is controlled, not earned play.

Default Bishibosh's1780ms cadence alternates its higher-priority fire spells,
so this preserves-priority contract does not prove natural campaign resurrection
for that boss. The test pins the default alternation and proves eligibility
separately with both fire spells initially cooling down. No tuning/reordering
was introduced to manufacture a revival.

Final strict types-v4, zero-warning lint-v3, isolated production-build-v1, engine-purity-v1 and offline-
precache-v1 pass in the packet. All seven emitted JS chunks exclude the same
test-bridge tokens as the repository guard;763built files are bound by
`bug404-production-bundle-v1-manifest.json`. Build uses `VITE_E2E=''`, making
its production bridge condition false. Test-only typing corrections preserve
the tested missing-kind/archetype cases and native snapshot values. Lint-v1
exhausted Node's default4GB heap;8GB lint-v2 reported three test-only redundant
conditions, now corrected without changing values or assertions. Final lint-v3
and types-v4 exit0 without timeout or live owned descendants.

Constructed Chromium integration v7 passes at zh-CN360×640 and en1280×800.
The same native original row progresses through death→revive100HP→native
Amplify Damage→second death before terminal playback, with the dead latch,
localized names/art/log/FX and immutable recording checked. Root inspected
the decisive revival/log/status/second-death screenshots. Browser page errors,
console errors/warnings and HTTP errors are empty; all18 bound source files
are identical before/after. Exact owned process/temp cleanup passes. Retain
`bug404-browser-v7/result.json` (SHA256
`c3d6f5cbc01eea7e5b755001b4614577f149f93480f55d3e6c5de54920417389`)
and its10screenshots. This uses the existing DEV bridge and public timestamp
ticks; it proves no earned progression, settlement, production browser or idle-
clock acceptance. Earlier harness-only failures remain retained separately.

Complete ordinary units pass1178files/25014tests under `bug404-unit-full-v2`:
exit0 in1344.324s, no timeout, wrapper error, termination actions or live owned
descendants. Its2276-file code manifests are identical before/after (SHA256
`cacb8483fa08e9d7e929869a347faf8cb71475a82282ac22692fa70facca01c5`),
and the full log has no failure or unhandled-error summary.
V1 was intentionally stopped on the stale native Mage trace, now documented
and corrected in BUG-406 with focused3/3 GREEN; it supplies no full acceptance.
