# D04 — Assassin Fire potency and Phoenix elemental attribution

Fixed and verified locally: runtime/data `ee952d1d`, presentation `6400adb0`.
Root sole writer and author reviewer; independent design/QA and earned balance
remain open. [BUG205](../../../production/bugs/BUG-205-assassin-burn-missing-periodic-damage.md),
[original reproduction](d04-assassin-burn-repro.md) and
[contract](../decisions/D04-assassin-fire-v1.md) precede implementation.

## Actual repair and remaining promises

Fire Blast, Fists of Fire, Dragon Tail, Wake of Fire, Wake of Inferno and
Phoenix Strike now author explicit `statusEffect.dotPctOfDamage:0.1`.
The existing Burn/Ignite runtime captures `max(1,floor(mitigatedFireHit*0.1))`
DPS per stack for three seconds, cap5; capture precedes personal absorption,
as in Vengeance. No global missing-potency fallback, new status runtime,
dependency, save field/version or native eligibility change. Existing damage,
growth, target selection, costs, cooldowns and prerequisites are preserved.
The fraction is explicit provisional functional tuning; earned balance is open.

Phoenix opts into the existing weighted-component runtime with equal60/60/60
weights. Its unchanged total120–180/+12rank is now real Fire/Cold/Lightning,
one shared base/hit/critical roll and one action/payment/cooldown, with separate
mitigation and Burn/Chill/Paralyze. Burn derives solely from the mitigated Fire
component. The entire compound strike settles before one death/corpse closure.
Schema ownership remains narrow: only Vengeance and Phoenix can opt in, with
Phoenix's actual L30/Cobra Strike+Blades of Ice identity required. Scalar skill
and Vengeance behavior remain compatible.

Death Sentry remains excluded and broken: its current Fire/Burn conflicts with
the promised lightning trap/corpse explosion. Adding a Burn rate would preserve
the wrong identity. Fire Blast's cone/trap mismatch, Fists charge behavior,
Wake persistent traps and Phoenix charge/build interactions remain open.
Only Dragon Tail gains bounded whole-skill functionality credit; repaired parts
alone do not credit the other five whole skills.

## Causal tests and retained failures

The rebuilt84-case actual native probe covers seven skills at ranks1/2/20 and
seeds7/19/41/97. The six repaired skills have54positive periodic cases; Death
Sentry retains nine positive hits with zero periodic HP loss. All casts prove
one payment/action, immutable replay and actual final HP conservation.

| Skill, rank1 seed7 | Direct HP loss | Periodic HP loss |
| --- | ---: | ---: |
| Fire Blast | 51 | 15 |
| Fists of Fire | 46 | 12 |
| Dragon Tail | 71 | 21 |
| Wake of Fire | 61 | 18 |
| Wake of Inferno | 92 | 27 |
| Phoenix Strike | 123 (41/type) | 12 |
| Death Sentry, still unpowered | 87 | 0 |

The134new cases comprise57native/store,21schema/catalog/pure display and56UI.
They cover exact ranks/aliases/MAX/prerequisites, paid misses, unaffordable and
cooling refusal, every shaped/all/single target's actual HP, immutable captured
allocation, ordinary/recorded replay and weapon Attack independence. Existing
Vengeance regressions cover shared absorption/compound settlement semantics.
Phoenix mitigation control gives Fire20/Cold29/Lightning40, Burn6 and final
HP1905 from2000; guaranteed critical gives82/type, Burn24 and finalHP1730.

Original source RED41failed/19passed and corrected/full-UI RED89failed/19passed
are retained. Fixture corrections use actual applyStatus/applyStatuses fields,
Chill2s and status-state source ownership; DoT events have no source field.
Compound strikes complete before death. The first green2failed/153passed fixed
a stale insertion-order expectation and Fire Defense/MR arithmetic. Four strict
type errors, a stale status-owner list and one lint issue were also corrected.
These explanations and original terminal receipts remain in the archive.

[BUG206](../../../production/bugs/BUG-206-phoenix-summary-omits-components.md)
was found by the initial production visual review: Phoenix's leading summary
showed only Fire although actual rows/combat had all three components. Eight
bilingual rank0/1/2/20 main-paragraph assertions fail before repair and pass
with a generic model-driven composite description. An earlier RED selected
the rank heading; the corrected-selector RED is8failed/48passed. Both are
retained. Vengeance wording is unchanged; original charge promises remain.

Final focused compatibility345/11, data compatibility872/15, engine7574/276,
strict types, lint and production build PASS. Final full passes14626/651files
with two existing skips, 500.032s wrapper (Vitest498.72s).
The first full14618/651 predates the eight summary cases/UI fix and is retained
as historical evidence. Neither full run was interrupted/restarted. Engine,
full-suite, typecheck and lint durations exceed repository budgets; these
results do not close performance gates.

## Production browser and persistence

Initial production build:24cases, six skills ×en/zh-CN×1280×800/360×640,
48exact five-domain Save-close-new-page-Continue pairs. Final summary build:
four Phoenix primary cases and two mobile row-capture supplements,12exact
pairs. Combined30cases/60exact pairs/50geometry samples/96screenshots;16were
individually inspected, including six final passing images, six initial concern
images and four superseded duplicate captures. Final visual verdict is bounded
PASS. No console errors in the audited cases; checked controls meet44px and
geometry has no horizontal overflow across the five sampled viewport sizes.

Fixtures disclose syntheticL30, the real prerequisite chain, imported resource
helmet and fixed Date.now with ordinary timers. Public rank1Continue preserves
empty priority; public Active Skills selection changes it, and rank2Continue
preserves selection. Player, inventory, map, mercs and formation match exactly.
No private store injection or production test bridge; this grants no earned
progression or balance credit. Both builds have four bridge-free JS chunks
and all756precache URLs. Full accessibility/device/PWA/performance remain open.

Four first final-build stats shots failed to move the app's actual scroll
container and duplicate summary captures. The two mobile supplements scroll
the correct DOM ancestor and show complete Current/Next rows. Original captures
and `stat-capture-correction.json` remain; no product patch was needed.

## Provenance and accounting

Final1383source/test/config, two controlling design and760build files remain
hash-exact through the final full suite, along with historical HEAD0e1eecd0
and the genuine-save digest. Actual committed blobs/disk match the tested
snapshot at `6400adb0`; historical HEAD is not claimed to contain the patch.
Initial/final snapshots differ only in SkillsScreen, its Assassin Fire UI test
and the two locale files. Other1379source hashes and both design files match;
there was no runtime change between full runs. Both build hash maps are retained.

Inventory preserves213IDs/order, changes exactly seven Burn rows and leaves
206others exact:104bounded-functional/107unverified/one engine-only/one
review-needed. Exactly one new credit, Dragon Tail; Assassin7/30 locally
bounded. Independent/earned class/build acceptance remains open.

The separate [Fire Blast cone reproduction](d04-fire-blast-cone-repro.md)
confirms the five-cell cross despite bilingual/spec cone promises. It is a
retained diagnostic exit1, not a required-suite failure or cone repair/credit.

Genuine claimed Ancients/Rite staysL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7, earned builds,30–50hour pacing,
economy/endgame and independent acceptance remain unfinished. No genuine
campaign or remote action. Umbrella goal/branch/worktree/claim remain active.

[Raw archive](fixtures/assassin-fire/raw.tar.gz),
[member manifest](fixtures/assassin-fire/packet.json),
[committed audit](fixtures/assassin-fire/committed-source-audit.json) and
[cleanup receipt](fixtures/assassin-fire/cleanup.json) retain failures and proof.
All512raw members/37terminal receipts are byte-hash verified. Cleanup removed
2032exact task-owned files; scratch and all76recorded owned PIDs are absent,
4492closed, remaining[]/failures[]. Both disposable production builds are
removed after matching their respective frozen hash maps. Shared caches and
the active umbrella worktree/branch/claim remain preserved.

## Fire Blast targeting continuation

The cone mismatch listed above is now locally repaired and verified under the
[separate targeting contract/evidence](d04-fire-blast-cone.md). Its additional
credit raises the inventory to105bounded/106unverified/one engine-only/one
review-needed. Charge, persistent-trap and earned/independent requirements stay open.
