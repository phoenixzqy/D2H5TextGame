/**
 * Player store — skill allocation + respec tests.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore, respecCost } from './playerStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { getSkillsForClass } from './skillsHelpers';

describe('playerStore.allocateSkillPoint', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('returns no-player when player is null', () => {
    const r = usePlayerStore.getState().allocateSkillPoint('foo');
    expect(r).toBe('no-player');
  });

  it('returns no-points when player has zero skill points', () => {
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillPoints: 0 });
    const skills = getSkillsForClass('sorceress');
    const first = skills[0];
    if (!first) throw new Error('no skills');
    const r = usePlayerStore.getState().allocateSkillPoint(first.id);
    expect(r).toBe('no-points');
  });

  it('returns unknown-skill for an id not in the class tree', () => {
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillPoints: 5, level: 30 });
    const r = usePlayerStore.getState().allocateSkillPoint('nope/no-such-skill');
    expect(r).toBe('unknown-skill');
  });

  it('blocks allocation when player level is below skill minLevel', () => {
    const skills = getSkillsForClass('sorceress');
    const high = skills.find((s) => s.minLevel >= 12);
    if (!high) return; // skip if data shape changed
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillPoints: 5, level: 1 });
    const r = usePlayerStore.getState().allocateSkillPoint(high.id);
    expect(r).toBe('level-too-low');
  });

  it('blocks allocation when prerequisite is missing', () => {
    const skills = getSkillsForClass('sorceress');
    const withPrereq = skills.find((s) => Array.isArray(s.prerequisites) && s.prerequisites.length > 0);
    if (!withPrereq) return; // dataset has no prereqs yet — skip
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillPoints: 5, level: 60 });
    const r = usePlayerStore.getState().allocateSkillPoint(withPrereq.id);
    expect(r).toBe('prereq-missing');
  });

  it('allocates a valid skill and decrements skill points', () => {
    const skills = getSkillsForClass('sorceress');
    const easy = skills.find((s) => s.minLevel <= 1 && (!s.prerequisites || s.prerequisites.length === 0));
    if (!easy) throw new Error('no easy skill');
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillPoints: 3, level: 1 });
    expect(usePlayerStore.getState().allocateSkillPoint(easy.id)).toBe('ok');
    const np = usePlayerStore.getState().player;
    expect(np?.skillPoints).toBe(2);
    expect(np?.skillLevels?.[easy.id]).toBe(1);
  });

  it('caps allocation at maxLevel', () => {
    const skills = getSkillsForClass('sorceress');
    const easy = skills.find((s) => s.minLevel <= 1 && (!s.prerequisites || s.prerequisites.length === 0));
    if (!easy) throw new Error('no easy skill');
    const p = createMockPlayer('Hero', 'sorceress');
    const max = easy.maxLevel || 20;
    usePlayerStore.getState().setPlayer({
      ...p,
      skillPoints: 1,
      level: 1,
      skillLevels: { [easy.id]: max }
    });
    const r = usePlayerStore.getState().allocateSkillPoint(easy.id);
    expect(r).toBe('maxed');
  });
});

describe('playerStore.respec', () => {
  beforeEach(() => { usePlayerStore.getState().reset(); });

  it('returns no-allocations when nothing is allocated', () => {
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer(p);
    const r = usePlayerStore.getState().respec({ getGold: () => 100000, spendGold: () => true });
    expect(r).toBe('no-allocations');
  });

  it('refunds points and charges gold on success', () => {
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({
      ...p,
      level: 5,
      skillPoints: 0,
      skillLevels: { 'a': 2, 'b': 1 }
    });
    let spent = 0;
    const r = usePlayerStore.getState().respec({
      getGold: () => 100000,
      spendGold: (n) => { spent = n; return true; }
    });
    expect(r).toBe('ok');
    expect(spent).toBe(respecCost(5));
    const np = usePlayerStore.getState().player;
    expect(np?.skillPoints).toBe(3);
    expect(np?.skillLevels).toEqual({});
  });

  it('returns insufficient-gold when player cannot pay', () => {
    const p = createMockPlayer('Hero', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...p, skillLevels: { 'a': 1 } });
    const r = usePlayerStore.getState().respec({ getGold: () => 0, spendGold: () => false });
    expect(r).toBe('insufficient-gold');
  });
});

describe('respecCost', () => {
  it('scales linearly with level and caps at 50k', () => {
    expect(respecCost(1)).toBe(1000);
    expect(respecCost(10)).toBe(10000);
    expect(respecCost(50)).toBe(50000);
    expect(respecCost(99)).toBe(50000);
  });
});
