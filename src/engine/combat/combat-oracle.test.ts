import { describe, expect, it } from 'vitest';
import { legacyBattleEvents, legacyRecordedEvents, legacyRecording } from '@/test/combat-oracle';

const corpse = { kind: 'message', messageKey: 'combat:corpses.available', params: { count: 1 } };
const status = { kind: 'status', target: 'enemy', statusId: 'poison' };
const unknown = { kind: 'future-gameplay', target: 'enemy', payload: [1, 2] };
const observation = { kind: 'status-state', target: 'enemy', statuses: [] };
const turn = { kind: 'turn-start', turn: 1, simClockMs: 0, uiDelayMs: 50 };
const action = { kind: 'action', actor: 'hero', skillId: null, simClockMs: 1700, uiDelayMs: 1200 };
const hit = { kind: 'damage', source: 'hero', target: 'enemy', amount: 7,
  damageType: 'physical', crit: false, dodged: false, simClockMs: 1700, uiDelayMs: 50 };
const events = [
  { ...observation, initial: true, simClockMs: 0, uiDelayMs: 200 }, turn,
  { ...observation, simClockMs: 500, uiDelayMs: 500 }, action, hit
];

describe('D04 historical oracle projection boundary', () => {
  it('removes only the exact new transport kind, keeping cues, corpse messages and unknown gameplay', () => {
    const near = { ...unknown, kind: 'status-state-future' };
    const source = Object.freeze([observation, status, corpse, unknown, near, observation]);
    const actual = legacyBattleEvents(source);
    expect(actual).toEqual([status, corpse, unknown, near]);
    expect(actual[0]).toBe(status); expect(actual[1]).toBe(corpse);
    expect(actual[2]).toBe(unknown); expect(actual[3]).toBe(near);
    expect(source).toHaveLength(6);
  });

  it('rederives only legacy UI hints while retaining exact gameplay payload, order and simulation clocks', () => {
    const before = structuredClone(events);
    const actual = legacyRecordedEvents(events);
    expect(actual).toEqual([{ ...turn, uiDelayMs: 200 }, { ...action, uiDelayMs: 1700 }, hit]);
    expect(events).toEqual(before);
    // Both timestamps and every gameplay field remain observable to historical expectations.
    const changed = legacyRecordedEvents(events.map(e => e.kind === 'damage' ? { ...e, amount: 8 } : e));
    expect(changed).not.toEqual(actual);
    const retimed = legacyRecordedEvents(events.map(e => ({ ...e, simClockMs: e.simClockMs + 1 })));
    expect(retimed).not.toEqual(actual);
    expect(legacyRecordedEvents([...events].reverse())).not.toEqual(actual);
  });

  it('keeps the old 200ms warmup and 50..3000ms clamps independently of transport-only boundaries', () => {
    const source = [
      { kind: 'a', simClockMs: 100, uiDelayMs: 999 },
      { ...observation, simClockMs: 100, uiDelayMs: 50 },
      { kind: 'b', simClockMs: 101, uiDelayMs: 999 },
      { ...observation, simClockMs: 1000, uiDelayMs: 899 },
      { kind: 'c', simClockMs: 8000, uiDelayMs: 3000 },
      { kind: 'd', simClockMs: 8000, uiDelayMs: 50 }
    ];
    expect(legacyRecordedEvents(source).map(e => [e.kind, e.simClockMs, e.uiDelayMs]))
      .toEqual([['a', 100, 200], ['b', 101, 50], ['c', 8000, 3000], ['d', 8000, 50]]);
  });

  it('projects both event arrays but preserves every non-event wrapper/result field and caller ownership', () => {
    const team = [{ id: 'enemy', life: 925, statuses: [{ id: 'poison', sourceId: 'hero',
      stacks: 1, remaining: 5, dotPerStack: 3, tags: ['poison'], expiresAtMs: 6700 }] }];
    const source = Object.freeze({ events: Object.freeze(events), diagnostic: { seed: 1 },
      result: Object.freeze({ events: Object.freeze([observation, status, corpse, unknown]),
        winner: null, rounds: 2, playerTeam: [], enemyTeam: team,
        ironGolemPreparation: { sourceItemId: 'paid-instance', paidMp: 35 } }) });
    const before = structuredClone(source);
    const actual = legacyRecording(source);
    expect(actual).toEqual({ ...source,
      events: [{ ...turn, uiDelayMs: 200 }, { ...action, uiDelayMs: 1700 }, hit],
      result: { ...source.result, events: [status, corpse, unknown] } });
    expect(actual.result.enemyTeam).toBe(team);
    expect(actual.result.enemyTeam[0]?.statuses[0]?.tags).toBe(team[0]?.statuses[0]?.tags);
    expect(actual.result.ironGolemPreparation).toBe(source.result.ironGolemPreparation);
    expect(actual.diagnostic).toBe(source.diagnostic);
    expect(source).toEqual(before);
    expect(actual).not.toBe(source); expect(actual.result).not.toBe(source.result);
    expect(actual.result.events).not.toBe(source.result.events);
  });

  it('leaves old well-formed recording values exact and is idempotent, including empty arrays', () => {
    const source = { events: [{ ...turn, uiDelayMs: 200 }, { ...action, uiDelayMs: 1700 }, hit],
      result: { events: [status, corpse], rounds: 1, winner: 'player' } };
    expect(legacyRecording(source)).toEqual(source);
    expect(legacyRecording(legacyRecording(source))).toEqual(source);
    expect(legacyRecording({ events: [], result: { events: [], winner: null } }))
      .toEqual({ events: [], result: { events: [], winner: null } });
  });
});
