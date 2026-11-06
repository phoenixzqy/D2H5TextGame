# P15 — Boss poison-status protection

2026-11-05. Type: Tweak; existing combat/monster contract correction, BUG750.

`docs/design/monster-spec.md` §10 explicitly says Andariel and Mephisto
"Cannot be poisoned". Author `statusImmunities: ["poison", "plague"]` for these
two archetypes. Plague is separately represented poison-like state; author both
canonical IDs without adding implicit aliases or boss-ID exceptions.

Extend the existing strict enum/schema; preserve independent copied/frozen
factory metadata and shared pre-application rejection. Direct skills, Venom
and death spread must refuse both states on the real chapter units. Venom
publishes a success event only when its application is accepted. Ordinary
recipients retain their poison payload, damage and events.

Acceptance: native manual/idle positive Poison Nova and Plague Javelin hits,
Venom physical carriers, actual status observations and poison DoT refusal;
susceptible controls/spread recipients still acquire poison; unchanged chapter
stats/source, immutable inputs and plain/recorded/re-record parity. Validate
supported/malformed metadata and copied/frozen factory arrays. Run only these
and existing affected status/Venom/Plague/Freeze checks, scoped strict types/lint.

This corrects status protection only. `combat-formulas.md` §8.1 explicitly caps
player/monster resistance at75%; the older Poison100% entry remains in conflict.
Do not claim zero direct poison damage, change the minimum-one pipeline, or
accept encounter balance from diagnostic casters. No save migration is needed.
The three-stack Mephisto Poison Cloud requirement remains separate.

Plan review: ready; both poison-like IDs, native paths, spread, truthful feedback
and susceptible controls are covered. Security check: pass; no credentials,
network/dependency/CI/permission or persisted-format change. User's existing
implementation authorization and solo/affected-check constraints apply.
