# Native mercenary Holy Freeze

Root implementation and self-review; independent design/source/QA acceptance
pending. Baseline `c0f90f1`, BUG157. This supplies the previously inert native
mercenary aura from `gacha-spec.md` §4.1; other merc auras, player Holy Freeze,
star progression and full class/skill acceptance remain open.

## Behavior and causal evidence

The exact owned Holy Freeze merc with its native loadout receives a transient
factory projection, including recruited suffixed IDs. Only a living player-side
explicit merc without summon/owner metadata supplies it. Skill bars and buff
markers alone grant no ownership. A passive never takes a cast, resource or
cooldown; both the timeline engine and public AI policy skip it.

The presence adds wave-local derived Chill to living enemies, shared by status
presentation, direct-hit combos and the existing attack-speed scheduler. It never
writes permanent statuses into returned units or cross-wave storage. Ordinary
timed Chill and multiple sources do not stack. Source death withdraws the effect
and preserves pending action progress; independently timed Chill remains intact.
At AS100, the authored0.5 multiplier changes1700ms to2000ms because the existing
cadence clamp still applies. This does not promise doubled action intervals.

Strictly validated JSON owns the additive20-percentage-point increased direct
cold bonus for living party members, including summons. Existing increased
damage, crit, resistance, independent MR and flooring keep their ordering.
Physical/lightning see the existing Chill combo, including boss resistance;
there is no manufactured cold pulse, refill or RNG draw. Both locales explain
the actual lifetime and effects. No save format/version change.

Corrected engine/native-factory reproduction fails9 tests with16 controls before
production edits. Schema reproduction fails8 with8 controls; the public AI
policy then has1 causal failure/3controls. First engine-wide run finds four old
assertions that Holy Freeze must still be a stub. Removing its obsolete stub
at the source preserves those assertions for every remaining stub; no assertion
is removed or weakened. An initial test-only optional-property type error is
corrected by omitting the absent signature. All original failure logs remain.

Initial full run11598passes/one failure exposes the old Cold Mastery control
selecting the first merc definition, which is Holy Freeze. The unchanged131/40
penetration assertions now use the exact native cold Iron Wolf; an additional
Holy Freeze case asserts159/50, proving that only the hero penetrates while both
receive the aura bonus. No production source changes after the tested build.

Final focused188/7 plus cross-system75/4 and engine5713/175 pass. Typecheck, full lint and production
build pass; all4 JS chunks pass the repository's five forbidden-token checks.
Final full suite passes11600tests/444files, with2existing opt-in skips, exit0
in432.24s. Final typecheck and changed-test lint pass.
Existing bundle/PWA-manifest and test-time budget misses remain unresolved.

## Native browser and campaign boundary

Ordinary production import of the exact authoritative next272 save, native free
hire and fielding pass in an isolated diagnostic context. An exact
Save→close→new-page Continue pair preserves the prepared roster, original gear,
player, map and currencies. No debug bridge or injected state is used. Roster
copy and combat indicators pass en/zh×360×640,412×915,640×360,1280×800,1920×1080:
20checks, no overflow, combat controls≥44×44px, zero browser/console errors.
Two additional mobile enemy-grid screenshots visibly show localized Chill.
Existing broken monster portraits in those screenshots are not an art acceptance.

The same exact earned input/ordinal and17fixed seeds run before/after through
native full-area combat. All17retained-Rogue rows, including outcomes/events,
are identical; that batch wins3/17. Bare native Holy Freeze wins0/17 before and
after. A separate three-pass eligible owned-backpack gear heuristic raises that
merc's maximum life236→448 and lightning resistance0→74, but still wins0/17;
four cases draw at wave4 and thirteen lose there. These diagnostics neither
establish a global optimum nor justify an encounter nerf or campaign completion.
Their saves, new hires, gear transfers and simulated outcomes are never promoted.

The genuine authoritative save stays byte-identical:
`fixtures/earned-recruitment-next272/retained-final.json.gz`, raw SHA
`7d311ad83afb2162a5b8ea880260dde1bcc1d9ab8ffbb60893b77c3a2805fc92`.
L25,11owned mercs/original Rogue fielded,8700wishstones,7622gear and next272.
No actual purchase, reset, transfer or campaign attempt is consumed by this work.

## Artifacts and remaining work

Root retains scripts, original failing logs, all native before/after rows, the
owned-gear screen, browser exports/screenshots/reports, build/token checks and
882source hashes (original plus final manifest, with only the explained test
fixture difference) under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/merc-holy-freeze`.
Root removes that diagnostic evidence after full-v1 consumers finish. Diagnostic
exports are not campaign checkpoints. One isolated SSR screen emitted a WebSocket
port warning; its completed report and the original warning remain retained.
All browser/preview processes are terminal, port4421refuses connections and the
exact disposable `dist` is absent. Final source rehash has zero unexplained drift; production source is unchanged.

A further unchanged-L25 screen uses17fixed seeds in each of Spider Forest /
Great Marsh × manual / idle:68/68native full-area clears. Current XP still needed
for L30 is1780926. Measured combat-only XP/hour is approximately1050649/999641
for Spider manual/idle and961697/888156 for Marsh manual/idle; menu/decision time
is excluded and future level/build changes are not projected as earned state.
Both areas have genuine earned clears, so these idle controls do not bypass UI
access. The raw report is retained and archived beside the other fixtures.

Next campaign work must use earned progression and legal preparation from the
unchanged next272 save. `playable-target.md` explicitly permits accelerated test
clocks after short-fixture equivalence proof; establish that proof before using
acceleration for the next earned preparation run. Keep native action order,
combat durations, resources and rewards, and report logical/economic time
separately from execution wall time. C0/C1 keep their original acceptance; C2 incomplete;
C3/C4/full G0–G7 remain open. Local only; no push/PR/merge/deployment.
