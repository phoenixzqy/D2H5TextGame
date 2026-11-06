# Retained equipped-item award and transformation paths

All 524 distinct profile/item identities used by the 70 retained boss inputs
now have exact award/transformation paths for all 1,230 canonical equipped
uses. No gameplay, production data or authoritative save changed. This closes
the equipped-payload trace, not full acquisition/economy or balance signoff.

## Scope and evidence

Use the existing point audit's exact 70 sources, canonical hero equipment and
fielded mercenary equipment. Remove only `equipped` and `equipSlot` when
comparing an item across ownership containers. Preserve every intrinsic field,
including identification, affixes, rolls, rarity, capacity and socket contents.
The same item ID in another build is a different provenance target.

`p15-equipped-origin-index-v2.json` indexes the 14 authenticated historical
lineages: 373 report files and their 14 original compressed journals. Read the
5,274 original settled-wave reward records without replaying combat; actual
awards equal raw reward item arrays. Retain 1,505 target award witnesses and
484 target socket witnesses. Files, journal lines and complete item payloads
are pinned. Report-level act/ordinal bounds are conservative; they do not
silently promote later preparation into an earlier checkpoint.

The first index pass finds exact paths for 1,228 uses. Independent readback
checks canonical equipment against all 70 complete source exports, 522 chosen
award witnesses and 418 socket debit receipts against 187 raw source files.
Five altered controls reject changed identification, intrinsic power, future
awards, another profile's award, and a substituted socket. The report is
`p15-equipped-origin-readback-v1.json`.

## Two exact raw-prefix refinements

The remaining two items require their already-retained continuation prefixes,
not more gameplay or another general scan:

| Source | Item | Exact explanation |
| --- | --- | --- |
| Javelin Amazon, Act V, next ordinal 1137 | `it-54tzc-14wm`, helmet | The native-v3 report ends at 1138, so the coarse report bound excludes its preparation. Raw lines 9–15 record three funded gem fusions and four helmet insertions before the first admission at 1134. Line 58 contains the exact equipped payload at the selected boundary. |
| Corpse/curse Necromancer, Act V, next ordinal 1296 | `it-927kq-17ig`, weapon | The awarded weapon has capacity zero. Raw line 2 consumes the earned, available Harrogath Larzuk service and changes only capacity to the normal base's reviewed maximum of four. Lines 14–17 insert four owned Eld runes before the first admission at 1294. Line 44 contains the selected boundary's exact equipped payload. |

`p15-equipped-origin-two-boundaries-v1.json` supersedes only these two index
dispositions. It verifies both original awards and unique parent ownership,
the actual claimed service and consumed target, intrinsic payload preservation,
all eight insertion debits, three recipe-defined gem fusion costs, sequential
material action ordinals and resulting material/currency balances. Funding
starts from each exact parent export. Three controls reject service reuse,
an intrinsic change disguised as service use, and an unfunded material debit.

The original 1,228-use readback is reused unchanged. Combined: 1,230/1,230
equipped payload paths, 524/524 profile/item identities, 426 selected socket
debit receipts, three additionally checked funded exchanges and one consumed
Larzuk charge. None of the 565 socketed equipment uses is resolved by
discarding socket power from the comparison.

## Verification, cleanup and limits

The local readers run outside the repository. No production edit means no
unrelated unit suite, earlier-act fight, finished browser study or old campaign
is rerun. Initial reader attempts exposed four format assumptions: the point
audit's status token, material requests' input array, older admissions without
an explicit act, and hashing the JSON representation of an exported string.
Their four failed receipts are retained; three final processes pass. The second
extractor saves each completed route so a later format failure can reuse it.

`p15-equipped-origin-artifacts-v1.json` records final process termination, input
pins and exact cleanup. The 14 route extraction caches and two redundant
progress files are removed only after checking that the final index preserves
their content. Source readers, outputs, receipts, failed logs and required
shared evidence remain in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root owns eventual removal after the umbrella goal's consumers finish. The
human2 worktree claim remains active; the original checkout is read-only.

These records do not establish complete chronological custody, funding of
every historical material action, every reset payment, appropriate per-act
power, historical/current data equivalence, or population acceptance. Reuse
existing per-action checks and investigate actual coverage gaps; do not replay
whole campaigns to reproduce these item paths.

Next freeze the outstanding per-role power and adaptation policies, including
Corpse Explosion pack orders for Necromancer IV/V, and resolve the remaining
65 unmatched trash/elite contexts. Keep the existing 75 matching recipes and
all 70 quest-ready boss sources. Population/holdouts, manual/idle and within-three
evaluation, economy/fairness/30–50-active-hour pacing and integrated G0–G7 remain
open. The two-hour soak and owner playtest follow implementation. Browser works,
CI remains excluded, and there is no pending question or external blocker.
