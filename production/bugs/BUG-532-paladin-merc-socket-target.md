# BUG-532 — Bind the Prayer boot before inserting its protection gem

Severity: Low. Status: diagnosed; original diagnostic spec retained.
Owner: root (QA preparation spec). Native capacity validation is correct.

## Reproduction

Worktree `D2H5TextGame-human-worktree-2`, `feat/playable-foundations`,
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, with existing dirty work.
Node24.21.0/Vite SSR; no browser viewport/locale. Packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Restore `p15-paladin-zeal-act2-initial-continuation-v1.json`,13/5838/136.
2. Run `p15-paladin-zeal-act2-dry-party-protection-forecast-v1.spec.json`.
3. Hero boot replacement returns its filled one-El boot to the backpack.
   Monotone Prayer equipment then chooses that stronger owned boot.
4. The spec requests a chipped Diamond in the Prayer boot slot without binding
   the previously empty `it-10w4p-1ko` item there.

Expected: a declared actually empty owned target for each insertion.
Actual: the capacity assertion correctly rejects the already filled boot.
Evidence: matching `p15-paladin-act2-dry-party-protection-forecast-run-v1.log`
and `-exit.json` (exit1/no owned descendants), original spec/method pin.
No area was admitted and all projected preparation is restored.

Resolution: successor spec explicitly reserves/re-equips owned boot
`it-10w4p-1ko` after the ordinary merc upgrade pass. Preserve the old paid boot;
never remove a socket, relax capacity validation or count rejected preparation
as earned. No helper/production change or repeated static check is needed.
