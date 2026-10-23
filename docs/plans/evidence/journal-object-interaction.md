# Explicit journal Read and durable ordered quest progress

2026-10-23; base `1c3cea4`. This completes the bounded journal interaction
slice. It does not establish earned Arcane progression or C2 acceptance.

A pure engine reducer accepts supported, authored area-object interactions
against canonical act/area IDs. Required predecessors must already have own,
strictly true flags before the event. Wrong locations, unresolved targets,
item-dependent or counted objectives and out-of-order events cannot earn credit.
The map store binds events to the saved live location. The feature service also
checks hydration/import, hero, active combat/run, act access and receipt guards.
No new save shape, version, area or gate is introduced.

The map's Inspect action travels to the authored location and opens a localized
panel. Only explicit Read completes the journal objective. Opening, closing,
locale changes and rendering award nothing. Read grants no rewards; the existing
Claim transaction grants 7,000 hero XP and one quest skill point exactly once.
Completed and claimed panels derive their feedback from durable progress.
Close restores trigger focus; Read remains available after Continue without
requiring another kill.

Producer source APPROVE/security PASS. Independent QA source APPROVE/security
PASS, with no material findings. Producer's minor claimed-copy finding was fixed
with separate claimed status and bilingual feedback; two causal failures with
17 passing controls precede that fix. A separate inherited predecessor flag
regression has one causal failure with 17 controls. Initial missing-module/action
failures are scaffold evidence, not independent behavioral regressions.

Final validation: **8,908 tests/293 files pass**, exit 0, 192.21s; engine
4,297/111 and focused UI/store/service 25/4 pass. Typecheck, lint and task-local
production build pass. All four JS chunks pass the production bridge scan.
All 628 source/config and 760 build hashes remain unchanged; the browser helper
has a separate hash manifest. The full suite exceeds its documented 15s budget.
The existing 2.57 MB manifest precache warning remains; performance/offline
budgets are not accepted by this slice.

Production browser: **2/2 pass**, en and zh-CN, 77.26s, zero retries, skips,
flaky results or page errors. The exact input is the existing **constructed**
kill-only Summoner fixture, SHA256
`8b044abe1d9cbd24e1232845f3e5d674c3ab5269f31e81793fd6738dfa780df9`.
No combat is launched and no earned campaign claim follows. Keyboard Inspect
and Read, restored focus, 11 viewport sizes, document/main overflow and 44px
controls pass. Travel changes only location. Read changes only objective/status;
Claim awards exactly 7,000 hero XP, 5,250 fielded merc XP and one quest skill
point, separately accounting for level rewards. Inventory and clears stay exact.
Kill-only, read-unclaimed and claimed states each survive complete exact
Save-close-new-page Continue and ordinary import. Both locales show claimed
feedback after Continue/import; repeated native clicks on disabled Claim leave
state exact. Act III remains locked; the production test bridge is absent.

The first browser attempt failed because the harness expected claimed buttons
to disappear. The product correctly keeps a disabled localized Claimed button.
The corrected harness asserts that contract and adds both-locale claimed panel
feedback checks. No runtime accommodation was made. Initial logs/report/spec,
screenshot and error context remain retained. Earlier RTL query, missing helper
and lint harness corrections are separately recorded.

Versioned fixtures preserve the exact browser script and English constructed
read/claimed saves. Read save SHA256
`b5cef82ad707f12be066f271c454341791b8eff2680b36e9ebb4ab2fe0d45319`;
claimed save SHA256
`4937383dee3675869becae41940b4cd1feceabb2f82069214fa0022180a89c4e`.
Raw reports, both-locale stage saves/screenshots, manifests and correction records
remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-journal-to6bx9bw`
through journal/C2/umbrella consumers; root removes them afterward.

Independent QA-JOURNAL APPROVE/security PASS includes final browser evidence;
no material findings. All readers released and known handles terminal. Exact
task-owned dist and both browser-output directories are removed after preserving
initial failure evidence; cleanup receipt reports remaining[]/failures[]. The raw
root includes the exact disposable inventory and retained ownership manifest.
C0/C1 accepted; C2 underway; C3/C4 and full G0–G7 remain open. Local only.
