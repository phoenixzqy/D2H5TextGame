# P15 — Bow Act II continuation; level20 and two earned clears

Latest Bow progress is now [Act III/IV](p15-bow-earned-act3-4.md): earned40,
next1466, Mephisto defeated/Claimed, Act IV Izual still unearned. Resume that
successor with35 actions. The remaining account below records the historical
Act II implementation and26/next797 Durance frontier, whose rewards and
evidence remain immutable.

The original Act III report retains a technical audit failure: its caller
omitted `act3Start:21`. `p15-bow-act3-frontier-reaudit-v1.json` passes the
corrected read-only audit with exactly the same export, zero action/settlement
exceptions and retained Council proof. No combat or reward replay occurred.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains it through umbrella QA and owns eventual disposal. Registered
human worktree2 remains claimed; the original checkout stays read-only.

## Preparation and progress

Native431 adds owned lightning armor,432 selects the already-owned Rogue20;
both lose Rocky W4.433 cannot socket because the backpack is full; no gem
charge occurs. The next driver salvages242 surplus items, dismantles spare gems
and fuses one Normal Diamond before its zero-currency-key assertion fails.
The exact committed successor resumes without paying those costs again.

Native434 completes the remaining12 Diamond fusions and13 insertions: six hero
and seven Rogue sockets. Hero Magic Resist36/Rogue42. Rocky clears;435 loses
Dry Hills W3 to lightning. Existing rune recipes fuse one Ort from24 earned
Ith and one earned Tal through12 actual actions. It fills an owned empty belt,
preserving every Diamond and raising hero lightning resistance30→60.
436 wins Dry Hills W3 and loses W4, with poison attrition and no surviving merc.

437 earns W1/W2 rewards before a W2-only Flee helper refuses installed W3.
That partial save is retained. The helper now accepts an explicit expected
next-wave number with integer, run-bound, cursor and installation checks;
existing callers retain their W2 default. Corrected continuation starts438.
Fifty new current-act W1/W2 admissions earn only missing level20, using native
Flee on unplayed W3. No earlier-act acceptance or acquisition is replayed.
488 clears all five Dry Hills waves.489 reaches Radament and draws after60s.
The successful continuation takes15.954s wall time, including acquisition.

## Historical failure at489

Radament has5050HP,242armor,63Magic Resist and25% physical resistance. Most
Multiple Shot hits reach the minimum damage floor;33 hero physical damage
events total272, and23 Arcane events total19 against the boss. The final wave
ends with only Radament alive at4603HP, hero149HP/4MP; mana reaches zero.
Rank20 Multiple is already capped. Damage versus mitigation must be addressed
alongside sustain before further leveling or another native retry.

Hero core20Strength/101Dex/39Vit/15Energy; max388HP/195MP,36Magic Resist,
lightning60/poison45 resistance. Ranks Multi20/Magic1/Critical1/Dodge1;
free resets1skill/2stat. Rogue remains fielded and Prayer remains owned.

## Focused verification and evidence

Only campaign support code changes in this continuation: gem/rune socket
conservation and the expected-wave Flee guard. Five selected economy contracts
and nine existing socket-conservation regressions pass. No engine-wide/unit
sweep, earlier-act campaign replay, browser/build, seed grid or CI runs.

Scoped typecheck validates the current driver/helper versions. Consumed
historical helper/driver versions and type failures remain unchanged as
evidence. The corrected driver restores outcome narrowing; the corrected
Diamond helper has an explicit equipment-result type. Affected-file lint uses
`--no-ignore`; the earlier ignored-file invocation is not validation.

Independent `p15-bow-act2-readback-v2.py` reads the eight reports and compressed
journals: contiguous431–489 admissions, exact predecessor exports, full item/
material/currency custody, XP, actual fusion costs and50 Flee player/inventory
pairs pass. Totals:59 admissions/135waves/129wins/6nonwins;296140XP,
927added/934removed items,14insertions and25actual fusions. The first readback
counts24 journaled fusions; v2 also counts the committed Diamond fusion whose
post-commit assertion failed before its journal entry.

Authoritative small summary: `p15-bow-act2-earned-summary-v2.json`. New artifact
manifest: `p15-bow-act2-continuation-artifacts-v1.json`; prior manifests stay
immutable. Production game data is unchanged. The source fingerprint changes
only for the earned-playback helper, because its collection includes harness
sources; every individual native report asserts source stability.

## Rank Attack change and subsequent progress

BUG501 adds JSON40percentage-points of snapshot Attack per rank above one to
Multiple Shot, alongside its existing flat40–60/+12 curve. Rank1 adds0%,
rank2 adds40%, rank20 adds760%, before crit/multipliers/resistance/Defense.
Cost15MP/2s, cone3/cap5, prerequisites and hit rules remain. The coefficient is
provisional pending later-act/fresh/matrix/pacing evidence. D04's old restriction
is explicitly superseded in `decisions/P15-bow-rank-attack-growth-v1.md`.
Fractional fixed and per-rank percentages retain precision until the normal
final damage floor; an integer-scaling helper initially rounded them too early.

490 clears Far Oasis including Radament25.868s. Shaft recovery, Claim and book
reading bring the canonical actions to10.491 loses Lost City W1.492's owned
mixed-armor change also loses. Independent readback finds **no resurrection
events** in either encounter: direct-damage totals include overkill.

493–555 are63 new Far Oasis W1/W2 farming admissions to earn22, not previous
income or acceptance replay.556 clears Lost City and completes the Staff quest;
557 wins Arcane W1–W3, loses W4.16 actions retained. The previously identified
rare War Hat was already salvaged during acquisition; a failed retrieval at558
retains the newly committed98-item salvage without an admission or gem charge.

558–635 earn new Arcane W1/W2 income to24;635 loses W2.636–789 earn only W1
income to26, with native Flee on unplayed W2. One owned Normal Diamond goes
into the actually owned Undead Crown (unique req26); its zero-material-key
assertion fails after commitment.790 resumes that exact save, pays no socket
cost again, equips the Crown through native comparison/equipment APIs, and
clears Arcane.791 clears Tal Rasha's Tomb/Duriel42s, claims Seven Tombs and
unlocks Act III. `p15-bow-act2-undead-crown-continuation-v3.json` is the completed
Act II checkpoint; preserve it independently of the later Act III partial save.

792–795 clear the four Act III areas above with no acquisition.796 reaches
Durance W5 and draws. Current ranks Multi20/Magic1/Critical2/Dodge1/Penetrate8.
No respec, merc replacement or injected level/resource/seed was added here.
Full current-export economy is independently read back across490–796:
307 admissions/493waves/488wins/5nonwins;1,602,200XP,3426added/3292removed
items, one actual insertion, no fusion and294 Flee custody pairs. Actual source
stability and native lineage pass. Readback does not certify balance or pacing.

## Scoped checks and browser evidence

23 affected engine/schema checks and10 selected bilingual Multiple Shot UI
checks pass.15 existing shared Attack/Cold Arrow controls pass; two new
fractional percentage regressions fail before the correction and pass afterward,
with the retained Radament victory control. Current combat/test/Crown-driver
scoped typecheck and typed lint pass. Failed type/lint configurations remain
as evidence; the final external-driver config includes it explicitly. No full
suite, other-act acceptance replay, seed grid, production build or CI run.

Chromium works in WSL. Formatted106KB save input timed out in the development
browser; the same public save compacted to60KB imports successfully. Two
zh-CN360×640/en1280×800 previews verify the760% tooltip,268–288 base damage,
no console/page errors and no horizontal overflow. V4 screenshots leave the
detail panel below the trees; V5 scrolls it into view and verifies visible
geometry/screenshots. This is development-browser evidence, not production/PWA
or formatted-save performance acceptance. No power injection or combat bridge.

## Next work

Resume797 and all31 canonical actions. Diagnose retained Durance W5 mana use,
its off-cone survivor and basic fallback before another admission or acquisition.
Do not re-clear the four Act III areas, Acts I/II, Claim/assemble/break the Orb
again, repay the Crown Diamond or repeat historical farming/checks. Future
Act III audits must pass `act3Start:21`.

Later Bow, remaining build matrix, economy/pacing/holdouts, final fresh five-act
integration, production/PWA, endgame/soak and owner acceptance remain open.
Nova/necro earned Baal checkpoints remain unchanged. Root owns the retained
packet through umbrella QA and eventual disposal. New immutable manifest:
`p15-bow-rank-attack-artifacts-v1.json`; prior manifests remain unchanged.
Full private v1 is incomplete; the human2 claim remains active.

Artifact readback:122 retained leaves/34 terminal process receipts. Five task
TypeScript configs removed with contents/hashes retained in the manifest;15
owned Vite caches verified absent. No owned task descendant remains. Required
evidence stays at the exact packet path above; root removes it after umbrella QA.
