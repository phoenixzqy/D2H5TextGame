import { planRespec } from '../../src/engine/progression/respec';
import { usePlayerStore } from '../../src/stores/playerStore';

/** Construct only a free post-reset input for recording/composition regressions.
 * Not an ordinary town service, payment, persisted campaign or earned acceptance. */
export function resetSkillsForCompositionTest(): 'ok' {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing composition fixture hero');
  const plan = planRespec(player, 'skill', 0);
  if (plan.kind !== 'ok' || plan.cost !== 0) throw new Error('Expected a free composition reset');
  usePlayerStore.setState({ player: plan.player });
  return 'ok';
}
