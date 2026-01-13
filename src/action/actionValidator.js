import { ACTION_TYPE } from "../enums.js";

export const mpIsPlayerIntentValid = function(gameContext, intent, clientID) {
    if(typeof intent !== "object") {
        return false;
    }

    const { type, data } = intent;

    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: {
            return true;
        }
        case ACTION_TYPE.ATTACK: {
            return true;
        }
        case ACTION_TYPE.MOVE: {
            return true;
        }
        case ACTION_TYPE.END_TURN: {
            return true;
        }
        default: {
            console.error("Faulty action sent!");
            return false;
        }
    }
}
