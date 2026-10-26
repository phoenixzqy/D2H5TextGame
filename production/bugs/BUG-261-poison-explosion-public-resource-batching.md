# BUG-261 — Observe Poison Explosion payment at a valid playback boundary

- Severity: Medium (public acceptance is blocked; no gameplay defect established).
- Status: Fixed in `761fa2f1`.
- Owner: root acting as QA/frontend owner; no delegation.
- Build: production source at `05732820ced8d2562bec06927cb3a19699c66f2d`,
  identical 762-file production output to the preceding Dagger validation.
- Environment: Playwright Chromium desktop, 1280×800, en. Fixed Date
  `2026-10-21T12:00:00.055Z`; native timers. Synthetic level18/gear/points.
  Browser recording seed is derived by the production entry path; no seed override.

## Reproduction

1. Run `tests/pwa/poison-explosion-acceptance.config.ts` with the isolated
   production output and task-local report paths.
2. Import the explicit synthetic fixture with head socketCapacity0, allocate
   Poison Explosion0→1→2 and select `[Poison Explosion, Teeth]`.
3. Enter Catacombs through the production map control; observe actual Teeth
   first kill, corpse availability, Explosion cast and positive enemy Poison.
4. Pause and run the current post-cast mana assertion at spec line172.

Expected: establish the exact15MP Explosion cost at the correct resource
boundary, with first-kill/corpse/direct/periodic evidence retained.

Actual: one failed/three not run, exit1,43.400s. The first Explosion DOM frame
already contains the cast, corpse consumption, direct hits and Poison chips.
No later MP change exists before pause: the assertion expects10125 from an
already-observed10140, but obtains undefined. Preceding frames have10148,
10154 then10140; the net14 difference alone does not establish a cost.

## Evidence

Task root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-explosion-public-rt94uggx`.

- `public-socket-report.json`, `public-socket-output/` (trace/screenshot).
- `socket-batch-DOM-timeline.json`:32frames, first cast29, overflowfalse.
- Terminal command receipt `public-browser-sockets`; log SHA256
  `a1e9ef97be2731353e221bf4d99364cab92fc1821a6e22e59d489bd4ed7b4321`.
- The initial extraction diagnostic writes the full timeline then exits1
  looking for a nonexistent subsequent resource frame; preserve that failure.

## Diagnosed cause and correction

`combatStore.advanceEvent` folds every event at a simulation timestamp before
one publication; `CombatScreen` schedules the same timestamp batch. The
observer incorrectly expected per-event commits. The exact imported browser
fixture, native allocation0→1→2 and unchanged Date produce seed2688559832,
ordinal0. At18000ms, events233..257 include regeneration to10155, the actual
Explosion action238, payment10140, consumption and hits/statuses. Input max
is10155 and recovery5MP/s. This diagnoses the observed net14 without treating
it as a14MP cast.

External `native-payment-probe.test.ts` passes1/1 in8.402s with actual import,
stores, ordinary entry resources and recording; only persistence disk I/O is
mocked. `native-payment-diagnosis.json` retains the literal prepayment10155,
postpayment10140, timestamp, batch, hero input and neighboring events. Its log
SHA256 is `259b91f6c4283513439c676e40e10850c8b885b41c4e3cdf66cad02f32fea31f`.

The canonical public test now requires the exact published10140/max10155 and
same-frame cast→consumption ordering. Its attachment distinguishes observed
pre-batch10154 from native within-batch prepayment10155. Exact15MP remains
required and the original first-kill/no-earlier-Poison/direct/chip/periodic
assertions remain. No runtime, fixture, clock, timeout or retry change.
Corrected production browser verification passes4/4 in137.842s; final targeted
strict types and explicit lint pass. The original first-kill/corpse/Poison
path, exact values and eight seven-domain online/offline pairs pass, with no
timeout, fixture or runtime change. The failure screenshot was
individually inspected: paused desktop, MP10140/10155 and living Poison chips;
lower battle/log content lies below its viewport.

See [public evidence](../../docs/plans/evidence/d06-poison-explosion-public.md).

Root retains all failure evidence through this bug and full-v1 consumers.
