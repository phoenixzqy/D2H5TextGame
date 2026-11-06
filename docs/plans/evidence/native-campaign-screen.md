# Fresh native campaign screen — 2026-10-29

Status: measurement tooling implemented; four source-bound cases finish with
recorded defeats. This is baseline evidence, not earned build viability,
Act I completion, defeat/retry acceptance or full private-v1 acceptance.
Independent native and browser evidence reviews are ADEQUATE for their
bounded scopes; full unit validation passes21,897 tests across1,036 files.

## Reproduction and provenance

From the claimed `feat/playable-foundations` worktree, HEAD `b5a0898` plus the
uncommitted source manifest retained in each report:

```sh
CAMPAIGN_PHASE=intro CAMPAIGN_OUTPUT=/absolute/new/external/intro npm run campaign:screen
CAMPAIGN_PHASE=act1 CAMPAIGN_OUTPUT=/absolute/new/external/act1 npm run campaign:screen
```

Each output directory must be new, outside the repository. Optional
`CAMPAIGN_PROFILES=sorceress-cold` selects one of the two implemented policies;
unknown phases/profiles fail before gameplay. Each profile runs in a fresh
sequential Vitest child using `vitest.campaign.workspace.ts`. Ordinary unit
discovery does not execute this campaign workspace. It does not reopen old
campaign exports or protected saves. Journals fsync every record and preserve
the stopped native snapshot plus export; they never retry a losing wave.

The fixed Date epoch is `1793304000000`. Character creation and native run
admission derive their own identity, ordinal and RNG seed; no supplied seeds,
items, levels, XP or objective completion are injected. Production provenance
binds source/configuration and diagnostic helpers; the supplemental manifest
binds all campaign code and recursively executed contract helpers, rejecting
symlinks. Before/after manifests match for each final case.

## Frozen policies and route

Both create a Sorceress, retain native Ice Bolt1/Frost Nova1 and one initial
skill point, and hire/field the ordinary Inner Sight Rogue. Each earned level
spends two Vitality and three Energy. Cold initially buys Warmth1, holds skill
points until L6, then buys Ice Blast20 before Frost Nova5; priority is Nova,
Ice Blast, Ice Bolt. At L6/L12 the observed Ice Blast ranks are6/13; Nova remains1.
Fire buys Fire Bolt1, Warmth1, then prioritizes Fire Ball20 at L12 before
continuing Fire Bolt20; priority is Fire Ball, Fire Bolt.

The Act I policy plays up to40 Blood Moor W1 victories, fleeing native W2,
until L6; completes Den, performs actual Akara Talk and Claim; repeats full
Den up to100 total entries until L12; then attempts Blood Moor, Cold Plains,
Burial Grounds, Dark Wood and Catacombs before Sisters Claim/Act II. Skill/stat
allocation occurs at recorded boundaries. Eligible owned hero gear uses the
public comparison function, deterministic slot/ID order and monotone upgrades
without stat/resistance decreases; mercenary gear is not adapted. These are
baseline policies, not optimized builds. Native resources carry between waves.
Bounds are160 admissions,10 native combat hours,10 execution minutes and L14;
the journal reserves10MiB beyond its190MiB budget for reports/checkpoints.

## Final native observations

| Phase/policy | First nonwin | Level | Played/won waves | Native combat | Earned XP/items |
| --- | --- | --- | --- | --- | --- |
| Intro/cold | Blood Moor W3 defeat | 2 | 3/2 | 56.000s | 430/22 |
| Intro/fire | Blood Moor W2 defeat | 2 | 2/1 | 25.920s | 160/2 |
| Act I/cold | Catacombs W5 defeat, before W6 boss | 12 | 309/308 | 77.5995min | 168580/2996 |
| Act I/fire | Den W3 defeat during farming | 7 | 75/74 | 29.4991min | 29930/515 |

Cold Act I has107 admissions,349 stages,40 unplayed W2 Flees and66 full
challenge victories; fire has49 admissions,115 stages,40 Flees and8 full
victories. Cold waveXP168080 +Den questXP500 =168580; fire29430+500 =29930.
All-earned XP per native combat hour is130346.1949/60876.5295 respectively,
including quest income and all played losing-wave time. Campaign execution
wall time is27.117s/10.332s, distinct from native combat time. No menu/decision
time or 30–50 active-hour first-clear measurement follows.

An external audit reconciles stage/settlement/Flee counts, native final clocks,
zero actual/raw nonwin rewards, unchanged nonwin player/merc/inventory/map
award state, original-hostile death on wins, full item identities/payloads
(only equip flags may vary), XP/material/currency ledgers, quest-inclusive
totals, snapshot/export equality, manifest stability and journal hashes/bytes.
All four final cases pass this audit. Pure contracts include corruption controls
for these boundaries; the real failing quest-total predecessor is retained.

## Production browser parity

Headed WSL production browser v7 passes2/2 fresh cases: cold zh-CN360×640
and fire en1280×800. Both use public create/hire/allocation/priority/map/combat/
Save/export controls, no imported fixture or debug bridge. All player fields
except the documented priority representation, full inventory, map and mercenary
state match the final native intro reports. Actual IndexedDB equals the full
export; actual context close/reopen and public Continue restores that same full
save exactly. The fixed Date epoch intentionally gives zero offline gap; this
does not verify elapsed-away reconciliation. No page/console/HTTP errors occur;
the local static server deliberately answers `/favicon.ico` with204. All762
bundle files match before/after. Four retained screenshots cover terminal
battlefields and continued settings; defeat panels below the captured viewport
are established by DOM assertions/text, not screenshot completeness or UX credit.

The runner now uses the same
`a1-blood-moor` persisted/admitted map alias as MapScreen, after an earlier
browser attempt exposed a canonical-ID-versus-alias mismatch. This is a runner
correction, not a production game change. The public skill picker only allows
currently eligible entries: cold uses Ice Bolt at L1, fire uses Fire Bolt.
Native future priorities are ignored while ineligible. Raw `comboOrder` arrays
therefore differ intentionally; parity excludes only that field and compares
the remainder of the player plus complete inventory/map/mercenary state.

Browser predecessors preserve harness failures: incorrect Hire label, locked
Nova selection, nonexistent map test ID, wrong wave-counter text parsing,
canonical map-ID parity, and Fire Bolt option-ID representation. v6 passed
cold before the fire harness selection failed; v7 corrects the option value
to `sorceress.fire_bolt` and records every offered option. No production
gameplay repair or game defect is inferred from those test-driver failures.

## Validation, limits and retained ownership

Focused pure campaign contracts pass14/14 across4 files. Strict
typecheck, zero-warning lint (8GiB heap), engine purity, test boundary
(1036 tests/1635 source modules) and whitespace checks pass. Full ordinary units
pass21,897/21,897 across1,036 files (session91255, exit0,1075.69s).
Node24.21.0/Vitest1.6.1 are recorded; no timing-budget compliance
is claimed for these large local checks. The first lint
process exceeded its default4GiB heap; an8GiB retry exposed missing typed-lint
workspace inclusion, now added to `tsconfig.node.json`. Historical failed
attempts are not discarded or reported as passes. Production build passes,
with existing chunk-size warnings and the2.57MB generated image manifest
excluded from precache. No engine behavior or balance number changes here.

Root retains exact scripts, source-bound reports, raw journals, snapshots,
audit receipts and harness diagnostics at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-campaign-71wdnxct`
through unfinished acceptance and owns eventual exact-path removal.
`intro-v4/`, `act1-v4/` and `audit-v4.json` are the final native revision;
all earlier revisions remain historical. Source hash is
`a39221baedbb05710307ab95249891b1b93f63553664b1656191a4257390fad6` and
data hash `12b6273efde0488014ec412232c5756c1820f5d288a2fbb51c59e50ee8532397`.
`browser-v7/` is the final public
browser packet; `native-independent-review.txt` retains the producer verdict.
`browser-cleanup.json` verifies all8 exact disposable build/profile paths
removed after readers released, with no remaining browser process, accepting
recorded port or cleanup failure. `final-accounting.json` confirms all recorded
browser/nonbrowser process IDs are absent and no disposable paths remain.
`retained-manifest.json` binds the retained files; root owns their eventual
removal after unfinished acceptance. CI remains excluded by owner
instruction; owner playtesting follows implementation. Seven-class/five-act,
14-build, economy/pacing and all broader acceptance remain open.
