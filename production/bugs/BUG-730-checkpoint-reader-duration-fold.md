# BUG-730 — Match the native duration accumulation contract in retained readback

- Severity: Low; external diagnostic reader only.
- Status: Fixed locally in a versioned external reader; retained-output review passes.
- Owner: root acting as qa-engineer; no delegation.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current source tree
  `441be64f42573072076f7acb4ba5929c22609d80f0da407a893e67835aadb8e1`.
- Environment: Python 3.12.14 on WSL; browser, viewport and locale do not apply.
- Seed: retained manual screening seed 1; no new gameplay required.

## Reproduction

1. Read `native.journal.jsonl` in
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-throw-act2-screen-qms4rpxa`.
2. Select terminal attempt `manual-1`; its six wave durations sum to native
   `65147.60630259421` ms using ordered binary64 addition.
3. Run the packet's frozen `readback.py`. Python 3.12 `sum` instead produces
   `65147.606302594206`; line 59 rejects exact equality.

Expected: verify the native ordered duration sum exactly and independently
cross-check its numerical value using the existing tolerance policy.
Actual: valid retained observations fail because Python's improved floating
summation is compared bit-for-bit to JavaScript's ordered `reduce`.

`duration-diagnosis.json` reproduces 18 such differences in 200 terminal
attempts, maximum `1.4551915228366852e-11` ms. All 200 native values exactly match
a separate Python ordered left fold. The original failed reader, stderr and
exit record remain pinned and retained.

Affected system: qa-engineer external retained-output verification. Native
runner/reporter, runtime and gameplay outcomes are unchanged. Correct only a
versioned reader copy; preserve the frozen original and do not replay combat.

## Correction and verification

`readback-v2.py` checks the native ordered binary64 sum exactly, then compares
against `math.fsum` with the reader's existing numerical tolerance. Its SHA256
is `3a77216d7f9389c32c63000fc4d45b831be029c7138530b688c5c4331b0f50ea`.
The original prospective plan, reader, failure logs and gameplay outputs remain
unchanged. No production or reusable TypeScript helper was edited.

The guard exercises the corrected reader's actual duration-check block on all
200 retained attempts. All pass, the 18 original failures reproduce, and all
200 one-millisecond duration corruptions are rejected. The complete v2 reader
then passes in 0.406 seconds, reconciling all 200 trials/1,200 waves and current
source/helper pins without gameplay. Exact evidence is retained in the packet
above as `duration-reader-guards.json`, `reader-correction.json` and
`readback.json`. No commit is created during the unfinished umbrella.
