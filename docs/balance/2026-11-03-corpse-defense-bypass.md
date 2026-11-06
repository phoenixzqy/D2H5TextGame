# Corpse Explosion Defense bypass: bounded delivery

2026-11-03. The [authored rule](../plans/decisions/D06-corpse-explosion-defense-v1.md)
is implemented: player Corpse Explosion ignores flat Defense. Fire resistance,
dodge, criticals, personal absorption, Ignite and earned rank/finite corpse/MP
payment remain. All numeric skill data is unchanged. This corrects the authored
armor floor; it does not supply an opening corpse or improve singleton damage.
BUG611, earned Act V continuation and private-v1 acceptance remain open.

## Implementation and verification

Nine declared production/test paths change against the authenticated 2,147-input
prior manifest. Full source discovery agrees with that manifest: no added or
undeclared production input. Only the player CE row gains `ignoresDefense: true`;
strict schema ownership and independent source/registered-effect guards require
it. Monster CE and unrelated skills cannot opt in; existing Impale remains valid.
No common damage formula, save format or numeric growth/cost/cooldown changes.

Thirteen behavioral assertions fail before implementation. After implementation,
222 affected tests pass in seven files, including actual registered CE casts,
strict source/authority/schema rejection, Impale controls, bilingual current/next
rank previews and existing native corpse/payment/reward/replay checks. Scoped
strict TypeScript and explicit unignored ESLint pass. No earlier-act or full
suite replay. Independent connected noncritical maximum hits are 80/55/194/145/48
for the five predeclared rank/Defense/Fire-resistance cases; ordinary fallback
still receives Defense mitigation.

Four real Chromium contexts pass at 360×640 and 1280×800 in both locales. A copy
of the earned level-71 Necromancer with CE20 is imported through public Settings;
normal navigation selects CE. The new prose and 164–194 Fire / 20 MP / 2 s are
correct, with zero horizontal overflow, page errors, browser console errors or
warnings. Screenshots were inspected. Whole-save public export agrees with the
import except the explicitly selected locale and three equivalent combo-ID
aliases normalized by the existing Skills screen. No allocation, combat,
reward, resource, equipment or canonical checkpoint changes occur.

The initial driver asserted a generic status instead of the actual preparation
status and stopped before browser launch. The second caught existing combo alias
normalization in its exact save oracle. Both failures are retained; the final
driver permits only those three exact aliases and validates every other field.
The initially suggested Amazon save was rejected by class inspection before use.
A Vite-side stale Browserslist notice is recorded; browser consoles are clean.
No dependency update was needed or performed.

## Limits and retained evidence

No campaign admission, training, old-wave replay, coefficient/body-life/order
fitting, or closed comparison allowance is consumed or renewed. Act V remains
13/19 main quest actions; formal balance remains 0/210 accepted. First-kill and
singleton/boss throughput require a separate defensible progression correction.
This local delivery is not independent design/QA signoff, pacing or build viability.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files use the `d06-ce-defense-v1` stem: frozen plan/before bytes, RED/GREEN/type/lint
receipts, final `browser-v3` driver/log/receipt/report and four PNGs, candidate
source authority, and closure. Failed browser drivers/logs remain for diagnosis.
Green log SHA256: `bd5022200e54893168af293e4a7e4f1cd9f874f1cce75225e7aa76ee5ab75777`.
Browser log SHA256: `5f3650fbe0a9d9e23e361eb83fdf3d40b2fee8dc0ab3c5a7834782f3428d4a1f`.
Current source tree hash: `9246707d5fa81231e041786fca43a415dfc8622d370e42fd5f05b9a151688053`.

Owned browser/server/esbuild processes are terminal and exact task Vite caches
are absent. The scoped tsconfig is retained diagnostic evidence. Root retains
the packet and human2 worktree through umbrella review and owns eventual artifact
cleanup/worktree release. The source checkout remains read-only. No installs,
CI, commits, pushes or publication. Browser works; no owner answer is pending.
