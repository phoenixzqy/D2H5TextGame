/**
 * Dialogue loader
 * Loads NPC dialogue definitions
 * @module data/loaders/dialogue
 */

import type { GameData } from '../loader';

export interface DialogueDoc {
  id: string;
  npcId: string;
  greetings: {
    whenFlags?: string[];
    text: string;
    textKey?: string;
  }[];
  services: {
    type: string;
    prompt: string;
    response: string;
    promptKey?: string;
    responseKey?: string;
  }[];
  questBranches?: {
    questId: string;
    stage: string;
    text: string;
    textKey?: string;
  }[];
}

/**
 * Load dialogue for a specific NPC
 * @param npcId - NPC identifier
 * @param gameData - Game data containing dialogues map
 * @returns Dialogue document or undefined if not found
 */
export function loadDialogue(
  npcId: string,
  gameData: GameData
): DialogueDoc | undefined {
  for (const [, doc] of gameData.dialogues) {
    const typedDoc = doc as DialogueDoc;
    if (typedDoc.npcId === npcId) {
      return typedDoc;
    }
  }
  return undefined;
}
