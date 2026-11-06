# Precompile the remaining startup data loaders

Ten additional static data schemas now use the existing authored validator
registry. In the retained production diagnostic, mobile reload improves7.35%
and its longest task improves21.66%. Startup/storage/runtime acceptance remains
open; mobile save import is slower in this sample.

## Root cause and implementation

Retained production v7 profiles contain406.752ms desktop/1912.589ms
mobile compiler samples without a mapped application ancestor. Module evaluation
cannot reliably attribute those samples to individual schemas. A bounded actual
SSR-import compiler wrapper identifies remaining eager data loaders, including
quest actions28.082ms, endgame19.168ms, ActV18.156ms, classes15.297ms and
Cow10.252ms. These Node values identify work, not browser speedups.

The registry gains quest actions, the two closed quest reward profiles, class
documents, ActV/Cow source manifests, endgame, replay profiles, Anya trades and
material recipes. Their declarations call the existing typed factory. Original
Ajv2020 strict/allErrors/default options, schema metadata identity, full errors,
fresh input validation and every secondary reference/domain check remain intact.
Ordinary SSR retains each original caller compiler. No generator/plugin, JSON,
schema, save format, migration, currency or gameplay rule changes are needed.
Respec's different allErrors defaults are deliberately outside this extension.

This extends [ADR016](../decisions/ADR-016-precompile-authored-catalog-validation.md).
The unchanged plugin already watches the complete schema directory and registry;
its retained edit/failure/repair checks remain applicable. No broad test or
completed campaign is replayed.

## Affected verification

The browser-loader resource regression is RED before implementation. All22
precompilation cases then pass: the actual configured Vite module checks20
schemas against independently read original JSON and Ajv options, with valid
catalogs, malformed variants, complete errors, input preservation, metadata,
mutations of previously accepted objects and error reset. Existing affected
content/reset/source suites give175distinct passing cases across11files and
retained scoped runs. Scoped strict types and explicit lint pass.

An additional related suite discovers [BUG597](../../production/bugs/BUG-597-khalim-reward-test-currency.md):
its literal Khalim reward assertion omits the already-authored20wishstones.
All original loaders and the original registry substituted in memory reproduce
the identical failure. A separate one-line test correction pins8000XP plus20
wishes; its17cases pass. The original16passes/onefailure and the intermediate
36passes/onefailure are retained. No production reward is changed.

[BUG596](../../production/bugs/BUG-596-quest-item-save-test-preconditions.md)
is also closed locally with its previously verified91/91cases; no rerun is
needed for its test-only documentation closure.

## Production comparison

Baseline v7 and candidate v8 use Chromium147, desktop1280×800/en and
mobile360×640/zh at4×CPU, activated service workers and the same complete earned
save. Candidate scoped jobs finish before production build/profiling. This is
one profiled localhost sample per context, without contention control, physical
devices, percentiles, a soak or integrated budget acceptance.

| Diagnostic | Desktop v7 → v8 | Mobile v7 → v8 |
| --- | ---: | ---: |
| Import confirmation to dialog close | 588.615 → 569.451 ms | 2361.469 → 2626.949 ms |
| Saved-character reload | 1389.312 → 1319.343 ms | 5804.651 → 5378.240 ms |
| Longest reload task | 558 → 418 ms | 2511 → 1967 ms |

Mobile import worsens11.24%; this change targets module-evaluation startup and
does not establish an import improvement. Native save checks remain significant:
mobile inclusive samples are1038.011ms in validation,512.360ms in native sockets
and2177.658ms in the save adapter. These overlap and must not be summed.
Remaining compiler work also includes engine policy modules and respec.

Public Import → Save → reload → Export and IndexedDB exactly preserve migrated33
and all7413items, with only the declared desktop locale change. Each reload reads
one complete save. Both contexts have an activated controller, no page/console
errors, no bridge and no horizontal overflow. Root inspects both screenshots.

Build22.398s;760precache URLs/all11application assets fit the unchanged2MiB cap.
Authored validator chunk804492bytes/62343gzip; total application JS/CSS gzip
1155705→1172655bytes (+16950). Existing bundle-size, Browserslist and generated
art manifest warnings remain. No dependency, threshold, DB or CI change occurs.

## Authority and remaining scope

Authority46 has2139inputs; exactly12implementation/test inputs and the separate
BUG597test change differ from45. Source hash:
`c639c7cd3fdac78dacc4d2cafe383b4f63f6cfd47489bdc42138f4e45eb5b511`.
Data-tree hash `f88d530ed64507d843ca1bd64711b5c4429de7e08e18f26e4a1c09ee957e6270`
includes intended TypeScript edits; every authored JSON/schema byte remains exact.
Canonical earned70/Hell961 source hash stays
`92bb1d9c21175dd4ca9120048a43444b59e4cc9ec060ac7d6a56bcdc96326e44`.

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
retains `bug592-leaf-*`, the v7 compiler-attribution/SSR-callsite diagnostics,
`bug592-production-startup-v8-leaf*`, BUG596closure and BUG597baseline/correction.
Exact emitted code/maps/worker/HTML are archived in
`bug592-production-startup-v8-leaf-profile-assets/` (29files). Terminal jobs and
exact disposable cleanup are recorded in the closure. Root retains the required
packet and active worktree through umbrella review and owns eventual cleanup.

Startup/storage/inventory/runtime budgets remain open, as do representative
recruitment funding/Hell income variance, chronological14build fairness and
holdouts, defeat/retry/manual-idle,30–50active-hour pacing and integratedG0–G7,
two-hour soak and independent review before owner playtest. Accepted balance0;
full-v1 goal stays active. Browser works; CI excluded; no outstanding question
or external blocker. Next use existing profiles to address remaining engine
schema compilation and large-save adapter costs without replaying campaign routes.
