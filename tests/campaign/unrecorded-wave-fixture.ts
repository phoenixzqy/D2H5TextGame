import type { EarnedWave } from '../sim/production/earned-playback';

/** Guard-only mocks have no native input; fail if a consumer requires provenance. */
export function unrecordedCampaignWave(wave: Omit<EarnedWave, 'engineInput'>): EarnedWave {
  const fixture: EarnedWave = {
    ...wave,
    get engineInput(): EarnedWave['engineInput'] {
      throw new Error('Constructed campaign wave has no recorded engine input');
    }
  };
  // Settlement spreads the ordinary fields. Never serialize a fabricated input.
  Object.defineProperty(fixture, 'engineInput', { enumerable: false });
  return fixture;
}
