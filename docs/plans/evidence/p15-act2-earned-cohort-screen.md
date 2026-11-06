# P15 — Act II earned-power cohort screening

The prospective [cohort plan](../decisions/P15-act2-earned-cohort-screen-v1.md)
completed with exit 0 in 699.738 wall seconds. Its 24 separate populations
(12 earned level-32 builds × manual/idle, seeds 1–100) produced **2,400 attempts,
14,400 wave wins, no hero deaths and no unreached bosses**. Each population's
unadjusted 95% Wilson win interval is [0.9630065, 1]. Boss median durations span
6.9–27.3 seconds. Separate retained-output readback passed before any subsequent
source correction; do not rerun its source-equality reader against changed data.

This establishes a cross-build challenge concern, not balanced encounters or
typical first-clear acquisition. Formal acceptance remains **0/210**. The
earlier Double Throw 200 trials are reused separately; Bone's actual level-24
completion/manual boss-order adaptation is not pooled into level-32 populations.

## Diagnostic contribution

Manual boss median seconds / mercenary share of friendly direct damage:

| Build | Median seconds | Mercenary share |
|---|---:|---:|
| Bow | 12.600 | 78.8% |
| Javelin | 14.460 | 86.8% |
| Martial | 27.300 | 75.2% |
| Traps | 16.000 | 56.7% |
| Double Swing | 7.364 | 34.2% |
| Fire Druid | 8.280 | 34.4% |
| Summon Druid | 7.320 | 40.9% |
| Summon Necro | 7.445 | 70.9% |
| Holy Bolt | 14.300 | 65.3% |
| Zeal | 11.720 | 56.5% |
| Cold Sorceress | 10.080 | 58.6% |
| Fire Sorceress | 13.860 | 87.9% |
| Double Throw (earlier packet) | 10.980 | 55.7% |

Direct damage may include overkill; periodic damage lacks source attribution;
Prayer can hide incoming damage in net life loss. Different earned acquisition
histories remain explicit. No direct source is unclassified. This baseline
predates [Duriel's restored chapter Frost Aura](p15-duriel-chapter-frost-aura.md)
and cannot establish acceptance of current source. Complete missing encounter
mechanics before selecting a universal stat buff.

## Evidence and retention

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-boss-cohort-screen-dgv98tt0`.
`native.json`, `native.journal.jsonl`, `readback.json` and `contribution.json`
retain exact attempts and populations; 123,410,083.468 logical combat ms.

- Frozen plan SHA-256: `68bcdaa38d8a75da740d454d2f5732380743b211f638528cf0c2dfb4363cc9fd`.
- Baseline runtime tree: `441be64f42573072076f7acb4ba5929c22609d80f0da407a893e67835aadb8e1`.
- Native result SHA-256: `9a7c6e35b1bfdece56937eb194b09c4df8505525c62f83f06f95ef9c04855f32`.

Readback reconciled 2,248 stable production inputs/eight helper contracts without
new combat. `cleanup.json` verifies exact PIDs 15321/15322 and owned cache absent,
server closed, zero remaining disposables/failures. Root retains the exact
93,409,859-byte packet through unfinished full-v1 acceptance, then removes it
after all consumers finish. No broad suite, campaign replay, CI or new agent.
