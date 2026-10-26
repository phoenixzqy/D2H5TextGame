# BUG-281 — Preserve Plague Javelin's authored secondary payload

- Severity: Medium — an advertised effect is discarded by the catalog adapter.
- Status: Payload and spread-record defects fixed in `d18e689c`; engine retry and full skill acceptance pending.
- Owner: root, engine/content; no delegation or independent approval.
- Baseline: `7ae22e05` plus combat-label locale/test edits, which do not affect
  this diagnosis. Linux, Vite SSR, actual default registry and combat engine.
- Browser/viewport/locale: not applicable to this synthetic engine reproduction.
- Seeds:7,19,41,97; no earned campaign state or actions.

## Reproduction

1. Load the production default catalog and inspect `amazon.plague_javelin`.
   Its JSON declares `appliesStatus: ["poison", "plague"]`, while its registered
   damage effect contains only `applyStatus: {id:"poison",stacksOnApply:3,...}`.
2. Cast once at rank1 against a held, zero-defense/resistance target. The
   synthetic caster has exactly one action before a diagnostic hold, with no
   mana regeneration, and the input is checked for mutation.
3. Seeds7/19/97 land31/36/34 direct damage respectively and emit only Poison,
   followed by15 periodic damage each. Seed41 misses and emits no status/DoT.

Expected: every intentionally authored effect survives adaptation and has a
defined observable mechanic, including Plague. Actual: the secondary status is
absent from both registration and landed combat events.

Evidence: `amazon-plague-probe.mjs`, `amazon-plague-probe.json` and execution
receipt in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-signatures-kwew5kh6`.
This is a synthetic diagnosis, not native/class/earned acceptance. The probe
completed with exit0 despite an unused diagnostic HMR-port warning; it closed
its own Vite server and did not stop any other process. Future probes disable HMR.

## Cause and next correction

`dataCatalog.ts` takes the first authored status and admits secondary statuses
only for explicitly supported skills. Plague Javelin is absent from that path.
The bounded correction restores one ordinary finite Plague marker per landed
hit, without copying Poison's damaging potency. Poison remains the sole periodic
payload: three stacks,5% of the resolved hit per stack per second,5s,cap10.
Preserve the authored line-3 area,25MP,2s cooldown and direct rank scaling.

A second actual probe, `amazon-plague-mixed-probe.mjs/json` in the same task,
finds that `spreadPlague` takes the Plague stack count but the first status's
potency. Six Poison stacks at8HP/s plus one rate-less Plague marker spread only
one stack; reversing record order also loses the rate (8HP/s versus0). Neither
input is mutated. The correction must choose stacks and potency from the same
Poison record, falling back to an old standalone Plague payload only when Poison
is absent. Ordinary half-stack spread and existing source/expiry/recipient rules
remain authoritative. Adding the missing marker must not weaken death spread or
introduce duplicate DoT.

Source clarification: the main GDD says plague variants spread; it does not
explicitly forbid ordinary Poison spread. `combat-formulas.md`9.8 defines Plague
as spreading50% of total Poison stacks. Adopted Dagger/Rabies/timing contracts
also retain ordinary Poison spread. The earlier phrase "plague-only" was an
interpretation, not an exact quotation. Preserve the adopted runtime extension.
The separate max-stack Epidemic rule in `combo-matrix.md`4.3 still needs its own
implementation and acceptance; restoring this payload does not close that rule,
BUG278's full design reconciliation, or the skill's complete inventory entry.

Author plan review: ready for a bounded adapter/helper correction after the
current frozen full run finishes. Regression cases must prove real paid rank1/20
casts, no duplicate periodic loss, miss/refusal, input immutability, repeat
stacking, mixed-record ordering and legacy standalone Plague compatibility.
Root-cause review: repair the discarded payload and shared record selection;
do not patch playback expectations or change global Poison eligibility.

Workaround: its direct damage and three Poison stacks currently function; this
does not supply the missing distinct Plague effect. Inventory remains unverified.
Security check: pass for first-party local engine/data diagnosis; no dependency,
credential, network, permissions, persistence or agent-control changes.

## Bounded implementation and current verification

`d18e689c` restores the authored rate-less Plague alongside the three damaging
Poison stacks and takes spread stacks/potency from one Poison record, with legacy
standalone Plague fallback. No new damage coefficient, saved field or second DoT.
The original external ten-case RED is six failures/four controls. All ten cases
now pass in the repository, including actual rank1/20 payment, miss/refusal,
determinism/input immutability, mixed-record ordering and a real death spreading
four captured8HP/s stacks for160HP to a living off-line neighbor.

The first engine run finishes9453passed/twofailed across357files,233.552s. Its
only failures explicitly require the former missing Plague payload. Both old
oracles are corrected while retaining exact direct damage, HP, mana and replay
assertions and all unrelated scalar/zero-field controls. The final related run
passes169tests/fourfiles,11.273s; five-path strict types5.654s and explicit lint
12.048s pass. Exactly four existing source/test paths and one new test change;
1660other frozen inputs remain exact. The new engine retry is active at tool
session13669; poll that existing run and its `plague-engine-retry.json` receipt.
Do not treat the earlier Mage full-unit pass as validation of this later change.

The continuing task is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s`.
Root retains original REDs, failures, source delta, current receipts and next
Epidemic probes; root will archive/read-back and clean exact task-owned output
after the active engine consumer and continuing implementation finish. No cleanup
or inventory credit is claimed. [BUG282](BUG-282-implement-max-poison-epidemic.md)
reproduces the separate unimplemented max-stack Epidemic. Native/class/public,
earned/independent acceptance and the full private-v1 objective remain open.
