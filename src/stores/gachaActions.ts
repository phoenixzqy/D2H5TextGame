import { loadMercPool, type MercPool } from '@/data/loaders/mercs';
import { createRng } from '@/engine/rng';
import { planRecruitment } from '@/engine/gacha/recruitment-state';
import { LEVEL_CAP } from '@/engine/progression/xp';
import { useInventoryStore } from './inventoryStore';
import { useMetaStore, type GachaPullResult } from './metaStore';
import { useMercStore, mercXpForLevel } from './mercStore';
import { createMercFromDef } from './mercFactory';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { hasActiveSubAreaRun } from './combatHelpers';
import { useHydrationStore } from './hydrationStore';
import { blockSavesForRecovery, isReplacingSave, resumeWaveDeferredSave } from './persistence';
import { assertRecordedWaveNewTransitionAllowed } from './recordedWaveAccess';
import { assertMaterialMutationAllowed, beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

function validAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= 0;
}

/** Read conserved spendable wishstones without rewriting either historical owner. */
export function recruitmentBalance(earned: number, legacy: number): number | null {
  const total = earned + legacy;
  return validAmount(earned) && validAmount(legacy) && validAmount(total) ? total : null;
}

/** New grants use the same inventory wallet as kills and quests. */
export function addRecruitmentCurrency(amount: number): void {
  assertMaterialMutationAllowed();
  const inventory = useInventoryStore.getState();
  const earned = inventory.currencies.wishstone ?? 0;
  if (!validAmount(amount) || recruitmentBalance(earned + amount, useMetaStore.getState().gachaState.currency) === null) {
    throw new RangeError('Invalid wishstone grant');
  }
  if (amount > 0) inventory.addCurrency('wishstone', amount);
}

/** Spend a positive safe amount, conserving legacy value at the ordinary payment boundary. */
export function spendRecruitmentCurrency(amount: number): boolean {
  return transactPayment(amount) !== null;
}

/** Run an authored single/ten pull; refusal publishes nothing and successful payment is atomic with recruits. */
export function executeGachaPull(count: number): GachaPullResult[] | null {
  if (count !== 1 && count !== 10) return null;
  const pool = loadMercPool();
  return transactPayment(count === 1 ? pool.banner.cost.single : pool.banner.cost.tenPull, { count, pool });
}

function transactPayment(cost: number, pull?: { count: 1 | 10; pool: MercPool }): GachaPullResult[] | null {
  if (!validAmount(cost) || cost === 0) return null;
  assertRecordedWaveNewTransitionAllowed();
  const player = usePlayerStore.getState().player;
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave() || !player
    || useCombatStore.getState().inCombat || hasActiveSubAreaRun()) return null;
  if (pull && (!Number.isInteger(player.level) || player.level < 1 || player.level > LEVEL_CAP)) return null;
  const lease = beginMaterialTransaction(true);
  try {
    const inventory = useInventoryStore.getState(), meta = useMetaStore.getState(), merc = useMercStore.getState();
    const balance = recruitmentBalance(inventory.currencies.wishstone ?? 0, meta.gachaState.currency);
    if (balance === null || balance < cost) return null;
    let ownedMercs = merc.ownedMercs, mercEquipment = merc.mercEquipment, mercProgress = merc.mercProgress;
    let recruitmentProgress = merc.recruitmentProgress, recruitmentState = meta.recruitmentState;
    let gachaState = { ...meta.gachaState, currency: 0 };
    const out: GachaPullResult[] = [];
    if (pull) {
      const { pool, count } = pull;
      if (!validAmount(meta.gachaState.pityCounter)) return null;
      const rng = createRng((Date.now() ^ meta.gachaState.pityCounter) >>> 0);
      const rolled = planRecruitment(rng, pool.banner, { pityCounter: meta.gachaState.pityCounter,
        ...meta.recruitmentState }, merc.recruitmentProgress,
        new Set(ownedMercs.map(m => m.id.split('#')[0] ?? m.id)), count, Date.now());
      const byId = new Map(pool.pool.map(def => [def.id, def]));
      for (const roll of rolled.results) {
        const def = byId.get(roll.mercId);
        if (!def) throw new Error(`Missing recruitment definition: ${roll.mercId}`);
        if (roll.isNew) {
          const recruit = createMercFromDef(def, undefined, player.level);
          ownedMercs = [...ownedMercs, recruit];
          mercEquipment = { ...mercEquipment, [recruit.id]: {} };
          mercProgress = { ...mercProgress, [recruit.id]: {
            experience: 0, experienceToNextLevel: mercXpForLevel(recruit.level)
          } };
        }
        out.push({ mercDef: def, rarity: roll.rarity, isNew: roll.isNew,
          shardCount: roll.kind === 'shard' ? roll.shardCount : 0 });
      }
      const { pityCounter, ...history } = rolled.state;
      recruitmentState = history; recruitmentProgress = rolled.progress;
      gachaState = { ...gachaState, pityCounter, ownedMercIds: ownedMercs.map(m => m.id) };
    }
    const currencies = { ...inventory.currencies, wishstone: balance - cost };
    try {
      useInventoryStore.setState({ currencies });
      if (pull) useMercStore.setState({ ownedMercs, mercEquipment, mercProgress, recruitmentProgress });
      useMetaStore.setState({ gachaState, recruitmentState });
      const published = useMercStore.getState();
      if (useInventoryStore.getState().currencies !== currencies || useMetaStore.getState().gachaState !== gachaState
        || published.ownedMercs !== ownedMercs || published.mercEquipment !== mercEquipment
        || published.mercProgress !== mercProgress || published.fieldedMercId !== merc.fieldedMercId
        || published.recruitmentProgress !== recruitmentProgress || useMetaStore.getState().recruitmentState !== recruitmentState) {
        throw new Error('Incomplete recruitment publication');
      }
      return out;
    } catch (cause) {
      const errors: unknown[] = [];
      try { useInventoryStore.setState({ currencies: inventory.currencies }); } catch (error) { errors.push(error); }
      try { useMercStore.setState(merc); } catch (error) { errors.push(error); }
      try { useMetaStore.setState({ gachaState: meta.gachaState, recruitmentState: meta.recruitmentState }); } catch (error) { errors.push(error); }
      const restored = useMercStore.getState();
      if (useInventoryStore.getState().currencies !== inventory.currencies || useMetaStore.getState().gachaState !== meta.gachaState
        || restored.ownedMercs !== merc.ownedMercs || restored.mercEquipment !== merc.mercEquipment
        || restored.mercProgress !== merc.mercProgress || restored.fieldedMercId !== merc.fieldedMercId
        || restored.recruitmentProgress !== merc.recruitmentProgress || useMetaStore.getState().recruitmentState !== meta.recruitmentState) {
        errors.push(new Error('Incomplete recruitment rollback'));
      }
      if (errors.length > 0) { blockSavesForRecovery(); throw new AggregateError(errors, 'Recruitment restoration failed', { cause }); }
      return null;
    }
  } finally { if (endMaterialTransaction(lease)) resumeWaveDeferredSave(); }
}
