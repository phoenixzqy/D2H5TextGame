# BUG-067 — Align Skeleton Mastery details with fresh summon bonuses

- **Status:** Open; source discrepancy reproduced, reviewed UI execution pending.
- **Severity:** Medium — misleading skill description and legacy/alias rank display.
- **Owner / affected systems:** frontend-dev, writer, qa-engineer; skill detail, bilingual copy and passive spec row.
- **Build:** runtime `7740f2e`; UI source unchanged through `6036d3a` and Stage C.
- **Environment:** Linux source inspection; planned Vitest/jsdom UI reproduction. No browser viewport measured yet.
- **Locales:** zh-CN and en.
- **Seed:** Not applicable to static copy; seed7 planned for recording-preservation control.

## Reproduction

1. Read authored `skills-necromancer-skeleton-mastery` and its immutable helper:
   unlock1, cap20, summonLifePct .04, summonAttackPct .02, summonDefensePct .01.
2. Compare the Skeleton Mastery entries in both skills.json locales: each merely
   says it increases skeleton power. The passive row in skills-spec.md instead
   names obsolete `necromancer.summon_mastery` and promises fixed +50% HP/damage.
3. Inspect SkillsScreen: no exact Skeleton Mastery allocation resolver override
   and no authored-description branch exists. Generic aliases and legacy skills
   fallback can display an unallocated or order-dependent rank.
4. Run the independently reviewed bilingual UI test against unchanged production
   before patching; retain actual failures and controls separately from this
   source-only reproduction. No unexecuted result is claimed here.

## Expected and actual

[D05](../../docs/plans/decisions/D05-skeleton-mastery-v1.md) controls newly created
player-owned skeleton warriors/mages: +4% maximum life, +2% Attack and +1% ordinary
Defense per allocated rank, cap20 totals +80%/+40%/+20%, unlock1. Current/next
values must use the maximum valid exact allocated alias once; legacy skills alone
grant no rank. Existing summons must not be promised a retrofit or refill.
Runtime/native behavior already follows this contract. Static spec and generic
UI prose/rank resolution disagree with it. This is not evidence of a new combat,
save or balance defect.

## Evidence and correction

[Skeleton evidence](../../docs/plans/evidence/p07a05-skeleton-mastery.md).
Root-owned RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-skeleton-mastery-wy4010oo`.
Frozen reviewed UI/copy drafts are listed in stage-d-draft-freeze.json. Preserve
actual RED reports, hard-failure limits and unchanged-production hashes. Use the
existing immutable definition/resolver, replace both locale descriptions and
reconcile only the obsolete Skeleton Mastery row. Preserve the name 支配骷髅.

## Workaround

Consult D05; actual allocated Mastery is already applied at summon creation.
Source/UI and production-browser acceptance remain pending validation.
