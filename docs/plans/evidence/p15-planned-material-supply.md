# P15 — Encounter-weighted repeatable material supply

2026-11-04. This conditional numeric component is locally verified. P15,
all-source economy acceptance and full private v1 remain incomplete.

`tests/sim/production/planned-material-budget.ts` combines the existing native
independent, special-bundle and mixed-TC models with actual planned kill counts.
It resolves all 29 areas in Normal/manual mode, seed 7, ordinals 0–12: 377 fixed
plans, 215 distinct reward contexts and 25,974 planned spawn occurrences. These
are planning witnesses, not campaign admissions or an encounter-frequency model.

Native reward projection determines which TC material picks survive. Of the
215 contexts, 207 use ordinary independent materials, eight use replacement
chapter-boss/goblin bundles and seven additionally retain live TC materials.
Bundle supply replaces ordinary independent supply. Each plan retains counts
and source identities, separate channel means, total means and the marginal
chance of at least one of each rune/gem. Under independent uniform output draws,
the latter is one minus the product of per-source/per-kill no-drop probabilities.
TC quantity means retain the native selection residual's material identity.

Representative ordinal-zero plans:

| Area | Planned spawns | Mean runes | Mean gems | Chance of at least one Sol |
| --- | ---: | ---: | ---: | ---: |
| Blood Moor | 27 | 0.500 | 0.900 | 0% |
| Catacombs | 51 | 1.638 | 3.245 | 0% |
| Tomb of Tal Rasha | 51 | 2.314 | 4.505 | 17.466% |
| Durance of Hate | 51 | 2.814 | 5.505 | 2.274% |
| Chaos Sanctuary | 64 | 3.348 | 6.635 | 2.346% |
| Throne of Destruction | 78 | 5.944 | 11.340 | 5.284% |

These are modeled repeatable material supply for a fully settled fixed plan,
not observed player income. Material-specific access need not increase with
later acts because authored bundle identity bands differ. No tuning is inferred
from this table alone. Once-only quest/first-kill rewards are excluded. Quest
reward projections may replace ordinary settlements and are outside this model;
so are dynamic summons, Find Item, endgame, salvage, currencies and gear retention.
Combat success, PRNG seed-population behavior, joint recipe acquisition, repeated
rune completion distributions and player hours are not established.

## Verification

Three focused cases pass in about 1.8 seconds of test execution after the
missing-module RED: independent synthetic mean/probability arithmetic; refusal
of missing/duplicate sources, invalid counts/probabilities and overlapping
replacement channels; and full native-plan count/context reconciliation with
boss replacement and live-TC checks. Scoped strict types and explicit two-file
lint pass. Initial lint required two type aliases to become interfaces; exact
reported bytes are retained. Tests were not repeated for those type-only edits.

Separate Python/Decimal readback checks every material/source/count combination,
all 15,444 positive material rows, no-drop products and original component
report equality. Relevant loot/model authority hashes match all three earlier
component reports. All 2,100 production files remain exact since report capture;
2,091 were also included in the initial rg-based before snapshot. The remaining
manifest difference is precisely the two type-to-interface lint edits. Root
self-review is not independent acceptance. No broad suite, build, browser,
combat simulation or campaign replay was run.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-planned-material-budget-q59pchcw`.
Report SHA256:
`397c455578035f1f7398ca5ac520f0945865057b51c9d8e15799d0d699a3cea2`.
Six recorded check PIDs are absent; scoped config is archived as text and removed;
no server/cache or cleanup failure remains. Root retains the required packet and
human2 through unfinished umbrella review, then owns exact cleanup/release.

This follows closure of [Find Item accounting](p15-find-item-material-accounting.md).
**14/14 Act I; 10/14 intended Normal; formal balance 0/210.** Holy Bolt, Zeal,
Double Swing and Javelin remain unfinished. Next economy work must combine
actual authorized channels and sinks with joint recipe demand and earned
encounter/time policies before affordability or pacing acceptance. Wider
difficulty/endgame, PWA/device/performance, soak and independent acceptance remain.
