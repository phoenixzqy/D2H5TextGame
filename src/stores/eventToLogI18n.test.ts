/**
 * Tests for the i18n-aware combat-event → log-entry conversion.
 *
 * Bonus i18n cleanup (fix/combat-map-screen-bugs branch) — skill ids
 * emitted by the engine (`barbarian.bash`, `necromancer.skeleton-mastery`,
 * …) must be rendered as their localized human-readable names in the
 * combat log, never as the raw dotted id.
 */
import { describe, it, expect } from 'vitest';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import type { BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';
import i18n from '@/i18n';
import { skills } from '@/data';
import { aliasToCanonical } from '@/engine/skills/aliases';

describe.each(['en', 'zh-CN'])('finite Corpse Explosion feedback in %s', locale => {
  it.each([0, 1, 3])('renders remaining count%s with literal localized copy', async count => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const english = locale === 'en';
      const remaining = String(count);
      for (const [messageKey, message] of [
        ['combat:corpses.available', english
          ? `A fallen enemy leaves a corpse. Available: ${remaining}.`
          : `敌人倒下，留下一具尸体。可用尸体：${remaining}。`],
        ['combat:corpses.consumed', english
          ? `Corpse Explosion consumes a corpse. Remaining: ${remaining}.`
          : `尸体爆炸消耗一具尸体。剩余尸体：${remaining}。`]
      ] as const) {
        expect(i18n.exists(messageKey), messageKey).toBe(true);
        expect(eventToLocalizedLogEntry({ kind: 'message', messageKey, params: { count } }))
          .toEqual({ type: 'system', actorId: 'system', actorName: english ? 'System' : '系统', message });
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
});

it('changes corpse feedback language for newly rendered events without retaining the old locale', async () => {
  const previous = i18n.language;
  try {
    const event: BattleEvent = { kind: 'message', messageKey: 'combat:corpses.consumed', params: { count: 0 } };
    const messages: (string | undefined)[] = [];
    for (const locale of ['en', 'zh-CN', 'en']) {
      await i18n.changeLanguage(locale);
      messages.push(eventToLocalizedLogEntry(event)?.message);
    }
    expect(messages).toEqual([
      'Corpse Explosion consumes a corpse. Remaining: 0.',
      '尸体爆炸消耗一具尸体。剩余尸体：0。',
      'Corpse Explosion consumes a corpse. Remaining: 0.'
    ]);
  } finally {
    await i18n.changeLanguage(previous);
  }
});

describe.each(['en', 'zh-CN'])('finite Poison Explosion feedback in %s', locale => {
  it.each([0, 1, 3])('renders remaining count%s through the actual log renderer', async count => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const english = locale === 'en';
      expect(eventToLocalizedLogEntry({
        kind: 'message', messageKey: 'combat:corpses.consumedPoison', params: { count }
      })).toEqual({
        type: 'system', actorId: 'system', actorName: english ? 'System' : '系统',
        message: english
          ? `Poison Explosion consumes a corpse. Remaining: ${String(count)}.`
          : `尸体剧毒爆破消耗一具尸体。剩余尸体：${String(count)}。`
      });
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
});

it('renders the same Poison Explosion event in en then zh-CN then en', async () => {
  const previous = i18n.language;
  try {
    const event: BattleEvent = { kind: 'message', messageKey: 'combat:corpses.consumedPoison', params: { count: 0 } };
    const messages: (string | undefined)[] = [];
    for (const locale of ['en', 'zh-CN', 'en']) {
      await i18n.changeLanguage(locale);
      messages.push(eventToLocalizedLogEntry(event)?.message);
    }
    expect(messages).toEqual([
      'Poison Explosion consumes a corpse. Remaining: 0.',
      '尸体剧毒爆破消耗一具尸体。剩余尸体：0。',
      'Poison Explosion consumes a corpse. Remaining: 0.'
    ]);
  } finally {
    await i18n.changeLanguage(previous);
  }
});

describe.each(['en', 'zh-CN'])('Rogue Inner Sight status feedback %s', locale => {
  it('localizes the exact mercenary status and effect label with literal copy oracles', async () => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const english = locale === 'en';
      const names = new Map([['rogue', english ? 'Rogue Scout — Inner Sight' : '罗格侦察兵 — 内视'], ['enemy', 'Target']]);
      expect(eventToLocalizedLogEntry({ kind: 'status', target: 'enemy', statusId: 'merc-inner-sight' }, names))
        .toEqual({ type: 'debuff', actorId: 'enemy', actorName: 'Target',
          message: english ? 'Target is afflicted with [Inner Sight].' : 'Target 进入【心眼】状态。' });
      expect(i18n.t('combat:effect.status.merc-inner-sight')).toBe(english ? 'Inner Sight' : '心眼');
      expect(eventToLocalizedLogEntry({ kind: 'action', actor: 'rogue', skillId: 'mskill-inner-sight' }, names)?.message)
        .toBe(english ? 'Rogue Scout — Inner Sight casts Inner Sight.' : '罗格侦察兵 — 内视 施放了 心眼。');
      for (const statusId of ['inner-sight', 'inner_sight', 'fixture-unknown-status']) {
        expect(eventToLocalizedLogEntry({ kind: 'status', target: 'enemy', statusId }, names)?.message)
          .toBe(english ? `Target is afflicted with [${statusId}].` : `Target 进入【${statusId}】状态。`);
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
});

const statusNames = [
  ['merc-inner-sight', 'Inner Sight', '心眼'], ['chill', 'Chill', '冰冷'],
  ['freeze', 'Freeze', '冻结'], ['paralyze', 'Paralyze', '麻痹'], ['stun', 'Stun', '眩晕'],
  ['ignite', 'Ignite', '点燃'], ['burn', 'Burn', '燃烧'], ['poison', 'Poison', '中毒'],
  ['plague', 'Plague', '瘟疫'], ['bleed', 'Bleed', '流血'], ['amplify', 'Amplify', '伤害加深'],
  ['amplify-damage', 'Amplify', '伤害加深'], ['decrepify', 'Decrepify', '衰老'],
  ['dim-vision', 'Dim Vision', '微暗灵视'], ['weaken', 'Weaken', '削弱'],
  ['iron-maiden', 'Iron Maiden', '攻击反噬'], ['terror', 'Terror', '恐惧'],
  ['confuse', 'Confuse', '迷乱'], ['life-tap', 'Life Tap', '偷取生命'],
  ['attract', 'Attract', '吸引'], ['lower-resist', 'Lower Resist', '降低抵抗'],
  ['mana-burn', 'Mana Burn', '法力燃烧']
] as const;

describe.each(['en', 'zh-CN'])('shared status log names in %s', locale => {
  it.each(statusNames)('renders known %s with literal localized copy', async (statusId, en, zh) => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      expect(eventToLocalizedLogEntry({ kind: 'status', target: 'enemy', statusId }, new Map([['enemy', 'Target']])))
        .toEqual({ type: 'debuff', actorId: 'enemy', actorName: 'Target',
          message: locale === 'en' ? `Target is afflicted with [${en}].` : `Target 进入【${zh}】状态。` });
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
  it.each(['fixture-unknown-status', 'inner-sight', 'inner_sight', 'fixture.status', 'fixture/status', 'fixture:status'])(
    'retains exact unknown ID%s as fallback', async statusId => {
      const previous = i18n.language;
      try {
        await i18n.changeLanguage(locale);
        expect(eventToLocalizedLogEntry({ kind: 'status', target: 'enemy', statusId }, new Map([['enemy', 'Target']]))?.message)
          .toBe(locale === 'en' ? `Target is afflicted with [${statusId}].` : `Target 进入【${statusId}】状态。`);
      } finally {
        await i18n.changeLanguage(previous);
      }
    });
});

it('renders known status names in en then zh-CN then en without cached text', async () => {
  const previous = i18n.language;
  try {
    const event: BattleEvent = { kind: 'status', target: 'enemy', statusId: 'poison' };
    const messages: (string | undefined)[] = [];
    for (const locale of ['en', 'zh-CN', 'en']) {
      await i18n.changeLanguage(locale);
      messages.push(eventToLocalizedLogEntry(event, new Map([['enemy', 'Target']]))?.message);
    }
    expect(messages).toEqual([
      'Target is afflicted with [Poison].', 'Target 进入【中毒】状态。', 'Target is afflicted with [Poison].'
    ]);
  } finally {
    await i18n.changeLanguage(previous);
  }
});

describe('silent authoritative mana events', () => {
  it.each(['zh-CN', 'en'])('does not invent a visible %s resource log entry', async locale => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      for (const reason of ['cast', 'regeneration', 'summon-refund', 'orb'] as const) {
        expect(eventToLocalizedLogEntry({ kind: 'mana', target: 'hero', mana: 0, reason })).toBeNull();
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
});

describe('eventToLocalizedLogEntry — skill-name i18n', () => {
  it('translates a known skill id to its localized name (zh-CN default)', () => {
    const event: BattleEvent = {
      kind: 'action',
      actor: 'player-001',
      skillId: 'barbarian.bash'
    };
    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', 'Astaroth']]));
    expect(entry).not.toBeNull();
    expect(entry?.message).toBeTruthy();
    // Must include the localized name (重击) and must NOT include the raw id.
    expect(entry?.message).toContain('重击');
    expect(entry?.message).not.toMatch(/\bbarbarian\.bash\b/);
  });

  it('falls back to the raw id when the translation is missing', () => {
    const event: BattleEvent = {
      kind: 'action',
      actor: 'player-001',
      skillId: 'definitely.not-a-real-skill'
    };
    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', 'A']]));
    expect(entry?.message).toContain('definitely.not-a-real-skill');
  });

  it('localizes summon names in visible summon log lines', () => {
    const stats: DerivedStats = {
      life: 1,
      lifeMax: 1,
      mana: 0,
      manaMax: 0,
      attack: 1,
      defense: 0, magicResist: 0,
      attackSpeed: 1,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    };
    const unit: CombatUnit = {
      id: 'player-summon-skeleton-1',
      name: 'Skeleton Warrior',
      side: 'player',
      level: 1,
      tier: 'trash',
      stats,
      life: 1,
      mana: 0,
      statuses: [],
      cooldowns: {},
      skillOrder: [],
      activeBuffIds: [],
      enraged: false,
      kind: 'summon',
      summonOwnerId: 'player-001',
      summonTemplateId: 'skeleton'
    };
    const event: BattleEvent = {
      kind: 'summon',
      owner: 'player-001',
      summonId: 'skeleton',
      unit
    };

    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', '死灵法师']]));
    expect(entry?.message).toContain('骷髅战士');
    expect(entry?.message).not.toContain('Skeleton Warrior');
  });

  it('localizes Necromancer mage and revive summon names in visible summon log lines', () => {
    const stats: DerivedStats = {
      life: 1,
      lifeMax: 1,
      mana: 0,
      manaMax: 0,
      attack: 1,
      defense: 0, magicResist: 0,
      attackSpeed: 1,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    };
    const makeSummon = (summonTemplateId: 'skeletal_mage' | 'revived', name: string): CombatUnit => ({
      id: `player-summon-${summonTemplateId}-1`,
      name,
      side: 'player',
      level: 1,
      tier: 'trash',
      stats,
      life: 1,
      mana: 0,
      statuses: [],
      cooldowns: {},
      skillOrder: [],
      activeBuffIds: [],
      enraged: false,
      kind: 'summon',
      summonOwnerId: 'player-001',
      summonTemplateId
    });

    const mageEntry = eventToLocalizedLogEntry({
      kind: 'summon',
      owner: 'player-001',
      summonId: 'skeletal_mage',
      unit: makeSummon('skeletal_mage', 'Skeletal Mage')
    }, new Map([['player-001', '死灵法师']]));
    const revivedEntry = eventToLocalizedLogEntry({
      kind: 'summon',
      owner: 'player-001',
      summonId: 'revived',
      unit: makeSummon('revived', 'Revived Minion')
    }, new Map([['player-001', '死灵法师']]));

    expect(mageEntry?.message).toContain('骷髅法师');
    expect(mageEntry?.message).not.toContain('Skeletal Mage');
    expect(revivedEntry?.message).toContain('复生仆从');
    expect(revivedEntry?.message).not.toContain('Revived Minion');
  });
});


// Literal copy oracles are independent of the production name resolver.
const castNameCases = [
  ['skills-sorceress-fire-bolt', 'sorceress.fire_bolt', 'Fire Bolt', '火弹'],
  ['skills-necromancer-raise-skeleton', 'necromancer.raise_skeleton', 'Raise Skeleton', '召唤骷髅'],
  ['skills-necromancer-amplify-damage', 'necromancer.amplify_damage', 'Amplify Damage', '加强伤害'],
  ['skills-barbarian-double-swing', 'barbarian.double_swing', 'Double Swing', '双手挥击'],
  ['skills-amazon-magic-arrow', 'amazon.magic_arrow', 'Magic Arrow', '魔法箭'],
  ['skills-paladin-holy-fire', 'paladin.holy_fire', 'Holy Fire', '神圣之火'],
  ['skills-druid-summon-dire-wolf', 'druid.summon_dire_wolf', 'Summon Dire Wolf', '召唤恶狼'],
  ['skills-assassin-shock-web', 'assassin.shock_web', 'Shock Web', '电击网'],
  ['monster-weak-melee', 'monster.weak_melee', 'Weak Melee', '弱近战'],
  ['monster-fire-bolt', 'monster.fire_bolt', 'Fire Bolt', '火弹'],
  ['mskill-fire-ball', 'mskill-fire-ball', 'Fire Ball', '火球术'],
  ['mskill-inner-sight', 'mskill-inner-sight', 'Inner Sight', '心眼'],
  ['mskill-minor-heal', 'mskill-minor-heal', 'Minor Heal', '小型治疗'],
  ['aura-might', 'aura-might', 'Might Aura', '力量光环']
] as const;

describe.each(['en', 'zh-CN'])('authored cast names in %s', locale => {
  it.each(castNameCases)('renders authored %s and engine %s using literal copy', async (authored, canonical, en, zh) => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const name = locale === 'en' ? en : zh;
      const message = locale === 'en' ? `Hero casts ${name}.` : `Hero 施放了 ${name}。`;
      for (const skillId of new Set([authored, canonical])) {
        const entry = eventToLocalizedLogEntry({ kind: 'action', actor: 'hero', skillId }, new Map([['hero', 'Hero']]));
        expect(entry, skillId).toEqual({ type: 'skill', actorId: 'hero', actorName: 'Hero', message });
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });

  it('retains direct-key compatibility, exact unknown IDs and basic actions', async () => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const map = new Map([['hero', 'Hero']]);
      const messageFor = (skillId: string | null) => eventToLocalizedLogEntry({ kind: 'action', actor: 'hero', skillId }, map)?.message;
      expect(messageFor('sorceress.fire-bolt')).toBe(locale === 'en' ? 'Hero casts Fire Bolt.' : 'Hero 施放了 火弹。');
      expect(messageFor('barbarian.bash')).toBe(locale === 'en' ? 'Hero casts Bash.' : 'Hero 施放了 重击。');
      for (const id of ['unknown.some-skill', 'unknown/skill-name']) {
        expect(messageFor(id)).toBe(locale === 'en' ? `Hero casts ${id}.` : `Hero 施放了 ${id}。`);
      }
      for (const id of [null, '']) {
        expect(messageFor(id)).toBe(locale === 'en' ? 'Hero readies an attack.' : 'Hero 准备出招。');
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });

  it('supports the complete authored name corpus and normalized aliases', async () => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      expect(skills).toHaveLength(283);
      for (const skill of skills) {
        const key = skill.name.replace(/^skills\./, 'skills:');
        expect(i18n.exists(key), key).toBe(true);
        const name = i18n.t(key);
        const message = locale === 'en' ? `hero casts ${name}.` : `hero 施放了 ${name}。`;
        for (const skillId of new Set([skill.id, aliasToCanonical(skill.id) ?? skill.id])) {
          expect(eventToLocalizedLogEntry({ kind: 'action', actor: 'hero', skillId })?.message, skillId).toBe(message);
        }
      }
    } finally {
      await i18n.changeLanguage(previous);
    }
  });
});

it('translates new events after en → zh-CN → en locale changes', async () => {
  const previous = i18n.language;
  try {
    const event: BattleEvent = { kind: 'action', actor: 'Hero', skillId: 'sorceress.fire_bolt' };
    const messages: (string | undefined)[] = [];
    for (const locale of ['en', 'zh-CN', 'en']) {
      await i18n.changeLanguage(locale);
      messages.push(eventToLocalizedLogEntry(event)?.message);
    }
    expect(messages).toEqual(['Hero casts Fire Bolt.', 'Hero 施放了 火弹。', 'Hero casts Fire Bolt.']);
  } finally {
    await i18n.changeLanguage(previous);
  }
});
