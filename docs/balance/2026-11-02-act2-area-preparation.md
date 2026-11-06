# Act II authored-level preparation — native Bow diagnostic

Status: controller implemented and locally checked; native route fails. No balance,
population or pacing acceptance. Full private v1 remains unfinished.

The previous minimal route prepared only the act-entry level. The new
`area-prepared-act2-v1` policy visits all six authored Act II areas at entry
levels 14/16/18/21/23/25, earning missing XP in cleared areas. A training loss
falls back to cleared Dark Wood; a route loss stops. Shared limits remain
600 training admissions, 200 per target area, 3 consecutive/10 total training
nonwins. This diagnostic branches from an authenticated before-Sisters-Claim
checkpoint, not the exhausted historical Arcane branch; those failures and
budgets remain intact.

The 13 controller regressions and 33 affected dispatch/recovery assertions pass,
as do scoped strict types and lint. The external native driver also passes strict
types. No production formula, item data or player default changed.

## Native result

From level 12 / Normal ordinal 107, the hero natively claims Sisters, earns
level 14 with 36 Den wins, and clears Rocky Waste. Nineteen further training
admissions (one Rocky Waste loss, then Dark Wood fallback) earn level 16.
Dry Hills wins three waves and loses wave 4. The controller stops correctly.

Across 57 admissions: 241 waves, 239 wave victories, 2 defeats, 256,510 XP,
2,476 acquired and 2,436 normally salvaged items. Combat time is
1,874,675.5863876268 ms (~31.24 simulated minutes); native execution completes
in under a minute. Terminal level 16 / next Normal ordinal 164 is retained.
This does not establish 30–50 active-hour pacing.

Dry Hills hero life at successive entries is 335, 332, 285, 29. Wave 3 records
218 lightning and 88 cold direct damage; wave 4 kills the remaining hero.
Lightning/cold resistance is 15/35. Neither failed wave has zero mana.
Correcting area-entry levels alone therefore does not establish route viability.
No combat-formula defect follows from this single branch.

## Owned defense and exhausted retries

The declared owned-defense pass uses the existing general Act II threat probes
and preserves Attack105, speed185 and manaMax201. One native hero helmet change
raises lifeMax335→344 and lightning15→16, while cold35→31. The proxy expected
incoming damage/life improves4.3173%; this is not combat acceptance. The first
mercenary helmet retrieval is refused because the backpack is full. Ordinary
capacity recovery then salvages19normal items for19scrap, allowing the selected
owned merc helmet to be retrieved/equipped.

The original ordinal163 loss remains attempt1. The only two remaining native
admissions,164 and165, both win waves1–2 and lose ordinary trash wave3. Across
these retries:4winning waves,2defeats,10,880XP,27acquired items,50,576combat ms;
terminal L16/next Normal166. All three attempts are exhausted. Do not extend
this branch or the separate exhausted historical Arcane branch.

Both failed waves contain18/19 level18 enemies:10Sand Raiders and8/9Horror
Mages. Hero entry life is288/285; direct incoming lightning303/234 and cold51/42
outweigh physical6/3. Minimum observed mana177/168 rules out starvation here.
Recorded outgoing damage includes9non-dodged hits totaling7,848 in ordinal164;
no inadequate damage coefficient or combat-formula defect is established.
The greedy4DEX/1VIT volley-only policy omits native projectile defense. Inspect
and declare a separate defensively prepared build before any fresh trial;
never fit coefficients or select seeds against these exhausted observations.

The no-combat preparation driver captured valid native state but failed a
custody assertion that incorrectly compared legitimate equipped flags. Its
independent v3reader verifies intrinsic custody, exact equipment mirrors, all
24candidate decisions and native domains without rerunning the action. The
first reader's omitted mirror assertion failure remains retained. The retry
launcher and independent v2reader both exit0; the latter reconciles the actual
request.inputs structure, original loss, all native seeds/ordinals/clock,
XP/items/material/currency custody and exact journal/snapshot/export identity.
No combat was replayed for either independent readback.

## Evidence and custody

Required packet (root owns retention through umbrella review):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- Frozen policy: `p15-bow-act2-area-v1-plan.json`, SHA256
  `7d8d2063c07da292930c25054c2e22dff638f3ade975c67c2be5416f3d259ee1`.
- Native report: `p15-bow-act2-area-v1.json`, SHA256
  `6f95070c7b85d4033ac060dc4ddf44aa761226f71b1a8039be0d387927ccaa95`.
- Journal: `p15-bow-act2-area-v1.journal.jsonl.gz`, SHA256
  `90fe92f5e1e73e7d2cb9f895a8a155871dc6b52a3c200f16d77df247c6072aec`.
- Native export: `p15-bow-act2-area-v1.native-export.json`, SHA256
  `9f1d2433d48d931ea42e8d9cca40f2a848feb82833c17ed0a2c41bbd6ee671e4`.
- Independent reader/result: `p15-bow-act2-area-v1-readback-v2.py` and
  `p15-bow-act2-area-v1-readback.json`. Parent journal checkpoint, frozen source
  bytes, native timestamp seeds, advancing ordinals, waves, actual XP/item/
  currency/material conservation and exact export identity pass without combat
  replay. The first reader's omitted-versus-false claim assertion failure is
  retained; v2 checks the actual unclaimed condition correctly.
- Authority65: `p15-campaign-harness-source-audit-v65.json`; 2,141 production
  inputs and 106 campaign inputs. Source tree
  `c5765e7425aaa2028bb5df6e0678df6e3ddee4b766c11683352abb174c62c7ec`,
  unchanged data hash
  `f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`.
  Only `vitest.campaign.workspace.ts` differs from authority64's production set.
- Scoped checks: `p15-act2-area-preparation-green-v3`,
  `p15-act2-area-related-v1`, `p15-act2-area-types-v1`,
  `p15-act2-area-lint-v3`, and `p15-bow-act2-area-driver-types-v1`
  logs/exit records. Controller-test lint also passed.

- Owned-defense frozen plan: `p15-bow-act2-area-defense-v2-plan.json`, SHA256
  `d1d297faa90be383fca6aa063c45df51beef3a5957ec9eea689180eb90b63e84`.
  Report/journal/export: `p15-bow-act2-area-defense-v2*`; independent verification:
  `p15-bow-act2-area-defense-v2-readback-v3.py/.json`.
- Frozen retry plan: `p15-bow-dry-hills-retry-v2-plan.json`, SHA256
  `d59eaceba18280fdfe5d0ee2d6eefa238007767b3a97352a04555f2f25d0c0b3`.
  Report SHA256 `9ad794fd721b06859b8cc684ece406cb960f5d730084ce818e095c9999757014`;
  export SHA256 `3759cd9a163a200f95a1fe4eed42ae0a4abd695565dc9a6b3e091180b1b24d01`.
  Independent reader/result: `p15-bow-dry-hills-retry-v2-readback-v2.py/.json`.
  Drivers, unexecuted drafts, frozen configurations, logs and original diagnostic
  failures remain required evidence; accepted balance cells remain0.

Drivers are terminal, exact Vite caches removed. Source/configuration, plans,
readers, logs, failed attempts, journal and native payload remain reproducibility
evidence; they are not disposable caches. No broad suite or campaign was replayed
for this documentation update. Canonical earned level72/Hell1043 stays intact.

## Superseding fresh-policy investigation

The [defensive Bow/BUG602 trial](2026-11-02-bow-survival-rotation.md) separately
reaches16/Dry Hills after clearing Rocky Waste. It retains all previous exhausted
branches and remains a failed paired diagnostic, not population acceptance.
[Owned defensive selection](../plans/decisions/P15-bow-owned-survival-v1.md) is the
next opt-in policy increment; no exhausted branch receives another admission.
