import { createInterruptIntent, createStartTurnIntent } from "../action/actionHelper.js";
import { INTERRUPT_TYPE } from "../enums.js";

export const beginMatch = function(gameContext) {
    const { actionRouter } = gameContext;

    actionRouter.forceEnqueue(gameContext, createInterruptIntent(INTERRUPT_TYPE.START_GAME, -1));
    actionRouter.forceEnqueue(gameContext, createStartTurnIntent());
}

export const endMatch = function(gameContext) {
    const { actionRouter } = gameContext;

    actionRouter.forceEnqueue(gameContext, createInterruptIntent(INTERRUPT_TYPE.END_GAME, -1)); 
}