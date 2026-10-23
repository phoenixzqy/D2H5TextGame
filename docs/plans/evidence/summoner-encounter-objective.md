# Actual Summoner encounter and ordered kill credit

2026-10-23; base `e426c8e`. Producer source APPROVE/security PASS and independent
QA-SUMMONER APPROVE/security PASS, no material findings. This accepts the bounded
encounter/kill slice, not earned Arcane progression, journal reading or C2.

Arcane Sanctuary's explicit and legacy boss references now use the existing
`monsters/act2.the-summoner`; its three explicit flayer companions remain
ordinary. The quest uses the catalog target and canonical area IDs. Both locales
describe defeat Summoner, then read Horazon's journal. Existing levels, waves,
treasure classes, rewards and qualified settlement logic are unchanged. A
qualified victory credits only the kill, leaving journal false, in progress
and unclaimable. No quest reward or Act III unlock follows.

Regression evidence: seven prepatch failures with 48 passing controls; final
focused 156 tests/four files pass. Initial harness namespace and projected-level
expectations were corrected without changing runtime scaling: generated level28,
legacy24, authored25. The retained failed logs and correction record distinguish
these from product defects. Negative cases cover wrong area, late tracking,
abandoned recording, stale references and draw; save decoding preserves partial
progress and Claim refuses it.

Final full suite: **8875 tests/289 files pass**, exit0,205.13s. Typecheck, lint
and task-local production build pass. All four JS chunks pass the production
bridge scan. The initial overescaped flushSave scan expression was replaced by
the repository script's property pattern and the same build rescanned clean.
The full-suite runtime exceeds the documented15s budget; this slice does not
accept runtime or bundle budgets.

Production browser: **2/2 pass**, en and zh-CN at360×640,58.09s,zero retries or
page errors. The unchanged reused fixture is explicitly **constructed with
injected power**, SHA256
`9c5b8658146e13de6962f386c123e7bfae802999108d6f360901fff814848656`.
Ordinary Import migrates v11 to v12 with an empty quest-item ledger. Tracking
precedes six native wins; the final wave contains the canonical Summoner and
three guards. Kill true/journal false/inProgress survives exact complete
Save→close→new-page Continue. All3920 original item IDs survive among4029 unique
final IDs. Both locale labels render without document overflow; Claim is absent,
quest points unchanged and Act III remains locked. Screenshots independently
show the partial quest card. This is neither earned nor a fresh campaign run.

The first browser attempt failed because the harness expected disabled Enter in
locked Act III; the UI correctly omits Enter. Its one failed/one skipped report,
spec, snapshots and error context remain retained. The corrected run changes
only the assertion. Existing Chinese monster name召唤者 and quest name召唤师 are
preserved. No balance or gameplay change was inferred from harness failures.

Versioned artifacts: English partial-save diagnostic and exact browser script
under `fixtures/summoner-*`. Full raw reports, both locale saves/screenshots,
source/build manifests and corrections remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-summoner-gtbnvvgp`
through journal/C2/umbrella consumers; root removes them afterward. All reviewers
and processes are finished. Exact task-owned dist and both browser-output
directories are removed after preserving the needed failure evidence; the raw
root contains the cleanup receipt and exact ownership inventory.

Next: explicit ordered object interaction and an accessible journal Read flow,
recoverable after Continue without another kill. Existing objective booleans
can persist the receipt without a save version bump. No earned Arcane launch,
Radament retry, balance tuning or Duriel acceptance follows from this slice.
C0/C1 accepted; C2 underway; C3/C4 and full G0–G7 remain open. Local only.
