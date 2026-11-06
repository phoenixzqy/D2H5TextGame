# Dialog entry before background isolation — 2026-11-03

BUG632 is fixed/verified in the working tree. React can flush background
`aria-hidden` isolation before FloatingFocusManager's queued initial focus,
leaving the focused opener inside a hidden subtree. The shared Modal and mobile
inventory sheet now capture the opener and move focus in their layout effects.
Initial-focus overrides, background isolation, trapping and return remain intact.

Three StrictMode regressions observe actual `aria-hidden=true` writes and reject
hiding the active element. They fail before the fix and pass afterward. The
initial external-config failure was setup-only and is not the behavioral RED.
Sixty affected cases passed on the pagination candidate; the corrected tests
reuse 57 unaffected passes plus three reruns. After rejecting/restoring that
separate experiment, all28directly affected Modal/inventory-focus/pagination
cases pass, with scoped strict types and explicit six-file zero-warning lint.
Ordinary React Router future notices in unit tests are retained.

Default minified production Chromium147 on final source verifies desktop en
1280×800 and mobile zh-CN360×640: original100-card pages, bulk dialog entry before
isolation and return, nested mobile Details→Discard→Escape→Discard→Escape→card,
no focused hidden ancestor, retained background isolation, exact public save,
no overflow and zero browser errors/warnings. Both locales also exercise the
mobile sheet. No performance samples or campaign replay occurred in this final
check. Prior pagination-candidate screenshots (four inspected) remain explicitly
candidate evidence, not screenshots of final source.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files: `bug632-{before,plan,checks-exit}.json`, RED/GREEN/type/lint logs,
`bug632-final-{unit,types,lint}.log`, `bug632-final-browser{.mjs,.json,-plan.json,.log}`.
Final browser source manifest authenticates all inputs before/after execution;
receipt session5551 exit0, final unit50872/type34766/lint85890 exit0.
Shared Modal SHA256 `f154e11a0d21c0088b3611c4107c14d901c53f9c65fc14c6494da98b573f4251`;
InventoryScreen `26e7628fe112b1385a21d1b15f10bb7c0f173a324824b533a2d06f60d1c29d76`.

Root self-review: entry ordering addresses the observed cause without removing
accessibility isolation or masking warnings. No independent final-v1 acceptance.
BUG592 performance and BUG611 progression remain open; no campaign advancement.
All recorded consumers terminal and exact disposable configs/build/cache absent.
Root retains required evidence and human2 worktree through umbrella review and
owns eventual cleanup/release. No agents/install/commit/push/publication/CI.
