# Precompile static engine and presentation policies

The authored validator registry now precompiles 40 schemas with the original
all-errors options and one reset policy with its original first-error options.
All 472 affected cases pass. Same-session production comparisons improve reload
in both contexts; these diagnostics do not establish performance acceptance. Large-save snapshot and validation costs
remain substantial, and BUG592 stays open.

## Implementation and verification

Twenty-one additional schemas cover 18 combat/skill/summon policies, image
overrides, dialogue and respec. Twenty-two callers change only their compilation
declarations. Two independently cached virtual modules retain the original
Ajv2020 strict/default options and schema metadata identity; ordinary SSR retains
each caller's original compiler. Both modules share the existing generated chunk.
No authored JSON/schema, gameplay math, secondary guard, save format/migration,
save ordering or dependency changes. No save-result cache.

The initial reset-policy resource/parity cases fail before implementation.
The configured-Vite parity/resource suite then passes 45/45, including original
independently read schemas, valid/malformed data, complete errors/reset, schema
identity, input preservation and mutations of previously accepted objects.
The closest 22 semantic suites pass 427/427. There are 472 distinct cases across
23 files; the three earlier green cases repeat in the final suite. Scoped strict
types, explicit 27-file lint and engine purity pass. No campaign or unrelated
suite is replayed.

Actual configured module execution verifies both caches on edits, invalid schemas,
repeated rejection without stale fallback and repair. It uses manually delivered
watch/HMR events and opens no listening socket; OS watcher delivery is not certified.
This extends [ADR016](../decisions/ADR-016-precompile-authored-catalog-validation.md).

## Production results

Chromium147, desktop1280×800/en and mobile360×640/zh at 4×CPU, activated service
workers and the same complete earned save. A first candidate run regresses versus
the earlier retained v8 sample: desktop reload 1319.343 → 1720.939 ms, mobile
5378.240 → 7045.745 ms; longest tasks 418 → 667 ms and 1967 → 3231 ms.
Those results are retained. The original process handle and driver were absent
after the complete build; the browser portion resumes from those exact assets
after source-authority equality and precache checks, without rebuilding. Build
wall time is unavailable.

The observed regression warrants a focused comparison. The retained exact v8
assets and current v9 assets then run through the same HTTP server implementation
and Chromium instance, with separate origins/fresh contexts and alternating build
order. Public assets are shared because their source bytes are unchanged. Each
context performs public Import → Save → controlled reload → Export; profiler
and fixed-Date settings match. This repeats only the affected boundary.

| Diagnostic | Desktop v8 → v9 | Mobile v8 → v9 |
| --- | ---: | ---: |
| Import confirmation to dialog close | 849.799 → 714.366 ms | 3,070.165 → 3,407.151 ms |
| Saved-character reload | 1,422.543 → 1,203.432 ms | 6,354.931 → 5,821.779 ms |
| Longest reload task | 456 → 431 ms | 2324 → 2200 ms |

These are single profiled localhost samples with a repeated comparison, without
contention control, physical devices, percentiles or a soak. They establish no
statistical or integrated budget acceptance. The initial candidate profiles show
mobile sampled time around 1163 ms in saveSave and 932 ms in the accessor walk,
with decodeSave around 1997 ms inclusive. Inclusive figures overlap and must not
be summed. Reload also includes outgoing pagehide checkpoint work; these profiles
must not be described as only incoming module evaluation.

The primary candidate run exactly preserves migrated33 and all7413items against
the independently decoded canonical source, through public/native roundtrips.
Both comparison builds also preserve their full imported save through reload and
export. Each reload reads one complete save. All contexts have activated controllers,
no bridge, no page/console errors and no horizontal overflow. Both primary
screenshots are inspected. No visual change is observed.

The generated authored chunk is1138936bytes/85390gzip. Total application JS/CSS
gzip grows1172655 → 1195455bytes (+22800). All11application assets and760precache
URLs pass the unchanged2MiB cap. Existing Browserslist, large-chunk and generated
art-manifest warnings remain. No CI or threshold change.

## Authority, retention and remaining work

Authority47 rechecks all2139current inputs, with exactly27declared implementation/
config/test changes from46. All authored JSON/schema bytes and canonical earned
save remain exact. Source hash
`aa02d52bf66ffd8d45625ea0ff866695f4098d297434b36fb015ca60caddac9e`;
data-tree hash `f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`
includes intended TypeScript edits.

Required evidence stays in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-policy-*`, `bug592-production-startup-v9-policy*`, exact compressed output
assets and inherited v8 comparison assets. The closure records terminal processes
and verified disposal of exact build/cache/type-info outputs. Root retains this
packet and the active human2 worktree through umbrella review and owns eventual
cleanup/release.

Next address measured large-save snapshot/storage and validation costs. The
separate lazy compiler in data/loader retains its different formats/error options;
historical save compilers remain lazy. Representative recruitment funding/Hell
income variance, chronological14-build fairness/holdouts, defeat/retry/manual-idle,
30–50active-game-hour pacing and integratedG0–G7/two-hour soak/independent review
remain before owner playtest. Accepted balance0; full-v1 stays active. Browser
works, CI excluded, no outstanding question or external blocker.
