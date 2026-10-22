# D06 — bounded earned Corpse Explosion pilot

Date: 2026-10-22. Result: **bounded earned unlock and CE cast observed**.
One frozen pilot ran once and passed its protocol assertions. This accepts
reachability for the specified build/route; broad affordability and balance
remain open.

This four-path card follows status reconciliation `4f95cca`. Root is sole writer/
executor in the existing claimed worktree. The frozen protocol is one fresh
English desktop Necromancer, Date-only 2026-10-20T12:00:00Z, legal starter
Skeleton1, initial-point Teeth1 and free Rogue inner-sight hire. Use Skeleton/
Teeth, no gear/stat spend/respec/imports. Forty manual first-wave Blood Moor
entries ordinals0–39 use native Skip, wave2 pause and Flee. Stop first defeat or
180s preparation budget; no retries, recipe changes or seed searches. Only after
L6 is earned, allocate CE1 and observe one ordinal40 at native1x for at most30s,
with Skeleton/CE/Teeth. Whole case budget240s.

Skip preparation is accelerated native-UI farming. Protocol completion can
record unsuccessful reachability and does not itself mean CE acceptance.
A claimed CE success requires actual earned XP/points/provenance and DOM
death/supply → cast →20MP debit →one-body consumption →positive hero fire damage.
Skeleton startup15MP is separate. Per-attempt exports/logs and incidental
wave2 frames distinguish first-wave settlement from unclaimed wave2 playback.
The target L6 needs11013 cumulative XP; saves contain within-level experience.

Dedicated [config](../../../tests/pwa/corpse-explosion-earned.config.ts) and
[spec](../../../tests/pwa/corpse-explosion-earned.spec.ts) use one worker and no
retries. Production build with VITE_E2E absent and bridge scan run separately.

Raw evidence and frozen ownership/protocol:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-corpse-earned-zuu7r0ay`.
Root removes retained reports/sources/screenshots after umbrella consumers finish;
exact owned dist/tmp cleanup follows all reader releases. No shared cache or
pre-existing build cleanup.

Bilingual/mobile functional evidence remains [separate](d06-corpse-explosion-ui.md).
This pilot cannot establish pacing, owner/fresh-player feel, general affordability,
all builds/seeds, campaign balance, remaining D06/P09/P10 or private-v1 completion.

## Frozen reward oracle and reproduction

Before execution, the checked-in historical forty first-wave exports supply
full newly added item contents and complete cumulative currencies. Only each
new item's top-level allocator ID is omitted from its literal oracle; actual
IDs/prefixes/uniqueness remain checked and retained. Both builds have MF/GF0.
The existing independent victory reward RNG and unchanged authored reward/planner
inputs keep this separate from combat action RNG. Of36 historical inputs,35
are byte-identical. Item bases add31 metal flags while preserving every old
field, including pre-existing flags. Planner, loader and the exact victory
dispatcher are unchanged. Audit-authoring assertion failures (overbroad field
removal and function extraction) are retained with corrected diagnostics. The SHA-pinned oracle is
prepared outside the repository, never imported into the game. Derivation:

```python
from pathlib import Path
import tarfile,json,base64,hashlib
archive=Path('docs/plans/evidence/fixtures/p02b05d-current-moor-idle/raw.tar.gz')
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='a4ed215e614e0044279e3fa8567316bd44507f47258c98a67d4b8eb74914888d'
with tarfile.open(archive) as t:
 report=json.load(t.extractfile('pilot-report.json'))
attachments=report['suites'][0]['specs'][0]['tests'][0]['results'][0]['attachments']
values={a['name']:json.loads(base64.b64decode(a['body'])) for a in attachments if a.get('contentType')=='application/json' and 'body' in a}
rows=[];previous=0
for ordinal in range(40):
 save=values['prep-'+str(ordinal)];bag=save['inventory']['backpack']
 rows.append({'ordinal':ordinal,'addedItems':[{k:v for k,v in item.items() if k!='id'} for item in bag[previous:]],'currencies':save['inventory']['currencies']})
 previous=len(bag)
output=(json.dumps(rows,separators=(',',':'))+'\n').encode()
assert hashlib.sha256(output).hexdigest()=='95e6b7f7f531f62d5725b78eb88786e02209f22858bb95a440c09f2ad0e735f8'
Path(__file__).with_name('loot-oracle.json').write_bytes(output)
```

Save this script as `<ROOT>/extract-loot-oracle.py`, run it from the worktree,
then use the config with `EARNED_CORPSE_ROOT=<ROOT>`. Root must contain the
ownership marker and externally built/scanned production `dist/`. The spec
rejects any different oracle bytes. Reproduction creates its own owned root.

Pre-execution review corrections: capture Skeleton startup before Skip because
terminal logs retain only200 rows; enforce a hard180s preparation timeout plus
measured bound on every exit, extending to240s only after valid earnedL6.
Initial type/lint/full/build passed before these test-only strengthening edits;
final spec types/lint/browser verification passed. Product and unit bytes did
not change. Initial source snapshots and reviewer concerns are retained.

## Measured execution

The one English Chromium desktop case (1280×800) passed, with zero retries or
skips. The wrapper took113.635s and Playwright measured110.533s for the test.
Preparation completed in100074.3716ms, below180000ms. All40 entries won their
first wave. Native wave2 frames were retained before Pause/Flee: none showed a
dead monster, and every export had exactly the first-wave XP/reward delta.
No extra settlement, stat spend, equipment selection, respec, reload, import,
seed change or extra entry occurred.

The literal awards were160,180,…,400XP repeated three times, then160XP.
Their11080 total exceeds the exact L6 threshold11013 by67XP. At entry39 the
native export was L6, within-level XP67, next8818, skillPoints5 and statPoints25.
All344 earned items remained in the backpack with actual unique IDs, unchanged
prior prefixes and complete oracle-matching contents. The exact cumulative
currency was5157 rune shards; stash/equipped/merc equipment remained empty.
Allocating CE1 spent one earned point, leaving four reserved. The final export
exactly equals the pre-observation ready export, including XP, bag, currencies,
points and Skeleton/CE/Teeth order: ordinal40 granted no further reward.

The native1x observation retained79 distinct rendered frames over8823ms, no
overflow or observation timeout. Indices are zero-based in attachment
`04-ordinal40-DOM-timeline`; timestamps are page `performance.now()` milliseconds.

| Frame | Time | Observable evidence |
| --- | --- | --- |
| 2→3 | 101401→101453 | Skeleton startup87→72MP; unchanged cast logs |
| 46→47 | 106543→106598 | Fallen A dies, then first corpse becomes available |
| 73 | 109683 | CE cast, seven living monsters, two available bodies |
| 74 | 109739 | Silent85→65MP debit, unchanged cast logs |
| 75 | 109797 | CE consumes one body; remaining supply1 |
| 77 | 109912 | Hero deals71 fire damage to Quill Rat A |
| 78 | 109969 | Ignite feedback follows the hit |

The screenshot confirms paused wave1/3, native1x and65/107MP; it supplements
the exact DOM/resource/export assertions. Browser warnings/errors/pageerrors
were empty and the production debug bridge was absent before and after.
Node's terminal-only NO_COLOR/FORCE_COLOR warning is retained separately.
Observation stopped with six monsters still alive; it establishes a CE cast
and damaging hit, with no claim of ordinal40 battle victory. The legally
fielded Rogue naturally reached L9 during preparation.

Executed from the claimed worktree, with `VITE_E2E` removed by the wrapper:

```sh
python3 <ROOT>/run.py browser node_modules/.bin/playwright test --config tests/pwa/corpse-explosion-earned.config.ts
```

Validation receipts bind exact sources: config
`d9eaba238feecb93a66aa608e4460868f30095d8792b891cb253e8b7a31776dc`, spec
`ac564abae7006306bd9866e21f228b61475e43a523a7d535cec924ae9d83eff5`.
The unchanged runtime/unit sources passed7874 tests across254 files
(137.60s Vitest;139.306s wrapper), production build/bridge scan9.860s,
and final revised test sources passed typecheck19.997s and lint49.068s
(91 engine-purity files). The existing15s full-suite/3s engine budgets remain
open; no threshold or warning was weakened. Existing build chunk-size,
Browserslist and precache warnings remain.

Retained raw evidence under the exact ROOT above:

| Artifact | SHA256 |
| --- | --- |
| `browser-report.json` | `9c904af563b4a9f1d10d5dd8e165a4a33e22db82c5640a1b99919bd105393be0` |
| `decoded.json` (JSON attachments only) | `f4331b3864c9429591b22ee9626b186aa06c6ab812084dd14cddd6a971de2f92` |
| `native-outcome.png` | `f6763c6a99b7950d0723ed2f3533a7dabcb0bc6bd2704cf2e3588577982e68f1` |

`execution-summary.json` indexes every attempt, outcome, deadlines and DOM
milestones. Raw report, console, source snapshots, command receipts, pinned
oracle and compatibility audit remain available to independent reviewers.

Preflight GD/TD/code APPROVE, QA ADEQUATE and producer ready covered the frozen
source and oracle. Independent QA measured-evidence review is ADEQUATE:
all raw JSON attachments match the decoded evidence, exact earned provenance
and observed causality pass, and the final whole save equals the ready save.
Final GD/TD/code APPROVE and producer ready independently confirmed the same
raw/export/DOM/screenshot/receipt evidence and bounded claims. After every reader
released, exact manifest/hash/symlink-checked cleanup removed863 files,
42952880 bytes and18 directories under ROOT/dist and ROOT/tmp. No failures or
remaining disposable paths; preview port4399 closed. Cleanup receipt SHA256:
`8509cca10858db41fd70eb0327d527d1c0cbf1646f82e37bb345906709ffa65a`.
The retained ROOT above remains root-owned for umbrella consumers.
This single accelerated route proves earned
unlock/cast reachability; it does not close general affordability/balance,
natural pacing, player feel, campaign, remaining D06/P09/P10 or private-v1.
