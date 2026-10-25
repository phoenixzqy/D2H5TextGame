# BUG-209 — Blade Fury targets a line instead of its promised cone

- Status: fixed and verified locally; independent design/QA and earned balance open.
- Severity: Medium — paid area targeting differs from the advertised shape.
- Environment: Node24.21.0, real default registry/native L30 Assassin; pure
  engine reproduction, no browser viewport. Both en/zh-CN descriptions promise
  a cone. Historical HEAD3f73a53f plus the frozen Dragon Claw patch; Blade Fury's
  own authored row is unchanged.
- Affected systems: skill data/schema, combat targeting and Skills presentation.
- Owner: root; independent design/QA and earned balance remain open.

## Reproduction

1. Learn actual Blade Sentinel prerequisite and Blade Fury ranks1/2/20;
   select only Blade Fury through native playerToCombatUnit.
2. Put nine held2000HP enemies on an explicit3×3 row-major grid. Supply
   synthetic resources and hold the caster after one paid action.
3. Run seeds7/19/41/97, checking immutable exact replay, one action/15MP
   payment and real final-HP conservation.
4. Compare actual occupied target coordinates with the advertised cone.

Expected: the attack covers a cone, as skills-spec.md and both locales promise.
Numeric dimensions are unspecified; record an explicit faithful adaptation
before implementation rather than relabeling a line.

Actual: all12cases register `aoeShape:"line-3"` and target IDs0,1,2, the first
horizontal row. Seed7 ranks1/2/20 remove136/148/364HP; mana100→85. There is no
periodic HP loss. The final intended diagnostic assertion exits1 after all
cases are retained. Existing multiple-enemy hits do not establish cone geometry.

Root cause: the actual Blade Fury JSON authors line-3. English says “Hurls a
flurry of blades in a cone, striking multiple enemies.” Chinese says
“锥形射出连续刀刃，命中多个敌人。” The design table also says Cone.
The shared cone preset exists, but its schema ownership currently belongs to
Fire Blast only. A repair must retain Blade Fury's Physical identity and must
not copy Fire Blast's Fire/Burn contract or add Dragon Claw's critical bonus.

See [native evidence](../../docs/plans/evidence/d04-blade-fury-cone-repro.md).
The initial reproduction included no source patch, functionality credit,
genuine campaign or remote action. Its observations remain historical.

## Local repair continuation

Commit `feb5c6f8` authors the real Physical cone with separate closed-schema
identity and truthful bilingual rank presentation. Native12cases,47new regressions,
full14777/661/two existing skips, types/lint/build and four production public
cases pass. See [verification](../../docs/plans/evidence/d04-blade-fury-cone.md).
Independent/earned acceptance and full v1 remain open.
