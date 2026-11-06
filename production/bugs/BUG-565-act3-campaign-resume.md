# BUG-565 — Retain partial Act III quest progress when resuming

- Severity: Medium; native manual continuation/preparation remains available.
- Status: Fixed locally; uncommitted. Full campaign/balance acceptance remains open.
- Owner: campaign tooling, root sole writer.
- Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Runtime: Node native campaign service in WSL; viewport/locale inapplicable.
- Production hash: e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a.
- Source authority: supplemental campaign audit 13.

The authenticated earned continuation at ordinal 300 has started Khalim's Will
and Guardian and recovered the Brain after clearing Great Marsh. Flayer Jungle
wave four then defeats the hero. `runActThree` unconditionally starts both quests
and admits Great Marsh again; it cannot continue this valid checkpoint.

Expected: authenticate a successful action prefix and the live quest/item/receipt
graph before any mutation, then execute only its unfinished suffix. Keep all
previous Claims, clears, resources and defeats.

Actual: a fresh route invocation refuses the existing quest Starts. Replaying
or resetting would discard earned provenance. There is no maintained resume API.

Reproduction: load the exact successor in the evidence below, retain its three
successful Act III actions, and invoke the fresh route. Seed/ordinal are retained
in that successor; no seed override. The focused regression constructs native
quest prerequisites, explicitly not earned combat evidence.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-javelin-act3-earned-continuation-v1.json`
and its `.journal.jsonl.gz`, driver and frozen policy. All native audits pass;
this is a gameplay defeat. Preserve every earlier admission and settlement.

Security check: pass; local campaign tooling and native earned services only.
No dependencies, credentials, permissions, networking, CI or publication changes.

## Verification

Fifteen affected regressions fail before these two fixes. All 106 affected
Act III route/Javelin/survival checks, scoped strict types and corrected explicit
lint pass afterward. The exact ordinal-300 continuation reaches earned level 28,
clears Flayer Jungle and recovers the Heart without replaying Brain recovery.
All audits pass. A new Bazaar wave-four defeat remains and is retained; this
fix does not claim complete Act III or final balance acceptance. See
`docs/balance/2026-11-02-javelin-act3-preparation-and-resume.md` and the three
maintained `tests/campaign/{act3-route,javelin-progression,survival-gear}.regression.test.ts`
files. No commit was created.
