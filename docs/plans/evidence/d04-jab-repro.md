# D04 — Native Jab repeated-attack reproduction

Status: reproduced, not implemented or credited. Root sole writer. The separate
Impale source stayed frozen through its passing final full suite.

Source: `fixtures/impale/raw.tar.gz` members `scratch/jab-native-repro.ts`,
`scratch/jab-native-observed.json`, `scratch/next-jab-repro.json/.log` and
`scratch/next-jab-source-audit.json`. The archive is member-hash verified; task scratch was removed after all
consumers finished under the exact [cleanup receipt](fixtures/impale/cleanup.json).

Node24.21.0/Vite Node/default registry/real native Amazon. Fixed seeds7/19/41/97,
rank1/2/20, one1700ms cast,5MP, actual single-target Physical damage. Synthetic
L30/resources/holds/opponent, not earned play. Inputs remain immutable and each
recording replays exactly. Source hashes match the final frozen Impale snapshot;
the Jab JSON row itself matches historical HEAD2d7cc6ce. All reproduced
source bytes now match actual committed1d1eca0f blobs.

| Rank | Seed7 | Seed19 | Seed41 | Seed97 | Actual attempts per cast |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 30 | 35 | 0 miss | 33 | 1 |
| 2 | 33 | 38 | 0 miss | 36 | 1 |
| 20 | 87 | 92 | 0 miss | 90 | 1 |

Every final target HP is2000 minus the displayed sole attempt; hero MP95.
Terminal1 is the intended assertion that Jab's existing multiple-hit promise
must make more than one real attempt. The reproducer does not assert a new
numeric count. Registered damage contains only the ordinary Physical30–45,
+3/rank and tags, no sequence metadata. Both zh-CN/en promise repeated hits.

[BUG203](../../../production/bugs/BUG-203-jab-missing-repeated-attacks.md) and
[contract](../decisions/D04-jab-v1.md) separate observation from the proposed
three-attempt v1 adaptation. No new runtime, tuning, individual functionality
credit or genuine campaign progress. Full all-class/build/balance acceptance
remains open.
