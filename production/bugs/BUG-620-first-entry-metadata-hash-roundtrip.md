# BUG-620 — Preserve first-entry metadata hashes through journal serialization

Status: Fixed in working tree. Severity: Medium. Owner: root (campaign provenance/QA).

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working source tree
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Environment: Node/Vitest campaign diagnostics; browser, viewport, locale and
combat seed are not applicable to this serialization defect.

1. Capture a first boss entry with a canonical intended profile and configuration.
2. Persist it using `encodeObservation`, then parse and `decodeObservation`.
3. Recompute the initial/configuration/policy/acquisition metadata hashes from
   the decoded values using the documented observation hashing utility.

Expected: persisted values reproduce their metadata hashes, including own
undefined fields. The exact native-export byte hash remains separately bound.

Actual: `first-entry.ts` uses `JSON.stringify` for metadata. JSON key insertion
order changes under observation serialization, and own undefined fields vanish
from this hash input. Equal decoded data cannot reproduce the original hashes.
A reduced `{z: 1, a: 2}` versus `{a: 2, z: 1}` case reproduces the order issue.

## Evidence and cause

The earned `p15-first-entry-corpse-act1-v1` report/journal in the retained
`d2-counted-source-z3jj3xa1` packet exposes the boundary. The native save hash,
admission identity and raw gameplay are unaffected. `tests/sim/contracts/observation-codec.ts`
already provides the canonical, lossless hash needed here. Use it at the metadata
hash origin rather than reconstructing insertion order in each evidence reader.

Regression: `tests/campaign/first-entry.regression.test.ts`. Preserve the
original sample and failure evidence; no campaign replay is required.

## Resolution and verification

Metadata now uses the existing lossless `hashObservation` function and declares
`metadataHashFormat: observation-json-v1`. The exact native-export byte hash
still uses SHA-256 of the original string. No gameplay or save format changes.

The new encode/JSON/decode roundtrip case first failed all four metadata-hash
assertions. All 25 first-entry regression cases then passed. Scoped strict
TypeScript and explicit ESLint (`--no-ignore --max-warnings 0`) pass. The first
lint invocation ignored campaign files; its warning log is retained and is not
counted as validation. Evidence: retained packet artifacts
`p15-first-entry-hash-v2-{red,green,source}.json`, `-types.log`, and
`-lint-explicit.log`. Both disposable scoped configurations were removed and
their absence verified.

Source authentication shows no production/data changes and exactly two changed
campaign inputs: the recorder and its regression test. The earlier earned Act I
sample retains its original noncanonical metadata; independently reconcile its
journal and exact native-save bytes rather than claiming those metadata hashes
were canonical. No earlier campaign was replayed for this fix.
