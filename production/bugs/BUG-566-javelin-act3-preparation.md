# BUG-566 — Prepare earned Javelin before the first Act III burst gate

- Severity: Medium; native manual continuation/preparation remains available.
- Status: Fixed locally; uncommitted. Full campaign/balance acceptance remains open.
- Owner: campaign tooling, root sole writer.
- Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Runtime: Node native campaign service in WSL; viewport/locale inapplicable.
- Production hash: e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a.
- Source authority: supplemental campaign audit 13.

The earned level-24 hero clears Great Marsh then dies at Flayer Jungle wave four
in 5580 ms after entering with 439 Life and 298 Mana. Direct physical damage is
429, versus fire 3 and lightning 30 (periodic damage adds 17, including overkill).
The roster has level-35 Doom Apes: normal Attack 253, elite Attack 379, with
Charge/control. There is no Enrage status in this wave.

Expected: the bounded earned level-28 preparation precedes this first difficult
gate, using already-cleared Great Marsh. Gear probes represent elite physical
hits, possible critical hits and all five elemental channels.

Actual: preparation waits for Durance, beyond Flayer. The Act III physical probe
is raw 240, already at the armor floor for Defense 199/physical resistance 18,
and scores only arcane alongside physical. Additional armor is undervalued.

Reproduction: continue the exact ordinal-298 Act II successor with the original
maintained Act III route and declared Durance-only preparation. Observe the
ordinal-300 successor and Flayer W4 journal. No new seed or power grant.

Proposed local correction: move the same target-28 stage to Flayer entry, retaining
120 admissions, 8000000 combat ms and existing 3 consecutive/10 total loss bounds.
Use raw 379 and 568.5 physical probes (95/5 weighting), plus raw 240 elemental
probes. These probes are selection forecasts, not control or win-rate models.

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
