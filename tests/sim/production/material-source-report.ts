/** Test-only kill/search accounting. This module grants no campaign or earned authority. */
import { vi } from 'vitest';
import * as award from '@/engine/loot/award';
import * as drops from '@/engine/loot/drop-roller';
import * as currency from '@/engine/loot/orbs-and-currency';
import { materialCatalog } from '@/data/loaders/materials';
import { inferKind } from '@/engine/combat/types';
import { mergeMaterials, type MaterialLedger } from '@/engine/loot/materials';
import type { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { materialDelta } from './material-delta';
import { copyFindItemFinds, findItemBonusEnemies, type FindItemFind } from '@/engine/skills/find-item';

type KillArgs = Parameters<typeof award.rollKillRewards>;
interface DropObservation {
  readonly args: Parameters<typeof drops.rollDrops>;
  readonly result: ReturnType<typeof drops.rollDrops>;
  readonly snapshot: ReturnType<typeof drops.rollDrops>;
}
interface CurrencyObservation {
  readonly args: Parameters<typeof currency.rollCurrencyDrops>;
  readonly result: ReturnType<typeof currency.rollCurrencyDrops>;
  readonly materials: MaterialLedger;
}
interface KillObservation {
  readonly args: KillArgs;
  readonly input: award.KillRewardInput;
  readonly hasTreasureClass: boolean;
  readonly drops: DropObservation | null;
  readonly currency: CurrencyObservation | null;
  readonly result: award.KillRewards;
  readonly snapshot: award.KillRewards;
}
export interface MaterialSourceCapture<T = unknown> {
  readonly execution: { readonly status: 'returned'; readonly value: T } |
    { readonly status: 'threw'; readonly error: unknown };
  readonly kills: readonly KillObservation[];
  readonly issues: readonly string[];
}

let observing = false;
/**
 * Observe synchronous native imports once, retaining original args/result identities.
 * Export-bypassing lexical batch calls are unscoped and cannot be credited.
 * No generator rerolls, RNG draws, allocator changes or persistent mocks.
 */
export function observeMaterialSources<T>(action: () => T): MaterialSourceCapture<T> {
  if (observing || [award.rollKillRewards, drops.rollDrops, currency.rollCurrencyDrops].some(vi.isMockFunction))
    throw new Error('Material source observation needs exclusive original exports');
  observing = true;
  const originals = { kill: award.rollKillRewards, drop: drops.rollDrops, currency: currency.rollCurrencyDrops };
  const restorers: (() => void)[] = [], kills: KillObservation[] = [], issues: string[] = [];
  let active: { drops: DropObservation | null; currency: CurrencyObservation | null } | null = null;
  try {
    const killSpy = vi.spyOn(award, 'rollKillRewards').mockImplementation(function (this: unknown, ...args: KillArgs) {
      const parent = active;
      if (parent) issues.push('nested kill call');
      const frame = { drops: null as DropObservation | null, currency: null as CurrencyObservation | null };
      active = frame;
      const input = structuredClone(args[0]), hasTreasureClass = args[1].treasureClasses.has(input.treasureClassId);
      try {
        const result = originals.kill.apply(this, args);
        kills.push({ args, input, hasTreasureClass, ...frame, result, snapshot: structuredClone(result) });
        return result;
      } finally { active = parent; }
    });
    restorers.push(() => { killSpy.mockRestore(); });
    const dropSpy = vi.spyOn(drops, 'rollDrops').mockImplementation(function (this: unknown, ...args: Parameters<typeof drops.rollDrops>) {
      const result = originals.drop.apply(this, args);
      if (!active) issues.push('unscoped treasure-class call');
      else if (active.drops) issues.push('extra treasure-class call');
      else active.drops = { args, result, snapshot: structuredClone(result) };
      return result;
    });
    restorers.push(() => { dropSpy.mockRestore(); });
    const currencySpy = vi.spyOn(currency, 'rollCurrencyDrops').mockImplementation(function (this: unknown, ...args: Parameters<typeof currency.rollCurrencyDrops>) {
      const result = originals.currency.apply(this, args);
      if (!active) issues.push('unscoped independent call');
      else if (active.currency) issues.push('extra independent call');
      else active.currency = { args, result, materials: structuredClone(result.materials) };
      return result;
    });
    restorers.push(() => { currencySpy.mockRestore(); });
    try {
      const value = action();
      if (value !== null && (typeof value === 'object' || typeof value === 'function') && 'then' in value)
        issues.push('asynchronous action is unsupported');
      return { execution: { status: 'returned', value }, kills, issues };
    } catch (error) { return { execution: { status: 'threw', error }, kills, issues }; }
  } finally {
    for (const restore of restorers.reverse()) restore();
    observing = false;
  }
}

type ExpectedKill = Pick<award.KillRewardInput, 'tier' | 'monsterLevel' | 'treasureClassId' | 'act' | 'difficulty'>;
/** Constructed measurement inputs; callers cannot use this type as earned-save authentication. */
export interface MaterialControlContext {
  readonly receipt: object;
  readonly runId: string;
  readonly areaId: string;
  readonly waveIndex: number;
  readonly winner: string | null;
  readonly unsupportedSources: readonly string[];
  readonly expectedKills: readonly ExpectedKill[];
  readonly expectedFindItemKills?: readonly { readonly find: FindItemFind; readonly input: ExpectedKill }[];
}

/** Opt in to successful native searches; ordinary-only callers retain their refusal. */
export function findItemMaterialContext(view: NonNullable<ReturnType<typeof inspectRecordedWaves>['currentPublished']>): MaterialControlContext {
  const context = ordinaryMaterialContext(view), { binding } = view;
  const finds = copyFindItemFinds(binding.findItemFinds ?? []);
  const enemies = findItemBonusEnemies(finds, binding.engineInput,
    binding.recording.outcome.finalEnemyTeam, binding.heroId);
  const run = binding.candidateRun;
  const treasureClassId = run.plan.waves[binding.targetWaveIdx]?.lootTable ?? run.plan.defaultLootTable;
  return { ...context, unsupportedSources: context.unsupportedSources.filter(source => source !== 'find-item'),
    expectedFindItemKills: enemies.map((enemy, index) => {
      const find = finds[index];
      if (!find) throw new Error('Missing validated Find Item find');
      return { find, input: { tier: enemy.tier, monsterLevel: enemy.level, treasureClassId,
        act: run.act, difficulty: binding.replayProfileId ?? 'normal' } };
    }) };
}
/** Capture from the matching native view before advancement replaces it. */
export function ordinaryMaterialContext(view: NonNullable<ReturnType<typeof inspectRecordedWaves>['currentPublished']>): MaterialControlContext {
  const { binding, installation } = view, run = binding.candidateRun, outcome = binding.recording.outcome;
  if (!installation) throw new Error('Missing native payout identity');
  const unsupportedSources = [];
  if (binding.endgameWave !== undefined || binding.origin.kind !== 'area') unsupportedSources.push('endgame-cache');
  if ((binding.findItemFinds?.length ?? 0) > 0) unsupportedSources.push('find-item');
  if (run.plan.questSourceProjection) unsupportedSources.push('quest-projection');
  if (view.phase !== 'published' || binding.publication.recordedEvents !== binding.recording.events ||
    binding.publication.outcome !== outcome) unsupportedSources.push('unmatched-native-binding');
  const treasureClassId = run.plan.waves[binding.targetWaveIdx]?.lootTable ?? run.plan.defaultLootTable;
  return { receipt: installation.settlement.identity, runId: binding.publication.subAreaRunId ?? '',
    areaId: run.plan.subAreaId, waveIndex: binding.targetWaveIdx,
    winner: outcome.finalPlayerTeam.some(unit => unit.id === binding.heroId && unit.life > 0) ? outcome.winner : 'hero-dead',
    unsupportedSources, expectedKills: outcome.finalEnemyTeam.filter(unit => unit.life <= 0 && inferKind(unit) !== 'summon')
      .map(unit => ({ tier: unit.tier, monsterLevel: unit.level, treasureClassId, act: run.act,
        difficulty: binding.replayProfileId ?? 'normal' })) };
}

interface MaterialSettlement {
  readonly context: MaterialControlContext;
  readonly capture: MaterialSourceCapture;
  readonly raw: MaterialLedger;
  readonly before: MaterialLedger;
  readonly after: MaterialLedger;
}
function equal(left: MaterialLedger, right: MaterialLedger): boolean {
  return Object.keys(left).length === Object.keys(right).length &&
    Object.entries(left).every(([id, count]) => right[id] === count);
}
function tcMaterials(observation: DropObservation | null): MaterialLedger {
  let result: MaterialLedger = {};
  for (const row of observation?.snapshot ?? []) {
    if (row.kind !== 'direct' || (row.currency !== 'runes' && row.currency !== 'gems')) continue;
    const kind = row.currency === 'runes' ? 'rune' : 'gem';
    if (!row.itemId || materialCatalog.get(row.itemId)?.kind !== kind) throw new Error('Invalid observed TC material identity');
    result = mergeMaterials(result, { [row.itemId]: row.quantity });
  }
  return result;
}
function errorDetails(error: unknown, depth = 0): { name: string; message: string; cause: unknown } {
  if (depth === 3) return { name: 'truncated', message: 'Cause depth limit', cause: null };
  return error instanceof Error ? { name: error.name, message: error.message,
    cause: error.cause === undefined ? null : errorDetails(error.cause, depth + 1) }
    : { name: 'non-Error', message: typeof error === 'string' ? error : typeof error, cause: null };
}
function observationSnapshot(observation: MaterialSettlement) {
  const { receipt: _receipt, ...context } = observation.context;
  return structuredClone({ context, raw: observation.raw, before: observation.before, after: observation.after,
    issues: observation.capture.issues, execution: observation.capture.execution.status,
    executionError: observation.capture.execution.status === 'threw' ? errorDetails(observation.capture.execution.error) : null,
    kills: observation.capture.kills.map(kill => ({ input: kill.input, drops: kill.drops?.snapshot ?? null,
      independent: kill.currency?.materials ?? null, result: kill.snapshot })) });
}
type ObservationSnapshot = ReturnType<typeof observationSnapshot>;
interface AcceptedSettlement {
  readonly observation: ObservationSnapshot;
  readonly kills: ObservationSnapshot['kills'];
  readonly treasureClass: MaterialLedger;
  readonly independent: MaterialLedger;
  readonly findItem: { readonly treasureClass: MaterialLedger; readonly independent: MaterialLedger;
    readonly total: MaterialLedger };
}
interface SourceReport {
  readonly kind: 'constructed-kill-material-control';
  readonly highRuneEarned: false;
  readonly activeHourAcceptance: false;
  readonly opening: { readonly materials: MaterialLedger; readonly provenance: 'unknown' };
  accepted: AcceptedSettlement[];
  total: MaterialLedger;
  duplicates: number;
  failure: { reason: string; actualDelta: Record<string, number> | null; observation: ObservationSnapshot } | null;
}

/**
 * Atomic, stop-on-first-mismatch accounting for ordinary kills and captured searches.
 * Signed spending/fusion remains in failure diagnostics; it never becomes a faucet.
 */
export function createMaterialSourceJournal(opening: MaterialLedger) {
  let current = mergeMaterials(opening);
  const receipts = new WeakSet(), sources = new WeakSet();
  const report: SourceReport = { kind: 'constructed-kill-material-control', highRuneEarned: false,
    activeHourAcceptance: false, opening: { materials: current, provenance: 'unknown' },
    accepted: [], total: {}, duplicates: 0, failure: null };
  return {
    snapshot: (): SourceReport => structuredClone(report),
    observe(observation: MaterialSettlement): 'accepted' | 'duplicate' | 'stopped' {
      if (report.failure) return 'stopped';
      let actualDelta: Record<string, number> | null = null;
      try {
        const { context, capture } = observation;
        actualDelta = materialDelta(observation.before, observation.after);
        if (!equal(current, observation.before)) throw new Error('Opening inventory drift');
        mergeMaterials(observation.raw);
        if (context.winner !== 'player') throw new Error('Nonwin cannot earn source credit');
        if (context.unsupportedSources.length) throw new Error(`Unsupported sources: ${context.unsupportedSources.join(', ')}`);
        if (capture.execution.status !== 'returned') throw new Error('Observed action threw');
        if (capture.issues.length) throw new Error(`Incomplete source observation: ${capture.issues.join(', ')}`);
        if (receipts.has(context.receipt)) {
          if (capture.kills.length || Object.keys(observation.raw).length || Object.keys(actualDelta).length)
            throw new Error('Duplicate payout contains new rewards or source calls');
          report.duplicates++;
          return 'duplicate';
        }
        if (Object.values(actualDelta).some(count => !Number.isSafeInteger(count) || count < 0))
          throw new Error('Signed or unsafe inventory delta is not a reward');
        const searches = context.expectedFindItemKills ?? [];
        copyFindItemFinds(searches.map(search => search.find));
        if (capture.kills.length !== context.expectedKills.length + searches.length)
          throw new Error('Missing or extra kill/search observations');
        const observedSources = new Set<object>();
        let treasureClass: MaterialLedger = {}, independent: MaterialLedger = {};
        let searchTc: MaterialLedger = {}, searchIndependent: MaterialLedger = {};
        for (const [index, kill] of capture.kills.entries()) {
          const isSearch = index >= context.expectedKills.length;
          const expected = isSearch ? searches[index - context.expectedKills.length]?.input : context.expectedKills[index];
          if (!expected) throw new Error('Missing expected kill/search input');
          if (isSearch && kill.input.firstKillBonus) throw new Error('Find Item cannot receive first-kill bonus');
          if (!Object.entries(expected).every(([key, value]) => Reflect.get(kill.input, key) === value))
            throw new Error('Observed kill differs from native recording');
          if (kill.hasTreasureClass !== Boolean(kill.drops) || !kill.currency) throw new Error('Missing source boundary');
          for (const result of [kill.result, kill.drops?.result, kill.currency.result]) {
            if (!result) continue;
            if (sources.has(result) || observedSources.has(result)) throw new Error('Duplicate source observation');
            observedSources.add(result);
          }
          const { input, args } = kill, cur = kill.currency.args;
          if (cur[0] !== input.monsterLevel || cur[1] !== input.tier || cur[2] !== input.act ||
            cur[3] !== (input.difficulty ?? 'normal') || cur[4] !== input.goldFind || cur[5] !== args[2])
            throw new Error('Independent source arguments drifted');
          if (kill.drops && (kill.drops.args[0].tc.id !== input.treasureClassId ||
            kill.drops.args[0].tier !== input.tier || kill.drops.args[0].monsterLevel !== input.monsterLevel ||
            kill.drops.args[1] !== args[2])) throw new Error('TC source arguments drifted');
          const tc = tcMaterials(kill.drops), secondary = mergeMaterials(kill.currency.materials);
          if (!equal(mergeMaterials(tc, secondary), kill.snapshot.materials)) throw new Error('Per-kill source mismatch');
          if (isSearch) { searchTc = mergeMaterials(searchTc, tc); searchIndependent = mergeMaterials(searchIndependent, secondary); }
          else { treasureClass = mergeMaterials(treasureClass, tc); independent = mergeMaterials(independent, secondary); }
        }
        const findItem = { treasureClass: searchTc, independent: searchIndependent,
          total: mergeMaterials(searchTc, searchIndependent) };
        const total = mergeMaterials(treasureClass, independent, findItem.total);
        if (!equal(total, observation.raw) || !equal(total, actualDelta)) throw new Error('Source/raw/inventory mismatch');
        const cumulative = mergeMaterials(report.total, total), snapshot = observationSnapshot(observation);
        const nextCurrent = mergeMaterials(observation.after);
        report.accepted.push({ observation: snapshot, kills: snapshot.kills, treasureClass, independent, findItem });
        report.total = cumulative; current = nextCurrent;
        receipts.add(context.receipt); for (const result of observedSources) sources.add(result);
        return 'accepted';
      } catch (error) {
        report.failure = { reason: error instanceof Error ? error.message : String(error),
          actualDelta, observation: observationSnapshot(observation) };
        return 'stopped';
      }
    }
  };
}
