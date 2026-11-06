# Quest catalog reuse rejected

Reusing resolved quest catalogs within one native save-validation call did not
produce a useful full-decode improvement and regressed the mobile production
screen. The candidate is rejected. `validate.ts` and `validate.test.ts` are
restored exactly to accepted source authority52; BUG592 remains open.

| Measurement | Original | Candidate |
| --- | ---: | ---: |
| Node validation median | 201.847 ms | 193.707 ms |
| Node complete decode median | 207.537 ms | 206.982 ms |
| Desktop production reload median | 811.878 ms | 781.202 ms |
| Mobile, 4× CPU, production reload median | 2831.252 ms | 3466.220 ms |
| Mobile longest-task median | 1267 ms | 1617 ms |

Browser medians use three reloads per context after a discarded warmup, with
separate production origins and an activated service worker. Four complete
public import/save/reload/export roundtrips preserve the earned 8,540-item save.
No bridge, browser error or horizontal overflow was observed. These localhost
screens do not establish device, population or performance-budget acceptance.
The browser report's `passed` status describes functional checks, not approval
of the optimization.

The affected candidate checks pass: 194 tests across six files, scoped strict
types, ESLint and engine purity. An earlier external-config test invocation
discovered no files; only the corrected explicit-workspace run counts. No
campaign, reward cohort or unrelated suite was repeated. Passing candidate
checks do not turn rejected source into accepted authority.

Evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-quest-catalogs-native-v1.json`,
`bug592-quest-catalogs-green-v2.json`,
`bug592-quest-catalogs-browser-v1.json`, source snapshots, rejected files and
archived emitted assets/profiles. Exact build/cache/type-info outputs are
absent. Root retains the packet and worktree through umbrella review and owns
their eventual cleanup/release. Do not repeat this experiment without materially
new evidence.
