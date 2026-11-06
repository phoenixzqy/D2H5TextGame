import { createChallengeAreaController } from './challenge-area-preparation';
export type { ChallengeAreaAttempt as ActFourAreaAttempt,
  ChallengeWallContinuation as ActFourWallContinuation } from './challenge-area-preparation';

export const actFourPreparationAreas = ['areas/act4-plains-of-despair',
  'areas/act4-river-of-flame', 'areas/act4-chaos-sanctuary'] as const;
const controller = createChallengeAreaController(4, actFourPreparationAreas, 'quests/act3-guardian');
export type ActFourAreaPreparation = ReturnType<typeof controller.createState>;

/** Full challenge preparation around the existing native Act IV quest route. */
export const actFourPreparationTarget = controller.preparationTarget;
export const actFourTrainingSource = controller.trainingSource;
export const createActFourAreaPreparation = controller.createState;
export const resumeActFourAreaPreparation = controller.resume;
export const enterPreparedActFourArea = controller.enterArea;
export const auditActFourAreaPreparation = controller.audit;
