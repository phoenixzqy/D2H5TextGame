import { describe, expect, it } from 'vitest';
import { FARA, FARA_DOMAIN, hasFaraPrerequisite, hasFaraTalkEligibility, hasFaraTalkProof, validateFaraQuestGraph } from './fara-quest';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';
function fixture() {
  const progress: Record<string, QuestProgressData> = {
    [FARA.quest]: { id: FARA.quest, status: 'completed', objectives: { [FARA.objective]: true }, rewardClaimed: false },
    [FARA.prerequisite.quest]: { id: FARA.prerequisite.quest, status: 'completed', objectives: { 'obj-kill-radament': true }, rewardClaimed: false }
  };
  const receipts: QuestActionReceipts = { [FARA.proof]: true }; return { progress, receipts };
}
describe('finite Fara actual Talk graph', () => {
  it('requires explicit authority and keeps the true receipt after Claim', () => {
    const { progress, receipts } = fixture();
    expect(hasFaraPrerequisite(progress, FARA_DOMAIN)).toBe(true); expect(hasFaraTalkProof(progress, receipts, FARA_DOMAIN)).toBe(true);
    expect(() => { validateFaraQuestGraph(progress, receipts, undefined); }).toThrow('Invalid');
    Reflect.set(progress[FARA.quest] ?? {}, 'rewardClaimed', true);
    expect(hasFaraTalkProof(progress, receipts, FARA_DOMAIN)).toBe(true); expect(hasFaraTalkEligibility(progress, FARA_DOMAIN)).toBe(false);
    expect(() => { validateFaraQuestGraph(progress, {}, undefined); }).not.toThrow();
    expect(hasFaraTalkProof(progress, {}, FARA_DOMAIN)).toBe(false);
  });
  it.each(['missing-side', 'false-talk', 'extra-talk', 'wrong-side-id', 'untracked-main', 'incomplete-main', 'false-main',
    'extra-main', 'receipt-false', 'receipt-number', 'unknown-source', 'claimed-type'] as const)('rejects %s source graphs', fault => {
    const { progress, receipts } = fixture(), side = progress[FARA.quest], main = progress[FARA.prerequisite.quest];
    if (!side || !main) throw new Error('Missing fixture');
    if (fault === 'missing-side') Reflect.deleteProperty(progress, FARA.quest);
    if (fault === 'false-talk') Reflect.set(side.objectives, FARA.objective, false);
    if (fault === 'extra-talk') Reflect.set(side.objectives, 'future', true);
    if (fault === 'wrong-side-id') Reflect.set(side, 'id', 'quests/foreign');
    if (fault === 'untracked-main') Reflect.deleteProperty(progress, FARA.prerequisite.quest);
    if (fault === 'incomplete-main') Reflect.set(main, 'status', 'inProgress');
    if (fault === 'false-main') Reflect.set(main.objectives, 'obj-kill-radament', false);
    if (fault === 'extra-main') Reflect.set(main.objectives, 'future', true);
    if (fault === 'receipt-false') Reflect.set(receipts, FARA.proof, false);
    if (fault === 'receipt-number') Reflect.set(receipts, FARA.proof, 1);
    if (fault === 'unknown-source') Reflect.set(receipts, `${FARA.quest}#future`, true);
    if (fault === 'claimed-type') Reflect.set(side, 'rewardClaimed', 1);
    expect(() => { validateFaraQuestGraph(progress, receipts, FARA_DOMAIN); }).toThrow('Invalid');
    expect(hasFaraTalkProof(progress, receipts, FARA_DOMAIN)).toBe(false);
  });
  it.each(['receipt', 'side', 'main', 'objective', 'main-objective'] as const)('refuses %s descriptors without evaluating getters', field => {
    const { progress, receipts } = fixture(), side = progress[FARA.quest], main = progress[FARA.prerequisite.quest];
    if (!side || !main) throw new Error('Missing fixture');
    const target = field === 'receipt' ? receipts : field === 'objective' ? side.objectives : field === 'main-objective' ? main.objectives : progress;
    const property = field === 'receipt' ? FARA.proof : field === 'objective' ? FARA.objective : field === 'main-objective' ? 'obj-kill-radament' : field === 'side' ? FARA.quest : FARA.prerequisite.quest;
    let reads = 0;
    Object.defineProperty(target, property, { enumerable: true, get() { reads++; return true; } });
    expect(() => { validateFaraQuestGraph(progress, receipts, FARA_DOMAIN); }).toThrow('Invalid'); expect(reads).toBe(0);
  });
  it('does not infer proof from legacy flags, while unclaimed history can explicitly re-Talk', () => {
    const { progress } = fixture(); expect(hasFaraTalkEligibility(progress, FARA_DOMAIN)).toBe(true);
    expect(hasFaraTalkProof(progress, {}, FARA_DOMAIN)).toBe(false);
    const foreign = { ...FARA_DOMAIN, proof: `${FARA.proof}:future` };
    expect(() => { validateFaraQuestGraph(progress, {}, foreign); }).toThrow('domain');
    const objectives = [...FARA_DOMAIN.prerequisite.objectiveIds]; let reads = 0;
    Object.defineProperty(objectives, '0', { enumerable: true, get() { reads++; return 'obj-kill-radament'; } });
    expect(() => { validateFaraQuestGraph(progress, {}, { ...FARA_DOMAIN, prerequisite: { ...FARA_DOMAIN.prerequisite, objectiveIds: objectives } }); }).toThrow('domain');
    expect(reads).toBe(0);
  });
});
