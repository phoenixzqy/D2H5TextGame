# ORMU-08F — Advance current-version test fixtures

Status: implementing. Test-only compatibility continuation of Save25 registration.

Update current-save version assertions and empty-slot current-default fixture
helpers to25. Keep literal23/24 constructors, migration targets and distinct
frozen readers unchanged; literal24 tests now use validateFrozenV24Save. Current
reader comparison cases explicitly construct25. Compile-laziness continues to
import the runtime only after its spy is installed and expects just current25
schema compilation. No numeric combat expectations or runtime admission change.
Prior-step test source snapshots and exact paths are retained in version-fixtures-before
and its manifest (a later edit may replace the earlier step snapshot) in the root-owned Ormus packet. Focused compatibility and
coherent type/lint/full ordinary tests must verify these mechanical updates.
