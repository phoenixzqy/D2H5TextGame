# Cold schema-startup investigation

No runtime change from this investigation is retained. The final source exactly
matches authority34's 2,106 inputs, source hash
`aef085ff643770b4e80209ba6761bbda370fe38bf8958354f04c4bb64c701d21`.
The canonical earned level-70 / Hell961 checkpoint and all 7,413 items remain
unchanged. BUG592 and full v1 remain open.

The retained cold mobile reload profile identifies the first shared skill-schema
compilation as about 1,956 ms of vendor leaf samples. Compilation is already
cached by schema identity; this is first-use work, not repeated validation.
The 7,686-line skill schema produces a roughly 2.99 MB main validator function.

| Candidate | Measured result | Disposition |
| --- | --- | --- |
| Disable code optimization | Compilation 624→334 ms; catalog validation 2,525→3,335 ms | Rejected: slower normal validation |
| Disable reference inlining | Compilation 620→543 ms; catalog validation 640→854 ms | Rejected: slower normal validation |
| Standalone browser ESM | Initialization 689→250 ms; validation 653→624 ms; minified probe output 2.31 MB | Not integrated: probe module exceeds current 2 MiB precache limit; no production-bundle or browser acceptance |
| Shared compiler for skills/materials/quests/socket effects | Warm Node compilation 723→638 ms; four instances→one | Removed after browser measurement shows no material mobile gain |

These are alternating-pair warm Node diagnostic medians, not device benchmarks.
The first two probes compare admissions and full error arrays on 287 authored
rows and 60 variants. The standalone probe compares all 287 rows and 1,148
rejected variants with complete error equality; it keeps default optimizer and
inlining. No compiler option change is shipped.

The shared-compiler candidate has a valid resource RED (four instances instead
of one), 383 passing affected cases across eight suites, scoped strict types,
lint and engine-purity checks. Both native desktop/mobile import/export and
explicit Save/reload/export roundtrips preserve the complete earned save.
Desktop reload measures 3.394→3.289 s; 4×CPU mobile measures 9.915→9.982 s.
Selected vendor samples across the four callers total 2,671.765→2,653.084 ms,
which does not establish a material browser improvement. These are single-run
dev-server diagnostics with profiling and automation overhead. The candidate
source and checks are retained as rejected evidence, not current-source tests.

Only this task's four modified source files were restored from captured exact
pre-edit bytes; its three added files were archived and removed. Subsequent
native-loader readback proves the complete authority34 manifest exact. No
previous accepted change is reverted. All 152 authored JSON inputs and native
save validators remain unchanged. No completed campaign, clipboard, inventory
or unrelated suite is replayed. Attribution v1 uses the wrong vendor URL filter
and yields zero totals; v2 corrects it for the task-local Vite dependency URLs.
Only v2 supports the CPU comparison.

## Next implementation priority

A read-only return to F07/P13 finds a more material incomplete feature:
`gacha-spec.md` requires 2/13/85 base rates and 10/50 SR/SSR guarantees; authored
runtime rates are 10/30/60 with thresholds30/90, and the roller/payment flow
threads only one SSR counter. Native seeds180 and54 reproduce respectively ten
R pulls and fifty pulls without SSR. BUG594 records this before implementation.
Existing recruitment-route/payment acceptance explicitly leaves full pity,
duplicates and merc mechanics unaccepted. D10's preserved10/90 costs are not a
rarity/pity exception. Finish the full recruitment contract, with versioned
persistence and duplicate/star behavior, before further funding calibration.
Do not implement SR pity only inside a ten-pull batch or rewrite earned history.

Broader remaining scope stays intact: startup/inventory/storage usability,
representative Hell income and acquisition, chronological14-build funding and
fairness/holdouts, retry/manual-idle, calibrated30–50 active-hour pacing and
integratedG0–G7/soak/independent review, then owner playtest. Accepted balance0;
no pending question or external blocker; CI excluded.

All owned processes are terminal; exact test/browser/reproducer caches are
absent. Required evidence/configs, failed probes, rejected source and reports
remain under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
stems `bug592-schema-*`, `bug592-shared-ajv-*`, `bug592-browser-shared-ajv-v1*`
and `bug594-recruitment-contract-repro-v1*`. Root retains that packet and the
active human worktree2 through full-v1/review and owns eventual cleanup.
