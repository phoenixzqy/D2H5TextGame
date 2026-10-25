# D04 — Freezing Arrow missing secondary Freeze

2026-10-25. BUG201 reproduced against the frozen Conversion verification
runtime. Root is sole writer. No Freezing Arrow implementation, new tuning or
mechanic credit; independent design/QA and earned acceptance remain open.

[Bug](../../../production/bugs/BUG-201-freezing-arrow-unreachable-freeze.md).
[Raw scripts/result](fixtures/conversion/raw.tar.gz), original fixture failure,
corrected structural RED and source hashes are retained in the Conversion
packet under `scratch/`. The [committed source audit](fixtures/conversion/committed-source-audit.json)
confirms actual blobs at `f93a4e23` match those reproduction hashes.

`freezing-arrow-native-repro-observed.ts` runs through Vite Node with the real
`playerToCombatUnit`, complete authored native prerequisite chain, default
registry and `runBattleRecorded`. Constructed L30/HP2000/MP100, attack timing,
hold statuses and enemy stats are synthetic. Each case verifies immutable inputs
and complete exact replay. No earned campaign state is loaded or advanced.

| Rank | Seed | Actual Cold HP loss | Actual statuses | Final MP |
| --- | --- | --- | --- | --- |
|1|7|51|Chill|80|
|1|19|56|Chill|80|
|1|41|0; dodged|none|80|
|1|97|54|Chill|80|
|20|7|146|Chill|80|
|20|19|151|Chill|80|
|20|41|0; dodged|none|80|
|20|97|149|Chill|80|

All casts execute at1700ms and pay20MP. JSON declares `[chill,freeze]`; the real
registered damage payload represents only `[chill]`. The final assertion that
every declared status has a reachable effect fails after recording all eight
cases. This structural mismatch proves Freeze cannot proc; the sample does not
establish or assume a specific intended chance.

The original `freezing-arrow-native-repro.ts` incorrectly asserted positive
damage for every selected seed. Normal hit chance still permits seed41 misses;
that attempt exits1 before producing its report. The original source/receipt/
stack remain. The corrected diagnostic records every actual hit/miss, requires
at least one positive hit and keeps the missing-Freeze assertion unchanged;
its terminal1 is the actual mechanic RED. No production/test-discovery source
was edited to obtain either result.

The existing adapter preserves a secondary Freeze only with explicit metadata.
Freezing Arrow lacks it. Its authored `box-3x3` shape also contradicts current
"cone" copy. A future contract must choose explicit secondary probability and
duration and preserve real targeting/expiry/resource/authority behavior; simply
changing the description to omit freezing would shrink the advertised mechanic.
No fix or functionality credit is claimed here. C2–C4/fullG0–G7 and private v1
remain unfinished; local only, no remote action or genuine campaign action.
