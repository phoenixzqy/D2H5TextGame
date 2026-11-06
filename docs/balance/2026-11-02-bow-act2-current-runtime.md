# Bow Amazon Act II: current runtime and earned equipment adaptation

Authority52 is unchanged. The retained earned level26 save at Normal ordinal790
enters Arcane Sanctuary through the current native restore, planning, combat,
playback, reward and settlement paths. The original gear, skills, merc and
formation are preserved. No historical combat actors are injected. Each trial
restores the same earned save; these are encounter exploration, not fresh
campaigns or sequential retries. No holdout seeds were inspected.

The baseline policy was frozen before seeds1–100. Its third wave is the matched
level26 elite target. All100 reach and win it; victory-only nearest-rank p50 is
19.327s and p95 is25.236s. Wilson95% win interval is96.30–100%. This is above the
proposed elite80–95% band, not a balance acceptance. Full areas clear79/100
(Wilson70.02–85.83%); all21losses follow the target:12at wave index3, seven at4,
two at5. Full-area survival is not substituted for elite encounter win rate.

The separate Python raw reader authenticates every compressed trial and all2141
source inputs, reconstructs the569wave outcomes and damage/mana summaries, checks
808retained-unit HP/MP/cooldown carries, and joins native wave deltas to each
area delta. Two repeated historical seeds have exactly equal initial teams and
combat metrics. A complete wave diff has zero unclassified changes: explicit
Inner Sight25%status payloads replace the legacy fallback, current wishstone
income is lower, and seed8item IDs differ only in their allocator suffixes.
All item payloads and generation-entropy prefixes are otherwise equal. These
checks do not supply missing independent per-wave post-state snapshots.

A second policy was frozen after baseline exploration: use Drognan's native free
stat reset, refund125invested points, then allocate50Dexterity and75Vitality.
Core stats change20/125/45/15→20/75/95/15; the remaining stat resets fall2→1,
skill resets stay1, and wishstone cost is0. Every equipped item remains eligible;
gear custody, currencies, merc, map, formation and meta remain exact. No skills,
levels or XP are granted. Prepared attack140→115, attack speed225→175, physical
dodge43→33%, and maximum life501→601 expose the actual tradeoff.

The same100exploration seeds produce49/100area clears (Wilson39.42–58.65%).
Only98reach the elite:94win and four lose; two die before it. Conditional
elite win rate is94/98, with Wilson89.97–98.40%; reach-and-win is94/100.
Victory-only p50 is24.341s and p95 is34.844s. Eight baseline losses become wins,
but38baseline wins become losses. The adaptation is rejected as a general
survival recommendation. Its native reset expenditure and all failures remain
recorded; it does not demonstrate within-three-attempt success.

Both runs finish within their frozen180second/50MBbudgets: baseline36.982s,
3,894,931compressed bytes; adaptation35.927s (36.676657s for the later gear trial).
Scoped driver strict types and both separate raw readers pass. No production
source/data/save edits, campaign replays or unrelated tests occur. Vite/esbuild
consumers exit and exact task cache directories are absent. The failed reader
assumptions about missing fields, explicit zero defeat rewards and pre-target
attrition were corrected without replaying combat.

## Earned crown preparation

The next preparation targets the dominant recorded loss source: physical direct
damage. Four native equipment projections inspect existing backpack items without
combat. The earned Undead Crown (`it-16pbc-53f`) replaces the rare skull cap
(`it-7i8se-3m7`) through `inventoryStore.equipItem`. No item is granted or rerolled;
the displaced helm returns to the backpack. Currency, materials, other inventory
domains, points, resets, skills, level, XP, merc, map and formation remain exact.
Current life/mana do not increase during equip. Prepared defense189→237 and
maximum life501→521 accompany physical dodge43→40% and magical dodge9→7%; attack
and attack speed stay unchanged. The crown has no authored life steal.

The one-item policy is frozen before another100exploration trials at the same
earned source and seeds1–100. The complete results are:

| Preparation | Elite wins / reached | Full-area clears | Elite victory p50 / p95 |
| --- | --- | --- | --- |
| Original earned gear | 100 / 100 | 79 / 100 | 19.327s / 25.236s |
| 50 Dexterity moved to Vitality | 94 / 98 | 49 / 100 | 24.341s / 34.844s |
| Earned Undead Crown | 97 / 100 | 93 / 100 | 17.809s / 27.063s |

Crown area-clear Wilson95% is86.25–96.57%; elite-win Wilson95% is91.55–98.97%.
Twenty baseline losses become wins, while six baseline wins become losses.
Three crown losses occur at target wave index2, three at3, and one at4. This is
useful gear-specific survival evidence with a real dodge/resistance tradeoff,
not a universal recommendation, a sequential retry result or balance acceptance.
Do not tune global content from this one fixture or repeat these three screens.

The crown run settles584waves in36.676657seconds and retains4,087,768compressed
bytes. Scoped driver strict types pass after restoring an omitted local
eligibility observer. The separate raw reader verifies all100raws, exact native
inventory replacement against each paired baseline, unchanged enemy teams for
corresponding attempted waves,826retained-unit resource/cooldown carries and
wave/area settlement accounting. It initially assumed the legacy
`player.equipment` array follows equip actions; the existing player-store contract
explicitly retains that cache. The corrected reader checks that cache remains
unchanged and checks active gear through the authoritative inventory instead.
No combat is replayed to correct that reader assumption.

Evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-bow-act2-current-runtime-v1` and
`p15-bow-act2-vitality-adaptation-v1` and `p15-bow-act2-crown-adaptation-v1`
policies, typed drivers,100raw trials each, plans, reports, readbacks and logs;
`p15-bow-act2-earned-gear-projection-v1` retains the four native projections.
Root retains the packet/worktree through
umbrella review and owns eventual cleanup/release. Accepted balance cells remain0.
Next address broader current-build fairness; these preparations are not a reason
to alter global enemy damage. Current
recommended-power fixtures, populations, holdouts, retry/manual-idle, pacing and
full G0–G7 acceptance remain open.
