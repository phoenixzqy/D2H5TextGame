# P15 — Authored single-target monster Curse

BUG763 is fixed locally on `feat/playable-foundations`, above HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`; no commit or publication.
The previous goal turn was status-only. This continuation corrects remaining
resolver/type/test issues and completes local verification. Full private v1
remains unfinished; historical 14/14 intended Normal, 210 checkpoint sources
and formal balance acceptance 0/210 do not change.

## Result and boundary

The real authored single-enemy/CD4 action replaces the party-wide/CD3 damaging
compatibility action. It applies the existing 3000ms/-50 physical-resistance-point
Amplify family without a damage carrier, hit roll or mana debit. Amplification
already worked through the legacy alias; it was not inert. A native Ghost casts
at1780/7120ms with two ordinary actions between; its unmodified physical attack
lands111 while amplified and74 after expiry. One living party recipient receives
the cast, including with magic dodge1; dead bodies are excluded. Existing target
status protection and Mana Burn skill lock remain effective.

New `engine/skills/monster-curse.ts` validates/copies/freezes JSON input. Registry
installs it and removes only Curse from the monster stub list. New skill/combat
tests and three affected family expectations cover the native behavior. Shared
combat/status/Amplify definition and `data/skills/monsters.json` are byte-identical
to retained preimages (`unchanged-source.json`). No UI/schema/save/data tuning.

## Evidence

Root retains this exact packet through full-v1 acceptance and owns eventual
cleanup: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-monster-curse-h2iea13h`.

- `red.json`: five causal failures before production repair.
- `final-affected.json`:67 passing combat/family assertions and22 passing resolver
  assertions; one remaining resolver rejection failed. `final-resolver.json`
  replaces all23 resolver assertions with passes after the exact carrier fix.
- `final-kaa.json`: three passing Ancient Kaa assertions. Filters select affected
  cases; no source tests were disabled. `verification.json` deduplicates93 actual
  passing assertion identities. Vitest1 summary counts filtered assertions as
  passed; totals here use each assertion's real status.
- `final-types-complete.log`: strict scoped431files/zero diagnostics. Eight-file
  `final-lint.log` and the final resolver `final-lint-complete.log` pass.
- `native-diagnostic.ts`/`.json`: real factories/engine, seed13/factory7. Includes
  Ghost, Greater Mummy, Horadrim Ancient, Succubus, Ancient Kaa and allied Mummy.
- `final-increment.diff`, `source-review.json`, `baseline/`: exact change review,
  final source hashes, boundary checks and retained preimages.

Initial instrumentation incorrectly forbade the scheduler's RNG fork; corrected
assertions observe draw methods. Initial type/lint findings included an invalid
fixture immunity and a required-cost type that disagreed with the schema. Both
are corrected using the real all-except-Stun policy and an accurate optional-cost
input type. An intermediate cost dereference caused suite-load errors; those
outputs remain as `cost-type-error-*`, not passing evidence. Initial broader
checks observed four unrelated Duriel/Izual assertion failures, which are not
baseline-confirmed or repaired here. All original failures are retained.

The first esbuild diagnostic could not supply Vite `import.meta.glob`; vite-node
ran the diagnostic successfully without a product/tooling change. Its disposable
`native-diagnostic.mjs` bundle was removed and absence verified. All task check
handles are terminal; no server or browser was started. No campaign rerun, spent
retry/sample renewal, broad suite, build, CI, push or release.

## Remaining acceptance

This establishes the selected engine repair, not earned balance, human pacing,
whole-app or independent acceptance. Continue the full plan's progression,
acquisition/economy, difficulty/endgame and integrated acceptance work. Browser
works; CI is excluded; no pending user decision holds implementation.
