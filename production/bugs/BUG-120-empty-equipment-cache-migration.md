# BUG-120 — Preserve unchanged actor caches during socket migration

Status: Fixed locally in `167aaba`; no push or release claimed.
Severity: High.
Owner: engine-dev / qa-engineer.

Environment: deterministic Vitest engine; browser, locale and seed not applicable.

1. Decode an actually valid historical actor with no owned equipped items, or
   gear with absent/empty runes, and validated nonzero magicResist (for example11),
   or retained life/mana/attack caches.
2. Convert to native19 through migrateSaveV19.
3. Compare unrelated derivedStats before and after.

Expected: with no equipped effects to remove or activate, the socket migration
preserves the exact actor cache. It creates no new unrelated stat change.
Actual: unconditional re-derivation resets magicResist11→0 despite no gear.

Evidence: runtime-engine-attempt.log (selected-aura and magic-mitigation comparisons)
at /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-v19-materials-rh7euwd2;
existing src/engine/save/selected-aura.test.ts controls reproduce the mismatch.
The fixture reviewer separately identified the naked-actor preservation conflict.

Root cause: the new migration recomposes even when the only change is an empty
socket representation. Recomposition is needed when hero-equipped rune effects
activate or hero-equipped gear is quarantined; all other caches must stay exact.
Workaround: keep the native19 rollout local and unaccepted until corrected.

Local correction: recompose only for nonempty hero-equipped historical runes
or removed/quarantined hero equipment; retain unrelated caches otherwise.
Two absent/empty-rune cache regressions failed before the correction, then the
engine suite passed5242/146 (runtime-engine-after-cache-fix.log). The naked bag-only
control and real inserted-rune recomposition controls also pass. Final corrected
source passes10843 tests across390 files (2existing skips); types/lint/build and
corrected en/zh mobile crafting checks pass. Fix committed at `167aaba`.
See `docs/plans/evidence/d10-native19-crafting.md`; earned rollout acceptance
remains separate and open.
