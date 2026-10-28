# BUG-369 — Apply mercenary Battle Orders maximum HP/MP support

Status: Open — native repair verified; browser/earned/feature acceptance pending.
Severity: High — advertised recruitable party support is absent.
Build: `6a999263df4cfc550d371c20cd71d1a705742ada` plus the primary test only.
Environment: native Node/Vitest UI project; browser/viewport not applicable.
Locales: zh-CN and en. Seed: 7.
Owners: engine-dev/content-designer/frontend-dev/writer; root implements.

## Reproduction

1. Use real loadMercPool/createMercFromDef/mercToCombatUnit/playerToCombatUnit
   and default skill registry for `mercs/act5-barbarian-battle-orders`.
2. Hold living parties from acting. Construct hero personal maxima1000HP/100MP,
   current700HP/80MP, zero mana regeneration; run at seed7. The supplied
   maxRounds2 is an unused legacy field; held parties reach the60,000ms native
   deadline. The immutable primary retains its original input.
3. Compare against identical source with aura-battle-orders removed from its
   configured signature/combo. These are constructed resources, not earned
   recruitment or campaign evidence.

Expected: gacha-spec.md:121 party +30% maximum HP/MP yields1300/130 versus
control1000/100, with current700/80 unchanged and no aura action/refill.

Actual: both control comparisons pass; independently named numeric assertions
fail1000 versus1300HP and100 versus130MP. Native exit1,8.032417seconds;
all2055inputs unchanged at
`994c7bd4e92287ac79e02c54b22fc2caa03fd4f8ee7bd386ae73e294f64591d1`.

Primary: `src/stores/merc-battle-orders.test.ts`, frozen SHA256
`1dbaf7c56a371e970a2bfa9361999ec6b1f0edcb3c97810800ce4812eb1e5fb0`.
Raw log/JSON/receipts/input maps/frozen primary/approved readiness plan retained
by root in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-battle-orders-p8ofugwf`.

Suspected cause: unpowered authored aura row, self-buff alias stub, no native
source projection or composed temporary HP/MP capacity. Repair the authored
passive and transient resource lifecycle; preserve personal player Orders,
saved/base stats, private Command authority and original replay inputs.

Browser, earned, feature, pacing and full-v1 acceptance remain pending.

## Source-review reproduction

Independent review found malformed MP capacity metadata removal was omitted
from playback when maxima/current MP/carries were numerically unchanged.
New `{}` and `null` transport regressions reproduce native cleanup versus stale
playback: native exit1,276passed/2failed, frozen input96f4890e. Compare metadata
presence/removal as well as scalar changes. Actual regeneration-to-withdrawal,
tied spending and later recovery regression passes without seeded recovery carry.

## Strict-type verification failure

Before correction, project typecheck exits2 with11diagnostics on unchanged
2062inputs at121f714a. It finds duplicate same-value mana in stats-state,
unrefined event/optional Vigor types and explicit undefined fixture fields
forbidden by exactOptionalPropertyTypes, including the original primary control.
The full log and five exact original source copies remain in the packet.
Independent correction-plan review approves omitting genuinely absent optional
keys, explicit type guards and removing the redundant production assignment.
No production type broadening, compiler suppression, assertion or mechanic change.
Original immutable primary RED/GREEN bytes remain historical evidence; a distinct
corrected primary binding will explicitly supersede its erroneous control shape.

## Native repair and verification

Closed authored passive tuning, fresh canonical source qualification and composed
temporary HP/MP capacity now implement the advertised bonus. Capacity gains do
not refill resources. Source withdrawal settles before death effects and clears
both exported and internal MP recovery carry at the final cap. Paid Command,
wave refresh, late summons, silent absolute playback and initial publication are
covered. Personal player Orders, saved/base stats and acquisition stay separate.

Original primary remained byte-identical through historical RED/GREEN. Its typed
successor omits the absent optional signature field rather than assigning
undefined; it preserves all numeric assertions, controls, resources and seed.
Successor SHA256:
`f7988097a3e0e8037f9f347881cd66b94aa6d21017f6c13b48b359fdd3f67181`.
No corrected-source RED is claimed. Exact lineage and independent correction
approval remain in the packet.

Final unchanged 2062-input digest:
`385990358c9bfe258ff7eab244c7ae25772573b2082c1c59234afe8c25b3f258`.
Native exit0: primary2, focused279/16files, engine11143/416files,
full21730/1020files plus2unchanged skips, project typecheck, zero-warning
full lint/engine purity and external production build. Six new files add72cases;
all existing assertion/status identities remain after two unchanged dynamic
Date-label reconciliations. Build retains prior chunk/precache warnings.
Disposable build removed and absence/process cleanup verified.

[Native evidence](../../docs/plans/evidence/merc-battle-orders.md) and retained
source/evidence/checkpoint bindings govern the local repair. This is native
constructed support evidence, not earned recruitment, campaign pacing or full-v1
acceptance. The bug remains Open for the unverified browser/earned feature path.
