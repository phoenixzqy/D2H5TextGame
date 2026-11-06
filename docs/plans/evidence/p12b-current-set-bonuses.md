# P12b — Current set activation and earned equipment integration

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited
local changes. [BUG702](../../../production/bugs/BUG-702-set-bonus-current-equipment.md)
is resolved locally, uncommitted. Full P12b/private v1 and independent acceptance
remain incomplete.

## Root correction

`resolveItemDisplay` now counts distinct set pieces only in the supplied
equipment list. Inspecting an unworn second or third piece no longer activates
its threshold. An explicit prospective loadout still activates the comparison
preview even though its candidate is not yet equipped. Stash details now receive
the hero's actual equipment, matching backpack details. No combat formula, item
definition, ownership operation, cost, save schema or migration changed.

The original resolver run has 8 failing / 36 passing cases. The failures prove
unworn-second/third-piece and duplicate-copy cases in both languages before
production edits. All 44 resolver cases pass after the correction. All 8 detail
component cases also pass, including localized inactive/active/removal rendering.
That is 52 unique affected cases; no broad suite, build, whole typecheck or engine
suite was run. Four-file ESLint and affected-file diff whitespace checks pass.

One component assertion initially matched both English `active` and `inactive`.
It now matches the complete localized two-piece heading; the original failing
log is retained. No production change was needed for that test correction.

## Earned native browser path

Installed Playwright Chromium drove the source Vite app with
`NODE_ENV=production`, without a test bridge. Source is the unchanged genuine
Fire Sorceress53/Normal next921/material ordinal908 export from the previous
earned crafting slice. SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.
No fabricated save, farming, campaign admission, respec or economic transaction.

Nine functional observations cover English1280×800 and Chinese360×640:

- With only Iratha gloves `it-9jn9w-dc7` worn, backpack helm
  `it-8qn3x-e73` and stash weapon `it-1qn4p-e3k` show all thresholds inactive.
  The helm comparison correctly previews only the two-piece bonus as active.
- Equip that genuinely owned helm through the native item action. Head custody
  changes to the helm; all owned items and resource/quest ledgers are preserved.
  Fire Resistance changes55→85. Net lightning147→117 and physical82→75 also
  reflect removing the previous socketed Lore helm; these are not claimed as
  the isolated set bonus. No battle was run, so no combat or balance credit.
- Inspect the unworn stash weapon and amulet `it-77tux-dwc`: only two-piece
  remains active, with three/four inactive. This also verifies stash receives
  current gear rather than an empty context.
- Save, reopen a page and Continue preserve exact earned equipment/gameplay;
  the continued stash inspection still shows only two-piece active.

Four full-save comparisons pass: source→baseline, baseline→inspection only,
equipped→stash inspection only and after→Continue. Only actual timestamp,
lastOnline and informational offlineTime differences occur. Bonus window and
multiplier are checked, not excluded. Browser page errors/warnings: zero.
Measured set sections have no horizontal overflow in these observations.

Two additional settled visual observations cover both layouts with reduced
motion. English returns to the baseline language before exact save comparison.
The untouched continued export is imported immediately before this visual
baseline, so elapsed offline accrual does not change the bonus window during
the inspection comparison. Source→visual baseline and visual inspection-only
comparisons pass with no excluded bonus fields. Original snapshots captured
fade-in frames; settled captures are the visual evidence, not those frames.

## Observer corrections, review and retention

First functional observer stopped before equipping because it compared an
English baseline to an intentional Chinese preference change. It now restores
English before comparing. First supplemental visual observer correctly detected
offline bonus accrual/online decay after reopening the browser; it did not ignore
those fields. The corrected visual observer imports the unchanged earned
continued backup immediately before baseline. Failed reports/scripts/logs are
retained; no economic action or campaign admission was repeated.

Local review checks current/prospective semantics, unique-piece counting, supplied
list immutability and stash propagation. Evidence is implementer evidence, not
independent QA. Other tooltip surfaces, all set families/acquisition, full
combat integration, production/PWA and umbrella acceptance remain open.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-set-activation-4nqzntqv`.
Contains exact preimages, sources/hashes, repro/final test and lint logs, native
exports, browser observers/reports, original failures and settled screenshots.
`cleanup.json` verifies exact task server3681205/session11508 exited0; port5173
closed; no browser-profile processes; owned profile/Vite cache removed and
verified absent. No disposable paths or cleanup failures remain. Source hashes
still match the validated files. The required packet and claimed human2 remain
with root through umbrella review; root owns eventual evidence cleanup/release.

Campaign counts unchanged:14/14 intended Act I clears,7/14 five-act Normal
completions, formal balance0/210. Full private v1 stays active/incomplete.
