import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import type { CombatUnit } from '@/engine/combat/types';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';

const COMMAND = 'barbarian.battle_command', CONTROL = 'fixture.inert-grant-command';
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); resetRegistry(); loadDefaultSkills();
  registerSkill({ id: CONTROL, archetype: 'fixture', target: 'self', minLevel: 1,
    manaCost: 11, cooldown: 4, isBuff: true,
    effects: [{ kind: 'buff', id: CONTROL, duration: 60 }] });
});
afterEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });

const cases = [
  { word: 'leaf', base: 'weapon-staff', slot: 'weapon', id: 'sorceress.fire_bolt', rank: 3 },
  { word: 'hand-of-justice', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.blaze', rank: 5 },
  { word: 'death', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.chain_lightning', rank: 5 },
  { word: 'phoenix', base: 'sh-monarch', slot: 'offhand', id: 'item.redemption', rank: 1 }
] as const;

/** Native equipped authority; fixed diagnostic stats isolate paid rank-dependent potency. */
function fixed(unit: CombatUnit, speed: number): CombatUnit {
  const { battleCommandPassives, ...native } = unit;
  void battleCommandPassives;
  return { ...native, life: 500000, mana: 1000, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000000, manaMax: 1000, attack: 0, defense: 0, magicResist: 0,
      attackSpeed: speed, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
}

for (const owner of ['hero', 'merc'] as const) it.each(cases)(
  `paid Command respects native ${owner} $word authority and actual captured potency`, row => {
    const authored = socketRunewords.find(word => word.id === 'runewords/' + row.word);
    if (!authored) throw new Error('Missing canonical equipped grant');
    const item: Item = { id: 'synthetic-command-' + row.word, baseId: 'items/base/' + row.base,
      rarity: 'runeword', level: 70, identified: true, equipped: true, equipSlot: row.slot,
      runewordId: authored.id, socketCapacity: authored.sockets,
      socketContents: authored.runes.map(id => ({ kind: 'rune', id })) };
    const equipment = { [row.slot]: item };
    const player = { ...createMockPlayer('Synthetic equipped Command', 'barbarian'), id: 'hero', level: 70,
      coreStats: { strength: 300, dexterity: 300, vitality: 1000, energy: 100 },
      comboOrder: [COMMAND, ...(owner === 'hero' ? [row.id] : [])],
      skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1,
        'barbarian.battle_orders': 1, [COMMAND]: 1 } };
    const playerBefore = structuredClone(player);
    if (owner === 'hero') useInventoryStore.setState({ equipped: equipment });
    const hero = fixed(playerToCombatUnit(player), 100);
    const merc: Mercenary = { ...player, id: 'equipped-ally', type: 'mercenary', archetype: 'front',
      classId: 'rogue', rarity: 'R', signatureSkillId: row.id, comboOrder: [row.id] };
    const ally = fixed(mercToCombatUnit(merc, undefined, equipment), 50);
    const bearer = owner === 'hero' ? hero : ally;
    expect(bearer.governedActiveRanks?.[row.id]).toBe(row.rank);
    expect(bearer.skillOrder).toContain(row.id);
    expect(bearer.skillLevels ?? {}).not.toHaveProperty(row.id);
    const enemy: CombatUnit = { ...hero, id: 'tank', side: 'enemy', kind: 'monster', skillOrder: [],
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const input = { seed: 7, playerTeam: owner === 'hero' ? [hero] : [hero, ally], enemyTeam: [enemy] };
    const before = structuredClone(input), actual = runBattleRecorded(input);
    const control = runBattleRecorded({ ...input,
      playerTeam: input.playerTeam.map(unit => unit.id === hero.id
        ? { ...unit, skillOrder: unit.skillOrder.map(id => id === COMMAND ? CONTROL : id) } : unit) });
    expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(actual);
    const payment = actual.events.find(event => event.kind === 'mana' && event.reason === 'cast' && event.target === hero.id);
    expect(payment).toMatchObject({ mana: 989, simClockMs: 1700 });
    expect(control.events.find(event => event.kind === 'mana' && event.reason === 'cast' && event.target === hero.id))
      .toEqual(payment);
    const during = (at: number) => at >= 1700 && at < 9700;
    if (row.id === 'sorceress.blaze') {
      const paid = (out: typeof actual) => out.events.find(event => event.kind === 'status-state' &&
        event.target === bearer.id && during(event.simClockMs) && event.statuses.some(status => status.id === 'blaze'));
      const boosted = paid(actual), baseline = paid(control);
      expect(boosted?.kind === 'status-state' ? boosted.statuses.find(status => status.id === 'blaze')?.periodicSpell : undefined)
        .toEqual({ rank: 6 });
      expect(baseline?.kind === 'status-state' ? baseline.statuses.find(status => status.id === 'blaze')?.periodicSpell : undefined)
        .toEqual({ rank: 5 });
    } else if (row.id === 'item.redemption') {
      const healing = (out: typeof actual) => out.events.filter(event => event.kind === 'heal' &&
        event.target === bearer.id && during(event.simClockMs));
      expect(healing(actual).length).toBeGreaterThan(0);
      expect(healing(actual)).toEqual(healing(control));
    } else {
      const hit = (out: typeof actual) => out.events.find(event => event.kind === 'damage' &&
        event.source === bearer.id && !event.dodged && during(event.simClockMs));
      const boosted = hit(actual), baseline = hit(control);
      if (boosted?.kind !== 'damage' || baseline?.kind !== 'damage') throw new Error('Missing matched equipped hits');
      expect(boosted.simClockMs).toBe(baseline.simClockMs);
      expect(boosted.amount).toBeGreaterThan(baseline.amount);
    }
    useInventoryStore.setState({ equipped: {} });
    const removed = owner === 'hero' ? playerToCombatUnit(player) : mercToCombatUnit(merc);
    expect(removed.governedActiveRanks[row.id]).toBe(0);
    expect(removed.skillOrder).not.toContain(row.id);
    expect(player).toEqual(playerBefore);
  });
