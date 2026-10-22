/** Test-only projection of new status transport onto unchanged historical oracles. */
interface OracleEvent { readonly kind: string }
interface TimedOracleEvent extends OracleEvent {
  readonly simClockMs: number;
  readonly uiDelayMs: number;
}

/** Remove only the new silent transport; retain all gameplay payloads and order. */
export function legacyBattleEvents<T extends OracleEvent>(events: readonly T[]): T[] {
  return events.filter(event => event.kind !== 'status-state');
}

/** Restore historical per-event delay hints from retained, unchanged simulation times. */
export function legacyRecordedEvents<T extends TimedOracleEvent>(events: readonly T[]): T[] {
  let previous: number | null = null;
  return legacyBattleEvents(events).map(event => {
    const uiDelayMs = previous === null ? 200 : Math.max(50, Math.min(3000, event.simClockMs - previous));
    previous = event.simClockMs;
    return { ...event, uiDelayMs };
  });
}

/** Project both event arrays without normalizing any other result or wrapper field. */
export function legacyRecording<T extends {
  readonly events: readonly TimedOracleEvent[];
  readonly result: { readonly events: readonly OracleEvent[] };
}>(recording: T) {
  const result: T['result'] = recording.result;
  return { ...recording, events: legacyRecordedEvents(recording.events),
    result: { ...result, events: legacyBattleEvents(result.events) } };
}
