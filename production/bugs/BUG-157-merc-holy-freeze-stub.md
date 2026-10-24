# BUG-157 — Implement the fielded mercenary's Holy Freeze

Severity: High. Status: fixed locally; independent acceptance pending. Owners: engine-dev,
content-designer, frontend-dev. Baseline `c0f90f1`.

## Reproduction

Vitest native combat plus actual JSON→merc factory→combat integration;
locale-independent runtime defect. Production browser verification pending.
Construct `mercs/act2-holy-freeze` from the live catalog, field it with a hero,
and run seed7 against an Attack Speed100 opponent. Compare with no aura.

Expected: continuous Chill slows enemies from entry, the documented20% party
cold bonus participates in normal damage ordering, and the passive consumes no
cast. A dead merc withdraws its presence without deleting independently applied
Chill or resetting pending action progress.
Actual: the first enemy action is1700ms with and without the merc; an inert
permanent self-buff consumes its first action; cold damage receives no bonus.

Corrected causal run:9 failures/16 controls, exit1 in6.45s, before production
edits. Regression paths: `src/engine/combat/merc-holy-freeze.test.ts` and
`src/stores/merc-holy-freeze.test.ts`. Raw logs under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/merc-holy-freeze/`.
The initial run used a wrong test-only player-factory import and omitted the
already-authored Chill combo expectations; corrected before the causal run.
No genuine save, currency, recruitment or campaign attempt is consumed.

Root cause: `MERC_STUB_SKILLS` supplies a buff marker without gameplay; the
actual merc factory projects no aura ownership into combat. Source contract:
`docs/design/gacha-spec.md` §4.1 and the existing JSON Chill multiplier0.5.
Workaround: choose another merc; this does not supply the missing advertised aura.

## Review before implementation

Security check: pass. Local JSON/runtime ownership and deterministic combat;
no external services, permissions, dependency changes or policy bypass.
Plan review: ready. Exact native-merc eligibility is captured by the existing
factory, runtime checks reject dead/enemy/hero/summon sources, and the tuning
is strictly schema-validated. See [contract](../../docs/plans/decisions/D04-merc-holy-freeze-v1.md).
Retain baseline/after native fixed-seed screens and all original saves. This
does not accept other merc auras, player Holy Freeze or campaign balance.

## Local correction and verification

Native factory-owned source, shared derived Chill/pending-phase reconciliation,
JSON20% additive party cold and a real passive registration replace the stub.
Public AI also skips passives; both locales describe the implemented effect.
Root self-review confirms no raw-status/save mutation or extra RNG/cast path.

Focused188/7 plus75/4 cross-system, engine5713/175 and final full11600/444
(+2existing opt-in skips,432.24s,exit0) pass, as do types, lint and production
build/four-chunk bridge scan. Old stub and non-aura-control assumptions are
corrected at their actual sources; original failures remain retained. Native
en/zh×five-size roster/combat20/20 plus exact hire Continue pass.

[Evidence](../../docs/plans/evidence/d04-merc-holy-freeze.md) includes the
before/after17-seed screen, unchanged Rogue control and failed owned-gear
projection. Genuine next272 save stays unchanged; this closes the missing aura,
not Travincal, other auras, full gacha or final campaign acceptance.
