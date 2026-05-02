let idleEliteMisses = 0;

/** Current shared online-idle elite pity counter. */
export function getIdleEliteMisses(): number {
  return idleEliteMisses;
}

/** Update the shared online-idle elite pity counter. */
export function setIdleEliteMisses(value: number): void {
  idleEliteMisses = Math.max(0, Math.floor(value));
}

/** Reset the shared online-idle elite pity counter. */
export function resetIdleEliteMisses(): void {
  idleEliteMisses = 0;
}
