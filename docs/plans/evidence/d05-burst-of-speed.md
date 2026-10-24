# D05 — Paid finite Burst of Speed / BUG178

Implemented locally on feat/playable-foundations, baseline f2de6a0. Root sole
writer/self-review; independent acceptance, earned class/build balance, C2–C4
and full G0–G7 remain open.

Burst now requires an eligible learned Assassin rank and pays ordinary scaled
mana/cooldown once. A JSON-authored ten-second status captures +2% Attack Speed
and +0.5 percentage points physical dodge per rank, cap20/unlock6. Active effects
suppress refresh; expiry allows another cast. Legacy markers supply no potency.
The shared scheduler preserves action phase at onset/expiry, before Chill/enrage
and clamps; physical/thorns dodge uses the existing damage/RNG path. Base stats,
healing, persistent save fields and genuine campaign state are unchanged.

Fresh native waves capture current rank while retaining the remaining duration
and frozen potency of a paid prior-wave cast. Native learning leaves recordings
immutable; repeated explicit replay preserves the original status/resource
baseline and income. Free pure-respec test composition is not proof of the paid
town service. Save/import roundtrips allocation/priority without persisting a
free effect. Bilingual descriptions/current-next rows explain actual mechanics;
localized positive buff chips follow complete status observations.

## Verification

Three native combat failures reproduce on the baseline. The original schema RED
is supplemented by an explicit immutable-baseline-schema audit: its ordinary row
passes, the proposed timed row fails, and the new schema accepts it. Four bilingual
UI cases reproduce stale copy/classification. Additional causal tests expose a
contradictory startup registry override and permanent playback-marker retention;
fixed finite buff events retain FX while status observations own visible lifetime.

Final engine: **5,994 passed / 200 files** (110.35-second Vitest duration).
Final full: **12,111 passed / 504 files**, two existing skips, 422.09-second
Vitest duration (423.51-second npm process). All **1,350** source/test/config
hashes, HEAD and complete Git status stayed unchanged throughout the full run.
Final typecheck, standard lint and explicit lint of all19 changed TypeScript
paths pass. Focused checks cover26 new cases across7 files; all are also included
in the final full run. A separately retained late-cast/rebase assertion exercises
an actual9999.999999999993ms interval, verifies valid copied potency survives
rounding, and rejects expiry/extension. Local implementation commits are
e29a248 (definitions),96e8bae (runtime/playback),837f837 (UI/browser).
No assertion, guard, timeout, required discovery scope or schema validation is
weakened. Original failures and exact terminal command receipts remain retained.
The clean explicit-VITE_E2E=false production build passes all five bridge checks
in four JS chunks; all760 build-file hashes are retained. A prior outside-repo
rebuild retained old hashed files; it was replaced by a clean owned-outDir build
before browser acceptance, with correction evidence retained.

Production browser4/4 covers native learn/upgrade/active-priority selection and
Save/close/new-page Continue, both locales at1280×800 and360×640. Root independently
decodes12attachments, verifies all five domains in four exact Continue pairs and
checks1183browser source inputs unchanged. Chinese mobile Continue and English
desktop allocation images were inspected. Existing icon glyph boxes, bundle/PWA
manifest warnings and test/performance budgets remain open; no whole-screen
accessibility or earned balance acceptance follows.

## Retention and limits

[Fixtures](fixtures/burst-of-speed/) retain **137 raw files** and
**33 terminal process records**, archived and byte-verified
against SHA256/size manifests. [Cleanup](fixtures/burst-of-speed/cleanup.json)
verifies all897 exact task-owned files removed, scratch root absent, port4460
closed, and no remaining temporary paths or cleanup failures. Earlier failed
native/schema/UI/registry/playback/type/lint attempts and clean-build correction
are retained without replacing their results.
Only Burst receives a bounded-functional / independent-acceptance-open inventory
entry; all213IDs remain, with184 still unverified. Older stale entries are separate
reconciliation work; the retained candidate list grants no new acceptance. Genuine claimed Rite save remains decompressed SHA256
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577, nextNormal402.
No earned action or diagnostic-save promotion occurs. Work stays local; umbrella
claim, shared caches, source/history and older campaign evidence are preserved.
