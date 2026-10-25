# D04 — Native Dragon Talon repeated-kick reproduction

2026-10-25. Reproduced only; no implementation or functionality credit.
Root sole writer. Independent design/QA and earned balance remain open.

Retained in the Jab packet `fixtures/jab/raw.tar.gz`: `scratch/dragon-talon-native-repro.ts`,
`scratch/dragon-talon-native-observed.json`, the separate detailed script/result,
both `next-dragon-talon-*` command logs/terminal receipts and
`scratch/next-dragon-source-audit.json`. The second diagnostic adds explicit
one-action/one-payment and final-HP assertions; it does not overwrite the first.

Both intended terminal1 results fail only the multiplicity assertion, after
all12synthetic native cases settle. Node24.21.0/default registry, L30 Assassin,
ranks1/2/20, seeds7/19/41/97, one1700ms opportunity,4MP, held original target.
Inputs remain immutable and recordings replay exactly. No browser, campaign,
earned gear or whole-game balance claim follows from these fixtures.

| Rank | Seed7 | Seed19 | Seed41 | Seed97 | Attempts per paid cast |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 41 | 46 | 0 miss | 44 | 1 |
| 2 | 45 | 50 | 0 miss | 48 | 1 |
| 20 | 117 | 122 | 0 miss | 120 | 1 |

Every target HP is2000 minus its sole attempt and every hero MP is96. The
actual registered Physical40–60/+4rank effect has no sequence metadata. Both
locales promise a series of kicks but do not establish a numeric count.

Source remains the exact1376source/test/config plus two Jab design and760build
snapshot used by Jab verification, with HEAD853796d7 before the pending local
Jab commits. Exact native reproduction and later committed-source audit are
distinct evidence; the whole uncommitted snapshot is not claimed equal to that
historical HEAD. The actual Assassin JSON is unchanged by the Jab fix.
The later actual committed-blob audit matches all reproduced source bytes at
`e99ad3b3`; its raw result is `scratch/committed-source-audit.json`.

[BUG204](../../../production/bugs/BUG-204-dragon-talon-missing-repeated-kicks.md)
records the defect before any patch. The [contract](../decisions/D04-dragon-talon-v1.md)
separates the proposed three-attempt v1 adaptation from observed behavior.
