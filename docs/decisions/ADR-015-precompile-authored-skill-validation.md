# ADR-015 — Precompile authored skill validation for browsers

Status: Accepted for local implementation; independent umbrella review remains open.
Owner: root, technical-director responsibility. No stack, gameplay or save-format change.

## Context

The [production startup baseline](../balance/2026-11-02-production-startup-baseline.md)
attributes2.013s of sampled mobile4×CPU startup to first-use skill-schema compilation.
The existing shared compiler already caches by schema identity. The schema contains
overlapping ID and feature conditions; selecting a single ID rule would omit checks.
All authored JSON still requires complete strict schema validation on every read.

## Decision

A Vite plugin compiles the original skill schema with Ajv's unchanged strict,
allErrors and default optimization/reference settings in the Node build/development
server. It replaces only the browser skill-validator factory with an import of a
standalone ESM validator. SSR and ordinary engine unit execution keep their existing
Ajv factory. Both forms validate every supplied row afresh; no input is trusted by
identity. The browser function retains the original schema metadata and complete
latest-call errors. Ajv's internal compiler environment is not used by consumers.

The standalone module has its own chunk and must fit the existing2MiB Workbox cap.
To fit without removing diagnostics, a TypeScript AST pass shares only exact Ajv
error literals with ordered fields instancePath/schemaPath/keyword/params/message.
Each argument retains its original evaluation order; the helper returns the same
ordinary writable/enumerable/configurable data properties. Schema checks and error
ordering are unchanged. Other object shapes are left intact. The generated module
is bundled by the already installed/locked esbuild, now declared explicitly as a
development dependency. No generated source is committed or manually maintained.

The virtual module watches the original JSON schema. A schema edit clears its
generated-code promise, invalidates the module and reloads development clients.
Invalid schemas surface a build/development error. There is no stale validator
fallback after an invalid edit. Fresh production builds generate from current bytes.

## Alternatives considered

- Runtime optimizer/reference/required-loop options: rejected screens reduce
  compilation insufficiently or slow normal validation. No such options ship.
- Ordinary standalone output, including stronger minification: exceeds the unchanged
  precache cap. Raising the cap would leave the packaging constraint unresolved.
- Per-ID rule selection: would require special handling of overlapping conditions,
  else clauses, property rules and root references. It changes the validation path
  unnecessarily when full-schema standalone generation preserves it.
- Moving normalization allocations: rejected after no material mobile improvement;
  corrected profile attribution shows a much smaller cost than schema compilation.

## Consequences

Browser startup avoids schema code generation. Build/development transformation
takes additional Node CPU, and the browser receives approximately149KB additional
compressed validator code. Warm validation has a small measured cost in the Node
screen; the real production browser comparison decides whether the startup benefit
justifies it. This is not a runtime or physical-device performance certification.

The generated error-sharing pass depends on Ajv's emitted shape. An Ajv/schema
upgrade must run the direct generated-code comparison and actual build/precache
checks. A larger unmatched generated shape may require a new packaging design;
the cache limit must not be silently raised.

## Compliance

`src/app/skill-precompile.test.ts` exercises the browser transformation and executes
the actual virtual module against an independent ordinary Ajv compiler. All authored
rows, malformed variants, complete errors, input preservation, changed tuning and
error reset are checked. Existing shared-validator tests remain applicable to SSR.
The production driver checks bridge exclusion, exact emitted precache coverage,
native/public full-save preservation and real desktop/mobile startup. These focused
checks do not replace the remaining integrated, holdout, soak or independent gates.

Sources: [Ajv standalone generation](https://ajv.js.org/standalone.html),
[Ajv code generation](https://ajv.js.org/codegen.html),
[Vite plugin API](https://vite.dev/guide/api-plugin.html),
and the retained BUG592 production/source-map evidence.
