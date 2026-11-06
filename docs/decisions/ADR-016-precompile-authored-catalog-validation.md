# ADR-016 — Precompile static authored catalog validation for browsers

Status: Accepted for local implementation; independent umbrella review remains open.
Owner: root, technical-director responsibility. Extends ADR-015 without replacing it.

## Context

After [skill precompilation](ADR-015-precompile-authored-skill-validation.md), the
[retained production diagnosis](../balance/2026-11-02-remaining-startup-diagnosis.md)
still measures 2.929s unique mobile compiler samples. Static quest, recruitment
and catalog schemas remain eager runtime compilations. Every JSON read must keep
complete validation and each loader's secondary integrity checks. Native save
schemas include version-specific typed contracts and remain separate work.

## Decision

A small `src/data/authored-schemas.ts` registry holds the ten original JSON schemas
for six measured loaders, including the original mercenary array wrapper. The
loaders retain their own Ajv2020 instances with strict/allErrors and default
options. Their compilation declarations call a typed factory that delegates to
the exact caller-owned compiler during SSR and ordinary tests. Browser builds
replace only that factory with imports of standalone validators generated in
Vite's Node process from the current registry and JSON bytes. Callers of this
bounded factory must retain the documented strict/allErrors/default configuration.

The Node generator bundles only the data-only registry with the already locked
esbuild, then uses ordinary Ajv standalone generation. It imports the original
registry module for validator schema metadata, preserving original object
identity, and emits a dedicated chunk under the unchanged precache cap. This
catalog group does not need the skill generator's error-literal sharing pass.
Every supplied input is still validated afresh; complete error ordering/reset
and every loader's consistency/ownership checks remain intact.

Registry and schema changes invalidate the generated promise and virtual module
and request a development reload. Invalid schemas reject generation without
reusing old valid code; a later repair regenerates normally. No engine/store,
JSON content/schema, save format, migration, currency or gameplay rule changes.
No dependency install or version change is needed.

## Alternatives considered

- Retain first-use runtime compilation: leaves measured main-thread work in place.
- Share compiler instances between loaders: earlier screens show limited benefit
  and no material mobile improvement; precompilation removes the first-use work.
- Rewrite loader ASTs or match compile-expression strings in the build plugin:
  couples business modules to generated-code surgery. A short typed factory makes
  the replacement boundary explicit and keeps loader source maps ordinary.
- Include dynamic save/history schemas in this group: those contracts require a
  separate design to preserve historical admission and migration semantics.

## Consequences

Startup avoids compiling this static group, while build/development generation
cost and transferred generated JavaScript increase. Actual production comparison
and packaging checks decide whether this tradeoff is worthwhile. Existing Ajv
instances remain for original SSR semantics and errorsText; their constructor cost
is not removed. The shared registry eagerly imports schema JSON when a participating
loader is imported, but compiles only the requested schema during SSR.

The helper is bounded to the current registry and original compiler options.
New options, formats, external references or validators require explicit parity
checks and generation design, rather than assuming any Ajv instance is compatible.
This local decision does not certify physical-device or integrated performance.

## Compliance

`src/app/authored-precompile.test.ts` checks that participating browser loaders
and the transformed factory contain no runtime compile call. It executes actual
generated validators against independent original JSON schemas/options for every
catalog, malformed variants and mutated previously valid objects, comparing full
errors, input preservation, schema identity and error reset. Existing affected
loader suites retain their semantic checks. The configured-Vite invalidation
probe verifies schema/registry edits, failure and repair using actual generated
code. The production driver verifies the unchanged authored JSON separately
from the source/data-tree hash, exact full-save roundtrips and precache coverage.
Independent umbrella sign-off and full-v1 gates remain open.

Sources: [Ajv standalone generation](https://ajv.js.org/standalone.html),
[Vite plugin API](https://vite.dev/guide/api-plugin.html),
[esbuild build API](https://esbuild.github.io/api/#build), and the retained BUG592
production/source-map and actual-schema diagnostics.

## Extension — remaining startup data loaders, 2026-11-02

The same registry/factory now includes ten further unchanged static schemas for
quest actions/reward profiles, classes, ActV/Cow, endgame, replay, Anya and material
recipes. All use the original strict/allErrors/default Ajv2020 configuration;
respec's different error options remain outside this group. No plugin, generator,
runtime admission or secondary validation rule changes. Exact parity checks and
the measured production tradeoff are in the
[extension report](../balance/2026-11-02-startup-leaf-precompilation.md).
The registry now contains20schemas; ordinary SSR still compiles only the requested
one. Independent umbrella review and broader performance acceptance remain open.


## Extension — engine and presentation policies, 2026-11-02

The registry now contains40all-errors schemas plus respec in a separate
first-error registry. The original strict/default Ajv2020 settings remain per
group. Two independently cached virtual modules preserve metadata identity,
invalidate together on relevant edits, reject invalid schemas without stale
fallback and recover after repair. Both use the existing generated chunk under
the unchanged2MiB cap. Ordinary SSR still uses each caller's original compiler.

Twenty-two remaining static callers change only their compilation declarations;
all secondary guards and authored bytes remain intact. Resource/parity and
semantic verification, actual configured edit/failure/repair checks, production
comparison tradeoffs and exact scope are in the
[policy report](../balance/2026-11-02-startup-policy-precompilation.md).
The separate data/loader compiler with formats/verbose errors and historical
save compilers are outside this extension. Independent umbrella review and
broader performance acceptance remain open.
