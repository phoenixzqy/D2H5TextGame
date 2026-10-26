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
Before patching, define the intended Poison3+Plague relationship and shared
spread behavior so adding a second status cannot accidentally double periodic
damage. Reconcile the broad GDD plague-only spread wording with the adopted
shared ordinary-Poison death contracts, already identified by BUG278.

Workaround: its direct damage and three Poison stacks currently function; this
does not supply the missing distinct Plague effect. Inventory remains unverified.
Security check: pass for first-party local engine/data diagnosis; no dependency,
credential, network, permissions, persistence or agent-control changes.
