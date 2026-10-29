# Seven native mercenary attacks — BUG-374

Native repair verified; browser/earned feature acceptance pending, 2026-10-28.
Base: `217552eb288bd137e390d3f0d9787847220b3a2d`.
Root works in the existing claimed human-worktree-2; original checkout untouched.

## Contract and implementation

[D04](../decisions/D04-merc-direct-v1.md) reconciles Fire Ball, Glacial Spike,
Charged Bolt, Smite, Chop, Pierce Thrust and Basic Swing with the gacha design
and retained authored Burn/Paralyze. A validated, copied/frozen exact-seven JSON
catalog replaces exactly seven hardcoded stubs. Narrow schema identity closures
and both locales describe the actual recipient/damage/control/resource contracts.
The existing runtime settles targeting, damage, mitigation, RNG, status clocks,
sequence interruption, party effects and cooldowns. No shared combat/persistence,
recruitment, dependency or CI change is included.

All seven are flat, zero MP and ranks1–20. Fire Ball hits firsttwo, Glacial Spike
is single-target, five independent Charged Bolts rotate original prioritized
living targets, Smite has landed25% canonical Stun, Chop adds effect-only25
percentage points crit, Pierce Thrust hits two distinct targets, and Basic Swing
is one ordinary flat attack. Original factory secondary skills and Fire Mastery
remain. The Recruit's signature Basic Swing executes before its retained Bash.
These are scoped reconciliations, not a claim that omitted GDD details were
specified verbatim. No new Paralyze after-slow or global elemental rule is added.

## Evidence and gate status

The frozen seed5 primary uses actual loaders, owned factory, projection and
default registry with constructed surviving resources. Its literal first1700ms
oracles cover all seven real loadouts, exact recipients/damage, real Fire Mastery,
one action, zero MP, repeatability and unchanged saved/input state. The original
primary fails seven cases before production; a type-only explicit event guard
successor also fails exactly seven before production. Both sources/RED receipts
are retained. BUG374 is filed before production. The unchanged final primary
SHA256 is `f9c883babeea80774ac996944ab216e1ca0652d342434d78d16bebd5298902c9`.
Primary GREEN passes7 and the resolver/sibling check passes100 before final gates.

Four new test files add99 cases: schema/resolver40, combat45, primary7 and public
lifecycle7. Native literal coverage includes ranks1/20/Attack0/200, mitigation,
crit/overflow, missed payloads, prioritized/dead/summoned targets, finite Burn/
Chill/Paralyze/Stun and boss clocks, five-bolt independent RNG/recipient deaths/
paid Chilling Armor caster death, exact cooldown and payment, Chop's intervening
basic attack, and real public publication/playback convergence. Saved/input/
recording state stays immutable and deterministic; this is constructed mechanics.

Final unchanged2085-input map:
`e3495bca891687447282cda5a91ba49270b641e9f7b28684b9d3c1dd34e8e7c4`.

| Native gate / runner label | Result | Seconds |
| --- | --- | --- |
| focused / focused-types-successor |330pass/11files|20.658452|
| scoped-lint / scoped-lint-types-successor |zero warnings, exit0|13.985767|
| typecheck / types-successor |exit0|145.985454|
| audit / audit |997tests/1581modules, exit0|3.169789|
| engine / engine |11345pass/422files, zero pending/todo|289.803955|
| lint / lint |engine purity + zero-warning ESLint, exit0|330.656039|
| build / build |production build, exit0|17.838002|
| unit / ordinary |21201pass/997files, zero failures/pending/todo|980.312128|

The audited ordinary workspace uses the repository dependency preflight; the
unsafe historical full runner remains refused before snapshot/subprocess.
Native results establish no performance-budget, timeout-cause or speedup claim.
The build retains existing bundle-size, precache and stale Browserslist warnings.

Actual failed attempts remain distinct from final results: the schema text-edit
preflight rejected a nonunique allOf marker before writes; Ajv strictTypes and
strictRequired failures collected zero tests before explicit local object/element
refinements; a saturated Burn observer initially expected an unchanged state
event. Changing only prior expiry2000 makes native refresh4700 observable while
preserving cap5/rate2/old-source assertions. Scoped lint then caught redundant
in-guards and an unsafe nested status matcher; reviewed corrections use direct
typed observations with identical expectations. The final typecheck found one
summoned-fixture kind widened to string (TS2322). Its sole as-const correction
emits byte-identical ES2022 JS under esbuild0.21.5 and changes no fixture value,
expectation, production or primary. Independent producer approves each correction;
failed sources, reports, source maps and terminal receipts remain retained.

## Retention and unfinished acceptance

Root retains exact task evidence, native reports/logs/maps/source predecessors,
reviews and the safe runner at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-direct-3u9ht7ur`.
Root owns eventual exact-path cleanup through unfinished acceptance. The disposable
external build was removed after its terminal result and reader release:
762files/42291221bytes/10directories, verified absent with no failures. Exact
inventory/hashes remain in build-cleanup.json; shared caches/tools/history and
the registered worktree stay preserved. All42 recorded check PID/driver
observations are absent, with no cleanup failures (process-cleanup.json).
Independent source/completed-gate approvals are retained; final evidence and
exact staged/committed blob/tree/parent reviews govern the local checkpoint.

BUG374 remains Open for browser/earned/feature acceptance; player skill inventory
stays212bounded/oneunverified. Campaign/economy/build/pacing/defeat-retry/devices/
locales/a11y/performance/PWA/actualCI/human/soak/full-v1 acceptance is unresolved.
H3 is terminal H3_PREREQUISITE_FAILED_NO_APP: no app/browser/retry. No protected
fixture access/replay, diagnostics discovery/execution, closed policy matrix,
new acquisition/lineage/gameplay replacement run, remote action or deployment
is included. Umbrella goal and worktree stay active. The next separate mercenary
War Cry plan is independently ready and preserves factory War Cry→Bash→Chop;
its implementation waits for this native checkpoint.
