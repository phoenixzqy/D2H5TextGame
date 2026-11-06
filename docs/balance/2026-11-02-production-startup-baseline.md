# Production startup baseline and normalization investigation

No runtime optimization from this investigation is retained. The candidate
passes its affected behavior tests and native browser roundtrips, but does not
improve mobile startup. Only this task's candidate changes are removed; the
complete 2,130-input authority39 source manifest is restored exactly. Existing
recruitment, inventory and save-read fixes remain intact. Full v1 stays open.

## Production evidence

A default minified production build, with `NODE_ENV=production` and no E2E
bridge, completes in 14.24 seconds. The actual Workbox checker verifies 757
precache URLs, all eight application JS/CSS assets and installation PNGs. Every
emitted application chunk remains below the unchanged 2 MiB precache limit.
The generated art provenance manifest exceeds that limit and is not precached;
this build warning is retained. No cache threshold or source configuration changes.

Chromium147 runs desktop1280×800/en and mobile360×640/zh-CN at4×CPU. Each uses
the complete earned level70/Hell961 export, ordinary file Import, explicit Save,
reload and public Export. IndexedDB and both public exports equal the complete
migrated33 save, including all7,413items. Only the declared desktop locale differs.
The canonical earned source is untouched. Both measured reloads are controlled
by the activated service worker, perform one full save read, expose no test
bridge, have no page/console errors or horizontal overflow, and have inspected
screenshots with intact save controls. This does not repeat the already recorded
network-disabled P17 flows or certify all PWA/install/accessibility requirements.

| Production diagnostic | Desktop | Mobile4×CPU |
| --- | ---: | ---: |
| Public import, confirmation to dialog close | 0.715s | 3.211s |
| Saved-character reload | 2.076s | 8.398s |
| Longest reload task | 1.151s | 5.087s |
| Skill-validator source, sampled inclusive CPU | 0.446s | 2.013s |
| Save-validator source, sampled inclusive CPU | 0.362s | 1.362s |
| Save-adapter source, sampled inclusive CPU | 0.608s | 2.424s |

The reload endpoint is the public saved-character navigation and locale followed
by two frames. Source inspection confirms hydration publishes those stores and
sets ready synchronously before React renders the navigation. Earlier development
diagnostics explicitly inspect the internal ready store; endpoint and execution
mode differ, so their timings do not establish an optimization percentage.
These are single localhost runs with profiling/automation, a warm PWA and CPU
slowdown, not physical-device Web Vitals, percentiles, cold-network or soak proof.
Inclusive CPU rows overlap and must not be added.

Exact emitted source maps map the minified production CPU frames back to source.
Each sample counts at most once per source along its stack. Skill compilation
remains the largest selected first-use application hotspot; it is already cached
after first use. Production startup still needs material work.

## Rejected normalization candidate and corrected attribution

The earlier786.9ms development attribution to `normalizeMaps` sums recursive
ancestors repeatedly. With each sample counted once, authority39 mobile costs
are155.261ms for normalization,339.268ms for recursive descriptor inspection and
2001.229ms for the first skill compilation. The corrected attribution changes
the priority; it does not change any raw profile.

The normalization candidate preserves complete cloning, entry order, native Maps,
own prototype-named data, dense undefined array positions and pre-normalization
getter rejection. Its public validator resource test first fails with100 extra
mapped property-entry arrays for100items. All181 affected cases across six save,
historical/migration and descriptor suites then pass. The candidate's test has two
lint errors, and its temporary scoped-type config omits Vite declarations; neither
is represented as final passing validation. The candidate is rejected before
further source/test cleanup or broader checks.

Desktop sampled normalization falls39.337→26.373ms, but mobile155.261→154.847ms
does not improve materially. Ready-gated development reload is3.488→3.623s desktop
and10.073→10.703s mobile. Both complete native/public roundtrips pass. The raw
candidate and test are archived outside the repository; no rejected code remains.
No campaign, unrelated suite, reward, item, schema or save-version change occurs.

Additional bounded screens remain external: direct descriptor-copy normalization
is slower, null-prototype cloning has only a modest gain and different observable
enumeration behavior, referenced-rule schema variants are refused by unchanged
strictRequired, and fail-fast validation with complete diagnostic fallback both
compiles and validates more slowly. None justifies another browser candidate.

The first production driver is an infrastructure failure: creating its SSR server
sets process NODE_ENV to development before building in that same process. Its
output contains development tooling and a pretty-printed worker that the existing
production checker does not parse. V2 explicitly sets production NODE_ENV before
building and passes bridge/precache/browser checks. V1 is excluded from production
evidence; its raw failure, build manifest and worker/index captures remain.

## Retention and next action

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Required stems are `bug592-normalization-*`, `bug592-browser-normalization-v1*`,
`bug592-schema-functions-probe-v2/v3*`, `bug592-schema-diagnostics-probe-v1*`,
`bug592-production-startup-v1/v2*` and `bug592-startup-profile-readback-v1*`.
Exact emitted application JS/CSS, source maps, worker and HTML are retained
losslessly compressed under `bug592-production-startup-v2-profile-assets/` for
profile review. Disposable distributions, task caches, compiler build information
and transient config modules are absent; owned processes are terminal. Root owns
the active worktree and packet through full-v1 review and their eventual cleanup.

Authority39 remains current; authority40 records only the rejected candidate.
Decision61/handoffv13/indexv12 supersede the earlier continuation pointers.
Next address the measured skill-compilation/startup cost with the production
baseline and unchanged validation/diagnostic and precache constraints. Remaining
economy/income variance, chronological14-build funding/fairness/holdouts,
defeat/retry/manual-idle,30–50active-hour pacing and integratedG0–G7/two-hour soak/
independent review/later ownerplaytest remain. Accepted balance0; no pending
question or external blocker; CI excluded.
