# BUG-665 — Preserve unprepared Act V attempts when starting area preparation

- **Status:** Fixed and verified locally; independent final review remains outstanding.
- **Severity:** Medium — earned preparation is possible in the game, but the campaign controller cannot account for this partial checkpoint.
- **Owner:** root; campaign preparation and QA accounting.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus current retained source tree `20a3f5414417b26102032542c74f913349cc8b979a14d5ea28428ee5fa87fe3f`.
- **Environment:** WSL/Linux, installed Node/Vite SSR native stores; browser/viewport/locale not exercised.

## Reproduction

1. Use the retained Double Throw Act V continuation from level49/ordinal712.
2. Observe Bloody Foothills712/seed1231165587 and Frigid Highlands713/seed3705479828 clear, with both rewards claimed.
3. Crystalline Passage714/seed1402803244 draws on wave0 at60seconds; retain the exact level49/next715 native export.
4. Inspect `createActFiveAreaPreparation`: it rejects any existing Act V quest, receipt or clear. `resumeActFiveAreaPreparation` accepts only a wall-budget stop in an existing controller, not this settled unprepared route prefix.

## Expected

A separately declared preparation continuation can adopt the complete actual unprepared route prefix, retaining its two clears, failed admission, XP, ordinals and original limits. The failed Crystalline admission must count toward its three route attempts. An exhausted controller must stay terminal.

## Actual

No supported constructor accepts this earned partial state. Starting a fresh controller would erase history; treating the settled draw as a wall stop would misstate the failure. Neither is acceptable.

The recorded fight killed17of20level67enemies, leaving8808Life across three survivors. The hero survived with sufficient mana; the level31Prayer mercenary died. These observations do not establish an engine defect or justify another damage increase.

## Evidence

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`, prefix `p15-throw-earned-act5-v1`: frozen plan, report, journal, native export, passing retained-output accounting and closure. Three admissions/13waves:12victories/one draw; zero training/retry/unplayed suffix. Native export SHA256 `b96c06d41d90daa28cce1b38a5e7358f2421666b42648f2cbf5afe0926fc98db`.

## Scope and workaround

Add explicit unprepared-prefix adoption to the shared controller with exact live ordinal/XP/clear custody and a complete retained-wave audit. Preserve fresh creation and wall-only resume behavior. Caller must authenticate parent evidence and carry global costs; adoption grants no earned progress. No production balance change is proposed. Root self-triages under the existing no-new-agents constraint.

## Local resolution — 2026-11-04

The shared constructor and Act V export now retain and audit the complete
direct-route prefix, including the failed admission's retry cost. Thirty
affected preparation cases, a native-quest/constructed-combat integration case,
five selected shared-controller guards, scoped strict types and explicit lint
pass. The final type check exposed an integration-fixture callback mismatch;
its adapter is corrected and the affected case/types/lint pass afterward.
[Evidence](../../docs/plans/evidence/p15-unprepared-route-continuation.md).
No native campaign, saved state or production gameplay changed in this repair.
