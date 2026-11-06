# Browser skill validation precompilation

The browser now imports a validator generated from the unchanged skill schema
by Vite's Node process. It no longer compiles that schema during startup. The
matched production diagnostic improves saved-character reload by 23.4% on desktop
and 21.3% with mobile CPU emulation. Large-save startup and full v1 remain open.

## Implementation

`scripts/precompile-skill-validator.ts` replaces only the browser factory. SSR
keeps the existing Ajv compiler. Generation uses the original strict/allErrors
options and complete schema. Every supplied row is still validated afresh with
identical admissions and complete errors. No schema, engine source, game data,
save format, migration, ownership guard, reward or canonical checkpoint changes.

A small AST pass shares only exact ordered five-field Ajv error literals. This
keeps the standalone chunk below the unchanged 2 MiB Workbox cap without removing
checks or diagnostics. The already installed/locked esbuild 0.21.5 is now an
explicit development dependency; no install or dependency version change occurs.
Schema edits invalidate generated code; an invalid schema fails compilation.
[ADR-015](../decisions/ADR-015-precompile-authored-skill-validation.md) records the
implementation and tradeoffs.

## Production comparison

Both runs use Chromium 147, the default minified production build, exact emitted
source maps, a warmed/activated PWA, no E2E bridge, and the same complete earned
level-70/Hell-961 save. Desktop is 1280×800/en; mobile is 360×640/zh-CN with 4×CPU
slowdown. The reload endpoint is saved-character navigation/locale plus two
frames in both runs. These are matched single localhost diagnostics with CPU
profiling, not device measurements, percentiles, cold-network tests or a soak.

| Diagnostic | Desktop baseline → candidate | Mobile baseline → candidate |
| --- | ---: | ---: |
| Public import, confirmation to dialog close | 714.942 → 736.533 ms | 3210.982 → 3044.575 ms |
| Saved-character reload | 2075.766 → 1590.933 ms | 8397.960 → 6608.842 ms |
| Longest reload task | 1151 → 673 ms | 5087 → 3129 ms |
| Skill-factory inclusive sampled CPU | 446.333 → 0 ms | 2013.269 → 0 ms |
| Save-validator inclusive sampled CPU | 361.934 → 334.789 ms | 1362.188 → 1414.123 ms |
| Save-adapter inclusive sampled CPU | 608.482 → 572.577 ms | 2423.925 → 2441.982 ms |

Each CPU sample counts once per source along its stack; inclusive rows overlap
and must not be added. Zero skill-factory samples are consistent with the
transformed factory having no runtime compiler, not a claim that generated
validation, parsing or initialization is free. The virtual generated module may
have unmapped frames. Desktop import is slightly slower; no import speedup is
claimed. Save loading and the remaining compilers still require work.

The emitted standalone chunk is 1,986,809 bytes (148,343 gzip), below 2,097,152.
Total application JS/CSS gzip grows from 893,707 to 1,042,094 bytes. Build time is
18.55 seconds versus 14.24 seconds for the baseline. The actual precache checker
passes all 758 URLs and all nine application JS/CSS assets. The pre-existing
large art-provenance JSON warning remains; no cache cap is raised.

Ordinary public file Import → explicit Save → reload → Export and native
IndexedDB preserve the full migrated version-33 save and all 7,413 items. Only
the declared desktop locale differs. Both startup reads remain one, both pages
are service-worker controlled, and neither has page/console errors or horizontal
overflow. Root inspected both screenshots: save controls and navigation are
intact. This does not certify all PWA, accessibility or device budgets.

## Focused verification and limits

The resource test first fails on browser runtime compilation. Five distinct
affected cases then pass: the existing shared-validator pair and three generated
validator cases. The final three-case rerun, scoped strict types and explicit
lint pass after correcting test typing and AST-loop lint issues. Generated code
matches independent ordinary Ajv on 287 authored rows plus malformed variants,
1,444 input cases total, including full errors and input preservation. Mutated
valid tuning is rechecked and later valid input clears errors.

A separate current-plugin hook probe checks cached generation, watch-change
regeneration, invalid-schema rejection without stale fallback, HMR invalidation
and full-reload request, repair recovery, and unrelated-file exclusion. Its first
harness invocation omits Vite's hook context; that retained infrastructure failure
is corrected in v2. This tests hooks and actual generated code on a task-local
small schema, not filesystem watcher delivery. Full-schema and production tests
provide separate evidence. No completed campaign or unaffected suite is run.

Authority41 pins 2,132 inputs, source hash
`0029ffb45ea063e2344f77673a796a23fd8995887f0448b4f3abe29085958647`.
Exactly five inputs differ from authority39: package metadata, the new plugin,
its generated-code test and Vite configuration. All game data and the canonical
earned save remain exact. Authority40 remains rejected candidate evidence only.
This root review and separate arithmetic/hash readback are not independent
umbrella sign-off. Accepted balance cells remain zero.

## Retained evidence and next work

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Authoritative stems: `bug592-precompile-*`, `bug592-production-startup-v3-precompiled*`
and the earlier `bug592-standalone-*-probe-*` screens. Exact emitted JS/CSS/source
maps/worker/HTML are losslessly compressed in
`bug592-production-startup-v3-precompiled-profile-assets/`. The disposable
distribution, task Vite caches, probe roots and build information are removed.
Raw failures, final checks, profiles and screenshots remain required evidence.
Root owns this packet and the active human2 worktree through full-v1/umbrella
review, with eventual cleanup/release responsibility.

Next inspect the remaining production compilation and save-loading stacks;
retain all validation, migration and save-publication guards. Representative
economy/income variance, chronological 14-build funding/fairness/holdouts,
defeat/retry/manual-idle, calibrated 30–50 active-game-hour pacing and integrated
G0–G7/two-hour soak/independent review remain before the later owner playtest.
Browser works, CI stays excluded, and no user answer or external blocker is pending.
