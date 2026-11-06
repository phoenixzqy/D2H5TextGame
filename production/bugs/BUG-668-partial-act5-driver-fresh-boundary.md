# BUG-668 — Validate a partial Act V checkpoint with its continuation contract

- Status: Locally fixed and verified in the separately frozen V2 external driver; no production contract changed.
- Severity: Medium; external campaign driver only, not a production combat defect.
- Owner: QA / campaign integration (root).
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited local changes retained.
- Environment: installed Node 24.21.0 / Vite SSR in WSL; no browser, viewport,
  locale or combat seed applies to this pre-admission assertion.

## Reproduction

1. Restore the verified Javelin level50/normal ordinal711 partial Act V export,
   SHA256 `ee116d39a7a0b57b696fa8437fab76b92205c78d8eaf5f2a42d2b3af1eae585e`.
2. Invoke external `p15-javelin-prepared-act5-v1-driver.ts` through its frozen
   launcher. The driver calls `assertActFourComplete` before adopting Act V.
3. Observe rejection of the already consumed Malah potion in the quest ledger.

Expected: authenticate inherited Act IV actions and validate the actual partial
Act V graph with `resumeActFiveMain`, preserving the two clears and thirteen
earned actions before training or any new admission.

Actual: the copied fresh-boundary assertion in `tests/campaign/act4-route.ts`
requires exactly the pre-Act-V item/receipt ledger. It rejects valid later
history. Capture/audit then also reports an uninitialized preparation state.
Zero admissions, waves, combat time or income; the terminal export is byte-exact
with the input. Driver wall544.712636ms; measured wrapper5605.873913ms remains spent.

## Evidence and correction

Packet directory:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Preserve `p15-javelin-prepared-act5-v1` plan, driver, launch log/exit, report,
journal and exact native export. Do not edit or replay this terminal attempt.

Root cause: fresh-act validation was retained while adapting the driver to a
partial-act continuation. The existing production and campaign contracts are
correct. Replace that invocation in a separately frozen successor driver with
explicit inherited action-order authentication; the existing Act V continuation
validator retains its full live graph checks. Carry this failed wrapper/driver
cost without renewing any gameplay allowance.

Validation: V2 scoped strict types, explicit lint and source/profile/reader
preflight pass. The sole continuation authenticates inherited Act IV actions,
retains both Act V clears and all thirteen quest actions, and settles 200 earned
training admissions / 1,072 victorious waves. It reaches level62/next911 before
the unchanged 200-entry Crystalline preparation limit stops it. No prepared route
retry or new quest Claim occurs. The corrected boundary is verified; campaign
viability remains unresolved.

The first frozen readback passes six negative accounting controls, exact native
export and ordered item/currency/material/XP/point/party/quest/clock/seed/ordinal
reconciliation without replay. Eleven merc deaths and 22 waves without a merc
remain recorded. V1's zero-gameplay failure/costs remain immutable and carried.
V2 closure verifies all recorded PIDs absent and exact compiler config/cache
absent. Cumulative costs: 911 admissions, 45,538,468.320859015 combat ms,
677,810.956475 driver ms, 733,165.4280702898 reserved execution ms.

Required evidence prefix `p15-javelin-prepared-act5-v2`; report SHA256
`b17d953b8ad6de414567784b9e498be8b3982be97bbbdf7adf5f0608c904e17c`;
native export SHA256
`b9bff03ee6f3be0a0bfb260e8e30ac969b0988324d2abba0b79db2e3aa6705ac`.
Root retains this packet and human2 through umbrella review and owns eventual
cleanup/release. No broad suite, old-act certification replay or renewed limit.
