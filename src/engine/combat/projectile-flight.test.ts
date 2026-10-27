import { expect, it } from 'vitest';
import { ProjectileFlights } from './projectile-flight';
it('lands a normal shot at500ms with no early impact', () => {
 const q = new ProjectileFlights<string>(); q.launch('archer', 500, 'arrow');
 expect(q.nextImpactAt()).toBe(500); expect(q.advance(499)).toEqual([]);
 expect(q.nextImpactAt()).toBe(500); expect(q.advance(500)).toEqual(['arrow']);
 expect(q.nextImpactAt()).toBeUndefined(); expect(q.advance(1000)).toEqual([]);
});
it('slows real flight to33% without manufacturing another launch', () => {
 const q = new ProjectileFlights<string>(); q.launch('archer', 500, 'arrow');
 const rate = () => 33;
 expect(q.nextImpactAt(rate)).toBe(1516); expect(q.advance(1515, rate)).toEqual([]);
 expect(q.advance(1516, rate)).toEqual(['arrow']);
});
it('preserves traveled distance on mid-flight onset and expiry', () => {
 const q = new ProjectileFlights<string>(); q.launch('archer', 500, 'arrow');
 expect(q.advance(200)).toEqual([]); //200 normal ms already traveled
 expect(q.nextImpactAt(() => 33)).toBe(1110);
 expect(q.advance(400, () => 33)).toEqual([]); //66 normal ms more
 expect(q.nextImpactAt()).toBe(634); expect(q.advance(633)).toEqual([]);
 expect(q.advance(634)).toEqual(['arrow']);
});
it('orders due shots by arrival and resolves exact ties in launch order', () => {
 const q = new ProjectileFlights<string>();
 q.launch('slow', 1000, 'later'); q.launch('fast', 500, 'first'); q.launch('fast', 500, 'second');
 expect(q.advance(500)).toEqual(['first', 'second']);
 expect(q.nextImpactAt()).toBe(1000); expect(q.advance(1000)).toEqual(['later']);
});
it('supports source-specific rates and shots launched while another is flying', () => {
 const q = new ProjectileFlights<string>(); q.launch('a', 500, 'a');
 expect(q.advance(200, () => 50)).toEqual([]); q.launch('b', 500, 'b');
 const speed = (source: string) => source === 'a' ? 50 : 100;
 expect(q.nextImpactAt(speed)).toBe(700); expect(q.advance(700, speed)).toEqual(['b']);
 expect(q.advance(1000, speed)).toEqual(['a']);
});
it('starts every battle empty and does not share queue state', () => {
 const a = new ProjectileFlights<string>(), b = new ProjectileFlights<string>();
 a.launch('a', 500, 'a'); expect(b.nextImpactAt()).toBeUndefined();
 expect(b.advance(500)).toEqual([]); expect(a.advance(500)).toEqual(['a']);
});
it('rejects invalid flight, clock and speed instead of hanging the timeline', () => {
 const q = new ProjectileFlights<string>();
 for (const ms of [0, -1, NaN, Infinity, 5001]) expect(() => { q.launch('a', ms, 'a'); }).toThrow();
 expect(() => { q.launch('', 500, 'a'); }).toThrow(); q.launch('a', 500, 'a');
 for (const speed of [0, -1, NaN, Infinity, 101]) {
  expect(() => q.nextImpactAt(() => speed)).toThrow();
  expect(() => q.advance(100, () => speed)).toThrow();
 }
 for (const at of [-1, NaN, Infinity]) expect(() => q.advance(at)).toThrow();
 expect(q.advance(100)).toEqual([]); expect(() => q.advance(99)).toThrow();
 expect(q.nextImpactAt()).toBe(500); expect(q.advance(500)).toEqual(['a']);
});
it('keeps fractional boundaries and late batches deterministic', () => {
 const q = new ProjectileFlights<string>(); q.advance(.125); q.launch('a', .5, 'a');
 expect(q.nextImpactAt()).toBe(1); expect(q.advance(.75)).toEqual([]);
 expect(q.nextImpactAt()).toBe(1); expect(q.advance(1)).toEqual(['a']);
 const late = new ProjectileFlights<string>(); late.launch('a', 500, 'later'); late.launch('b', 250, 'first');
 expect(late.advance(1000)).toEqual(['first', 'later']);
});
