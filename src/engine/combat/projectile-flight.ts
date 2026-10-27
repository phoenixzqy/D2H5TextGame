/** Battle-local flight work; no spatial stats, wall clock, RNG or persistence. */
interface Flight<T> {
  readonly sourceId: string;
  readonly payload: T;
  /** Remaining normal-flight milliseconds multiplied by100. */
  readonly work: number;
}
const normalSpeed = () => 100;
function speedOf(sourceId: string, speed: (sourceId: string) => number): number {
  const value = speed(sourceId);
  if (!Number.isFinite(value) || value <= 0 || value > 100)
    throw new Error('Invalid projectile speed percentage');
  return value;
}

/**
 * Empty per battle. Callers split advances at speed changes and the next impact;
 * launch order breaks equal arrival times. Payloads remain private to the caller.
 */
export class ProjectileFlights<T> {
  private clockMs = 0;
  private flights: readonly Flight<T>[] = [];

  /** Launch one positive finite flight at the last settled simulation clock. */
  launch(sourceId: string, flightMs: number, payload: T): void {
    if (!sourceId || !Number.isFinite(flightMs) || flightMs <= 0 || flightMs > 5000)
      throw new Error('Invalid projectile flight');
    this.flights = [...this.flights, { sourceId, payload, work: flightMs * 100 }];
  }

  /** Earliest integer simulation millisecond with exhausted travel work. */
  nextImpactAt(speed: (sourceId: string) => number = normalSpeed): number | undefined {
    let next = Infinity;
    for (const flight of this.flights)
      next = Math.min(next, Math.ceil(this.clockMs + flight.work / speedOf(flight.sourceId, speed)));
    return Number.isFinite(next) ? next : undefined;
  }

  /** Settle one constant-rate interval atomically; return each due payload once. */
  advance(toMs: number, speed: (sourceId: string) => number = normalSpeed): readonly T[] {
    if (!Number.isFinite(toMs) || toMs < this.clockMs)
      throw new Error('Invalid projectile clock');
    // Validate every rate before mutating this queue or its clock.
    const interval = this.flights.map(flight => {
      const rate = speedOf(flight.sourceId, speed);
      return { flight, rate, at: Math.ceil(this.clockMs + flight.work / rate) };
    });
    const elapsed = toMs - this.clockMs;
    const due = interval.filter(entry => entry.at <= toMs).sort((a, b) => a.at - b.at);
    this.flights = interval.filter(entry => entry.at > toMs).map(({ flight, rate }) =>
      ({ ...flight, work: Math.max(0, flight.work - elapsed * rate) }));
    this.clockMs = toMs;
    return due.map(entry => entry.flight.payload);
  }
}
