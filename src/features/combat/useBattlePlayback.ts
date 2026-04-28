/**
 * useBattlePlayback — drives real-time combat replay from a buffered
 * BattleEventWithTime stream.
 *
 * UI concern only: the engine has already resolved the fight; this hook
 * just animates the events into the combatStore log + maintains live HP
 * snapshots for the cards. No game logic.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CombatUnit } from '@/engine/combat/types';
import {
  MIN_ANIMATION_MS_PER_ACTION,
  type BattleEventWithTime
} from './runBattleStreamShim';

export type PlaybackSpeed = 1 | 2 | 4 | 'skip';

export interface UnitLive {
  readonly id: string;
  readonly life: number;
  readonly mana: number;
  readonly maxLife: number;
  readonly maxMana: number;
}

export interface PlaybackState {
  readonly visibleEvents: readonly BattleEventWithTime[];
  readonly liveUnits: ReadonlyMap<string, UnitLive>;
  readonly cursor: number;
  readonly done: boolean;
}

interface Args {
  readonly events: readonly BattleEventWithTime[];
  readonly initialUnits: readonly CombatUnit[];
  readonly speed: PlaybackSpeed;
  readonly paused: boolean;
  readonly hovered: boolean;
  readonly onEvent?: (event: BattleEventWithTime) => void;
}

function buildLive(units: readonly CombatUnit[]): Map<string, UnitLive> {
  const m = new Map<string, UnitLive>();
  for (const u of units) {
    m.set(u.id, {
      id: u.id,
      life: u.life,
      mana: u.mana,
      maxLife: u.stats.lifeMax,
      maxMana: u.stats.manaMax
    });
  }
  return m;
}

function applyEvent(map: Map<string, UnitLive>, e: BattleEventWithTime): void {
  switch (e.kind) {
    case 'damage': {
      if (e.dodged) return;
      const cur = map.get(e.target);
      if (cur) {
        map.set(e.target, { ...cur, life: Math.max(0, cur.life - e.amount) });
      }
      return;
    }
    case 'dot': {
      const cur = map.get(e.target);
      if (cur) {
        map.set(e.target, { ...cur, life: Math.max(0, cur.life - e.amount) });
      }
      return;
    }
    case 'heal': {
      const cur = map.get(e.target);
      if (cur) {
        map.set(e.target, {
          ...cur,
          life: Math.min(cur.maxLife, cur.life + e.amount)
        });
      }
      return;
    }
    case 'death': {
      const cur = map.get(e.target);
      if (cur) map.set(e.target, { ...cur, life: 0 });
      return;
    }
    default:
      return;
  }
}

export function useBattlePlayback(args: Args): PlaybackState {
  const { events, initialUnits, speed, paused, hovered, onEvent } = args;
  const [cursor, setCursor] = useState(0);
  const liveRef = useRef<Map<string, UnitLive>>(buildLive(initialUnits));
  const [, force] = useState(0);

  // Reset when the event buffer or initial units change.
  useEffect(() => {
    liveRef.current = buildLive(initialUnits);
    setCursor(0);
    force((n) => n + 1);
  }, [events, initialUnits]);

  // Skip → drain to end immediately.
  useEffect(() => {
    if (speed !== 'skip') return;
    if (cursor >= events.length) return;
    const m = liveRef.current;
    for (let i = cursor; i < events.length; i++) {
      const ev = events[i];
      if (!ev) continue;
      applyEvent(m, ev);
      onEvent?.(ev);
    }
    setCursor(events.length);
    force((n) => n + 1);
  }, [speed, cursor, events, onEvent]);

  // Real-time playback — one event per beat at MIN_ANIMATION_MS / speed.
  useEffect(() => {
    if (speed === 'skip') return;
    if (paused || hovered) return;
    if (cursor >= events.length) return;
    const interval = MIN_ANIMATION_MS_PER_ACTION / speed;
    const handle = window.setTimeout(() => {
      const ev = events[cursor];
      if (!ev) return;
      applyEvent(liveRef.current, ev);
      onEvent?.(ev);
      setCursor((c) => c + 1);
      force((n) => n + 1);
    }, interval);
    return () => {
      window.clearTimeout(handle);
    };
  }, [cursor, events, speed, paused, hovered, onEvent]);

  const visible = useMemo(() => events.slice(0, cursor), [events, cursor]);

  return {
    visibleEvents: visible,
    liveUnits: liveRef.current,
    cursor,
    done: cursor >= events.length
  };
}
