import { useMetaStore } from '@/stores/metaStore';

/** Preserve historical screens by default; fresh populations explicitly freeze distinct creation times. */
export function campaignCreationTimestamp(timestamp = 1793304000000): number {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) throw new RangeError('Invalid campaign timestamp');
  return timestamp;
}

/** Fail closed on malformed CLI clock input before any output directory or native store changes. */
export function campaignTimestampArgument(value: string | undefined): number {
  if (value !== undefined && !/^(0|[1-9]\d*)$/.test(value)) throw new RangeError('Invalid campaign timestamp');
  return campaignCreationTimestamp(value === undefined ? undefined : Number(value));
}

/**
 * Install a task-owned admission clock. Only consumed recorded wave time advances it;
 * production still generates seeds. The caller must dispose it after realm cleanup.
 */
export function installCampaignOnlineClock(timestamp: number) {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) throw new RangeError('Invalid campaign timestamp');
  const original = Date.now;
  let current = timestamp;
  const read = () => current;
  Date.now = read;
  return {
    now: read,
    advance: (playedMs: number) => {
      if (!Number.isFinite(playedMs) || playedMs < 0 ||
        !Number.isSafeInteger(current + Math.ceil(playedMs))) throw new RangeError('Invalid consumed wave time');
      if (Date.now !== read) throw new Error('Campaign clock ownership changed');
      current += Math.ceil(playedMs);
      const meta = useMetaStore.getState();
      meta.updateIdleState(meta.readIdleBonus(current));
      return current;
    },
    dispose: () => {
      if (Date.now !== read) throw new Error('Campaign clock ownership changed');
      Date.now = original;
    }
  };
}
