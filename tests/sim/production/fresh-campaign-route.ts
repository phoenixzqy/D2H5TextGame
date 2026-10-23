import assert from 'node:assert/strict';
import { loadQuests } from '@/data/loaders/quests';
import type { CoreStats } from '@/engine/types/attributes';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useCombatStore } from '@/stores/combatStore';
import { setIdleEliteMisses } from '@/stores/idleElitePity';
import { claimQuestReward, canClaim, readQuestItem } from '@/features/quests/claimReward';
import { assembleQuestItem, insertQuestItem, interactWithAreaObject,
  recoverQuestTool, travelToAreaObjects } from '@/features/quests/interactObject';
import { freshCampaignPolicy as policy, freshCampaignUpgrades } from './fresh-campaign-policy';
import { earnedDelta, observeEarnedState } from './earned-state';
import { hashObservation } from './earned-report';
import { playEarnedWave, startEarnedRun, type EarnedRunHandle, type EarnedWave } from './earned-playback';
import { auditNativeLiteral, selectFreshGear, transferFreshItem } from './fresh-campaign-gear';

const fire = policy.fire, frost = 'skills-sorceress-frost-nova', warmth = 'skills-sorceress-warmth';
const ice = 'skills-sorceress-ice-blast';
const den = 'quests/act1-den-of-evil', sisters = 'quests/act1-sisters-to-the-slaughter';
const staff = 'quests/act2-horadric-staff', sun = 'quests/act2-tainted-sun';
const radament = 'quests/act2-radaments-lair', arcane = 'quests/act2-arcane-sanctuary', tombs = 'quests/act2-seven-tombs';

/** First expected action refusal or actual combat nonwin. It never triggers a retry. */
export class FreshRouteStop extends Error {
  constructor(readonly evidence: unknown, readonly wave: EarnedWave | null = null) { super('Fresh earned route stopped'); }
}

interface RouteHooks {
  readonly wave: (wave: EarnedWave, handle: EarnedRunHandle, label: string) => void;
  readonly action: (action: string, result: unknown) => void;
}

/** Accepted earned Act I policy then conditional Act II; stops before any Act III launch. */
export function runFreshCampaignRoute(hooks: RouteHooks) {
  const player = () => { const value = usePlayerStore.getState().player; assert.ok(value); return value; };
  const action = (label: string, operation: () => unknown, expected: unknown = 'ok') => {
    const before = observeEarnedState();
    const result = operation();
    const after = observeEarnedState();
    hooks.action(label, { result, beforeHash: hashObservation(before), afterHash: hashObservation(after),
      delta: earnedDelta(before, after), level: after.player.player?.level });
    if (expected !== null && result !== expected) throw new FreshRouteStop({ action: label, result, expected });
    return result;
  };
  const skills = (id: string, count: number) => {
    for (let index = 0; index < count; index++) action(`allocate:${id}`, () => usePlayerStore.getState().allocateSkillPoint(id));
  };
  const stats = (vitality: number, energy: number) => {
    const deltas: CoreStats = { strength: 0, dexterity: 0, vitality, energy };
    if (vitality || energy) action('allocate-earned-stats', () => usePlayerStore.getState().allocateStatPoints(deltas, player()));
  };
  const checkpoint = (label: string) => { hooks.action(label, { state: observeEarnedState() }); };
  const startQuest = (id: string) => action(`start:${id}`, () => {
    const quest = loadQuests().find(entry => entry.id === id);
    assert.ok(quest);
    const map = useMapStore.getState();
    const status = map.questProgress[id]?.status ??
      (quest.prerequisites?.some(required => map.questProgress[required]?.status !== 'completed') ? 'locked' : 'available');
    if (status !== 'available') return status;
    // This is the production QuestCard Start command, with all authored objectives false.
    map.updateQuestProgress(id, { status: 'inProgress',
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) });
    return 'ok';
  });
  const claim = (id: string, xp: number) => {
    const before = observeEarnedState();
    action(`claim:${id}`, () => claimQuestReward(id));
    const delta = earnedDelta(before, observeEarnedState());
    assert.equal(delta.xp, xp);
    assert.equal(delta.mercXp[policy.mercId], Math.floor(xp * 0.75));
    assert.equal(canClaim(id), false);
    return delta;
  };
  const transfer = (...args: Parameters<typeof transferFreshItem>) =>
    action(`transfer:${args[0]}:${args[1]}`, () => transferFreshItem(...args), null);
  const select = (phase: 'initial' | 'boundary') => {
    const plan = selectFreshGear(observeEarnedState(), phase);
    hooks.action(`frozen-${phase}-selection`, plan);
    if (phase === 'boundary') assert.equal(plan.choices.length, 15);
    for (const choice of plan.choices) if (choice.selectedId && choice.selectedId !== choice.previousId)
      transfer(choice.owner, choice.slot, choice.selectedId);
  };
  const run = (act: number, area: string, label: string) => {
    if (!useMapStore.getState().isActUnlocked(act)) throw new FreshRouteStop({ action: label, reason: 'act-locked', act, area });
    useMapStore.getState().setCurrentLocation(act, area);
    const handle = startEarnedRun({ act, subAreaId: area, mode: 'manual' });
    const freeze = () => {
      const state = observeEarnedState();
      return { equipment: state.inventory.equipped, mercEquipment: state.merc.mercEquipment,
        coreStats: state.player.player?.coreStats, skills: state.player.player?.skillLevels,
        combo: state.player.player?.comboOrder, mercCombo: state.merc.ownedMercs.map(merc => merc.comboOrder) };
    };
    const preparation = freeze();
    for (let index = 0; index < handle.totalWaves; index++) {
      const wave = playEarnedWave(handle, index);
      hooks.wave(wave, handle, label);
      assert.deepEqual(freeze(), preparation, 'Player policy changed during a challenge');
      if (wave.opening.outcome?.winner !== 'player' || !wave.opening.outcome.finalPlayerTeam.some(
        unit => unit.id === player().id && unit.life > 0)) throw new FreshRouteStop({
        action: label, area, act, handle, waveIndex: index, winner: wave.opening.outcome?.winner,
        actualDelta: wave.actualDelta }, wave);
      if (wave.advanceResult === 'victory') {
        // CombatScreen Return to Map, only after the final settled victory.
        action(`return-to-map:${label}`, () => {
          useMetaStore.getState().setIdleTarget(undefined);
          setIdleEliteMisses(0);
          useCombatStore.getState().endCombat();
          return 'ok';
        });
        return;
      }
      assert.equal(wave.advanceResult, 'next-wave');
    }
    throw new Error('Fresh challenge exhausted without a terminal');
  };
  const allocateGrowth = () => {
    skills(ice, player().skillPoints);
    const points = player().statPoints;
    assert.equal(points % 5, 0);
    stats(points / 5 * 2, points / 5 * 3);
  };
  const actTwoCheckpoint = (label: string) => {
    const current = player();
    const rank = current.skillLevels?.['sorceress.ice_blast'] ?? 0;
    assert.ok(rank <= 20 && current.coreStats.vitality <= 500);
    skills(ice, Math.min(current.skillPoints, 20 - rank));
    stats(Math.min(player().statPoints, 500 - player().coreStats.vitality), 0);
    select('boundary');
    checkpoint(label);
  };

  for (const expected of policy.literals) hooks.action('native17-literal-audit', auditNativeLiteral(expected));
  skills(fire, 3); skills(frost, 1); skills(warmth, 1);
  action('set-frost-fire-combo', () => { usePlayerStore.getState().setComboOrder([frost, fire]); return 'ok'; });
  transfer('hero', 'gloves', 'it-96fga-3');
  transfer('hero', 'boots', 'it-5iwwr-4');
  transfer('merc', 'gloves', 'it-8jv2k-1', 0);
  stats(15, 10);
  for (const expected of freshCampaignUpgrades) hooks.action('native17-upgrade-audit', auditNativeLiteral(expected));
  transfer('hero', 'head', 'it-71emu-12');
  transfer('hero', 'weapon', 'it-8n9ca-1b');
  transfer('merc', 'head', 'it-71emu-1a', 3);
  transfer('merc', 'gloves', 'it-96fga-8', 3);
  transfer('merc', 'boots', 'it-5iwwr-9', 0);
  startQuest(den);
  checkpoint('before-mandatory-den');
  run(1, 'areas/act1-den-of-evil', 'mandatory-den');
  action('talk-akara', () => { useMapStore.getState().recordNpcTalk('npc/akara');
    return useMapStore.getState().questProgress[den]?.status === 'completed' ? 'ok' : 'not-completed'; });
  claim(den, 500);
  allocateGrowth();
  for (let count = 0; count < 100 && player().level < 12; count++) {
    run(1, 'areas/act1-den-of-evil', `earned-den-${String(count + 1)}`);
    allocateGrowth();
  }
  if (player().level !== 12) throw new FreshRouteStop({ action: 'reach-level-twelve', level: player().level });
  select('initial');
  action('set-frost-ice-combo', () => { usePlayerStore.getState().setComboOrder([frost, ice]); return 'ok'; });
  action('set-rogue-priority', () => useMercStore.getState().setSkillOrder(policy.mercId,
    ['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow']), true);
  checkpoint('before-act1-route');
  for (const area of ['blood-moor', 'cold-plains', 'burial-grounds']) run(1, `areas/act1-${area}`, `route-${area}`);
  select('boundary');
  run(1, 'areas/act1-dark-wood', 'route-dark-wood');
  startQuest(sisters);
  run(1, 'areas/act1-catacombs', 'andariel');
  assert.equal(useMapStore.getState().isActUnlocked(2), true);
  const andariel = claim(sisters, 8000);
  const reward = andariel.addedItems.find(item => item.uniqueId === 'items/unique/coif-of-glory');
  assert.ok(reward, 'Actual Andariel claim did not issue the authored Coif');
  transfer('hero', 'head', reward.id);
  checkpoint('fresh-earned-act2-available');

  for (const id of [staff, sun, radament, arcane, tombs]) startQuest(id);
  for (const [area, objective] of [['dry-hills', 'obj-cube'], ['far-oasis', 'obj-shaft'], ['lost-city', 'obj-amulet']] as const) {
    action(`visit:${area}`, () => travelToAreaObjects(2, `areas/act2-${area}`));
    action(`recover:${objective}`, () => recoverQuestTool(`${staff}#objective:${objective}`));
  }
  action('destroy-altar', () => interactWithAreaObject('objects/serpent_altar'));
  const assembledSource = `${staff}#objective:obj-transmute`;
  action('assemble-staff', () => assembleQuestItem(assembledSource));
  claim(staff, 6000); claim(sun, 4500);
  action('visit-tomb-orifice', () => travelToAreaObjects(2, 'areas/act2-tomb-of-tal-rasha'));
  action('insert-staff', () => insertQuestItem(assembledSource));
  actTwoCheckpoint('before-radament');
  run(2, 'areas/act2-far-oasis', 'radament');
  claim(radament, 5000);
  action('read-book-of-skill', () => readQuestItem(`${radament}#reward:questItem`));
  actTwoCheckpoint('before-arcane');
  run(2, 'areas/act2-arcane-sanctuary', 'summoner');
  action('visit-horazon-journal', () => travelToAreaObjects(2, 'areas/act2-arcane-sanctuary'));
  action('read-horazon-journal', () => interactWithAreaObject('objects/horazon_journal'));
  claim(arcane, 7000);
  actTwoCheckpoint('before-duriel');
  run(2, 'areas/act2-tomb-of-tal-rasha', 'duriel');
  assert.equal(useMapStore.getState().isActUnlocked(3), true);
  claim(tombs, 12000);
  checkpoint('fresh-earned-act3-available');
}
