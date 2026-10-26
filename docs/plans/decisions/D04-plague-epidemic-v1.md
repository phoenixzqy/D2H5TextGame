# D04 — Plague and max-Poison Epidemic

2026-10-26. Root-author implementation contract for BUG281/282 under the full-v1
task. Independent design/QA, earned balance and full skill acceptance remain open.

## Existing authority and behavior

`combat-formulas.md`9.8 requires Plague death spread of50% of total Poison stacks.
`combo-matrix.md`4.3 requires100% when a Plague skill is cast on an already
max-poisoned target, once per combat per cast. The main GDD describes plague
variants spreading without explicitly forbidding ordinary Poison spread.
Adopted Dagger/Rabies/timing contracts retain ordinary half-stack death spread;
preserve that extension. No class-specific exception or duplicate damaging Plague
payload is introduced. BUG281's `d18e689c` already restores the rate-less marker
and chooses the same Poison record for spread count and captured damage rate.

## Precise Epidemic contract

Snapshot the actual selected targets' active Poison before any effects of a paid
Plague cast. An accepted, non-dodged Plague application to a target that already
had ten stacks may mark that target for Epidemic. A hit that raises nine stacks
to ten does not qualify. Plain Poison, bare preloaded Plague, basic attacks,
misses, failed payment and inactive/future/expired Poison cannot establish it.

At a marked target's ordinary death, spread100% of its current Poison stacks to
all current living allies of the dead target. Keep the existing captured-rate,
fresh duration, cleansing, cap/refresh, simultaneous-death and final-interval
rules. The first qualifying death consumes that cast's single Epidemic; later
deaths marked by the same cast use ordinary50%. Distinct paid casts have distinct
allowances. No added RNG roll, periodic damage, resource charge or mitigation.

Epidemic authority is private to one battle and to the actual accepted Plague
marker lifecycle. It cannot be reconstructed from snapshots, emitted status
observations or saves. An expired/replaced marker loses its old authority;
ordinary active refresh retains that marker's existing eligibility. Maintain
eligibility through source death, as with ordinary captured Poison. An expiring
marker that participates in the lethal final interval keeps the existing frozen
death-source semantics. Start every new battle with no Epidemic marks or uses.

Use closed JSON tuning for the ten-stack threshold,0.5 ordinary fraction and1
Epidemic fraction. These values come from the cited design, not new balance
choices. Preserve current5s Poison/Plague lifetimes and cap10. A localized combat
message exposes each actual Epidemic trigger; no message for ordinary spread.

## Ordered increments and validation

1. Four paths: JSON/schema and an immutable validated definition/module test.
   Reject unknown/missing/non-finite/range-invalid tuning and fractions in the
   wrong order. Use actual Ajv/tests; `validate:data` is absent from package scripts.
2. Engine integration and deterministic regressions: pre-cast10 versus9, later
   periodic death, miss/refusal, expiry/future records, once per multi-target cast,
   independent casts, reset/replay and immutable input. Preserve the original
   BUG282 RED and all BUG281 direct/periodic/payment/replay controls. Keep source
   increments within five paths, documentation separate.
3. Bilingual copy/log and native/public verification follow the shared lifecycle.
   Do not credit the full skill from engine-only evidence. Integrate with full
   units/types/lint/build and earned/independent acceptance at their actual scope.

Security check: pass for first-party JSON/pure engine/tests/copy; no dependencies,
credentials, network, permissions, CI or persistent save fields. Root-cause
review: capture qualifying paid casts and consume their actual death modifier.
Plan review: ready with pre-cast snapshot, per-cast consumption and marker-lifetime
requirements above. These author reviews are not independent approvals.
