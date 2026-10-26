# BUG-281 — Preserve Plague Javelin's authored secondary payload

- Severity: Medium — an advertised effect is discarded by the catalog adapter.
- Status: Reproduced; implementation/design reconciliation pending.
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
