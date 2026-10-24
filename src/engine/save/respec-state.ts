/** Future reset counters must never be laundered through a predecessor migration. */
export function rejectPreV21Respec(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const field = Object.getOwnPropertyDescriptor(value, 'player');
  if (field && !Object.hasOwn(field, 'value')) throw new Error('Invalid save: player accessor');
  const player: unknown = field?.value;
  if (player && typeof player === 'object' && 'respecsRemaining' in player) throw new Error('Invalid save: reserved pre21 respec counters');
}
