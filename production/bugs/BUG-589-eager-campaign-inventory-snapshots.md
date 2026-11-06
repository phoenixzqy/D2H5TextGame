# BUG-589 — Avoid eager whole-inventory snapshots during gear scanning

- Status: Fixed in working tree; no commit created.
- Severity: Medium; repeated earned-state preparation scales poorly for balance runs.
- Build/environment: authority28 working tree; local Node/Vite SSR, no browser/locale dependency, no combat/RNG invocation.
- Reproduction: Restore the retained earned L55/ordinal1314 state, grow the declared Javelin build and prepare owned gear with the real journal; repeat three isolated times.
- Expected: Preserve every candidate observation, journal byte and failure boundary while avoiding whole-store copies on slots that cannot attempt an upgrade.
- Actual: Median equip preparation1657.501ms, recorder703.459ms;21 records/17,216,336 uncompressed bytes per sample. Profile records705.470ms in observeEarnedState across three samples; the hero slot loop clones every store before knowing if it has an eligible upgrade.
- Root cause: Full-store observations are used both as candidate input and refusal guards, although only slot-compatible detached data is needed to choose and only actual equip attempts need full refusal guards.
- Evidence: `p15-protected-inventory-preparation-v1.json`, `.cpuprofile.json`, three exact owned journals and `bug589-baseline-v1.json` in the retained external packet.
- Rejected experiment: per-serialization completed-object caching preserves all bytes but median rises1657.501→1767.226ms; codec/journal changes are restored byte-for-byte, with raw v2 evidence retained. No speedup is claimed for that experiment.
- Owner/systems: root; diagnostic campaign gear preparation. Game numbers, sink policy, item ownership, observation format and selection rules remain.

## Resolution

Slot-scoped detached selection data and conditional full refusal guards replace
eager whole-store copies. Mercenary selection skips unused hero/quest projections.
25 affected checks, scoped strict types and lint pass. Final paired median
1611.715→1380.953ms (14.32%) with exact journals and successor hashes.
See [report](../../docs/balance/2026-11-02-protected-inventory-preparation.md).
All game inputs and sink rules remain; full-v1 acceptance stays open.
