import { createChallengeAreaController } from './challenge-area-preparation';
export type { ChallengeAreaAttempt as ActFiveAreaAttempt,
  ChallengeWallContinuation as ActFiveWallContinuation } from './challenge-area-preparation';

export const actFivePreparationAreas = ['areas/act5-bloody-foothills',
  'areas/act5-frigid-highlands', 'areas/act5-crystalline-passage',
  'areas/act5-ancients-way', 'areas/act5-throne-of-destruction'] as const;
const controller = createChallengeAreaController(5, actFivePreparationAreas, 'quests/act4-terrors-end');
export type ActFiveAreaPreparation = ReturnType<typeof controller.createState>;

/** Full challenge preparation around all native Act V main quests. */
export const actFivePreparationTarget = controller.preparationTarget;
export const actFiveTrainingSource = controller.trainingSource;
export const createActFiveAreaPreparation = controller.createState;
export const createActFivePreparationFromUnpreparedRoute = controller.createFromUnpreparedRoute;
export const resumeActFiveAreaPreparation = controller.resume;
export const enterPreparedActFiveArea = controller.enterArea;
export const auditActFiveAreaPreparation = controller.audit;
