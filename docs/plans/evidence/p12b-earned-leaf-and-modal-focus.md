# P12b — Earned Leaf lifecycle and shared-modal focus recovery

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited
local changes. [BUG703](../../../production/bugs/BUG-703-modal-removed-action-focus.md)
is resolved locally, uncommitted. Full private v1 and independent acceptance remain open.

## Earned equipment and granted skills

Source is the unchanged genuine Fire Sorceress53, Normal next921, material
ordinal908 export from the preceding set slice. SHA256:
`d6777f263d4ee7f0e6be0ae93b49c0a4b252995db6fe13c5a7663a437d4e4f4a`.
Installed Playwright Chromium drove native source Vite UI with
`NODE_ENV=production` and no game test bridge. This is source-browser evidence,
not production-bundle/PWA or independent acceptance.

Exactly85 recorded backpack items move to stash; the genuine level10 normal
staff `it-1j88u-vwd` moves out of stash. Tir then Ral are inserted once each,
creating Leaf with receipts909/910. Tir214→213 and Ral104→103. Hero equips Leaf
and restores the original weapon; the Barbarian Recruit then equips Leaf.
Two native priority moves place Fire Bolt immediately after signature Basic
Swing, followed by Bash and Chop. Removing Leaf makes Fire Bolt unavailable;
returning it restores availability and preserves the dormant configured order.
Learned ownership and points remain unchanged. Chinese360×640 priority inspection
has no horizontal overflow. Explicit Save/reopen/Continue preserves gameplay.

Two admitted off-browser combat diagnostics are complete and closed; no rerun,
campaign admission or reward claim. Both use native ActV Barbarian Savage53,
construction seed1/battle seed7/maxRounds2. Equipped Recruit casts Fire Bolt7
times in84events; removed Recruit casts it0times in116events. This demonstrates
activation, not encounter viability. Projection confirms merc granted rank3→0→3,
hero learned rank5 remains5 rather than stacking to8, and Leaf adds0.12 hero
fire damage modifier. Continued and returned combat projections are identical;
diagnostic inputs remain immutable. No runeword/engine correction was justified.

## Shared-modal correction and validation

The original removal/return exposed focus falling to BODY after the candidate
Equip button disappeared, leaving Escape ineffective. BUG703 was filed before
production edits. Floating UI recovery listeners require both a floating node
and an HTMLElement reference; Modal now registers its captured opener with
`refs.setReference`. Its stable refs object is included in the layout-effect
dependencies. No item/store/combat/schema change accompanies the fix.

The new regression fails before the production edit (1failed/6passed). Final
18 affected cases pass: Modal7, merc equipment integrity3 and bilingual inventory
focus8. jsdom requires explicitly dispatching Chromium's removal focusout event;
native evidence independently checks actual removal. Explicit two-file lint and
scoped strict types pass. Existing React Router future warnings occur in the
integration test log; native production-mode browser errors/warnings are zero.
No broad suite/build/typecheck or earlier-act replay was run.

Exactly two additional reversible native weapon swaps verify removal/return
focus recovery inside the dialog, Escape dismissal and opener restoration.
Separate English Tab/Escape and Chinese360×640 entry/Escape observations pass.
No swaps, crafting or campaign actions repeat during observer recovery.

## Save accounting, observer corrections and closure

Failed observers and their scripts/logs remain retained. Early lifecycle
assumptions were corrected by resuming settled successors. Later modal observers
first overlooked legitimate online bonus decay, then treated an exported save
as the persisted checkpoint, then overlooked App's automatic offline reconciliation
before Home Continue. No production persistence fix or excluded bonus fields.
The final suffix reads IndexedDB read-only from an inert same-origin document
before App mounts, observes native boot, then Continue. Four full-state
comparisons pass with explicit accrual/decay arithmetic, including reconciliation
of the retained explicit-Save/boot pair. The suffix performs zero gameplay actions.

`conservation-audit.json` verifies all530 canonical items survive; only the
staff's intended sockets/rarity/runeword payload changes. Backpack99/stash401,
original hero equipment, player, map, formation and endgame reconcile. Resource
changes are only Tir−1/Ral−1 and ordinal908→910; the exact last receipt matches
insertion2. Merc hydration mirrors agree with canonical gear and the intended
stored priority. Original earned export and all16 original production input
hashes remain unchanged. Final Modal/test hashes are recorded separately.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-earned-leaf-eliqxwgr`.
`cleanup.json` verifies exact server3685481/session65573 exited0, port5173 closed,
no task browser processes, and removed browser-profile/Vite/projection caches
and disposable scoped type config. Exact config contents are retained as
`modal-types.retained.txt`. No disposables or cleanup failures remain.
`retained-manifest.json` checksums104 required files. Root retains the required
packet and claimed human2 through umbrella review, then owns cleanup/release.

Counts remain14/14 intended ActI,7/14 five-act Normal and formal balance0/210
(unaccepted, not210 failures). All-family acquisition/crafting/granted skills,
economy/pacing, seven remaining builds, higher difficulties/endgame, broader
app/PWA/accessibility/performance and final independent acceptance remain open.
