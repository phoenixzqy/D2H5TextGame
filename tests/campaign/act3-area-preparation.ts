import { createChallengeAreaController } from './challenge-area-preparation';
export type { ChallengeAreaAttempt as ActThreeAreaAttempt,
  ChallengeWallContinuation as ActThreeWallContinuation } from './challenge-area-preparation';

export const actThreePreparationAreas = ['areas/act3-great-marsh', 'areas/act3-flayer-jungle',
  'areas/act3-kurast-bazaar', 'areas/act3-travincal', 'areas/act3-durance-of-hate'] as const;
const controller = createChallengeAreaController(3, actThreePreparationAreas, 'quests/act2-seven-tombs');
export type ActThreeAreaPreparation = ReturnType<typeof controller.createState>;

/** Preserve the original Act III mode, evidence kinds, APIs and spent limits. */
export const actThreePreparationTarget = controller.preparationTarget;
export const actThreeTrainingSource = controller.trainingSource;
export const createActThreeAreaPreparation = controller.createState;
export const resumeActThreeAreaPreparation = controller.resume;
export const enterPreparedActThreeArea = controller.enterArea;
export const auditActThreeAreaPreparation = controller.audit;
