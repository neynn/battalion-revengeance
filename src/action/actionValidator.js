import { ACTION_TYPE } from "../enums.js";

export const isClientTurn = function(gameContext, messengerID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { currentActor } = turnManager;

    if(!currentActor) {
        return false;
    }

    return currentActor.clientID === messengerID;
}

export const mpIsPlayerIntentValid = function(gameContext, intent, clientID) {
    const { type, data } = intent;
    
    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: {
            //Does the building at x, y belong to the team?
            return true;
        }
        case ACTION_TYPE.ATTACK: {
            //Does the entity belong to the team?
            return true;
        }
        case ACTION_TYPE.MOVE: {
            //Does the entity belong to the team?
            return true;
        }
        case ACTION_TYPE.END_TURN: {
            //All good.
            return true;
        }
        default: {
            console.error("Faulty action sent!");
            return false;
        }
    }
}
