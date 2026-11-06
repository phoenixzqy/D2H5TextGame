# Owned weapon preparation and native admission 1595

BUG618 is fixed: retrieval reserves room for displaced mainhand/offhand items,
including backpack candidates and the slot freed in stash. All 34 distinct
affected cases have passing evidence, with scoped strict types/lint. The earned
partial preparation successor is preserved: four native actions equip owned
RazorStitch `it-1g6tj-ar0`, conserving all 442 items and every intermediate save.
Attack rises 294 to 475; both old/new speed reach the native 400 ms floor.
Defense losses are deliberate. Preparation repeats as an exact no-op.

One separate bounded native admission, ordinal1595, uses the canonical
Dim Vision → Decrepify → Corpse Explosion and the actual prepared export.
Waves1–3 win in43.735/37.921/22.131seconds. Wave4 draws at60seconds with18/20
living enemies and both allies alive. First deaths occur25.275/49.019seconds;
two CE casts deal8058direct damage. Twenty-one items and266786XP are earned
from successful waves only. No campaign action or formal balance cell completes.

Saved opening events expose deterministic registration-order target selection:
both allies focus the first champion (10522life,219Defense,50%physical resistance)
while ordinary opponents have2960–6060life. The hero's first noncritical basic
hit is18; later Inner Sight raises it to73. Hero basics:60attempts/6338damage;
mercenary fallback basics:27attempts/7954damage. These are distinct from the
mercenary's registered Basic Arrow and Cold Arrow actions. The delay is evidence
for reviewing common target acquisition, not proof that changing it wins.

Authoritative next save: retained root-owned packet
`d2-counted-source-z3jj3xa1/p15-owned-weapon-native-v1.native-export.json`,
SHA256 `3f5cd69ca2858225fa05ae3c353041d2fc0924f823ad02b4d9c015c3134339f0`.
Next ordinal1596; never resume1595 inputs or earlier saves. Independent readback
passes whole-save, ownership, rewards, source/campaign manifests and resource
accounting. Native driver wall2366.974ms/combat163787.305ms. Old experiment
families/controllers remain closed. Raw plan/result/journal/export/process and
reader evidence use stem`p15-owned-weapon-native-v1`; BUG618 preparation uses
`bug618-owned-weapon-prepared-v1`. All recorded consumers are terminal.

ActV13/19; formal0/210; BUG611 and BUG592 remain open. No user answer/external
blocker. Browser works, CI excluded, no earlier-act replay. Full privatev1 still
requires remaining ActV/Baal,14-build populations/holdouts/fairness, economy/Hell,
adaptation/manual-idle/defeat-retry,30–50logical active-hour pacing and integrated
G0–G7/soak/independent review/later owner playtest. Root retains the claimed
human2 worktree and packet through umbrella review and owns eventual release.
