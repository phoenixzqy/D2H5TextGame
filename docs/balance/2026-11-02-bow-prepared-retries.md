# Prepared Bow retries — 2026-11-02

Status: controller implemented and verified; fresh gameplay diagnostic failed.
Private v1 remains unfinished; accepted balance remains 0/210.

The explicit `area-prepared-retry-act2-v1` gives owned-defense Bow at most three
whole native admissions per route area, with earned growth/equipment between
attempts and no intervening farming. All earlier policies remain available.
48 affected controller/dispatch checks, scoped strict types and lint passed.
Source authority71 changes six campaign inputs; production/data remain exact.

The fresh diagnostic records235 admissions/910 played waves/901 wins/nine defeats,
1,132,690 earned XP,8,974 acquired/8,740 salvaged items and9,846,316.587059302 combat
milliseconds. Terminal level21/nextNormal235. Rocky Waste clears on attempt2,
Dry Hills on attempt2, Far Oasis on attempt1. Lost City attempts232/233/234 lose
waves1/3/5 and exhaust the declared budget. There are no native exceptions or
unmeasured/unobserved waves. Do not extend this history.

Independent reader v3 reconstructs every wave/admission, advancing clock/native
seeds, all intrinsic item/currency/material/XP custody, native gear floors,
contiguous bounded retries and exact final save/export/report. Prepared Act II
contains102 admissions:94 training/eight route, three training nonwins,
three cleared route areas and868,620 earned XP. The first419 waves exactly match
the retained one-attempt baseline. Readers v1/v2 had incorrect salvage/quest-action
accounting assumptions; both failures remain retained and v3 corrects them.

Journal diagnosis confirms different incoming damage in the three Lost City
losses. Attempt232 starts496/496 Life and takes542 physical direct damage,
nine elemental direct and14 periodic; minimum mana242. Attempt233 wave3 starts
196/517 Life and takes178 lightning/eight physical direct plus35 periodic;
minimum mana196. Attempt234 wave5 starts208/517 Life and takes310 physical direct;
minimum mana202. These are event sums including potential overkill, not exact
resource deductions. No mana-starvation defect is established.

The journal also records747 stash retrievals:744 `backpack_full` refusals and
three successes. Final backpack117/stash99 shows available stash space. Native
capacity refusal is correct, but the evaluator never stages room for its selected
stash upgrades. This limits the evaluation; it does not prove that better gear
would clear Lost City. The [separate managed policy](../plans/decisions/P15-bow-managed-stash-v1.md)
addresses this without changing production formulas or historical results.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `p15-bow-retry-fresh-act2-v1-plan.json`, the run directory,
`p15-bow-retry-fresh-act2-v1-readback-v3.{py,json,log,exit.json}`,
failed readers v1/v2, ledger diagnostic, `*-loss-diagnosis-v2.json` and affected
check/source-freeze evidence. Loss extraction v1 failed on the wrong `damage`
field; v2 uses native `amount`. Report SHA256
`043d5d2fd10e8fbfaad3453f6cc18eff15d0e4a04e00614136897c856ab7e5de`;
journal `e445e9357297c8ea053c48aa8a59bfb5258d7bdc22ef4e74152418abdf21cb54`.
Root retains required evidence/worktree through umbrella review and owns cleanup.

Remaining scope: fresh14-build populations and holdouts, funding/recruitment/Hell
economics, retry/manual-idle,30–50 active-hour calibration,BUG592 save performance,
integratedG0–G7,two-hour soak/review and later owner playtest. Browser works;
CI excluded; no pending answer/external blocker. No prior passing suite replayed.
