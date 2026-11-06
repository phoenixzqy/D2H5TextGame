# ADR-017 — Precompile selected save structural validators for browsers

Status: Accepted for local implementation; independent umbrella review remains open.
Owner: root, technical-director responsibility. Extends ADR-015 and ADR-016.

## Context

The complete earned 7,413-item save still incurs substantial startup validation
after static catalog precompilation. Native schemas are assembled from versioned
contracts and quest domains; the original compiler uses Draft07
`new Ajv({ strictNumbers: true })`, with its other defaults. Historical schemas,
descriptor checks, ownership graphs, migrations and durable publication ordering
must keep their exact behavior. BUG592 tracks the remaining performance work.

## Decision

A private lazy compiler helper captures exactly the assembled current33, literal
frozen32 and quest-ledger-context schemas. Vite's Node generator imports the real
validation module through a temporary SSR loader using normal eager JSON/glob
semantics, without application plugins, dependency discovery, file output, watcher
or listening sockets. It generates standalone code with the original Draft07
options and closes the loader in `finally`. A dedicated browser chunk contains
only these generated checks.

Only the browser helper is transformed. The selected lazy getters return the
generated function and attach the original captured schema object as metadata on
first use. Other historical getters continue to compile lazily with the original
caller-owned Ajv. Ordinary SSR/tests retain their original compiler. Every supplied
save is checked afresh; no input-admission result is cached. All structural schema
assembly, native/domain/descriptor checks, migrations, cloning, queued writes and
durable-before-publication behavior stay intact.

Conservative engine/data edit invalidation discards the generated promise and
virtual module and requests reload. Invalid schemas fail without reusing stale
code; repair regenerates normally. Imported source files and engine/data roots
are watched. The registry must contain exactly the three named keys.

## Alternatives considered

- Keep runtime compilation: retains measured first-use main-thread work.
- Extract or reconstruct every historical save schema: enlarges a sensitive
  migration change unnecessarily and risks changing captured domains.
- Cache successful save validations or omit descriptor/domain guards: mutable
  inputs and untrusted native storage require fresh complete checks.
- Disable Dexie caching or switch to JSON storage: retained profiles attribute
  native get/put materialization, without evidence for those changes; JSON can
  erase native values that the guards must inspect.

## Consequences

Browser compilation cost moves into build/development generation, increasing
generated JavaScript and build work. Vite SSR capture is heavier than a data-only
registry, but preserves the actual schema assembly without string-based source
rewrites or a second schema implementation. New formats/options/custom keywords
require revisiting standalone parity. Adding another selected key requires an
explicit helper/generator/test update. The existing precache cap stays unchanged.

## Compliance

`src/app/save-precompile.test.ts` executes the transformed browser helper and real
generated module. It compares original Draft07 admissions, complete errors,
input preservation, schema identity, invalid-input mutation, error reset and
historical fallback laziness. The rich earned-save probe pins all three schema
hashes against pre-edit originals. Existing native/adapter tests, configured-Vite
edit/failure/repair/no-listening-socket probes, and exact public/native production
roundtrips provide affected-path evidence. Single localhost timings do not certify
physical-device percentiles, a soak or full-v1 performance budgets.

Sources: [Ajv standalone generation](https://ajv.js.org/standalone.html),
[Ajv options](https://ajv.js.org/options.html),
[Vite SSR API](https://vite.dev/guide/ssr.html#setting-up-the-dev-server),
and the retained BUG592 production profiles and actual-schema diagnostics.
