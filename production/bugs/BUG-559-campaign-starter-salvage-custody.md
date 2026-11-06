# BUG-559 — Audit legal starter salvage using custody at consumption

Status: Fixed locally, uncommitted. Severity: Medium (diagnostic audit failure; native gameplay continues).
Owner: root, campaign QA/accounting. Affected systems: campaign capacity/economy harness.

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus the recorded dirty
source/campaign manifests. Production source/data match BUG558; harness source
hash e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a.
Environment: Linux/WSL, Node/Vitest native services; no browser/viewport involved;
locale-independent accounting. Creation timestamp 1793690000000; production
generates all admission seeds (no override).

1. Run the frozen `javelin-earned-v1-pilot-1` Act II request from a fresh Amazon.
2. Equip an earned stronger training bow through the native inventory action.
3. Allow ordinary overflow salvage to consume the unequipped starter bow.
4. Audit initial ownership, actual journaled income/sinks and the terminal save.

Expected: exact item/material conservation accepts a legal unequipped normal
starter salvage, while rejecting equipped, socketed, unowned or altered targets.
Actual: `Protected campaign sink target`; `auditCampaignEconomy` protects every
initially equipped ID forever, although native capacity recovery protects items
equipped at consumption. The run separately ends with a genuine Den defeat at
level9/ordinal73; this audit defect does not explain or reverse that defeat.

Evidence: external packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`
contains `p15-javelin-earned-fresh-pilot-v1/amazon-javelin-poison2-impale1.json`,
its `.log` and `.json.journal.jsonl.gz`, and the frozen pilot policy. The material
request retains the starter's native preimage with `equipped:false`.

Root cause: the normal salvage receipt omits consumption-time item custody;
the auditor substitutes creation-time equipment flags. Caster salvage already
retains and checks consumed item payloads. Reduce with a native unequip → overflow
salvage regression; fix normal receipts to provide the same custody evidence.
No campaign replay is needed to reproduce or verify accounting.

Fix: normal salvage now retains consumption-time item payloads. The auditor
checks exact IDs, payloads, unequipped flags, normal rarity, empty sockets and
native material yields. Historical receipts without custody retain their old
protection rule. Native unequip/salvage and tampered-custody regressions pass in
`tests/campaign/actions.regression.test.ts`; the affected caster regression also
passes. Retained pilot readback checks174 actual economic records, including
all14 sinks:72620XP/1558earned items/1438consumed items reconcile exactly.
See external `bug559-retained-pilot-accounting-v1.json`. The original failed
technical receipt and all three combat defeats remain unchanged.
