# Acts II and IV current-runtime comparison — 2026-11-02

Status: sampled runtime and independent accounting complete; full v1 remains
unfinished. No production code or game data changed.

The frozen selection takes the last listed policy per build/act/role in the
authenticated retained inventory, excluding completed Bow Act II roles. It
covers 54 roles with historical seeds 1 and 8: 108 native areas and 548 waves.
Cold Sorceress Act II elite metadata was derived before combat from the pinned
planning report; its original fixture was preserved. These samples diagnose
runtime differences; they do not establish population balance or first-encounter
power.

| Sample | Areas | Current wins | Historical wins |
| --- | ---: | ---: | ---: |
| Act II | 52 | 49 | 49 |
| Act IV | 56 | 49 | 49 |
| Total | 108 | 98 | 98 |

All combat metrics match historical results. The independent reader reconstructs
548 settlement deltas and verifies 785 retained-unit HP/mana/cooldown carry
transitions, with zero unresolved wave differences. Native execution took
138.802 seconds and retained 38,952,536 compressed bytes.

Preparations reproduce original native operations and real costs: 508 stash
moves, 46 no-income discard operations retaining all 58,914 discarded IDs,
50 capacity observations, four owned gear transfers, eight material actions,
four equips, 38 skill points, two free priorities and two declared Corpse and
curses priority changes. The Javelin Act IV trash socket preparation consumes
200 rune shards, two Hel, two flawed skulls and two Shael per sample; its skill
allocations remain declared. The reader reconstructs prepared inventory custody.
No free gear, level, resource or reward is injected.

Some retained sources contain extensive repeat-farming inventories: Summon
Necromancer has 5,481 Act II backpack items and 61,123 Act IV items. These are
not representative acquisition fixtures. Martial Assassin Act II elite cannot
make its desired capacity with the retained 99 backpack/491 stash items; its
capacity observation and overflow remain explicit.

Preparation differences versus historical are only current empty recruitment
defaults. All wave differences are classified: 11,078 allocator suffix-only IDs,
392 current wishstone economy entries and 10,772 explicit legacy Inner Sight
payloads. Combat equivalence does not establish economy fairness.

The ten unchanged area failures remain visible:

- Javelin Act IV elite: both target elites win, followed by Izual timeouts.
- Javelin Act IV trash: seed 8 wins its target, then dies later.
- Double Throw Barbarian Act II trash: both targets win, followed by deaths.
- Corpse and curses Necromancer Act II trash: seed 1 wins its target, then dies.
- Corpse and curses Necromancer Act IV elite: both runs time out in preceding
  trash and never reach the intended elite.
- Corpse and curses Necromancer Act IV trash: targets win, followed by death
  or timeout.

The historical profile ID `necromancer-bone` denotes Corpse and curses. Its
Act IV elite checkpoint has CE20, Teeth20, Decrepify1 and attack483; the failed
seed 1 preceding wave spends 39 Teeth, 15 Decrepify and nine CE casts while
reaching zero mana. Corpse payment works and CE hits all enemies. The authored
flat spell damage is substantially mitigated at this enemy level; no engine
bug was established. A separately frozen paired study evaluates removing Teeth
from priority while preserving all gear, stats, ranks, party and costs. This
comparison itself does not adopt that adaptation.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

| Artifact | SHA-256 |
| --- | --- |
| `p15-act24-current-runtime-differential-v1.json` | `768c7b45835320a46f9fed06b05b325523d4fb3aad8a3b74a47022a46ad003b3` |
| `p15-act24-current-runtime-differential-v1.policy.json` | `0e245fc7b1f7c54d52b7d8df664eeb7adb59ffea035021de31c3a34844e1376c` |
| `p15-act24-current-runtime-differential-v1-readback-v1.py` | `e1fe7be218810b1eea27b7e777a3deb1653e2ef42f71859d2a706dd1d5afd94e` |
| `p15-act24-current-runtime-differential-v1-readback-v1.json` | `eabecd88174f1c99faec676a2acad1393b3fb8e98e848b2a5afeb9b2cef6f77e` |

Authority 52 authenticates all 2,141 current inputs before/after combat and in
the independent reader. Completed Acts I/III/V and Bow Act II evidence is reused
without combat replay. Accepted balance cells remain 0/210. Population/holdout
fairness, fresh acquisition, representative recruitment/Hell economics,
defeat/retry/manual-idle, storage/runtime, calibrated 30–50 active-hour pacing,
integrated G0–G7, two-hour soak and independent review remain before owner
playtest. Browser works; CI is excluded; no pending question or external blocker.
Root retains the worktree and required evidence through full-v1 review and owns
eventual cleanup and worktree release.
