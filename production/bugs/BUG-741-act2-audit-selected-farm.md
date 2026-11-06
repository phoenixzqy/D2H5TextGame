# BUG-741 — Preserve the selected recovery farm in the Act II audit

- Severity: Medium; diagnostic continuation metadata is stale, earned rewards remain intact.
- Status: Fixed locally on `b5a08988` plus uncommitted changes; verification complete.
- Owner: root acting as qa-engineer/engine-dev; no delegation.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing human2 changes.
- Environment: WSL/native TS; browser, viewport and locale do not apply.
- Seeds: retained Fire route ordinals111/131/146/166, seeds3823248858/
  959630054/1075869885/1224645927; no gameplay replay required.

Reproduction:
1. Read the frozen Fire continuation in `d2-act2-caster-summoner-p59d92kj`
   under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/`.
2. Observe the controller's selected Burial Grounds recovery before the final
   Dry Hills defeat, and the audit's `continuation.farm` of Rocky Waste.
3. Run the separate `caster-route-first-v1-readback-v1.py`; its exact terminal
   continuation comparison fails at line370. Failed output and receipt remain.

Expected: audit continuation retains the farm selected by execution, including
successful or interrupted recovery before a terminal route loss.
Actual: the audit changes `farm` on route victories and training defeats only.
It validates the selected training source but never assigns that source to its
continuation state, unlike `trainTo` in the same module.

Affected: `tests/campaign/act2-area-preparation.ts` and its regression cases.
This is diagnostic state accounting, not a balance change or a production-save
mutation. Keep the historical report unchanged; version retained-output readers
and identify its exact stale field explicitly.

## Fix and verification — 2026-11-05

The audit now assigns its validated training source to `farm`, matching native
execution after victorious or interrupted recovery. Training defeats retain the
existing safe-farm fallback. Regression cases in
`tests/campaign/act2-area-preparation.regression.test.ts` reproduce both stale
continuations before the fix and pass afterward.

The retained `d2-act2-caster-summoner-p59d92kj` packet contains the exact
before-sources, RED log/exit1 and GREEN log/exit0. The three affected recovery
files pass **173/173** cases. Scoped strict types cover964 transitive files with
zero diagnostics; explicit `eslint --no-ignore` for both edited files exits0
with no warnings. The earlier ignored-file lint invocation is not lint proof.
See `audit-farm-{red,green}-exit.json`, `audit-types.json` and
`audit-farm-explicit-lint-exit.json` in that packet.

Fire readback v2 preserves the historical report and explicitly reconciles its
stale Rocky Waste field to the executed Burial Grounds source. Its nine reward
and seven mercenary-carry mutation controls pass. No combat was replayed and no
production gameplay/save behavior changed. Formal balance acceptance stays0/210.
