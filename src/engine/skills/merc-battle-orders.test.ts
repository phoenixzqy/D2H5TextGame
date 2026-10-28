import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_BATTLE_ORDERS_DEFINITION, MERC_BATTLE_ORDERS_SKILL, resolveMercBattleOrders } from './merc-battle-orders';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-battle-orders');
  if (!row) throw new Error('Missing native Battle Orders');
  return structuredClone(row);
}
describe('authored native mercenary Battle Orders', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_BATTLE_ORDERS_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, lifePct: .30, manaPct: .30 });
    expect(MERC_BATTLE_ORDERS_SKILL).toMatchObject({ id: 'aura-battle-orders', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercBattleOrders: { lifePct: 12.5, manaPct: 30 } };
    const result = resolveMercBattleOrders([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, lifePct: .125, manaPct: .30 });
    expect(Object.isFrozen(row.mercBattleOrders)).toBe(false);
    row.mercBattleOrders.lifePct = 99;
    expect(result.definition.lifePct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercBattleOrders: { lifePct: 0, manaPct: 0 } })).toBe(true);
  });
  it.each([
    { mercBattleOrders: undefined }, { mercBattleOrders: {} }, { mercBattleOrders: { lifePct: 5 } }, { mercBattleOrders: { manaPct: 20 } }, { mercBattleOrders: { lifePct: -1, manaPct: 20 } }, { mercBattleOrders: { lifePct: 5, manaPct: -1 } },
    { mercBattleOrders: { lifePct: NaN, manaPct: 20 } }, { mercBattleOrders: { lifePct: 5, manaPct: Infinity } },
    { mercBattleOrders: { lifePct: '5', manaPct: 20 } }, { mercBattleOrders: { lifePct: 5, manaPct: 20, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'fire' }, { appliesStatus: ['stun'] }, { appliesTags: ['fire'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercBattleOrders([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercBattleOrders([])).toThrow(/exactly one/);
    expect(() => resolveMercBattleOrders([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
