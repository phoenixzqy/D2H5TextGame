import type { DamageEffect, SkillEffect } from '../skills/effects';
import type { ActiveStatus, CombatUnit } from './types';
import { statusActiveAt } from './status';
import { PLAGUE_DEFINITION } from './plague-definition';

interface PlagueCast {
  readonly eligibleTargets: ReadonlySet<string>;
  used: boolean;
}
interface PlagueMark {
  readonly marker: ActiveStatus;
  readonly casts: PlagueCast[];
}
const carriesPlague = (effect: SkillEffect): effect is DamageEffect =>
  effect.kind === 'damage' &&
  (effect.applyStatuses ?? (effect.applyStatus ? [effect.applyStatus] : [])).some(s => s.id === 'plague');
const sameMarker = (a: ActiveStatus, b: ActiveStatus): boolean =>
  a.sourceId === b.sourceId && a.appliedAtMs === b.appliedAtMs;

/** Paid-cast Epidemic authority, created empty for each battle and never persisted. */
export class PlagueTracker {
  private readonly effects = new WeakMap<DamageEffect, PlagueCast>();
  private readonly marks = new Map<string, PlagueMark>();

  /** Snapshot selected targets before any paid cast effects; all its hits share one allowance. */
  prepare(effects: readonly SkillEffect[], targets: readonly CombatUnit[], clock: number): readonly SkillEffect[] {
    if (!effects.some(carriesPlague)) return effects;
    const eligibleTargets = new Set(targets.filter(target => target.statuses.some(status =>
      status.id === 'poison' && status.stacks >= PLAGUE_DEFINITION.poisonStacksForEpidemic &&
      statusActiveAt(status, clock))).map(target => target.id));
    if (eligibleTargets.size === 0) return effects;
    const cast: PlagueCast = { eligibleTargets, used: false };
    return effects.map(effect => {
      if (!carriesPlague(effect)) return effect;
      const prepared = { ...effect };
      this.effects.set(prepared, cast);
      return prepared;
    });
  }

  /** Bind only after a landed prepared effect actually applies its Plague marker. */
  mark(effect: DamageEffect, target: CombatUnit, clock: number): void {
    const cast = this.effects.get(effect);
    if (!cast?.eligibleTargets.has(target.id)) return;
    const marker = target.statuses.find(status => status.id === 'plague' && statusActiveAt(status, clock));
    if (!marker) return;
    const previous = this.marks.get(target.id);
    if (previous && sameMarker(previous.marker, marker)) {
      if (!previous.casts.includes(cast)) previous.casts.push(cast);
    } else {
      this.marks.set(target.id, { marker, casts: [cast] });
    }
  }

  /** Consume at most one cast for a frozen active death view, including its lethal final interval. */
  consume(dead: CombatUnit): boolean {
    const mark = this.marks.get(dead.id);
    this.marks.delete(dead.id);
    if (!mark || !dead.statuses.some(status => status.id === 'poison' && status.stacks > 0) ||
      !dead.statuses.some(status => status.id === 'plague' && sameMarker(mark.marker, status))) return false;
    const cast = mark.casts.find(candidate => !candidate.used);
    if (!cast) return false;
    cast.used = true;
    return true;
  }
}
